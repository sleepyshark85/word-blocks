// The reducer. `(state, action) => state`, and every rule §E, §F, §G, §H and §V states.

import test from 'node:test';
import assert from 'node:assert/strict';

import { viPack, enPack } from './helpers/load.mjs';
import {
  createGame, createSession, reduce, tableView, pageView, stripView, shelfView, chantSteps,
  motifNotes, partsHintSteps, symbolsFrom, imageFor, checkInvariants, isStuck, pageHasLive,
  progressOf, SHELF_SLOTS,
} from '../src/engine/index.mjs';
import { start, live, tap, undoTo, discover } from './helpers/play.mjs';
import { packWithADeadSymbol, phonePages, unknownSymbol } from './helpers/fixtures.mjs';

const MEO = ['m', 'eo', 'huyen'];

function viGame(pages = null) {
  return start(viPack(), { seed: 'reducer', pages });
}

/** The owner's board: four Vietnamese pages, 28 cells each. */
function viPhone() {
  return start(viPack(), { seed: 'phone', pages: phonePages('vi') });
}

/* ------------------------------------------------------------------ §E taps */

test('E1 — a live tap seats the symbol and recomputes the live set', () => {
  const { game, state } = viGame();
  const after = tap(game, state, 'm');
  assert.deepEqual(after.prefix, ['m']);
  assert.ok(live(game, after).length > 0);
  assert.ok(live(game, after).every((id) => game.pack.tileById.rime[id]),
    'after an onset, only rimes stand up');
  assert.deepEqual(checkInvariants(game, after), []);
});

test('E2 — a disabled tap changes nothing: no seat, no strip change, no table change', () => {
  // The flat tile is **constructed** (`helpers/fixtures.mjs`), not found in the seed pack:
  // whether today's content happens to leave a symbol empty is not what this asserts.
  const { game, state, deadId } = packWithADeadSymbol('vi');
  const after = reduce(game, state, { type: 'tapSymbol', symbolId: deadId });
  assert.deepEqual(after.prefix, state.prefix);
  assert.equal(after.status, state.status);
  assert.equal(after.page, state.page, 'a flat tap moved the board');
  assert.deepEqual(tableView(game, after).cells.map((c) => c.live),
    tableView(game, state).cells.map((c) => c.live));
  // G8 — it does not reset the ladder, but it does defer it.
  assert.equal(after.idle.resetSeq, state.idle.resetSeq);
  assert.equal(after.idle.touchSeq, state.idle.touchSeq + 1);
});

test('a tap naming a symbol the pack does not have is refused outright', () => {
  const { game, state } = viGame();
  // Paging truncates nothing (C21), so the only way to name something off the board is
  // to name something that does not exist.
  const off = unknownSymbol('vi');
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
  const { game, state } = viPhone();
  let s = state;
  for (let i = 0; i < 50; i += 1) s = undoTo(game, tap(game, s, 'm'), 0);
  assert.deepEqual(s.prefix, []);
  assert.deepEqual(live(game, s), live(game, state));
  assert.equal(s.page, state.page, 'fifty round trips left the board on a different page');
  assert.deepEqual(s.album, []);
  assert.deepEqual(s.discovered, state.discovered);
  assert.deepEqual(checkInvariants(game, s), []);
});

/* ----------------------------------------------------------------- §V paging */

test('V12 — a seat does NOT move the board while his page still has something live', () => {
  const pack = enPack();
  // English on a phone: page 1 is the alphabet, page 2 the digraphs. After `c` the live
  // set is still on page 1, so the board must not move under his finger.
  const game = createGame(pack, { pages: phonePages('en') });
  const state = createSession(game, { seed: 'v12' });
  assert.equal(state.page, 0);
  const after = tap(game, state, 'c');
  assert.equal(after.page, 0, 'the board moved while page 1 still had live letters');
  assert.equal(after.pageSeq, state.pageSeq, 'a slide was announced that should not happen');
  assert.ok(pageHasLive(game, after));
});

test('V13 — a seat that empties his page slides to the LOWEST page that has something', () => {
  const { game, state } = viPhone();
  // Page 0 is the 26 onsets. After an onset, only rimes are live — pages 1 and 2 — so
  // the board slides to page 1, the lowest of them, deterministically.
  const after = tap(game, state, 'm');
  assert.equal(after.page, 1);
  assert.equal(after.pageBy, 'auto');
  assert.equal(after.pageSeq, state.pageSeq + 1);
  // And after the rime, only a tone is live, which is page 3.
  const tone = tap(game, after, 'eo');
  assert.equal(tone.page, 3);
  assert.equal(tone.pageBy, 'auto');
});

