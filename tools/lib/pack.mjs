// Content-pack I/O. Every tool that touches a pack goes through here, so that "atomic
// write" and "safe media path" have exactly one implementation.
//
// See docs/design/content-pipeline.md for the format itself.

import {
  closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, readdirSync,
  renameSync, rmSync, statSync, writeFileSync, writeSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

export const SCHEMA = 1;
export const LANGUAGES = ['vi', 'en'];

/* ------------------------------------------------------------------ atomic write */

let counter = 0;

/**
 * Write a file atomically: into a temp file in the SAME directory (so rename never
 * crosses a filesystem), fsync the file, rename over the target, fsync the directory.
 *
 * The fsyncs are why this is a function and not two lines. Without the directory fsync
 * the rename itself can be lost on power failure even though the data is durable, and
 * the pack would come back missing a word that was reported saved.
 */
export function writeFileAtomic(target, data) {
  const dir = path.dirname(target);
  mkdirSync(dir, { recursive: true });
  counter += 1;
  const tmp = path.join(dir, `.tmp-${process.pid}-${counter}-${path.basename(target)}`);
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
  let fd;
  try {
    fd = openSync(tmp, 'wx', 0o644);
    writeSync(fd, buf, 0, buf.length, 0);
    fsyncSync(fd);
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
  renameSync(tmp, target);
  let dfd;
  try {
    dfd = openSync(dir, 'r');
    fsyncSync(dfd);
  } catch { /* some filesystems refuse to fsync a directory; the rename still happened */ }
  finally { if (dfd !== undefined) closeSync(dfd); }
}

export function writeJsonAtomic(target, obj) {
  writeFileAtomic(target, `${JSON.stringify(obj, null, 2)}\n`);
}

/* ------------------------------------------------------------- media path safety */

/**
 * A pack is untrusted input (development-process.md §4), and a media reference is a
 * string a human or a broken tool wrote. It must be a relative POSIX path under
 * `media/`, with no `..`, no leading slash, no drive letter, no NUL, no backslash.
 * Returns null if acceptable, else the reason.
 */
export function badMediaRef(ref) {
  if (typeof ref !== 'string' || ref === '') return 'must be a non-empty string';
  if (ref.includes('\0')) return 'contains a NUL byte';
  if (ref.includes('\\')) return 'contains a backslash; media paths are POSIX';
  if (path.posix.isAbsolute(ref) || /^[a-zA-Z]:/.test(ref)) return 'must be relative to the pack';
  const parts = ref.split('/');
  if (parts.some((p) => p === '..')) return 'must not contain ".."';
  if (parts.some((p) => p === '.' || p === '')) return 'must not contain empty or "." segments';
  if (!(ref.startsWith('media/img/') || ref.startsWith('media/aud/'))) {
    return 'must start with "media/img/" or "media/aud/"';
  }
  return null;
}

/** Resolve a media ref against a pack root, refusing anything badMediaRef rejects. */
export function resolveMedia(packDir, ref) {
  const bad = badMediaRef(ref);
  if (bad) throw new Error(`unsafe media reference ${JSON.stringify(ref)}: ${bad}`);
  return path.join(packDir, ref);
}

/* ------------------------------------------------------------------ file identity */

export function sha256File(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}
export function sha256Buf(buf) {
  return createHash('sha256').update(buf).digest('hex');
}
/** 16 hex chars = 64 bits. At 10^4 blobs the collision probability is ~2.7e-12. */
export function blobName(buf, ext) {
  return `${sha256Buf(buf).slice(0, 16)}${ext}`;
}

/**
 * Magic-byte sniff. A truncated download and a HTML error page saved as `.jpg` are both
 * real failure modes of the fetch pipeline, and both survive an extension check.
 */
export function sniffType(file) {
  let b;
  try { b = readFileSync(file); } catch { return null; }
  if (b.length < 4) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b.slice(0, 3).toString('latin1') === 'ID3') return 'mp3';
  if (b[0] === 0xff && (b[1] & 0xe0) === 0xe0) return 'mp3'; // bare MPEG frame sync
  if (b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WAVE') return 'wav';
  if (b.slice(0, 4).toString('latin1') === 'OggS') return 'ogg';
  return null;
}
export const EXT_TYPES = {
  '.jpg': ['jpeg'], '.jpeg': ['jpeg'], '.png': ['png'],
  '.mp3': ['mp3'], '.wav': ['wav'], '.m4a': ['mp3'], '.ogg': ['ogg'],
};

/* ---------------------------------------------------------------------- pack I/O */

export const ID_RE = /^[a-z0-9][a-z0-9._-]{0,63}$/;

export function packPaths(packDir) {
  return {
    root: packDir,
    manifest: path.join(packDir, 'pack.json'),
    manifestBak: path.join(packDir, 'pack.json.bak'),
    words: path.join(packDir, 'words'),
    media: path.join(packDir, 'media'),
    img: path.join(packDir, 'media', 'img'),
    aud: path.join(packDir, 'media', 'aud'),
    quarantine: path.join(packDir, 'quarantine'),
    attribution: path.join(packDir, 'ATTRIBUTION.md'),
  };
}

export function ensurePackDirs(packDir) {
  const p = packPaths(packDir);
  for (const d of [p.root, p.words, p.img, p.aud]) mkdirSync(d, { recursive: true });
  return p;
}

/**
 * Read the manifest, falling back to pack.json.bak. The fallback is the whole reason
 * the .bak exists: pack.json is the one file whose loss would strand every word, and a
 * manifest is small, rarely changed and cheap to keep a copy of.
 */
export function readManifest(packDir) {
  const p = packPaths(packDir);
  let firstError = null;
  for (const [file, from] of [[p.manifest, 'pack.json'], [p.manifestBak, 'pack.json.bak']]) {
    if (!existsSync(file)) continue;
    try { return { manifest: JSON.parse(readFileSync(file, 'utf8')), from }; }
    catch (e) { firstError ??= e; }
  }
  // "present but unparseable" and "not there at all" are different faults with
  // different repairs, and collapsing them into null sends the reader looking for a
  // file that is sitting right in front of them.
  if (firstError) throw firstError;
  return null;
}

/** Write the manifest, keeping the previous good copy as pack.json.bak first. */
export function writeManifest(packDir, manifest) {
  const p = packPaths(packDir);
  if (existsSync(p.manifest)) {
    try {
      const prev = readFileSync(p.manifest, 'utf8');
      JSON.parse(prev); // only keep a backup of something that parses
      writeFileAtomic(p.manifestBak, prev);
    } catch { /* the current manifest is already broken; do not overwrite a good .bak */ }
  }
  writeJsonAtomic(p.manifest, manifest);
}

export function listWordFiles(packDir) {
  const dir = packPaths(packDir).words;
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json') && !f.startsWith('.'))
    .sort()
    .map((f) => path.join(dir, f));
}

/**
 * Read every word, keeping parse failures rather than throwing. Callers decide what to
 * do with `bad` — the app quarantines, the validator reports. One unreadable word must
 * never cost the other 46.
 */
export function readWords(packDir) {
  const ok = [];
  const bad = [];
  for (const file of listWordFiles(packDir)) {
    try {
      const word = JSON.parse(readFileSync(file, 'utf8'));
      ok.push({ file, word });
    } catch (e) {
      bad.push({ file, error: e.message });
    }
  }
  return { ok, bad };
}

/**
 * Write one word. The word file is always the LAST write of any operation, so a crash
 * mid-import leaves an unreferenced blob (garbage, swept later) rather than a word
 * pointing at a file that is not there.
 */
export function writeWord(packDir, word) {
  if (!ID_RE.test(word.id ?? '')) throw new Error(`bad word id ${JSON.stringify(word.id)}`);
  writeJsonAtomic(path.join(packPaths(packDir).words, `${word.id}.json`), word);
}

/** Every media file actually on disk, as pack-relative refs. */
export function listMedia(packDir) {
  const p = packPaths(packDir);
  const out = [];
  for (const [dir, prefix] of [[p.img, 'media/img'], [p.aud, 'media/aud']]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (f.startsWith('.')) continue;
      out.push({ ref: `${prefix}/${f}`, abs: path.join(dir, f), bytes: statSync(path.join(dir, f)).size });
    }
  }
  return out;
}

/** Every media reference a word makes, with a path for error messages. */
export function* wordMediaRefs(word) {
  const images = Array.isArray(word.images) ? word.images : [];
  for (let i = 0; i < images.length; i += 1) {
    if (images[i] && typeof images[i] === 'object' && images[i].src != null) {
      yield { ref: images[i].src, at: `images[${i}].src`, kind: 'image', obj: images[i] };
    }
  }
  const audio = word.audio && typeof word.audio === 'object' ? word.audio : {};
  for (const slot of Object.keys(audio)) {
    const a = audio[slot];
    if (a && typeof a === 'object' && a.src != null) {
      yield { ref: a.src, at: `audio.${slot}.src`, kind: 'audio', obj: a };
    }
  }
}

/** Every media reference a tile makes. */
export function* tileMediaRefs(tile, group, idx) {
  const audio = tile && tile.audio && typeof tile.audio === 'object' ? tile.audio : {};
  for (const slot of Object.keys(audio)) {
    const a = audio[slot];
    if (a && typeof a === 'object' && a.src != null) {
      yield { ref: a.src, at: `tiles.${group}[${idx}].audio.${slot}.src`, kind: 'audio', obj: a };
    }
  }
}

export { path, existsSync, readFileSync, mkdirSync, rmSync, statSync, renameSync, writeFileSync };
