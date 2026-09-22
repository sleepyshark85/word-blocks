// The Vietnamese palette: what is offered, what is never offered, and why.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRound, segmentCount, isSolvable, seedFrom, langFor,
  VI_ROWS, VI_MAX_PER_ROW, VI_TONES_BY_STAGE,
} from '../src/engine/index.mjs';
import { viCheckSpellingRule, viIsStopFinal } from '../src/engine/rules.mjs';
import { viPack } from './helpers/load.mjs';

const pack = viPack();
const vi = langFor('vi');
const word = (id) => pack.words.find((w) => w.id === id);

/** Every round the seed pack can produce, at every stage that word can be met at. */
function* allRounds(seedLabel = 'rounds') {
  let rng = seedFrom(seedLabel);
  for (const w of pack.words) {
    for (let stage = w.stage; stage <= 5; stage += 1) {
      const [next, round] = createRound(pack, { word: w, stage, rngState: rng, roundId: `${w.id}@${stage}` });
      rng = next;
      yield { w, stage, round };
    }
  }
}

test('the palette contains every tile the target needs (B3)', () => {
  let n = 0;
  for (const { round } of allRounds()) {
    assert.ok(isSolvable(pack, round), `${round.id} is not solvable`);
    n += 1;
  }
  assert.ok(n > 100, `only checked ${n} rounds`);
});

test('no Vietnamese row ever exceeds six tiles (B3)', () => {
  for (const { round } of allRounds()) {
    assert.ok(round.palette.onsets.length <= VI_MAX_PER_ROW, round.id);
    assert.ok(round.palette.rimes.length <= VI_MAX_PER_ROW, round.id);
    for (const rid of Object.keys(round.palette.tonesByRime)) {
      assert.ok(round.palette.tonesByRime[rid].length <= VI_MAX_PER_ROW, `${round.id}/${rid}`);
    }
  }
});

test('each row is the width the stage table asks for, where the vocabulary allows', () => {
  for (const { w, stage, round } of allRounds()) {
    if (w.syllables[0].onset !== null) {
      assert.equal(round.palette.onsets.length, VI_ROWS[stage].onset,
        `${w.id}@${stage} onset row is ${round.palette.onsets.length}`);
    }
    assert.equal(round.palette.rimes.length, VI_ROWS[stage].rime,
      `${w.id}@${stage} rime row is ${round.palette.rimes.length}`);
  }
});

test('the palette holds no never-together pair (B4)', () => {
  for (const { round } of allRounds()) {
    const rows = [
      round.palette.onsets.map((i) => i.tileId),
      round.palette.rimes.map((i) => i.tileId),
      ...Object.values(round.palette.tonesByRime).map((r) => r.map((i) => i.tileId)),
    ];
    for (const row of rows) {
      for (const set of pack.neverTogether) {
        const hits = set.filter((m) => row.includes(m));
        assert.ok(hits.length <= 1, `${round.id}: ${hits.join(' + ')} in one row`);
      }
    }
  }
});

test('every onset × rime the palette can produce is a legal spelling (literacy-vi §4.1)', () => {
  for (const { round } of allRounds()) {
    const onsets = round.palette.onsets.length ? round.palette.onsets.map((i) => i.tileId) : [null];
    for (const o of onsets) {
      for (const r of round.palette.rimes) {
        assert.equal(viCheckSpellingRule(o, r.tileId), null,
          `${round.id}: "${o}" + "${r.tileId}" is not a spelling that exists`);
      }
    }
  }
});

test('a zero-onset round has two cells and no onset row at all (C2)', () => {
  for (const id of ['ao', 'ong']) {
    const w = word(id);
    assert.equal(w.syllables[0].onset, null);
    const [, round] = createRound(pack, { word: w, stage: 3, rngState: seedFrom(id), roundId: id });
    assert.equal(segmentCount(round), 2);
    assert.deepEqual(round.cells.map((c) => c.role), ['rime', 'tone']);
    assert.deepEqual(round.palette.onsets, []);
    assert.equal(vi.activeRow(round).role, 'rime', 'the band opens on rimes, never on an empty onset row');
  }
});

test('a normal round has three cells: onset, rime, tone (B2)', () => {
  const [, round] = createRound(pack, { word: word('meo'), stage: 3, rngState: seedFrom('m'), roundId: 'm' });
  assert.equal(segmentCount(round), 3);
  assert.deepEqual(round.cells.map((c) => c.role), ['onset', 'rime', 'tone']);
});

