// The prefix tree — `gameplay.md` §3.3, `acceptance-criteria.md` B2–B6, B14, E11.
//
// This is the whole mechanic stated as properties. If any of these is false the app is
// revision 1 again: a child can build garbage, or reach a state he cannot leave.

import test from 'node:test';
import assert from 'node:assert/strict';

import { viPack, enPack } from './helpers/load.mjs';
import {
  createGame, buildTree, nodeAt, isLive, wordIdAt, continues, tableSizesFor,
  createSession, reduce, tableView, langFor, CELLS_BY_STAGE,
} from '../src/engine/index.mjs';
import { start, live, tap } from './helpers/play.mjs';

const PACKS = [['Vietnamese', viPack], ['English', enPack]];

test('B2 — the table is the first `cells` symbols of the inventory order, and nothing else', () => {
  const pack = enPack();
  for (const cells of CELLS_BY_STAGE) {
    const tree = buildTree(pack, cells);
    assert.deepEqual(tree.inventory.letter, pack.inventoryOrder.letter.slice(0, cells));
  }
});

test('C2 — the Vietnamese onset table spends its last cell on the ∅ socket', () => {
  const pack = viPack();
  for (const cells of CELLS_BY_STAGE) {
    const tree = buildTree(pack, cells);
    assert.equal(tree.inventory.onset.length, cells, `${cells} cells`);
    assert.equal(tree.inventory.onset[cells - 1], '∅');
    assert.deepEqual(tree.inventory.onset.slice(0, cells - 1),
      pack.inventoryOrder.onset.slice(0, cells - 1));
  }
});

test('B7 — cell position is a pure function of the inventory order and nothing else', () => {
  for (const [label, load] of PACKS) {
    const pack = load();
    const a = buildTree(pack, 24);
    const b = buildTree(load(), 24);
    for (const group of Object.keys(a.inventory)) {
      assert.deepEqual(a.inventory[group], b.inventory[group], `${label} ${group}`);
    }
  }
});

test('B3 — a symbol is live iff some eligible word continues the prefix, checked exhaustively', () => {
  for (const [label, load] of PACKS) {
    const pack = load();
    const lang = langFor(pack.language);
    const tree = buildTree(pack, 24);
    const paths = tree.eligible.map((w) => lang.pathFor(w));

    // Walk every reachable prefix, breadth-first, and check the live set at each against
    // the word list directly rather than against the tree that produced it.
    const seen = new Set();
    const queue = [[]];
    let checked = 0;
    while (queue.length > 0) {
      const prefix = queue.shift();
      const key = prefix.join('\u0000');
      if (seen.has(key)) continue;
      seen.add(key);
      const symbols = lang.tableFor(pack, tree.inventory, prefix).symbols.map((s) => s.id);
      for (const symbol of symbols) {
        const wanted = [...prefix, symbol];
        const reachable = paths.some((p) => p.length >= wanted.length
          && wanted.every((s, i) => p[i] === s));
        assert.equal(isLive(tree, prefix, symbol), reachable,
          `${label}: ${wanted.join('+')} live=${isLive(tree, prefix, symbol)} reachable=${reachable}`);
        checked += 1;
        if (reachable) queue.push(wanted);
      }
    }
    assert.ok(checked > 200, `${label}: only ${checked} (prefix, symbol) pairs`);
  }
});

test('B5 / E11 — tapping only live symbols always ends in a word, from every prefix', () => {
  for (const [label, load] of PACKS) {
    const pack = load();
    const { game, state } = start(load === viPack ? pack : pack, { stage: 5 });
    const walk = (s, depth) => {
      const options = live(game, s);
      if (s.status === 'announcing') return 1;
      assert.ok(options.length > 0, `${label}: stuck at ${s.prefix.join('+')}`);
      assert.ok(depth < 8, `${label}: runaway at ${s.prefix.join('+')}`);
      let found = 0;
      for (const symbol of options) found += walk(tap(game, s, symbol), depth + 1);
      return found;
    };
    const words = walk(state, 0);
    assert.equal(words, game.treeFor(24).eligible.length,
      `${label}: every live path should end at exactly one eligible word`);
  }
});

test('B6 — either the prefix is a word, or something is live. There is no third case', () => {
  const pack = viPack();
  const tree = buildTree(pack, 24);
  const visit = (node, prefix) => {
    assert.ok(node.wordId !== null || node.live.size > 0, `stuck at ${prefix.join('+')}`);
    for (const [symbol, child] of node.children) visit(child, [...prefix, symbol]);
  };
  visit(tree.root, []);
});

test('B14 / L7 — a word withheld for a missing asset is absent from the tree', () => {
  const pack = viPack();
  const full = buildTree(pack, 24);
  const target = full.eligible[0];
  // The same pack with that word's media gone. `resolvePack` withholds it; the tree must
  // then hold no path to it, and the symbol it used stays on the table, simply flat.
  const gone = new Set([target.audio.word.src]);
  const trimmed = viPack({ hasMedia: (ref) => !gone.has(ref) });
  const tree = buildTree(trimmed, 24);
  assert.ok(full.eligible.some((w) => w.id === target.id));
  assert.ok(!tree.eligible.some((w) => w.id === target.id), `${target.id} is still eligible`);
  assert.equal(wordIdAt(tree, langFor('vi').pathFor(target)), null);
  // The board does not reshuffle: the symbol is still in its cell.
  assert.deepEqual(tree.inventory.onset, full.inventory.onset);
});

