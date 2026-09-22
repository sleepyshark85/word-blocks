// The web build's storage layer.
//
// `expo-file-system` is not supported on web — importing it prints a warning and every
// call is a stub — so the web bundle must not reach it at all. Tier 3 runs in a browser
// (`development-process.md` §5) and its job is to prove the *game* plays, not to prove
// the filesystem works, so here the bundled pack is the pack: nothing is copied, nothing
// is written, and a media reference resolves only if it is in the binary.
//
// Everything this module cannot do is Slice 4's editor, which is a native surface.

export const SUPPORTS_LOCAL_PACKS = false;

export function writeFileAtomic() {
  throw new Error('packs are read-only in the web build');
}

export function ensureSeedPack() {
  return false;
}

export function readPack() {
  return { manifest: null, words: [], unreadable: [] };
}

export function hasLocalMedia() {
  return false;
}

export function localMediaUri() {
  return null;
}
