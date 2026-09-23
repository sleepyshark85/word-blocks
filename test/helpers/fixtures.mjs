// Fixtures that guarantee the state under test, instead of hoping the shipped pack has it.
//
// **Why this file exists.** Seven tests used to find a flat tile by asking the seed pack
// for one: `tableView(...).cells.find((c) => !c.live)`. That passed for months and then
// stopped, the moment the content got *better* — the Vietnamese inventory order was
// re-sorted by how many playable words sit behind each symbol, so the most productive
// onsets came first and every onset on the board led to a word. The tests were right about
// the behaviour and wrong about where they got their fixture: **a test that depends on
// today's content passing today is a test that stops meaning anything the moment the
// content improves.**
//
// So the fixture is constructed rather than found, and it constructs the exact situation
// `acceptance-criteria.md` **L7** and `ui.md` §8.1 describe — *a character with no words
// behind it stays on its page, in its cell, permanently flat, and still speaks* — by
// withholding the words instead of by touching the board. Nothing here reorders an
// inventory or edits a pack: the flat tile comes from the vocabulary, which is where
// flatness comes from in the app too.
//
// Every helper **asserts that it delivered what it promised**. A fixture that quietly stops
// producing a flat tile would re-create the failure it was written to remove.

import assert from 'node:assert/strict';

import { viPack, enPack } from './load.mjs';
import { createGame, createSession, tableView, langFor } from '../../src/engine/index.mjs';

const LOAD = { vi: viPack, en: enPack };

/**
 * A pack whose position-1 table is guaranteed to hold **at least one flat tile and at
 * least one live one**, whatever the pack's inventory order happens to be today.
 *
 * It takes the real pack, finds the symbol in the first run with the fewest words behind
 * it, and withholds those words — so the symbol is still declared, still in
 * `inventoryOrder`, still drawn in its own cell on its own page, and simply has nothing
 * to lead to.
 *
 * @param {'vi'|'en'} language
 * @param {number[]|null} pages  a page plan, or null for one page (a tablet)
 * @returns {{ pack, game, state, deadId, liveId }}
 */
export function packWithADeadSymbol(language, pages = null) {
  const full = LOAD[language]();
  const lang = langFor(language);

  // Every symbol that can START a word: the first run, which is onsets or letters.
  const firstRun = new Set(lang.runsFor(full)[0].ids);

  const behind = new Map();
  for (const word of full.words) {
    const first = lang.pathFor(word)[0];
    if (!firstRun.has(first)) continue;
    behind.set(first, [...(behind.get(first) ?? []), word.id]);
  }
  const ranked = [...behind.entries()].sort((a, b) => a[1].length - b[1].length || (a[0] < b[0] ? -1 : 1));
  assert.ok(ranked.length >= 2,
    `${language}: only ${ranked.length} symbol(s) in the first run begin a word, so there is nothing to make dead without emptying the board`);

  const [deadId, doomed] = ranked[0];
  const liveId = ranked[ranked.length - 1][0];
  // The same pack minus those words. Every other property — the tiles, the inventory
  // order, the media resolution, the never-together sets — is the real one.
  const drop = new Set(doomed);
  const pack = { ...full, words: full.words.filter((w) => !drop.has(w.id)) };
  const game = createGame(pack, { pages });
  const state = createSession(game, { seed: `dead-${deadId}` });

  const table = tableView(game, state);
  const dead = table.cells.find((c) => c.id === deadId);
  const alive = table.cells.find((c) => c.id === liveId);
  assert.ok(dead, `the fixture's dead symbol "${deadId}" is not on the table it was chosen from`);
  assert.equal(dead.live, false,
    `the fixture promised a flat "${deadId}" and did not deliver one — withholding its words did not empty it`);
  assert.ok(alive && alive.live,
    'the fixture promised a live tile beside the flat one and did not deliver one');

  return {
    pack: game.pack, game, state, deadId, liveId,
  };
}

/**
 * A page plan that really pages, for a pack — the phone case. Revision 4 has two boards
 * to test, not one: a tablet shows the whole inventory at once and never pages, and a
 * test that only ever builds the tablet board would never execute §V at all.
 *
 * Returns the iPhone 17 Plus plan for Vietnamese (`ui.md` §4.4, AC V3) and the matching
 * one for English, asserted against the run lengths so it cannot silently stop paging.
 */
export function phonePages(language) {
  const pack = LOAD[language]();
  const runs = langFor(language).runsFor(pack).map((r) => r.ids.length);
  const cap = 28; // the owner's device, both candidate sizes
  const pages = [];
  for (const len of runs) {
    const k = Math.ceil(len / cap);
    const base = Math.floor(len / k);
    const extra = len % k;
    for (let i = 0; i < k; i += 1) pages.push(base + (i < extra ? 1 : 0));
  }
  assert.ok(pages.length > 1, `${language}: the phone plan is one page, so nothing pages`);
  assert.equal(pages.reduce((a, b) => a + b, 0), runs.reduce((a, b) => a + b, 0));
  return pages;
}

/**
 * A symbol the pack does not have at all — the only way a tap can now name something that
 * is not on the board, because paging truncates nothing (C21). It is what "only a symbol
 * that is on screen can be tapped" is tested against.
 */
export function unknownSymbol(language) {
  const pack = LOAD[language]();
  const ids = new Set(langFor(language).runsFor(pack).flatMap((r) => r.ids));
  const off = ['zzz-not-a-tile', 'ø', '∅'].find((id) => !ids.has(id));
  assert.ok(off, `${language}: every candidate name is a real tile`);
  return off;
}