test('D12 — no final-only tile is live on an empty strip, and it is B4 doing it for free', () => {
  const { game, state } = start(enPack(), { stage: 5 });
  const table = tableView(game, state);
  for (const id of ['ck', 'll', 'ss', 'ff', 'zz', 'ng', 'x']) {
    const cell = table.cells.find((c) => c.id === id);
    if (!cell) continue; // beyond the 24-cell ceiling; not on the board at all
    assert.equal(cell.live, false, `${id} begins a word`);
  }
});

test('D11 — `c` and `k` are never both live, at any reachable prefix', () => {
  const { game, state } = start(enPack(), { stage: 5 });
  const walk = (s, depth) => {
    if (s.status === 'announcing' || depth > 6) return;
    const options = live(game, s);
    assert.ok(!(options.includes('c') && options.includes('k')),
      `both c and k are live at ${s.prefix.join('+')}`);
    for (const symbol of options) walk(tap(game, s, symbol), depth + 1);
  };
  walk(state, 0);
});

test('D13 — after `c` `a`, exactly the letters that complete a pack word are live', () => {
  const pack = enPack();
  const { game, state } = start(pack, { stage: 5 });
  const after = tap(game, tap(game, state, 'c'), 'a');
  const expected = pack.words
    .filter((w) => w.tiles[0] === 'c' && w.tiles[1] === 'a' && w.tiles.length > 2)
    .map((w) => w.tiles[2]);
  assert.deepEqual(live(game, after).sort(), [...new Set(expected)].sort());
  assert.ok(live(game, after).length > 0);
});

test('C7 — a stop-final rime produces a two-cell tone table, not six with four disabled', () => {
  const pack = viPack();
  const { game, state } = start(pack, { stage: 5 });
  // `sách` = s + ach + sắc. `ach` ends in `ch`, so only sắc and nặng exist at all.
  const after = tap(game, tap(game, state, 's'), 'ach');
  const table = tableView(game, after);
  assert.equal(table.role, 'tone');
  assert.deepEqual(table.cells.map((c) => c.id), ['sac', 'nang']);
  // Legality is absence; completability is flatness. The two never have to be told apart.
  assert.deepEqual(table.cells.filter((c) => c.live).map((c) => c.id), ['sac']);
});

test('C6 — a tone tile renders the chosen rime marked, never a bare diacritic', () => {
  const pack = viPack();
  const { game, state } = start(pack, { stage: 5 });
  const after = tap(game, tap(game, state, 'm'), 'eo');
  const table = tableView(game, after);
  assert.equal(table.role, 'tone');
  for (const cell of table.cells) {
    assert.equal(cell.glyph, pack.tileById.rime.eo.toned[cell.id]);
    assert.ok(cell.glyph.includes('o'), `${cell.id} renders "${cell.glyph}"`);
  }
  assert.equal(table.cells.find((c) => c.id === 'huyen').glyph, 'èo');
});

test('C9 — exactly one live tone, and the word is not auto-committed', () => {
  const pack = viPack();
  const { game, state } = start(pack, { stage: 5 });
  const after = tap(game, tap(game, state, 'm'), 'eo');
  assert.deepEqual(live(game, after), ['huyen']);
  assert.equal(after.status, 'building', 'the word committed itself without his tap');
  const done = tap(game, after, 'huyen');
  assert.equal(done.status, 'announcing');
});

test('F17 — in Vietnamese no word is a proper prefix of another, so §5.5 cannot arise', () => {
  const pack = viPack();
  const tree = buildTree(pack, 24);
  const visit = (node, prefix) => {
    if (node.wordId !== null) {
      assert.equal(node.children.size, 0, `${prefix.join('+')} is a word and continues`);
      assert.equal(continues(tree, prefix), false);
    }
    for (const [symbol, child] of node.children) visit(child, [...prefix, symbol]);
  };
  visit(tree.root, []);
});

test('the tree walk is O(depth): nodeAt never scans the vocabulary', () => {
  const tree = buildTree(viPack(), 24);
  // Structural rather than timed: a node's live set is a Set and its children a Map, so
  // both answer in constant time whatever the pack grows to. A timing assertion here
  // would measure this machine's load, not the property (`CLAUDE.md`: a number that
  // correlates with a property is not that property).
  const node = nodeAt(tree, ['m']);
  assert.ok(node.live instanceof Set);
  assert.ok(node.children instanceof Map);
  assert.equal(nodeAt(tree, ['m', 'zzz']), null);
});

test('tableSizesFor caps the ladder at what the viewport serves', () => {
  assert.deepEqual(tableSizesFor(24), [8, 12, 16, 20, 24]);
  assert.deepEqual(tableSizesFor(20), [8, 12, 16, 20]);
  assert.deepEqual(tableSizesFor(8), [8]);
});

test('createGame builds every table size the ladder can ask for, up front', () => {
  const game = createGame(viPack(), { maxCells: 24 });
  assert.deepEqual([...game.trees.keys()].sort((a, b) => a - b), [8, 12, 16, 20, 24]);
  // And `treeFor` never returns nothing for a size in range.
  for (let n = 8; n <= 24; n += 1) assert.ok(game.treeFor(n), `no tree for ${n}`);
});

test('L6 — a pack with nothing playable opens on the empty card, never a dead table', () => {
  const pack = viPack({ words: [] });
  const game = createGame(pack, { maxCells: 24 });
  const state = createSession(game, { seed: 'x' });
  assert.equal(state.phase, 'empty');
  // And no action can move it off that phase into a board with nothing live.
  const after = reduce(game, state, { type: 'tapSymbol', symbolId: 'm' });
  assert.equal(after.phase, 'empty');
});
