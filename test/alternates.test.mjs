// `acceptance-criteria.md` B11 and `gameplay.md` §4.5: *≥ 50% of generated rounds should
// have at least one alternate combination that is also a pack word.*
//
// This is the measurable half of the found-word win — the idea `literacy-en.md` §6.2
// calls the strongest single one in the English mode. It is a preference with a target,
// not a hard constraint, so it is measured over the whole pack with a fixed seed.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createRound, seedFrom, wordFromParts, resolvePack } from '../src/engine/index.mjs';
import { viPack, enPack, readPackInputs, packDir } from './helpers/load.mjs';

function viHasAlternate(pack, round, targetId) {
  const onsets = round.palette.onsets.length ? round.palette.onsets.map((i) => i.tileId) : [null];
  for (const o of onsets) {
    for (const r of round.palette.rimes) {
      for (const t of round.palette.tonesByRime[r.tileId]) {
        const w = wordFromParts(pack, { onset: o, rime: r.tileId, tone: t.tileId });
        if (w && w.id !== targetId) return true;
      }
    }
  }
  return false;
}

function enHasAlternate(pack, round, targetId) {
  const ids = round.palette.tiles.map((i) => i.tileId);
  const n = round.cells.length;
  const used = new Set();
  const acc = [];
  const walk = () => {
    if (acc.length === n) {
      const w = wordFromParts(pack, acc.slice());
      return Boolean(w && w.id !== targetId);
    }
    for (let i = 0; i < ids.length; i += 1) {
      if (used.has(i)) continue;
      used.add(i); acc.push(ids[i]);
      const hit = walk();
      used.delete(i); acc.pop();
      if (hit) return true;
    }
    return false;
  };
  return walk();
}

function measure(pack, hasAlternate, maxStage) {
  let rng = seedFrom('b11');
  let total = 0;
  let withAlt = 0;
  for (const w of pack.words) {
    for (let stage = w.stage; stage <= maxStage; stage += 1) {
      const [next, round] = createRound(pack, { word: w, stage, rngState: rng, roundId: `${w.id}@${stage}` });
      rng = next;
      total += 1;
      if (hasAlternate(pack, round, w.id)) withAlt += 1;
    }
  }
  return { total, withAlt, rate: withAlt / total };
}

test('≥ 50% of Vietnamese rounds have an alternate real word reachable (B11)', () => {
  const pack = viPack();
  const { total, withAlt, rate } = measure(pack, viHasAlternate, 5);
  assert.ok(total > 100, `only ${total} rounds`);
  assert.ok(rate >= 0.5, `only ${withAlt}/${total} = ${(rate * 100).toFixed(1)}%`);
});

test('≥ 50% of English rounds have an alternate real word reachable (B11)', () => {
  const pack = enPack();
  const { total, withAlt, rate } = measure(pack, enHasAlternate, 7);
  assert.ok(total > 100, `only ${total} rounds`);
  assert.ok(rate >= 0.5, `only ${withAlt}/${total} = ${(rate * 100).toFixed(1)}%`);
});

test('the measurement is not vacuous — with no family in the pack the rate is zero', () => {
  // Preferring family distractors is the whole mechanism. A pack holding `cat` and
  // nothing else has no alternate to reach, and the same measurement must say so.
  const input = readPackInputs(packDir('en-seed'));
  const lonely = resolvePack({
    language: 'en', ...input, words: input.words.filter((w) => w.id === 'cat'),
  });
  const cat = lonely.words[0];
  for (let stage = 1; stage <= 7; stage += 1) {
    const [, round] = createRound(lonely, { word: cat, stage, rngState: seedFrom(`nofam${stage}`), roundId: 'x' });
    assert.equal(enHasAlternate(lonely, round, 'cat'), false, `stage ${stage}`);
  }
  // ...and with the whole pack behind it, the same word at the same stage does find one.
  const full = enPack();
  const [, round] = createRound(full, {
    word: full.words.find((w) => w.id === 'cat'), stage: 1, rngState: seedFrom('nofam1'), roundId: 'x',
  });
  assert.equal(enHasAlternate(full, round, 'cat'), true);
});
