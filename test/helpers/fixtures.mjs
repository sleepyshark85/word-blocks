// Fixtures that guarantee the state under test, instead of hoping the shipped pack has it.
//
// **Why this file exists.** Seven tests used to find a flat tile by asking the seed pack
// for one: `tableView(...).cells.find((c) => !c.live)`. That passed for months and then
// stopped, the moment the content got *better* — the Vietnamese inventory order was
// re-sorted by how many playable words sit behind each symbol, so the 24 most productive
// onsets came first and every onset on the board led to a word. The tests were right about
// the behaviour and wrong about where they got their fixture: **a test that depends on
// today's content passing today is a test that stops meaning anything the moment the
// content improves.**
//
// So the fixture is constructed rather than found, and it constructs the exact situation
// `acceptance-criteria.md` **L7** describes — *a deletion leaves a symbol with no words
// behind it; that symbol stays on the table and is simply always disabled* — by withholding
// the words instead of by touching the board. Nothing here reorders an inventory or edits a
// pack: the flat tile comes from the vocabulary, which is where flatness comes from in the
// app too.
//
// Every helper **asserts that it delivered what it promised**. A fixture that quietly stops
// producing a flat tile would re-create the failure it was written to remove.

import assert from 'node:assert/strict';

import { viPack, enPack } from './load.mjs';
import { createGame, createSession, tableView, langFor, cellsForStage } from '../../src/engine/index.mjs';

const LOAD = { vi: viPack, en: enPack };

/**
 * A pack whose position-1 table is guaranteed to hold **at least one flat tile and at
 * least one live one**, whatever the pack's inventory order happens to be today.
 *
 * It takes the real pack, finds the on-table symbol with the fewest words behind it, and
 * withholds those words — so the symbol is still declared, still in `inventoryOrder`,
 * still drawn in its own cell, and simply has nothing to lead to.
 *
 * @param {'vi'|'en'} language
 * @param {number} stage
 * @returns {{ pack, game, state, deadId, liveId }}
 */
export function packWithADeadSymbol(language, stage = 5) {
  const full = LOAD[language]();
  const lang = langFor(language);
  const cells = cellsForStage(stage);

  // The symbols the board will show at position 1, from the real inventory order.
  const inventory = lang.inventoryFor(full, cells);
  const onTable = new Set(inventory[language === 'vi' ? 'onset' : 'letter']);

  // How many playable words each of them begins.
  const behind = new Map();
  for (const word of full.words) {
    const first = lang.pathFor(word)[0];
    if (!onTable.has(first)) continue;
    behind.set(first, [...(behind.get(first) ?? []), word.id]);
  }
  const ranked = [...behind.entries()].sort((a, b) => a[1].length - b[1].length || (a[0] < b[0] ? -1 : 1));
  assert.ok(ranked.length >= 2,
    `${language}: only ${ranked.length} symbol(s) on the position-1 table begin a word, so there is nothing to make dead without emptying the board`);

  const [deadId, doomed] = ranked[0];
  const liveId = ranked[ranked.length - 1][0];
  // The same pack minus those words. Every other property — the tiles, the inventory
  // order, the media resolution, the never-together sets — is the real one.
  const drop = new Set(doomed);
  const pack = { ...full, words: full.words.filter((w) => !drop.has(w.id)) };
  const game = createGame(pack, { maxCells: 24 });
  const state = { ...createSession(game, { seed: `dead-${deadId}` }), stage };

  const table = tableView(game, state);
  const dead = table.cells.find((c) => c.id === deadId);
  const alive = table.cells.find((c) => c.id === liveId);
  assert.ok(dead, `the fixture's dead symbol "${deadId}" is not on the table it was chosen from`);
  assert.equal(dead.live, false,
    `the fixture promised a flat "${deadId}" and did not deliver one — withholding its words did not empty it`);
  assert.ok(alive && alive.live,
    `the fixture promised a live tile beside the flat one and did not deliver one`);

  return { pack: game.pack, game, state, deadId, liveId };
}

/**
 * A tile the pack declares but the board does not show at this stage — the input for
 * *"only a symbol that is on screen can be tapped"*. Computed, because which symbols fall
 * past the table's edge is a property of the inventory order and therefore of the content.
 */
export function offTableSymbol(language, stage = 5) {
  const pack = LOAD[language]();
  const lang = langFor(language);
  const group = language === 'vi' ? 'onset' : 'letter';
  const onTable = new Set(lang.inventoryFor(pack, cellsForStage(stage))[group]);
  const off = pack.inventoryOrder[group].find((id) => !onTable.has(id));
  assert.ok(off,
    `${language}: every declared ${group} fits on the stage-${stage} table, so nothing is off it`);
  return off;
}
