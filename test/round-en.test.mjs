// The English tray: what is offered, what is never offered, and why.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRound, segmentCount, isSolvable, seedFrom, langFor, wordFromParts,
  EN_TRAY, EN_MAX_TRAY,
} from '../src/engine/index.mjs';
import { EN_FINAL_ONLY, EN_INITIAL_ONLY } from '../src/engine/rules.mjs';
import { enPack } from './helpers/load.mjs';

const pack = enPack();
const en = langFor('en');
const word = (id) => pack.words.find((w) => w.id === id);

function* allRounds(seedLabel = 'en-rounds') {
  let rng = seedFrom(seedLabel);
  for (const w of pack.words) {
    for (let stage = w.stage; stage <= 7; stage += 1) {
      const [next, round] = createRound(pack, { word: w, stage, rngState: rng, roundId: `${w.id}@${stage}` });
      rng = next;
      yield { w, stage, round };
    }
  }
}

test('the tray contains every tile the target needs (B3)', () => {
  let n = 0;
  for (const { round } of allRounds()) {
    assert.ok(isSolvable(pack, round), `${round.id} is not solvable`);
    n += 1;
  }
  assert.ok(n > 100, `only checked ${n} rounds`);
});

test('the tray never exceeds eight tiles (B3, literacy-en §6.1)', () => {
  for (const { round } of allRounds()) {
    assert.ok(round.palette.tiles.length <= EN_MAX_TRAY, `${round.id}: ${round.palette.tiles.length}`);
  }
});

test('the tray is the width literacy-en §6.2 asks for', () => {
  for (const { w, stage, round } of allRounds()) {
    const wanted = Math.min(EN_MAX_TRAY, Math.max(EN_TRAY[stage], w.tiles.length + 1));
    assert.equal(round.palette.tiles.length, wanted, `${w.id}@${stage}`);
    assert.ok(round.palette.tiles.length > w.tiles.length, `${w.id}@${stage}: no distractor at all`);
  }
});

test('one socket per tile of the target: 2 for egg, 3 for cat, 4 for frog (D1)', () => {
  for (const [id, n] of [['egg', 2], ['cat', 3], ['frog', 4], ['ship', 3], ['duck', 3]]) {
    const [, round] = createRound(pack, { word: word(id), stage: 7, rngState: seedFrom(id), roundId: id });
    assert.equal(segmentCount(round), n, id);
    assert.equal(round.cells.length, n, id);
  }
});

test('a palette never contains both c and k (D11)', () => {
  let sawC = 0;
  for (const { round } of allRounds()) {
    const ids = round.palette.tiles.map((i) => i.tileId);
    assert.ok(!(ids.includes('c') && ids.includes('k')), round.id);
    if (ids.includes('c')) sawC += 1;
  }
  assert.ok(sawC > 0, '`c` never appeared — the check proved nothing');
});

test('ck, ll, ss, ff, zz, ng and x are offered only where the target itself ends in one (D12)', () => {
  // Position comes from the pack, which is stricter than `tools/lib/rules.mjs`'s
  // `EN_FINAL_ONLY`: the manifest also marks `gg` final-only, as `literacy-en.md` §3.3
  // does, and that list does not. See the Slice 2 report.
  const isFinalOnly = (id) => pack.tileById.letter[id].position === 'final';
  for (const f of EN_FINAL_ONLY) {
    if (pack.tileById.letter[f]) assert.ok(isFinalOnly(f), `the pack disagrees about ${f}`);
  }
  let sawFinalOnly = 0;
  for (const { w, round } of allRounds()) {
    const lastIsFinalOnly = isFinalOnly(w.tiles[w.tiles.length - 1]);
    for (const i of round.palette.tiles) {
      if (!isFinalOnly(i.tileId)) continue;
      sawFinalOnly += 1;
      assert.ok(lastIsFinalOnly,
        `${round.id}: "${i.tileId}" is final-only but "${w.text}" does not end in one`);
    }
  }
  assert.ok(sawFinalOnly > 0, 'no final-only tile was ever offered — the check proved nothing');
});

