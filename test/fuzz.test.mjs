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
import { packWithADeadSymbol, phonePages } from './helpers/fixtures.mjs';

/** A local generator, so fuzzing never perturbs the session's own RNG. */
function chooser(seed) {
  let s = seedFrom(seed);
  return (n) => {
    const [next, v] = nextInt(s, Math.max(1, n));
    s = next;
    return v;
  };
}

function fuzzOne(pack, seed, steps, pages = null) {
  const game = createGame(pack, { pages });
  const pick = chooser(seed);
  let state = createSession(game, { seed });
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
      // A tap on the table. **Mostly a standing tile, sometimes any tile at all** — which
      // is what a child does with a board that is 90% flat, and what keeps the fuzzer out
      // of a long walk of no-ops. Both paths are exercised every session.
      const cells = tableView(game, state).cells;
      const live = cells.filter((c) => c.live);
      const pool = (roll < 40 && live.length > 0) ? live : cells;
      action = pool.length === 0
        ? { type: 'partsHint' }
        : { type: 'tapSymbol', symbolId: pool[pick(pool.length)].id };
    } else if (roll < 74) {
      // **Undo: the whole strip, one symbol per tap** (revision 5). It carries no index
      // any more, so a stray one must be ignored rather than obeyed — which is what the
      // extra field here is for.
      action = { type: 'tapStrip', index: pick(4) };
    } else if (roll < 82) {
      action = { type: 'autoPlay' };
    } else if (roll < 88) {
      // **The rail** (V15): he may wander onto any page, including a dead one, and the
      // app must never yank him off a page he chose. An out-of-range index must be a
      // no-op like every other impossible action.
      action = { type: 'tapPage', index: pick(game.inventory.pages.length + 1) };
    } else if (roll < 94) {
      // Actions that cannot apply here. They must be no-ops, not corruptions.
      action = [{ type: 'advance' }, { type: 'leaveAlbum' }, { type: 'nonsense' },
        { type: 'tapSymbol', symbolId: 'not-a-symbol' },
        // The retired revision-4 action: it must be a no-op, not a second undo path.
        { type: 'tapStripCell', index: 0 }][pick(5)];
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
    const phone = phonePages(label === 'Vietnamese' ? 'vi' : 'en');
    for (let i = 0; i < 400; i += 1) {
      // Both boards, alternating: the tablet (one page, no rail) and the owner's phone
      // (paged). Paging is state, and half of §V is unreachable without it.
      const out = fuzzOne(pack, `fuzz-${label}-${i}`, 60, i % 2 === 0 ? null : phone);
      words += out.words;
      for (const id of Object.keys(out.state.discovered)) discovered.add(id);
    }
    // A fuzzer that never reaches the interesting states is a green check nobody earned.
    assert.ok(words > 800, `only ${words} words were made across 400 sessions`);
    assert.ok(discovered.size >= 10, `only ${discovered.size} distinct words were ever found`);
  });
}

test('a long session stays consistent — 4000 actions, one seed, every state checked', () => {
  const out = fuzzOne(viPack(), 'marathon', 4000, phonePages('vi'));
  assert.ok(out.words > 150, `only ${out.words} words in 4000 actions`);
  assert.ok(out.state.page >= 0 && out.state.page < 4);
});

test('the fuzzer can fail — a deliberately broken live set is caught', () => {
  // `development-process.md` §5: never trust a green check you have not seen fail. The
  // fault injected is the exact defect the mechanic exists to prevent — a symbol that is
  // live with nothing behind it, which is a path to garbage.
  //
  // The symbol to corrupt is **constructed** (`helpers/fixtures.mjs`) rather than found on
  // the seed board. Looking for one there is how this check silently stopped running the
  // day the inventory order improved and every onset on the board led to a word.
  const { game, state, deadId } = packWithADeadSymbol('vi');
  const tree = game.tree;
  assert.deepEqual(checkInvariants(game, state), [], 'the fixture is not clean to begin with');
  tree.root.live.add(deadId);
  try {
    const bad = checkInvariants(game, state);
    assert.ok(bad.some((b) => b.code === 'liveSetWrong'),
      `the invariant did not catch a live symbol with no word behind it: ${JSON.stringify(bad)}`);
  } finally {
    tree.root.live.delete(deadId);
  }
  assert.deepEqual(checkInvariants(game, state), []);
});
