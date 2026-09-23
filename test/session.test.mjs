// The reducer. `(state, action) => state`, and every rule §E, §F, §G and §H states.

import test from 'node:test';
import assert from 'node:assert/strict';

import { viPack, enPack } from './helpers/load.mjs';
import {
  createGame, createSession, reduce, tableView, stripView, shelfView, chantSteps,
  motifNotes, partsHintSteps, symbolsFrom, imageFor, checkInvariants, isStuck,
  effectiveCells, SHELF_SLOTS, WORDS_PER_STAGE, MAX_STAGE,
} from '../src/engine/index.mjs';
import { start, live, tap, undoTo, discover, firstPath, unseenPath } from './helpers/play.mjs';
import { packWithADeadSymbol, offTableSymbol } from './helpers/fixtures.mjs';

const MEO = ['m', 'eo', 'huyen'];

function viGame(stage = 5) {
  return start(viPack(), { seed: 'reducer', stage });
}

/* ------------------------------------------------------------------ §E taps */

test('E1 — a live tap seats the symbol and recomputes the live set', () => {
  const { game, state } = viGame();
  const after = tap(game, state, 'm');
  assert.deepEqual(after.prefix, ['m']);
  assert.equal(tableView(game, after).role, 'rime');
  assert.deepEqual(checkInvariants(game, after), []);
});

test('E2 — a disabled tap changes nothing: no seat, no strip change, no table change', () => {
  // The flat tile is **constructed** (`helpers/fixtures.mjs`), not found in the seed pack:
  // whether today's content happens to leave a symbol empty is not what this asserts.
  const { game, state, deadId } = packWithADeadSymbol('vi');
  const after = reduce(game, state, { type: 'tapSymbol', symbolId: deadId });
  assert.deepEqual(after.prefix, state.prefix);
  assert.equal(after.status, state.status);
  assert.deepEqual(tableView(game, after).cells.map((c) => c.live),
    tableView(game, state).cells.map((c) => c.live));
  // G8 — it does not reset the ladder, but it does defer it.
  assert.equal(after.idle.resetSeq, state.idle.resetSeq);
  assert.equal(after.idle.touchSeq, state.idle.touchSeq + 1);
});

test('a tap on a symbol that is not on the table is refused outright', () => {
  const { game, state } = viGame();
  // Which symbols fall past the table's edge depends on the inventory order, so the one
  // used here is computed from the pack rather than named.
  const off = offTableSymbol('vi', 5);
  assert.ok(!tableView(game, state).cells.some((c) => c.id === off));
  assert.equal(reduce(game, state, { type: 'tapSymbol', symbolId: off }), state);
});

test('E8 / E10 — undo returns that symbol and everything after it, and recomputes', () => {
  const { game, state } = viGame();
  const two = tap(game, tap(game, state, 'm'), 'eo');
  assert.deepEqual(two.prefix, ['m', 'eo']);
  const undone = undoTo(game, two, 1);
  assert.deepEqual(undone.prefix, ['m']);
  // Recomputed, not restored from a cache that can drift: identical to walking there.
  assert.deepEqual(live(game, undone), live(game, tap(game, state, 'm')));
});

test('E9 — tapping the first symbol empties the strip and returns position 1', () => {
  const { game, state } = viGame();
  const three = tap(game, tap(game, tap(game, state, 'm'), 'eo'), 'huyen');
  const cleared = undoTo(game, reduce(game, three, { type: 'advance' }), 0);
  assert.deepEqual(cleared.prefix, []);
  assert.deepEqual(live(game, cleared), live(game, state));
});

test('T20 — tapping an empty strip does nothing at all', () => {
  const { game, state } = viGame();
  assert.equal(undoTo(game, state, 0), state);
  assert.equal(undoTo(game, state, 2), state);
});

test('symbolsFrom lists what an undo sends home, last first', () => {
  const { game, state } = viGame();
  const two = tap(game, tap(game, state, 'm'), 'eo');
  assert.deepEqual(symbolsFrom(game, two, 0).map((s) => s.id), ['eo', 'm']);
  assert.deepEqual(symbolsFrom(game, two, 1).map((s) => s.id), ['eo']);
});

