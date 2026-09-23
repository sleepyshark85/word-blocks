// `acceptance-criteria.md` B12 — the same seed and the same sequence of taps produces the
// identical sequence of tables, live sets, words and images.
//
// This is the property the whole verification strategy rests on: without it a tester
// cannot replay a failure, and every report becomes an anecdote.

import test from 'node:test';
import assert from 'node:assert/strict';

import { viPack, enPack } from './helpers/load.mjs';
import {
  createGame, createSession, reduce, tableView, stripView, chantSteps, hintSymbol,
} from '../src/engine/index.mjs';

/** Everything a player could observe after one action, as a comparable string. */
function observation(game, state) {
  const table = tableView(game, state);
  return JSON.stringify({
    role: table.role,
    cells: table.cells.map((c) => [c.id, c.glyph, c.live]),
    strip: stripView(game, state).map((c) => [c.glyph, c.filled, c.socket]),
    prefix: state.prefix,
    status: state.status,
    pending: state.pending && {
      word: state.pending.text,
      isNew: state.pending.isNew,
      image: state.pending.image && state.pending.image.src,
      imageIndex: state.pending.imageIndex,
      continues: state.pending.continues,
    },
    chant: chantSteps(game, state).map((s) => [s.step, s.caption]),
    stage: state.stage,
    shelf: state.shelf.map((e) => [e.wordId, e.image && e.image.src]),
    album: state.album.map((e) => e.wordId),
    hint: hintSymbol(game, state),
  });
}

/**
 * A scripted run: a deterministic pseudo-child. It taps the *i*-th thing on the table,
 * live or flat, undoes every so often, and lets the ladder take a turn. Everything it
 * chooses is a function of the step number, so two runs of the same script are
 * comparable — the only variable under test is the engine.
 */
function run(pack, seed, steps, stage = 5) {
  const game = createGame(pack, { maxCells: 24 });
  let s = { ...createSession(game, { seed }), stage };
  const trace = [observation(game, s)];
  for (let i = 0; i < steps; i += 1) {
    if (s.phase === 'album') s = reduce(game, s, { type: 'leaveAlbum' });
    else if (s.status === 'announcing') s = reduce(game, s, { type: 'advance' });
    else if (i % 11 === 10) s = reduce(game, s, { type: 'autoPlay' });
    else if (i % 7 === 6) s = reduce(game, s, { type: 'tapStripCell', index: 0 });
    else {
      const cells = tableView(game, s).cells;
      const cell = cells[(i * 5 + 3) % Math.max(1, cells.length)];
      if (cell) s = reduce(game, s, { type: 'tapSymbol', symbolId: cell.id });
    }
    trace.push(observation(game, s));
  }
  return trace;
}

for (const [label, load] of [['Vietnamese', viPack], ['English', enPack]]) {
  test(`B12 — ${label}: the same seed and taps replay identically`, () => {
    const a = run(load(), 'replay-me', 240);
    const b = run(load(), 'replay-me', 240);
    assert.equal(a.length, b.length);
    for (let i = 0; i < a.length; i += 1) {
      assert.equal(a[i], b[i], `step ${i} diverged`);
    }
    // And the run actually did something — a trace of 240 identical states proves nothing.
    assert.ok(new Set(a).size > 40, `only ${new Set(a).size} distinct states`);
    assert.ok(a.some((o) => o.includes('"status":"announcing"')), 'no word was ever made');
  });

  test(`B12 — ${label}: a different seed changes only what the seed governs`, () => {
    // The seed governs the idle ladder's choice and nothing else: the tables, the live
    // sets and the images are all pure functions of the pack and his taps. So two seeds
    // must agree on every table and disagree, somewhere, on a hint.
    const pack = load();
    const g1 = createGame(pack, { maxCells: 24 });
    const g2 = createGame(pack, { maxCells: 24 });
    const s1 = { ...createSession(g1, { seed: 'one' }), stage: 5 };
    const s2 = { ...createSession(g2, { seed: 'two' }), stage: 5 };
    assert.deepEqual(tableView(g1, s1).cells.map((c) => [c.id, c.live]),
      tableView(g2, s2).cells.map((c) => [c.id, c.live]));
    const hints = new Set();
    let a = s1;
    let b = s2;
    for (let i = 0; i < 12; i += 1) {
      hints.add(`${hintSymbol(g1, a)}|${hintSymbol(g2, b)}`);
      a = reduce(g1, a, { type: 'autoPlay' });
      b = reduce(g2, b, { type: 'autoPlay' });
      if (a.status === 'announcing') a = reduce(g1, a, { type: 'advance' });
      if (b.status === 'announcing') b = reduce(g2, b, { type: 'advance' });
    }
    assert.ok([...hints].some((h) => h.split('|')[0] !== h.split('|')[1]),
      'two different seeds made every identical choice — the RNG is not wired in');
  });
}

test('the tree itself is byte-identical across two builds of the same pack', () => {
  const a = createGame(viPack(), { maxCells: 24 });
  const b = createGame(viPack(), { maxCells: 24 });
  const shape = (tree) => {
    const out = [];
    const visit = (node, prefix) => {
      out.push(`${prefix.join('+')}=${node.wordId ?? ''}[${[...node.live].join(',')}]`);
      for (const [symbol, child] of node.children) visit(child, [...prefix, symbol]);
    };
    visit(tree.root, []);
    return out.join('\n');
  };
  for (const n of [8, 12, 16, 20, 24]) {
    assert.equal(shape(a.treeFor(n)), shape(b.treeFor(n)), `the ${n}-cell tree differs`);
  }
});
