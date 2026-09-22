// The engine's public surface. Slice 3's React layer imports from here and from nowhere
// else inside `src/engine/`.
//
// Everything below is pure. Nothing in this directory imports React, a timer, a
// filesystem, `Date.now()` or `Math.random()`; `test/purity.test.mjs` asserts that by
// reading the source, because it is the kind of property that is easy to hold today and
// easy to lose in one line next month.

export { resolvePack, wordFromParts, SCHEMA_SUPPORTED, LANGUAGES } from './pack.mjs';

export {
  createSession, reduce, bandInstances, pageRail, resolutionSteps, partsHintSteps,
  STATE_VERSION,
} from './session.mjs';

export {
  createRound, artFor, segmentCount, litCells, veilOpacity, availableInstances,
  hintInstance, isSolvable, VEIL_START,
} from './round.mjs';

export { langFor } from './lang/index.mjs';

export {
  roundStage, clampStage,
  VI_ROWS, VI_TONES_BY_STAGE, VI_MAX_PER_ROW, EN_TRAY, EN_MAX_TRAY,
  MAX_STAGE, ROUNDS_PER_STAGE, ROUNDS_PER_PAGE, MEETING_BUMP_CAP, ASSISTS_BEFORE_REQUEUE,
} from './stages.mjs';

export { nfc, sameText, glyphLength } from './text.mjs';

export { seedFrom } from './rng.mjs';

export { checkInvariants } from './invariants.mjs';
