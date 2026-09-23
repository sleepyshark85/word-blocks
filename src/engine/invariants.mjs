// The properties that must hold after every single action, for ever.
//
// This is the fuzzer's assertion set (`test/fuzz.test.mjs`), and it lives in `src/`
// rather than in the test so that a tester — or a debug build — can call it on a live
// session and get the same answer. It returns a list of violations rather than throwing,
// because the caller decides whether a violation is a failed test or a logged defect.
//
// Slice 2's gate (`docs/slices.md`): *the same seed and taps replay identically, thousands
// of fuzzed sessions violate no invariant, and **there is no reachable state from which a
// word cannot be made**.* That last one is `gameplay.md` §3.3 property 2, and it is the
// whole mechanic stated as an assertion.
//
// **Revision 4** replaces the stage checks — there are no stages — with the constant
// table's own guarantees (B2a: every character in its permanent cell) and the paging
// guarantees (V6, V7, V14).
//
// **Revision 5** adds the two properties the letter board creates: a cell's **kind** is a
// permanent property of its glyph (B2l), and **the strip agrees with the prefix cell for
// cell and span for span** — every filled cell belongs to a span, no span is empty, and
// the spans are the stored ones (X3, X10, C4f).

import { langFor } from './lang/index.mjs';
import { nodeAt } from './tree.mjs';
import { MAX_WORD_LETTERS } from './rules.mjs';
import { tableView, stripView, pageHasLive, SHELF_SLOTS } from './session.mjs';

/** `ui.md` §0C U28 — the board's two runs, and the three kinds a cell can be. */
const BOARD_ROLES = ['letter', 'tone'];
const KINDS = ['consonant', 'vowel', 'tone'];

