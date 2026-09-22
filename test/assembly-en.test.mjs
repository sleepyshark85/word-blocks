// Building an English word: leftmost-empty seating, the leftmost-slot swap, and the
// three outcomes.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSession, reduce, bandInstances, litCells, veilOpacity, langFor, VEIL_START,
  resolvePack, hintInstance,
} from '../src/engine/index.mjs';
import { enPack, readPackInputs, packDir } from './helpers/load.mjs';
import { tap, tapCell, solve } from './helpers/play.mjs';

const en = langFor('en');

function sessionOn(ids, seed = 'en-assembly') {
  const input = readPackInputs(packDir('en-seed'));
  const pack = resolvePack({
    language: 'en', ...input,
    words: input.words.filter((w) => ids.includes(w.id)),
  });
  assert.equal(pack.words.length, ids.length);
  return { pack, state: createSession(pack, { seed }) };
}

test('a tap seats in the leftmost empty slot (D2)', () => {
  const { pack, state } = sessionOn(['cat']);
  assert.deepEqual(state.round.cells.map((c) => c.tileId), [null, null, null]);
  const band = bandInstances(pack, state);
  const first = band[0];
  const s1 = reduce(pack, state, { type: 'tapTile', instanceId: first.id });
  assert.equal(s1.round.cells[0].instanceId, first.id);
  assert.equal(s1.round.cells[1].tileId, null);

  const second = bandInstances(pack, s1)[0];
  const s2 = reduce(pack, s1, { type: 'tapTile', instanceId: second.id });
  assert.equal(s2.round.cells[1].instanceId, second.id);
});

test('with every slot full, a band tap takes the leftmost and the occupant goes home (D3)', () => {
  const { pack, state } = sessionOn(['cat', 'hat', 'bat'], 'd3');
  // Fill all three slots with something that is not the answer, so the round does not
  // resolve, then tap a fourth tile.
  let s = state;
  const band = bandInstances(pack, s);
  assert.ok(band.length >= 4, 'the tray must have a spare tile');
  for (let i = 0; i < 3; i += 1) {
    s = reduce(pack, s, { type: 'tapTile', instanceId: bandInstances(pack, s)[0].id });
    if (s.round.status !== 'building') return; // it happened to be a word; another seed covers D3
  }
  const wasInSlot0 = s.round.cells[0].instanceId;
  const spare = bandInstances(pack, s)[0];
  const after = reduce(pack, s, { type: 'tapTile', instanceId: spare.id });
  assert.equal(after.round.cells[0].instanceId, spare.id, 'it takes the leftmost slot');
  assert.ok(bandInstances(pack, after).some((i) => i.id === wasInSlot0), 'the previous occupant walks home');
  assert.equal(after.round.cells.filter((c) => c.tileId !== null).length, 3);
});

test('tapping a seated tile returns it and empties the slot (D4)', () => {
  const { pack, state } = sessionOn(['cat']);
  const s1 = tap(pack, state, 'c');
  assert.equal(s1.round.cells[0].tileId, 'c');
  const s2 = tapCell(pack, s1, 0);
  assert.equal(s2.round.cells[0].tileId, null);
  assert.ok(bandInstances(pack, s2).some((i) => i.tileId === 'c'));
});

test('a correct placement lights its segment and steps the veil by 0.16/N (E1)', () => {
  const { pack, state } = sessionOn(['cat']);
  assert.equal(veilOpacity(pack, state.round), VEIL_START);
  const s = tap(pack, state, 'c');
  assert.deepEqual(litCells(pack, s.round), [true, false, false]);
  assert.ok(Math.abs(veilOpacity(pack, s.round) - (VEIL_START * 2) / 3) < 1e-12);
});

test('an incorrect placement seats, stays, and lights nothing (E2)', () => {
  const { pack, state } = sessionOn(['cat', 'hat'], 'e2');
  const s = state.round.targetId === 'cat' ? state : reduce(pack, solve(pack, state), { type: 'advance' });
  const wrong = bandInstances(pack, s).find((i) => i.tileId !== s.round.cells[0].expect);
  const after = reduce(pack, s, { type: 'tapTile', instanceId: wrong.id });
  assert.equal(after.round.cells[0].tileId, wrong.tileId);
  assert.deepEqual(litCells(pack, after.round), [false, false, false]);
  assert.equal(veilOpacity(pack, after.round), VEIL_START);
});

