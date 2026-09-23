// The session: `(state, action) => state`, and nothing else.
//
// No React, no timers, no `Date.now()`, no `Math.random()` (`development-process.md` §3).
// Every timer in this game — the idle ladder, the chant's gaps, the reveal's 3 s hold —
// lives in the React layer and reaches the engine only as an action. What the engine
// gives that layer back is a pair of counters (`state.idle`) that say *restart the
// ladder* and *defer the next escalation*, so the policy is testable here and the
// scheduling is testable there.
//
// Determinism is load-bearing: the same seed and the same sequence of taps produces the
// same tables, live sets, words and images (`acceptance-criteria.md` B12). That is what
// lets the tester replay a failure, and it is why the RNG state is a field of the session
// rather than a module-level variable.
//
// **Revision 2.** The bag, the draw, the target, the found-word win, the not-a-word
// settle and the five-round page are gone (`gameplay.md` §0.5). Nothing serves him a
// word: he taps symbols, the prefix tree says which ones are live, and when the prefix is
// a word the app announces it. The three most intricate states of revision 1 were deleted
// rather than reimplemented.

import { nextInt, deriveSeed, seedFrom } from './rng.mjs';
import { langFor } from './lang/index.mjs';
import { nodeAt, continues } from './tree.mjs';
import { MAX_STAGE, WORDS_PER_STAGE, SHELF_SLOTS, cellsForStage } from './stages.mjs';

export const STATE_VERSION = 2;

/* ----------------------------------------------------------------- the table */

/**
 * How many cells the table shows right now.
 *
 * Normally the stage's number, capped by the viewport (`acceptance-criteria.md` H1). The
 * fallback exists for hostile content: a pack whose every word needs a symbol beyond the
 * stage-1 table would otherwise open onto a board with nothing live, which is the one
 * state `gameplay.md` §3.3 promises cannot happen. A stage is a pacing device, not a
 * reason to show the child nothing, so the table steps up until something is reachable.
 */
export function effectiveCells(game, stage) {
  const wanted = cellsForStage(stage, game.maxCells);
  const sizes = [...game.trees.keys()].sort((a, b) => a - b);
  const tree = game.treeFor(wanted);
  if (tree && tree.eligible.length > 0) return wanted;
  for (const n of sizes) {
    if (n <= wanted) continue;
    const t = game.trees.get(n);
    if (t && t.eligible.length > 0) return n;
  }
  return wanted;
}

export function treeOf(game, state) {
  return game.treeFor(effectiveCells(game, state.stage));
}

/** `acceptance-criteria.md` B2, B3 — the table, and which of its cells stand up. */
export function tableView(game, state) {
  const lang = langFor(game.language);
  const tree = treeOf(game, state);
  if (!tree) return { position: 0, role: null, cells: [] };
  const table = lang.tableFor(game.pack, tree.inventory, state.prefix);
  const node = nodeAt(tree, state.prefix);
  const live = node ? node.live : new Set();
  return {
    position: table.position,
    role: table.role,
    cells: table.symbols.map((symbol, index) => ({ ...symbol, index, live: live.has(symbol.id) })),
  };
}

/** `ui.md` §7.2 / §8 — what the word strip is showing. */
export function stripView(game, state) {
  return langFor(game.language).stripCells(game.pack, state.prefix);
}

/** `gameplay.md` §6.2 — five slots, each filled with a photograph he just found. */
export function shelfView(state) {
  return Array.from({ length: SHELF_SLOTS }, (_, i) => state.shelf[i] ?? null);
}

/* -------------------------------------------------------------------- creation */

/**
 * Start a session over one game (a pack plus its prefix trees). The language comes from
 * the pack and is fixed for the life of the session; `gameplay.md` §7.1 says changing it
 * tears the game down and rebuilds it, which at this layer means throwing this object
 * away and calling `createSession` again.
 */
export function createSession(game, { seed = 'ghep-chu' } = {}) {
  const anyEligible = [...game.trees.values()].some((t) => t.eligible.length > 0);
  return {
    version: STATE_VERSION,
    language: game.language,
    packId: game.pack.id,
    seed: seedFrom(seed),
    rng: seedFrom(seed),
    stage: 1,
    stageProgress: 0,
    prefix: [],
    status: 'building',
    pending: null,
    assists: 0,
    discovered: Object.create(null),
    encounters: Object.create(null),
    album: [],
    shelf: [],
    // `acceptance-criteria.md` L6, K9 — a pack with nothing playable shows his mother a
    // card. It never shows the child a table with nothing live.
    phase: anyEligible ? 'playing' : 'empty',
    idle: { touchSeq: 0, resetSeq: 0 },
  };
}

