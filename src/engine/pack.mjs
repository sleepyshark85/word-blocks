// Turning a directory full of JSON that a non-technical adult edits into something the
// round generator can trust.
//
// `development-process.md` §4: every read of the pack is a read of untrusted data. Three
// properties this module exists to hold:
//
//   1. **It never throws on bad content.** A stray comma, a missing rime, a photograph
//      somebody deleted — each costs one word, and the app runs with the rest
//      (`acceptance-criteria.md` K9). The only thing that throws is a caller error, such
//      as asking for the English pack and handing it the Vietnamese manifest.
//   2. **Media is resolved once, here, not at render** (`content-pipeline.md` §5). The
//      engine is handed words whose media list contains only files that exist, so a
//      renderer can never be asked to draw a missing file. Existence is asked of an
//      injected `hasMedia(ref)`, which is how a pure module can know about a filesystem
//      without importing one.
//   3. **The language is a parameter, not a field to be discovered.** Nothing here falls
//      back to the other pack, defaults to it, or coalesces onto it
//      (`acceptance-criteria.md` R4).
//
// The child never sees a failure and his mother always does: every withheld word appears
// in `catalogue` with a machine code and a reason, which is what the editor renders
// (`acceptance-criteria.md` K8, J2).

import { nfc, isNonEmptyString } from './text.mjs';
import {
  viCheckSpellingRule, viLegalTones, viHomophoneSets,
  enPositionOf, enSlotIsLegal, EN_HOMOPHONE_SETS,
} from './rules.mjs';

/** The highest `pack.json.schema` this build understands (`content-pipeline.md` §7). */
export const SCHEMA_SUPPORTED = 1;

export const LANGUAGES = ['vi', 'en'];

/** The tile groups each language's manifest must carry, and no others. */
const TILE_GROUPS = { vi: ['onset', 'rime', 'tone'], en: ['letter'] };

function issue(level, where, code, message) {
  return { level, where, code, message };
}

function reason(code, message) {
  return { code, message };
}

/* ------------------------------------------------------------------ audio slots */

/**
 * `ui.md` §13.5 E4: the UI needs a `long` and a `short` slot in both languages, even
 * where they point at the same file today, so that adopting the `"mờ, mèo"` sound-plus-
 * word form later is a content change with no code change. Vietnamese tiles ship one
 * clip under `audio.name`; it fills both slots.
 */
function resolveTileAudio(raw, hasMedia) {
  const a = raw && typeof raw === 'object' ? raw : {};
  const keep = (clip) => {
    if (!clip || typeof clip !== 'object' || !isNonEmptyString(clip.src)) return null;
    return hasMedia(clip.src) ? { src: clip.src, ms: Number.isFinite(clip.ms) ? clip.ms : null } : null;
  };
  const name = keep(a.name);
  const long = keep(a.long) ?? name;
  const short = keep(a.short) ?? name ?? long;
  return { long, short, silent: long === null && short === null };
}

function resolveWordAudio(raw, hasMedia) {
  const a = raw && typeof raw === 'object' ? raw : {};
  const keep = (clip) => {
    if (!clip || typeof clip !== 'object' || !isNonEmptyString(clip.src)) return null;
    return hasMedia(clip.src) ? { src: clip.src, ms: Number.isFinite(clip.ms) ? clip.ms : null } : null;
  };
  return { word: keep(a.word), blend: keep(a.blend), sentence: keep(a.sentence) };
}

/* ---------------------------------------------------------------------- tiles */

