// Loading one language's pack, once, at launch.
//
// This is the only place `resolvePack` is called, and the only place `hasMedia` is
// supplied. `content-pipeline.md` §5: "Resolution happens once, at pack load, not at
// render. Each reference gets one `stat`, and the engine is handed a word whose media
// list contains only files that exist." A renderer can then never be asked to draw a
// missing file, which is how a blank frame gets in front of a four-year-old.

import { resolvePack } from '../engine/index.mjs';
import { BUNDLED_PACKS } from '../../assets/packs';
import { EMOJI } from '../../assets/emoji';
import { seedPackIdFor } from './packIds';
import { SUPPORTS_LOCAL_PACKS, ensureSeedPack, readPack, hasLocalMedia, localMediaUri } from './store';

/** `Billed cap` → `billed-cap`. Must match `scripts/build-emoji.mjs`. */
export function emojiSlug(name) {
  return String(name).normalize('NFC').toLowerCase()
    .replace(/[‘’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * `content-pipeline.md` §5 — the fallback cannot itself go missing, because it is a key
 * into media bundled in the binary rather than a pack reference.
 */
export function emojiSource(name) {
  if (!name) return null;
  return EMOJI[emojiSlug(name)] ?? null;
}

/**
 * Turn one pack-relative reference into something React Native can render or play. A
 * blob his mother added wins over the bundled one, because that is the repair path: drop
 * a better photograph in and it is used.
 */
function makeMediaSource(packId, bundle) {
  return function mediaSource(ref) {
    if (!ref) return null;
    if (SUPPORTS_LOCAL_PACKS) {
      const uri = localMediaUri(packId, ref);
      if (uri) return { uri };
    }
    return bundle.media[ref] ?? null;
  };
}

/**
 * @param {'vi'|'en'} language chosen at launch and never discovered from the data
 * @returns {{ pack, packId, mediaSource }}
 */
export function loadPack(language) {
  const packId = seedPackIdFor(language);
  const bundle = BUNDLED_PACKS[packId];
  if (!bundle) throw new Error(`the ${packId} pack is not in this build`);

  let manifest = bundle.manifest;
  let words = Object.values(bundle.words);
  let unreadable = [];

  if (SUPPORTS_LOCAL_PACKS) {
    try {
      ensureSeedPack(bundle);
      const onDisk = readPack(packId);
      // A documents directory that has been emptied by a restore, a migration or a
      // crash must not take the app down with it: the binary still has the seed pack,
      // and a child with the shipped words is better than a child with a blank screen.
      if (onDisk.manifest) {
        manifest = onDisk.manifest;
        words = onDisk.words;
        unreadable = onDisk.unreadable;
      }
    } catch {
      // Keep the bundled copy. His mother sees the damage in the editor's list.
    }
  }

  const hasMedia = (ref) => (
    Object.prototype.hasOwnProperty.call(bundle.media, ref)
    || (SUPPORTS_LOCAL_PACKS && hasLocalMedia(packId, ref))
  );

  const pack = resolvePack({ language, manifest, words, unreadable, hasMedia });
  return { pack, packId, mediaSource: makeMediaSource(packId, bundle) };
}

/**
 * The chooser's sample word (`acceptance-criteria.md` A2): a tap on a panel speaks `mèo`
 * or `cat` in that language before anything is committed.
 *
 * This is the **one** place the app touches a pack for a language it has not chosen, and
 * `acceptance-criteria.md` R3 names the chooser as the single exemption to the no-mixing
 * rule. It is deliberately not `loadPack`: nothing is resolved, no session is created, no
 * handle is kept — one clip reference is looked up in the bundle and handed back.
 */
export function sampleWordSource(language, wordId) {
  const bundle = BUNDLED_PACKS[seedPackIdFor(language)];
  if (!bundle) return null;
  const file = bundle.words[`${wordId}.json`];
  const ref = file && file.audio && file.audio.word ? file.audio.word.src : null;
  return ref ? bundle.media[ref] ?? null : null;
}
