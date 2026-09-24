// A filesystem that can be killed in the middle of a write.
//
// `src/editor/packStore.mjs` is written against a nine-function port precisely so that
// this can exist: the guarantee `CLAUDE.md` calls the primary requirement — *"Losing her
// work once ends the app"* — is a guarantee about what survives an **interrupted** write,
// and a guarantee nobody has ever seen hold is not a guarantee.
//
// The two ways a write dies, and they are different:
//
//   `partial`      the process stops **inside** `writeText`, with half the bytes on disk.
//                  The temporary file is torn; the target has not been touched.
//   `beforeRename` the temporary file is complete and the process stops before the
//                  rename. The target still holds the previous version.
//
// Both are real on a phone — the OS kills the app when she switches away mid-save — and
// both must leave the previous word intact. A third, `afterRename`, is the successful
// case and is what the undo/trash ordering is tested against (L5).

export function createMemoryFs(seed = {}) {
  const files = new Map(Object.entries(seed));
  const log = [];
  let fault = null;

  const check = (op, path) => {
    if (!fault) return;
    if (fault.op !== op) return;
    if (fault.match && !path.includes(fault.match)) return;
    fault.hits = (fault.hits ?? 0) + 1;
    if (fault.after !== undefined && fault.hits <= fault.after) return;
    const error = new Error(`simulated kill during ${op} on ${path}`);
    error.simulated = true;
    throw error;
  };

  return {
    /** Everything on this disk, for an assertion. */
    dump: () => new Map(files),
    log,
    /**
     * Arm a kill. `{ op: 'writeText'|'rename'|'remove', match?, after? }` — `after` lets a
     * test survive the first n calls and die on the next, which is how a *second* save is
     * killed while the first is on disk.
     */
    kill(spec) { fault = spec ? { ...spec } : null; },

    exists: (p) => files.has(p),
    readText: (p) => (files.has(p) ? files.get(p) : null),
    writeText(p, text) {
      log.push(['writeText', p]);
      const value = String(text);
      // A torn write leaves a prefix of the bytes behind, which is exactly what a JSON
      // parser will refuse — and refusing it is the behaviour under test.
      check('writeText', p);
      files.set(p, value);
    },
    /** The torn variant: half the bytes land, then the process dies. */
    tearNextWrite(match) { fault = { op: 'tear', match }; },
    list(dir) {
      const prefix = dir === '' ? '' : `${dir}/`;
      const out = new Set();
      for (const key of files.keys()) {
        if (!key.startsWith(prefix)) continue;
        const rest = key.slice(prefix.length);
        if (rest.includes('/')) continue;
        out.add(rest);
      }
      return [...out];
    },
    remove(p) {
      log.push(['remove', p]);
      check('remove', p);
      files.delete(p);
    },
    rename(from, to) {
      log.push(['rename', from, to]);
      check('rename', from);
      if (!files.has(from)) return;
      files.set(to, files.get(from));
      files.delete(from);
    },
    size: (p) => (files.has(p) ? files.get(p).length : 0),
    probeExternal(uri) {
      if (!uri || !EXTERNAL.has(uri)) return null;
      const { bytes, hash } = EXTERNAL.get(uri);
      return { hash, bytes };
    },
    adoptExternal(uri, p) {
      log.push(['adoptExternal', uri, p]);
      check('adoptExternal', p);
      files.set(p, EXTERNAL.get(uri).body);
    },
  };
}

/** Files that exist outside the pack — what a camera or a recorder hands back. */
export const EXTERNAL = new Map();

export function putExternal(uri, body, hash) {
  EXTERNAL.set(uri, { body, bytes: body.length, hash });
  return uri;
}

/**
 * A torn write: `writeText` lands half the bytes and then throws. It is a separate entry
 * point rather than a `kill` mode because the *content* is what matters — an all-or-
 * nothing failure proves less than a file that parses as far as `{"id":"ca`.
 */
export function tearingFs(inner, match) {
  const write = inner.writeText.bind(inner);
  let armed = true;
  return {
    ...inner,
    writeText(p, text) {
      if (armed && p.includes(match)) {
        armed = false;
        write(p, String(text).slice(0, Math.max(1, Math.floor(String(text).length / 2))));
        const error = new Error(`simulated kill halfway through writing ${p}`);
        error.simulated = true;
        throw error;
      }
      write(p, text);
    },
  };
}
