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

/**
 * **The ceiling on native players, and where the number comes from.**
 *
 * A player here is one `expo-audio` `AudioPlayer`, which on iOS is one `AVPlayer` plus a
 * live `AVPlayerItem`, a periodic time observer and a KVO subscription
 * (`node_modules/expo-audio/ios/AudioPlayer.swift`). Those are **process** resources, not
 * per-object ones: AVFoundation allocates a playback pipeline per ready item and refuses
 * once the process has too many. The old code held one player per clip for the whole
 * table — **100 for `vi-seed`, 121 for `en-seed`** — and on the owner's iPhone every
 * construction after the chooser's failed, silently, so the game went mute the moment a
 * pack loaded. Chromium survives it, which is why no browser run ever saw it.
 *
 * **24**, derived from what the app must be able to play *without waiting*, on the device
 * that failed:
 *
 * | | |
 * |---|---|
 * | the touch-immediate UI sounds, pinned | 6, + her cheer if she recorded one = **7** |
 * | the tap clips of the visible page, the owner's phone plan | **14** (`vi-seed`; 13 for `en-seed`) |
 * | the undo's clip — what would be left (E8) | **1** |
 * | *resident warm set* | *22* |
 * | spare, for the announcement's blend, word and sentence | **2** |
 * | | **24** |
 *
 * On a one-page tablet the whole table is visible and the reachable set is larger — 33 tap
 * clips for `vi-seed` — so the warm set is truncated. The priority order is what makes 24
 * the right truncation there too: 7 pinned + **all 17 live** `vi-seed` tap clips is exactly
 * 24, so every tile that leads to a word is warm on every target device, and only a flat
 * tile beyond the budget can cost a construction.
 *
 * It is a judgement and not a measurement: nobody on this team has an iPhone, and the
 * only number anyone has measured is the one that fails. So the ceiling **lowers itself**
 * — every construction that throws drops it a step (`recordFailure`) — and every failure
 * is counted and shown on the About screen, so the next device report is evidence rather
 * than "still silent".
 */
export const MAX_PLAYERS = 24;

/** The ceiling never drops below this: one per channel, plus the seat click and a tile. */
export const PLAYER_FLOOR = 8;

/**
 * The process-wide budget. It is an object rather than a module global so a test can make
 * its own, but `audio/engine.js` makes exactly one: the chooser's engine and the game's
 * engine draw on the same iOS resource and must be counted together (the chooser's player
 * is the one clip that still worked on the owner's phone, precisely because it was made
 * before the pack's hundred).
 */
export function createPlayerBudget(max = MAX_PLAYERS) {
  /** @type {Set<{evictOne: () => boolean}>} */
  const pools = new Set();
  const budget = {
    max,
    live: 0,
    created: 0,
    evicted: 0,
    /** Constructions that threw. On iOS this is the resource exhaustion, reported. */
    failed: 0,
    /** Requests that were asked to make a sound and could not. N11a. */
    silenced: 0,
    /** How many times the ceiling lowered itself after a failure. */
    shrinks: 0,
    lastError: null,

    join(pool) {
      pools.add(pool);
      return () => pools.delete(pool);
    },

    /** Room for one more player: the asking pool's own LRU first, then everyone else's. */
    makeRoom(self) {
      while (budget.live >= budget.max) {
        if (self && self.evictOne()) continue;
        let freed = false;
        for (const pool of pools) {
          if (pool === self) continue;
          if (pool.evictOne()) { freed = true; break; }
        }
        if (!freed) return false;
      }
      return true;
    },

    /**
     * **A construction that threw is the ceiling telling us it is lower than 24.** The
     * old code caught this and returned `null`, which is why finding it needed a device.
     * Here it is counted, remembered, and *acted on*: the ceiling drops a step, the pools
     * are asked to give players back, and the caller retries once at the lower ceiling.
     * An app that recovers into a quieter mode is worth more than one that is silent.
     */
    recordFailure(error, self) {
      budget.failed += 1;
      budget.lastError = String((error && error.message) || error || 'unknown');
      const next = Math.max(PLAYER_FLOOR, Math.min(budget.max - 4, budget.live - 1));
      if (next < budget.max) {
        budget.max = next;
        budget.shrinks += 1;
      }
      while (budget.live > budget.max) {
        if (self && self.evictOne()) continue;
        let freed = false;
        for (const pool of pools) {
          if (pool === self) continue;
          if (pool.evictOne()) { freed = true; break; }
        }
        if (!freed) break;
      }
    },

    /** What the About screen shows the owner (`acceptance-criteria.md` N11a, E10a). */
    stats() {
      return {
        live: budget.live,
        max: budget.max,
        created: budget.created,
        evicted: budget.evicted,
        failed: budget.failed,
        silenced: budget.silenced,
        shrinks: budget.shrinks,
        lastError: budget.lastError,
      };
    },
  };
  return budget;
}