/* ----------------------------------------------------------------- the helpers */

function touched(state) {
  return { ...state, idle: { ...state.idle, touchSeq: state.idle.touchSeq + 1 } };
}

function seatedAndReset(state, prefix) {
  return {
    ...state,
    prefix,
    idle: { touchSeq: state.idle.touchSeq + 1, resetSeq: state.idle.resetSeq + 1 },
  };
}

function wordById(pack, id) {
  return pack.words.find((w) => w.id === id) ?? null;
}

/**
 * `acceptance-criteria.md` B9, B11 / `ui.md` §9.7 — the *k*-th encounter of a word with
 * *n* images shows `images[k mod n]`, `k` counting from 0. One image → that image, every
 * time, no error. Two → alternating. Four → a four-cycle. With no image at all the
 * bundled emoji carries it (`content-pipeline.md` §5), which is why `fallbackEmoji` is a
 * key into media inside the binary rather than a pack reference.
 */
export function imageFor(word, encounter) {
  const n = word.images.length;
  if (n === 0) return { image: null, fallbackEmoji: word.fallbackEmoji, index: 0 };
  const index = ((encounter % n) + n) % n;
  return { image: word.images[index], fallbackEmoji: null, index };
}

/**
 * The announcement is armed the instant the prefix is a word. `gameplay.md` §5.3: *the
 * announcement fires on his tap, not after the chant* — the instant of recognition
 * belongs to him, and the chant is the lesson that follows it.
 */
function armAnnouncement(game, state, prefix) {
  const tree = treeOf(game, state);
  const node = nodeAt(tree, prefix);
  if (!node || node.wordId === null) return { ...state, prefix };
  const word = wordById(game.pack, node.wordId);
  if (!word) return { ...state, prefix };
  const encounter = state.encounters[word.id] ?? 0;
  const art = imageFor(word, encounter);
  return {
    ...state,
    prefix,
    status: 'announcing',
    pending: {
      wordId: word.id,
      text: word.text,
      isNew: !state.discovered[word.id],
      encounter,
      image: art.image,
      imageIndex: art.index,
      fallbackEmoji: art.fallbackEmoji,
      // `gameplay.md` §5.5 — a word that is also a prefix announces in full and the strip
      // keeps it. Withholding a word he made is the one thing this mechanic must not do.
      continues: continues(tree, prefix),
      assisted: state.assists > 0,
    },
  };
}

/**
 * `acceptance-criteria.md` G3, G5, G11 — the symbol the idle ladder breathes at 40 s, rims
 * at 60 s and flies into the strip at 80 s. **One function, so the tile that breathes is
 * the tile that flies**: two independent choices would be two chances to disagree, and
 * the child would watch one tile pulse and a different one move.
 *
 * Drawn by the seeded RNG from the **live** set, preferring a symbol whose subtree holds
 * a word he has not found yet. `deriveSeed` rather than `nextInt` on the live state: the
 * choice must be stable while he stares at it for sixty seconds, and it must not depend
 * on how many times the ladder has been asked.
 */
export function hintSymbol(game, state) {
  const table = tableView(game, state);
  const live = table.cells.filter((c) => c.live);
  if (live.length === 0) return null;
  const node = nodeAt(treeOf(game, state), state.prefix);
  const fresh = live.filter((c) => {
    const child = node ? node.children.get(c.id) : null;
    return child ? child.words.some((id) => !state.discovered[id]) : false;
  });
  const pool = fresh.length > 0 ? fresh : live;
  const [, pick] = nextInt(deriveSeed(state.rng, `hint:${state.prefix.join('\u0000')}`), pool.length);
  return pool[pick].id;
}

/* ------------------------------------------------------------------ the reducer */

/**
 * Unknown actions, and actions that do not apply in the current phase, come back as the
 * identical object — so a double dispatch, a late timer or a stray tap during the chant
 * is a no-op rather than a corruption (`acceptance-criteria.md` N8, T7, T10).
 */
