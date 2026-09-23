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
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as R from './lib/rules.mjs';
import { parseFrames } from './lib/mp3.mjs';
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
const keptByRank = new Map();
const keptImages = new Map();
let enabledCount = 0;
const imagesMissing = [];

/**
 * THE CLIP DURATION BUDGET — `ui.md` E15 / AC N15, and the reason it exists.
 *
 * The owner played the built app and said the English letter sounds were "not good
 * enough, voices seem to be mixed up with each other". `ui.md` §11.0 measured the shipped
 * clips: `short` was 1896–2832 ms against a spec that assumed 350 ms. A child taps every
 * 300–600 ms, so the cut-on-next rule cut every clip inside its first fifth and what he
 * heard was stubs of one slow adult voice. The cause was a fixed ~1.6 s block of silence
 * that Microsoft's read-aloud endpoint pads around every utterance and the generator
 * never removed.
 *
 * The app cannot fix that, so it has to be impossible for it to come back. The budget
 * lives in the manifest as DATA, like the degradation policy beside it, and it is checked
 * against the BYTES: `lib/mp3.mjs` sums the frame table, which is exact and needs no
 * decoder. It deliberately does not trust `audio.ms` — a number written into the file by
 * whoever wrote the file is a claim, and this project has been burnt by claims.
 *
 * TWO THRESHOLDS, BECAUSE THEY HAVE DIFFERENT OWNERS.
 *
 *   tapCeilingMs   ERROR.  Nothing this long may enter a pack. Set well above what the
 *                  content is, and well below the defect: the padding put every clip at
 *                  ~2000–2800 ms, so its return fails here immediately.
 *   tapTargetMs    E15's 700 ms. WARNING, and an error under `--strict`. Whether a clip
 *                  can reach it depends on what is said and how fast it is said — the
 *                  curriculum text and the TTS rate — and both of those are the owner's
 *                  and the literacy-designer's, not this tool's. So it is reported on
 *                  every run and it does not silently pass.
 *
 * WHAT THIS CHECK CANNOT DO. Duration is a PROXY. It cannot tell whether a clip is
 * intelligible, whether it is the right sound, or whether the sound in it is any good —
 * CLAUDE.md is explicit that audio cannot be verified below the owner, and two rounds of
 * English audio have already been rejected by ear after passing every number. It also
 * cannot see leading or trailing silence, which needs a decoder; `audio.leadMs` and
 * `audio.tailMs` are recorded by whoever opened the file and are reported as advisory.
 */
const AUDIO_BUDGET = { tapTargetMs: 700, tapCeilingMs: 1500, longCeilingMs: 2500, leadTargetMs: 40, tailTargetMs: 120 };
// The slots a single tap plays. `ui.md` §11.2: "a tap always plays `short`"; Vietnamese
// tiles carry one clip called `name` and it is what a tap plays there.
const TAP_SLOTS = new Set(['short', 'name']);
// A sentence is a sentence. Nothing budgets it, and nothing fires it from a tap.
const UNBUDGETED_SLOTS = new Set(['sentence']);

const audioBudget = () => ({ ...AUDIO_BUDGET, ...(manifest?.media?.audio ?? {}) });

const overTarget = [];
const overLead = [];
const msMismatch = [];
const audioRefs = [];   // every clip that survived takesRef, for the decode pass below

