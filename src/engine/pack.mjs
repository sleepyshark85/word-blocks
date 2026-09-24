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

import { nfc, isNonEmptyString, glyphLength } from './text.mjs';
import {
  viCheckSpellingRule, viLegalTones, viHomophoneSets,
  enPositionOf, enSlotIsLegal, EN_HOMOPHONE_SETS,
  VI_ALPHABET, EN_ALPHABET, VI_VOWEL_LETTERS, MAX_WORD_LETTERS,
  GLYPH_CASES, readGlyphCase,
} from './rules.mjs';

/** The highest `pack.json.schema` this build understands (`content-pipeline.md` §7). */
export const SCHEMA_SUPPORTED = 1;

export const LANGUAGES = ['vi', 'en'];

/**
 * The tile groups each language's manifest must carry, and no others.
 *
 * **Revision 5 splits `tiles` from the board.** `tiles` is still onset/rime/tone and
 * letter/digraph — it is **the model**, the editor's vocabulary and what a unit of sound
 * is called (`content-pipeline.md` §3.7). What changed is that nothing on the *board* is
 * an onset or a rime any more: `BOARD_RUNS` is what `inventoryOrder` may hold.
 */
const TILE_GROUPS = { vi: ['onset', 'rime', 'tone'], en: ['letter'] };

/** `literacy-vi.md` §0.13, `literacy-en.md` §0.3 — the runs of the board itself. */
const BOARD_RUNS = { vi: ['letter', 'tone'], en: ['letter'] };

/** The alphabet each board is made of. A letter is a glyph, not a tile id. */
const ALPHABET = { vi: VI_ALPHABET, en: EN_ALPHABET };

/**
 * The retired revision-4 runs. A pack still declaring one has not been migrated, and
 * drawing its board would be drawing revision 4's — 67 cells of onsets and rimes — so it
 * is an **error** his mother can be shown, not a silent ignore (`content-pipeline.md`
 * §3.7, "three severities in the validator, deliberately").
 */
const RETIRED_RUNS = ['onset', 'rime', 'digraph'];

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
  // `text` is carried through because the **blend** clip is the only record of the
  // toneless spelling chant beat 3 has to show (`gameplay.md` §5.4): `b` + `o` is `bo`,
  // but `gi` + `i` is `gi` and not `gii`, so the spelling has to come from the pack
  // rather than from a concatenation (`literacy-vi.md` §1.2, AC K5).
  const keep = (clip) => {
    if (!clip || typeof clip !== 'object' || !isNonEmptyString(clip.src)) return null;
    return hasMedia(clip.src)
      ? {
        src: clip.src,
        ms: Number.isFinite(clip.ms) ? clip.ms : null,
        text: isNonEmptyString(clip.text) ? nfc(clip.text) : null,
      }
      : null;
  };
  return { word: keep(a.word), blend: keep(a.blend), sentence: keep(a.sentence) };
}

/**
 * `content-pipeline.md` §3.7 — **tile audio is keyed by unit-STATE, not by unit.** `c`
 * alone is a state and says `cờ`; `ch` is a state and says `chờ`; every tap answers
 * (`gameplay.md` §4.3). Most states are tiles. Ten Vietnamese ones are not — the onset
 * steps `p` and `q`, and the eight pass-through rime prefixes `ac an ă ăn â uô ư ưn` —
 * and those live in `prefixAudio`, which is the second half of the one lookup the app
 * does at a tap:
 *
 *     state -> tiles[group][state]          26 onsets, 35 rimes, 6 tones
 *           -> prefixAudio[group][state]    2 + 8
 *
 * Tiles win, so a state that is both is never two different clips.
 */
