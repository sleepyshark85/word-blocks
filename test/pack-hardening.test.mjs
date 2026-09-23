// `resolvePack` against packs that are wrong in ways the validator would catch at dev
// time but a device never will. `src/engine/pack.mjs` opens by saying the runtime trusts
// nothing; these are the three holes the Slice 2 tester found in that claim.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolvePack, createGame, createSession, reduce, tableView, checkInvariants,
} from '../src/engine/index.mjs';
import { readPackInputs, packDir, viPack } from './helpers/load.mjs';

function viInputs() {
  return readPackInputs(packDir('vi-seed'));
}

test('the same words in a different order resolve to the same pack', () => {
  // The duplicate-parts rule keeps the first word it meets, so "first" has to be a
  // property of the pack and not of the order a directory listing happened to return —
  // and `expo-file-system`'s `list()` makes no ordering promise at all.
  const input = viInputs();
  const forwards = resolvePack({ ...input, language: 'vi', words: input.words });
  const backwards = resolvePack({ ...input, language: 'vi', words: [...input.words].reverse() });
  assert.deepEqual(
    forwards.words.map((w) => w.id),
    backwards.words.map((w) => w.id),
  );
  assert.deepEqual(
    forwards.catalogue.map((c) => [c.id, c.playable, c.reason && c.reason.code]),
    backwards.catalogue.map((c) => [c.id, c.playable, c.reason && c.reason.code]),
  );
});

test('two words sharing one parts key resolve the same way whichever arrives first', () => {
  const input = viInputs();
  const meo = input.words.find((w) => w.id === 'meo');
  assert.ok(meo, 'the seed pack still has mèo');
  const twin = { ...meo, id: 'zzz-meo', text: 'mèo' };

  const a = resolvePack({ ...input, language: 'vi', words: [twin, ...input.words] });
  const b = resolvePack({ ...input, language: 'vi', words: [...input.words, twin] });
  const kept = (p) => p.words.find((w) => w.text === 'mèo').id;
  assert.equal(kept(a), 'meo');
  assert.equal(kept(b), 'meo');
  for (const p of [a, b]) {
    const entry = p.catalogue.find((c) => c.id === 'zzz-meo');
    assert.equal(entry.playable, false);
    assert.equal(entry.reason.code, 'duplicateParts');
  }
});

test('two word files with the same id: one plays, the other is reported (never silently dead)', () => {
  const input = viInputs();
  const meo = input.words.find((w) => w.id === 'meo');
  const clash = { ...meo, text: 'mẹo', syllables: [{ onset: 'm', rime: 'eo', tone: 'nang' }] };
  const pack = resolvePack({ ...input, language: 'vi', words: [...input.words, clash] });

  assert.equal(pack.words.filter((w) => w.id === 'meo').length, 1,
    'a duplicate id would be dealt by no code path and listed as fine by every code path');
  const entries = pack.catalogue.filter((c) => c.id === 'meo');
  assert.equal(entries.length, 2);
  assert.equal(entries.filter((c) => c.playable).length, 1);
  assert.equal(entries.find((c) => !c.playable).reason.code, 'duplicateId');
});

test('a duplicated tile id yields one tile, not two cells sharing one id', () => {
  const input = viInputs();
  const onsets = input.manifest.tiles.onset;
  const manifest = {
    ...input.manifest,
    tiles: { ...input.manifest.tiles, onset: [...onsets, { ...onsets[0] }] },
  };
  const pack = resolvePack({ ...input, language: 'vi', manifest });

  const ids = pack.tiles.onset.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length, 'the inventory still holds a duplicate');
  assert.ok(pack.issues.some((i) => i.code === 'duplicateTileId'));

  // And the consequence that made it matter. Under revision 1 two palette instances
  // shared one id, so seating one removed both and 333 of 400 generated rounds showed
  // the same onset twice. Under discovery the table **is** the inventory, so the same
  // defect would put one symbol in two cells — and a tap would be ambiguous.
  const game = createGame(pack);
  const state = createSession(game, { seed: 'duptile' });
  const cells = tableView(game, state).cells.map((c) => c.id);
  assert.equal(new Set(cells).size, cells.length, 'one symbol occupies two cells');
  assert.deepEqual(pack.inventoryOrder.onset, [...new Set(pack.inventoryOrder.onset)]);
  assert.deepEqual(checkInvariants(game, state), []);
});

test('C7 — an illegal tone is DRAWN and flat, and cannot be seated', () => {
  // The state the Slice 2 tester reached on `quạt`: a tone seated against a rime that has
  // no stored form for it, which is a board state with no spelling.
  //
  // **Revision 3 changes how that is prevented, and this test is its inverse.** Revision
  // 2 drew only the legal tone cells, so an illegal one could not be tapped because it
  // was not there. The owner asked for the regular character table: all six cells are
  // always present, the illegal four **lie flat**, and liveness is what stops him —
  // exactly as everywhere else on this board. Legality and completability are now both
  // flatness (`ui.md` §7.2).
  const pack = viPack();
  const game = createGame(pack);
  const stopFinal = game.tree.eligible.find((w) => {
    const tile = pack.tileById.rime[w.syllables[0].rime];
    return tile.legalTones.length === 2;
  });
  assert.ok(stopFinal, 'the seed pack still has a reachable checked-syllable word');

  let state = createSession(game, { seed: 'illegal-tone' });
  const syl = stopFinal.syllables[0];
  if (syl.onset !== null) state = reduce(game, state, { type: 'tapSymbol', symbolId: syl.onset });
  state = reduce(game, state, { type: 'tapSymbol', symbolId: syl.rime });

  const rimeTile = pack.tileById.rime[syl.rime];
  const tones = tableView(game, state).cells.filter((c) => c.role === 'tone');
  assert.deepEqual(tones.map((c) => c.id), pack.inventoryOrder.tone, 'all six cells are present');
  const illegal = ['ngang', 'huyen', 'hoi', 'nga'].find((t) => !rimeTile.legalTones.includes(t));
  assert.ok(illegal, 'this rime takes every tone, so there is nothing to exclude');
  const cell = tones.find((c) => c.id === illegal);
  assert.equal(cell.live, false, `${illegal} stands up on a checked rime`);
  // It falls back to the bare mark, because the orthography has no form for it to show.
  assert.equal(cell.carrier, 'mark');
  // And a tap on it is a flat tap: it speaks and seats nothing.
  const after = reduce(game, state, { type: 'tapSymbol', symbolId: illegal });
  assert.deepEqual(after.prefix, state.prefix);
  assert.equal(after.status, 'building');
  assert.deepEqual(checkInvariants(game, state), []);
});
