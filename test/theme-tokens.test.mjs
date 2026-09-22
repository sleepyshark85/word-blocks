// `src/theme/tokens.json` is the verbatim output of `node tools/theme-contrast.mjs
// --tokens`. This is what stops it drifting.
//
// `decisions.md`: "Token sets, nothing hardcoded. A colour literal in a component is a
// bug — right in one theme, wrong in two." The sweep in `tools/theme-contrast.mjs` is
// what makes the token values *safe* (`acceptance-criteria.md` S1, S4, S6); this file is
// what makes them the values the app actually renders. Hand-copying the hexes would have
// left those two facts unconnected.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { REPO } from './helpers/load.mjs';

const TOOL = path.join(REPO, 'tools', 'theme-contrast.mjs');
const COMMITTED = JSON.parse(readFileSync(path.join(REPO, 'src', 'theme', 'tokens.json'), 'utf8'));

test('the committed tokens are exactly what the tool emits today', () => {
  const fresh = JSON.parse(execFileSync('node', [TOOL, '--tokens'], { encoding: 'utf8' }));
  assert.deepEqual(COMMITTED, fresh,
    'src/theme/tokens.json has drifted from tools/theme-contrast.mjs — regenerate it');
});

test('S1 — the contrast sweep exits 0 across all three themes', () => {
  assert.doesNotThrow(() => execFileSync('node', [TOOL], { stdio: 'pipe' }));
});

test('S2 — and exits 1 when a role hex is moved to a near-ground pastel', () => {
  // Never trust a green check you have not seen fail. The tool takes the palette from its
  // own source, so the fault is injected into a copy of that source and the copy is run.
  const src = readFileSync(TOOL, 'utf8');
  const broken = src.replace(/#E8366F/g, '#E9F7EF'); // watermelon -> a mint pastel
  assert.notEqual(broken, src, 'the tool no longer contains the hex this test injects into');
  const tmp = path.join(REPO, 'test', '.out', 'theme-contrast-broken.mjs');
  execFileSync('mkdir', ['-p', path.dirname(tmp)]);
  execFileSync('tee', [tmp], { input: broken, stdio: ['pipe', 'ignore', 'inherit'] });
  let failed = false;
  let out = '';
  try {
    execFileSync('node', [tmp], { encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    failed = true;
    out = String(e.stdout ?? '') + String(e.stderr ?? '');
  }
  assert.ok(failed, 'a near-ground role hex did not fail the sweep');
  assert.ok(/role1|watermelon|E9F7EF/i.test(out), `the failure does not name the pair: ${out.slice(-400)}`);
});

test('every theme carries every token the app reads, and all three agree on the key set', () => {
  const ids = Object.keys(COMMITTED);
  assert.deepEqual(ids.sort(), ['playground', 'popsicle', 'sunshine']);
  // `dflt` marks Popsicle as the default and is on that theme alone; every other key
  // must be on all three, because a component reads them by name and an absent token is
  // a transparent surface on a device nobody screenshotted.
  const keys = Object.keys(COMMITTED.popsicle).filter((k) => k !== 'dflt').sort();
  for (const id of ids) {
    assert.deepEqual(Object.keys(COMMITTED[id]).filter((k) => k !== 'dflt').sort(), keys,
      `${id} has a different key set`);
  }
  assert.equal(COMMITTED.popsicle.dflt, true, 'Popsicle is the default (decisions.md)');

  // The tokens `ui.md` §5.1 names, each of which a component reads by name.
  const required = [
    'ground', 'groundAlt', 'surface', 'tileFace', 'tileGlyph', 'ink', 'inkSoft',
    'role1', 'role1Edge', 'role1Deep', 'role1Soft', 'role1Pattern',
    'role2', 'role2Edge', 'role2Deep', 'role2Soft', 'role2Pattern',
    'role3', 'role3Edge', 'role3Deep', 'role3Soft', 'role3Pattern',
    'reward', 'rewardEdge', 'accentFace', 'neutralFace', 'hairline', 'veil',
  ];
  for (const id of ids) {
    for (const key of required) {
      assert.ok(COMMITTED[id][key] !== undefined, `${id} is missing ${key}`);
    }
  }
});

test('S5/S8 — the slot to pattern mapping is identical in all three themes', () => {
  for (const id of Object.keys(COMMITTED)) {
    assert.equal(COMMITTED[id].role1Pattern, 'solid', `${id}: onset / consonant is not solid`);
    assert.equal(COMMITTED[id].role2Pattern, 'split', `${id}: rime / vowel is not split`);
    assert.equal(COMMITTED[id].role3Pattern, 'dotted', `${id}: tone is not dotted`);
  }
});

test('S9 — every ground is light, and no dark surface is defined', () => {
  const luminance = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  for (const id of Object.keys(COMMITTED)) {
    for (const key of ['ground', 'groundAlt', 'surface', 'tileFace', 'veil']) {
      assert.ok(luminance(COMMITTED[id][key]) > 0.6, `${id}.${key} is not a light surface`);
    }
  }
});

test('the owner’s nine role hexes ship unchanged (ui.md §5.1)', () => {
  // `decisions.md`: the owner chose these by eye. §5.4's whole point was that the fix for
  // a failing sweep was to move the colour, not to dull it.
  assert.equal(COMMITTED.popsicle.role1, '#E8366F');
  assert.equal(COMMITTED.popsicle.role2, '#6B46E5');
  assert.equal(COMMITTED.popsicle.role3, '#0FA36B');
  assert.equal(COMMITTED.sunshine.role1, '#EF5B25');
  assert.equal(COMMITTED.sunshine.role2, '#1189B8');
  assert.equal(COMMITTED.sunshine.role3, '#3E9B2F');
  assert.equal(COMMITTED.playground.role1, '#1E6FD9');
  assert.equal(COMMITTED.playground.role2, '#F2701D');
  assert.equal(COMMITTED.playground.role3, '#00937A');
});
