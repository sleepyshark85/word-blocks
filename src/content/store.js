// Where a pack lives on a device, and how it gets there.
//
// `content-pipeline.md` §4.1: the seed packs ship in the binary and are **copied** to the
// writable documents directory on first launch, guarded by the existence of
// `packs/<id>/pack.json` so a second first-launch is a no-op and can never overwrite her
// edits.
//
// Two deliberate narrowings, both recorded rather than smuggled:
//
//   1. **Only the JSON is copied.** The word files and the manifest are what his mother
//      edits, and they are ~50 KB. The seed *media* stays in the binary: it is
//      content-addressed, immutable and 4 MB, and copying it per install buys nothing
//      the editor needs. A blob she adds herself is written to
//      `packs/<id>/media/…` and found there first, so the two sources compose.
//   2. **There is no `fsync`.** `content-pipeline.md` §4.2 already states this: RN's
//      filesystem exposes none, so the failure mode degrades from *torn file* to *the
//      very last write reverts*, which is the acceptable one.
//
// **Slice 4 moved the write itself out of this file.** Every operation the editor
// performs is in `src/editor/packStore.mjs`, written against the nine-function port
// `packFs()` returns below, so the atomic-write law is executed in Node by
// `test/editor-store.test.mjs` — including with the write killed halfway — rather than
// being a paragraph nobody has ever seen fail. This file is the port's device half and
// nothing else.
//
// The web build has its own copy of this module (`store.web.js`) that serves the bundle
// directly — `expo-file-system` is not supported on web and warns on import, so it must
// not be reachable from a web bundle at all.

import { Directory, File, Paths } from 'expo-file-system';

import { writeAtomic, listWords } from '../editor/packStore.mjs';

export const SUPPORTS_LOCAL_PACKS = true;

function packDir(packId) {
  return new Directory(Paths.document, 'packs', packId);
}

const segments = (rel) => String(rel).split('/').filter(Boolean);

function fileAt(packId, rel) {
  return new File(packDir(packId), ...segments(rel));
}

function dirAt(packId, rel) {
  const parts = segments(rel);
  return parts.length === 0 ? packDir(packId) : new Directory(packDir(packId), ...parts);
}

/**
 * **The port** (`src/editor/packStore.mjs` documents it). Nine functions, every path
 * pack-relative and POSIX, so the module that owns the atomic-write law can be run
 * against a fake filesystem in Node and against this one on the phone, and there is only
 * one copy of the law.
 *
 * Every function that can fail on a damaged filesystem returns a null or an empty list
 * rather than throwing: this is reached from screens, and a throw here is a blank screen
 * in front of a parent.
 */
export function packFs(packId) {
  return {
    exists(rel) {
      try { return fileAt(packId, rel).exists; } catch { return false; }
    },
    readText(rel) {
      try {
        const f = fileAt(packId, rel);
        return f.exists ? f.textSync() : null;
      } catch { return null; }
    },
    writeText(rel, text) {
      const f = fileAt(packId, rel);
      const parent = dirAt(packId, segments(rel).slice(0, -1).join('/'));
      parent.create({ intermediates: true, idempotent: true });
      if (f.exists) f.delete();
      f.create({ intermediates: true, overwrite: true });
      f.write(text);
    },
    list(rel) {
      try {
        const d = dirAt(packId, rel);
        return d.exists ? d.list().map((e) => e.name ?? '').filter(Boolean) : [];
      } catch { return []; }
    },
    remove(rel) {
      try {
        const f = fileAt(packId, rel);
        if (f.exists) f.delete();
      } catch { /* already gone is the outcome the caller wanted */ }
    },
    rename(from, to) {
      const src = fileAt(packId, from);
      const dst = fileAt(packId, to);
      if (dst.exists) dst.delete();
      // The atomic step. Both paths are siblings, so this never crosses a filesystem —
      // which is the only condition under which a rename is atomic at all (§4.2).
      src.move(dst);
    },
    size(rel) {
      try { return fileAt(packId, rel).size ?? 0; } catch { return 0; }
    },
    probeExternal(uri) {
      try {
        const f = new File(uri);
        if (!f.exists) return null;
        // Native md5. Content addressing costs no JavaScript pass over the bytes, which
        // is what makes it affordable for a 2 MB photograph on a phone.
        const hash = f.md5;
        return hash ? { hash, bytes: f.size ?? 0 } : null;
      } catch { return null; }
    },
    adoptExternal(uri, rel) {
      const parent = dirAt(packId, segments(rel).slice(0, -1).join('/'));
      parent.create({ intermediates: true, idempotent: true });
      const dst = fileAt(packId, rel);
      if (dst.exists) dst.delete();
      new File(uri).copy(dst);
    },
  };
}

/**
 * Copy a bundled pack into the documents directory, once. Returns true if it wrote
 * anything, which is only interesting to the tests.
 */
export function ensureSeedPack(bundle) {
  const fs = packFs(bundle.id);
  if (fs.exists('pack.json')) return false;

  // Words first, manifest last: a kill in the middle leaves a directory with no
  // `pack.json`, which is exactly the condition this function tests for, so the next
  // launch redoes the whole copy rather than resuming into a half-copied pack.
  for (const [name, word] of Object.entries(bundle.words)) {
    writeAtomic(fs, `words/${name}`, JSON.stringify(word));
  }
  writeAtomic(fs, 'pack.json', JSON.stringify(bundle.manifest));
  return true;
}

/**
 * Read a pack off disk. Every file is read inside its own `try`: one word file that will
 * not parse costs one word and is reported to his mother, never the pack
 * (`development-process.md` §4, `acceptance-criteria.md` K9).
 */
export function readPack(packId) {
  const fs = packFs(packId);
  let manifest = null;
  try {
    manifest = JSON.parse(fs.readText('pack.json'));
  } catch {
    manifest = null;
  }
  const { words, unreadable } = listWords(fs);
  return {
    manifest,
    words,
    unreadable: unreadable.map((name) => ({ name: `words/${name}`, error: 'could not be read' })),
  };
}

/** Does a media reference she added resolve to a file that is actually there? */
export function hasLocalMedia(packId, ref) {
  return packFs(packId).exists(ref);
}

export function localMediaUri(packId, ref) {
  try {
    const file = fileAt(packId, ref);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}
