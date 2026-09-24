// The session: `(state, action) => state`, and nothing else.
//
// No React, no timers, no `Date.now()`, no `Math.random()` (`development-process.md` §3).
// Every timer in this game — the idle ladder, the chant's gaps, the reveal's 3 s hold,
// the page slide — lives in the React layer and reaches the engine only as an action.
// What the engine gives that layer back is a pair of counters (`state.idle`) that say
// *restart the ladder* and *defer the next escalation*, so the policy is testable here and
// the scheduling is testable there.
//
// Determinism is load-bearing: the same seed and the same sequence of taps produces the
// same tables, live sets, pages, words and images (`acceptance-criteria.md` B12).
//
// **Revision 4.** There is no stage ladder, no `globalStage` and no assist counter
// (`gameplay.md` §3.6, AC H3, G10) — a table that grows is not a table that is always the
// same. What the session does carry that it did not is **the current page** (§V), because
// auto-advance is a rule about state ("the page he is on has nothing live") and not a
// piece of choreography.
//
// **Revision 5.** A prefix is now letters and then a tone, so every view of it goes
// through the language's `readingOf` — *which letters are one sound, where the onset ends,
// which word could finish here* — and that reading is taken from the **stored**
// decomposition of a word that completes the prefix, never from the letter stream
// (`literacy-vi.md` §0.5, AC C4f). **Undo became the whole strip**, one symbol per tap, on
// geometry rather than taste: five 72 pt cells need 392 pt and the 360 dp floor has 328
// (`ui.md` §7.2.6, `gameplay.md` §4.4, AC D4, E8, E9, C10, C11).

import { nextInt, deriveSeed, seedFrom } from './rng.mjs';
import { langFor } from './lang/index.mjs';
import { nodeAt, continues } from './tree.mjs';
import { MAX_WORD_LETTERS } from './rules.mjs';

export const STATE_VERSION = 3;

/** `gameplay.md` §6.2 — five slots, then the shelf tips into the album. */
export const SHELF_SLOTS = 5;

/* ----------------------------------------------------------------- the table */

/** The one tree. Kept as a function so every call site reads the same way it used to. */
export function treeOf(game) {
  return game.tree;
}

/**
 * **The reading of the current prefix** — the parse, the completing word, and whether a
 * letter or a tone can follow. Every selector below takes it rather than re-deriving it,
 * so there is exactly one place that decides what the letters on the strip mean.
 */
export function readingOf(game, state) {
  const lang = langFor(game.language);
  return lang.readingOf(game.pack, nodeAt(game.tree, state.prefix), state.prefix);
}

/**
 * `acceptance-criteria.md` B2, B2a, B3 — the whole table, every character in its
 * permanent cell, and which of them stand up right now.
 *
 * `page` is carried per cell, so a renderer lays the pages out side by side and moves a
 * window over them (V9, V10). Nothing here decides what is *visible*; that is the
 * renderer's, and it is why a dropped frame cannot corrupt a round.
 */
export function tableView(game, state) {
  const lang = langFor(game.language);
  const tree = game.tree;
  const node = nodeAt(tree, state.prefix);
  const live = node ? node.live : new Set();
  const reading = lang.readingOf(game.pack, node, state.prefix);
  const cells = lang.symbolsFor(game.pack, game.inventory, state.prefix, reading)
    .map((symbol) => ({ ...symbol, live: live.has(symbol.id) }));
  return {
    cells,
    page: state.page,
    pageCount: game.inventory.pages.length,
    paged: game.inventory.paged,
    cells_per_page: game.inventory.cells,
  };
}

/**
 * `ui.md` §7.1b / AC V16–V19 — the page rail. One button per page: **standing** if its
 * page holds a live character, **flat** if it does not, **current** for the one he is on.
 * The glyph is that page's first character, which is a sample of what is over there
 * rather than a number.
 */
