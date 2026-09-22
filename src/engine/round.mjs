// A round: a target word, the constrained palette it is built from, and the cells the
// child fills. Everything here is a pure function of a pack, a word, a stage and an RNG
// state — replay the same three and you get the same round (`acceptance-criteria.md` B12).

import { langFor } from './lang/index.mjs';

/**
 * Which picture the prompt shows, and which the reveal shows.
 *
 * `gameplay.md` §3.2: the prompt is `images[0]` under a veil from the first frame of the
 * round; the reveal cycles `image[1..n]` across meetings, so the payoff is a *different*
 * photograph of the same thing (`acceptance-criteria.md` B9, F2). With one image the
 * reveal still works and loses only the surprise (B10). With none, the bundled fallback
 * emoji carries the round (`content-pipeline.md` §5) — which is why `fallbackEmoji` is a
 * key into media inside the app binary and not a pack reference: the fallback exists for
 * the case where the pack is damaged, so it must not be damageable.
 */
export function artFor(word, encounterIndex) {
  const n = word.images.length;
  const prompt = n > 0 ? word.images[0] : null;
  let reveal = prompt;
  if (n >= 2) reveal = word.images[1 + (Math.max(0, encounterIndex) % (n - 1))];
  return {
    wordId: word.id,
    prompt,
    reveal,
    fallbackEmoji: n === 0 ? word.fallbackEmoji : null,
  };
}

/**
 * Build a round. `stage` is already resolved by `stages.roundStage`; it is passed in
 * rather than computed here so a test can generate a stage-5 round for any word.
 */
export function createRound(pack, { word, stage, rngState, encounterIndex = 0, roundId }) {
  const lang = langFor(pack.language);
  const [rng, palette] = lang.buildPalette(pack, { word, stage, rngState });
  const cells = lang.cellsFor(word).map((c) => ({ ...c, tileId: null, instanceId: null }));
  return [rng, {
    id: roundId,
    targetId: word.id,
    stage,
    cells,
    palette,
    placements: [],
    assists: 0,
    art: artFor(word, encounterIndex),
    status: 'building',
    outcome: null,
  }];
}

/** `acceptance-criteria.md` B2 — the frame border shows exactly one segment per cell. */
export function segmentCount(round) {
  return round.cells.length;
}

/** A cell is lit when it holds the right tile. Derived, so it can never drift. */
export function litCells(pack, round) {
  const lang = langFor(pack.language);
  return round.cells.map((_, i) => lang.cellCorrect(round, i));
}

/**
 * `ui.md` §7.3: the veil steps down by `0.16 / N` per correct cell, so the picture
 * literally gets brighter as he works — readable across a room, with the sound off.
 */
export const VEIL_START = 0.16;

export function veilOpacity(pack, round) {
  const lit = litCells(pack, round).filter(Boolean).length;
  const n = round.cells.length;
  if (n === 0) return 0;
  return Math.max(0, VEIL_START - (VEIL_START / n) * lit);
}

/** Instances still in the band — everything the child can touch right now. */
export function availableInstances(pack, round) {
  const lang = langFor(pack.language);
  const seated = new Set(round.cells.map((c) => c.instanceId).filter((x) => x !== null));
  return lang.activeRow(round).instances.filter((i) => !seated.has(i.id));
}

/**
 * The tile the hint ladder should breathe at 40 s and fly into place at 80 s
 * (`gameplay.md` §6.5, `acceptance-criteria.md` G3, G5): the correct tile for the **next
 * empty cell**. Returns null only when the round is already complete.
 */
export function hintInstance(pack, round) {
  const next = round.cells.find((c) => c.tileId === null);
  if (!next) return null;
  const seated = new Set(round.cells.map((c) => c.instanceId).filter((x) => x !== null));
  const lang = langFor(pack.language);
  const row = lang.activeRow(round).instances;
  return row.find((i) => i.tileId === next.expect && !seated.has(i.id)) ?? null;
}

/**
 * Is the round still winnable from here? `acceptance-criteria.md` E10: *no state exists
 * from which the round cannot be completed.* Used by the fuzzer after every single
 * action, which is the only way to believe it.
 *
 * Seating does not enter into it: every seated tile lifts home on a tap and nothing is
 * ever refused (`gameplay.md` §4.2), so the question is only whether the palette holds
 * the tiles the target needs.
 */
export function isSolvable(pack, round) {
  return langFor(pack.language).canSolve(round);
}
