// The stage ladder. `gameplay.md` §6.1.
//
// Revision 2 reduced this file to almost nothing, which is the point. `stage` is the
// child's, not a word's, and it governs exactly one thing: **how many cells the table
// has.** Revision 1's per-row palette tables, its tone-by-stage table and its per-word
// stage bump are deleted — there are no rounds and no palettes for them to size.
//
// He is never told. No level-up screen, no badge, no sound (`acceptance-criteria.md` H3).
// Four new cells appear between one word and the next.

/** `gameplay.md` §6.1 — cells on the table at each stage. */
export const CELLS_BY_STAGE = [8, 12, 16, 20, 24];

export const MAX_STAGE = CELLS_BY_STAGE.length;

/** `gameplay.md` §6.1 — 8 new words at the current stage with no auto-play assist. */
export const WORDS_PER_STAGE = 8;

/** `gameplay.md` §6.2 — five slots, then the shelf tips into the album. */
export const SHELF_SLOTS = 5;

export function clampStage(stage) {
  if (!Number.isFinite(stage)) return 1;
  return Math.min(MAX_STAGE, Math.max(1, Math.floor(stage)));
}

/**
 * How many cells the table shows, capped by what the viewport serves (`ui.md` §4.3 F7,
 * `acceptance-criteria.md` H1). The cap is why the two shortest supported phones top out
 * at stage 4 — recorded in `gameplay.md` §6.1 rather than smoothed over.
 */
export function cellsForStage(stage, maxCells = CELLS_BY_STAGE[MAX_STAGE - 1]) {
  return Math.min(CELLS_BY_STAGE[clampStage(stage) - 1], maxCells);
}
