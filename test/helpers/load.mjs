// Reading a pack off the disk, for tests only.
//
// The engine is pure and knows nothing about a filesystem: `resolvePack` is handed the
// parsed manifest, the parsed words and a `hasMedia(ref)` probe. That split is
// deliberate — it is what lets the whole engine run under `node --test` with no
// renderer, and what will let Slice 3 supply `expo-file-system` instead of this.
//
// The I/O itself goes through `tools/lib/pack.mjs`, which is the only reader of the pack
// format in this repository. A second reader could disagree with the validator about
// what a pack is, and then the validator would be passing something the app cannot open.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readManifest, readWords, listMedia, packPaths } from '../../tools/lib/pack.mjs';
import { resolvePack } from '../../src/engine/index.mjs';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function packDir(id) {
  return path.join(REPO, 'packs', id);
}

/** Everything `resolvePack` needs, read through the tools' own pack reader. */
export function readPackInputs(dir) {
  const manifestRead = (() => {
    try { return readManifest(dir); } catch { return null; }
  })();
  const { ok, bad } = readWords(dir);
  const media = new Set(listMedia(dir).map((m) => m.ref));
  return {
    manifest: manifestRead ? manifestRead.manifest : null,
    words: ok.map((o) => o.word),
    unreadable: bad.map((b) => ({ name: path.basename(b.file), error: b.error })),
    hasMedia: (ref) => media.has(ref),
  };
}

export function loadPack(id, language, overrides = {}) {
  const dir = packDir(id);
  if (!existsSync(packPaths(dir).manifest)) throw new Error(`no pack at ${dir}`);
  return resolvePack({ language, ...readPackInputs(dir), ...overrides });
}

export const viPack = () => loadPack('vi-seed', 'vi');
export const enPack = () => loadPack('en-seed', 'en');

/** Read one raw word file, for tests that need to corrupt it. */
export function rawWord(id, wordId) {
  return JSON.parse(readFileSync(path.join(packDir(id), 'words', `${wordId}.json`), 'utf8'));
}

export function rawManifest(id) {
  return JSON.parse(readFileSync(path.join(packDir(id), 'pack.json'), 'utf8'));
}
