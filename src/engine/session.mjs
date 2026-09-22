// The session: `(state, action) => state`, and nothing else.
//
// No React, no timers, no `Date.now()`, no `Math.random()` (`development-process.md` §3).
// Every timer in this game — the idle ladder, the chant's gaps, the reveal's 3 s hold —
// lives in the React layer and reaches the engine only as an action. What the engine
// gives that layer back is a pair of counters (`state.idle`) that say *restart the
// ladder* and *defer the next escalation*, so the policy is testable here and the
// scheduling is testable there.
//
// Determinism is load-bearing: the same seed and the same sequence of actions produces
// the same rounds, palettes and outcomes (`acceptance-criteria.md` B12). That is what
// lets the tester replay a failure, and it is why the RNG state is a field of the
// session rather than a module-level variable.

import { shuffled, nextInt, seedFrom } from './rng.mjs';
import { langFor } from './lang/index.mjs';
import { createRound, artFor } from './round.mjs';
import {
  ROUNDS_PER_PAGE, ROUNDS_PER_STAGE, ASSISTS_BEFORE_REQUEUE, MAX_STAGE,
  roundStage, clampStage,
} from './stages.mjs';

export const STATE_VERSION = 1;

/* --------------------------------------------------------------------- the bag */

/**
 * `gameplay.md` §6.3 — a bag: every word with `minStage ≤ globalStage`, shuffled by the
 * seeded RNG, drawn without replacement, refilled and reshuffled when empty. He meets
 * every eligible word once before he meets any word twice.
 *
 * Refill is also when a word his mother added becomes playable without a restart
 * (`acceptance-criteria.md` J14) and when a word she deleted stops appearing (L4).
 */
function eligibleWords(pack, globalStage) {
  const eligible = pack.words.filter((w) => w.stage <= globalStage);
  if (eligible.length > 0) return eligible;
  // A pack whose easiest word is above the current stage would otherwise deal an empty
  // bag forever. Take the easiest words there are; a stage is a pacing device, not a
  // reason to show the child nothing.
  if (pack.words.length === 0) return [];
  const lowest = pack.words.reduce((m, w) => Math.min(m, w.stage), Infinity);
  return pack.words.filter((w) => w.stage === lowest);
}

function refill(state, pack) {
  const [rng, bag] = shuffled(state.rng, eligibleWords(pack, state.globalStage).map((w) => w.id));
  return { ...state, rng, bag };
}

/**
 * Draw the next word. `acceptance-criteria.md` H12: no word repeats within a page while
 * unmet eligible words remain — so a word already used on this page is skipped over
 * rather than dealt again, which is also what keeps a re-inserted target (E6) from
 * arriving as the very next round.
 */
function draw(state, pack) {
  let s = state;
  if (s.bag.length === 0) s = refill(s, pack);
  if (s.bag.length === 0) return [s, null];
  const usedThisPage = new Set(s.page.entries.map((e) => e.wordId));
  let idx = s.bag.findIndex((id) => !usedThisPage.has(id));
  if (idx === -1) idx = 0;
  const wordId = s.bag[idx];
  const bag = s.bag.slice(0, idx).concat(s.bag.slice(idx + 1));
  return [{ ...s, bag }, wordId];
}

/**
 * `gameplay.md` §6.3 — a re-insertion goes to a uniformly random position in the **front
 * third** of the bag: a target displaced by a found-word win, or a word that needed
 * three auto-places to finish. He did not build it, so it comes back soon.
 */
function reinsertFront(state, wordId) {
  const third = Math.max(1, Math.ceil(state.bag.length / 3));
  const [rng, pos] = nextInt(state.rng, third);
  const bag = state.bag.slice();
  bag.splice(pos, 0, wordId);
  return { ...state, rng, bag };
}

/* ------------------------------------------------------------------- the round */

function wordById(pack, id) {
  return pack.words.find((w) => w.id === id) ?? null;
}

