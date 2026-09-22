// Driving a session the way a child's finger would: only through actions the engine
// accepts. Nothing here reaches inside the state to arrange a board, because a board
// arranged by hand proves nothing about whether the board can be reached.

import { bandInstances, reduce } from '../../src/engine/index.mjs';

/** Tap the band instance carrying `tileId`. Throws if it is not on offer. */
export function tap(pack, state, tileId) {
  const inst = bandInstances(pack, state).find((i) => i.tileId === tileId);
  if (!inst) {
    throw new Error(`"${tileId}" is not in the band; on offer: ${bandInstances(pack, state).map((i) => i.tileId).join(', ')}`);
  }
  return reduce(pack, state, { type: 'tapTile', instanceId: inst.id });
}

export function tapCell(pack, state, cellIndex) {
  return reduce(pack, state, { type: 'tapCell', cellIndex });
}

/** Fill every empty cell with the tile it expects. */
export function solve(pack, state) {
  let s = state;
  let guard = 0;
  while (s.round && s.round.status === 'building') {
    const next = s.round.cells.find((c) => c.tileId === null);
    if (!next) break;
    s = tap(pack, s, next.expect);
    if (guard++ > 32) throw new Error('solve did not terminate');
  }
  return s;
}