function resolveUnitAudio(language, manifest, tiles, hasMedia, issues) {
  const units = {};
  for (const group of TILE_GROUPS[language]) {
    units[group] = Object.create(null);
    for (const tile of tiles[group] ?? []) units[group][tile.id] = tile.audio;
  }
  const raw = manifest && manifest.prefixAudio && typeof manifest.prefixAudio === 'object'
    && !Array.isArray(manifest.prefixAudio)
    ? manifest.prefixAudio
    : {};
  for (const [group, list] of Object.entries(raw)) {
    if (!TILE_GROUPS[language].includes(group)) {
      issues.push(issue('error', `prefixAudio.${group}`, 'foreignPrefixGroup',
        `"${group}" is not a unit group of this language; it was ignored`));
      continue;
    }
    for (const entry of Array.isArray(list) ? list : []) {
      if (!entry || !isNonEmptyString(entry.id)) continue;
      const id = nfc(entry.id);
      // A prefix state that is ALSO a tile would be two clips for one tap. The tile is
      // the model, so it wins, and she is told rather than left to wonder which plays.
      if (units[group][id]) {
        issues.push(issue('warning', `prefixAudio.${group}[${id}]`, 'prefixShadowsTile',
          `"${id}" is already a tile; the tile's own sound was used`));
        continue;
      }
      units[group][id] = resolveTileAudio(entry.audio, hasMedia);
    }
  }
  return units;
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
      // The combining mark, for the **bare-mark carrier** a tone cell wears while it is
      // disabled (`ui.md` §7.2, AC B2d). `ngang` has none and shows the empty circle.
      mark: isNonEmptyString(raw.mark) ? nfc(raw.mark) : '',
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

/* ------------------------------------------------------- letters and spans */

/**
 * The shared half of `letters`: it is an array of **single characters**, every one of
 * them on this board's alphabet, and there are between one and six of them.
 *
 * Six is `MAX_WORD_LETTERS` — the strip holds six cells on the smallest supported phone
 * and a seventh drops the glyph below F4's 34 pt floor (`ui.md` §4.2, AC X6, E20). A
 * longer word is **withheld with a reason his mother can read**, exactly as a word with no
 * photograph is: the alternative is a letter clipped off the end of the word he is
 * building, which is silent and in the one place it matters most.
 */
function readLetters(raw, alphabet) {
  const list = raw.letters;
  if (!Array.isArray(list) || list.length === 0) {
    return { error: reason('noLetters', 'this word has not been broken into letters yet') };
  }
  if (list.length > MAX_WORD_LETTERS) {
    return {
      error: reason('tooManyLetters',
        `this word is ${list.length} letters and the board holds ${MAX_WORD_LETTERS}`),
    };
  }
  const letters = [];
  for (const entry of list) {
    const letter = isNonEmptyString(entry) ? nfc(entry) : null;
    if (letter === null || glyphLength(letter) !== 1) {
      return { error: reason('badLetter', 'every letter must be a single character') };
    }
    if (!alphabet.includes(letter)) {
      return {
        error: reason('letterNotOnBoard', `"${letter}" is not a letter of this board`),
      };
    }
    letters.push(letter);
  }
  return { letters };
}

/**
 * **Vietnamese: the onset/rime boundary, read from the store and never from the stream.**
 * `literacy-vi.md` §0.5, `acceptance-criteria.md` C4f.
 *
 * The two directions are checked with **different strengths, and the asymmetry is the
 * design** (`content-pipeline.md` §3.7): the onset half is the boundary the engine will
 * trust, so it must recompose exactly; the rime half may be waived by
 * `build.spellingException`, because `gì` is the onset `gi` plus the rime `i` written with
 * a single `i` and no letter stream can express that.
 */
function resolveViLetters(raw, syllable) {
  const read = readLetters(raw, VI_ALPHABET);
  if (read.error) return read;
  const { letters } = read;
  const n = raw.onsetLetterCount;
  if (!Number.isInteger(n) || n < 0 || n > letters.length) {
    return { error: reason('badOnsetLetterCount', 'this word does not say where its first part ends') };
  }
  const onset = syllable.onset ?? '';
  if (letters.slice(0, n).join('') !== onset) {
    return {
      error: reason('lettersDoNotSpellOnset',
        `the first ${n} letter(s) spell "${letters.slice(0, n).join('')}", not "${onset || '(none)'}"`),
    };
  }
  const rest = letters.slice(n).join('');
  const waived = raw.build && raw.build.spellingException === true;
  if (rest !== syllable.rime && !waived) {
    return {
      error: reason('lettersDoNotSpellRime',
        `the remaining letters spell "${rest}", not "${syllable.rime}"`),
    };
  }
  const spans = [];
  if (n > 0) {
    spans.push({
      start: 0, end: n, group: 'onset', unit: onset, kind: 'consonant',
    });
  }
  if (letters.length > n) {
    spans.push({
      start: n, end: letters.length, group: 'rime', unit: syllable.rime, kind: 'vowel',
    });
  }
  return { letters, onsetLetterCount: n, spans };
}

/**
 * **English: the sounds are `tiles`, the taps are `letters`.** `duck` is `d` `u` `ck` —
 * three sounds — and `d` `u` `c` `k` — four taps (`literacy-en.md` §0.5). The spans are
 * the tiles measured in letters, so the letters of `ck` are one span and a chant beat
 * lights both of them.
 */
function resolveEnLetters(raw, tiles, tileById) {
  const read = readLetters(raw, EN_ALPHABET);
  if (read.error) return read;
  const { letters } = read;
  if (letters.join('') !== nfc(raw.text)) {
    return {
      error: reason('lettersMismatch', `the letters spell "${letters.join('')}", not "${nfc(raw.text)}"`),
    };
  }
  const spans = [];
  let at = 0;
  for (const tileId of tiles) {
    const len = glyphLength(tileId);
    if (letters.slice(at, at + len).join('') !== tileId) {
      return {
        error: reason('lettersDoNotSpellTiles', `the letters do not spell the part "${tileId}"`),
      };
    }
    const tile = tileById.letter[tileId];
    spans.push({
      start: at,
      end: at + len,
      group: 'letter',
      unit: tileId,
      kind: tile && tile.isVowel ? 'vowel' : 'consonant',
    });
    at += len;
  }
  if (at !== letters.length) {
    return { error: reason('lettersDoNotSpellTiles', 'the parts and the letters are different lengths') };
  }
  return { letters, spans };
}

/**
 * Which letter of a rime wears the tone mark — read out of the rime's **stored** toned
 * forms, never placed by a rule (`literacy-vi.md` §5.4, AC K5). It is what the dashed
 * mark-slot sits above while he is choosing (`ui.md` §7.2.4, AC X28).
 *
 * It is read by comparing two **stored** spellings, `oa` against `òa`: the character that
 * differs is the one wearing the mark. Nothing is decomposed and nothing is composed.
 */
function carrierOffsetOf(rime) {
  const plain = [...String(rime.glyph)];
  for (const [toneId, form] of Object.entries(rime.toned ?? {})) {
    if (toneId === 'ngang' || !isNonEmptyString(form)) continue;
    const marked = [...form];
    if (marked.length !== plain.length) continue;
    for (let i = 0; i < plain.length; i += 1) {
      // The one character that differs between `uôi` and `uối` **is** the carrier. This
      // is a comparison of two spellings the pack stores, not a decomposition and not a
      // rule: `literacy-vi.md` §5.4 puts mark placement in the editor, in front of a
      // human, and `test/purity.test.mjs` keeps even the decomposed form out of here.
      if (plain[i] !== marked[i]) return i;
    }
  }
  // No usable marked form to read: the first vowel letter, which is what §0.14
  // recommends writing anyway.
  const at = plain.findIndex((c) => VI_VOWEL_LETTERS.includes(c));
  return at < 0 ? 0 : at;
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

function resolveCheer(manifest, hasMedia) {
  const raw = manifest ? manifest.cheer : null;
  if (!raw || typeof raw !== 'object' || !isNonEmptyString(raw.src)) return null;
  if (!hasMedia(raw.src)) return null;
  return { src: raw.src, ms: Number.isFinite(raw.ms) ? raw.ms : null };
}

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

  /**
   * Two tiles with the same id would share one instance id in a palette, so seating one
   * would remove both — the Slice 2 tester measured it on 333 of 400 generated rounds.
   * The first wins, the rest are dropped with an error his mother can act on, and
   * `tiles[group]` is filtered to match `tileById` so nothing downstream can pick the
   * shadowed copy out of the array.
   */
  const tileById = {};
  for (const group of TILE_GROUPS[language]) {
    tileById[group] = Object.create(null);
    const kept = [];
    for (const t of tiles[group] ?? []) {
      if (tileById[group][t.id]) {
        issues.push(issue('error', `tiles.${group}[${t.id}]`, 'duplicateTileId',
          `there is more than one "${t.id}" tile; only the first was used`));
        continue;
      }
      tileById[group][t.id] = t;
      kept.push(t);
    }
    tiles[group] = kept;
  }

  /**
   * **`ui.md` §8.2 / `content-pipeline.md` §3.8 / AC D17–D24 — the glyph casing, read
   * once here, applied at one place in the glyph component.**
   *
   * The owner answered `open-questions-ui.md` Q7 with `A B C D`. The field's name and
   * shape are the content-engineer's (E22): `display.glyphCase`, nested so that D20's
   * boundary — *nothing under `display` reaches stored data, audio, ordering or a parent
   * surface* — is structural rather than remembered. `readGlyphCase` is the same function
   * `tools/lib/rules.mjs` exports, and `test/rules-parity.test.mjs` keeps them identical.
   *
   * Two defences, and both are this project's standing rules rather than taste:
   *
   *   1. **Absent, empty, misspelled or the wrong shape is lowercase, silently** (D23).
   *      A casing flag is never worth refusing to start over. The *validator* is harsher
   *      — a typo is a warning and a broken shape is an error — and the split is the
   *      point: the app coping is not the same as the pack being right.
   *   2. **A Vietnamese pack may not be uppercase** (D18, Q13, `ui.md` §8.2.3). `mả`/`mã`
   *      is the tightest pair in the §6.1 render gate at 34 px, a mark on a capital sits
   *      against a cap height rather than an x-height, and `FIXTURE.txt` carries seven
   *      uppercase Vietnamese letters rather than the ~130 marked capitals — so the gate
   *      has never rendered what the flag would ask for. **D18 says no Vietnamese glyph is
   *      ever rendered uppercase anywhere in the app**, so it is refused here with a
   *      reason rather than obeyed. (`content-pipeline.md` §3.8's table says the app
   *      obeys and only the validator objects; D18 is the numbered criterion, so this
   *      builds to D18 and the difference is reported rather than absorbed.)
   */
  let glyphCase = readGlyphCase(m);
  const display = m ? m.display : undefined;
  const wellFormed = display !== undefined && display !== null
    && typeof display === 'object' && !Array.isArray(display);
  if (display !== undefined && display !== null && !wellFormed) {
    // A wrong *shape* is not a typo, it is a broken writer (`content-pipeline.md` §3.8).
    issues.push(issue('error', 'pack.json', 'badDisplayShape',
      '"display" is not a group of render settings; the letters are shown as they are stored'));
  } else if (wellFormed && display.glyphCase !== undefined) {
    const raw = display.glyphCase;
    if (typeof raw !== 'string') {
      issues.push(issue('error', 'pack.json', 'badGlyphCase',
        '"display.glyphCase" is not a word; expected "lower" or "upper"'));
    } else if (!GLYPH_CASES.includes(raw)) {
      // A typo is a typo: it costs the owner's choice, and it is named rather than guessed.
      issues.push(issue('warning', 'pack.json', 'unknownGlyphCase',
        `"${raw}" is not a casing this app knows; expected "lower" or "upper"`));
    }
  }
  if (glyphCase === 'upper' && language === 'vi') {
    glyphCase = 'lower';
    issues.push(issue('error', 'pack.json', 'viCannotBeUppercase',
      'a Vietnamese pack cannot be shown in capitals: the font gate has never rendered the marked capitals (ui.md §8.2.3, AC Q13, D18)'));
  }

  const unitAudio = resolveUnitAudio(language, m, tiles, hasMedia, issues);

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
  const seenIds = new Set();

  /**
   * Sorted **here**, before anything reads it, because two resolutions of the same words
   * in a different order must produce the same pack: the duplicate-parts rule below
   * keeps the first word it meets, and "first" has to mean something stable. The Slice 2
   * tester found this was true only by accident — the seed builder happened to sort
   * filenames — and this layer is about to be read by a directory listing instead.
   */
  const ordered = [...words].sort((a, b) => {
    const x = a && typeof a.id === 'string' ? a.id : '';
    const y = b && typeof b.id === 'string' ? b.id : '';
    return x < y ? -1 : x > y ? 1 : 0;
  });

  for (const raw of ordered) {
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

    // Two word files claiming the same id: `wordById` would answer with the first and
    // the second would be listed as playable while never being dealt, so his mother
    // would be told a dead word was fine. One id, one word.
    if (seenIds.has(id)) {
      entry.reason = reason('duplicateId', `there is already a word with the id "${id}"`);
      catalogue.push(entry);
      issues.push(issue('error', `words/${id}`, 'duplicateId', entry.reason.message));
      continue;
    }
    seenIds.add(id);

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

    // **The letters, and the spans they make** — what he taps, and which of them are one
    // sound (`literacy-vi.md` §0.5, `literacy-en.md` §0.5). Derived data, stored by the
    // editor and validated here, never recomputed from the spelling at runtime.
    const shape = language === 'vi'
      ? resolveViLetters(raw, decomp.syllables[0])
      : resolveEnLetters(raw, decomp.tiles, tileById);
    if (shape.error) {
      entry.reason = shape.error;
      catalogue.push(entry);
      issues.push(issue('error', `words/${id}`, shape.error.code, shape.error.message));
      continue;
    }

    const word = {
      id,
      text,
      stage,
      fallbackEmoji: art.art.fallbackEmoji,
      images: art.art.images,
      audio: art.art.audio,
      letters: shape.letters,
      spans: shape.spans,
    };
    if (language === 'vi') {
      word.syllables = decomp.syllables;
      word.onsetLetterCount = shape.onsetLetterCount;
      // Where the mark lands, read from the rime's stored toned forms (X28, C6).
      const rimeTile = tileById.rime[decomp.syllables[0].rime];
      word.carrierOffset = rimeTile ? carrierOffsetOf(rimeTile) : 0;
    } else {
      word.tiles = decomp.tiles;
    }

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
  const wordById = Object.create(null);
  for (const w of playable) wordById[w.id] = w;
  catalogue.sort((a, b) => {
    const x = a.id ?? '';
    const y = b.id ?? '';
    return x < y ? -1 : x > y ? 1 : 0;
  });

  // `ui.md` §13.7 E12 — **the inventory order per position is the board.** The table
  // takes the first `cells` of it, so nothing else may decide which symbol sits in which
  // cell (`gameplay.md` §3.2: spatial constancy is the pedagogical point, and
  // `acceptance-criteria.md` B7 makes it a pure function of this list and the grid).
  //
  // It is read from the manifest as data so that the editor's *put it on the board*
  // (K11) is a content change, and it is hardened like every other read: an entry naming
  // a tile this pack does not have is dropped with a reason his mother can act on, and
  // **every declared tile that the order omits is appended** in declaration order, so a
  // truncated or half-written list can never hide a tile from the board entirely.
  const inventoryOrder = {};
  const declaredOrder = m && m.inventoryOrder && typeof m.inventoryOrder === 'object'
    && !Array.isArray(m.inventoryOrder)
    ? m.inventoryOrder
    : null;
  // A pack still declaring `onset`, `rime` or `digraph` has not been migrated to
  // revision 5. Drawing it would draw revision 4's 67-cell board, so it is an error she
  // can act on and the run is ignored (`content-pipeline.md` §3.7).
  for (const run of RETIRED_RUNS) {
    if (declaredOrder && Array.isArray(declaredOrder[run])) {
      issues.push(issue('error', `inventoryOrder.${run}`, 'retiredInventoryRun',
        `"${run}" is not a run of the board any more; the board is the alphabet`));
    }
  }
  for (const group of BOARD_RUNS[language]) {
    const listed = declaredOrder && Array.isArray(declaredOrder[group]) ? declaredOrder[group] : null;
    // A letter run is checked against the **alphabet**, a tone run against the pack's own
    // tone tiles. A letter is a glyph, not a tile id: six of the 29 Vietnamese letters
    // have no tile of their own and nothing is wrong with that, because what a tap says
    // depends on the state it creates rather than on the cell (`content-pipeline.md`
    // §3.7).
    const complete = group === 'tone'
      ? tiles.tone.map((t) => t.id)
      : ALPHABET[language];
    const known = new Set(complete);
    const order = [];
    const seen = new Set();
    for (const raw of listed ?? []) {
      const id = isNonEmptyString(raw) ? nfc(raw) : null;
      if (id === null || !known.has(id)) {
        issues.push(issue('warning', `inventoryOrder.${group}`, 'unknownInventoryEntry',
          `"${isNonEmptyString(raw) ? raw : '?'}" is not part of this board; it was left off`));
        continue;
      }
      if (seen.has(id)) continue;
      seen.add(id);
      order.push(id);
    }
    // **Every missing entry is put back.** A letter she deleted by accident is every word
    // containing it made unbuildable, which is the defect revision 4 actually shipped, so
    // a truncated or half-written list degrades to a complete board rather than to a
    // board with a hole in it (AC B2n, C18a, D1a).
    for (const id of complete) if (!seen.has(id)) order.push(id);
    inventoryOrder[group] = order;
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
    glyphCase,
    /**
     * `ui.md` §13.6 / §13.7 **E14** — **one optional cheer clip per pack**, hers, ≤ 2 s,
     * removable, and **not** per word. The editor writes it into the manifest (§13.6) and
     * `gameController` layers it over the announcement motif if it is there
     * (`gameplay.md` §5.2). A dangling reference degrades to *no cheer*, which is the
     * app's complete state: F6 says the game is whole without one.
     */
    cheer: resolveCheer(m, hasMedia),
    chant: m && m.chant && typeof m.chant === 'object' ? m.chant : {},
    tiles,
    tileById,
    /** Every unit-state's clip: the tiles, then the prefix states (`content-pipeline.md` §3.7). */
    unitAudio,
    inventoryOrder,
    words: playable,
    wordById,
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