/*
 * THE DECODE CHECK — every clip must decode with NO decoder diagnostics.
 *
 * This exists because of a defect this tool shipped. `audio-trim.mjs` cut engine padding
 * at MP3 frame boundaries and verified the result by decoding it and comparing samples
 * against the original. That check passed on every clip. It was not enough: Layer III
 * stores a frame's data up to 255 bytes behind it in the bit reservoir, a cut orphans the
 * first retained frame from data no longer in the file, and **libmpg123 conceals the
 * underrun** — it decodes the frame with whatever bits it has and carries on. The samples
 * matched while 29 of 70 clips were emitting
 *
 *     part2_3_length (1056) too large for available bit count (1048)
 *
 * on their FIRST frame, which is the start of the letter sound — the first thing the child
 * hears on every tap, in the very clips the owner had already reported as wrong. Another
 * decoder is free to click, mute or drop those frames instead, and nobody on this team can
 * hear it to rule that out.
 *
 * So the check is not "do the samples match" but "does the decoder complain". Only a
 * decoder can answer it, which means the venv: `content-pipeline.md` §9.4 records that
 * `soundfile` here is built against libsndfile 1.2.2 and reads mp3, so this needs no new
 * dependency — but it does need the venv to exist, and when it does not the check SAYS it
 * was skipped rather than passing quietly. A skipped check that announces itself is
 * honest; one that reports success is the thing CLAUDE.md warns about.
 */
const VENV_PY = path.join(path.dirname(fileURLToPath(import.meta.url)), '.venv', 'bin', 'python');
const MEASURE_PY = path.join(path.dirname(fileURLToPath(import.meta.url)), 'audio-measure.py');

const decodeAllAudio = () => {
  if (!audioRefs.length) return;
  if (!existsSync(VENV_PY) || !existsSync(MEASURE_PY)) {
    warn('audio', `${audioRefs.length} clip(s) were NOT decode-checked: no venv at ${path.relative(packDir, VENV_PY)}. A malformed frame stream that still has valid magic bytes and a valid frame table would not be caught. See content-pipeline.md §12 Setup.`);
    return;
  }
  const files = audioRefs.map((a) => path.join(packDir, a.ref));
  const rows = [];
  try {
    for (let i = 0; i < files.length; i += 60) {
      const out = execFileSync(VENV_PY, [MEASURE_PY, '--jsonl', ...files.slice(i, i + 60)],
        { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] });
      for (const line of out.trim().split('\n')) if (line) rows.push(JSON.parse(line));
    }
  } catch (e) {
    warn('audio', `the decode check could not run (${e.message.split('\n')[0]}); ${audioRefs.length} clip(s) were not checked`);
    return;
  }
  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i];
    const a = audioRefs[i] ?? {};
    if (!r.ok) { err(a.where ?? 'audio', `${a.name ?? r.path} does not decode: ${r.error}`); continue; }
    if (r.silent) { warn(a.where ?? 'audio', `${a.name ?? r.path} decodes to silence — a silent mp3 is a valid mp3 and a broken asset.`); }
    if (!r.cleanDecode) {
      err(a.where ?? 'audio', `${a.name ?? r.path} decodes with ${r.diagnostics.length} decoder diagnostic(s) — the stream is malformed even though its samples may look right: ${r.diagnostics.join(' | ')}. A bit-reservoir underrun looks exactly like this and lands on the first frames. Do not ship it: another decoder may click, mute or drop them.`);
    }
  }
};

const checkClip = (m, where, label) => {
  if (m.kind !== 'audio') return;
  const slot = m.at.replace(/^.*audio\./, '').replace(/\.src$/, '');
  if (UNBUDGETED_SLOTS.has(slot)) return;
  const b = audioBudget();
  const abs = path.join(packDir, m.ref);
  let t;
  try { t = parseFrames(readFileSync(abs)); } catch (e) {
    err(where, `${m.at} ${m.ref}: cannot read its MPEG frames (${e.message}). The magic bytes said mp3, so this is a truncated or corrupt file — which is exactly the case a magic-byte sniff cannot catch on its own (content-pipeline.md §6).`);
    return;
  }
  const ms = Math.round(t.durationMs);
  const tap = TAP_SLOTS.has(slot);
  audioRefs.push({ ref: m.ref, where, name: `${label ?? m.at}.${slot}` });
  const ceiling = tap ? (b.tapCeilingMs ?? AUDIO_BUDGET.tapCeilingMs) : (b.longCeilingMs ?? AUDIO_BUDGET.longCeilingMs);
  const name = `${label ?? m.at}.${slot}`;
  if (ms > ceiling) {
    err(where, `${name} is ${ms} ms of audio; this pack's ceiling for a ${tap ? 'tap' : 'non-tap'} clip is ${ceiling} ms. ui.md §11.0: a clip far longer than the 300-600 ms between a 4-year-old's taps is cut inside its first fifth, and what he hears is a stub of an adult voice rather than a sound. Suspect untrimmed engine padding: node tools/audio-trim.mjs --pack <pack>`);
    return;
  }
  const target = b.tapTargetMs ?? AUDIO_BUDGET.tapTargetMs;
  if (tap && ms > target) overTarget.push(`${name} ${ms} ms`);
  const claimed = m.obj && typeof m.obj.ms === 'number' ? m.obj.ms : null;
  if (claimed != null && Math.abs(claimed - ms) > 50) msMismatch.push(`${name}: says ${claimed} ms, frames say ${ms} ms`);
  const lead = m.obj && typeof m.obj.leadMs === 'number' ? m.obj.leadMs : null;
  if (tap && lead != null && lead > (b.leadTargetMs ?? AUDIO_BUDGET.leadTargetMs)) overLead.push(`${name} ${lead} ms`);
};

