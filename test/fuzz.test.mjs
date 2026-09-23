// The fuzzer. `docs/slices.md` Slice 2's gate: *thousands of fuzzed sessions violate no
// invariant, and there is no reachable state from which a word cannot be made.*
//
// It taps at random — live tiles, flat tiles, strip cells, the idle ladder, the album —
// and asserts `checkInvariants` after **every single action**. That is the only honest
// way to believe a property that has to hold in states nobody wrote a test for.
//
// The random source is the engine's own seeded generator, so a failing run is replayable
// from the seed printed in the assertion.

import test from 'node:test';
import assert from 'node:assert/strict';

import { viPack, enPack } from './helpers/load.mjs';
import {
  createGame, createSession, reduce, tableView, checkInvariants, seedFrom,
} from '../src/engine/index.mjs';
import { nextInt } from '../src/engine/rng.mjs';

/** A local generator, so fuzzing never perturbs the session's own RNG. */
function chooser(seed) {
  let s = seedFrom(seed);
  return (n) => {
    const [next, v] = nextInt(s, Math.max(1, n));
    s = next;
    return v;
  };
}

function fuzzOne(pack, seed, steps, stage = 1) {
  const game = createGame(pack, { maxCells: 24 });
  const pick = chooser(seed);
  let state = { ...createSession(game, { seed }), stage };
  const history = [];

  const check = (action) => {
    history.push(action);
    const bad = checkInvariants(game, state, { language: pack.language });
    if (bad.length > 0) {
      assert.fail(`seed ${seed}: ${bad.map((b) => `${b.code}(${b.detail})`).join(', ')}\n`
        + `after ${history.length} actions: ${JSON.stringify(history.slice(-8))}`);
    }
  };

  check({ type: 'start' });
  let words = 0;

  for (let i = 0; i < steps; i += 1) {
    const roll = pick(100);
    let action;
    if (state.phase === 'album') {
      action = roll < 80 ? { type: 'leaveAlbum' } : { type: 'partsHint' };
    } else if (state.status === 'announcing') {
      action = { type: 'advance' };
      words += 1;
    } else if (roll < 62) {
      // A tap on the table — live or flat, chosen without looking, exactly as he does.
      const cells = tableView(game, state).cells;
      action = cells.length === 0
        ? { type: 'partsHint' }
        : { type: 'tapSymbol', symbolId: cells[pick(cells.length)].id };
    } else if (roll < 78) {
      action = { type: 'tapStripCell', index: pick(4) };
    } else if (roll < 88) {
      action = { type: 'autoPlay' };
    } else if (roll < 94) {
      // Actions that cannot apply here. They must be no-ops, not corruptions.
      action = [{ type: 'advance' }, { type: 'leaveAlbum' }, { type: 'nonsense' },
        { type: 'tapSymbol', symbolId: 'not-a-symbol' }][pick(4)];
    } else {
      action = { type: 'partsHint' };
    }
    state = reduce(game, state, action);
    check(action);
  }
  return { state, words };
}

for (const [label, load] of [['Vietnamese', viPack], ['English', enPack]]) {
  test(`${label}: 400 fuzzed sessions, every action checked, no invariant violated`, () => {
    const pack = load();
    let words = 0;
    let discovered = new Set();
    for (let i = 0; i < 400; i += 1) {
      // Every stage, so the wide tables are fuzzed as hard as the narrow ones.
      const out = fuzzOne(pack, `fuzz-${label}-${i}`, 60, 1 + (i % 5));
      words += out.words;
      for (const id of Object.keys(out.state.discovered)) discovered.add(id);
    }
    // A fuzzer that never reaches the interesting states is a green check nobody earned.
    assert.ok(words > 800, `only ${words} words were made across 400 sessions`);
    assert.ok(discovered.size >= 10, `only ${discovered.size} distinct words were ever found`);
  });
}

test('a long session stays consistent — 4000 actions, one seed, every state checked', () => {
  const out = fuzzOne(viPack(), 'marathon', 4000, 5);
  assert.ok(out.words > 150, `only ${out.words} words in 4000 actions`);
  assert.ok(out.state.stage >= 1);
});

test('the fuzzer can fail — a deliberately broken live set is caught', () => {
  // `development-process.md` §5: never trust a green check you have not seen fail. The
  // fault injected is the exact defect the mechanic exists to prevent — a symbol that is
  // live with nothing behind it, which is a path to garbage.
  const game = createGame(viPack(), { maxCells: 24 });
  const state = { ...createSession(game, { seed: 'x' }), stage: 5 };
  const tree = game.treeFor(24);
  const flat = tableView(game, state).cells.find((c) => !c.live);
  assert.ok(flat, 'no flat tile to corrupt');
  tree.root.live.add(flat.id);
  try {
    const bad = checkInvariants(game, state);
    assert.ok(bad.some((b) => b.code === 'liveSetWrong'),
      `the invariant did not catch a live symbol with no word behind it: ${JSON.stringify(bad)}`);
  } finally {
    tree.root.live.delete(flat.id);
  }
  assert.deepEqual(checkInvariants(game, state), []);
});
