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
// The web build has its own copy of this module (`store.web.js`) that serves the bundle
// directly — `expo-file-system` is not supported on web and warns on import, so it must
// not be reachable from a web bundle at all.

import { Directory, File, Paths } from 'expo-file-system';

export const SUPPORTS_LOCAL_PACKS = true;

function packDir(packId) {
  return new Directory(Paths.document, 'packs', packId);
}

/**
 * `content-pipeline.md` §4.2 — write to a temporary name in the same directory, then
 * rename over the target. The rename is the atomic step; it must not cross a filesystem,
 * which is why the temporary file is a sibling and not in a cache directory.
 */
export function writeFileAtomic(dir, name, text) {
  const tmp = new File(dir, `.tmp-${Date.now()}-${name}`);
  if (tmp.exists) tmp.delete();
  tmp.create({ intermediates: true, overwrite: true });
  tmp.write(text);
  const target = new File(dir, name);
  if (target.exists) target.delete();
  tmp.move(target);
}

/**
 * Copy a bundled pack into the documents directory, once. Returns true if it wrote
 * anything, which is only interesting to the tests.
 */
export function ensureSeedPack(bundle) {
  const dir = packDir(bundle.id);
  const manifest = new File(dir, 'pack.json');
  if (manifest.exists) return false;

  dir.create({ intermediates: true, idempotent: true });
  const words = new Directory(dir, 'words');
  words.create({ intermediates: true, idempotent: true });

  // Words first, manifest last: a kill in the middle leaves a directory with no
  // `pack.json`, which is exactly the condition this function tests for, so the next
  // launch redoes the whole copy rather than resuming into a half-copied pack.
  for (const [name, word] of Object.entries(bundle.words)) {
    writeFileAtomic(words, name, JSON.stringify(word));
  }
  writeFileAtomic(dir, 'pack.json', JSON.stringify(bundle.manifest));
  return true;
}

/**
 * Read a pack off disk. Every file is read inside its own `try`: one word file that will
 * not parse costs one word and is reported to his mother, never the pack
 * (`development-process.md` §4, `acceptance-criteria.md` K9).
 */
export function readPack(packId) {
  const dir = packDir(packId);
  let manifest = null;
  try {
    manifest = JSON.parse(new File(dir, 'pack.json').textSync());
  } catch {
    manifest = null;
  }

  const words = [];
  const unreadable = [];
  const wordsDir = new Directory(dir, 'words');
  let entries = [];
  try {
    entries = wordsDir.exists ? wordsDir.list() : [];
  } catch {
    entries = [];
  }
  for (const entry of entries) {
    const name = entry.name ?? '';
    if (!name.endsWith('.json') || name.startsWith('.')) continue;
    try {
      words.push(JSON.parse(entry.textSync()));
    } catch (error) {
      unreadable.push({ name: `words/${name}`, error: String(error && error.message) });
    }
  }
  return { manifest, words, unreadable };
}

/** Does a media reference she added resolve to a file that is actually there? */
export function hasLocalMedia(packId, ref) {
  try {
    return new File(packDir(packId), ref).exists;
  } catch {
    return false;
  }
}

export function localMediaUri(packId, ref) {
  try {
    const file = new File(packDir(packId), ref);
    return file.exists ? file.uri : null;
  } catch {
    return null;
  }
}
