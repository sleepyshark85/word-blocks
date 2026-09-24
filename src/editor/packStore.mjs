// **Every write she makes, and not one of them partial.**
//
// `CLAUDE.md`: *"Content is hostile input. It is JSON on a phone, edited by a
// non-technical adult. Validate every read; make every write atomic. **Losing her work
// once ends the app.**"* This file is where that sentence is implemented, and it is
// written against a **port** — nine functions, listed below — rather than against
// `expo-file-system`, for one reason: a guarantee about interrupted writes that can only
// be exercised on a phone is a guarantee nobody has ever seen hold. `src/content/
// deviceFs.js` is the port on the device, `test/helpers/memoryFs.mjs` is the port in
// Node, and `test/editor-store.test.mjs` kills a write in the middle of every operation
// here and asserts the previous words survive.
//
// The port. Every path is **pack-relative POSIX** (`words/cho.json`, `media/img/x.jpg`);
// nothing here knows where the pack lives, which is also why it cannot escape it.
//
//   exists(p)             -> boolean
//   readText(p)           -> string | null        — null rather than a throw, always
//   writeText(p, text)    -> void                 — creates parent directories
//   list(dir)             -> string[]             — names only; [] when the dir is absent
//   remove(p)             -> void                 — a no-op when p is not there
//   rename(from, to)      -> void                 — same directory, so it is atomic
//   probeExternal(uri)    -> { hash, bytes } | null
//   adoptExternal(uri, p) -> void                 — copy a file from outside the pack in
//   size(p)               -> number
//
// `content-pipeline.md` §4.2 is the law:
//
//   1. write to a temporary name **in the same directory**, so the rename never crosses a
//      filesystem and never stops being atomic;
//   2. rename over the target;
//   3. **media first, the word file last** — a crash between them leaves an unreferenced
//      blob (garbage, swept by `pack-validate --delete-orphans`), never a word pointing
//      at a file that is not there;
//   4. **one user action touches one word file.** Adding a word does not rewrite the
//      other 49.
//
// There is no `fsync`: React Native exposes none. §4.2 states that plainly rather than
// pretending, and the failure mode degrades from *torn file* to *the very last write
// reverts*, which is the acceptable one.

const WORDS_DIR = 'words';
const TRASH_DIR = '.trash';
const MANIFEST = 'pack.json';
const MANIFEST_BAK = 'pack.json.bak';

/** `content-pipeline.md` §13.4 / AC L3 — Recently deleted holds a word for 30 days. */
export const TRASH_DAYS = 30;

/**
 * A counter rather than a clock, because a clock in a module that has to be replayable is
 * how a determinism guarantee dies quietly. It only has to make two temporary names in
 * one process differ; the rename is what makes the write atomic.
 */
let tmpSeq = 0;

function dirOf(rel) {
  const at = rel.lastIndexOf('/');
  return at < 0 ? '' : rel.slice(0, at);
}

function baseOf(rel) {
  const at = rel.lastIndexOf('/');
  return at < 0 ? rel : rel.slice(at + 1);
}

/**
 * **The one write.** Temporary sibling, then rename. Nothing else in the app may call
 * `fs.writeText` on a path that is not a temporary — `test/editor-store.test.mjs` greps
 * for it.
 */
export function writeAtomic(fs, rel, text) {
  tmpSeq += 1;
  const tmp = `${dirOf(rel)}/.tmp-${tmpSeq}-${baseOf(rel)}`;
  fs.writeText(tmp, text);
  fs.rename(tmp, rel);
}

export function writeJsonAtomic(fs, rel, value) {
  writeAtomic(fs, rel, `${JSON.stringify(value, null, 2)}\n`);
}

/**
 * **Every read is a read of untrusted data.** A file that will not parse costs that one
 * file and never the pack (`acceptance-criteria.md` K9): this returns null and the caller
 * lists it as unreadable.
 */