function beginRound(state, pack) {
  const [drawn, wordId] = draw(state, pack);
  if (wordId === null) return { ...drawn, round: null, phase: 'empty' };
  const word = wordById(pack, wordId);
  if (!word) return beginRound({ ...drawn }, pack); // a word deleted since the bag was filled
  const stage = roundStage(pack.language, drawn.globalStage, word.stage, drawn.meetings[wordId] ?? 0);
  const [rng, round] = createRound(pack, {
    word,
    stage,
    rngState: drawn.rng,
    encounterIndex: drawn.encounters[wordId] ?? 0,
    roundId: `r${drawn.roundCount + 1}`,
  });
  return {
    ...drawn,
    rng,
    round,
    roundCount: drawn.roundCount + 1,
    phase: 'playing',
    idle: { touchSeq: drawn.idle.touchSeq, resetSeq: drawn.idle.resetSeq + 1 },
  };
}

/* -------------------------------------------------------------------- creation */

/**
 * Start a session over one resolved pack. The language comes from the pack and is fixed
 * for the life of the session; `gameplay.md` §7.1 says changing it tears the game down
 * and rebuilds it, which at this layer means throwing this object away and calling
 * `createSession` again.
 */
export function createSession(pack, { seed = 'ghep-chu' } = {}) {
  const base = {
    version: STATE_VERSION,
    language: pack.language,
    packId: pack.id,
    seed: seedFrom(seed),
    rng: seedFrom(seed),
    globalStage: 1,
    stageProgress: 0,
    meetings: Object.create(null),
    encounters: Object.create(null),
    bag: [],
    page: { entries: [] },
    album: [],
    round: null,
    roundCount: 0,
    phase: 'playing',
    idle: { touchSeq: 0, resetSeq: 0 },
  };
  if (pack.words.length === 0) return { ...base, phase: 'empty' };
  return beginRound(refill(base, pack), pack);
}

/* --------------------------------------------------------------- placement ops */

function touched(state) {
  return { ...state, idle: { ...state.idle, touchSeq: state.idle.touchSeq + 1 } };
}

function clearCells(round, indices) {
  if (indices.length === 0) return round;
  const set = new Set(indices);
  return {
    ...round,
    cells: round.cells.map((c) => (set.has(c.index) ? { ...c, tileId: null, instanceId: null } : c)),
  };
}

function seat(round, cellIndex, inst, lang) {
  let next = round;
  // Whatever was there walks home first; in English that is the leftmost-slot swap of
  // `acceptance-criteria.md` D3, in Vietnamese it only happens on a replaced rime.
  if (next.cells[cellIndex].tileId !== null) {
    next = clearCells(next, [cellIndex, ...lang.dependentCells(next, cellIndex)]);
  }
  const cells = next.cells.map((c) => (
    c.index === cellIndex ? { ...c, tileId: inst.tileId, instanceId: inst.id } : c
  ));
  return { ...next, cells };
}

/**
 * `gameplay.md` §4.4 — when every cell is full, exactly one of three things is true.
 * The classification is on the parts, never on a spelling the engine built.
 */
function classify(pack, round, lang) {
  const parts = lang.partsFrom(round);
  const target = wordById(pack, round.targetId);
  const built = lang.lookup(pack, parts);
  if (built && built.id === target.id) return { kind: 'target', wordId: target.id };
  if (built) return { kind: 'found', wordId: built.id };
  return { kind: 'notAWord', wordId: null };
}

function afterPlacement(pack, state, round, lang, { correct }) {
  let next = { ...state, round };
  next = touched(next);
  // `acceptance-criteria.md` G7 / G8: a correct placement resets the idle ladder; an
  // incorrect one does not — a child mashing tiles is exactly the child who needs help —
  // but every touch still defers the next escalation by 4 s (G9), which is what
  // `touchSeq` says.
  if (correct) next.idle = { ...next.idle, resetSeq: next.idle.resetSeq + 1 };

  if (round.cells.every((c) => c.tileId !== null)) {
    const outcome = classify(pack, round, lang);
    const resolvedId = outcome.kind === 'notAWord' ? null : outcome.wordId;
    const resolvedWord = resolvedId ? wordById(pack, resolvedId) : null;
    next.round = {
      ...round,
      status: outcome.kind === 'notAWord' ? 'settling' : 'resolving',
      outcome: {
        ...outcome,
        // On a found-word win the frame's photo flips to the word he actually built
        // (`acceptance-criteria.md` E5), so the reveal art belongs to *that* word.
        art: resolvedWord
          ? artFor(resolvedWord, next.encounters[resolvedWord.id] ?? 0)
          : null,
      },
    };
  }
  return next;
}

