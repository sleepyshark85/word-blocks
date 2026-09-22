#!/usr/bin/env node
// Validate a content pack. Exits non-zero on a bad pack.
//
//   node tools/pack-validate.mjs packs/vi-seed
//   node tools/pack-validate.mjs packs/vi-seed --strict     # warnings are errors too
//   node tools/pack-validate.mjs packs/vi-seed --json
//   node tools/pack-validate.mjs packs/vi-seed --gc         # list unreferenced media
//
//   exit 0 — valid (warnings may have been printed)
//   exit 1 — the pack is bad
//   exit 2 — cannot even look at it (no such directory, bad arguments)
//
// WHY THIS EXISTS. `development-process.md` §4: the pack is hostile input. It is edited
// on a phone by a non-technical adult, it is written by these tools, and it is restored
// from a backup made by an older version of the app. Tier 2 of the verification strategy
// is this file plus corruption fuzzing.
//
// Two kinds of finding, and the difference matters:
//
//   ERROR   — the pack is wrong. A rule of the writing system is broken, a reference is
//             unsafe, two words claim the same id. Shipping this teaches a child
//             something false or crashes the app.
//   WARNING — the pack is incomplete. A word has no picture yet, a tile has no clip.
//             The app copes (see `media.onMissing*`) and the child simply meets a
//             different word. `--strict` is what says "this is ready for a child".
//
// The distinction is why `--strict` exists rather than one severity: a freshly built
// seed pack has no media at all and is a perfectly valid pack, and the asset pipeline
// takes days of curation to fill it.

import { existsSync, readFileSync, statSync, rmSync } from 'node:fs';
import path from 'node:path';
import * as R from './lib/rules.mjs';
import {
  SCHEMA, LANGUAGES, ID_RE, packPaths, readManifest, readWords, listMedia,
  badMediaRef, sniffType, EXT_TYPES, wordMediaRefs, tileMediaRefs,
} from './lib/pack.mjs';

const argv = process.argv.slice(2);
let packDir = null;
let strict = false;
let asJson = false;
let gc = false;
let gcDelete = false;
for (const a of argv) {
  if (a === '--strict') strict = true;
  else if (a === '--json') asJson = true;
  else if (a === '--gc') gc = true;
  else if (a === '--delete-orphans') { gc = true; gcDelete = true; }
  else if (a.startsWith('-')) { console.error(`unknown option ${a}`); process.exit(2); }
  else packDir = a;
}
if (!packDir) {
  console.error('usage: pack-validate.mjs <pack-dir> [--strict] [--json] [--gc] [--delete-orphans]');
  process.exit(2);
}
packDir = path.resolve(packDir);
if (!existsSync(packDir) || !statSync(packDir).isDirectory()) {
  console.error(`no such pack directory: ${packDir}`);
  process.exit(2);
}

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push({ where, msg });
const warn = (where, msg) => warnings.push({ where, msg });

/**
 * DRAFTS. His mother plays with him, and the best time to capture a word is the moment
 * it happens — he points at their cat, she photographs it and records herself saying
 * `mèo`, and that has to be savable *there*, in five seconds, without her stopping to
 * decide that the rime is `eo` and the tone is huyền.
 *
 * So a word may be saved `draft: true`, which means: the picture and the sound are real
 * and hers, the decomposition is not filled in yet. A draft is never shown to the child
 * (`enabled` must be false) and its decomposition rules are relaxed to warnings.
 *
 * Nothing else is relaxed. A draft's media references are checked exactly as strictly as
 * a finished word's, because an unsafe path is unsafe whoever typed it and whenever.
 */
const isDraft = (w) => w.draft === true;
let draftCount = 0;

/* --------------------------------------------------------------------- manifest */

