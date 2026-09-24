// `src/engine/rules.mjs` and `tools/lib/rules.mjs` must never disagree about the
// orthography. If they do, the validator passes packs the app rejects, or worse the
// other way round.
//
// They are two files on purpose — the runtime copy deliberately omits the tone-mark
// placer, which `acceptance-criteria.md` K5 forbids from existing in a runtime path — so
// the guarantee cannot be "it is the same module". It is this test: every onset × every
// rime, every rime's legal tone set, every dialect, both English inventories, run
// through both and asserted identical.

import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../src/engine/rules.mjs';
import * as tools from '../tools/lib/rules.mjs';
import { viPack } from './helpers/load.mjs';
import { STRIP_CELLS } from '../src/layout/layout.mjs';

const ONSETS = ['b', 'c', 'k', 'qu', 'ch', 'd', 'đ', 'g', 'gh', 'gi', 'h', 'kh', 'l', 'm',
  'n', 'ng', 'ngh', 'nh', 'ph', 'r', 's', 't', 'th', 'tr', 'v', 'x'];

test('the two ALPHABETS are identical — the board and the validator agree on its letters', () => {
  // **New in revision 5.** The board is the alphabet (`literacy-vi.md` §0.13,
  // `literacy-en.md` §0.3), and the runtime carries its own copy so that a letter lost
  // from a hand-edited `inventoryOrder` can be put back (`content-pipeline.md` §3.7). Two
  // copies of the alphabet that could disagree is exactly the shape this file exists for.
  assert.deepEqual(engine.VI_ALPHABET, tools.VI_ALPHABET);
  assert.deepEqual(engine.EN_ALPHABET, tools.EN_ALPHABET);
  assert.equal(engine.VI_ALPHABET.length, 29);
  assert.equal(engine.EN_ALPHABET.length, 26);
  // Both are NFC and single characters, or the strip would measure a letter as two.
  for (const alphabet of [engine.VI_ALPHABET, engine.EN_ALPHABET]) {
    for (const letter of alphabet) {
      assert.equal([...letter.normalize('NFC')].length, 1, `"${letter}" is not one character`);
      assert.equal(letter, letter.normalize('NFC'));
    }
  }
  // `f j w z` are not Vietnamese letters; `đ ă â ê ô ơ ư` are not English ones.
  for (const letter of ['f', 'j', 'w', 'z']) {
    assert.equal(engine.VI_ALPHABET.includes(letter), false, `${letter} is on the Vietnamese board`);
    assert.equal(engine.EN_ALPHABET.includes(letter), true);
  }
  for (const letter of ['đ', 'ă', 'â', 'ê', 'ô', 'ơ', 'ư']) {
    assert.equal(engine.EN_ALPHABET.includes(letter), false, `${letter} is on the English board`);
  }
});

test('E22 — the runtime and the validator read `display.glyphCase` the same way', () => {
  // Two copies of D23's fallback would be two chances to disagree about what the owner
  // chose, and the app's copy is the one the child sees (`content-pipeline.md` §3.8).
  assert.deepEqual(engine.GLYPH_CASES, tools.GLYPH_CASES);
  assert.equal(engine.DEFAULT_GLYPH_CASE, tools.DEFAULT_GLYPH_CASE);
  const manifests = [
    undefined, null, {}, { display: null }, { display: 'upper' }, { display: [] },
    { display: {} }, { display: { glyphCase: 'upper' } }, { display: { glyphCase: 'UPPER' } },
    { display: { glyphCase: 'lower' } }, { display: { glyphCase: '' } },
    { display: { glyphCase: true } }, { display: { glyphCase: 'uppercase' } },
  ];
  let upper = 0;
  for (const m of manifests) {
    const a = engine.readGlyphCase(m);
    assert.equal(a, tools.readGlyphCase(m), `readGlyphCase disagrees on ${JSON.stringify(m)}`);
    if (a === 'upper') upper += 1;
  }
  assert.equal(upper, 1, 'only the one well-formed `upper` may read as upper');
});

