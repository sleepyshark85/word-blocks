// The properties that must hold after every single action, for ever.
//
// This is the fuzzer's assertion set (`test/fuzz.test.mjs`), and it lives in `src/`
// rather than in the test so that a tester — or a debug build — can call it on a live
// session and get the same answer. It returns a list of violations rather than throwing,
// because the caller decides whether a violation is a failed test or a logged defect.
//
// Revision 2's gate (`docs/slices.md` Slice 2): *the same seed and taps replay
// identically, thousands of fuzzed sessions violate no invariant, and **there is no
// reachable state from which a word cannot be made**.* That last one is `gameplay.md`
// §3.3 property 2, and it is the whole mechanic stated as an assertion.

import { langFor } from './lang/index.mjs';
import { nodeAt } from './tree.mjs';
import { tableView, treeOf, effectiveCells } from './session.mjs';
import { MAX_STAGE, SHELF_SLOTS, CELLS_BY_STAGE } from './stages.mjs';

export function checkInvariants(game, state, context = {}) {
  const bad = [];
  const fail = (code, detail) => bad.push({ code, detail, ...context });
  const pack = game.pack;
  const lang = langFor(game.language);

  /* --- the language never changes mid-session (`acceptance-criteria.md` R4, A10) --- */
  if (state.language !== pack.language) fail('languageDrift', `${state.language} vs ${pack.language}`);
  if (context.language && state.language !== context.language) {
    fail('languageDrift', `session started as ${context.language}`);
  }

  /* --- the stage ladder (H1, H4) --------------------------------------------- */
  if (!Number.isInteger(state.stage) || state.stage < 1 || state.stage > MAX_STAGE) {
    fail('stageOutOfRange', String(state.stage));
  }
  const cells = effectiveCells(game, state.stage);
  if (!CELLS_BY_STAGE.includes(cells) && cells !== game.maxCells) {
    fail('cellsNotOnTheLadder', String(cells));
  }

  const tree = treeOf(game, state);
  if (!tree) { fail('noTree', String(cells)); return bad; }

  /* --- the table: the right size, no duplicate cell, nothing off the inventory -- */
  const table = tableView(game, state);
  const ids = new Set();
  for (const cell of table.cells) {
    if (ids.has(cell.id)) fail('duplicateTableCell', cell.id);
    ids.add(cell.id);
    if (!lang.tileGroups.includes(cell.role)) fail('foreignRole', `${cell.id}:${cell.role}`);
  }
  if (table.role !== null && table.cells.length === 0) fail('emptyTable', table.role);
  if (table.cells.length > cells) fail('tableTooWide', String(table.cells.length));

  /* --- B3: live iff the eligible set has a completion. Checked against the words,
         not against the tree that produced it, so the tree cannot certify itself. --- */
  for (const cell of table.cells) {
    const wanted = [...state.prefix, cell.id];
    const reachable = tree.eligible.some((w) => {
      const path = lang.pathFor(w);
      return path.length > wanted.length - 1
        && wanted.every((s, i) => path[i] === s);
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

  /* --- the strip agrees with the prefix ---------------------------------------- */
  const strip = lang.stripCells(pack, state.prefix);
  const filled = strip.filter((c) => c.filled).length;
  if (filled !== state.prefix.length) {
    fail('stripDisagrees', `${filled} filled vs prefix ${state.prefix.length}`);
  }

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