test('a stop-final rime produces exactly two tone tiles, sắc and nặng (C6)', () => {
  let checked = 0;
  for (const { round } of allRounds()) {
    for (const rid of Object.keys(round.palette.tonesByRime)) {
      if (!viIsStopFinal(rid)) continue;
      const row = round.palette.tonesByRime[rid];
      assert.equal(row.length, 2, `${round.id}/${rid}`);
      assert.deepEqual(row.map((i) => i.tileId), ['sac', 'nang'], `${round.id}/${rid}`);
      checked += 1;
    }
  }
  assert.ok(checked > 0, 'no stop-final rime was ever offered — the check proved nothing');

  // The rule has to hold independently of the stage table, or it is only true by
  // accident: at stage 1 the tone row is one tile wide, and `sách` must still get two.
  const sach = word('sach');
  assert.equal(sach.syllables[0].rime, 'ach');
  const [, low] = createRound(pack, { word: sach, stage: 1, rngState: seedFrom('c6'), roundId: 'c6' });
  assert.equal(VI_ROWS[1].tone, 1, 'the stage table would otherwise allow one tile');
  assert.deepEqual(low.palette.tonesByRime.ach.map((i) => i.tileId), ['sac', 'nang']);
});

test('ngang is a tile he presses, not the absence of one (C7)', () => {
  const w = word('xe'); // x + e + ngang
  assert.equal(w.syllables[0].tone, 'ngang');
  const [, round] = createRound(pack, { word: w, stage: 1, rngState: seedFrom('ngang'), roundId: 'x' });
  const row = round.palette.tonesByRime.e;
  assert.ok(row.some((i) => i.tileId === 'ngang'), 'ngang must be on offer');
  const ngang = row.find((i) => i.tileId === 'ngang');
  assert.equal(ngang.glyph, 'e', 'the ngang tile shows the unmarked form of the rime');
});

test('tone tiles render the chosen rime, marked — never a bare diacritic (C5)', () => {
  const [, round] = createRound(pack, { word: word('meo'), stage: 5, rngState: seedFrom('c5'), roundId: 'c5' });
  const row = round.palette.tonesByRime.eo;
  // The seed pack's dialect is `unset`, so `literacy-vi.md` §6.1 forbids hỏi and ngã in
  // one row — five tiles, not six. That is the cost the document accepts by name:
  // "costs palette variety; costs the child nothing" (`open-questions.md` Q1).
  assert.equal(row.length, 5);
  assert.equal(row.filter((i) => i.tileId === 'hoi' || i.tileId === 'nga').length, 1);
  for (const i of row) {
    assert.equal(i.glyph, pack.tileById.rime.eo.toned[i.tileId], i.tileId);
    assert.ok(i.glyph.endsWith('o'), `${i.glyph} is not the rime, marked`);
  }
  assert.deepEqual(row.map((i) => i.glyph).slice(0, 3), ['eo', 'èo', 'éo']);
});

test('with a dialect chosen, the full six-tone row appears (C5, literacy-vi §6.1)', async () => {
  const { resolvePack } = await import('../src/engine/index.mjs');
  const { readPackInputs, packDir, rawManifest } = await import('./helpers/load.mjs');
  const input = readPackInputs(packDir('vi-seed'));
  const northern = resolvePack({
    language: 'vi',
    ...input,
    manifest: {
      ...rawManifest('vi-seed'),
      dialect: 'northern',
      rules: { neverTogether: [['c', 'k'], ['g', 'gh'], ['ng', 'ngh'], ['d', 'gi', 'r'], ['s', 'x'], ['ch', 'tr']] },
    },
  });
  const meo = northern.words.find((w) => w.id === 'meo');
  const [, round] = createRound(northern, { word: meo, stage: 5, rngState: seedFrom('c5n'), roundId: 'c5n' });
  const row = round.palette.tonesByRime.eo;
  assert.equal(row.length, 6);
  assert.deepEqual(row.map((i) => i.glyph), ['eo', 'èo', 'éo', 'ẻo', 'ẽo', 'ẹo']);
});

test('the tone row never exceeds the stage width, and always holds the target tone', () => {
  for (const { w, stage, round } of allRounds()) {
    const targetRime = w.syllables[0].rime;
    const row = round.palette.tonesByRime[targetRime];
    assert.ok(row.some((i) => i.tileId === w.syllables[0].tone),
      `${w.id}@${stage}: the target's own tone is not on offer`);
    if (!viIsStopFinal(targetRime)) {
      assert.ok(row.length <= VI_ROWS[stage].tone, `${w.id}@${stage}: tone row is ${row.length}`);
    }
  }
});

test('distractor tones come from the stage the child has reached', () => {
  for (const { w, stage, round } of allRounds()) {
    for (const rid of Object.keys(round.palette.tonesByRime)) {
      if (viIsStopFinal(rid)) continue;
      for (const i of round.palette.tonesByRime[rid]) {
        const isTargetTone = rid === w.syllables[0].rime && i.tileId === w.syllables[0].tone;
        if (isTargetTone) continue;
        assert.ok(VI_TONES_BY_STAGE[stage].includes(i.tileId),
          `${w.id}@${stage}: ${i.tileId} has not been introduced yet`);
      }
    }
  }
});