function resolveViTiles(manifest, hasMedia, issues) {
  const onset = [];
  const rime = [];
  const tone = [];
  const groups = manifest.tiles && typeof manifest.tiles === 'object' ? manifest.tiles : {};

  for (const raw of Array.isArray(groups.onset) ? groups.onset : []) {
    if (!raw || !isNonEmptyString(raw.id)) continue;
    onset.push({
      id: raw.id,
      role: 'onset',
      glyph: nfc(isNonEmptyString(raw.glyph) ? raw.glyph : raw.id),
      label: nfc(isNonEmptyString(raw.label) ? raw.label : raw.id),
      audio: resolveTileAudio(raw.audio, hasMedia),
    });
  }

  for (const raw of Array.isArray(groups.rime) ? groups.rime : []) {
    if (!raw || !isNonEmptyString(raw.id)) continue;
    const id = nfc(raw.id);
    const declared = Array.isArray(raw.legalTones) ? raw.legalTones : [];
    const byRule = viLegalTones(id);
    const stored = raw.toned && typeof raw.toned === 'object' ? raw.toned : {};
    // Three-way intersection. The pack may claim a tone is legal; the rule may allow it;
    // but if the composed spelling is not stored there is nothing to draw on the tile,
    // and `literacy-vi.md` §5.4 forbids composing one here.
    const toned = {};
    const legalTones = [];
    for (const t of byRule) {
      const form = nfc(stored[t]);
      if (!declared.includes(t)) continue;
      if (!isNonEmptyString(form)) continue;
      toned[t] = form;
      legalTones.push(t);
    }
    if (legalTones.length === 0) {
      issues.push(issue('error', `tiles.rime[${id}]`, 'rimeHasNoToneForms',
        `rime "${id}" has no usable toned spellings, so no word using it can be played`));
      continue;
    }
    rime.push({
      id,
      role: 'rime',
      glyph: nfc(isNonEmptyString(raw.glyph) ? raw.glyph : id),
      legalTones,
      toned,
      audio: resolveTileAudio(raw.audio, hasMedia),
    });
  }

  for (const raw of Array.isArray(groups.tone) ? groups.tone : []) {
    if (!raw || !isNonEmptyString(raw.id)) continue;
    tone.push({
      id: raw.id,
      role: 'tone',
      // `glyph` is deliberately absent: a tone tile renders the *seated rime* with this
      // tone's stored spelling (`literacy-vi.md` §5.4), never a floating diacritic.
      label: nfc(isNonEmptyString(raw.label) ? raw.label : raw.id),
      audio: resolveTileAudio(raw.audio, hasMedia),
    });
  }

  return { onset, rime, tone };
}

function resolveEnTiles(manifest, hasMedia, issues) {
  const letter = [];
  const groups = manifest.tiles && typeof manifest.tiles === 'object' ? manifest.tiles : {};
  for (const raw of Array.isArray(groups.letter) ? groups.letter : []) {
    if (!raw || !isNonEmptyString(raw.id)) continue;
    const kind = raw.kind === 'vowel' || raw.kind === 'consonant' || raw.kind === 'digraph'
      ? raw.kind
      : 'consonant';
    letter.push({
      id: raw.id,
      role: 'letter',
      glyph: nfc(isNonEmptyString(raw.glyph) ? raw.glyph : raw.id),
      kind,
      // `literacy-en.md` §5.2 groups `sh`/`ck` as digraphs; the board colours by vowel
      // vs consonant (`ui.md` §5.6), so a digraph is a consonant for role purposes
      // unless it is a vowel digraph, which v1 excludes (§3.5).
      isVowel: kind === 'vowel',
      position: enPositionOf(raw.id, raw.position),
      audio: resolveTileAudio(raw.audio, hasMedia),
    });
  }
  if (letter.length === 0) {
    issues.push(issue('error', 'tiles.letter', 'noTiles', 'the manifest carries no letter tiles'));
  }
  return { letter };
}

/* ---------------------------------------------------------------------- words */

/**
 * Shared shape and language-boundary checks. Returns a reason to withhold, or null.
 * `acceptance-criteria.md` R8/R9: a word entry carrying the other language's field or
 * the other language's decomposition shape is rejected, and the app still runs.
 */
function checkWordShell(raw, language) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return reason('badShape', 'this entry is not a word object');
  }
  if (!isNonEmptyString(raw.id)) {
    return reason('noId', 'this entry has no id');
  }
  if (!isNonEmptyString(raw.text)) {
    return reason('noText', 'this word has no spelling');
  }
  if ('language' in raw) {
    return reason('languageField',
      'a word must not carry a language field — the pack decides the language (content-pipeline.md §1)');
  }
  const foreign = language === 'vi' ? 'tiles' : 'syllables';
  if (foreign in raw && raw[foreign] != null) {
    return reason('wrongDecomposition',
      `this word is written in the other language's shape ("${foreign}")`);
  }
  return null;
}