/* ----------------------------------------------------------------- transitions */

function finishRound(pack, state) {
  const round = state.round;
  const outcome = round.outcome;
  const resolvedId = outcome.wordId;
  const resolvedWord = wordById(pack, resolvedId);

  let next = { ...state };
  next.meetings = { ...next.meetings, [resolvedId]: (next.meetings[resolvedId] ?? 0) + 1 };
  next.encounters = { ...next.encounters, [resolvedId]: (next.encounters[resolvedId] ?? 0) + 1 };

  const entry = {
    wordId: resolvedId,
    text: resolvedWord.text,
    image: outcome.art.reveal,
    fallbackEmoji: outcome.art.fallbackEmoji,
  };
  next.page = { entries: [...next.page.entries, entry] };
  next.album = [...next.album, entry];

  // `gameplay.md` §6.2 — the stage advances after 8 rounds resolved at the current stage
  // **with no auto-place assist**, and never decreases. A bad day must not cost him
  // ground, because that is the one number he would notice.
  if (round.assists === 0) {
    next.stageProgress += 1;
    if (next.stageProgress >= ROUNDS_PER_STAGE) {
      next.stageProgress = 0;
      next.globalStage = clampStage(pack.language, Math.min(MAX_STAGE[pack.language], next.globalStage + 1));
    }
  }

  // Two re-insertions into the front third (§6.3).
  if (outcome.kind === 'found' && round.targetId !== resolvedId) {
    next = reinsertFront(next, round.targetId);
  }
  if (round.assists >= ASSISTS_BEFORE_REQUEUE) {
    next = reinsertFront(next, round.targetId);
  }

  next.round = null;
  if (next.page.entries.length >= ROUNDS_PER_PAGE) {
    // `gameplay.md` §6.6 — play stops and does not resume by itself. This is the
    // designed stopping point for a parent.
    return { ...next, phase: 'album' };
  }
  return beginRound(next, pack);
}

/* -------------------------------------------------------------------- reducer */

/**
 * The reducer. Unknown actions, and actions that do not apply in the current phase, come
 * back as the identical object — so a double dispatch, a late timer or a stray tap
 * during the chant is a no-op rather than a corruption (`acceptance-criteria.md` N8,
 * T7, T10).
 */
