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

const ONSETS = ['b', 'c', 'k', 'qu', 'ch', 'd', 'đ', 'g', 'gh', 'gi', 'h', 'kh', 'l', 'm',
  'n', 'ng', 'ngh', 'nh', 'ph', 'r', 's', 't', 'th', 'tr', 'v', 'x'];

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