test('`cat` can never be offered `ck` (D12, worked)', () => {
  let rng = seedFrom('cat-ck');
  for (let i = 0; i < 200; i += 1) {
    const stage = 1 + (i % 7);
    const [next, round] = createRound(pack, { word: word('cat'), stage, rngState: rng, roundId: `c${i}` });
    rng = next;
    const ids = round.palette.tiles.map((t) => t.tileId);
    for (const f of [...EN_FINAL_ONLY, ...EN_INITIAL_ONLY]) {
      assert.ok(!ids.includes(f), `${f} in cat's tray at stage ${stage}`);
    }
  }
});

test('a stage-1 `cat` round always offers a distractor that makes another real word (D13)', () => {
  let rng = seedFrom('d13');
  for (let i = 0; i < 100; i += 1) {
    const [next, round] = createRound(pack, { word: word('cat'), stage: 1, rngState: rng, roundId: `d${i}` });
    rng = next;
    const distractors = round.palette.tiles
      .map((t) => t.tileId)
      .filter((t) => !word('cat').tiles.includes(t));
    assert.equal(distractors.length, 1, 'stage 1 offers one distractor');
    // Substituted into any one slot, the distractor must spell another word this pack
    // can show — `hat`, `bat`, `rat` from `h`/`b`/`r`, or `cap` from `p`.
    const target = word('cat').tiles;
    const made = [];
    for (let slot = 0; slot < target.length; slot += 1) {
      const alt = target.slice();
      alt[slot] = distractors[0];
      const found = wordFromParts(pack, alt);
      if (found && found.id !== 'cat') made.push(found.text);
    }
    assert.ok(made.length > 0, `"${distractors[0]}" makes no other pack word with "cat"`);
  }
});

test('every tile on offer is in this pack and carries its role', () => {
  for (const { round } of allRounds()) {
    for (const i of en.paletteInstances(round.palette)) {
      const tile = pack.tileById.letter[i.tileId];
      assert.ok(tile, `${round.id}: ${i.tileId} is not in the inventory`);
      assert.equal(i.isVowel, tile.isVowel, i.tileId);
      assert.equal(i.role, 'letter');
    }
  }
});

test('no tile carries role3 — the tone slot is never rendered in English (D6)', () => {
  for (const { round } of allRounds()) {
    for (const i of en.paletteInstances(round.palette)) {
      assert.notEqual(i.role, 'tone', round.id);
    }
    for (const c of round.cells) assert.equal(c.role, 'letter', round.id);
  }
});

test('vowels and consonants are both on offer, and distinguishable (D5)', () => {
  for (const { round } of allRounds()) {
    const kinds = new Set(round.palette.tiles.map((i) => i.isVowel));
    assert.ok(kinds.has(true), `${round.id} offers no vowel`);
    assert.ok(kinds.has(false), `${round.id} offers no consonant`);
  }
});

test('instance ids are unique even when a tile repeats', () => {
  // No seed word repeats a tile, so build one by hand: the engine must still cope.
  const twin = { ...word('cat'), id: 'mum', text: 'mum', tiles: ['m', 'u', 'm'] };
  const [, round] = createRound(pack, { word: twin, stage: 5, rngState: seedFrom('mum'), roundId: 'mum' });
  const ids = round.palette.tiles.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(round.palette.tiles.filter((i) => i.tileId === 'm').length, 2,
    'a word needing two `m`s gets two `m` tiles');
  assert.ok(isSolvable(pack, round));
});

test('distractors come from the stage the child has reached', () => {
  for (const { w, stage, round } of allRounds()) {
    for (const i of round.palette.tiles) {
      if (w.tiles.includes(i.tileId)) continue;
      assert.ok(pack.stageOf.letter[i.tileId] <= stage, `${w.id}@${stage}: ${i.tileId}`);
    }
  }
});

test('the same round built twice from the same seed is identical', () => {
  const a = createRound(pack, { word: word('cat'), stage: 4, rngState: 999, roundId: 'a' })[1];
  const b = createRound(pack, { word: word('cat'), stage: 4, rngState: 999, roundId: 'a' })[1];
  assert.deepEqual(a, b);
});