/** One warning per category, not one per clip — 139 lines of it buries the licence findings. */
const reportClipBudget = () => {
  const b = audioBudget();
  if (overTarget.length) {
    warn('audio', `${overTarget.length} tap clip(s) exceed ui.md E15's ${b.tapTargetMs ?? AUDIO_BUDGET.tapTargetMs} ms target (all are under this pack's ${b.tapCeilingMs ?? AUDIO_BUDGET.tapCeilingMs} ms ceiling, so the pack is valid). Closing the gap means changing WHAT is said or HOW FAST, and both are the owner's call, not this tool's: ${overTarget.join(', ')}`);
  }
  if (overLead.length) {
    warn('audio', `${overLead.length} tap clip(s) record more than ${b.leadTargetMs ?? AUDIO_BUDGET.leadTargetMs} ms of leading silence. ADVISORY — this is the file's own record, not something this validator can decode. A lossless MP3 frame cut cannot land closer than two frames (48 ms at 24 kHz) without corrupting the first frames of the sound through Layer III's bit reservoir; see tools/audio-trim.mjs: ${overLead.slice(0, 6).join(', ')}${overLead.length > 6 ? `, and ${overLead.length - 6} more` : ''}`);
  }
  if (msMismatch.length) {
    warn('audio', `${msMismatch.length} clip(s) claim a duration their bytes do not support. The bytes win; something wrote an ms it had not measured: ${msMismatch.slice(0, 6).join('; ')}${msMismatch.length > 6 ? `, and ${msMismatch.length - 6} more` : ''}`);
  }
};

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
    if (present) checkClip(m, rel, `${word.id}`);
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
      // A missing AUTHOR is only a breach for licences that require attribution. Public
      // domain, PDM and CC0 require none, and demanding one there is not "safe" -- it
      // silently deletes usable photographs. This rule already cost a good pile-of-oranges
      // image under `cam` and two more under `đèn` and `mũi` before it was noticed.
      // `licence` and `sourceUrl` are still required for every third-party image, because
      // without them nobody can check the claim that attribution is unnecessary.
      const lic = String(im.license ?? '');
      const attributionFree = /public domain|^\s*pdm\b|\bcc0\b|no known copyright/i.test(lic);
      const required = attributionFree
        ? ['license', 'sourceUrl']
        : ['license', 'sourceUrl', 'creator'];
      for (const k of required) {
        if (!im[k]) {
          err(rel, `${at} came from ${JSON.stringify(im.source)} and has no "${k}". A CC BY or CC BY-SA image shipped without author, licence and a link back is a licence breach, and the attributions screen is generated from the pack — there is nowhere else for this to come from.`);
        }
      }
      if (attributionFree && !im.creator) {
        warn(rel, `${at} is ${lic || 'public domain'} and names no author, which that licence does not require. Recorded so the attributions screen can credit it anyway where a name is known.`);
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
    // GFDL is a heavier obligation than CC BY-SA and arrives looking like just another
    // free licence on Commons. GFDL 1.2 *without* "or later" cannot be relicensed under
    // CC BY-SA, and the licence requires the FULL licence text to travel with the work —
    // which for an app means shipping the GFDL itself, not a line in a credits table.
    // Harmless for a private family app; a real decision before publishing.
    if (/\bGFDL\b|GNU Free Documentation/i.test(im.license ?? '')) {
      warn(rel, `${at} is licensed ${im.license}. GFDL requires the full licence text to ship with the work, and 1.2-only cannot be relicensed as CC BY-SA. Fine privately; replace it before publishing (open-questions-content.md C5).`);
    }
  });

  const wordAudio = word.audio?.word;
  const hasWordAudio = !!(wordAudio && typeof wordAudio === 'object' && wordAudio.src && existsSync(path.join(packDir, wordAudio.src)));

  // Is this word playable at all? A word the child can never be shown is not an error —
  // it is simply withheld from the round generator and shown to his mother as needing
  // work. It becomes an error under --strict.
  const hasPicture = liveImages > 0 || (typeof word.fallbackEmoji === 'string' && word.fallbackEmoji);
  // NO PICTURE BY ANY ROUTE. Reported whether the word is enabled or not, because the
  // disabled ones are exactly where it hides: `phở`, `nón` and `bún` ship disabled until
  // a photograph exists, and `bún` has no emoji fallback either — so if photo resolution
  // fails it has no picture by any means and nothing else in the report would say so.
  if (liveImages === 0 && !word.fallbackEmoji) {
    warn(rel, 'has no photograph AND no fallbackEmoji — there is no route to a picture for this word at all. It can never be shown to the child until one is curated.');
  }
  // Counted regardless of `enabled`: a disabled word with photographs is curated work,
  // and reporting it as 0 would hide exactly the progress this number exists to show.
  if (liveImages > 0) photographed += 1;
  keptImages.set(word.id, images);
  if (enabled) {
    if (liveImages === 0 && word.fallbackEmoji) {
      // Playable, but on the FALLBACK. decisions.md made real photographs primary and
      // Fluent Emoji the thing you use when no acceptable photo was found — so a word
      // running on the emoji is a word nobody has curated yet, and `--strict` (which
      // means "ready for a child") must say so rather than count it as finished.
      warn(rel, `has no photograph and is falling back to the "${word.fallbackEmoji}" emoji. Playable, but decisions.md makes real photographs primary — this word has not been curated.`);
    }
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
      if (takesRef(m.ref, m.at, 'pack.json')) { any = true; checkClip(m, 'pack.json', `${g}[${id}]`); }
    }
    if (!any) warn(`tiles.${g}[${id}]`, 'no audio — the tile is silent when pressed. The round still works; the chant loses a step.');
  }
}

