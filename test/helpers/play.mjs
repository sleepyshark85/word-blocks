// Driving a session the way a child's finger would: only through actions the engine
// accepts. Nothing here reaches inside the state to arrange a board, because a board
// arranged by hand proves nothing about whether the board can be reached.

import { createGame, createSession, reduce, tableView, treeOf } from '../../src/engine/index.mjs';

/** A game and a session at a given stage, which is the only thing the table depends on. */
export function start(pack, { seed = 'test', stage = 5, maxCells = 24 } = {}) {
  const game = createGame(pack, { maxCells });
  const state = { ...createSession(game, { seed }), stage };
  return { game, state };
}

/** Every symbol on the table right now, live or flat. */
export function cells(game, state) {
  return tableView(game, state).cells;
}

export function live(game, state) {
  return cells(game, state).filter((c) => c.live).map((c) => c.id);
}

/** Tap a symbol on the table. Throws if it is not on the table at all. */
export function tap(game, state, symbolId) {
  const cell = cells(game, state).find((c) => c.id === symbolId);
  if (!cell) {
    throw new Error(`"${symbolId}" is not on the table; it holds: ${cells(game, state).map((c) => c.id).join(', ')}`);
  }
  return reduce(game, state, { type: 'tapSymbol', symbolId });
}

export function undoTo(game, state, index) {
  return reduce(game, state, { type: 'tapStripCell', index });
}

/** Tap live symbols until a word forms, then commit it. Returns the state after. */
export function discover(game, state, path) {
  let s = state;
  for (const symbol of path) s = tap(game, s, symbol);
  if (s.status !== 'announcing') throw new Error(`${path.join('+')} is not a word`);
  return reduce(game, s, { type: 'advance' });
}

/** The path of the first live symbol at every position — the leftmost word on the tree. */
export function firstPath(game, state) {
  let s = state;
  const path = [];
  let guard = 0;
  while (s.status === 'building') {
    const next = live(game, s)[0];
    if (next === undefined) break;
    path.push(next);
    s = tap(game, s, next);
    if (guard++ > 16) throw new Error('firstPath did not terminate');
  }
  return path;
}

/**
 * The live path that reaches a word he has not discovered yet, or null. Used where a
 * test needs to make *progress* rather than merely to make a word.
 */
export function unseenPath(game, state) {
  // The tree the session is actually playing on, not the widest one it could be.
  const tree = treeOf(game, state);
  const walk = (node, prefix) => {
    if (node.wordId !== null && !state.discovered[node.wordId]) return prefix;
    for (const [symbol, child] of node.children) {
      const found = walk(child, [...prefix, symbol]);
      if (found) return found;
    }
    return null;
  };
  return tree ? walk(tree.root, []) : null;
}
