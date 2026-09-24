// `src/editor/tone.mjs` and `tools/lib/rules.mjs` must never disagree about where a tone
// mark goes.
//
// They are two files on purpose, for the same reason `src/layout/layout.mjs` transcribes
// `tools/layout-sweep.mjs`: the app must not bundle the asset pipeline. So the guarantee
// cannot be "it is the same module" — it is this file. Every rime in the shipped pack,
// every rime the editor's own help screen can propose, and every tone, run through both
// and asserted identical.
//
// The stake is concrete. `tools/lib/rules.mjs` built the 35 rimes his mother reads today;
// `src/editor/tone.mjs` builds the ones she adds tomorrow. If they drift, her pack has two
// spellings of the same orthography in it and the one she added is the wrong one.

import test from 'node:test';
import assert from 'node:assert/strict';

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import * as tools from '../tools/lib/rules.mjs';
import { viApplyTone, viStripTone, viTonedForms, VI_TONE_MARKS } from '../src/editor/tone.mjs';
import { viLegalTones, VI_TONE_IDS } from '../src/engine/rules.mjs';
import { viPack, REPO } from './helpers/load.mjs';

/** Every rime the two packs know, plus the shapes the seed list does not cover. */
const EXTRA_RIMES = [
  'uông', 'iêng', 'oai', 'ươi', 'uôi', 'ay', 'oa', 'oe', 'uy', 'ia', 'ua', 'ưa',
  'iêu', 'ươu', 'oat', 'uôc', 'ach', 'anh', 'ênh', 'inh', 'ong', 'ông', 'ung',
  'a', 'ă', 'â', 'e', 'ê', 'i', 'o', 'ô', 'ơ', 'u', 'ư', 'y',
];

test('the tone marks are the same six characters', () => {
  assert.deepEqual(Object.keys(VI_TONE_MARKS), VI_TONE_IDS);
  for (const tone of tools.VI_TONES) {
    assert.equal(VI_TONE_MARKS[tone.id], tone.mark ?? null, tone.id);
  }
});

test('the placer agrees with the pipeline on every rime and every tone', () => {
  const rimes = [...new Set([...viPack().tiles.rime.map((r) => r.id), ...EXTRA_RIMES])];
  assert.ok(rimes.length >= 50, `only ${rimes.length} rimes under test`);
  let compared = 0;
  for (const rime of rimes) {
    for (const tone of VI_TONE_IDS) {
      let expected = null;
      try { expected = tools.viApplyTone(rime, tone); } catch { expected = null; }
      const got = viApplyTone(rime, tone);
      assert.equal(got, expected, `${rime} + ${tone}: app "${got}", pipeline "${expected}"`);
      compared += 1;
    }
  }
  assert.equal(compared, rimes.length * 6);
});

test('the six-form generator agrees, nulls included', () => {
  for (const rime of EXTRA_RIMES) {
    assert.deepEqual(viTonedForms(rime, viLegalTones(rime)), tools.viTonedForms(rime), rime);
  }
});

test('every form the placer produces is NFC', () => {
  // The whole point of NFC at the boundary: a form she approves must compare equal to a
  // word she later types on a phone keyboard.
  for (const rime of EXTRA_RIMES) {
    for (const tone of VI_TONE_IDS) {
      const form = viApplyTone(rime, tone);
      if (form === null) continue;
      assert.equal(form, form.normalize('NFC'), `${rime}+${tone} is not NFC`);
    }
  }
});

test('the placer returns null rather than throwing, because a screen calls it', () => {
  // `tools/lib/rules.mjs` throws — it is a build tool and a crash is the right answer
  // there. In the app a throw is a blank screen in front of a parent.
  for (const bad of ['', 'bcd', 'xyz', '123', null, undefined, 42]) {
    assert.doesNotThrow(() => viApplyTone(bad, 'sac'));
  }
  assert.equal(viApplyTone('eo', 'nope'), null);
  assert.equal(viApplyTone('', 'sac'), null);
  assert.equal(viApplyTone('bcd', 'sac'), null, 'a rime with no vowel has nowhere to put a mark');
});

test('stripping a tone is the exact inverse of placing one, on every real rime', () => {
  // The diagnostic half of §13.3: `chuống` has to be reported as `ch` + the BARE rime
  // `uông`, and the only honest way to know that is round-tripping it.
  for (const rime of [...viPack().tiles.rime.map((r) => r.id), ...EXTRA_RIMES]) {
    for (const tone of viLegalTones(rime)) {
      const marked = viApplyTone(rime, tone);
      const back = viStripTone(marked);
      assert.equal(back.base, rime.normalize('NFC'), `${marked} stripped to "${back.base}", not "${rime}"`);
      assert.equal(back.tone, tone, `${marked} read as ${back.tone}, not ${tone}`);
    }
  }
});

test('stripping a word with no tone leaves it alone and calls it ngang', () => {
  for (const word of ['meo', 'bo', 'ong', 'ao', 'cat']) {
    assert.deepEqual(viStripTone(word), { base: word, tone: 'ngang' });
  }
  assert.deepEqual(viStripTone(''), { base: '', tone: 'ngang' });
  assert.deepEqual(viStripTone(null), { base: '', tone: 'ngang' });
});

test('K5 — the tone-mark placer has exactly ONE caller in the whole app', () => {
  // `literacy-vi.md` §5.4: composition happens once, in the editor, in front of a human,
  // and **no runtime code composes a spelling or places a tone mark**.
  // `test/purity.test.mjs` bans it from `src/engine/`; this bounds it everywhere else.
  const importers = [];
  const carriers = [];
  // Both spellings: the character itself, **and the `\\uXXXX` escape**. The escape is
  // how the first version of this audit was walked past by a fault injection — a second
  // placer written with `'\\u0301'` in it contains no combining character at all.
  const COMBINING = /[\u0300\u0301\u0303\u0309\u0323]|\\u03(?:00|01|03|09|23)/;
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!/\.(mjs|jsx?)$/.test(name)) continue;
      const raw = readFileSync(full, 'utf8');
      const rel = path.relative(path.join(REPO, 'src'), full);
      if (/from\s+['"][^'"]*tone\.mjs['"]/.test(raw)) importers.push(rel);
      // A **second copy** of the placer is what an import audit alone would miss, and a
      // combining mark in the source is the only thing one could be made of.
      const code = raw.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1 ');
      if (COMBINING.test(code)) carriers.push(rel);
    }
  };
  walk(path.join(REPO, 'src'));
  assert.deepEqual(importers.sort(), [path.join('editor', 'vi.mjs')]);
  assert.deepEqual(carriers.sort(), [path.join('editor', 'tone.mjs')],
    'a combining tone mark appears outside the one file allowed to hold one');
});