test('the strip cap is the same number in the engine and in the layout law', () => {
  // `MAX_WORD_LETTERS` is `STRIP_CELLS`: the engine withholds a word the strip cannot
  // draw, and the layout law refuses a viewport that cannot draw six cells. Two numbers
  // that must be one (`ui.md` §4.2, AC X6, E20, F17).
  assert.equal(engine.MAX_WORD_LETTERS, STRIP_CELLS);
  assert.equal(engine.MAX_WORD_LETTERS, 6);
  // **Three copies now, not two.** Slice 4 gave the validator the same cap (X7), because
  // a pack carrying a seven-letter word used to validate clean while the app withheld the
  // word — so the only signal his mother ever got was a word that stopped appearing.
  assert.equal(tools.MAX_WORD_LETTERS, engine.MAX_WORD_LETTERS);
});

test('the tone inventory is identical', () => {
  assert.deepEqual(engine.VI_TONE_IDS, tools.VI_TONE_IDS);
});

test('the checked-syllable rule agrees on every rime in the pack', () => {
  const pack = viPack();
  for (const r of pack.tiles.rime) {
    assert.equal(engine.viIsStopFinal(r.id), tools.viIsStopFinal(r.id), r.id);
    assert.deepEqual(engine.viLegalTones(r.id), tools.viLegalTones(r.id), r.id);
  }
});

test('the c/k, g/gh, ng/ngh rule agrees on every onset × rime pair', () => {
  const pack = viPack();
  let pairs = 0;
  let rejected = 0;
  for (const onset of [...ONSETS, null]) {
    for (const r of pack.tiles.rime) {
      const a = engine.viCheckSpellingRule(onset, r.id);
      const b = onset === null ? null : tools.viCheckSpellingRule(onset, r.id);
      assert.equal(a, b, `${onset} + ${r.id}`);
      pairs += 1;
      if (a !== null) rejected += 1;
    }
  }
  // If the rule rejected nothing, the comparison above would be vacuously true.
  assert.ok(rejected > 0, 'the spelling rule rejected nothing — the comparison proved nothing');
  assert.equal(pairs, (ONSETS.length + 1) * pack.tiles.rime.length);
});

test('viFirstVowel agrees on every rime', () => {
  const pack = viPack();
  for (const r of pack.tiles.rime) {
    assert.equal(engine.viFirstVowel(r.id), tools.viFirstVowel(r.id), r.id);
  }
});

test('the dialect homophone sets agree', () => {
  for (const dialect of ['northern', 'southern', 'unset', undefined, 'nonsense']) {
    assert.deepEqual(engine.viHomophoneSets(dialect), tools.viHomophoneSets(dialect), String(dialect));
  }
});

test('the English inventories agree', () => {
  assert.deepEqual(engine.EN_VOWELS, tools.EN_VOWELS);
  assert.deepEqual(engine.EN_FINAL_ONLY, tools.EN_FINAL_ONLY);
  assert.deepEqual(engine.EN_INITIAL_ONLY, tools.EN_INITIAL_ONLY);
  assert.deepEqual(engine.EN_EXCLUDED, tools.EN_EXCLUDED);
  assert.deepEqual(engine.EN_HOMOPHONE_SETS, tools.EN_HOMOPHONE_SETS);
});

test('the runtime copy does not carry the tone-mark placer (acceptance-criteria K5)', () => {
  assert.equal(engine.viApplyTone, undefined);
  assert.equal(engine.viTonedForms, undefined);
  // ...and the tools copy does, so this assertion is not vacuous.
  assert.equal(typeof tools.viApplyTone, 'function');
});

test('the rules catch what they are meant to catch — the fault injected by hand', () => {
  // `literacy-vi.md` §4.1: `ngh` before the rime `a` teaches a spelling that does not
  // exist; `c` before `em` is `kem`, not `cem`.
  assert.ok(engine.viCheckSpellingRule('ngh', 'a'));
  assert.ok(engine.viCheckSpellingRule('c', 'em'));
  assert.ok(engine.viCheckSpellingRule('g', 'ê'));
  assert.equal(engine.viCheckSpellingRule('ngh', 'e'), null);
  assert.equal(engine.viCheckSpellingRule('k', 'em'), null);
  assert.equal(engine.viCheckSpellingRule('qu', 'at'), null, 'qu is exempt (§4.1)');
});