export function pageView(game, state) {
  const table = tableView(game, state);
  const liveByPage = new Set();
  for (const cell of table.cells) if (cell.live) liveByPage.add(cell.page);
  return {
    paged: game.inventory.paged,
    index: state.page,
    buttons: game.inventory.pages.map((page, i) => {
      const first = page[0];
      const cell = table.cells[first.index];
      return {
        page: i,
        symbolId: first.id,
        glyph: cell ? cell.glyph : first.id,
        role: first.role,
        // V19 — a rail button is drawn with **that character's own** bar and role colour,
        // so the kind is the character's, not the run's (B2l).
        kind: cell ? cell.kind : first.kind,
        live: liveByPage.has(i),
        current: state.page === i,
      };
    }),
  };
}

/** `ui.md` §7.2 / §8 — what the word strip is showing: cells, spans and boundaries. */
export function stripView(game, state) {
  const lang = langFor(game.language);
  return lang.stripCells(game.pack, state.prefix, readingOf(game, state));
}

/**
 * `acceptance-criteria.md` E15, E16, N14, D7, C4a–C4b, D1e — **what a tap on this symbol
 * would say**, live or flat: the clip of the unit it builds, superseding the one playing.
 * It is resolved here rather than in the state layer because it is a fact about the
 * pack and the prefix, and the state layer owns only *when*.
 */
export function tapAudio(game, state, symbolId) {
  const lang = langFor(game.language);
  return lang.tapAudioFor(game.pack, readingOf(game, state), symbolId);
}

/**
 * `acceptance-criteria.md` E8, C11 — **what an undo would say: the clip of what is left.**
 * Undoing `h` from `c h` says `cờ`, not `hờ`. `null` on an empty strip, which is the state
 * where a tap plays nothing at all (T20, X35).
 */
export function undoAudio(game, state) {
  if (state.prefix.length === 0) return null;
  const lang = langFor(game.language);
  const shorter = { ...state, prefix: state.prefix.slice(0, -1) };
  return lang.remainingAudioFor(game.pack, readingOf(game, shorter));
}

/** The symbol an undo would return — what flies home (M8). */
export function lastSymbol(game, state) {
  if (state.prefix.length === 0) return null;
  const lang = langFor(game.language);
  return lang.symbolAt(game.pack, state.prefix, state.prefix.length - 1, readingOf(game, state));
}

/** `gameplay.md` §6.2 — five slots, each filled with a photograph he just found. */
export function shelfView(state) {
  return Array.from({ length: SHELF_SLOTS }, (_, i) => state.shelf[i] ?? null);
}

/* -------------------------------------------------------------------- creation */

/**
 * Start a session over one game (a pack, its inventory, its page plan and its tree). The
 * language comes from the pack and is fixed for the life of the session; `gameplay.md`
 * §7.1 says switching it is a **teardown**, which at this layer means throwing this
 * object away and calling `createSession` again — never blending two packs.
 */
export function createSession(game, { seed = 'ghep-chu', progress = null, build = null } = {}) {
  const anyEligible = game.tree.eligible.length > 0;
  const restored = restoreProgress(game, progress);
  const prefix = restoreBuild(game, build);
  const state = {
    version: STATE_VERSION,
    language: game.language,
    packId: game.pack.id,
    seed: seedFrom(seed),
    rng: seedFrom(seed),
    prefix,
    /** V12–V14 — which window onto the constant table is on screen. */
    page: 0,
    /** Why the page last changed: 'self' (he tapped) or 'auto' (the app slid). */
    pageBy: 'self',
    pageSeq: 0,
    status: 'building',
    pending: null,
    discovered: restored.discovered,
    encounters: restored.encounters,
    album: restored.album,
    // The shelf is per **session**, not per pack: it is the parent's stopping point and
    // it has no meaning in the other language (A19, `gameplay.md` §7.1 item 5).
    shelf: [],
    // `acceptance-criteria.md` L6, K9 — a pack with nothing playable shows his mother a
    // card. It never shows the child a table with nothing live.
    phase: anyEligible ? 'playing' : 'empty',
    idle: { touchSeq: 0, resetSeq: 0 },
  };
  return state.phase === 'playing' ? settlePage(game, state) : state;
}