test('T17 — tap and undo fifty times and nothing leaks', () => {
  const { game, state } = viGame();
  let s = state;
  for (let i = 0; i < 50; i += 1) s = undoTo(game, tap(game, s, 'm'), 0);
  assert.deepEqual(s.prefix, []);
  assert.deepEqual(live(game, s), live(game, state));
  assert.deepEqual(s.album, []);
  assert.deepEqual(s.discovered, state.discovered);
  assert.deepEqual(checkInvariants(game, s), []);
});

/* --------------------------------------------------------- §F the announcement */

test('the announcement is armed the instant the prefix is a word', () => {
  const { game, state } = viGame();
  const two = tap(game, tap(game, state, 'm'), 'eo');
  assert.equal(two.status, 'building');
  const done = tap(game, two, 'huyen');
  assert.equal(done.status, 'announcing');
  assert.equal(done.pending.text, 'mèo');
  assert.equal(done.pending.isNew, true);
});

test('F4 / F5 — four notes and the full chant when new; three and the word alone after', () => {
  const { game, state } = viGame();
  const first = tap(game, tap(game, tap(game, state, 'm'), 'eo'), 'huyen');
  assert.equal(motifNotes(first), 4);
  // `blend` is the toneless-blend clip and is present only when the pack ships one
  // (`content-pipeline.md` §5): a missing blend skips the step and the chant continues.
  assert.deepEqual(chantSteps(game, first).map((s) => s.step).filter((x) => x !== 'blend'),
    ['onset', 'rime', 'tone', 'word']);

  const committed = reduce(game, first, { type: 'advance' });
  const again = tap(game, tap(game, tap(game, committed, 'm'), 'eo'), 'huyen');
  assert.equal(motifNotes(again), 3);
  assert.deepEqual(chantSteps(game, again).map((s) => s.step), ['word']);
});

test('C12 — the tone step is omitted for `ngang`, the onset step for a zero onset', () => {
  const { game, state } = viGame();
  // `ao` is the zero-onset word `áo`; `sac` marks it.
  const zero = tap(game, tap(game, tap(game, state, '∅'), 'ao'), 'sac');
  assert.equal(zero.status, 'announcing');
  assert.deepEqual(chantSteps(game, zero).map((s) => s.step).filter((x) => x !== 'blend'),
    ['rime', 'tone', 'word']);

  const ngang = tap(game, tap(game, tap(game, state, 'c'), 'am'), 'ngang');
  assert.equal(ngang.status, 'announcing');
  assert.deepEqual(chantSteps(game, ngang).map((s) => s.step).filter((x) => x !== 'blend'),
    ['onset', 'rime', 'word']);
});

test('B9 / B11 — the k-th encounter shows images[k mod n]', () => {
  const two = { images: [{ src: 'a' }, { src: 'b' }], fallbackEmoji: null };
  assert.deepEqual([0, 1, 2, 3].map((k) => imageFor(two, k).image.src), ['a', 'b', 'a', 'b']);
  const one = { images: [{ src: 'only' }], fallbackEmoji: null };
  assert.deepEqual([0, 1, 7].map((k) => imageFor(one, k).image.src), ['only', 'only', 'only']);
  const none = { images: [], fallbackEmoji: 'cat' };
  assert.equal(imageFor(none, 3).image, null);
  assert.equal(imageFor(none, 3).fallbackEmoji, 'cat');
});

test('T18 — twenty discoveries of one word fill one slot and make one album card', () => {
  const { game, state } = viGame();
  let s = state;
  const seen = [];
  for (let i = 0; i < 20; i += 1) {
    s = tap(game, tap(game, tap(game, s, 'm'), 'eo'), 'huyen');
    assert.equal(s.status, 'announcing');
    seen.push(s.pending.imageIndex);
    s = reduce(game, s, { type: 'advance' });
  }
  assert.equal(s.shelf.length, 1);
  assert.equal(s.album.filter((e) => e.wordId === 'meo').length, 1);
  assert.equal(s.encounters.meo, 20);
  const n = game.pack.words.find((w) => w.id === 'meo').images.length;
  assert.deepEqual(seen, Array.from({ length: 20 }, (_, k) => k % n));
});