let manifest = null;
let manifestFrom = null;
try {
  const read = readManifest(packDir);
  if (!read) err('pack.json', 'missing — a pack must have a manifest');
  else { manifest = read.manifest; manifestFrom = read.from; }
} catch (e) {
  err('pack.json', `unparseable, and pack.json.bak did not save it: ${e.message}`);
}
if (manifestFrom === 'pack.json.bak') {
  warn('pack.json', 'unreadable; the pack was validated against pack.json.bak. The app would do the same, but the manifest should be repaired.');
}

const lang = manifest?.language;
const p = packPaths(packDir);

if (manifest) {
  if (!Number.isInteger(manifest.schema)) err('pack.json', `schema must be an integer, got ${JSON.stringify(manifest.schema)}`);
  else if (manifest.schema < 1) err('pack.json', `schema ${manifest.schema} is below 1`);
  else if (manifest.schema > SCHEMA) {
    err('pack.json', `schema ${manifest.schema} is newer than this tool understands (${SCHEMA}). The app must open such a pack READ-ONLY rather than write to it and silently drop fields.`);
  }
  if (!LANGUAGES.includes(lang)) err('pack.json', `language must be one of ${LANGUAGES.join('/')}, got ${JSON.stringify(lang)}`);
  if (!ID_RE.test(manifest.id ?? '')) err('pack.json', `id ${JSON.stringify(manifest.id)} must match ${ID_RE}`);
  if (typeof manifest.name !== 'string' || !manifest.name.trim()) err('pack.json', 'name must be a non-empty string');
}

/* ------------------------------------------------------------------------- tiles */

const EXPECTED_GROUPS = { vi: ['onset', 'rime', 'tone'], en: ['letter'] };
const tileIds = {}; // group -> Set
const tileById = {}; // group -> id -> tile

if (manifest && LANGUAGES.includes(lang)) {
  const tiles = manifest.tiles;
  if (!tiles || typeof tiles !== 'object' || Array.isArray(tiles)) {
    err('pack.json', 'tiles must be an object of tile groups');
  } else {
    const want = EXPECTED_GROUPS[lang];
    const got = Object.keys(tiles).sort();
    if (got.join(',') !== [...want].sort().join(',')) {
      err('pack.json', `a ${lang} pack must have exactly the tile groups ${want.join(', ')} — got ${got.join(', ') || '(none)'}`);
    }
    for (const g of Object.keys(tiles)) {
      tileIds[g] = new Set();
      tileById[g] = new Map();
      const list = tiles[g];
      if (!Array.isArray(list)) { err(`pack.json tiles.${g}`, 'must be an array'); continue; }
      list.forEach((t, i) => {
        const at = `pack.json tiles.${g}[${i}]`;
        if (!t || typeof t !== 'object') { err(at, 'must be an object'); return; }
        if (typeof t.id !== 'string' || !t.id) { err(at, 'id must be a non-empty string'); return; }
        if (tileIds[g].has(t.id)) err(at, `duplicate tile id ${JSON.stringify(t.id)} in group ${g}`);
        tileIds[g].add(t.id);
        tileById[g].set(t.id, t);
      });
    }
  }
}

/* --- Vietnamese tile rules: literacy-vi.md §5.2 and §5.4 ------------------------ */

