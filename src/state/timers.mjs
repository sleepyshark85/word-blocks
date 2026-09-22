// Every timer in this game, in one place, with a name.
//
// `development-process.md` §3 gives the React layer one job it must not get wrong: it
// **owns every timer, with explicit cleanup on unmount and on reset.** The failure this
// prevents is the one wildlife-shuffle shipped — a timer that outlives the round it
// belonged to and fires into a board that no longer exists, or fires twice under
// StrictMode's double-mount.
//
// A bag rather than a pile of `setTimeout` calls, because:
//   - naming a timer makes it replaceable: setting `idle` twice cancels the first, so a
//     re-entrant schedule cannot leak;
//   - `clearAll()` is one call, and it is what both `useEffect` cleanup and a language
//     switch need;
//   - a test can assert the bag is empty, which is the only honest way to know.

export function createTimerBag() {
  const timers = new Map();

  return {
    /** Schedule `fn` under `name`, replacing anything already scheduled under it. */
    set(name, fn, ms) {
      this.clear(name);
      const id = setTimeout(() => {
        timers.delete(name);
        fn();
      }, Math.max(0, ms));
      timers.set(name, id);
    },

    clear(name) {
      if (!timers.has(name)) return;
      clearTimeout(timers.get(name));
      timers.delete(name);
    },

    clearAll() {
      for (const name of [...timers.keys()]) this.clear(name);
    },

    has(name) {
      return timers.has(name);
    },

    /** The names still pending. Used by tests, and by nothing else. */
    pending() {
      return [...timers.keys()].sort();
    },

    size() {
      return timers.size;
    },
  };
}