test('V14 — the app never leaves him on a page with nothing live, over a whole word', () => {
  const { game, state } = viPhone();
  let s = state;
  for (const symbol of MEO) {
    assert.ok(pageHasLive(game, s), `stranded before tapping ${symbol}`);
    s = tap(game, s, symbol);
  }
  assert.equal(s.status, 'announcing');
  const after = reduce(game, s, { type: 'advance' });
  assert.ok(pageHasLive(game, after), 'stranded after the word was committed');
});

test('V15 — he may walk to a dead page himself, and the app does not yank him away', () => {
  const { game, state } = viPhone();
  const tonePage = game.inventory.pages.length - 1;
  const there = reduce(game, state, { type: 'tapPage', index: tonePage });
  assert.equal(there.page, tonePage);
  assert.equal(there.pageBy, 'self');
  assert.equal(pageHasLive(game, there), false, 'the tone page is live with an empty strip');
  // Pressing a flat tile there changes nothing — including the page.
  const pressed = reduce(game, there, { type: 'tapSymbol', symbolId: 'huyen' });
  assert.equal(pressed.page, tonePage, 'the app took him off a page he chose');
  assert.deepEqual(pressed.prefix, []);
  assert.deepEqual(checkInvariants(game, pressed), []);
});

test('V23 — tapping a symbol in the strip returns it AND slides to that symbol\'s page', () => {
  const { game, state } = viPhone();
  const two = tap(game, tap(game, state, 'm'), 'eo');
  // Seating the rime put him on the tone page (V13), three pages from where `m` lives.
  assert.equal(two.page, game.inventory.pageOf('huyen'));
  const undone = undoTo(game, two, 0); // the onset: back to page 0, where `m` lives
  assert.equal(undone.page, game.inventory.pageOf('m'));
  assert.deepEqual(undone.prefix, []);
  // And undoing only the rime lands on the rime's own page, which is live again.
  const back = undoTo(game, two, 1);
  assert.deepEqual(back.prefix, ['m']);
  assert.equal(back.page, game.inventory.pageOf('eo'));
});

test('V10 / V11 — the page records WHO changed it, so the slide can be his or the app\'s', () => {
  const { game, state } = viPhone();
  const his = reduce(game, state, { type: 'tapPage', index: 2 });
  assert.equal(his.pageBy, 'self');
  const auto = reduce(game, state, { type: 'tapPage', index: 2, by: 'auto' });
  assert.equal(auto.pageBy, 'auto');
  // V27 — the app's own page change (before an auto-play) is not a touch, so it must not
  // defer the idle ladder the way his tap does.
  assert.equal(his.idle.touchSeq, state.idle.touchSeq + 1);
  assert.equal(auto.idle.touchSeq, state.idle.touchSeq);
});

test('an out-of-range or unchanged page is a no-op, not a corruption', () => {
  const { game, state } = viPhone();
  for (const index of [-1, 4, 99, 1.5, null, undefined]) {
    const after = reduce(game, state, { type: 'tapPage', index });
    assert.equal(after.page, state.page, `index ${index} moved the board`);
    assert.equal(after.pageSeq, state.pageSeq);
  }
  const same = reduce(game, state, { type: 'tapPage', index: state.page });
  assert.equal(same.pageSeq, state.pageSeq, 'tapping the current page announced a slide');
});

