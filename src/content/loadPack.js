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
 * Everything `resolvePack` needs for one language, read once: the manifest on disk (or
 * the bundled one), the raw word files, and the media probe.
 *
 * It is separate from `loadPack` because **the editor's preview step needs to resolve a
 * pack that is not the one on disk** (`acceptance-criteria.md` J9: *a fully playable
 * board with her word live in the real table*) and building a second reader for that
 * would be a second thing that could disagree with the first about what a pack is.
 *
 * @param {'vi'|'en'} language chosen at launch and never discovered from the data
 */
export function packInputs(language) {
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

  return { packId, manifest, words, unreadable, hasMedia, mediaSource: makeMediaSource(packId, bundle) };
}

/**
 * @param {'vi'|'en'} language
 * @returns {{ pack, packId, mediaSource }}
 */
export function loadPack(language) {
  const { packId, manifest, words, unreadable, hasMedia, mediaSource } = packInputs(language);
  const pack = resolvePack({ language, manifest, words, unreadable, hasMedia });
  return { pack, packId, mediaSource };
}

/**
 * **The chooser's language-name clip — `acceptance-criteria.md` A2 (restated in revision
 * 6), E23, Y31–Y34.** A tap on a panel speaks **the language's own name** — `Tiếng Việt`
 * or `English` — before anything is committed.
 *
 * It used to speak a sample word, `mèo` / `cat`. The owner: *"for `mèo`, it should
 * probably be `Tiếng Việt` and `English` then"*, and he is right for a reason worth
 * writing down: **a sample word identifies a language only to someone who already knows
 * that word and has connected it to a language.** Now that the child chooses for himself
 * (`ui.md` §9.4a) this is the only channel that tells him what he is picking.
 *
 * This is the **one** place the app touches a pack for a language it has not chosen, and
 * `acceptance-criteria.md` R3 names the chooser as the single exemption to the no-mixing
 * rule. It is deliberately not `loadPack`: nothing is resolved, no session is created, no
 * handle is kept — one manifest reference is looked up in the bundle and handed back.
 *
 * **Neither clip exists yet.** They are the content-engineer's (E23), they are *speech*,
 * and the owner has to hear them before they ship (Y34). **Y33 is what this function is
 * built to satisfy:** a missing clip is a warning and not an error, the pack stays valid,
 * and the chooser **degrades silently** — `null` here means the panel expands and says
 * nothing (A2a). A pack must not become unloadable because one chooser clip is absent.
 */
export function languageNameSource(language) {
  const bundle = BUNDLED_PACKS[seedPackIdFor(language)];
  if (!bundle) return null;
  const manifest = bundle.manifest;
  const clip = manifest && manifest.languageName;
  const ref = clip && typeof clip === 'object' && typeof clip.src === 'string' ? clip.src : null;
  return ref ? bundle.media[ref] ?? null : null;
}