export function reduce(game, state, action) {
  if (!action || typeof action.type !== 'string') return state;

  switch (action.type) {
    /**
     * `gameplay.md` §4.2, §4.3 — a live tap seats; a disabled tap plays its clip and
     * changes nothing (`acceptance-criteria.md` E2). There is no third case and there is
     * no wrong tap.
     */
    case 'tapSymbol': {
      if (state.phase !== 'playing' || state.status !== 'building') return state;
      const table = tableView(game, state);
      const cell = table.cells.find((c) => c.id === action.symbolId);
      // **Only a symbol that is on screen can be tapped.** The table cross-fades over
      // 280 ms (M7) and a 4-year-old taps six times in 400 ms, so the outgoing table is
      // still drawn and touchable while it fades. The rule belongs here rather than in a
      // `pointerEvents` prop, because *a tap is a tap on something he can see* is a rule
      // of the game (`acceptance-criteria.md` T1, T2).
      if (!cell) return state;
      if (!cell.live) return touched(state); // G8: defers the ladder, never resets it
      const prefix = [...state.prefix, cell.id];
      return armAnnouncement(game, seatedAndReset(state, prefix), prefix);
    }

    /**
     * `gameplay.md` §4.4 — undo is the word strip, and there is no undo button. Tapping
     * any symbol in the strip returns **that symbol and everything after it**, because a
     * middle symbol cannot be removed without leaving a prefix that was never on the
     * tree. One rule, no illegal state (`acceptance-criteria.md` E8, E9, E10).
     */
    case 'tapStripCell': {
      if (state.phase !== 'playing' || state.status !== 'building') return state;
      const index = action.index;
      if (!Number.isInteger(index) || index < 0) return state;
      if (index >= state.prefix.length) {
        // An empty cell is a touch and nothing more; an empty strip is not even that
        // (`acceptance-criteria.md` T20).
        return state.prefix.length === 0 ? state : touched(state);
      }
      return { ...touched(state), prefix: state.prefix.slice(0, index), assists: 0 };
    }

    /**
     * `gameplay.md` §6.4 — the idle ladder's last rung: the app takes a turn. The engine
     * decides *which* symbol; the flight is 420 ms rather than 260 so it reads as the app
     * doing it (`acceptance-criteria.md` O8). Recorded as an assist, which only stage
     * advancement ever reads — nothing in the child's UI says he needed help.
     */
    case 'autoPlay': {
      if (state.phase !== 'playing' || state.status !== 'building') return state;
      const chosen = hintSymbol(game, state);
      if (chosen === null) return state;
      const next = seatedAndReset({ ...state, assists: state.assists + 1 }, [...state.prefix, chosen]);
      return armAnnouncement(game, next, next.prefix);
    }

    /**
     * The announcement, the chant and the reveal have finished. This is where the
     * discovery is committed: the shelf, the album, the encounter count and the stage.
     */
    case 'advance': {
      if (state.status !== 'announcing' || !state.pending) return state;
      const p = state.pending;
      const word = wordById(game.pack, p.wordId);
      let next = {
        ...state,
        status: 'building',
        pending: null,
        assists: 0,
        // `gameplay.md` §5.5 — a prefix word leaves its symbols in the strip and the
        // continuing symbols standing; anything else clears (`acceptance-criteria.md`
        // F14, F15).
        prefix: p.continues ? state.prefix : [],
        encounters: { ...state.encounters, [p.wordId]: (state.encounters[p.wordId] ?? 0) + 1 },
        idle: { touchSeq: state.idle.touchSeq, resetSeq: state.idle.resetSeq + 1 },
      };

      if (p.isNew && word) {
        const entry = {
          wordId: p.wordId,
          text: p.text,
          image: p.image,
          fallbackEmoji: p.fallbackEmoji,
        };
        next.discovered = { ...next.discovered, [p.wordId]: true };
        // `acceptance-criteria.md` H9 — the album is a collection, newest first, and it
        // only grows. It is the one progress signal in the app that cannot go down.
        next.album = [entry, ...next.album];
        next.shelf = [...next.shelf, entry];

        // `gameplay.md` §6.1 — 8 new words at the current stage **with no auto-play
        // assist**, and the stage never decreases (H2, H4, G10).
        if (!p.assisted) next.stageProgress += 1;

        /**
         * **Extension, reported rather than absorbed** (`acceptance-criteria.md` H2).
         *
         * H2 says the stage advances after 8 new words at the current stage. A table
         * that cannot reach 8 words therefore never advances, and the child is held at
         * stage 1 for ever. That is not hypothetical: at 8 cells the shipped Vietnamese
         * pack exposes **5** eligible words and the English one **2**, so H2 alone
         * deadlocks the ladder on the packs that exist today (see the inventory-order
         * finding in the hand-off).
         *
         * So the rule is *8 new words, **or every word this table can reach***. It
         * preserves H2 exactly wherever H2 can be satisfied, it advances on discovery
         * rather than on a clock, and it cannot advance early: exhausting the table is
         * strictly harder than not exhausting it.
         *
         * The honest fix is the pack's `inventoryOrder`, which is the content-engineer's.
         * This keeps the app playable until then, and it is correct afterwards too.
         */
        const tree = treeOf(game, next);
        const exhausted = tree !== null && tree.eligible.length > 0
          && tree.eligible.every((w) => next.discovered[w.id]);
        if (next.stageProgress >= WORDS_PER_STAGE || exhausted) {
          next.stageProgress = 0;
          next.stage = Math.min(MAX_STAGE, next.stage + 1);
        }

        if (next.shelf.length >= SHELF_SLOTS) {
          // `gameplay.md` §6.2 — the shelf tips into the album and **play does not resume
          // by itself.** That is the parent's stopping point (H7).
          next = { ...next, phase: 'album', prefix: [] };
        }
      }
      return next;
    }

    /** `acceptance-criteria.md` H8, H11 — the album's play card. The shelf is empty again. */
    case 'leaveAlbum': {
      if (state.phase !== 'album') return state;
      return {
        ...state,
        phase: 'playing',
        shelf: [],
        prefix: [],
        status: 'building',
        pending: null,
        assists: 0,
        idle: { touchSeq: state.idle.touchSeq, resetSeq: state.idle.resetSeq + 1 },
      };
    }

    /**
     * `gameplay.md` §6.3 — the board is abandoned without ceremony and the app goes to
     * the end screen, which has no control that starts play (H14–H16).
     */
    case 'finishSession': {
      if (state.phase === 'ended') return state;
      return { ...state, phase: 'ended', status: 'building', pending: null, prefix: [] };
    }

    /**
     * `acceptance-criteria.md` M3 — the parts hint leaves the idle ladder unchanged and
     * records no assist. The engine's honest expression of "unchanged" is to return the
     * identical state object.
     */
    case 'partsHint':
      return state;

    default:
      return state;
  }
}

