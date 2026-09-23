#!/usr/bin/env node
// Build the seed content packs FROM the literacy-designer's documents.
//
//   node tools/build-seed-pack.mjs                 # both packs into packs/
//   node tools/build-seed-pack.mjs --lang vi --out packs
//
// WHY THIS EXISTS. The seed word list lives in `docs/design/word-list.md` and the tile
// inventories live in `literacy-vi.md` and `literacy-en.md`. Those documents are owned by
// the literacy-designer and are the only place the content is decided. Hand-copying them
// into JSON would create a second copy that drifts, and the drift would be invisible —
// the app would teach something the document does not say. So the packs are generated,
// and regenerating them is how a change to the word list reaches the child.
//
// This tool chooses NOTHING about content. Every word, tile, decomposition and picture
// concept comes out of a markdown table. What it adds is structure: ids, the composed
// toned rime forms (`literacy-vi.md` §5.4), the legal-tone sets (§5.2), and the empty
// media slots that `fetch-images.mjs` and `gen-audio.mjs` fill in later.
//
// It produces a pack with no media. That is a valid intermediate state and the validator
// reports it as such: `--strict` is what says "ready for a child".

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { readTables, plain, ticked } from './lib/markdown.mjs';
import * as R from './lib/rules.mjs';
import {
  SCHEMA, ensurePackDirs, writeManifest, writeWord, listWordFiles,
} from './lib/pack.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DOC = (f) => path.join(ROOT, 'docs', 'design', f);

/* ---------------------------------------------------------------------- arguments */

const argv = process.argv.slice(2);
let out = path.join(ROOT, 'packs');
let only = null;
let dialect = 'unset'; // open-questions.md Q1. `unset` is conservative, not a guess.
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === '--out') { out = path.resolve(argv[++i]); }
  else if (argv[i] === '--lang') { only = argv[++i]; }
  else if (argv[i] === '--dialect') { dialect = argv[++i]; }
  else { console.error(`unknown argument ${argv[i]}`); process.exit(2); }
}
if (!['unset', 'northern', 'southern'].includes(dialect)) {
  console.error(`--dialect must be northern, southern or unset`); process.exit(2);
}

/* --------------------------------------------------------------------------- ids */

