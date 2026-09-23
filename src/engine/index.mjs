// The engine's public surface. The React layer imports from here and from nowhere else
// inside `src/engine/`.
//
// Everything below is pure. Nothing in this directory imports React, a timer, a
// filesystem, `Date.now()` or `Math.random()`; `test/purity.test.mjs` asserts that by
// reading the source, because it is the kind of property that is easy to hold today and
// easy to lose in one line next month.

export { resolvePack, wordFromParts, SCHEMA_SUPPORTED, LANGUAGES } from './pack.mjs';

export {
  createGame, buildTree, nodeAt, isLive, wordIdAt, continues, tableSizesFor,
} from './tree.mjs';

export {
  createSession, reduce, tableView, stripView, shelfView, chantSteps, motifNotes,
  partsHintSteps, symbolsFrom, imageFor, effectiveCells, treeOf, isStuck, hintSymbol,
  STATE_VERSION,
} from './session.mjs';

export { langFor } from './lang/index.mjs';

export {
  CELLS_BY_STAGE, MAX_STAGE, WORDS_PER_STAGE, SHELF_SLOTS, clampStage, cellsForStage,
} from './stages.mjs';

export { nfc, sameText, glyphLength } from './text.mjs';

export { seedFrom } from './rng.mjs';

export { checkInvariants } from './invariants.mjs';
