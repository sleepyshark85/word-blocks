// `acceptance-criteria.md` B12 — the same seed and the same sequence of taps produces the
// identical sequence of tables, live sets, words and images.
//
// This is the property the whole verification strategy rests on: without it a tester
// cannot replay a failure, and every report becomes an anecdote.

import test from 'node:test';
import assert from 'node:assert/strict';

import { viPack, enPack } from './helpers/load.mjs';
import {
  createGame, createSession, reduce, tableView, pageView, stripView, chantSteps, hintSymbol,
} from '../src/engine/index.mjs';
import { phonePages } from './helpers/fixtures.mjs';

/** Everything a player could observe after one action, as a comparable string. */
function observation(game, state) {
  const table = tableView(game, state);
  return JSON.stringify({
    cells: table.cells.map((c) => [c.id, c.glyph, c.live, c.page, c.slot]),
    // **The page is part of what he observes** (V7, V12, V13): two replays that differ
    // only in which window is on screen are two different games to a 4-year-old.
    page: state.page,
    pageBy: state.pageBy,
    rail: pageView(game, state).buttons.map((b) => [b.glyph, b.live, b.current]),
    strip: stripView(game, state).map((c) => [c.glyph, c.filled, c.merged, c.toned]),
    prefix: state.prefix,
    status: state.status,
    pending: state.pending && {
      word: state.pending.text,
      isNew: state.pending.isNew,
      image: state.pending.image && state.pending.image.src,
      imageIndex: state.pending.imageIndex,
      continues: state.pending.continues,
    },
    chant: chantSteps(game, state).map((s) => [s.step, s.caption, s.cells.map((c) => c.glyph).join('|')]),
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
function run(pack, seed, steps, pages = null) {
  const game = createGame(pack, { pages });
  let s = createSession(game, { seed });
  const trace = [observation(game, s)];
  for (let i = 0; i < steps; i += 1) {
    if (s.phase === 'album') s = reduce(game, s, { type: 'leaveAlbum' });
    else if (s.status === 'announcing') s = reduce(game, s, { type: 'advance' });
    else if (i % 11 === 10) s = reduce(game, s, { type: 'autoPlay' });
    else if (i % 7 === 6) s = reduce(game, s, { type: 'tapStripCell', index: 0 });
    else if (i % 13 === 12) s = reduce(game, s, { type: 'tapPage', index: (i / 13 | 0) % 4 });
    else {
      // Mostly a standing tile, sometimes a flat one — which is what a child does with a
      // board that is 90% flat. Picking blindly from 67 cells would make a trace of
      // almost nothing but no-ops, and a replay of no-ops proves nothing.
      const cells = tableView(game, s).cells;
      const live = cells.filter((c) => c.live);
      const pool = (i % 5 === 4 || live.length === 0) ? cells : live;
      const cell = pool[(i * 5 + 3) % Math.max(1, pool.length)];
      if (cell) s = reduce(game, s, { type: 'tapSymbol', symbolId: cell.id });
    }
    trace.push(observation(game, s));
  }
  return trace;
}

for (const [label, load, lang] of [['Vietnamese', viPack, 'vi'], ['English', enPack, 'en']]) {
  // Both boards: the tablet (one page, no rail) and the owner's phone (paged), because
  // paging is state and an unpaged replay would never execute §V.
  for (const [board, pages] of [['tablet', null], ['paged', phonePages(lang)]]) {
    test(`B12 — ${label}, ${board}: the same seed and taps replay identically`, () => {
      const a = run(load(), 'replay-me', 240, pages);
      const b = run(load(), 'replay-me', 240, pages);
      assert.equal(a.length, b.length);
      for (let i = 0; i < a.length; i += 1) assert.equal(a[i], b[i], `step ${i} diverged`);
      assert.ok(new Set(a).size > 40, `only ${new Set(a).size} distinct states`);
      assert.ok(a.some((o) => o.includes('"status":"announcing"')), 'no word was ever made');
    });
  }

  test(`B12 — ${label}: two page plans agree on everything except the page`, () => {
    // V7/V8 — the slot of a character is a pure function of the plan, and **nothing
    // else about the game depends on the device**: the same taps make the same words,
    // the same live sets and the same pictures on a tablet and on a phone.
    const strip = (o) => JSON.parse(o).strip;
    const a = run(load(), 'same', 120, null).map(strip);
    const b = run(load(), 'same', 120, phonePages(lang)).map(strip);
    assert.deepEqual(a, b, 'the phone and the tablet played different games');
  });

  test(`B12 — ${label}: a different seed changes only what the seed governs`, () => {
    // The seed governs the idle ladder's choice and nothing else: the tables, the live
    // sets and the images are all pure functions of the pack and his taps. So two seeds
    // must agree on every table and disagree, somewhere, on a hint.
    const pack = load();
    const g1 = createGame(pack);
    const g2 = createGame(pack);
    const s1 = createSession(g1, { seed: 'one' });
    const s2 = createSession(g2, { seed: 'two' });
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
  const a = createGame(viPack());
  const b = createGame(viPack());
  const shape = (tree) => {
    const out = [];
    const visit = (node, prefix) => {
      out.push(`${prefix.join('+')}=${node.wordId ?? ''}[${[...node.live].join(',')}]`);
      for (const [symbol, child] of node.children) visit(child, [...prefix, symbol]);
    };
    visit(tree.root, []);
    return out.join('\n');
  };
  assert.equal(shape(a.tree), shape(b.tree));
  // And the page plan cannot change it: the tree is over the pack, not over the device.
  const phone = createGame(viPack(), { pages: phonePages('vi') });
  assert.equal(shape(a.tree), shape(phone.tree), 'paging changed the tree');
});