test('V1 — an unpaged board never changes page, whatever he taps', () => {
  const { game, state } = viGame();
  assert.equal(game.inventory.paged, false);
  let s = state;
  for (const symbol of MEO) {
    s = tap(game, s, symbol);
    assert.equal(s.page, 0);
    assert.equal(s.pageSeq, 0, 'a tablet announced a page slide');
  }
  assert.equal(pageView(game, s).paged, false);
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

test('V25 — the board does not auto-advance while the announcement is running', () => {
  const { game, state } = viPhone();
  const done = tap(game, tap(game, tap(game, state, 'm'), 'eo'), 'huyen');
  assert.equal(done.status, 'announcing');
  assert.equal(done.page, 3, 'the tone page is where he was, and it must stay there');
  const after = reduce(game, done, { type: 'advance' });
  assert.equal(after.page, 0, 'the board settles when the announcement ends, not during it');
});

test('F4 / F5 — four notes and the full chant when new; three and the word alone after', () => {
  const { game, state } = viGame();
  const first = tap(game, tap(game, tap(game, state, 'm'), 'eo'), 'huyen');
  assert.equal(motifNotes(first), 4);
  assert.deepEqual(chantSteps(game, first).map((s) => s.step),
    ['onset', 'rime', 'blend', 'tone', 'word']);

  const committed = reduce(game, first, { type: 'advance' });
  const again = tap(game, tap(game, tap(game, committed, 'm'), 'eo'), 'huyen');
  assert.equal(motifNotes(again), 3);
  assert.deepEqual(chantSteps(game, again).map((s) => s.step), ['word']);
});

test('C12 / C12a — the chant is five beats and what is SHOWN accumulates', () => {
  const { game, state } = viGame();
  const bo = tap(game, tap(game, tap(game, state, 'b'), 'o'), 'huyen');
  const beats = chantSteps(game, bo);
  assert.deepEqual(beats.map((b) => b.step), ['onset', 'rime', 'blend', 'tone', 'word']);
  // **The owner's own words**: `b` then `b o` then `b ò`.
  assert.deepEqual(beats.map((b) => b.cells.map((c) => c.glyph)),
    [['b'], ['b', 'o'], ['bo'], ['bò'], ['bò']]);
  // C12a — **the tone's name is never rendered**. `huyền` is spoken, never shown.
  for (const beat of beats) {
    for (const cell of beat.cells) {
      assert.ok(!cell.glyph.includes('huyền'), `beat ${beat.step} shows the tone's name`);
      assert.ok('bò'.includes(cell.glyph) || cell.glyph === 'bo' || cell.glyph === 'b' || cell.glyph === 'o',
        `beat ${beat.step} shows "${cell.glyph}", which is not part of the word`);
    }
  }
  // C12b — beat 3 is the pack's own blend clip, and it is the beat that merges.
  const blend = beats[2];
  assert.equal(blend.merged, true);
  assert.equal(blend.cells.length, 1);
  assert.equal(blend.audio.src, game.pack.words.find((w) => w.id === 'bo').audio.blend.src);
  // C14 — the mark drops onto the already-merged word at beat 4.
  assert.equal(beats[3].merged, true);
  assert.equal(beats[3].cells[0].toned, true);
});

test('C12 — the tone beat is omitted for `ngang`, the onset beat for a zero onset', () => {
  const { game, state } = viGame();
  // `áo` = ao + sắc, two taps, no placeholder (C19).
  const zero = tap(game, tap(game, state, 'ao'), 'sac');
  assert.equal(zero.status, 'announcing');
  assert.deepEqual(chantSteps(game, zero).map((s) => s.step), ['rime', 'blend', 'tone', 'word']);
  assert.deepEqual(chantSteps(game, zero).map((s) => s.cells.map((c) => c.glyph)),
    [['ao'], ['ao'], ['áo'], ['áo']]);

  const ngang = tap(game, tap(game, tap(game, state, 'c'), 'am'), 'ngang');
  assert.equal(ngang.status, 'announcing');
  assert.deepEqual(chantSteps(game, ngang).map((s) => s.step), ['onset', 'rime', 'blend', 'word']);
  // A `ngang` word's blend IS the word, which is why the pack ships no separate clip.
  const beats = chantSteps(game, ngang);
  assert.equal(beats[2].caption, 'cam');
  assert.ok(beats[2].audio, 'the blend beat has nothing to say');
});

test('C12d — the chant reads its gaps from the pack, so she can slow it down', () => {
  const pack = viPack();
  const slow = { ...pack, chant: { ...pack.chant, gapsMs: { ...pack.chant.gapsMs, blend: 1500 } } };
  const { game, state } = start(slow, { seed: 'gaps' });
  const beats = chantSteps(game, tap(game, tap(game, tap(game, state, 'b'), 'o'), 'huyen'));
  assert.equal(beats.find((b) => b.step === 'blend').gapAfterMs, 1500);
});

test('D10 — the English chant is the short clips left to right, then the whole word', () => {
  const pack = enPack();
  const { game, state } = start(pack, { seed: 'en-chant' });
  const cat = tap(game, tap(game, tap(game, state, 'c'), 'a'), 't');
  const beats = chantSteps(game, cat);
  assert.deepEqual(beats.map((b) => b.step), ['tile', 'tile', 'tile', 'word']);
  assert.deepEqual(beats.map((b) => b.cells.map((c) => c.glyph)),
    [['c'], ['c', 'a'], ['c', 'a', 't'], ['cat']]);
  // N14 — never the `long` anchored form.
  for (const beat of beats.slice(0, 3)) {
    const tile = pack.tileById.letter[beat.caption];
    assert.equal(beat.audio.src, tile.audio.short.src, `${beat.caption} used the long clip`);
  }
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
  const game = createGame(pack);
  let s = createSession(game, { seed: 'prefix' });
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

test('G10 / G11 — an auto-play is deterministic and NOTHING is recorded about it', () => {
  const a = viGame();
  const b = viGame();
  const x = reduce(a.game, a.state, { type: 'autoPlay' });
  const y = reduce(b.game, b.state, { type: 'autoPlay' });
  assert.deepEqual(x.prefix, y.prefix, 'the same seed chose a different symbol');
  // **G10, restated — the inverse of revision 2.** There is no assist counter, because
  // there is no stage for it to hold back (`gameplay.md` §3.6).
  assert.ok(!('assists' in x), 'an assist counter is back');
  assert.ok(!('stage' in x) && !('stageProgress' in x), 'the stage ladder is back');

  let s = x;
  while (s.status === 'building') s = reduce(a.game, s, { type: 'autoPlay' });
  assert.ok(!('assisted' in s.pending), 'the announcement records that the app helped');
  const after = reduce(a.game, s, { type: 'advance' });
  assert.equal(after.album.length, 1, 'it is still his word, and it is in the album');
});

test('G6 — left alone, the app finds a word by itself, every time, from any prefix', () => {
  const { game } = viGame();
  for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
    let s = createSession(game, { seed });
    let guard = 0;
    while (s.status === 'building') {
      s = reduce(game, s, { type: 'autoPlay' });
      assert.ok(guard++ < 8, `the ladder did not reach a word from seed ${seed}`);
    }
    assert.ok(s.pending.text.length > 0);
  }
});

test('M3 / M2 — the parts hint returns the identical state and speaks only the parts', () => {
  const { game, state } = viGame();
  const two = tap(game, tap(game, state, 'm'), 'eo');
  assert.equal(reduce(game, two, { type: 'partsHint' }), two);
  const steps = partsHintSteps(game, two);
  assert.deepEqual(steps.map((s) => s.step), ['onset', 'rime']);
  assert.ok(!steps.some((s) => s.step === 'word'), 'the hint spoke a completion');

  // D9 / N14 — in English the hint is **the only place the `long` clips are heard**.
  const en = start(enPack(), { seed: 'hint' });
  const ca = tap(en.game, tap(en.game, en.state, 'c'), 'a');
  const hint = partsHintSteps(en.game, ca);
  assert.deepEqual(hint.map((s) => s.audio.src),
    ['c', 'a'].map((id) => en.game.pack.tileById.letter[id].audio.long.src));
});

/* ------------------------------------------------- §H shelf, album, ending */

test('H2 / H3 — there is no stage, no level and no progress number anywhere in the state', () => {
  const { game, state } = viGame();
  const s = discover(game, state, MEO);
  for (const key of ['stage', 'globalStage', 'stageProgress', 'assists', 'level', 'score', 'streak']) {
    assert.ok(!(key in s), `the state carries "${key}"`);
  }
});

test('H5 / H6 — only a new word fills a slot', () => {
  const { game, state } = viGame();
  let s = discover(game, state, MEO);
  assert.equal(s.shelf.length, 1);
  s = discover(game, s, MEO);
  assert.equal(s.shelf.length, 1, 'a re-discovery filled a slot');
});

test('H7 / H8 — the fifth slot tips into the album, play does not resume, the shelf clears', () => {
  const { game } = viGame();
  let s = createSession(game, { seed: 'shelf' });
  const words = [];
  const eligible = game.tree.eligible.slice(0, SHELF_SLOTS);
  for (const w of eligible) {
    const syl = w.syllables[0];
    const path = syl.onset === null ? [syl.rime, syl.tone] : [syl.onset, syl.rime, syl.tone];
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

test('H4 — the album only grows, over a long run of play', () => {
  const { game } = viGame();
  let s = createSession(game, { seed: 'grow' });
  let size = 0;
  for (let i = 0; i < 40; i += 1) {
    if (s.phase === 'album') { s = reduce(game, s, { type: 'leaveAlbum' }); continue; }
    if (s.status === 'announcing') { s = reduce(game, s, { type: 'advance' }); } else {
      s = reduce(game, s, { type: 'autoPlay' });
    }
    assert.ok(s.album.length >= size, 'the album shrank');
    size = s.album.length;
  }
  assert.ok(size > 3, `only ${size} words were ever found`);
});

test('A18 — the album and the encounter counts survive a teardown, per pack', () => {
  // The language switch, at this layer: the session object is thrown away and a new one
  // is built from the same pack. His album must come back exactly as he left it,
  // **including the counts that choose which photograph he sees next** (B9).
  const { game, state } = viGame();
  let s = discover(game, state, MEO);
  s = discover(game, s, MEO);
  s = discover(game, s, ['b', 'o', 'huyen']);
  const saved = progressOf(s);
  assert.deepEqual(saved.albumIds, ['bo', 'meo']);
  assert.equal(saved.encounters.meo, 2);

  const rebuilt = createSession(createGame(viPack()), { seed: 'later', progress: saved });
  assert.deepEqual(rebuilt.album.map((e) => e.wordId), ['bo', 'meo']);
  assert.equal(rebuilt.encounters.meo, 2);
  assert.equal(rebuilt.discovered.meo, true);
  // A19 — the shelf is per session and does NOT come back.
  assert.deepEqual(rebuilt.shelf, []);
  // And the next `mèo` shows the photograph after the two he has seen.
  const next = tap(game, tap(game, tap(game, rebuilt, 'm'), 'eo'), 'huyen');
  assert.equal(next.pending.encounter, 2);
  assert.equal(next.pending.isNew, false);
});

test('A18 — a restored album is hostile input like everything else', () => {
  const game = createGame(viPack());
  const rubbish = createSession(game, {
    seed: 'x',
    progress: { albumIds: ['no-such-word', 'meo', 'meo', 42], encounters: { meo: 'lots', ghost: 3 } },
  });
  assert.deepEqual(rubbish.album.map((e) => e.wordId), ['meo'], 'a ghost word reached the album');
  assert.deepEqual(Object.keys(rubbish.encounters), [], 'a bad count was trusted');
  assert.deepEqual(checkInvariants(game, rubbish), []);
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

test('C1 / C20 — the Vietnamese strip is the word so far plus one dashed cell', () => {
  const { game, state } = viGame();
  // Empty: **one dashed cell**, and it is not a character (U14 — no tone cell, ever).
  assert.deepEqual(stripView(game, state).map((c) => [c.glyph, c.filled]), [[null, false]]);
  const one = tap(game, state, 'm');
  assert.deepEqual(stripView(game, one).map((c) => c.glyph), ['m', null]);
  const two = tap(game, one, 'eo');
  assert.deepEqual(stripView(game, two).map((c) => c.glyph), ['m', 'eo', null]);
  assert.deepEqual(stripView(game, two).map((c) => c.role), ['onset', 'rime', 'next']);
  // C20 — the tone merges the cells into one marked word, with no dashed cell left, and
  // the fact that a tone was chosen is carried by `toned` (a dotted role3 segment), never
  // by the tone's name.
  const three = tap(game, two, 'huyen');
  const strip = stripView(game, three);
  assert.equal(strip.length, 1);
  assert.equal(strip[0].glyph, 'mèo');
  assert.equal(strip[0].merged, true);
  assert.equal(strip[0].toned, true);
  assert.ok(!strip.some((c) => c.role === 'tone'), 'the tone cell is back');
});

test('C19 — a zero-onset word starts at the LEFT: no empty first cell', () => {
  const { game, state } = viGame();
  const s = tap(game, state, 'ao');
  assert.deepEqual(stripView(game, s).map((c) => [c.glyph, c.filled]), [['ao', true], [null, false]]);
  const done = tap(game, s, 'sac');
  assert.deepEqual(stripView(game, done).map((c) => c.glyph), ['áo']);
});

test('D2 / D3 — the English strip is what is placed plus one empty cell, never a length', () => {
  const { game, state } = start(enPack(), { seed: 'strip' });
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
    const { game, state } = start(load(), { seed: 'stuck' });
    const walk = (s, depth) => {
      assert.equal(isStuck(game, s), false, `stuck at ${s.prefix.join('+')}`);
      if (s.status === 'announcing' || depth > 6) return;
      for (const symbol of live(game, s)) walk(tap(game, s, symbol), depth + 1);
    };
    walk(state, 0);
  }
});
