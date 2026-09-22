// The two audio channels.
//
// `ui.md` §11.2: "One channel for tile sounds. A new tap **stops the previous clip
// immediately**. No queue, no overlap. A queue means his sixth tap plays six seconds
// later, which reads as broken." And: "The chant owns a second channel and cannot be
// interrupted by tile taps."
//
// Latency (§11.1, `acceptance-criteria.md` N1): a tile's sound must begin within 60 ms of
// touch-**down**. That is bought by holding a decoded player per clip for the round's
// palette, created during the previous celebration (N11), so a tap is a `seekTo(0)` and a
// `play()` rather than a decode.
//
// This is a plain object rather than a hook because it owns native handles, and
// `acceptance-criteria.md` R6 says every handle from the previous language is released
// before a new one is opened. `dispose()` is the whole of that promise, and
// `useAudio.js` is what guarantees it is called.

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

/**
 * `ui.md` §11.3, "Silent switch": the game speaks even when the ringer switch is
 * silenced, because a parent's phone lives on silent and a silent word game is a broken
 * word game (`acceptance-criteria.md` N9).
 */
export async function configureAudioSession() {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
    });
  } catch {
    // An audio session that will not configure is not a reason to refuse to draw a
    // round. `acceptance-criteria.md` T15 and N10 both require the game to be completable
    // with no sound at all.
  }
}

/** A stable key for a source, so the same clip is never decoded twice in one round. */
function keyOf(source) {
  if (source == null) return null;
  if (typeof source === 'number') return `m${source}`;
  if (typeof source === 'string') return source;
  if (typeof source === 'object' && typeof source.uri === 'string') return source.uri;
  return null;
}

export function createAudioEngine() {
  /** @type {Map<string, {player: object, source: any}>} */
  const pool = new Map();
  let current = { tile: null, speech: null };
  let muted = false;
  let rate = 1;
  let disposed = false;
  let fadeTimer = null;

  function acquire(source) {
    const key = keyOf(source);
    if (key === null) return null;
    let entry = pool.get(key);
    if (!entry) {
      try {
        entry = { player: createAudioPlayer(source), source };
      } catch {
        return null;
      }
      pool.set(key, entry);
    }
    return entry;
  }

  function stopKey(key) {
    if (key === null) return;
    const entry = pool.get(key);
    if (!entry) return;
    try {
      entry.player.pause();
      entry.player.seekTo(0);
    } catch { /* a player torn down under us is already stopped */ }
  }

  function start(channel, source) {
    if (disposed) return 0;
    stopKey(current[channel]);
    current[channel] = null;
    if (muted || source == null) return 0;
    const entry = acquire(source);
    if (!entry) return 0;
    try {
      entry.player.seekTo(0);
      entry.player.volume = 1;
      entry.player.setPlaybackRate(rate, 'high');
      entry.player.play();
      current[channel] = keyOf(source);
    } catch {
      return 0;
    }
    return 1;
  }

  return {
    /**
     * `acceptance-criteria.md` N11 — every clip for the round's palette is decoded and
     * resident before the round starts, loaded during the previous celebration. Anything
     * not in the new list is released, which is also how an hour of play does not grow
     * without bound (T16).
     */
    prepare(sources) {
      if (disposed) return;
      const wanted = new Set();
      for (const s of sources) {
        const key = keyOf(s);
        if (key === null) continue;
        wanted.add(key);
        acquire(s);
      }
      for (const [key, entry] of [...pool.entries()]) {
        if (wanted.has(key)) continue;
        if (key === current.tile || key === current.speech) continue;
        try { entry.player.remove(); } catch { /* already gone */ }
        pool.delete(key);
      }
    },

    /** Channel A. `acceptance-criteria.md` N3: the previous clip stops immediately. */
    playTile(source) {
      return start('tile', source);
    },

    /** Channel B — the chant, the word, the read-back. Tile taps never touch it (N8). */
    playSpeech(source) {
      return start('speech', source);
    },

    stopAll() {
      stopKey(current.tile);
      stopKey(current.speech);
      current = { tile: null, speech: null };
    },

    /** The fade is the one timer this module owns; it is cleared here and on dispose. */
    cancelFade() {
      if (fadeTimer !== null) { clearInterval(fadeTimer); fadeTimer = null; }
    },

    /**
     * `gameplay.md` §6.7 — Finish session fades the audio over 800 ms rather than cutting
     * it. Stepped rather than animated: `Animated` drives transform and opacity only
     * (`acceptance-criteria.md` O1), and a volume is neither.
     */
    fadeOut(ms, onDone) {
      this.cancelFade();
      const steps = 8;
      let i = 0;
      fadeTimer = setInterval(() => {
        i += 1;
        const v = Math.max(0, 1 - i / steps);
        for (const key of [current.tile, current.speech]) {
          const entry = key === null ? null : pool.get(key);
          if (entry) { try { entry.player.volume = v; } catch { /* gone */ } }
        }
        if (i >= steps) {
          this.cancelFade();
          this.stopAll();
          for (const entry of pool.values()) { try { entry.player.volume = 1; } catch { /* gone */ } }
          if (onDone) onDone();
        }
      }, Math.max(1, Math.round(ms / steps)));
    },

    /** `acceptance-criteria.md` N10 — mute silences the game; the hint ladder still runs. */
    setMuted(next) {
      muted = Boolean(next);
      if (muted) this.stopAll();
    },

    /** `gameplay.md` §7.3 — playback rate 0.8x / 1.0x. */
    setRate(next) {
      rate = Number.isFinite(next) && next > 0 ? next : 1;
    },

    /** `acceptance-criteria.md` R6 — every handle released before a new one is opened. */
    dispose() {
      disposed = true;
      this.cancelFade();
      for (const entry of pool.values()) {
        try { entry.player.remove(); } catch { /* already gone */ }
      }
      pool.clear();
      current = { tile: null, speech: null };
    },
  };
}
