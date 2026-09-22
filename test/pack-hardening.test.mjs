// `resolvePack` against packs that are wrong in ways the validator would catch at dev
// time but a device never will. `src/engine/pack.mjs` opens by saying the runtime trusts
// nothing; these are the three holes the Slice 2 tester found in that claim.

import test from 'node:test';
import assert from 'node:assert/strict';

import { resolvePack, createSession, checkInvariants, langFor } from '../src/engine/index.mjs';
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

test('a duplicated tile id yields one tile, not two instances sharing one id', () => {
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

  // And the consequence that made it matter: seating one of two instances that share an
  // id removed both, so 333 of 400 rounds showed the same onset twice.
  const lang = langFor('vi');
  const s = createSession(pack, { seed: 'duptile' });
  const instances = lang.paletteInstances(s.round.palette).map((i) => i.id);
  assert.equal(new Set(instances).size, instances.length);
  assert.deepEqual(checkInvariants(pack, s), []);
});

test('an illegal tone seated against a checked rime is an invariant violation', () => {
  // The state the Slice 2 tester reached on `quạt`. The reducer refuses it now
  // (`test/session.test.mjs`), so it is constructed here by hand — an invariant that
  // only ever sees legal states is an invariant nobody has seen fail.
  const pack = viPack();
  const stopFinal = pack.words.find((w) => {
    const tile = pack.tileById.rime[w.syllables[0].rime];
    return tile.legalTones.length === 2;
  });
  assert.ok(stopFinal, 'the seed pack still has a checked-syllable word');

  const s = createSession(pack, { seed: 'illegal-tone' });
  const rimeTile = pack.tileById.rime[stopFinal.syllables[0].rime];
  const illegal = ['ngang', 'huyen', 'hoi', 'nga'].find((t) => !rimeTile.legalTones.includes(t));

  const round = {
    ...s.round,
    cells: [
      { role: 'rime', index: 0, expect: rimeTile.id, tileId: rimeTile.id, instanceId: null },
      { role: 'tone', index: 1, expect: illegal, tileId: illegal, instanceId: null },
    ],
  };
  const bad = checkInvariants(pack, { ...s, round });
  assert.ok(bad.some((b) => b.code === 'illegalToneSeated'), JSON.stringify(bad));
});