if (lang === 'vi' && tileById.rime) {
  for (const [id, tile] of tileById.rime) {
    const legal = new Set(R.viLegalTones(id));
    if (!Array.isArray(tile.legalTones) || tile.legalTones.join(',') !== [...legal].join(',')) {
      err(`tiles.rime[${id}]`, `legalTones must be [${[...legal].join(', ')}] — a rime ending in p/t/c/ch carries only sắc and nặng (literacy-vi.md §5.2)`);
    }
    const toned = tile.toned;
    if (!toned || typeof toned !== 'object') {
      err(`tiles.rime[${id}]`, 'toned must carry all six tone forms, null where the tone is illegal (literacy-vi.md §5.4)');
      continue;
    }
    for (const t of R.VI_TONE_IDS) {
      const v = toned[t];
      if (legal.has(t)) {
        if (typeof v !== 'string' || !v) err(`tiles.rime[${id}].toned.${t}`, `tone ${t} is legal on "${id}" but no form is stored — the tone row would show a blank tile`);
      } else if (v !== null) {
        err(`tiles.rime[${id}].toned.${t}`, `tone ${t} is illegal on a stop-final rime and must be null, got ${JSON.stringify(v)} (literacy-vi.md §5.2)`);
      }
    }
  }
  for (const [id, tile] of (tileById.tone ?? new Map())) {
    if (!R.VI_TONE_IDS.includes(id)) err(`tiles.tone[${id}]`, `unknown tone id; expected one of ${R.VI_TONE_IDS.join(', ')}`);
    if (typeof tile.label !== 'string' || !tile.label) warn(`tiles.tone[${id}]`, 'no label — the tile has nothing to say when pressed (literacy-vi.md §5.3)');
  }
  const want = JSON.stringify(R.viHomophoneSets(manifest.dialect));
  const got = JSON.stringify(manifest.rules?.neverTogether ?? null);
  if (got !== want) {
    err('pack.json rules.neverTogether', `does not match dialect ${JSON.stringify(manifest.dialect)}. The round generator reads this as data; a stale list would put homophones in one palette (literacy-vi.md §6.1). Expected ${want}`);
  }
  if (manifest.dialect === 'unset') {
    warn('pack.json dialect', 'not chosen yet (open-questions.md Q1). The palette is using the conservative union of both dialects\' merged sets.');
  }
}

if (lang === 'en' && tileById.letter) {
  for (const [id, tile] of tileById.letter) {
    if (R.EN_EXCLUDED.includes(id)) err(`tiles.letter[${id}]`, `"${id}" is excluded from v1 (literacy-en.md §3.5)`);
    if (R.EN_FINAL_ONLY.includes(id) && tile.position !== 'final') {
      err(`tiles.letter[${id}]`, `must be position "final" — ck/ll/ss/ff/zz/ng/x can never start a word (literacy-en.md §3.3, §7)`);
    }
    if (tile.sound == null || tile.anchor == null) {
      warn(`tiles.letter[${id}]`, 'has no sound/anchor word. These are curriculum (decisions.md "Still open" #3) and the literacy-designer must supply them before audio can be generated.');
    }
  }
}

/* ------------------------------------------------------------------------- words */

const { ok: wordsOk, bad: wordsBad } = readWords(packDir);
for (const b of wordsBad) {
  err(path.relative(packDir, b.file), `does not parse as JSON: ${b.error}. The app quarantines this file and loads the other words; one stray comma must not cost the whole pack.`);
}

const seenId = new Set();
const seenText = new Map();
const referenced = new Set();
let playable = 0;
let photographed = 0;
let enabledCount = 0;
const imagesMissing = [];

const takesRef = (ref, at, where) => {
  const bad = badMediaRef(ref);
  if (bad) { err(where, `${at} ${JSON.stringify(ref)} is not a safe media reference: ${bad}`); return false; }
  referenced.add(ref);
  const abs = path.join(packDir, ref);
  if (!existsSync(abs)) {
    // A DANGLING REFERENCE IS AN ERROR, not an absence.
    //
    // `images: []` is a word that has not been curated yet — incomplete, and a warning.
    // `images: [{src: "…/9f3a.jpg"}]` where that file is gone is a pack that disagrees
    // with its own filesystem: something deleted a blob, a restore was partial, or a
    // write was interrupted at exactly the wrong moment. The runtime survives it (see
    // `media.onMissing*` and content-pipeline.md §"When a file is missing") precisely so
    // the child never sees it — but surviving it is not the same as it being acceptable,
    // and the editor must be able to tell her which picture vanished.
    err(where, `${at} points at ${ref}, which is not in the pack. The runtime degrades (the word falls back or is withheld) but this pack is inconsistent with its own media directory — a blob was deleted, a restore was partial, or a write was interrupted.`);
    return false;
  }
  const st = statSync(abs);
  if (!st.isFile() || st.size === 0) { err(where, `${at} points at an empty or non-file ${ref}`); return false; }
  const ext = path.extname(ref).toLowerCase();
  const want = EXT_TYPES[ext];
  const got = sniffType(abs);
  if (!want) { err(where, `${at} has an unsupported extension ${ext}`); return false; }
  if (got === null || !want.includes(got)) {
    err(where, `${at} ${ref} is not a ${want.join('/')} file (magic bytes say ${got ?? 'unrecognised'}). A truncated download or an HTML error page saved with a .jpg name looks exactly like this.`);
    return false;
  }
  return true;
};