/**
 * **J11 and J14 at the same time.** A word his mother saves rebuilds the prefix tree
 * atomically (E13), which means a whole new game object and a whole new session — and
 * J11 says the board she came from must still be there, *with the strip still
 * assembled*, when she is done.
 *
 * So the state layer hands the strip back across the rebuild, and this is the door it
 * comes in through. Hostile like every other restore: the prefix is **walked through the
 * new tree**, and the moment a symbol is not a child of the node before it the restore
 * stops there. A prefix that is no longer buildable — she deleted the only word behind it
 * — degrades to the longest part that still is, which is never an illegal state, because
 * every node on the walk is a node the tree actually has.
 */
function restoreBuild(game, build) {
  if (!Array.isArray(build) || build.length === 0) return [];
  const prefix = [];
  let node = game.tree.root;
  for (const symbol of build) {
    if (typeof symbol !== 'string') break;
    const next = node.children.get(symbol);
    if (!next) break;
    node = next;
    prefix.push(symbol);
    if (prefix.length >= MAX_WORD_LETTERS + 1) break;
  }
  // A restored prefix that already spells a word would drop the child straight into an
  // announcement he did not ask for, so the last symbol is left off in that case.
  while (prefix.length > 0 && nodeAt(game.tree, prefix).wordId !== null) prefix.pop();
  return prefix;
}

/**
 * **A18 — the album is per pack and survives a language switch**, including each word's
 * encounter count, so B9 resumes where it left off rather than starting the photographs
 * again. The state layer hands back `{ albumIds, encounters }` — ids and numbers, never
 * pack content — and this rebuilds the cards from the pack, which is the only place a
 * photograph may come from.
 *
 * Hostile input like everything else: an id the pack no longer has (she deleted the word)
 * is dropped, and a count that is not a number is ignored. A restored album can never
 * name a word that is not in this pack, which is half of R4.
 */
function restoreProgress(game, progress) {
  const discovered = Object.create(null);
  const encounters = Object.create(null);
  const album = [];
  if (!progress || typeof progress !== 'object') return { discovered, encounters, album };

  const counts = progress.encounters && typeof progress.encounters === 'object' ? progress.encounters : {};
  for (const [id, n] of Object.entries(counts)) {
    if (Number.isInteger(n) && n > 0 && game.pack.words.some((w) => w.id === id)) encounters[id] = n;
  }
  const ids = Array.isArray(progress.albumIds) ? progress.albumIds : [];
  for (const id of ids) {
    if (discovered[id]) continue;
    const word = game.pack.words.find((w) => w.id === id);
    if (!word) continue;
    discovered[id] = true;
    // The card shows the photograph of his **last** encounter, which is the one he saw.
    const art = imageFor(word, Math.max(0, (encounters[id] ?? 1) - 1));
    album.push({
      wordId: id, text: word.text, image: art.image, fallbackEmoji: art.fallbackEmoji,
    });
  }
  return { discovered, encounters, album };
}

