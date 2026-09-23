// **The three audio channels, and the cut rule** — platform-free, so the one rule
// `ui.md` §11.2 says "cannot be implemented two ways" is checkable in Node.
//
// | # | Channel | Carries | May overlap? |
// |---|---------|---------|--------------|
// | 1 | **SPEECH** | every clip containing a voice: tile clips, every chant beat, the blend, the tone name, the whole word, the reveal repeat, the parts hint | **never two at once** |
// | 2 | **UI** | the seat click, the flat-tile knock, the undo unclick, the page sound, the shelf bell | yes, over speech |
// | 3 | **MOTIF** | the announcement motif, and the cheer layered on it | over UI — but never over speech, **because it stops speech first** |
//
// **The cut rule, exactly:**
//
//   > A clip on the SPEECH channel is cut **if and only if** a new SPEECH clip is
//   > requested, or the announcement motif fires. Nothing else cuts it — not a knock, not
//   > a click, not an animation, not a state change, not a timer.
//   >
//   > The cut is **synchronous and happens before the new clip starts**, in the same
//   > call: `pause()` then `seekTo(0)` on the outgoing player, then `seekTo(0)` + `play()`
//   > on the incoming one. No fade, no crossfade, no duck, no queue. **The newest request
//   > always wins** — a queue would play his sixth tap six seconds late (N3, N3a, N3d).
//
// Revision 2 had a separate `tile` channel beside `speech`, which meant a tile clip and a
// chant beat could sound together. That is half of what "voices seem to be mixed up with
// each other" was, and the channel is gone: **tile clips are speech.**
//
// **Why this file exists at all.** `engine.js` imports `expo-audio` and therefore cannot
// be loaded in Node, so for two revisions the cut rule was only ever exercised through a
// test double — and a double that implements the rule itself proves nothing about the
// engine. Removing the motif's stop from the real engine left the suite green
// (`development-process.md` §5: never trust a green check you have not seen fail). The
// player is injected here instead, and `test/audio-channels.test.mjs` drives the real
// logic with a recording player.

/** A stable key for a source, so the same clip is never decoded twice in one round. */
function keyOf(source) {
  if (source == null) return null;
  if (typeof source === 'number') return `m${source}`;
  if (typeof source === 'string') return source;
  if (typeof source === 'object' && typeof source.uri === 'string') return source.uri;
  return null;
}

export function createChannels({ createPlayer }) {
  /** @type {Map<string, {player: object, source: any}>} */
  const pool = new Map();
  // One slot per channel. `cheer` is the second half of channel 3: it layers over the
  // motif deliberately (it is her voice, and that is the point), so it needs a player of
  // its own rather than a channel of its own.
  let current = { speech: null, motif: null, cheer: null, ui: null };
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
        entry = { player: createPlayer(source), source };
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

  function start(channel, source, { volume = 1, rate: clipRate = rate } = {}) {
    if (disposed) return 0;
    stopKey(current[channel]);
    current[channel] = null;
    if (muted || source == null) return 0;
    const entry = acquire(source);
    if (!entry) return 0;
    try {
      entry.player.seekTo(0);
      entry.player.volume = volume;
      entry.player.setPlaybackRate(clipRate, 'high');
      // **The cut rule makes `play()` racy on purpose**: the hard cut above pauses a
      // player whose previous `play()` may not have settled. That is not an error — it is
      // the newest tap winning, which is exactly N3d — but where the platform hands back
      // a promise it rejects, and an unhandled rejection is noise in a console and, worse,
      // a thing a future reader would try to "fix" by adding a queue.
      //
      // `expo-audio`'s **web** shim calls `media.play()` and returns nothing
      // (`AudioModule.web.js:139`), so the rejection surfaces there and cannot be caught
      // from here; the browser logs one line per cut and nothing else happens. The native
      // players have no promise at all. This guard is for any adapter that does return
      // one, and it is two lines at the one boundary where a stray rejection would be
      // mistaken for a real audio fault.
      const started = entry.player.play();
      if (started && typeof started.catch === 'function') started.catch(() => {});
      current[channel] = keyOf(source);
    } catch {
      return 0;
    }
    return 1;
  }

  /** `ui.md` §11.3 — the knock is −9 dB. Decibels, because that is what the spec says. */
  function gain(db) {
    return Math.max(0, Math.min(1, 10 ** (db / 20)));
  }

  return {
    /**
     * `acceptance-criteria.md` N11 (RESTATED) — every clip the **constant table** can
     * produce is decoded and resident before the first tap is possible. The table never
     * changes, so this runs once at pack load. Anything not in the list is released,
     * which is also how an hour of play does not grow without bound (T19).
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
        if (Object.values(current).includes(key)) continue;
        try { entry.player.remove(); } catch { /* already gone */ }
        pool.delete(key);
      }
    },

    /**
     * **Channel 1 — SPEECH, and everything with a voice in it is on it** (N3a): tile
     * clips, every chant beat, the blend, the tone name, the whole word, the reveal
     * repeat and the parts hint. A new request cuts the old one synchronously, and the
     * newest always wins (N3, N3d).
     */
    playSpeech(source) {
      return start('speech', source);
    },

    /**
     * `ui.md` §11.4 — the announcement motif owns its own channel and cannot be
     * interrupted by a tile tap. It plays at its recorded level, **never rate-shifted**:
     * the parent's 0.8x speech setting is about words, and a slowed motif is a different
     * tune (`acceptance-criteria.md` F18 — byte-identical in both modes).
     */
    playMotif(source) {
      // **F19, RESTATED: the motif STOPS speech; it does not duck it.** Ducking to −18 dB
      // was the specification that guaranteed two voices at the loudest moment in the app
      // (`ui.md` §11.0 item 2). The stop is synchronous and happens first.
      stopKey(current.speech);
      current.speech = null;
      return start('motif', source, { rate: 1 });
    },

    /** `gameplay.md` §5.2 — her voice, layered over the motif at t = 0, at −3 dBFS. */
    playCheer(source) {
      return start('cheer', source, { volume: gain(-3), rate: 1 });
    },

    /**
     * **Channel 2 — UI.** The seat click, the flat-tile knock, the undo unclick, the page
     * sound, the shelf bell. Its own channel, so none of them ever cuts a speech clip
     * (N3b), and **no asset on it may contain a voice** (N3c).
     */
    playUi(source, db = 0) {
      return start('ui', source, { volume: gain(db), rate: 1 });
    },

    /**
     * Every channel, stopped hard and at once. This is what a **language switch** uses
     * (A15): not the 800 ms fade, which would play the outgoing language's voice over the
     * incoming language's board.
     */
    stopAll() {
      for (const key of Object.values(current)) stopKey(key);
      current = { speech: null, motif: null, cheer: null, ui: null };
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
        for (const key of Object.values(current)) {
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
      current = { speech: null, motif: null, cheer: null, ui: null };
    },
  };
}