decodeAllAudio();
reportClipBudget();

/* --- yield ---------------------------------------------------------------------- */

/**
 * CURATION YIELD. How many candidates were offered against how many a human kept, split
 * by which stream offered them.
 *
 * Without this the fetcher reports "8 candidates" whether they are eight tigers or seven
 * engravings and a museum diorama of a mammoth, and a change to where the variety images
 * come from can only be judged by looking at sheets and guessing. With it, the effect of
 * a sourcing change is a number.
 *
 * The offered count lives on the word (`build.fetched`), written at curation time, and
 * falls back to the candidate sheet. That ordering was learned the hard way: reading it
 * only from `.candidates/` meant clearing the scratch between fetch runs silently erased
 * the denominator for every word already curated.
 */
const fetchedByRank = new Map();
let candidateWords = 0;
const candDir = path.join(packDir, '.candidates');

for (const { word } of wordsOk) {
  const kept = keptImages.get(word.id) ?? [];
  // ONLY COUNT WORDS A HUMAN HAS ACTUALLY REVIEWED. Curation runs for weeks, and
  // counting a fetched-but-unreviewed word as "0 kept" would drag every percentage
  // towards zero and make the table say more about how far the curator has got than
  // about how good the source is. The first version did exactly that and reported the
  // lead image at 16% when the curator's own count was four good leads out of four.
  if (!kept.length) continue;

  // The sheet, if the scratch directory still has it. Needed for the title-matching
  // backfill below, and nothing else.
  let sheet = null;
  const f = path.join(candDir, word.id, 'candidates.json');
  if (existsSync(f)) {
    try { const j = JSON.parse(readFileSync(f, 'utf8')); if (Array.isArray(j)) sheet = j; } catch { sheet = null; }
  }

  // How many were OFFERED, by stream. `build.fetched` is written into the word at
  // curation time and survives the scratch being cleared — which is what actually
  // happens between fetch runs, and it took the denominator for five already-curated
  // words with it. The sheet is only the fallback.
  let offered = null;
  if (word.build?.fetched) {
    offered = Object.fromEntries(Object.entries(word.build.fetched).filter(([k]) => k !== 'at'));
  } else if (sheet) {
    offered = sheet.reduce((a, c) => { const r = c?.rank ?? 'unrecorded'; a[r] = (a[r] ?? 0) + 1; return a; }, {});
  }
  if (!offered) continue;

  candidateWords += 1;
  for (const [r, c] of Object.entries(offered)) fetchedByRank.set(r, (fetchedByRank.get(r) ?? 0) + c);

  for (const im of kept) {
    // Images imported before `rank` existed carry none. Match them back to the sheet by
    // title, which is what the curator actually picked from.
    let r = im?.rank ?? null;
    if (!r && sheet && im?.title) {
      r = sheet.find((c) => c?.title && (c.title === im.title || im.title.startsWith(c.title)))?.rank ?? null;
    }
    keptByRank.set(r ?? 'unrecorded', (keptByRank.get(r ?? 'unrecorded') ?? 0) + 1);
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
  yield: { fetched: Object.fromEntries(fetchedByRank), kept: Object.fromEntries(keptByRank) },
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
  if (fetchedByRank.size) {
    const totalFetched = [...fetchedByRank.values()].reduce((a, b) => a + b, 0);
    const totalKept = [...keptByRank.values()].reduce((a, b) => a + b, 0);
    const pct = (k, f) => (f ? `${Math.round((100 * k) / f)}%` : '—');
    console.log(`
  curation yield across ${candidateWords} reviewed word(s) — offered by the fetcher vs kept by a human`);
    for (const r of ['lead', 'article', 'category', 'unrecorded']) {
      const f = fetchedByRank.get(r) ?? 0;
      const k = keptByRank.get(r) ?? 0;
      if (!f && !k) continue;
      console.log(`    ${r.padEnd(11)} ${String(k).padStart(3)} kept / ${String(f).padStart(3)} offered   ${pct(k, f)}`);
    }
    console.log(`    ${'TOTAL'.padEnd(11)} ${String(totalKept).padStart(3)} kept / ${String(totalFetched).padStart(3)} offered   ${pct(totalKept, totalFetched)}`);
  }
  console.log(`
${summary.pack}  [${summary.language}, schema ${summary.schema}]
  words       ${summary.words} (${summary.enabled} enabled, ${summary.playable} playable, ${summary.photographed} photographed${summary.drafts ? `, ${summary.drafts} draft` : ''}${summary.unreadable ? `, ${summary.unreadable} UNREADABLE` : ''})
  media       ${kb(imgBytes)} images + ${kb(audBytes)} audio + ${kb(jsonBytes)} json = ${kb(summary.bytes.total)}${summary.words ? `  (${Math.round(summary.bytes.total / summary.words).toLocaleString()} B/word)` : ''}
  findings    ${errors.length} error(s), ${warnings.length} warning(s)${strict ? ' [--strict: warnings count as failure]' : ''}
  ${failed ? 'FAIL' : 'OK'}`);
}

process.exit(failed ? 1 : 0);