function resolveViDecomposition(raw, tileById) {
  const syllables = raw.syllables;
  if (!Array.isArray(syllables) || syllables.length === 0) {
    return { error: reason('noDecomposition', 'this word has not been broken into parts yet') };
  }
  if (syllables.length > 1) {
    // `literacy-vi.md` §1.1 — the v1 machine builds exactly one syllable. The array is
    // stored from day one so `máy bay` is later two instances of the same machine
    // rather than a migration on a live pack on her phone.
    return { error: reason('twoSyllables', 'this word has more than one syllable, which this version cannot build yet') };
  }
  const s = syllables[0];
  if (!s || typeof s !== 'object') {
    return { error: reason('noDecomposition', 'this word has not been broken into parts yet') };
  }
  const onset = s.onset == null || s.onset === '' ? null : nfc(s.onset);
  const rime = nfc(s.rime);
  const tone = s.tone;

  if (onset !== null && !tileById.onset[onset]) {
    return { error: reason('unknownOnset', `the first part "${onset}" is not one this pack knows`) };
  }
  if (!isNonEmptyString(rime) || !tileById.rime[rime]) {
    return { error: reason('unknownRime', `the rime "${isNonEmptyString(rime) ? rime : '?'}" is not one this pack knows`) };
  }
  if (!isNonEmptyString(tone) || !tileById.tone[tone]) {
    return { error: reason('unknownTone', `the tone "${isNonEmptyString(tone) ? tone : '?'}" is not one this pack knows`) };
  }
  if (!tileById.rime[rime].legalTones.includes(tone)) {
    // `literacy-vi.md` §5.2 — a rime ending p/t/c/ch carries only sắc or nặng.
    return { error: reason('illegalTone', `"${rime}" cannot take that tone`) };
  }
  const spelling = viCheckSpellingRule(onset, rime);
  if (spelling) {
    return { error: reason('illegalSpelling', spelling) };
  }
  return { syllables: [{ onset, rime, tone }] };
}

function resolveEnDecomposition(raw, tileById) {
  const tiles = raw.tiles;
  if (!Array.isArray(tiles) || tiles.length === 0) {
    return { error: reason('noDecomposition', 'this word has not been broken into parts yet') };
  }
  const out = [];
  for (const t of tiles) {
    if (!isNonEmptyString(t) || !tileById.letter[t]) {
      return { error: reason('unknownTile', `the part "${isNonEmptyString(t) ? t : '?'}" is not one this pack knows`) };
    }
    out.push(t);
  }
  // `content-pipeline.md` §3.3: English concatenates exactly. This is a comparison of
  // stored strings, not a composition — the Vietnamese ban on composing a spelling
  // (`literacy-vi.md` §1.2) exists because Vietnamese concatenation is *not* string
  // concatenation, and English's is.
  if (out.join('') !== nfc(raw.text)) {
    return { error: reason('spellingMismatch', `the parts spell "${out.join('')}", not "${nfc(raw.text)}"`) };
  }
  for (let i = 0; i < out.length; i += 1) {
    const tile = tileById.letter[out[i]];
    if (!enSlotIsLegal(tile.position, i, out.length)) {
      return { error: reason('badPosition', `"${out[i]}" cannot sit in position ${i + 1} of a word`) };
    }
  }
  return { tiles: out };
}

/**
 * `content-pipeline.md` §5 — the degradation table, implemented exactly.
 * Returns `{ art }` or `{ error }`.
 */
function resolveArt(raw, hasMedia) {
  const images = [];
  const rawImages = Array.isArray(raw.images) ? raw.images : [];
  for (const img of rawImages) {
    if (!img || typeof img !== 'object' || !isNonEmptyString(img.src)) continue;
    if (!hasMedia(img.src)) continue; // a survivor list; a deleted file is simply gone
    images.push({ src: img.src });
  }
  const fallbackEmoji = isNonEmptyString(raw.fallbackEmoji) ? raw.fallbackEmoji : null;
  if (images.length === 0 && fallbackEmoji === null) {
    return { error: reason('noPicture', 'this word needs a picture') };
  }
  const audio = resolveWordAudio(raw.audio, hasMedia);
  if (audio.word === null) {
    // The chant's final step is the payoff; without it there is no round worth having.
    return { error: reason('noWordAudio', 'this word needs a recording of the word') };
  }
  return { art: { images, fallbackEmoji, audio } };
}

/* ------------------------------------------------------------------ the pack */

function keyOfVi(syllable) {
  return `${syllable.onset ?? ''}\u0000${syllable.rime}\u0000${syllable.tone}`;
}
function keyOfEn(tiles) {
  return tiles.join('\u0000');
}