/** What the state layer persists between sessions of one pack (A18). */
export function progressOf(state) {
  return {
    albumIds: state.album.map((entry) => entry.wordId),
    encounters: { ...state.encounters },
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
  return id === null ? null : (pack.words.find((w) => w.id === id) ?? null);
}

function wordIdOf(game, prefix) {
  const node = nodeAt(game.tree, prefix);
  return node ? node.wordId : null;
}

/** Which pages hold at least one live character for this prefix. */
function livePages(game, prefix) {
  const node = nodeAt(game.tree, prefix);
  const live = node ? node.live : new Set();
  const pages = new Set();
  for (const symbolId of live) {
    const page = game.inventory.pageOf(symbolId);
    if (page >= 0) pages.add(page);
  }
  return pages;
}

/**
 * **The auto-advance rule, and the restraint that makes it safe** (`gameplay.md` §3.8,
 * `ui.md` §7.1c, AC V12–V14).
 *
 *   > The app slides the page only when the page he is on has **no live character left**.
 *   > If anything on his current page can still be pressed, the board does not move,
 *   > however many live characters are elsewhere.
 *
 * The target is the **lowest-numbered** page that has one — deterministic, never a guess.
 * A page he navigated to himself is never taken away from him (V15): this is called from
 * seating, undo and advance, and never from `tapPage`.
 */
function settlePage(game, state) {
  if (!game.inventory.paged) return state;
  const pages = livePages(game, state.prefix);
  if (pages.size === 0 || pages.has(state.page)) return state;
  let lowest = Infinity;
  for (const p of pages) lowest = Math.min(lowest, p);
  return { ...state, page: lowest, pageBy: 'auto', pageSeq: state.pageSeq + 1 };
}

/**
 * `acceptance-criteria.md` B9, B11 / `ui.md` §9.7 — the *k*-th encounter of a word with
 * *n* images shows `images[k mod n]`, `k` counting from 0. One image → that image, every
 * time, no error. Two → alternating. Four → a four-cycle. With no image at all the
 * bundled emoji carries it (`content-pipeline.md` §5).
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
  const node = nodeAt(game.tree, prefix);
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
      continues: continues(game.tree, prefix),
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
  const node = nodeAt(game.tree, state.prefix);
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
      const cell = tableView(game, state).cells.find((c) => c.id === action.symbolId);
      if (!cell) return state;
      if (!cell.live) return touched(state); // G8: defers the ladder, never resets it
      const prefix = [...state.prefix, cell.id];
      const next = armAnnouncement(game, seatedAndReset(state, prefix), prefix);
      // V25 — no auto-advance while the announcement runs. The board settles on `advance`.
      return next.status === 'announcing' ? next : settlePage(game, next);
    }

    /**
     * **`gameplay.md` §4.4 (revision 5) — undo is the whole strip, one symbol per tap.**
     * Tapping the strip returns the **last** symbol; tapping again returns the one before
     * it (AC D4, E8, E9, C10, C11).
     *
     * It is not a preference. Per-cell undo needs a 72 pt motor target per cell, five of
     * those need 392 pt, and the 360 dp floor has 328 pt of content width — so the rule
     * revision 2 shipped was one the smallest supported phone could never draw, and it is
     * 58 pt wide on the owner's own device (`ui.md` §7.2.6). Two things fall out and both
     * are better: *take the last one back* is one rule a 4-year-old can hold, and removing
     * only the last symbol **cannot** leave a prefix that was never on the tree, so the
     * illegal state the old rule managed simply cannot arise.
     *
     * **V23 / E14 — undo is also the way back.** The board slides to the returned
     * symbol's page, so the strip is how he finds where a character lives.
     */
    case 'tapStrip': {
      if (state.phase !== 'playing' || state.status !== 'building') return state;
      // T20 / X35 — a tap on an empty strip does nothing and plays nothing. Not even a
      // touch: the identical object is returned, so the idle ladder is untouched.
      if (state.prefix.length === 0) return state;
      const returned = state.prefix[state.prefix.length - 1];
      const home = game.inventory.pageOf(returned);
      let next = { ...touched(state), prefix: state.prefix.slice(0, -1) };
      if (home >= 0 && home !== next.page) {
        next = { ...next, page: home, pageBy: 'self', pageSeq: next.pageSeq + 1 };
      }
      return settlePage(game, next);
    }

    /**
     * `ui.md` §7.1b / AC V15 — he tapped a page button. **He is allowed to stay**, even
     * on a page with nothing live: every tile there still speaks, and the app does not
     * yank him away. Only a seat, an undo or an advance can move the board.
     */
    case 'tapPage': {
      if (state.phase !== 'playing') return state;
      const index = action.index;
      if (!Number.isInteger(index) || index < 0 || index >= game.inventory.pages.length) return state;
      if (index === state.page) return touched(state);
      // `by` is the idle ladder's one use of this action (V27): when the app changes page
      // to reach the tile it is about to play, the slide is the app's 420 ms, not his
      // 300 ms (V11). Anything else is his.
      const by = action.by === 'auto' ? 'auto' : 'self';
      return {
        ...(by === 'auto' ? state : touched(state)), page: index, pageBy: by, pageSeq: state.pageSeq + 1,
      };
    }

    /**
     * `gameplay.md` §6.4 — the idle ladder's last rung: the app takes a turn. The engine
     * decides *which* symbol; the flight is 420 ms rather than 260 so it reads as the app
     * doing it (`acceptance-criteria.md` O8). **Nothing is recorded about it** (G10).
     */
    case 'autoPlay': {
      if (state.phase !== 'playing' || state.status !== 'building') return state;
      const chosen = hintSymbol(game, state);
      if (chosen === null) return state;
      const seated = seatedAndReset(state, [...state.prefix, chosen]);
      const next = armAnnouncement(game, seated, seated.prefix);
      return next.status === 'announcing' ? next : settlePage(game, next);
    }

    /**
     * The announcement, the chant and the reveal have finished. This is where the
     * discovery is committed: the shelf, the album and the encounter count.
     */
    case 'advance': {
      if (state.status !== 'announcing' || !state.pending) return state;
      const p = state.pending;
      let next = {
        ...state,
        status: 'building',
        pending: null,
        // `gameplay.md` §5.5 — a prefix word leaves its symbols in the strip and the
        // continuing symbols standing; anything else clears (F14, F15).
        prefix: p.continues ? state.prefix : [],
        encounters: { ...state.encounters, [p.wordId]: (state.encounters[p.wordId] ?? 0) + 1 },
        idle: { touchSeq: state.idle.touchSeq, resetSeq: state.idle.resetSeq + 1 },
      };

      if (p.isNew) {
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

        if (next.shelf.length >= SHELF_SLOTS) {
          // `gameplay.md` §6.2 — the shelf tips into the album and **play does not resume
          // by itself.** That is the parent's stopping point (H7).
          next = { ...next, phase: 'album', prefix: [] };
        }
      }
      return next.phase === 'playing' ? settlePage(game, next) : next;
    }

    /** `acceptance-criteria.md` H8, H11 — the album's play card. The shelf is empty again. */
    case 'leaveAlbum': {
      if (state.phase !== 'album') return state;
      return settlePage(game, {
        ...state,
        phase: 'playing',
        shelf: [],
        prefix: [],
        status: 'building',
        pending: null,
        idle: { touchSeq: state.idle.touchSeq, resetSeq: state.idle.resetSeq + 1 },
      });
    }

    /**
     * `gameplay.md` §6.3 — the board is abandoned without ceremony and the app goes to
     * the end screen, which has no control that starts play (H14–H16).
     */
    case 'finishSession': {
      if (state.phase === 'ended') return state;
      return {
        ...state, phase: 'ended', status: 'building', pending: null, prefix: [],
      };
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
 * `gameplay.md` §5.4, §5.6 — the chant. Five accumulating beats on a first discovery;
 * **the whole word only** on a re-discovery, because by the third `mèo` the đánh vần is
 * no longer news and the delay is what would make him stop (`acceptance-criteria.md` F5).
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
  return langFor(game.language).partsHint(game.pack, state.prefix, readingOf(game, state));
}



/** `gameplay.md` §3.3 property 2 — either the prefix is a word, or something is live. */
export function isStuck(game, state) {
  const node = nodeAt(game.tree, state.prefix);
  if (!node) return true;
  return node.wordId === null && node.live.size === 0;
}

/** V14 — is there a live character on the page he is looking at? */
export function pageHasLive(game, state) {
  return livePages(game, state.prefix).has(state.page);
}