test('F14 — a word that continues nothing clears the strip on advance', () => {
  const { game, state } = viGame();
  const done = tap(game, tap(game, tap(game, state, 'm'), 'eo'), 'huyen');
  assert.equal(done.pending.continues, false);
  assert.deepEqual(reduce(game, done, { type: 'advance' }).prefix, []);
});

test('F15 / F16 — a prefix word announces in full, keeps the strip, and can still be undone', () => {
  // `en-seed` has no prefix pair today, so one is made: a pack whose words are `ca` and
  // `cat`. The rule exists because his mother will add `he`, `be` and `at`.
  const base = enPack();
  const cat = base.words.find((w) => w.id === 'cat');
  const ca = { ...cat, id: 'ca', text: 'ca', tiles: ['c', 'a'] };
  const pack = { ...base, words: [ca, cat] };
  const game = createGame(pack, { maxCells: 24 });
  let s = { ...createSession(game, { seed: 'prefix' }), stage: 5 };
  s = tap(game, tap(game, s, 'c'), 'a');
  assert.equal(s.status, 'announcing');
  assert.equal(s.pending.continues, true);
  assert.deepEqual(chantSteps(game, s).map((x) => x.step), ['tile', 'tile', 'word']);
  const after = reduce(game, s, { type: 'advance' });
  assert.deepEqual(after.prefix, ['c', 'a'], 'the word he made was taken away from him');
  assert.deepEqual(live(game, after), ['t']);
  // F16 — he is never trapped in it.
  assert.deepEqual(undoTo(game, after, 0).prefix, []);
});

/* ----------------------------------------------------- §G the idle ladder */

test('G7 / G8 — a seated symbol resets the ladder; a flat tap only defers it', () => {
  const { game, state, deadId, liveId } = packWithADeadSymbol('vi');
  const seated = tap(game, state, liveId);
  assert.equal(seated.idle.resetSeq, state.idle.resetSeq + 1);
  const knocked = reduce(game, state, { type: 'tapSymbol', symbolId: deadId });
  assert.equal(knocked.idle.resetSeq, state.idle.resetSeq, 'a flat tap reset the ladder');
  assert.equal(knocked.idle.touchSeq, state.idle.touchSeq + 1, 'a flat tap did not defer it');
});

test('L7 — a symbol with no words left behind it stays in its cell and is simply flat', () => {
  // The deletion case, stated directly: **the board does not reshuffle.** Every cell of
  // the trimmed pack's table is in the same place as the full pack's, and the only
  // difference is that one of them stopped standing up.
  const full = viGame();
  const { game, state, deadId } = packWithADeadSymbol('vi');
  assert.deepEqual(tableView(game, state).cells.map((c) => c.id),
    tableView(full.game, full.state).cells.map((c) => c.id),
    'losing a word moved a symbol to a different cell');
  assert.equal(tableView(game, state).cells.find((c) => c.id === deadId).live, false);
  assert.equal(tableView(full.game, full.state).cells.find((c) => c.id === deadId).live, true,
    'the fixture proved nothing — that symbol was already flat with the full pack');
  // And the rest of the board is untouched: every other cell keeps the liveness it had.
  for (const cell of tableView(game, state).cells) {
    if (cell.id === deadId) continue;
    const before = tableView(full.game, full.state).cells.find((c) => c.id === cell.id);
    assert.equal(cell.live, before.live, `${cell.id} changed state when ${deadId} emptied`);
  }
});

