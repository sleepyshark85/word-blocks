// The engine's public surface. The React layer imports from here and from nowhere else
// inside `src/engine/`.
//
// Everything below is pure. Nothing in this directory imports React, a timer, a
// filesystem, `Date.now()` or `Math.random()`; `test/purity.test.mjs` asserts that by
// reading the source, because it is the kind of property that is easy to hold today and
// easy to lose in one line next month.

export { resolvePack, wordFromParts, SCHEMA_SUPPORTED, LANGUAGES } from './pack.mjs';

export { buildInventory } from './table.mjs';

export {
  createGame, buildTree, nodeAt, isLive, wordIdAt, continues,
} from './tree.mjs';

export {
  createSession, reduce, tableView, pageView, stripView, shelfView, chantSteps, motifNotes,
  partsHintSteps, symbolsFrom, imageFor, treeOf, isStuck, hintSymbol, pageHasLive,
  progressOf,
  STATE_VERSION, SHELF_SLOTS,
} from './session.mjs';

export { langFor } from './lang/index.mjs';

export { nfc, sameText, glyphLength } from './text.mjs';

export { seedFrom } from './rng.mjs';

export { checkInvariants } from './invariants.mjs';