export function reduce(pack, state, action) {
  if (!action || typeof action.type !== 'string') return state;
  const lang = langFor(pack.language);

  switch (action.type) {
    case 'tapTile': {
      if (state.phase !== 'playing' || !state.round) return state;
      const round = state.round;
      if (round.status !== 'building') return state; // N8: not placeable during the chant
      const inst = lang.paletteInstances(round.palette).find((i) => i.id === action.instanceId);
      if (!inst) return state;

      // A tile that is already seated lifts home instead. `gameplay.md` §4.2: tapping a
      // seated tile is the undo, and there is no undo button.
      const seatedAt = round.cells.find((c) => c.instanceId === inst.id);
      if (seatedAt) return reduce(pack, state, { type: 'tapCell', cellIndex: seatedAt.index });

      const cellIndex = lang.targetCellFor(round, inst);
      if (cellIndex < 0) return state;
      const seated = seat(round, cellIndex, inst, lang);
      const placed = {
        ...seated,
        placements: [...seated.placements, { instanceId: inst.id, tileId: inst.tileId, cellIndex }],
      };
      return afterPlacement(pack, state, placed, lang, { correct: lang.cellCorrect(placed, cellIndex) });
    }

    case 'tapCell': {
      if (state.phase !== 'playing' || !state.round) return state;
      const round = state.round;
      if (round.status !== 'building') return state;
      const cell = round.cells[action.cellIndex];
      if (!cell) return state;
      if (cell.tileId === null) return touched(state); // an empty cell is still a touch
      const cleared = clearCells(round, [cell.index, ...lang.dependentCells(round, cell.index)]);
      return touched({ ...state, round: cleared });
    }

    /**
     * The hint ladder's last rung (`gameplay.md` §6.5, `acceptance-criteria.md` G5): the
     * correct tile for the next empty cell flies into place by itself. Recorded as an
     * assist, which is the only thing stage advancement and the queue ever read — the
     * child's UI never says he needed help.
     */
    case 'autoPlace': {
      if (state.phase !== 'playing' || !state.round) return state;
      const round = state.round;
      if (round.status !== 'building') return state;
      const next = round.cells.find((c) => c.tileId === null);
      if (!next) return state;
      const seatedIds = new Set(round.cells.map((c) => c.instanceId).filter((x) => x !== null));
      const inst = lang.activeRow(round).instances
        .find((i) => i.tileId === next.expect && !seatedIds.has(i.id));
      if (!inst) return state;
      const seated = seat(round, next.index, inst, lang);
      const placed = {
        ...seated,
        assists: seated.assists + 1,
        placements: [...seated.placements, { instanceId: inst.id, tileId: inst.tileId, cellIndex: next.index, assist: true }],
      };
      // An auto-place restarts the ladder at 20 s for the next empty cell (G6), so it
      // counts as a reset even though the child did nothing.
      const after = afterPlacement(pack, state, placed, lang, { correct: true });
      return after;
    }

    /**
     * The not-a-word settle (`gameplay.md` §4.4 C): only the **unlit** tiles lift and fly
     * home; every lit tile stays seated with its segment still lit. The board has tidied
     * itself and told him, wordlessly, *these are right, keep going*. He never has to
     * clear it himself.
     */
    case 'settle': {
      if (!state.round || state.round.status !== 'settling') return state;
      const round = state.round;
      const wrong = round.cells.filter((c, i) => !lang.cellCorrect(round, i)).map((c) => c.index);
      const cleared = clearCells(round, wrong);
      return { ...state, round: { ...cleared, status: 'building', outcome: null } };
    }

    /** The chant and reveal have finished; move on. */
    case 'advance': {
      if (!state.round || state.round.status !== 'resolving') return state;
      return finishRound(pack, state);
    }

    /** `acceptance-criteria.md` H6 — the album's play card starts a new page of five. */
    case 'nextPage': {
      if (state.phase !== 'album') return state;
      return beginRound({ ...state, page: { entries: [] } }, pack);
    }

    /**
     * `gameplay.md` §6.7 — the current round is abandoned without ceremony and the app
     * goes to the end screen, which has no control that starts play (H9, H10).
     */
    case 'finishSession': {
      if (state.phase === 'ended') return state;
      return { ...state, round: null, phase: 'ended' };
    }

    /** `acceptance-criteria.md` B5 — tapping the picture frame replays the word. */
    case 'tapFrame':
      if (state.phase !== 'playing' && state.phase !== 'album') return state;
      return touched(state);

    /**
     * `acceptance-criteria.md` B7 — the parts hint leaves the idle-hint ladder timer
     * unchanged and records no assist. The engine's honest expression of "unchanged" is
     * to return the identical state object.
     */
    case 'partsHint':
      return state;

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ selectors */

/** What the band is showing right now, minus anything already seated. */
export function bandInstances(pack, state) {
  if (!state.round) return [];
  const lang = langFor(pack.language);
  const seated = new Set(state.round.cells.map((c) => c.instanceId).filter((x) => x !== null));
  return lang.activeRow(state.round).instances.filter((i) => !seated.has(i.id));
}

/** `acceptance-criteria.md` H1/H2 — five dots, one filling per resolved round. */
export function pageRail(state) {
  const filled = state.page.entries.length;
  return Array.from({ length: ROUNDS_PER_PAGE }, (_, i) => i < filled);
}

/** The steps of the chant, or of the not-a-word read-back, for the presentation layer. */
export function resolutionSteps(pack, state) {
  const round = state.round;
  if (!round) return [];
  const lang = langFor(pack.language);
  if (round.status === 'settling') return lang.readBack(pack, round);
  if (round.status === 'resolving') {
    const word = pack.words.find((w) => w.id === round.outcome.wordId);
    return word ? lang.chant(pack, word) : [];
  }
  return [];
}

/** `gameplay.md` §2.5 — the parts hint an adult knows to use. */
export function partsHintSteps(pack, state) {
  if (!state.round) return [];
  const lang = langFor(pack.language);
  const word = pack.words.find((w) => w.id === state.round.targetId);
  return word ? lang.partsHint(pack, word) : [];
}