test('G10 / G11 — an auto-play is deterministic, records an assist and earns no stage credit', () => {
  const a = viGame();
  const b = viGame();
  const x = reduce(a.game, a.state, { type: 'autoPlay' });
  const y = reduce(b.game, b.state, { type: 'autoPlay' });
  assert.deepEqual(x.prefix, y.prefix, 'the same seed chose a different symbol');
  assert.equal(x.assists, 1);

  let s = x;
  while (s.status === 'building') s = reduce(a.game, s, { type: 'autoPlay' });
  assert.equal(s.pending.assisted, true);
  const after = reduce(a.game, s, { type: 'advance' });
  assert.equal(after.stageProgress, 0, 'an assisted discovery earned stage credit');
  assert.equal(after.album.length, 1, 'but it is still his word, and it is in the album');
});

test('G6 — left alone, the app finds a word by itself, every time, from any prefix', () => {
  const { game } = viGame();
  for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
    let s = { ...createSession(game, { seed }), stage: 5 };
    let guard = 0;
    while (s.status === 'building') {
      s = reduce(game, s, { type: 'autoPlay' });
      assert.ok(guard++ < 8, `the ladder did not reach a word from seed ${seed}`);
    }
    assert.ok(s.pending.text.length > 0);
  }
});

test('M3 — the parts hint returns the identical state object and speaks only the parts', () => {
  const { game, state } = viGame();
  const two = tap(game, tap(game, state, 'm'), 'eo');
  assert.equal(reduce(game, two, { type: 'partsHint' }), two);
  const steps = partsHintSteps(game, two);
  assert.deepEqual(steps.map((s) => s.step), ['onset', 'rime']);
  assert.ok(!steps.some((s) => s.step === 'word'), 'the hint spoke a completion');
});

/* ------------------------------------------------- §H stage, shelf, album */

test('H5 / H6 — only a new word fills a slot', () => {
  const { game, state } = viGame();
  let s = discover(game, state, MEO);
  assert.equal(s.shelf.length, 1);
  s = discover(game, s, MEO);
  assert.equal(s.shelf.length, 1, 'a re-discovery filled a slot');
});

test('H7 / H8 — the fifth slot tips into the album, play does not resume, the shelf clears', () => {
  const { game } = viGame();
  let s = { ...createSession(game, { seed: 'shelf' }), stage: 5 };
  const words = [];
  const eligible = game.treeFor(24).eligible.slice(0, SHELF_SLOTS);
  for (const w of eligible) {
    const path = [w.syllables[0].onset ?? '∅', w.syllables[0].rime, w.syllables[0].tone];
    s = discover(game, s, path);
    words.push(w.text);
    assert.deepEqual(checkInvariants(game, s), []);
  }
  assert.equal(s.phase, 'album');
  assert.equal(s.album.length, SHELF_SLOTS);
  // Play does not resume by itself: every play action is a no-op from here.
  assert.equal(reduce(game, s, { type: 'tapSymbol', symbolId: 'm' }), s);
  assert.equal(reduce(game, s, { type: 'autoPlay' }), s);
  const left = reduce(game, s, { type: 'leaveAlbum' });
  assert.equal(left.phase, 'playing');
  assert.deepEqual(left.shelf, []);
  assert.deepEqual(left.prefix, []);
  assert.deepEqual(shelfView(left), [null, null, null, null, null]);
  // H9 — the album keeps everything, newest first, with no count anywhere in the state.
  assert.deepEqual(left.album.map((e) => e.text), words.reverse());
});

test('H2 / H4 — the stage advances on discovery, never decreases, and cannot deadlock', () => {
  const { game } = viGame();
  let s = { ...createSession(game, { seed: 'stage' }), stage: 1 };
  assert.equal(effectiveCells(game, s.stage), 8);
  const stages = [s.stage];
  let guard = 0;
  while (s.stage < MAX_STAGE && guard < 400) {
    if (s.phase === 'album') { s = reduce(game, s, { type: 'leaveAlbum' }); continue; }
    // Discover something he has not seen: the live path that reaches an unknown word.
    const path = unseenPath(game, s) ?? firstPath(game, s);
    s = discover(game, s, path);
    stages.push(s.stage);
    guard += 1;
  }
  assert.equal(s.stage, MAX_STAGE, `stuck at stage ${s.stage} after ${guard} discoveries`);
  assert.equal(effectiveCells(game, s.stage), 24);
  // H4 — it never went backwards, at any point.
  for (let i = 1; i < stages.length; i += 1) assert.ok(stages[i] >= stages[i - 1]);
});