for (const { file, word } of wordsOk) {
  const rel = path.relative(packDir, file);
  const stem = path.basename(file, '.json');

  if (!word || typeof word !== 'object' || Array.isArray(word)) { err(rel, 'must be a JSON object'); continue; }
  if (typeof word.id !== 'string' || !ID_RE.test(word.id)) { err(rel, `id ${JSON.stringify(word.id)} must match ${ID_RE}`); continue; }
  if (word.id !== stem) err(rel, `id ${JSON.stringify(word.id)} does not match the filename ${JSON.stringify(stem)}`);
  if (seenId.has(word.id)) err(rel, `duplicate word id ${JSON.stringify(word.id)}`);
  seenId.add(word.id);

  if (typeof word.text !== 'string' || !word.text.trim()) { err(rel, 'text must be a non-empty string'); continue; }
  const textKey = word.text.normalize('NFC');
  if (seenText.has(textKey)) warn(rel, `"${word.text}" is also in ${seenText.get(textKey)} — two entries for one word`);
  else seenText.set(textKey, rel);

  if (word.enabled !== undefined && typeof word.enabled !== 'boolean') err(rel, 'enabled must be a boolean');
  if (word.stage !== undefined && word.stage !== null && !(Number.isInteger(word.stage) && word.stage >= 1)) {
    err(rel, `stage must be a positive integer or null, got ${JSON.stringify(word.stage)}`);
  }

  // --- the no-mixing rule, enforced structurally -------------------------------
  // `development-process.md` §4: "Two things must never leak across the language
  // boundary." Language is a property of the PACK. A word that carries one, or that
  // carries the other language's shape, is the beginning of a leak.
  for (const k of ['language', 'lang', 'locale']) {
    if (k in word) err(rel, `must not carry a "${k}" field. Language belongs to the pack, not the word — a word with a language is one field away from a fallback that mixes the two.`);
  }
  if (lang === 'vi' && 'tiles' in word) err(rel, 'a Vietnamese word must not carry English `tiles`; it decomposes into `syllables` (literacy-vi.md §1.1)');
  if (lang === 'en' && 'syllables' in word) err(rel, 'an English word must not carry Vietnamese `syllables`; it decomposes into `tiles` (literacy-en.md §1)');

  const draft = isDraft(word);
  if (draft) {
    draftCount += 1;
    if (word.enabled !== false) {
      err(rel, 'is a draft but is not disabled. A draft has no decomposition yet, so it cannot be played; set enabled = false. The child must never meet a half-entered word.');
    }
  }
  // Decomposition faults on a draft are things she has not done yet, not things she got
  // wrong. They are reported, and they do not fail the pack.
  const dErr = draft ? warn : err;

  const enabled = word.enabled !== false;
  if (enabled) enabledCount += 1;

  /* --- Vietnamese decomposition ------------------------------------------- */
  if (lang === 'vi') {
    if (!Array.isArray(word.syllables) || word.syllables.length === 0) {
      dErr(rel, 'syllables must be a non-empty array of {onset, rime, tone} (literacy-vi.md §1.1 — an array from day one so that two-syllable words are not a migration)');
    } else {
      word.syllables.forEach((s, i) => {
        const at = `${rel} syllables[${i}]`;
        if (!s || typeof s !== 'object') { dErr(at, 'must be an object'); return; }
        const { onset, rime, tone } = s;
        if (onset !== null && (typeof onset !== 'string' || !tileIds.onset?.has(onset))) {
          dErr(at, `onset ${JSON.stringify(onset)} is not a tile in this pack (use null for the zero onset)`);
        }
        if (typeof rime !== 'string' || !tileIds.rime?.has(rime)) { dErr(at, `rime ${JSON.stringify(rime)} is not a tile in this pack`); return; }
        if (typeof tone !== 'string' || !tileIds.tone?.has(tone)) { dErr(at, `tone ${JSON.stringify(tone)} is not a tile in this pack`); return; }
        if (!R.viLegalTones(rime).includes(tone)) {
          dErr(at, `tone "${tone}" is illegal on rime "${rime}" — a rime ending in p/t/c/ch carries only sắc or nặng (literacy-vi.md §5.2)`);
        }
        if (typeof onset === 'string') {
          const bad = R.viCheckSpellingRule(onset, rime);
          if (bad) dErr(at, bad);
        }
      });

      // The composed spelling, checked against the stored one. The engine never
      // composes (literacy-vi.md §1.2) — this runs here, once, so that a typo in a
      // decomposition cannot reach a child. `gi` genuinely does not concatenate
      // (`gi`+`i` = `gì`), so an entry may opt out with build.spellingException.
      if (word.syllables.length === 1) {
        const s = word.syllables[0];
        const rimeTile = tileById.rime?.get(s.rime);
        const toned = rimeTile?.toned?.[s.tone];
        if (typeof toned === 'string') {
          const composed = `${s.onset ?? ''}${toned}`.normalize('NFC');
          if (composed !== textKey && word.build?.spellingException !== true) {
            dErr(rel, `spelling disagrees with the decomposition: "${word.text}" but ${JSON.stringify(s.onset ?? '')} + "${toned}" composes to "${composed}". Either the decomposition or the spelling is wrong. If both are right and this is a genuine orthographic exception (literacy-vi.md §1.2), set build.spellingException = true.`);
          }
        }
      }
    }
  }

  /* --- English decomposition ---------------------------------------------- */
  if (lang === 'en') {
    if (!Array.isArray(word.tiles) || word.tiles.length === 0) {
      dErr(rel, 'tiles must be a non-empty array of tile ids (literacy-en.md §1)');
    } else {
      let anyVowel = false;
      word.tiles.forEach((t, i) => {
        const at = `${rel} tiles[${i}]`;
        if (typeof t !== 'string' || !tileIds.letter?.has(t)) { dErr(at, `${JSON.stringify(t)} is not a tile in this pack`); return; }
        const tile = tileById.letter.get(t);
        if (tile.kind === 'vowel') anyVowel = true;
        if (i === 0 && R.EN_FINAL_ONLY.includes(t)) {
          err(at, `"${t}" can never start a word (literacy-en.md §3.3) — offering a tile where it cannot legally go is a trap`);
        }
        if (i > 0 && R.EN_INITIAL_ONLY.includes(t)) {
          err(at, `"${t}" is initial-only in v1 (literacy-en.md §3.1)`);
        }
      });
      if (!anyVowel) dErr(rel, 'no vowel tile — every English word needs one (literacy-en.md §3.2)');
      // English IS letter-by-letter (literacy-en.md §1), so this is exact, not advisory.
      const joined = word.tiles.join('');
      if (joined !== word.text) dErr(rel, `tiles spell "${joined}" but text is "${word.text}"`);
    }
  }

  /* --- media -------------------------------------------------------------- */
  const images = Array.isArray(word.images) ? word.images : [];
  if (word.images !== undefined && !Array.isArray(word.images)) err(rel, 'images must be an array');
  let liveImages = 0;
  for (const m of wordMediaRefs(word)) {
    const present = takesRef(m.ref, m.at, rel);
    if (m.kind === 'image') {
      if (present) liveImages += 1;
      else if (!badMediaRef(m.ref)) { imagesMissing.push(`${rel} ${m.at} -> ${m.ref}`); }
    }
  }
  const lim = manifest?.media?.imagesPerWord ?? { min: 1, max: 6 };
  if (enabled && images.length > (lim.max ?? 6)) {
    warn(rel, `${images.length} images; the pack's stated maximum is ${lim.max}`);
  }

  // The images[] contract. See content-pipeline.md §"The images array".
  images.forEach((im, i) => {
    const at = `images[${i}]`;
    if (!im || typeof im !== 'object' || Array.isArray(im)) { err(rel, `${at} must be an object`); return; }
    if (typeof im.src !== 'string' || !im.src) {
      err(rel, `${at} has no src. Every entry is an object; a bare path string is not accepted, because the licence fields have nowhere to live and an image whose licence is unknown cannot be published.`);
      return;
    }
    if (typeof im.source !== 'string' || !im.source) {
      err(rel, `${at} has no "source". It must say where the picture came from — "camera" (hers), "own-work", "generated", "vi.wikipedia.org", "commons.wikimedia.org", … Attribution is generated from this field and nothing else.`);
      return;
    }
    // `own-work` and `camera` are the mother's own photographs, `generated` is ours.
    // Everything else is somebody else's work and carries an attribution obligation.
    const ours = ['camera', 'own-work', 'generated'].includes(im.source);
    if (!ours) {
      for (const k of ['license', 'sourceUrl', 'creator']) {
        if (!im[k]) {
          err(rel, `${at} came from ${JSON.stringify(im.source)} and has no "${k}". A CC BY or CC BY-SA image shipped without author, licence and a link back is a licence breach, and the attributions screen is generated from the pack — there is nowhere else for this to come from.`);
        }
      }
      if (!im.modified) {
        warn(rel, `${at} does not record what was changed. CC BY and CC BY-SA both require that modifications be indicated, and this pipeline always crops and re-encodes.`);
      }
    }
    if (/\bnd\b|NoDeriv/i.test(im.license ?? '')) {
      err(rel, `${at} is licensed ${im.license}. The pipeline crops and resizes, which a NoDerivatives term forbids (image-sourcing.md §Licensing).`);
    }
    if (/\bnc\b|noncommercial|non-commercial/i.test(im.license ?? '')) {
      warn(rel, `${at} is licensed ${im.license}. Publishing to a store is still open (decisions.md "Still open" #5) and a NonCommercial term would have to be unpicked first.`);
    }
  });

  const wordAudio = word.audio?.word;
  const hasWordAudio = !!(wordAudio && typeof wordAudio === 'object' && wordAudio.src && existsSync(path.join(packDir, wordAudio.src)));

  // Is this word playable at all? A word the child can never be shown is not an error —
  // it is simply withheld from the round generator and shown to his mother as needing
  // work. It becomes an error under --strict.
  const hasPicture = liveImages > 0 || (typeof word.fallbackEmoji === 'string' && word.fallbackEmoji);
  if (enabled) {
    if (liveImages === 0 && word.fallbackEmoji) {
      // Playable, but on the FALLBACK. decisions.md made real photographs primary and
      // Fluent Emoji the thing you use when no acceptable photo was found — so a word
      // running on the emoji is a word nobody has curated yet, and `--strict` (which
      // means "ready for a child") must say so rather than count it as finished.
      warn(rel, `has no photograph and is falling back to the "${word.fallbackEmoji}" emoji. Playable, but decisions.md makes real photographs primary — this word has not been curated.`);
    }
    if (liveImages > 0) photographed += 1;
    if (hasPicture && hasWordAudio) playable += 1;
    else if (!hasPicture) warn(rel, 'enabled but has no surviving image and no fallbackEmoji — the round generator must withhold it. The child sees a different word; he never sees a broken picture.');
    else warn(rel, 'enabled but has no word audio — the chant has no final step, so the round generator must withhold it.');
  }
}