/* ------------------------------------------------------------------- selectors */

/**
 * `gameplay.md` §5.6 — the chant. Full on a first discovery (parts, then whole); **the
 * whole word only** on a re-discovery, because by the third `mèo` the đánh vần is no
 * longer news and the delay is what would make him stop (`acceptance-criteria.md` F5).
 */
export function chantSteps(game, state) {
  if (!state.pending) return [];
  const word = wordById(game.pack, state.pending.wordId);
  if (!word) return [];
  const full = langFor(game.language).chant(game.pack, word);
  if (state.pending.isNew) return full;
  return full.filter((s) => s.step === 'word' || s.step === 'sentence');
}

/** `ui.md` §11.4 — three rising notes, plus a fourth an octave up when the word is new. */
export function motifNotes(state) {
  return state.pending && state.pending.isNew ? 4 : 3;
}

/** `ui.md` §2.2 — the parts of what is currently assembled. Never a completion. */
export function partsHintSteps(game, state) {
  return langFor(game.language).partsHint(game.pack, state.prefix);
}

/** The symbols an undo to `index` sends home, in the order they fly (E8). */
export function symbolsFrom(game, state, index) {
  const lang = langFor(game.language);
  const out = [];
  for (let i = state.prefix.length - 1; i >= index; i -= 1) {
    const sym = lang.symbolAt(game.pack, state.prefix, i);
    if (sym) out.push(sym);
  }
  return out;
}

/** `gameplay.md` §3.3 property 2 — either the prefix is a word, or something is live. */
export function isStuck(game, state) {
  const tree = treeOf(game, state);
  const node = nodeAt(tree, state.prefix);
  if (!node) return true;
  return node.wordId === null && node.live.size === 0;
}
