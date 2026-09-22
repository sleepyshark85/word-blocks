// The Slice 2 gate (`docs/slices.md`): *same seed and taps replay identically; thousands
// of fuzzed rounds violate no invariant; **every round is solvable with the palette
// offered**.*
//
// The player here is a four-year-old as far as the engine is concerned: he taps tiles he
// has already seated, taps empty cells, taps the frame, mashes, and occasionally gets
// helped. After **every single action** `checkInvariants` runs over the whole state.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSession, reduce, bandInstances, checkInvariants, seedFrom,
} from '../src/engine/index.mjs';
import { nextInt } from '../src/engine/rng.mjs';
import { viPack, enPack } from './helpers/load.mjs';

function fuzz(pack, { seed, actions }) {
  const language = pack.language;
  let rng = seedFrom(seed);
  let s = createSession(pack, { seed });
  let rounds = 0;
  const resolved = { target: 0, found: 0, notAWord: 0 };

  const check = (where) => {
    const bad = checkInvariants(pack, s, { language, where, seed });
    if (bad.length) {
      assert.fail(`${language} seed=${seed} ${where}: ${JSON.stringify(bad)}`);
    }
  };
  check('start');

  for (let i = 0; i < actions; i += 1) {
    const [r1, roll] = nextInt(rng, 100);
    rng = r1;

    if (s.phase === 'empty' || s.phase === 'ended') break;
    if (s.phase === 'album') {
      s = reduce(pack, s, { type: 'nextPage' });
      check(`album->page @${i}`);
      continue;
    }

    const round = s.round;
    if (round.status === 'settling') {
      resolved[round.outcome.kind] += 1;
      s = reduce(pack, s, { type: 'settle' });
      check(`settle @${i}`);
      continue;
    }
    if (round.status === 'resolving') {
      resolved[round.outcome.kind] += 1;
      rounds += 1;
      s = reduce(pack, s, { type: 'advance' });
      check(`advance @${i}`);
      continue;
    }

    const band = bandInstances(pack, s);
    const seated = round.cells.filter((c) => c.tileId !== null);
    let action;
    if (roll < 62 && band.length > 0) {
      const [r2, k] = nextInt(rng, band.length); rng = r2;
      action = { type: 'tapTile', instanceId: band[k].id };
    } else if (roll < 78 && seated.length > 0) {
      const [r2, k] = nextInt(rng, seated.length); rng = r2;
      action = { type: 'tapCell', cellIndex: seated[k].index };
    } else if (roll < 86) {
      const [r2, k] = nextInt(rng, round.cells.length); rng = r2;
      action = { type: 'tapCell', cellIndex: k };
    } else if (roll < 90) {
      action = { type: 'autoPlace' };
    } else if (roll < 94) {
      action = { type: 'tapFrame' };
    } else if (roll < 97) {
      action = { type: 'partsHint' };
    } else {
      // Actions that do not apply right now must be no-ops, not corruptions.
      const [r2, k] = nextInt(rng, 4); rng = r2;
      action = [{ type: 'settle' }, { type: 'advance' }, { type: 'nextPage' }, { type: 'nonsense' }][k];
    }

    s = reduce(pack, s, action);
    check(`${action.type} @${i}`);

    // The assembled state can never exceed the word's length: there are exactly as many
    // cells as the word has parts, and no cell holds two tiles.
    if (s.round) {
      assert.ok(s.round.cells.filter((c) => c.tileId !== null).length <= s.round.cells.length);
    }
  }
  return { rounds, resolved, s };
}

test('10 seeds × 5000 actions in Vietnamese violate no invariant', () => {
  const pack = viPack();
  let rounds = 0;
  const totals = { target: 0, found: 0, notAWord: 0 };
  for (let i = 0; i < 10; i += 1) {
    const out = fuzz(pack, { seed: `vi-fuzz-${i}`, actions: 5000 });
    rounds += out.rounds;
    for (const k of Object.keys(totals)) totals[k] += out.resolved[k];
  }
  assert.ok(rounds > 1000, `only ${rounds} rounds were resolved`);
  // All three outcomes must actually occur, or the fuzzer is not exercising the game.
  assert.ok(totals.target > 0 && totals.found > 0 && totals.notAWord > 0,
    `outcomes: ${JSON.stringify(totals)}`);
});

test('10 seeds × 5000 actions in English violate no invariant', () => {
  const pack = enPack();
  let rounds = 0;
  const totals = { target: 0, found: 0, notAWord: 0 };
  for (let i = 0; i < 10; i += 1) {
    const out = fuzz(pack, { seed: `en-fuzz-${i}`, actions: 5000 });
    rounds += out.rounds;
    for (const k of Object.keys(totals)) totals[k] += out.resolved[k];
  }
  assert.ok(rounds > 1000, `only ${rounds} rounds were resolved`);
  assert.ok(totals.target > 0 && totals.found > 0 && totals.notAWord > 0,
    `outcomes: ${JSON.stringify(totals)}`);
});

test('the language never changes mid-session, over the whole fuzz', () => {
  for (const pack of [viPack(), enPack()]) {
    const { s } = fuzz(pack, { seed: 'lang-fuzz', actions: 3000 });
    assert.equal(s.language, pack.language);
  }
});

test('checkInvariants is not vacuous — it catches a corrupted board', () => {
  // "Never trust a green check you have not seen fail." Break the state on purpose.
  const pack = viPack();
  const s = createSession(pack, { seed: 'inject' });
  assert.deepEqual(checkInvariants(pack, s), []);

  const wrongLanguage = { ...s, language: 'en' };
  assert.ok(checkInvariants(pack, wrongLanguage).some((b) => b.code === 'languageDrift'));

  const twoInOneCell = {
    ...s,
    round: {
      ...s.round,
      cells: s.round.cells.map((c) => ({ ...c, tileId: 'm', instanceId: 'onset:m' })),
    },
  };
  assert.ok(checkInvariants(pack, twoInOneCell).some((b) => b.code === 'instanceSeatedTwice'));

  const foreignTile = {
    ...s,
    round: {
      ...s.round,
      palette: { ...s.round.palette, onsets: [{ id: 'onset:zz', role: 'onset', tileId: 'zz', glyph: 'zz' }] },
    },
  };
  const bad = checkInvariants(pack, foreignTile);
  assert.ok(bad.some((b) => b.code === 'tileNotInInventory'));
  assert.ok(bad.some((b) => b.code === 'unsolvable'), 'a palette missing the answer must be caught');

  const tooWide = {
    ...s,
    round: { ...s.round, palette: { ...s.round.palette, rimes: new Array(9).fill(s.round.palette.rimes[0]) } },
  };
  assert.ok(checkInvariants(pack, tooWide).some((b) => b.code === 'rimeRowTooWide'));

  const homophones = {
    ...s,
    round: {
      ...s.round,
      palette: {
        ...s.round.palette,
        onsets: [
          { id: 'onset:c', role: 'onset', tileId: 'c', glyph: 'c' },
          { id: 'onset:k', role: 'onset', tileId: 'k', glyph: 'k' },
        ],
      },
    },
  };
  assert.ok(checkInvariants(pack, homophones).some((b) => b.code === 'neverTogetherViolated'));

  const overStage = { ...s, globalStage: 11 };
  assert.ok(checkInvariants(pack, overStage).some((b) => b.code === 'stageOutOfRange'));

  const pageOverflow = { ...s, page: { entries: new Array(6).fill({ wordId: 'x' }) } };
  assert.ok(checkInvariants(pack, pageOverflow).some((b) => b.code === 'pageOverflow'));
});