test('distractor onsets and rimes come from the stage the child has reached', () => {
  for (const { w, stage, round } of allRounds()) {
    for (const i of round.palette.onsets) {
      if (i.tileId === w.syllables[0].onset) continue;
      assert.ok(pack.stageOf.onset[i.tileId] <= stage, `${w.id}@${stage}: onset ${i.tileId}`);
    }
    for (const i of round.palette.rimes) {
      if (i.tileId === w.syllables[0].rime) continue;
      assert.ok(pack.stageOf.rime[i.tileId] <= stage, `${w.id}@${stage}: rime ${i.tileId}`);
    }
  }
});

test('every tile on offer is in this pack, and no tile id is used twice in a row', () => {
  for (const { round } of allRounds()) {
    for (const i of vi.paletteInstances(round.palette)) {
      assert.ok(pack.tileById[i.role][i.tileId], `${round.id}: ${i.role}/${i.tileId} is not in the inventory`);
    }
    for (const row of [round.palette.onsets, round.palette.rimes, ...Object.values(round.palette.tonesByRime)]) {
      const ids = row.map((i) => i.tileId);
      assert.equal(new Set(ids).size, ids.length, `${round.id}: a repeated tile in one row`);
    }
  }
});

test('every tone row belongs to a rime that is actually on offer — no dead row (C8)', () => {
  for (const { round } of allRounds()) {
    const offered = new Set(round.palette.rimes.map((i) => i.tileId));
    assert.deepEqual(Object.keys(round.palette.tonesByRime).sort(), [...offered].sort(), round.id);
    for (const rid of offered) {
      assert.ok(round.palette.tonesByRime[rid].length > 0, `${round.id}/${rid} is an empty row`);
    }
  }
});

test('the same round built twice from the same seed is identical', () => {
  const a = createRound(pack, { word: word('meo'), stage: 4, rngState: 12345, roundId: 'a' })[1];
  const b = createRound(pack, { word: word('meo'), stage: 4, rngState: 12345, roundId: 'a' })[1];
  assert.deepEqual(a, b);
});

test('the answer is not always in the same place', () => {
  const positions = new Set();
  let rng = seedFrom('positions');
  for (let i = 0; i < 40; i += 1) {
    const [next, round] = createRound(pack, { word: word('meo'), stage: 5, rngState: rng, roundId: `p${i}` });
    rng = next;
    positions.add(round.palette.onsets.findIndex((x) => x.tileId === 'm'));
  }
  assert.ok(positions.size >= 4, `the target onset only ever appeared at ${[...positions].join(',')}`);
});

test('a rime carries its tone with it when lifted (C9)', () => {
  // A direct test of the rule, because the one-row-at-a-time band means a seated tone
  // and a liftable rime never co-exist on a real board: seating the tone completes the
  // round. The rule must hold regardless of that argument.
  const cells = [
    { role: 'onset', index: 0 }, { role: 'rime', index: 1 }, { role: 'tone', index: 2 },
  ];
  assert.deepEqual(vi.dependentCells({ cells }, 1), [2], 'the rime takes the tone');
  assert.deepEqual(vi.dependentCells({ cells }, 0), [], 'the onset takes nothing (C10)');
  assert.deepEqual(vi.dependentCells({ cells }, 2), [], 'the tone takes nothing');
  const zeroOnset = [{ role: 'rime', index: 0 }, { role: 'tone', index: 1 }];
  assert.deepEqual(vi.dependentCells({ cells: zeroOnset }, 0), [1]);
});

test('a tone is correct only on the rime the target needs (E1, E8)', () => {
  // `èo` is the answer's tone; the same tone tile on the rime `ao` spells part of a
  // different word, and lighting a segment for it would brighten the picture for
  // something that is not the answer.
  const meo = word('meo');
  const [, round] = createRound(pack, { word: meo, stage: 5, rngState: seedFrom('tone-on-rime'), roundId: 't' });
  const other = round.palette.rimes.find((r) => r.tileId !== 'eo'
    && round.palette.tonesByRime[r.tileId].some((t) => t.tileId === 'huyen'));
  assert.ok(other, 'the case needs another rime whose row also offers huyền');

  const board = (rimeId) => ({
    ...round,
    cells: [
      { role: 'onset', index: 0, expect: 'm', tileId: 'm', instanceId: 'onset:m' },
      { role: 'rime', index: 1, expect: 'eo', tileId: rimeId, instanceId: `rime:${rimeId}` },
      { role: 'tone', index: 2, expect: 'huyen', tileId: 'huyen', instanceId: `tone:${rimeId}:huyen` },
    ],
  });
  assert.equal(vi.cellCorrect(board(other.tileId), 2), false, 'huyền on the wrong rime is not the answer');
  assert.equal(vi.cellCorrect(board('eo'), 2), true, 'huyền on the right rime is');
});
