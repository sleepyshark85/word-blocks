// A headless rig for the state layer: a fake clock, a fake timer bag and a fake audio
// engine, so `src/state/gameController.js` can be driven in Node with no renderer.
//
// `development-process.md` §5 — "anything that must be checkable off-device imports
// nothing that only runs on-device". The controller imports the engine, `timers.js` and
// the motion table, and nothing else; that is what makes this possible, and this rig is
// what proves it.

/** A timer bag with the same surface as `createTimerBag`, driven by `clock.advance`. */
export function createFakeClock() {
  let nowMs = 0;
  let seq = 0;
  const scheduled = new Map(); // name -> { at, fn, everyMs }

  const timers = {
    set(name, fn, ms) {
      scheduled.set(name, { at: nowMs + Math.max(0, ms), fn, everyMs: null, seq: seq++ });
    },
    every(name, fn, ms) {
      scheduled.set(name, { at: nowMs + Math.max(1, ms), fn, everyMs: Math.max(1, ms), seq: seq++ });
    },
    clear(name) { scheduled.delete(name); },
    clearAll() { scheduled.clear(); },
    has(name) { return scheduled.has(name); },
    pending() { return [...scheduled.keys()].sort(); },
    size() { return scheduled.size; },
  };

  return {
    timers,
    now: () => nowMs,
    /** Run every timer due within `ms`, in due order, exactly as a real loop would. */
    advance(ms) {
      const until = nowMs + ms;
      for (;;) {
        let next = null;
        let nextName = null;
        for (const [name, entry] of scheduled) {
          if (entry.at > until) continue;
          if (!next || entry.at < next.at || (entry.at === next.at && entry.seq < next.seq)) {
            next = entry;
            nextName = name;
          }
        }
        if (!next) break;
        nowMs = next.at;
        if (next.everyMs === null) scheduled.delete(nextName);
        else scheduled.set(nextName, { ...next, at: nowMs + next.everyMs });
        next.fn();
      }
      nowMs = until;
    },
  };
}

/** An audio engine that records rather than plays. */
export function createFakeAudio() {
  const log = [];
  let prepared = [];
  let muted = false;
  let disposed = false;
  let speaking = null;
  return {
    log,
    prepared: () => prepared,
    isDisposed: () => disposed,
    // The same surface as `src/audio/engine.js`, method for method: a double with extra
    // methods is a double that can drift from the thing it stands in for.
    prepare(sources) { prepared = sources.slice(); },
    // One SPEECH channel, and the double records the cut so a test can assert it
    // (`ui.md` §11.2, AC N3/N3a): a new speech request stops the one before it.
    playSpeech(source) {
      if (speaking !== null) log.push({ ch: 'cut', source: speaking });
      speaking = source;
      log.push({ ch: 'speech', source, muted });
      return muted ? 0 : 1;
    },
    playMotif(source) {
      // F19 — the motif STOPS speech before it starts. The double must do it too, or a
      // test of the cut rule would be testing the double rather than the engine.
      if (speaking !== null) { log.push({ ch: 'cut', source: speaking }); speaking = null; }
      log.push({ ch: 'motif', source, muted });
      return muted ? 0 : 1;
    },
    playCheer(source) { log.push({ ch: 'cheer', source, muted }); return muted ? 0 : 1; },
    playUi(source, db = 0) { log.push({ ch: 'ui', source, db, muted }); return muted ? 0 : 1; },
    stopAll() { speaking = null; log.push({ ch: 'stopAll' }); },
    cancelFade() {},
    fadeOut(ms, done) { log.push({ ch: 'fadeOut', ms }); if (done) done(); },
    setMuted(v) { muted = Boolean(v); },
    setRate() {},
    dispose() { disposed = true; },
    /** Everything played since the last call, oldest first. */
    drain() { return log.splice(0, log.length); },
  };
}

/** Media refs are opaque to the controller; the identity function is enough. */
export const identityMedia = (ref) => (ref === null || ref === undefined ? null : `src:${ref}`);