export function readJson(fs, rel) {
  const text = fs.readText(rel);
  if (typeof text !== 'string') return null;
  try {
    const value = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

const isWordFile = (name) => name.endsWith('.json') && !name.startsWith('.');

/* --------------------------------------------------------------------- the words */

/**
 * Every word file, parsed, plus the names of the ones that would not parse. This is the
 * editor's own listing rather than `pack.catalogue`, because the editor needs the **raw**
 * entry — her pictures, her recording, the decomposition she confirmed — and the resolved
 * pack deliberately carries only what the child's board needs.
 */
export function listWords(fs) {
  const words = [];
  const unreadable = [];
  for (const name of fs.list(WORDS_DIR).filter(isWordFile).sort()) {
    const rel = `${WORDS_DIR}/${name}`;
    const value = readJson(fs, rel);
    if (value === null || typeof value.id !== 'string' || value.id === '') unreadable.push(name);
    else words.push(value);
  }
  return { words, unreadable };
}

export function getWord(fs, id) {
  return readJson(fs, `${WORDS_DIR}/${id}.json`);
}

/** `acceptance-criteria.md` J10 — one file, one atomic write. */
export function putWord(fs, word) {
  writeJsonAtomic(fs, `${WORDS_DIR}/${word.id}.json`, word);
}

/* ------------------------------------------------------------ delete and recover */

/**
 * `content-pipeline.md` §4.3 — delete **moves to `.trash/`** rather than unlinking, so
 * undo is free and she will mis-tap (L1, L2, L3).
 *
 * **The order is the whole of L5.** The trash entry is written first and the live word
 * removed second, so a kill in the middle leaves the word *fully present* with a trash
 * entry beside it — never half-written, and never gone. `sweepTrash` below is what makes
 * the leftover harmless: a trash entry whose word is still live is dropped, because the
 * delete did not complete.
 */
export function deleteWord(fs, id, deletedAt) {
  const rel = `${WORDS_DIR}/${id}.json`;
  const word = readJson(fs, rel);
  if (word === null) return false;
  writeJsonAtomic(fs, `${TRASH_DIR}/${id}.json`, { deletedAt, word });
  fs.remove(rel);
  return true;
}

/**
 * Recently deleted, newest first. An entry is **ignored while its word is still live**,
 * which is the interrupted-delete case above, and an entry that will not parse is simply
 * not offered rather than being an error she cannot act on.
 */
export function listTrash(fs, nowMs) {
  const out = [];
  for (const name of fs.list(TRASH_DIR).filter(isWordFile)) {
    const id = name.slice(0, -'.json'.length);
    if (fs.exists(`${WORDS_DIR}/${id}.json`)) continue;
    const entry = readJson(fs, `${TRASH_DIR}/${name}`);
    if (!entry || !entry.word || typeof entry.word !== 'object') continue;
    const deletedAt = Number.isFinite(entry.deletedAt) ? entry.deletedAt : nowMs;
    out.push({ id, deletedAt, word: entry.word, expiresInDays: daysLeft(deletedAt, nowMs) });
  }
  out.sort((a, b) => b.deletedAt - a.deletedAt);
  return out;
}

function daysLeft(deletedAt, nowMs) {
  const elapsed = (nowMs - deletedAt) / 86400000;
  return Math.max(0, Math.ceil(TRASH_DAYS - elapsed));
}

/** L2 / L3 — one tap, and the word comes back **exactly** as it was. */
export function restoreWord(fs, id) {
  const entry = readJson(fs, `${TRASH_DIR}/${id}.json`);
  if (!entry || !entry.word || typeof entry.word !== 'object') return false;
  putWord(fs, entry.word);
  fs.remove(`${TRASH_DIR}/${id}.json`);
  return true;
}

/**
 * Housekeeping, run at editor open: drop the entries whose delete was interrupted (the
 * word is live again) and the ones older than 30 days. Nothing here can lose a live
 * word — it only ever removes files under `.trash/`.
 */
export function sweepTrash(fs, nowMs) {
  let removed = 0;
  for (const name of fs.list(TRASH_DIR).filter(isWordFile)) {
    const id = name.slice(0, -'.json'.length);
    const entry = readJson(fs, `${TRASH_DIR}/${name}`);
    const stale = fs.exists(`${WORDS_DIR}/${id}.json`);
    const expired = entry && Number.isFinite(entry.deletedAt)
      && nowMs - entry.deletedAt > TRASH_DAYS * 86400000;
    if (stale || expired || entry === null) { fs.remove(`${TRASH_DIR}/${name}`); removed += 1; }
  }
  return removed;
}

/* ---------------------------------------------------------------------- the media */

const EXT = { jpeg: '.jpg', jpg: '.jpg', png: '.png', m4a: '.m4a', mp3: '.mp3', mp4: '.m4a' };

/** `media/img/…` or `media/aud/…`, and nothing else can be named (`tools/lib/pack.mjs`). */
function mediaRef(kind, hash, ext) {
  return `media/${kind === 'aud' ? 'aud' : 'img'}/${hash}${ext}`;
}

/**
 * Copy one file she chose — a photograph, a recording — into the pack, **content
 * addressed**, and hand back the reference.
 *
 * Content addressing is not decoration here. It is what makes step 3 of §4.2 true: a
 * blob that was half copied has the wrong name and is inert, and a second import of the
 * same photograph costs nothing. `expo-file-system` exposes `File.md5` natively, so the
 * hash costs no JavaScript pass over the bytes.
 *
 * Returns null rather than throwing when the source has gone: the picker handed back a
 * URI and the OS may have already cleaned the temporary file up, and a screen that throws
 * is a blank screen in front of a parent.
 */
export function importMedia(fs, uri, kind, extHint) {
  const probe = fs.probeExternal(uri);
  if (!probe || typeof probe.hash !== 'string' || probe.hash === '') return null;
  const ext = EXT[String(extHint ?? '').toLowerCase().replace(/^\./, '')]
    ?? (kind === 'aud' ? '.m4a' : '.jpg');
  const ref = mediaRef(kind, probe.hash.toLowerCase().slice(0, 16), ext);
  if (!fs.exists(ref)) {
    tmpSeq += 1;
    const tmp = `${dirOf(ref)}/.tmp-${tmpSeq}-${baseOf(ref)}`;
    fs.adoptExternal(uri, tmp);
    fs.rename(tmp, ref);
  }
  return { src: ref, bytes: probe.bytes ?? fs.size(ref) };
}

/* -------------------------------------------------------------------- the manifest */

/**
 * `content-pipeline.md` §6 — **`pack.json.bak` is written before every manifest change,
 * and only from a manifest that parses**, so a broken current manifest can never
 * overwrite a good backup.
 */
export function writeManifest(fs, manifest) {
  const current = readJson(fs, MANIFEST);
  if (current !== null) writeJsonAtomic(fs, MANIFEST_BAK, current);
  const next = { ...manifest, revision: (Number.isInteger(manifest.revision) ? manifest.revision : 0) + 1 };
  writeJsonAtomic(fs, MANIFEST, next);
  return next;
}

/**
 * The manifest, with the backup as the fallback — §6's table, exactly: *"`pack.json` will
 * not parse → fall back to `pack.json.bak`"*.
 */
export function readManifest(fs) {
  return readJson(fs, MANIFEST) ?? readJson(fs, MANIFEST_BAK);
}