export function checkInvariants(game, state, context = {}) {
  const bad = [];
  const fail = (code, detail) => bad.push({ code, detail, ...context });
  const pack = game.pack;
  const lang = langFor(game.language);
  const tree = game.tree;

  /* --- the language never changes mid-session (`acceptance-criteria.md` R4, A10) --- */
  if (state.language !== pack.language) fail('languageDrift', `${state.language} vs ${pack.language}`);
  if (context.language && state.language !== context.language) {
    fail('languageDrift', `session started as ${context.language}`);
  }

  /* --- H1/H3: there is no stage, and nothing grows ---------------------------- */
  if ('stage' in state || 'globalStage' in state) fail('stageExists', 'the stage ladder is deleted');
  if ('assists' in state) fail('assistCounterExists', 'nothing is recorded about an auto-play (G10)');

  /* --- B2a/B2c: the table is the whole inventory, in its permanent cells ------- */
  const table = tableView(game, state);
  if (table.cells.length !== game.inventory.symbols.length) {
    fail('tableIncomplete', `${table.cells.length} of ${game.inventory.symbols.length}`);
  }
  const ids = new Set();
  for (let i = 0; i < table.cells.length; i += 1) {
    const cell = table.cells[i];
    if (ids.has(cell.id)) fail('duplicateTableCell', cell.id);
    ids.add(cell.id);
    // B2l — a board cell is a letter or a tone, and its kind is a permanent property of
    // the glyph rather than of his progress.
    if (!BOARD_ROLES.includes(cell.role)) fail('foreignRole', `${cell.id}:${cell.role}`);
    if (!KINDS.includes(cell.kind)) fail('foreignKind', `${cell.id}:${cell.kind}`);
    if (cell.kind !== game.inventory.symbols[i].kind) fail('kindChanged', cell.id);
    if (cell.index !== i) fail('cellMoved', `${cell.id} at ${cell.index}, expected ${i}`);
    if (cell.id !== game.inventory.symbols[i].id) fail('cellMoved', `${cell.id} is not in its slot`);
    if (cell.page !== game.inventory.symbols[i].page) fail('cellChangedPage', cell.id);
  }

  /* --- V6: every character is on exactly one page ----------------------------- */
  const paged = game.inventory.pages.reduce((n, p) => n + p.length, 0);
  if (paged !== game.inventory.symbols.length) {
    fail('pagePlanDrops', `${paged} of ${game.inventory.symbols.length}`);
  }
  if (!Number.isInteger(state.page) || state.page < 0 || state.page >= game.inventory.pages.length) {
    fail('pageOutOfRange', String(state.page));
  }

  /* --- B3: live iff the eligible set has a completion. Checked against the words,
         not against the tree that produced it, so the tree cannot certify itself. --- */
  for (const cell of table.cells) {
    const wanted = [...state.prefix, cell.id];
    const reachable = tree.eligible.some((w) => {
      const path = lang.pathFor(w);
      return path.length >= wanted.length && wanted.every((s, i) => path[i] === s);
    });
    if (reachable !== cell.live) fail('liveSetWrong', `${cell.id} live=${cell.live} reachable=${reachable}`);
  }

  /* --- B5/B6/E11: every reachable prefix is on the tree, and nothing is stuck ---- */
  const node = nodeAt(tree, state.prefix);
  if (!node) {
    fail('prefixOffTree', state.prefix.join('+'));
  } else if (node.wordId === null && node.live.size === 0) {
    fail('stuck', state.prefix.join('+'));
  }

  /* --- V14/V15: **the app never LEAVES him on a page with nothing live** — but a page
         he walked to himself is his to potter about on. `pageBy` is exactly that
         distinction, and it is why it is on the state rather than in the view: `auto`
         means the app chose this window, and the app choosing a dead one is the failure.
         A page he chose that goes dead under him cannot arise, because the only things
         that change the live set (a seat, an undo, an advance) all settle the page. --- */
  if (game.inventory.paged && state.phase === 'playing' && state.status === 'building'
      && state.pageBy === 'auto' && !pageHasLive(game, state)) {
    const anyLive = table.cells.some((c) => c.live);
    if (anyLive) fail('strandedOnDeadPage', `page ${state.page}`);
  }

  /* --- the strip agrees with the prefix, cell for cell and span for span -------- */
  const strip = stripView(game, state);
  const filled = strip.filter((c) => c.filled).length;
  const merged = strip.some((c) => c.merged);
  // **A cell per LETTER** — the tone is a mark on the carrier vowel and never a cell of
  // its own (U14, C20), so a strip holding a tone has one fewer cell than it had taps.
  const tones = state.prefix.filter((id) => pack.tileById.tone && pack.tileById.tone[id]).length;
  if (!merged && filled !== state.prefix.length - tones) {
    fail('stripDisagrees', `${filled} filled vs ${state.prefix.length - tones} letters`);
  }
  if (strip.some((c) => c.role === 'tone')) {
    fail('stripHasAToneCell', 'the tone is a mark on the rime, never a cell (U14)');
  }
  // X1 / X6 — six slots, and a word that needs a seventh would be clipped in front of
  // him. `pack.mjs` withholds one; this is the assertion that it did.
  if (filled > MAX_WORD_LETTERS) fail('stripOverflows', `${filled} cells`);
  // X3 / X10 — every filled cell belongs to exactly one span, spans are contiguous from
  // zero, and at most one cell carries the mark-slot.
  let expected = 0;
  let span = -1;
  for (const cell of strip) {
    if (!cell.filled) continue;
    if (cell.merged) continue;
    if (cell.index !== expected) fail('stripCellMoved', `${cell.glyph} at ${cell.index}`);
    expected += 1;
    if (cell.span !== span && cell.span !== span + 1) fail('spanOutOfOrder', String(cell.span));
    span = cell.span;
    if (cell.index < cell.spanStart || cell.index >= cell.spanEnd) {
      fail('cellOutsideItsSpan', `${cell.glyph}`);
    }
    if (cell.dividerBefore && cell.index !== cell.spanStart) fail('dividerInsideASound', cell.glyph);
  }
  if (strip.filter((c) => c.markSlot).length > 1) fail('twoCarriers', 'more than one mark-slot');

  /* --- the announcement is armed iff the prefix is a word ---------------------- */
  const isWord = node ? node.wordId !== null : false;
  if (state.status === 'announcing') {
    if (!state.pending) fail('announcingWithoutPending', '');
    else if (!isWord) fail('announcingNotAWord', state.prefix.join('+'));
    else if (state.pending.wordId !== node.wordId) fail('announcingWrongWord', state.pending.wordId);
  }

  /* --- the shelf never overruns five (H5, H7) ---------------------------------- */
  if (state.shelf.length > SHELF_SLOTS) fail('shelfOverflow', String(state.shelf.length));
  if (state.phase === 'playing' && state.shelf.length >= SHELF_SLOTS) {
    fail('shelfFullWhilePlaying', String(state.shelf.length));
  }

  /* --- the album is one card per discovered word, newest first (H9, T18) -------- */
  const seen = new Set();
  for (const entry of state.album) {
    if (seen.has(entry.wordId)) fail('albumDuplicate', entry.wordId);
    seen.add(entry.wordId);
    if (!state.discovered[entry.wordId]) fail('albumUndiscovered', entry.wordId);
  }
  if (seen.size !== Object.keys(state.discovered).length) {
    fail('albumOutOfStep', `${seen.size} cards vs ${Object.keys(state.discovered).length} discovered`);
  }

  return bad;
}