test('completing the target resolves it; the chant uses short clips then the word (D10)', () => {
  const { pack, state } = sessionOn(['cat']);
  const s = solve(pack, state);
  assert.equal(s.round.outcome.kind, 'target');
  const steps = en.chant(pack, pack.words.find((w) => w.id === 'cat'));
  assert.deepEqual(steps.map((x) => x.step), ['tile', 'tile', 'tile', 'word']);
  for (let i = 0; i < 3; i += 1) {
    const tile = pack.tileById.letter[['c', 'a', 't'][i]];
    assert.equal(steps[i].audio.src, tile.audio.short.src, `step ${i} must use the short clip`);
    assert.notEqual(steps[i].audio.src, tile.audio.long.src);
  }
  assert.equal(steps[3].caption, 'cat');
});

test('building `hat` when the target was `cat` is a found-word win (E5)', () => {
  const { pack, state } = sessionOn(['cat', 'hat'], 'found-en');
  let s = state;
  if (s.round.targetId !== 'cat') s = reduce(pack, solve(pack, s), { type: 'advance' });
  assert.equal(s.round.targetId, 'cat');
  assert.ok(bandInstances(pack, s).some((i) => i.tileId === 'h'), '`h` must be on offer');
  const built = tap(pack, tap(pack, tap(pack, s, 'h'), 'a'), 't');
  assert.equal(built.round.outcome.kind, 'found');
  assert.equal(built.round.outcome.wordId, 'hat');
  assert.equal(built.round.outcome.art.wordId, 'hat');
  assert.deepEqual(litCells(pack, built.round), [false, true, true], '`a` and `t` are still right');
});

test('a combination that is not a word settles, keeping only the lit tiles (E7, E8, E9)', () => {
  const { pack, state } = sessionOn(['cat', 'bed', 'pig'], 'en-settle');
  let s = state;
  let settled = null;
  for (let round = 0; round < 6 && !settled; round += 1) {
    const target = s.round.cells.map((c) => c.expect);
    const withFirst = tap(pack, s, target[0]); // correct, so slot 0 must survive
    outer:
    for (const a of bandInstances(pack, withFirst)) {
      const two = reduce(pack, withFirst, { type: 'tapTile', instanceId: a.id });
      for (const b of bandInstances(pack, two)) {
        const three = reduce(pack, two, { type: 'tapTile', instanceId: b.id });
        if (three.round.outcome && three.round.outcome.kind === 'notAWord') { settled = three; break outer; }
      }
    }
    if (!settled) s = reduce(pack, solve(pack, s), { type: 'advance' });
  }
  assert.ok(settled, 'no not-a-word combination arose — the case proved nothing');

  const readBack = en.readBack(pack, settled.round);
  assert.equal(readBack.length, 3);
  assert.ok(!readBack.some((x) => x.step === 'word'), 'no whole-word step (E7)');

  const after = reduce(pack, settled, { type: 'settle' });
  assert.equal(after.round.status, 'building');
  assert.equal(after.round.cells[0].tileId, after.round.cells[0].expect, 'the lit tile stays (E8)');
  assert.deepEqual(litCells(pack, after.round)[0], true);
  for (let i = 1; i < after.round.cells.length; i += 1) {
    const cell = after.round.cells[i];
    assert.ok(cell.tileId === null || cell.tileId === cell.expect,
      'every tile still seated is a correct one');
  }
  assert.ok(bandInstances(pack, after).length > 0, 'the returned tiles are tappable again (E9)');
});

test('the hint ladder points at the correct tile for the next empty slot (G3, G5)', () => {
  const { pack, state } = sessionOn(['cat']);
  assert.equal(hintInstance(pack, state.round).tileId, 'c');
  const s = tap(pack, state, 'c');
  assert.equal(hintInstance(pack, s.round).tileId, 'a');
});

test('a two-tile word and a four-tile word both play (D1)', () => {
  for (const [id, n] of [['egg', 2], ['frog', 4]]) {
    const { pack, state } = sessionOn([id], id);
    assert.equal(state.round.cells.length, n);
    const done = solve(pack, state);
    assert.equal(done.round.outcome.kind, 'target', id);
    assert.equal(done.round.outcome.wordId, id);
  }
});

test('the plate shows the glyph of each seated tile, read from the pack', () => {
  const { pack, state } = sessionOn(['ship']);
  const s = tap(pack, state, 'sh');
  assert.deepEqual(en.plateCells(pack, s.round).map((c) => c.glyph), ['sh', null, null]);
  assert.equal(enPack().tileById.letter.sh.glyph, 'sh');
});