/** Fold Vietnamese diacritics to ascii. `mèo` -> `meo`, `đèn` -> `den`. */
function fold(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

/**
 * A stable, readable, ascii id. Derived from the spelling, so a rebuild of the seed pack
 * produces the same ids; disambiguated by a hash when two spellings fold together, which
 * `bò` and `bơ` do. Ids are assigned at creation and never recomputed — the mother
 * changing a spelling must not rename a file out from under her media references.
 */
function makeId(text, taken) {
  const base = fold(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'word';
  if (!taken.has(base)) { taken.add(base); return base; }
  const id = `${base}-${createHash('sha256').update(text).digest('hex').slice(0, 4)}`;
  if (taken.has(id)) throw new Error(`cannot make a unique id for "${text}"`);
  taken.add(id);
  return id;
}

/* ----------------------------------------------------------- Vietnamese inventory */

function viOnsets() {
  const tables = readTables(DOC('literacy-vi.md'));
  const t = tables.find((x) => x.h2.startsWith('2. Onset inventory') && x.header.includes('Đánh vần name'));
  if (!t) throw new Error('literacy-vi.md: could not find the §2 onset inventory table');
  const out = [];
  for (const row of t.rows) {
    const glyph = plain(row.Tile);
    const name = plain(row['Đánh vần name']);
    // `∅` is the zero onset — the ABSENCE of a tile (literacy-vi.md §2, §7.2: a
    // zero-onset word has no onset step). It is represented as `onset: null` on the
    // word, never as a tile the child could press.
    if (!glyph || glyph === '∅') continue;
    if (!name) continue;
    if (/excluded from v1/i.test(row.Notes ?? '')) continue; // `p`
    out.push({
      id: glyph, glyph, label: name,
      audio: { name: null },
      source: 'literacy-vi.md §2',
    });
  }
  // `literacy-vi.md` §0.13 — the EDITOR's vocabulary, in Vietnamese dictionary order,
  // each digraph immediately after the base letter it extends. It is no longer the
  // board (§0.3), so it is ordered for the adult who reads it, not for the child.
  out.sort((a, b) => R.viCollate(a.id, b.id));
  return out;
}

function viToneTiles() {
  return R.VI_TONES.map((t) => ({
    id: t.id, glyph: null, label: t.name, mark: t.mark,
    // §5.3: the label is a per-tile string precisely so that "không dấu" can replace
    // "ngang" without a developer.
    audio: { name: null },
    source: 'literacy-vi.md §5.1',
  }));
}

function viRimeTiles(rimes) {
  return [...rimes].sort(R.viCollate).map((rime) => ({
    id: rime, glyph: rime,
    legalTones: R.viLegalTones(rime),
    toned: R.viTonedForms(rime), // §5.4 — six forms, null where illegal
    audio: { name: null },
    source: 'derived from word-list.md; see literacy-vi.md §3.2, §5.2, §5.4',
  }));
}

/* -------------------------------------------------------------- English inventory */

function enTiles() {
  const tables = readTables(DOC('literacy-en.md'));
  const pick = (h3Prefix) => tables.find((x) => x.h3.startsWith(h3Prefix) && x.header[0] === 'Tile');
  const cons = pick('3.1');
  const vowels = pick('3.2');
  const digraphs = pick('3.3');
  // The §3 headings are "### 3.1 Consonants (stage 1 onward)" style only if numbered;
  // fall back to matching on heading text.
  const find = (re) => tables.find((x) => re.test(x.h3) && x.header[0] === 'Tile');
  const c = cons ?? find(/Consonants/);
  const v = vowels ?? find(/Vowels/);
  const d = digraphs ?? find(/Digraphs/);
  if (!c || !v || !d) throw new Error('literacy-en.md: could not find the §3 tile tables');

  const out = [];
  const add = (glyph, kind, extra) => {
    if (R.EN_EXCLUDED.includes(glyph)) return;
    out.push({
      id: glyph, glyph, kind,
      position: R.EN_FINAL_ONLY.includes(glyph) ? 'final'
        : R.EN_INITIAL_ONLY.includes(glyph) ? 'initial' : 'any',
      // `sound` and `anchor` are CURRICULUM (decisions.md "Still open" #3). They are
      // filled from the approved manifest where one exists and left null otherwise, so
      // the gap is visible rather than invented here.
      sound: null, anchor: null,
      audio: { long: null, short: null },
      ...extra,
    });
  };
  for (const row of c.rows) {
    if (/excluded from v1/i.test(row.Notes ?? '')) continue;
    for (const g of ticked(row.Tile)) add(g, 'consonant', { source: 'literacy-en.md §3.1' });
  }
  for (const row of v.rows) {
    for (const g of ticked(row.Tile)) add(g, 'vowel', { source: 'literacy-en.md §3.2', keyWord: plain(row['Key word']) });
  }
  for (const row of d.rows) {
    const pos = plain(row.Position ?? '').toLowerCase();
    for (const g of ticked(row.Tile)) {
      add(g, 'digraph', {
        source: 'literacy-en.md §3.3',
        keyWord: plain(row['Key word']),
        ...(pos.includes('final only') ? { position: 'final' } : {}),
      });
    }
  }
  /*
   * EVERY LETTER OF THE ALPHABET IS ON THE BOARD (`literacy-en.md` §0.3, `ui.md` §8.1).
   *
   * `q` is excluded from v1 WORDS (§3.5 — no picturable CVC word) and the §3.1 table says
   * so in its Notes, which made the loop above skip it entirely. That is the wrong
   * granularity: revision 3's complaint was a MISSING LETTER, and revision 5 makes the
   * board literally `a`-`z`. A letter with no words behind it is permanently flat and
   * still speaks (AC D1b); it is not absent.
   *
   * This was a live defect, not a hypothetical: `q` had been hand-added to
   * `packs/en-seed/pack.json` after the fact, and the next rebuild would have silently
   * deleted it along with its two approved clips. Derived here, it cannot go missing.
   */
  const have = new Set(out.map((t) => t.id));
  for (const letter of R.EN_ALPHABET) {
    if (have.has(letter)) continue;
    out.push({
      id: letter,
      glyph: letter,
      kind: R.EN_VOWELS.includes(letter) ? 'vowel' : 'consonant',
      position: 'any',
      sound: null,
      anchor: null,
      audio: { long: null, short: null },
      source: 'ui.md §8.1 / literacy-en.md §0.3 — every letter of the alphabet is on the board; this one has no seed word and is permanently flat',
    });
  }

  // The approved English clip curriculum (decisions.md "Audio — closed").
  const manifestFile = path.join(ROOT, 'samples', 'audio', 'en-final', 'manifest.json');
  if (existsSync(manifestFile)) {
    const m = JSON.parse(readFileSync(manifestFile, 'utf8'));
    for (const tile of out) {
      const entry = m.letters?.[tile.id];
      if (entry) { tile.sound = entry.sound; tile.anchor = entry.anchor; }
    }
  }
  // `literacy-en.md` §0.7 — the alphabet, then the digraphs alphabetised among
  // themselves. English orthography has no convention that puts `ch` after `c`, and
  // inserting it there would break the alphabet the owner asked for.
  out.sort((a, b) => R.enCollate(a.id, b.id));
  return out;
}

/* ------------------------------------------------------------------ word building */

function viWords() {
  const tables = readTables(DOC('word-list.md')).filter((t) => t.h2.startsWith('4. Vietnamese'));
  const taken = new Set();
  const words = [];
  const rimes = new Set();
  for (const t of tables) {
    const stageMatch = /^Stage (\d+)/.exec(t.h3);
    const appendix = /Cultural vocabulary/i.test(t.h3);
    if (!stageMatch && !appendix) continue;
    for (const row of t.rows) {
      const text = plain(row.Word).normalize('NFC');
      if (!text) continue;
      const parts = (row.Decomposition ?? '').split('|').map((p) => plain(p)).filter((p) => p !== '');
      if (parts.length !== 3) throw new Error(`word-list.md: cannot read decomposition for "${text}": ${JSON.stringify(row.Decomposition)}`);
      const [rawOnset, rime, toneName] = parts;
      const onset = rawOnset === '∅' ? null : rawOnset;
      const tone = R.VI_TONE_BY_NAME[toneName.normalize('NFC')];
      if (!tone) throw new Error(`word-list.md: unknown tone "${toneName}" on "${text}"`);
      rimes.add(rime);
      const flags = plain(row.Flag).split('—')[0].trim().split(/\s+/).filter((f) => /^[A-Z]{3,}$/.test(f));
      words.push({
        id: makeId(text, taken),
        text,
        stage: stageMatch ? Number(stageMatch[1]) : null,
        // The three appendix words ship disabled: word-list.md keeps them out of the 47
        // "until a picture exists". They are in the pack so the editor can show them.
        enabled: !appendix,
        ...(appendix ? { disabledReason: 'no picture yet (word-list.md §4 appendix)' } : {}),
        syllables: [{ onset, rime, tone }], // literacy-vi.md §1.1 — array from day one
        // DERIVED, revision 5 (`literacy-vi.md` §0.5). The board is 29 letters, so the
        // engine walks LETTERS — but the onset/rime boundary is a property of the triple
        // above and is **stored, never re-derived at runtime**: `gì` is onset `gi` +
        // rime `i` written with a single `i`, and no letter stream can express that.
        // `syllables` stays the source of truth; these two are a projection of it.
        letters: R.viLetters(onset, rime),
        onsetLetterCount: R.viOnsetLetterCount(onset),
        fallbackEmoji: plain(row['Fluent fallback']) || null,
        images: [],
        audio: { word: null, blend: null, sentence: null },
        build: {
          assetConcept: plain(row['Picture concept']),
          flags,
          note: plain(row.Flag),
          from: `word-list.md §4 ${t.h3}`,
        },
      });
    }
  }
  return { words, rimes };
}

function enWords() {
  const tables = readTables(DOC('word-list.md')).filter((t) => t.h2.startsWith('5. English'));
  const taken = new Set();
  const words = [];
  for (const t of tables) {
    const stageMatch = /^Stage (\d+)/.exec(t.h3);
    if (!stageMatch) continue;
    for (const row of t.rows) {
      const text = plain(row.Word);
      if (!text) continue;
      const tiles = ticked(row.Tiles);
      if (!tiles.length) throw new Error(`word-list.md: no tiles for "${text}"`);
      const flags = plain(row.Flag).split('—')[0].trim().split(/\s+/).filter((f) => /^[A-Z]{3,}$/.test(f));
      words.push({
        id: makeId(text, taken),
        text,
        stage: Number(stageMatch[1]),
        enabled: true,
        tiles,
        // DERIVED, revision 5 (`literacy-en.md` §0.5). `tiles` is the SOUND
        // decomposition and stays (`duck` = `d` `u` `ck`); `letters` is what he taps
        // (`d` `u` `c` `k`). English concatenates exactly, so this is the spelling.
        letters: R.enLetters(text),
        fallbackEmoji: plain(row['Fluent fallback']) || null,
        images: [],
        audio: { word: null, sentence: null },
        build: {
          assetConcept: plain(row['Picture concept']),
          family: plain(row.Family) || null,
          flags,
          note: plain(row.Flag),
          from: `word-list.md §5 ${t.h3}`,
        },
      });
    }
  }
  return words;
}

/* ------------------------------------------------------------------------- build */

/**
 * A REBUILD MUST NOT DESTROY CURATION.
 *
 * This function regenerates the pack from the literacy documents, and the first version
 * of it deleted every word file and wrote fresh ones with `images: []` and
 * `audio: { word: null }`. That is correct for the parts the documents own — the
 * spelling, the decomposition, the stage — and catastrophic for the parts they do not:
 * a `word-list.md` typo fix would have wiped every curated photograph and every
 * generated clip in the pack, and the only sign would have been the pack getting
 * smaller.
 *
 * So the rebuild MERGES. The documents win on what the documents decide; everything a
 * human or a generator put there survives.
 *
 *   from the documents   text, stage, syllables/tiles, fallbackEmoji, build.*
 *   preserved            images, audio, enabled, draft, notes, any unknown key
 *
 * `enabled` is preserved for a word that already exists, because after creation it
 * belongs to whoever is maintaining the pack — a rebuild must not re-disable `phở` the
 * day after somebody finally found it a picture.
 */
function mergeWord(fresh, existing) {
  if (!existing) return fresh;
  const { text, stage, syllables, tiles, letters, onsetLetterCount, fallbackEmoji, build } = fresh;
  return {
    ...existing,                       // carries images, audio, draft, and unknown keys
    text,
    stage,
    ...(syllables ? { syllables } : {}),
    ...(tiles ? { tiles } : {}),
    // `letters` and `onsetLetterCount` are DERIVED from what the document owns, so the
    // document wins on them too — unlike `images` and `audio`, which are a human's work.
    // A word carrying `build.spellingException` keeps whatever is stored, because the
    // derivation is exactly what is wrong for it (`literacy-vi.md` §1.2, §0.5).
    ...(existing.build?.spellingException === true
      ? {}
      : {
        ...(letters ? { letters } : {}),
        ...(onsetLetterCount !== undefined ? { onsetLetterCount } : {}),
      }),
    fallbackEmoji,
    build: { ...existing.build, ...build },
  };
}

/** Tile curriculum and clips are not in the literacy documents; keep whatever is there. */
function mergeTile(fresh, existing) {
  if (!existing) return fresh;
  return {
    ...fresh,
    // §5.3: a tone tile's label is editable data ("không dấu" for "ngang").
    label: existing.label ?? fresh.label,
    // decisions.md "Still open" #3: sound and anchor are curriculum, supplied by hand.
    ...(existing.sound != null ? { sound: existing.sound } : {}),
    ...(existing.anchor != null ? { anchor: existing.anchor } : {}),
    audio: { ...fresh.audio, ...(existing.audio ?? {}) },
  };
}

/**
 * THE PREFIX STATES — `literacy-vi.md` §0.12, and why they are a manifest section of
 * their own rather than tiles.
 *
 * Revision 5 re-keys tile audio from *units* to **unit-states**. The child now taps `c`
 * and then `h`; `c` alone is a state (it says `cờ`) and so is `ch` (it says `chờ`), and
 * every tap must answer (§0.9). Most states are already tiles — `c`, `ch`, `ao`, `ăng`
 * all exist in `tiles` — but a handful are not:
 *
 *   onsets  `p` and `q`. Bare `p` and bare `q` are NEVER Vietnamese onsets (§0.6); they
 *           exist only as the first step toward `ph` and `qu`. They cannot be tiles,
 *           because a tile is something a word can be built from and §4 validates that.
 *   rimes   `ac an uô â ă ăn ư ưn`. Pass-through states on the way to a real rime; no
 *           tone is ever live on them, and three of them are the bare vowels §3.1 says
 *           can never stand alone.
 *
 * So they are NOT tiles and they are not on the board either — the board is 29 letters.
 * They are a lookup table of clips, keyed by the state, and the app resolves a tap as
 * "tiles first, then prefixAudio". Derived from the inventory (`prefixStates`), so when
 * his mother adds a word with the onset `ngh`, `ngh`'s prefixes follow automatically.
 *
 * `q` says `quờ`, which is what the `qu` tile already says — so it carries `sameAs` and
 * gen-audio copies that clip rather than synthesising a second, drifting one. One blob,
 * two references; the media is content-addressed, so this costs zero bytes.
 */
function viPrefixAudio(onsetTiles, rimeTiles) {
  const build1 = (tiles, role) => {
    const ids = tiles.map((t) => t.id);
    const labelOf = new Map(tiles.map((t) => [t.id, t.label ?? t.glyph ?? t.id]));
    return R.prefixStates(ids).sort(R.viCollate).map((id) => {
      const extendsTo = ids.filter((x) => x !== id && x.startsWith(id)).sort(R.viCollate);
      const says = R.viPrefixSpeech(id);
      // A prefix whose ONE extension already says exactly the same thing does not need a
      // clip of its own. Derived, not special-cased: today this picks out `q`/`qu` and
      // nothing else, and if his mother's inventory ever grows another such pair it will
      // pick that out too instead of generating a second, drifting recording.
      const sameAs = extendsTo.length === 1 && labelOf.get(extendsTo[0]) === says
        ? `${role}:${extendsTo[0]}` : null;
      return {
        id,
        glyph: id,
        role,
        label: says,                      // what it SAYS — §0.9. `ă` -> `á`, `â` -> `ớ`
        extendsTo,                        // provenance for the editor; not read at runtime
        // §0.9 cost 1: a partial rime read level is sometimes not a sound Vietnamese has.
        ...(role === 'rime' ? { needsListen: true } : {}),
        ...(sameAs ? { sameAs } : {}),
        audio: { name: null },
      };
    });
  };
  return { onset: build1(onsetTiles, 'onset'), rime: build1(rimeTiles, 'rime') };
}

function build(lang) {
  const dir = path.join(out, `${lang}-seed`);
  ensurePackDirs(dir);

  // Read what is already there BEFORE writing anything.
  const prior = new Map();
  for (const f of listWordFiles(dir)) {
    try { const w = JSON.parse(readFileSync(f, 'utf8')); if (w?.id) prior.set(w.id, w); }
    catch { /* an unreadable word file is the validator's problem, not the builder's */ }
  }
  let priorTiles = new Map();
  const priorPrefix = new Map();
  try {
    const m = JSON.parse(readFileSync(path.join(dir, 'pack.json'), 'utf8'));
    for (const [g, list] of Object.entries(m.tiles ?? {})) {
      for (const t of list) priorTiles.set(`${g}:${t.id}`, t);
    }
    for (const [g, list] of Object.entries(m.prefixAudio ?? {})) {
      for (const t of list) priorPrefix.set(`${g}:${t.id}`, t);
    }
  } catch { /* first build, or a broken manifest the validator will report */ }

  let tiles;
  let words;
  const manifestExtra = {};
  if (lang === 'vi') {
    const w = viWords();
    words = w.words;
    tiles = { onset: viOnsets(), rime: viRimeTiles(w.rimes), tone: viToneTiles() };
    /*
     * `inventoryOrder` IS THE BOARD (`ui.md` §13.7 E12), and revision 5 changed what it
     * holds: `{ letter, tone }`, not `{ onset, rime, tone }`. Nothing on the board is an
     * onset or a rime any more — 29 letters in the owner's order, then the six tones.
     *
     * It is GENERATED here for the first time. Both manifests used to carry a
     * hand-written list, which is how the shipped one came to be sorted by how many seed
     * words sat behind each symbol — the "really random and un-organized" table the owner
     * reported. A hand-edited ordering drifts the moment the word list changes; a
     * generated one cannot.
     *
     * The tone order is `ngang huyền sắc hỏi ngã nặng` — the set phrase, and the OWNER's
     * answer to `open-questions.md` Q11, asked directly. It ships as
     * `ngang sac huyen hoi nang nga`, which is frequency order and is wrong.
     */
    manifestExtra.inventoryOrder = { letter: R.VI_ALPHABET.slice(), tone: R.VI_TONE_IDS.slice() };
    manifestExtra.prefixAudio = viPrefixAudio(tiles.onset, tiles.rime);
    manifestExtra.dialect = dialect;
    manifestExtra.rules = {
      // literacy-vi.md §6.1 / §4.1 — read by the round generator as DATA, so that
      // changing the dialect changes the palette without a rebuild.
      neverTogether: R.viHomophoneSets(dialect),
      note: 'sets that must never appear together in one palette (literacy-vi.md §4.1, §6.1)',
    };
    manifestExtra.chant = {
      // literacy-vi.md §7.2. Starting values the game-designer tunes; data, not code.
      gapsMs: { onset: 250, rime: 250, blend: 400, tone: 250, word: 600 },
      skipToneStepFor: ['ngang'],
    };
  } else {
    words = enWords();
    tiles = { letter: enTiles() };
    // `literacy-en.md` §0.3 — `a`-`z`, one run, no digraphs. The ten digraphs stay in
    // `tiles` as the sound inventory and as the editor's vocabulary (§0.9: their clips
    // are kept and change role to the re-voicing a completed digraph plays), and English
    // has no tone run. Every English grapheme prefix is itself a grapheme (§0.5), so
    // unlike Vietnamese there is no `prefixAudio` and no new clip.
    manifestExtra.inventoryOrder = { letter: R.EN_ALPHABET.slice() };
    manifestExtra.rules = {
      neverTogether: R.EN_HOMOPHONE_SETS,
      note: 'literacy-en.md §6.2 — `c` and `k` are homophones in v1',
    };
    manifestExtra.chant = { gapsMs: { tile: 200, lastTile: 350, word: 600 } };
  }

  const manifest = {
    schema: SCHEMA,
    id: `${lang}-seed`,
    language: lang, // the ONLY place a language appears; no word carries one
    name: lang === 'vi' ? 'Ghép Chữ' : 'Word Blocks',
    revision: 1,
    origin: 'seed',
    generator: {
      tool: 'tools/build-seed-pack.mjs',
      builtAt: new Date().toISOString(),
      sources: ['docs/design/word-list.md', `docs/design/literacy-${lang}.md`],
    },
    /*
     * THE RENDER POLICY — `ui.md` §8.2 / E22, and it is generated for the same reason
     * `inventoryOrder` is. The owner answered `open-questions-ui.md` Q7: English tiles are
     * **UPPERCASE**. A hand-written value is exactly how the tone order drifted into
     * frequency order, and a casing flag is far easier to mistype than a tone list.
     *
     * Nothing under `display` may reach stored data, audio, ordering or any parent
     * surface (AC D19, D20, D24). That boundary is why the field is nested here rather
     * than sitting loose at the top level beside `dialect`.
     */
    display: { glyphCase: R.seedGlyphCase(lang) },
    media: {
      // The policy the runtime applies when a referenced file is not there.
      // See docs/design/content-pipeline.md §"When a file is missing".
      onMissingImage: 'fallbackEmoji-then-withhold',
      onMissingWordAudio: 'withhold',
      onMissingTileAudio: 'silent',
      imagesPerWord: { min: 1, target: 3, max: 6 },
      image: { format: 'jpeg', size: 512, quality: 82 },
      audio: {
        format: 'mp3',
        sampleRate: 24000,
        /*
         * THE CLIP DURATION BUDGET, as data — `ui.md` E15 / AC N15.
         *
         * The owner played the built app and reported that the English letter sounds
         * were "not good enough, voices seem to be mixed up with each other". The
         * shipped `short` clips measured 1896–2832 ms against a spec that assumed
         * 350 ms, because Microsoft's read-aloud endpoint pads ~1.6 s of silence around
         * every utterance and nothing trimmed it. A 4-year-old taps every 300–600 ms, so
         * the cut-on-next rule cut every clip inside its first fifth.
         *
         * `pack-validate.mjs` reads these and checks them against the BYTES.
         *
         *   tapTargetMs    E15's requirement. Over it is a warning, and an error under
         *                  --strict. Reaching it depends on what is said and how fast,
         *                  which is the owner's and the literacy-designer's to change.
         *   tapCeilingMs   a hard error. Above the content, far below the defect.
         *   leadTargetMs / tailTargetMs  advisory: seeing them needs a decoder.
         */
        tapTargetMs: 700,
        tapCeilingMs: 1500,
        longCeilingMs: 2500,
        leadTargetMs: 40,
        tailTargetMs: 120,
      },
    },
    ...manifestExtra,
    tiles,
  };

  // Merge before writing: documents win on what they own, curation survives.
  for (const g of Object.keys(manifest.tiles)) {
    manifest.tiles[g] = manifest.tiles[g].map((t) => mergeTile(t, priorTiles.get(`${g}:${t.id}`)));
  }
  // The prefix states are derived, but their CLIPS are not — a recording of `ac` in his
  // mother's voice must survive a rebuild exactly as a tile's clip does.
  for (const g of Object.keys(manifest.prefixAudio ?? {})) {
    manifest.prefixAudio[g] = manifest.prefixAudio[g]
      .map((t) => mergeTile(t, priorPrefix.get(`${g}:${t.id}`)));
  }
  const merged = words.map((w) => mergeWord(w, prior.get(w.id)));

  // A word removed from the document is removed from the pack — that is what a rebuild
  // is for — but it is named out loud, because it may be somebody's curated work and its
  // media is left behind as orphans rather than deleted.
  const live = new Set(merged.map((w) => w.id));
  const dropped = [...prior.keys()].filter((id) => !live.has(id));
  for (const id of dropped) rmSync(path.join(dir, 'words', `${id}.json`));

  writeManifest(dir, manifest);
  for (const w of merged) writeWord(dir, w);

  const kept = merged.filter((w) => (w.images?.length ?? 0) > 0 || w.audio?.word).length;
  if (kept) console.log(`  preserved media on ${kept}/${merged.length} word(s)`);
  if (dropped.length) {
    console.log(`  REMOVED ${dropped.length} word(s) no longer in the document: ${dropped.join(', ')}`);
    console.log('  their media is now orphaned; sweep with: pack-validate.mjs --delete-orphans');
  }

  const tileCount = Object.values(manifest.tiles).reduce((n, g) => n + g.length, 0);
  const boardCells = Object.values(manifest.inventoryOrder).reduce((n, g) => n + g.length, 0);
  const prefixCount = Object.values(manifest.prefixAudio ?? {}).reduce((n, g) => n + g.length, 0);
  console.log(`${lang}: ${merged.length} words (${merged.filter((w) => w.enabled).length} enabled), ${tileCount} tiles, ${prefixCount} prefix state(s), ${boardCells} board cells -> ${path.relative(ROOT, dir)}`);
  return { dir, words: merged, tiles: manifest.tiles };
}

for (const lang of ['vi', 'en']) {
  if (only && only !== lang) continue;
  build(lang);
}