/* --- tile audio ---------------------------------------------------------------- */

for (const g of Object.keys(tileById)) {
  for (const [id, tile] of tileById[g]) {
    let any = false;
    const idx = manifest.tiles[g].indexOf(tile);
    for (const m of tileMediaRefs(tile, g, idx)) {
      if (takesRef(m.ref, m.at, 'pack.json')) any = true;
    }
    if (!any) warn(`tiles.${g}[${id}]`, 'no audio — the tile is silent when pressed. The round still works; the chant loses a step.');
  }
}

/* --- orphans ------------------------------------------------------------------- */

const onDisk = listMedia(packDir);
const orphans = onDisk.filter((m) => !referenced.has(m.ref));
const orphanBytes = orphans.reduce((n, m) => n + m.bytes, 0);
if (orphans.length) {
  warn('media/', `${orphans.length} unreferenced file(s), ${orphanBytes.toLocaleString()} bytes. These are normal: a word file is always written last, so a crash mid-import leaves a blob behind rather than a broken word. Sweep with --delete-orphans.`);
}
if (gc) {
  for (const m of orphans) {
    console.log(`${gcDelete ? 'deleted ' : 'orphan  '}${m.ref}  ${m.bytes.toLocaleString()} B`);
    if (gcDelete) rmSync(m.abs);
  }
}