export function createChannels({ createPlayer, budget = createPlayerBudget() }) {
  /** @type {Map<string, {player: object, source: any, pinned: boolean, used: number, warmedAt: number}>} */
  const pool = new Map();
  // One slot per channel. `cheer` is the second half of channel 3: it layers over the
  // motif deliberately (it is her voice, and that is the point), so it needs a player of
  // its own rather than a channel of its own.
  let current = { speech: null, motif: null, cheer: null, ui: null };
  let muted = false;
  let rate = 1;
  let disposed = false;
  let fadeTimer = null;
  let clock = 0;
  /** Non-zero only inside `prepare`, so one warm pass cannot evict its own clips. */
  let warming = 0;

  function drop(key, entry) {
    try { entry.player.remove(); } catch { /* already gone */ }
    pool.delete(key);
    budget.live -= 1;
  }

  /** The least-recently-used player this pool can give back, or false if it has none. */
  const self = {
    evictOne() {
      let victimKey = null;
      let victim = null;
      for (const [key, entry] of pool) {
        if (entry.pinned) continue;
        if (warming !== 0 && entry.warmedAt === warming) continue;
        if (Object.values(current).includes(key)) continue;
        if (victim === null || entry.used < victim.used) { victimKey = key; victim = entry; }
      }
      if (victim === null) return false;
      drop(victimKey, victim);
      budget.evicted += 1;
      return true;
    },
  };
  const leave = budget.join(self);

  /**
   * A player for this source, from the pool or newly built, **or `null` — and a `null`
   * is now counted rather than swallowed** (N11a).
   */
  function acquire(source, pin = false) {
    const key = keyOf(source);
    if (key === null) return null;
    const held = pool.get(key);
    if (held) {
      held.used = ++clock;
      held.warmedAt = warming;
      if (pin) held.pinned = true;
      return held;
    }
    if (!budget.makeRoom(self)) return null;
    let player = null;
    try {
      player = createPlayer(source);
    } catch (error) {
      // The ceiling is lower than we thought. Drop it, hand players back, try once more.
      budget.recordFailure(error, self);
      try {
        player = createPlayer(source);
      } catch (retry) {
        budget.recordFailure(retry, self);
        return null;
      }
    }
    const entry = { player, source, pinned: pin, used: ++clock, warmedAt: warming };
    pool.set(key, entry);
    budget.live += 1;
    budget.created += 1;
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
    // **N11a — a request that makes no sound is counted.** This is the exact line that
    // hid the iPhone failure: it used to be `return 0` and nothing else.
    if (!entry) { budget.silenced += 1; return 0; }
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
    } catch (error) {
      budget.silenced += 1;
      budget.lastError = String((error && error.message) || error || 'play failed');
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
     * `acceptance-criteria.md` **N11 (BOUNDED)** — the **bounded** warm set. `sources`
     * is what the current board state can ask for, in priority order; `pin` is the
     * touch-immediate UI, which is never evicted. Everything reachable is held up to the
     * budget and no further, and anything beyond it is built on demand and released by
     * LRU (T19: an hour of play cannot grow the pool past `MAX_PLAYERS`).
     *
     * The pre-correction N11 — *every* clip the constant table can produce — is what made the
     * app silent on an iPhone: 100 players for `vi-seed`, 121 for `en-seed`.
     */
    prepare(sources, { pin = [] } = {}) {
      if (disposed) return;
      warming = ++clock;
      try {
        for (const s of pin) acquire(s, true);
        for (const s of sources) {
          // `null` here means the budget is full of this pass's own clips, or a player
          // would not build: either way there is nothing to gain from asking again.
          if (!acquire(s, false)) break;
        }
      } finally {
        warming = 0;
      }
    },

    /** What the parent menu shows: the bound, the pool, and every failure (N11a). */
    stats() {
      return { ...budget.stats(), pool: pool.size };
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
      for (const [key, entry] of [...pool.entries()]) drop(key, entry);
      pool.clear();
      leave();
      current = { speech: null, motif: null, cheer: null, ui: null };
    },
  };
}