/**
 * Resolve one language's pack.
 *
 * @param {object}   input
 * @param {'vi'|'en'} input.language   chosen at launch; never discovered from the data
 * @param {object}   input.manifest    parsed `pack.json`, or null if it would not parse
 * @param {object[]} input.words       parsed `words/*.json`, in any order
 * @param {object[]} [input.unreadable] `{ name, error }` for files that would not parse
 * @param {(ref:string)=>boolean} [input.hasMedia] does this pack-relative file exist?
 */
export function resolvePack({ language, manifest, words = [], unreadable = [], hasMedia = () => true }) {
  if (!LANGUAGES.includes(language)) {
    throw new Error(`resolvePack: unknown language ${JSON.stringify(language)}`);
  }
  const issues = [];

  for (const u of unreadable) {
    issues.push(issue('error', u && u.name ? String(u.name) : 'words/?', 'unreadable',
      'this word file could not be read'));
  }

  const m = manifest && typeof manifest === 'object' && !Array.isArray(manifest) ? manifest : null;
  if (!m) {
    issues.push(issue('error', 'pack.json', 'noManifest', 'the pack manifest could not be read'));
  }

  // The leak defence, at the door. A pack whose manifest says it is the other language
  // is a caller error — Slice 3 opens exactly one pack directory and passes the language
  // it opened — so it throws rather than degrading. Degrading here would be a fallback
  // onto the other language, which is the thing `acceptance-criteria.md` R4 forbids.
  if (m && m.language != null && m.language !== language) {
    throw new Error(
      `resolvePack: asked for "${language}" but the manifest says "${m.language}". The languages never mix.`,
    );
  }

  const schema = m && Number.isInteger(m.schema) ? m.schema : SCHEMA_SUPPORTED;
  const readOnly = schema > SCHEMA_SUPPORTED;
  if (readOnly) {
    issues.push(issue('warning', 'pack.json', 'newerSchema',
      'this pack was made by a newer version of the app; it is open for reading only'));
  }

  // A foreign tile group in the manifest is the other half of the same leak defence.
  if (m && m.tiles && typeof m.tiles === 'object') {
    const allowed = TILE_GROUPS[language];
    for (const g of Object.keys(m.tiles)) {
      if (!allowed.includes(g)) {
        issues.push(issue('error', `tiles.${g}`, 'foreignTileGroup',
          `"${g}" is not a tile group of this language; it was ignored`));
      }
    }
  }

  const tiles = language === 'vi'
    ? resolveViTiles(m ?? {}, hasMedia, issues)
    : resolveEnTiles(m ?? {}, hasMedia, issues);

  const tileById = {};
  for (const group of TILE_GROUPS[language]) {
    tileById[group] = Object.create(null);
    for (const t of tiles[group] ?? []) tileById[group][t.id] = t;
  }

  // The never-together sets are read from the manifest as data (`content-pipeline.md`
  // §3.1) so that changing `dialect` changes them without a rebuild. A missing or
  // mangled list falls back to the rule module's answer for the declared dialect — the
  // conservative one when the dialect is unset.
  const dialect = m && isNonEmptyString(m.dialect) ? m.dialect : 'unset';
  let neverTogether = [];
  const declaredSets = m && m.rules && Array.isArray(m.rules.neverTogether) ? m.rules.neverTogether : null;
  if (declaredSets) {
    for (const set of declaredSets) {
      if (Array.isArray(set) && set.length >= 2 && set.every(isNonEmptyString)) neverTogether.push(set.slice());
    }
  }
  if (neverTogether.length === 0) {
    neverTogether = language === 'vi' ? viHomophoneSets(dialect) : EN_HOMOPHONE_SETS.map((s) => s.slice());
    if (declaredSets) {
      issues.push(issue('warning', 'rules.neverTogether', 'badNeverTogether',
        'the pack\'s homophone rules could not be read; the built-in rules were used instead'));
    }
  }

  const catalogue = [];
  const playable = [];
  const index = new Map();

  for (const raw of words) {
    const shell = checkWordShell(raw, language);
    if (shell) {
      catalogue.push({
        id: raw && isNonEmptyString(raw.id) ? raw.id : null,
        text: raw && isNonEmptyString(raw.text) ? nfc(raw.text) : null,
        playable: false,
        reason: shell,
      });
      issues.push(issue('error', `words/${raw && raw.id ? raw.id : '?'}`, shell.code, shell.message));
      continue;
    }

    const id = raw.id;
    const text = nfc(raw.text);
    const stage = Number.isInteger(raw.stage) ? raw.stage : null;
    const entry = { id, text, stage, playable: false, reason: null };

    const decomp = language === 'vi'
      ? resolveViDecomposition(raw, tileById)
      : resolveEnDecomposition(raw, tileById);

    if (decomp.error) {
      entry.reason = decomp.error;
      catalogue.push(entry);
      continue;
    }

    // `content-pipeline.md` §4.3: a draft is a picture and a sound saved in the moment,
    // with the decomposition not filled in. It must never reach the child.
    if (raw.draft === true) {
      entry.reason = reason('draft', 'this word is still being added');
      catalogue.push(entry);
      continue;
    }
    if (raw.enabled === false) {
      entry.reason = reason('disabled', isNonEmptyString(raw.disabledReason)
        ? raw.disabledReason
        : 'this word is turned off');
      catalogue.push(entry);
      continue;
    }
    if (stage === null) {
      entry.reason = reason('noStage', 'this word has not been placed in the progression yet');
      catalogue.push(entry);
      continue;
    }

    const art = resolveArt(raw, hasMedia);
    if (art.error) {
      entry.reason = art.error;
      catalogue.push(entry);
      continue;
    }

    const word = {
      id,
      text,
      stage,
      fallbackEmoji: art.art.fallbackEmoji,
      images: art.art.images,
      audio: art.art.audio,
    };
    if (language === 'vi') word.syllables = decomp.syllables;
    else word.tiles = decomp.tiles;

    const key = language === 'vi' ? keyOfVi(word.syllables[0]) : keyOfEn(word.tiles);
    if (index.has(key)) {
      // Two words with the same parts cannot both be "the word he built". Keep the first
      // by id order so the choice is deterministic, and tell his mother about the clash.
      entry.reason = reason('duplicateParts',
        `"${text}" is built from the same parts as "${index.get(key).text}"`);
      catalogue.push(entry);
      issues.push(issue('warning', `words/${id}`, 'duplicateParts', entry.reason.message));
      continue;
    }

    index.set(key, word);
    playable.push(word);
    entry.playable = true;
    catalogue.push(entry);
  }

  playable.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  catalogue.sort((a, b) => {
    const x = a.id ?? '';
    const y = b.id ?? '';
    return x < y ? -1 : x > y ? 1 : 0;
  });

  // Distractor pools are derived from the words that are actually playable, not from a
  // hand-written table. Two reasons: a distractor drawn from the live vocabulary is far
  // more likely to make another real word, which is what `gameplay.md` §4.5 asks for;
  // and it stays correct when his mother adds a word, with no code change.
  const stageOf = {};
  for (const group of TILE_GROUPS[language]) stageOf[group] = Object.create(null);
  const note = (group, tileId, stage) => {
    if (tileId == null) return;
    const prev = stageOf[group][tileId];
    stageOf[group][tileId] = prev === undefined ? stage : Math.min(prev, stage);
  };
  for (const w of playable) {
    if (language === 'vi') {
      const s = w.syllables[0];
      note('onset', s.onset, w.stage);
      note('rime', s.rime, w.stage);
      note('tone', s.tone, w.stage);
    } else {
      for (const t of w.tiles) note('letter', t, w.stage);
    }
  }

  if (playable.length === 0) {
    issues.push(issue('error', 'words', 'noPlayableWords',
      'there is nothing to play yet — every word is missing a picture, a sound or its parts'));
  }

  return {
    language,
    id: m && isNonEmptyString(m.id) ? m.id : null,
    name: m && isNonEmptyString(m.name) ? nfc(m.name) : null,
    schema,
    readOnly,
    dialect,
    neverTogether,
    chant: m && m.chant && typeof m.chant === 'object' ? m.chant : {},
    tiles,
    tileById,
    stageOf,
    words: playable,
    catalogue,
    index,
    issues,
  };
}

/** Look up the word built from a set of parts. Used for the found-word win (E5). */
export function wordFromParts(pack, parts) {
  const key = pack.language === 'vi' ? keyOfVi(parts) : keyOfEn(parts);
  return pack.index.get(key) ?? null;
}