/* ------------------------------------------------------------------------ report */

const imgBytes = onDisk.filter((m) => m.ref.startsWith('media/img/')).reduce((n, m) => n + m.bytes, 0);
const audBytes = onDisk.filter((m) => m.ref.startsWith('media/aud/')).reduce((n, m) => n + m.bytes, 0);
let jsonBytes = 0;
for (const { file } of wordsOk) jsonBytes += statSync(file).size;
if (existsSync(p.manifest)) jsonBytes += statSync(p.manifest).size;

const summary = {
  pack: path.relative(process.cwd(), packDir),
  language: lang ?? null,
  schema: manifest?.schema ?? null,
  words: wordsOk.length + wordsBad.length,
  unreadable: wordsBad.length,
  enabled: enabledCount,
  drafts: draftCount,
  playable,
  photographed,
  imagesMissing: imagesMissing.length,
  orphanFiles: orphans.length,
  bytes: { json: jsonBytes, images: imgBytes, audio: audBytes, total: jsonBytes + imgBytes + audBytes },
  errors: errors.length,
  warnings: warnings.length,
};

const failed = errors.length > 0 || (strict && warnings.length > 0);

if (asJson) {
  console.log(JSON.stringify({ ...summary, ok: !failed, errorList: errors, warningList: warnings }, null, 2));
} else {
  for (const w of warnings) console.log(`warn  ${w.where}: ${w.msg}`);
  for (const e of errors) console.log(`ERROR ${e.where}: ${e.msg}`);
  const kb = (n) => `${(n / 1024).toFixed(1)} KiB`;
  console.log(`
${summary.pack}  [${summary.language}, schema ${summary.schema}]
  words       ${summary.words} (${summary.enabled} enabled, ${summary.playable} playable, ${summary.photographed} photographed${summary.drafts ? `, ${summary.drafts} draft` : ''}${summary.unreadable ? `, ${summary.unreadable} UNREADABLE` : ''})
  media       ${kb(imgBytes)} images + ${kb(audBytes)} audio + ${kb(jsonBytes)} json = ${kb(summary.bytes.total)}${summary.words ? `  (${Math.round(summary.bytes.total / summary.words).toLocaleString()} B/word)` : ''}
  findings    ${errors.length} error(s), ${warnings.length} warning(s)${strict ? ' [--strict: warnings count as failure]' : ''}
  ${failed ? 'FAIL' : 'OK'}`);
}

process.exit(failed ? 1 : 0);
