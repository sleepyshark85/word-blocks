// The web build's storage layer.
//
// `expo-file-system` is not supported on web — importing it prints a warning and every
// call is a stub — so the web bundle must not reach it at all. Tier 3 runs in a browser
// (`development-process.md` §5).
//
// **Slice 4 changed what this file is for.** It used to serve the bundled pack read-only,
// because there was nothing to write. There is now: the editor is the half of this app
// that a browser can drive most usefully, since its failure modes are text, parsing and
// file bookkeeping rather than anything a phone contributes. So this is the same nine
// function port `store.js` exposes, backed by an in-memory filesystem seeded from the
// bundled pack on first touch.
//
// Two honest limits, both browser-only and neither reaching the device build:
//
//   1. **Nothing survives a reload.** It is memory, not `localStorage`; the atomic-write
//      guarantee is proved in Node against the same `packStore.mjs`, by
//      `test/editor-store.test.mjs`, which kills writes in the middle. A browser cannot
//      add evidence there, so it does not pretend to.
//   2. **A blob is its own URI.** `probeExternal` hashes the URI string rather than the
//      bytes, because a browser cannot hand a synchronous digest of a `blob:` URL back.
//      On the device `File.md5` is a real content hash of the real bytes.

import { BUNDLED_PACKS } from '../../assets/packs';
import { writeAtomic, listWords } from '../editor/packStore.mjs';

export const SUPPORTS_LOCAL_PACKS = true;

/** packId -> Map<relative path, string contents>. */
const DISKS = new Map();

function diskFor(packId) {
  let disk = DISKS.get(packId);
  if (!disk) { disk = new Map(); DISKS.set(packId, disk); }
  return disk;
}

/** FNV-1a over the URI, lower-case hex — a stable name, not a content address. */
function nameHash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${h.toString(16).padStart(8, '0')}${text.length.toString(16).padStart(8, '0')}`;
}

export function packFs(packId) {
  const disk = diskFor(packId);
  return {
    exists: (rel) => disk.has(rel),
    readText: (rel) => (disk.has(rel) ? disk.get(rel) : null),
    writeText: (rel, text) => { disk.set(rel, String(text)); },
    list(rel) {
      const prefix = rel === '' ? '' : `${rel}/`;
      const out = new Set();
      for (const key of disk.keys()) {
        if (!key.startsWith(prefix)) continue;
        const rest = key.slice(prefix.length);
        if (rest.includes('/')) continue;
        out.add(rest);
      }
      return [...out];
    },
    remove: (rel) => { disk.delete(rel); },
    rename(from, to) {
      if (!disk.has(from)) return;
      disk.set(to, disk.get(from));
      disk.delete(from);
    },
    size: (rel) => (disk.has(rel) ? disk.get(rel).length : 0),
    probeExternal: (uri) => (uri ? { hash: nameHash(String(uri)), bytes: 0 } : null),
    adoptExternal(uri, rel) { disk.set(rel, String(uri)); },
  };
}

export function ensureSeedPack(bundle) {
  const fs = packFs(bundle.id);
  if (fs.exists('pack.json')) return false;
  for (const [name, word] of Object.entries(bundle.words)) {
    writeAtomic(fs, `words/${name}`, JSON.stringify(word));
  }
  writeAtomic(fs, 'pack.json', JSON.stringify(bundle.manifest));
  return true;
}

export function readPack(packId) {
  const bundle = BUNDLED_PACKS[packId];
  if (bundle) ensureSeedPack(bundle);
  const fs = packFs(packId);
  let manifest = null;
  try { manifest = JSON.parse(fs.readText('pack.json')); } catch { manifest = null; }
  const { words, unreadable } = listWords(fs);
  return {
    manifest,
    words,
    unreadable: unreadable.map((name) => ({ name: `words/${name}`, error: 'could not be read' })),
  };
}

export function hasLocalMedia(packId, ref) {
  return diskFor(packId).has(ref);
}

/** A blob she picked is stored as its own URL, so the `<img>` resolves in the browser. */
export function localMediaUri(packId, ref) {
  const disk = diskFor(packId);
  return disk.has(ref) ? disk.get(ref) : null;
}