test('H2 — eight new words at a stage that holds eight advances it on the eighth', () => {
  // The seed pack's stage-1 table holds only five words, so the eight-word clause is
  // exercised against a table wide enough to satisfy it.
  const { game } = viGame();
  let s = { ...createSession(game, { seed: 'eight' }), stage: 5 };
  const eligible = game.treeFor(24).eligible;
  assert.ok(eligible.length > WORDS_PER_STAGE, 'the 24-cell table cannot hold eight words');
  let discovered = 0;
  for (const w of eligible.slice(0, WORDS_PER_STAGE)) {
    if (s.phase === 'album') s = reduce(game, s, { type: 'leaveAlbum' });
    const syl = w.syllables[0];
    s = discover(game, s, [syl.onset ?? '\u2205', syl.rime, syl.tone]);
    discovered += 1;
    if (discovered < WORDS_PER_STAGE) assert.equal(s.stage, 5, `advanced early at ${discovered}`);
  }
  assert.equal(s.stageProgress, 0, 'the eighth new word did not reset the counter');
});

test('H14 / H16 — Finish session ends it, and no play action starts it again', () => {
  const { game, state } = viGame();
  const ended = reduce(game, tap(game, state, 'm'), { type: 'finishSession' });
  assert.equal(ended.phase, 'ended');
  assert.deepEqual(ended.prefix, []);
  for (const action of [{ type: 'tapSymbol', symbolId: 'm' }, { type: 'autoPlay' }, { type: 'leaveAlbum' }]) {
    assert.equal(reduce(game, ended, action).phase, 'ended', `${action.type} restarted play`);
  }
});

/* --------------------------------------------------------------- the strip */

test('the Vietnamese strip is three cells, always, and the rime wears the mark', () => {
  const { game, state } = viGame();
  assert.deepEqual(stripView(game, state).map((c) => c.role), ['onset', 'rime', 'tone']);
  const two = tap(game, tap(game, state, 'm'), 'eo');
  assert.equal(stripView(game, two)[1].glyph, 'eo');
  const three = tap(game, two, 'huyen');
  assert.equal(stripView(game, three)[1].glyph, 'èo');
  assert.equal(stripView(game, three)[2].glyph, 'huyền');
});

test('C2 — a zero-onset word fills the first cell with the socket, not a glyph', () => {
  const { game, state } = viGame();
  const s = tap(game, state, '∅');
  assert.equal(stripView(game, s)[0].socket, true);
  assert.equal(stripView(game, s)[0].glyph, null);
  assert.equal(stripView(game, s)[0].filled, true);
});

test('D2 / D3 — the English strip is what is placed plus one empty cell, never a length', () => {
  const { game, state } = start(enPack(), { stage: 5 });
  assert.equal(stripView(game, state).length, 1);
  const one = tap(game, state, 'c');
  assert.equal(stripView(game, one).length, 2);
  assert.deepEqual(stripView(game, one).map((c) => c.filled), [true, false]);
  const two = tap(game, one, 'a');
  assert.equal(stripView(game, two).length, 3);
});

/* ------------------------------------------------------------- no dead ends */

test('isStuck is false in every reachable state of both packs', () => {
  for (const load of [viPack, enPack]) {
    const { game, state } = start(load(), { stage: 5 });
    const walk = (s, depth) => {
      assert.equal(isStuck(game, s), false, `stuck at ${s.prefix.join('+')}`);
      if (s.status === 'announcing' || depth > 6) return;
      for (const symbol of live(game, s)) walk(tap(game, s, symbol), depth + 1);
    };
    walk(state, 0);
  }
});
