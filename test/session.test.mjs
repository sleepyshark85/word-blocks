// The reducer. `(state, action) => state`, and every rule §E, §F, §G, §H and §V states.

import test from 'node:test';
import assert from 'node:assert/strict';

import { viPack, enPack } from './helpers/load.mjs';
import {
  createGame, createSession, reduce, tableView, pageView, stripView, shelfView, chantSteps,
  motifNotes, partsHintSteps, lastSymbol, undoAudio, tapAudio, imageFor, checkInvariants,
  isStuck, pageHasLive, progressOf, SHELF_SLOTS,
} from '../src/engine/index.mjs';
import {
  start, live, tap, undoStrip, undoAll, discover,
} from './helpers/play.mjs';
import { packWithADeadSymbol, phonePages, unknownSymbol } from './helpers/fixtures.mjs';

/**
 * **Revision 5: a word is letters and then a tone.** `mèo` is `m` `e` `o` huyền — four
 * taps for a two-sound word — where revision 4 spelled it `m` `eo` huyền in three. The
 * model did not change: `eo` is still one vần, it is now reached with two taps
 * (`literacy-vi.md` §0.3).
 */
const MEO = ['m', 'e', 'o', 'huyen'];

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
  // After `m` the live set is the letters that can follow it in a word — every one of
  // them a **vowel**, because a Vietnamese rime begins with one and `m` is not a
  // branching onset (`literacy-vi.md` §0.5, §0.6).
  assert.deepEqual(live(game, after), ['ă', 'â', 'e', 'u', 'ư']);
  assert.ok(live(game, after).every((id) => !game.pack.tileById.tone[id]),
    'a tone stood up before a rime was complete');
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

test('D4 / E8 / E10 — undo is the STRIP, and it returns exactly one symbol', () => {
  // **RESTATED in revision 5, on geometry** (`ui.md` §7.2.6, §0D): five 72 pt cells need
  // 392 pt and the 360 dp floor has 328, so a per-cell motor target is impossible. One
  // tap takes the last symbol back; tapping again takes the one before it.
  const { game, state } = viGame();
  const two = tap(game, tap(game, state, 'm'), 'e');
  assert.deepEqual(two.prefix, ['m', 'e']);
  const undone = undoStrip(game, two);
  assert.deepEqual(undone.prefix, ['m'], 'undo took back more than one symbol');
  // Recomputed, not restored from a cache that can drift: identical to walking there.
  assert.deepEqual(live(game, undone), live(game, tap(game, state, 'm')));
  assert.deepEqual(undoStrip(game, undone).prefix, []);
});

test('E9 / C11 — n taps empty a strip of n symbols, one at a time, and nothing else', () => {
  const { game, state } = viGame();
  let s = state;
  for (const symbol of MEO) s = tap(game, s, symbol);
  s = reduce(game, s, { type: 'advance' });
  s = tap(game, tap(game, tap(game, s, 'c'), 'h'), 'o');
  assert.deepEqual(s.prefix, ['c', 'h', 'o']);
  const sizes = [];
  while (s.prefix.length > 0) {
    s = undoStrip(game, s);
    sizes.push(s.prefix.length);
  }
  assert.deepEqual(sizes, [2, 1, 0], 'the strip did not empty one symbol at a time');
  assert.deepEqual(live(game, s), live(game, state));
});

test('T20 / X35 — tapping an empty strip does nothing at all, not even a touch', () => {
  const { game, state } = viGame();
  assert.equal(undoStrip(game, state), state);
  assert.equal(undoStrip(game, undoStrip(game, state)), state);
});

test('E8 / C11 — an undo speaks the clip of WHAT IS LEFT, not of what was taken', () => {
  // The rule, and the reason it is not obvious: undoing `h` from `c h` says **`cờ`**,
  // because the unit he is building now is `c`. `chó` empties as `cho` · `chờ` · `cờ` ·
  // nothing — C11, named clip by clip.
  const { game, state } = viGame();
  const pack = game.pack;
  let s = tap(game, tap(game, tap(game, tap(game, state, 'c'), 'h'), 'o'), 'sac');
  assert.equal(s.status, 'announcing');
  s = { ...s, status: 'building', pending: null }; // the undo path, without the ceremony
  const heard = [];
  while (s.prefix.length > 0) {
    const clip = undoAudio(game, s);
    heard.push(clip === null ? null : clip.short.src);
    s = undoStrip(game, s);
  }
  assert.deepEqual(heard, [
    pack.wordById.cho.audio.blend.src, // `cho` — the whole toneless syllable
    pack.unitAudio.onset.ch.short.src, // `chờ`
    pack.unitAudio.onset.c.short.src, // `cờ`  — never `hờ`
    null, // and taking the last letter back leaves nothing to say
  ]);
  assert.notEqual(heard[1], pack.unitAudio.onset.h.short.src, 'undo said `hờ`');
  assert.equal(undoAudio(game, s), null, 'an empty strip still had something to say');
});

test('lastSymbol names what flies home, and it is always the last one', () => {
  const { game, state } = viGame();
  const two = tap(game, tap(game, state, 'm'), 'e');
  assert.equal(lastSymbol(game, two).id, 'e');
  assert.equal(lastSymbol(game, undoStrip(game, two)).id, 'm');
  assert.equal(lastSymbol(game, state), null);
});

test('E15 / E16 / C4a / C4b — a tap speaks the unit it builds, and supersedes', () => {
  const { game, state } = viGame();
  const pack = game.pack;
  const said = (st, id) => tapAudio(game, st, id).short.src;
  // `c` says `cờ`; `h` after it says `chờ` — never `hờ`, and never both.
  assert.equal(said(state, 'c'), pack.unitAudio.onset.c.short.src);
  const c = tap(game, state, 'c');
  assert.equal(said(c, 'h'), pack.unitAudio.onset.ch.short.src);
  assert.notEqual(said(c, 'h'), pack.unitAudio.onset.h.short.src);
  // **The whole of `literacy-vi.md` §0.9's table**, walked through reachable prefixes
  // only — a prefix a tap cannot produce is not a state the app can be in.
  let checked = 0;
  for (const [prefix, letter, unit] of [
    [['c'], 'h', 'ch'], [['g'], 'h', 'gh'], [['g'], 'i', 'gi'], [['k'], 'h', 'kh'],
    [['n'], 'g', 'ng'], [['n'], 'h', 'nh'], [['n', 'g'], 'h', 'ngh'],
    [['q'], 'u', 'qu'], [['t'], 'h', 'th'], [['t'], 'r', 'tr'],
  ]) {
    let st = state;
    for (const sym of prefix) st = tap(game, st, sym);
    assert.equal(said(st, letter), pack.unitAudio.onset[unit].short.src,
      `${prefix.join('')} + ${letter} did not say ${unit}`);
    checked += 1;
  }
  assert.equal(checked, 10, 'the digraph table stopped being walked');
  // E16 — a **flat** letter answers on the same rule. `ngh` leads to no seed word, so
  // `h` after `n` `g` is flat, and it still says `ngờ` rather than `hờ` (C18).
  const ng = tap(game, tap(game, state, 'n'), 'g');
  assert.equal(live(game, ng).includes('h'), false, 'the pack grew an `ngh` word');
  assert.equal(said(ng, 'h'), pack.unitAudio.onset.ngh.short.src);

  // **`p` is the onset state that is not an onset** (`literacy-vi.md` §0.6): bare `p` is
  // never a Vietnamese onset, so it lives only in `prefixAudio`, and it says `pờ`. It is
  // flat on today's board because its one word — `phở` — has no photograph yet, which is
  // a content state and not a board defect.
  assert.equal(live(game, state).includes('p'), false);
  assert.equal(said(state, 'p'), pack.unitAudio.onset.p.short.src);
  assert.equal(Boolean(pack.tileById.onset.p), false, 'bare `p` became a tile');

  // The rime half is the same rule: a pass-through prefix speaks itself (`literacy-vi.md`
  // §0.7, §0.12), which is what the nine new clips are for.
  const tr = tap(game, tap(game, state, 't'), 'r');
  assert.equal(said(tr, 'ă'), pack.unitAudio.rime['ă'].short.src);
  const tra = tap(game, tr, 'ă');
  assert.equal(said(tra, 'n'), pack.unitAudio.rime['ăn'].short.src);
  const tran = tap(game, tra, 'n');
  assert.equal(said(tran, 'g'), pack.unitAudio.rime['ăng'].short.src);
});

test('D1e / D19 — English supersedes too, and casing reaches no clip', () => {
  const { game, state } = start(enPack(), { seed: 'digraph' });
  const pack = game.pack;
  const said = (st, id) => tapAudio(game, st, id).short.src;
  assert.equal(said(state, 's'), pack.tileById.letter.s.audio.short.src);
  const s1 = tap(game, state, 's');
  assert.equal(said(s1, 'h'), pack.tileById.letter.sh.audio.short.src, '`s` then `h` must say /ʃ/');
  assert.notEqual(said(s1, 'h'), pack.tileById.letter.h.audio.short.src);
  // `c`+`k` says /k/ again — the same sound, which is the lesson — and `g`+`g` says /ɡ/
  // once rather than twice.
  const duc = tap(game, tap(game, tap(game, state, 'd'), 'u'), 'c');
  assert.equal(said(duc, 'k'), pack.tileById.letter.ck.audio.short.src);
  const eg = tap(game, tap(game, state, 'e'), 'g');
  assert.equal(said(eg, 'g'), pack.tileById.letter.gg.audio.short.src);
  // D19 — the clip is keyed on the stored lowercase letter, so uppercase glyphs cannot
  // reach it. `A` says /æ/.
  assert.equal(said(state, 'a'), pack.tileById.letter.a.audio.short.src);
  assert.equal(game.pack.inventoryOrder.letter.every((id) => id === id.toLowerCase()), true);
});

test('T17 — tap and undo fifty times and nothing leaks', () => {
  const { game, state } = viPhone();
  let s = state;
  for (let i = 0; i < 50; i += 1) s = undoStrip(game, tap(game, s, 'm'));
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
  // English on a small phone: the alphabet is two pages, `a`–`m` and `n`–`z`. After `c`
  // the live set still includes `a`, so the board must not move under his finger.
  const game = createGame(pack, { pages: phonePages('en') });
  const state = createSession(game, { seed: 'v12' });
  assert.equal(state.page, 0);
  const after = tap(game, state, 'c');
  assert.equal(after.page, 0, 'the board moved while page 1 still had live letters');
  assert.equal(after.pageSeq, state.pageSeq, 'a slide was announced that should not happen');
  assert.ok(pageHasLive(game, after));
});

test('V13 / P6d — a seat that empties his page slides to the LOWEST page that has something', () => {
  const { game, state } = viPhone();
  // **The pages are `a`…`m`, `n`…`y`, and the six tones** — 15, 14, 6 (P6d). `m` and `e`
  // are both on page 0, so seating `m` moves nothing; seating `e` leaves only `o` live,
  // which lives on page 1, so the board slides there and says who did it.
  const one = tap(game, state, 'm');
  assert.equal(one.page, 0, 'the board moved while page 0 still had live letters');
  const two = tap(game, one, 'e');
  assert.deepEqual(live(game, two), ['o']);
  assert.equal(two.page, 1);
  assert.equal(two.pageBy, 'auto');
  assert.equal(two.pageSeq, one.pageSeq + 1);
  // And once the rime is complete, only a tone is live, which is page 2.
  const tone = tap(game, two, 'o');
  assert.equal(tone.page, 2);
  assert.equal(tone.pageBy, 'auto');
});

test('V22a — after `t`, page 0 stands up, because the `h` that completes `th` lives there', () => {
  // The measured cost of the 15/14 split, reported rather than buried (`ui.md` §0C):
  // `nh`, `ng`, `ph` and `th` are cross-page digraphs. The rail is the object that
  // answers it, and this is the criterion that says so.
  const { game, state } = viPhone();
  const t = tap(game, state, 't');
  assert.equal(game.inventory.pageOf('t'), 1);
  assert.equal(game.inventory.pageOf('h'), 0);
  assert.ok(live(game, t).includes('h'), '`th` lost its words');
  assert.equal(pageView(game, t).buttons[0].live, true, 'page 0 is flat while `h` is live on it');
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

test('V23 / E14 — an undo returns the last symbol AND slides to that symbol\'s page', () => {
  const { game, state } = viPhone();
  const three = tap(game, tap(game, tap(game, state, 'm'), 'e'), 'o');
  // Completing the rime put him on the tone page (V13), two pages from where `o` lives.
  assert.equal(three.page, game.inventory.pageOf('ngang'));
  const back = undoStrip(game, three);
  assert.deepEqual(back.prefix, ['m', 'e']);
  assert.equal(back.page, game.inventory.pageOf('o'), 'undo is also the way back');
  // And on to the beginning, one symbol and one slide at a time.
  const empty = undoAll(game, back);
  assert.deepEqual(empty.prefix, []);
  assert.equal(empty.page, game.inventory.pageOf('m'));
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
  const two = tap(game, tap(game, tap(game, state, 'm'), 'e'), 'o');
  assert.equal(two.status, 'building');
  const done = tap(game, two, 'huyen');
  assert.equal(done.status, 'announcing');
  assert.equal(done.pending.text, 'mèo');
  assert.equal(done.pending.isNew, true);
});

test('V25 — the board does not auto-advance while the announcement is running', () => {
  const { game, state } = viPhone();
  let done = state;
  for (const symbol of MEO) done = tap(game, done, symbol);
  assert.equal(done.status, 'announcing');
  assert.equal(done.page, 2, 'the tone page is where he was, and it must stay there');
  const after = reduce(game, done, { type: 'advance' });
  assert.equal(after.page, 0, 'the board settles when the announcement ends, not during it');
});

test('F4 / F5 — four notes and the full chant when new; three and the word alone after', () => {
  const { game, state } = viGame();
  let first = state;
  for (const symbol of MEO) first = tap(game, first, symbol);
  assert.equal(motifNotes(first), 4);
  assert.deepEqual(chantSteps(game, first).map((s) => s.step),
    ['onset', 'rime', 'blend', 'tone', 'word']);

  let again = reduce(game, first, { type: 'advance' });
  for (const symbol of MEO) again = tap(game, again, symbol);
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

test('C12e / U38 — a chant beat lights a SPAN: `chó` is four taps and still five beats', () => {
  // **The beat count is a property of the model, not of the taps** (`ui.md` §10.4). Beat
  // 1 lights `c` AND `h` together, because they are one sound; beat 2 lights `o`.
  const { game, state } = viGame();
  const cho = tap(game, tap(game, tap(game, tap(game, state, 'c'), 'h'), 'o'), 'sac');
  const beats = chantSteps(game, cho);
  assert.deepEqual(beats.map((b) => b.step), ['onset', 'rime', 'blend', 'tone', 'word']);
  assert.deepEqual(beats.map((b) => b.cells.map((c) => c.glyph)),
    [['c', 'h'], ['c', 'h', 'o'], ['cho'], ['chó'], ['chó']]);
  assert.deepEqual(beats[0].spanLit, [0, 1], 'beat 1 must light the whole onset span');
  assert.deepEqual(beats[0].lit, [0, 1]);
  assert.deepEqual(beats[1].spanLit, [2], 'beat 2 lights the rime span');
  assert.deepEqual(beats[1].lit, [0, 1, 2], 'what is lit accumulates');
  // `chuối` — five letters, still five beats: beat 1 lights two cells, beat 2 lights three.
  let chuoi = state;
  for (const symbol of ['c', 'h', 'u', 'ô', 'i', 'sac']) chuoi = tap(game, chuoi, symbol);
  const five = chantSteps(game, chuoi);
  assert.equal(five.length, 5);
  assert.deepEqual(five[0].spanLit, [0, 1]);
  assert.deepEqual(five[1].spanLit, [2, 3, 4]);
});

test('C12 / C19 — the tone beat is omitted for `ngang`, the onset beat for a zero onset', () => {
  const { game, state } = viGame();
  // `áo` = `a` `o` sắc — **three** taps in revision 5, and its two letters are one span
  // from the first tap, so beat 2 lights both (`ui.md` §10.4).
  const zero = tap(game, tap(game, tap(game, state, 'a'), 'o'), 'sac');
  assert.equal(zero.status, 'announcing');
  assert.deepEqual(chantSteps(game, zero).map((s) => s.step), ['rime', 'blend', 'tone', 'word']);
  assert.deepEqual(chantSteps(game, zero).map((s) => s.cells.map((c) => c.glyph)),
    [['a', 'o'], ['ao'], ['áo'], ['áo']]);
  assert.deepEqual(chantSteps(game, zero)[0].spanLit, [0, 1]);

  const ngang = tap(game, tap(game, tap(game, tap(game, state, 'c'), 'a'), 'm'), 'ngang');
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

test('D10 / U38 — the English chant is one beat per SOUND, then the whole word', () => {
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

  // **`ship` is four taps and three beats, and beat 1 lights `s` and `h` together** —
  // the same rule as `chó`, stated once and applied twice (`ui.md` §10.4).
  let ship = state;
  for (const letter of ['s', 'h', 'i', 'p']) ship = tap(game, ship, letter);
  const sb = chantSteps(game, ship);
  assert.deepEqual(sb.map((b) => b.step), ['tile', 'tile', 'tile', 'word']);
  assert.deepEqual(sb.map((b) => b.caption), ['sh', 'i', 'p', 'ship']);
  assert.deepEqual(sb[0].spanLit, [0, 1]);
  assert.deepEqual(sb[0].cells.map((c) => c.glyph), ['s', 'h']);
  assert.equal(sb[0].audio.src, pack.tileById.letter.sh.audio.short.src);
  // `egg` — beat 2 lights both `g`s, one sound, not two.
  let egg = state;
  for (const letter of ['e', 'g', 'g']) egg = tap(game, egg, letter);
  const eb = chantSteps(game, egg);
  assert.deepEqual(eb.map((b) => b.caption), ['e', 'gg', 'egg']);
  assert.deepEqual(eb[1].spanLit, [1, 2]);
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
    for (const symbol of MEO) s = tap(game, s, symbol);
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
  let done = state;
  for (const symbol of MEO) done = tap(game, done, symbol);
  assert.equal(done.pending.continues, false);
  assert.deepEqual(reduce(game, done, { type: 'advance' }).prefix, []);
});

test('F15 / F16 — a prefix word announces in full, keeps the strip, and can still be undone', () => {
  // `en-seed` has no prefix pair today, so one is made: a pack whose words are `ca` and
  // `cat`. The rule exists because his mother will add `he`, `be` and `at`.
  const base = enPack();
  const cat = base.words.find((w) => w.id === 'cat');
  const ca = {
    ...cat,
    id: 'ca',
    text: 'ca',
    tiles: ['c', 'a'],
    letters: ['c', 'a'],
    spans: cat.spans.slice(0, 2),
  };
  const pack = { ...base, words: [ca, cat], wordById: { ca, cat } };
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
  assert.deepEqual(undoAll(game, after).prefix, []);
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
  const two = tap(game, tap(game, tap(game, state, 'm'), 'e'), 'o');
  assert.equal(reduce(game, two, { type: 'partsHint' }), two);
  const steps = partsHintSteps(game, two);
  assert.deepEqual(steps.map((s) => s.step), ['onset', 'rime']);
  assert.ok(!steps.some((s) => s.step === 'word'), 'the hint spoke a completion');
  // **The parts are the SOUNDS, not the letters**: `c h o` is two parts, not three.
  const cho = tap(game, tap(game, tap(game, state, 'c'), 'h'), 'o');
  const parts = partsHintSteps(game, cho);
  assert.deepEqual(parts.map((x) => x.caption), ['ch', 'o']);
  assert.deepEqual(parts.map((x) => x.lit), [[0, 1], [2]]);

  // D9 / N14 — in English the hint is **the only place the `long` clips are heard**.
  const en = start(enPack(), { seed: 'hint' });
  const ca = tap(en.game, tap(en.game, en.state, 'c'), 'a');
  const hint = partsHintSteps(en.game, ca);
  assert.deepEqual(hint.map((s) => s.audio.src),
    ['c', 'a'].map((id) => en.game.pack.tileById.letter[id].audio.long.src));
  // `s h` is ONE part, and its `long` clip is the digraph's (`literacy-en.md` §0.9).
  const sh = tap(en.game, tap(en.game, en.state, 's'), 'h');
  assert.deepEqual(partsHintSteps(en.game, sh).map((x) => x.caption), ['sh']);
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
    // The path is the word's letters and then its tone — `pathFor`, spelled out here so
    // the test knows what a tap sequence is rather than borrowing the engine's opinion.
    const path = [...w.letters, w.syllables[0].tone];
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
  let next = rebuilt;
  for (const symbol of MEO) next = tap(game, next, symbol);
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

test('C1 / C20 / X10 / X11 — the Vietnamese strip: one cell per letter, one bar per sound', () => {
  const { game, state } = viGame();
  // Empty: **one dashed cell**, and it is not a character (U14 — no tone cell, ever).
  assert.deepEqual(stripView(game, state).map((c) => [c.glyph, c.filled]), [[null, false]]);
  const c = tap(game, state, 'c');
  assert.deepEqual(stripView(game, c).map((x) => x.glyph), ['c', null]);

  // **X11 — `c` and `h` never become a `ch` cell.** Two cells, one span, one bar.
  const ch = tap(game, c, 'h');
  const two = stripView(game, ch);
  assert.deepEqual(two.map((x) => x.glyph), ['c', 'h', null]);
  assert.deepEqual(two.slice(0, 2).map((x) => x.span), [0, 0], 'the letters of `ch` are two spans');
  assert.deepEqual(two.slice(0, 2).map((x) => x.spanRole), ['role1', 'role1']);
  assert.equal(two.some((x) => x.merged), false, 'a cell merged while he was building');
  assert.deepEqual(two.map((x) => x.dividerBefore), [false, false, false],
    'X25 — a divider inside one sound');

  // **X20 / X24 — the boundary: the bar breaks, changes pattern, and a divider appears.**
  const cho = tap(game, ch, 'o');
  const three = stripView(game, cho);
  assert.deepEqual(three.map((x) => x.span), [0, 0, 1]);
  assert.deepEqual(three.map((x) => x.spanRole), ['role1', 'role1', 'role2']);
  assert.deepEqual(three.map((x) => x.dividerBefore), [false, false, true]);
  assert.equal(three.filter((x) => x.dividerBefore).length, 1, 'Vietnamese has exactly one');

  // C20 / X30 — the mark lands ON the carrier vowel, the cells stay separate, and no
  // dashed cell is left. That a tone was chosen is carried by `toned` — a dotted role3
  // segment — never by the tone's name.
  const done = tap(game, cho, 'sac');
  const strip = stripView(game, done);
  assert.deepEqual(strip.map((x) => x.glyph), ['c', 'h', 'ó']);
  assert.deepEqual(strip.map((x) => x.toned), [false, false, true]);
  assert.equal(strip.some((x) => x.merged), false, 'the strip merged before the chant');
  assert.equal(strip.some((x) => x.markSlot), false, 'X30 — an affordance survived the word');
  assert.ok(!strip.some((x) => x.role === 'tone'), 'the tone cell is back');
});

test('C4c / X17 — `gi` and `qu` join the ONSET span, which no letter rule could know', () => {
  // **This is the test that makes "the boundary is stored" mean something at runtime.**
  // `literacy-vi.md` §0.5: every rime begins with a vowel letter *except* after `gi` and
  // `qu`, the only two onsets containing one. A board that derived the boundary from the
  // letters — "the first vowel starts the rime" — would draw `g` ┃ `i` and `q` ┃ `u`, and
  // it would be wrong about both, so the strip is where the stored parse is visible.
  const { game, state } = viGame();
  for (const [first, second, unit] of [['g', 'i', 'gi'], ['q', 'u', 'qu']]) {
    const cells = stripView(game, tap(game, tap(game, state, first), second));
    assert.deepEqual(cells.slice(0, 2).map((c) => c.glyph), [first, second]);
    assert.deepEqual(cells.slice(0, 2).map((c) => c.span), [0, 0],
      `${unit}: the vowel started a new span — the boundary was derived, not read`);
    assert.deepEqual(cells.slice(0, 2).map((c) => c.spanRole), ['role1', 'role1'],
      `${unit}: the span is not the consonant's solid bar`);
    assert.equal(cells.some((c) => c.dividerBefore), false, `${unit}: a divider was drawn`);
  }
  // And the tile on the TABLE stays vowel-coloured, because it is a vowel letter: the
  // table colours the letter, the strip colours the job that letter took (`ui.md` §5.5).
  for (const id of ['i', 'u']) {
    assert.equal(tableView(game, state).cells.find((c) => c.id === id).kind, 'vowel');
  }
  // The contrast case: after a consonant onset, a vowel DOES start a new span.
  const cho = stripView(game, tap(game, tap(game, state, 'c'), 'a'));
  assert.deepEqual(cho.slice(0, 2).map((c) => c.span), [0, 1]);
  assert.equal(cho[1].dividerBefore, true);
});

test('X27 / X28 / X29 — two ways something can be missing, and the fork', () => {
  const { game, state } = viGame();
  // A letter can follow: a dashed next-cell, and no mark-slot.
  const c = stripView(game, tap(game, state, 'c'));
  assert.equal(c[c.length - 1].filled, false, 'no dashed cell where a letter can follow');
  assert.equal(c.some((x) => x.markSlot), false);

  // **The three forks measured against the real pack** (`literacy-vi.md` §0.7): at `b`+`o`,
  // `c`+`a` and `m`+`u` a letter and a tone are live at once, and BOTH affordances are
  // drawn — a dashed next-cell and a dashed mark-slot above the carrier vowel.
  for (const [first, second] of [['b', 'o'], ['c', 'a'], ['m', 'u']]) {
    const fork = tap(game, tap(game, state, first), second);
    const cells = stripView(game, fork);
    assert.equal(cells.some((x) => x.markSlot), true, `${first}+${second}: no mark-slot`);
    assert.equal(cells[cells.length - 1].filled, false, `${first}+${second}: no dashed cell`);
    assert.equal(cells.filter((x) => x.markSlot).length, 1, 'more than one carrier');
  }

  // X25 — a pass-through rime prefix is the other case: a dashed cell and NO mark-slot,
  // because no tone can ever sit on `ăn`.
  let tran = state;
  for (const letter of ['t', 'r', 'ă', 'n']) tran = tap(game, tran, letter);
  const passing = stripView(game, tran);
  assert.equal(passing.some((x) => x.markSlot), false, 'a tone was offered on `ăn`');
  assert.equal(passing[passing.length - 1].filled, false);
});

test('C19 / X24 — a zero-onset word starts at the LEFT and draws no divider at all', () => {
  const { game, state } = viGame();
  const a = tap(game, state, 'a');
  assert.deepEqual(stripView(game, a).map((c) => [c.glyph, c.filled]), [['a', true], [null, false]]);
  const ao = tap(game, a, 'o');
  const cells = stripView(game, ao);
  assert.deepEqual(cells.map((c) => c.glyph), ['a', 'o']);
  assert.deepEqual(cells.map((c) => c.span), [0, 0], '`ao` is one span from the first tap');
  assert.equal(cells.some((c) => c.dividerBefore), false, 'X24 — there is no onset to divide from');
  const done = tap(game, ao, 'sac');
  assert.deepEqual(stripView(game, done).map((c) => c.glyph), ['á', 'o']);
});

test('D2 / D3 / X19 — the English strip marks EVERY sound boundary', () => {
  const { game, state } = start(enPack(), { seed: 'strip' });
  assert.equal(stripView(game, state).length, 1);
  const one = tap(game, state, 'c');
  assert.equal(stripView(game, one).length, 2);
  assert.deepEqual(stripView(game, one).map((c) => c.filled), [true, false]);
  const two = tap(game, one, 'a');
  assert.equal(stripView(game, two).length, 3);
  assert.equal(stripView(game, two).some((c) => c.markSlot), false, 'X31 — a mark-slot in English');

  // `ship` is `s h` (one span) `i` (new) `p` (new): four cells, three spans, TWO dividers
  // — where Vietnamese carries exactly one.
  let ship = state;
  for (const letter of ['s', 'h', 'i', 'p']) ship = tap(game, ship, letter);
  const cells = stripView(game, ship);
  assert.deepEqual(cells.map((c) => c.glyph), ['s', 'h', 'i', 'p']);
  assert.deepEqual(cells.map((c) => c.span), [0, 0, 1, 2]);
  assert.deepEqual(cells.map((c) => c.dividerBefore), [false, false, true, true]);
});

test('X6 — every word in both packs fits the six-cell strip', () => {
  for (const load of [viPack, enPack]) {
    const pack = load();
    for (const word of pack.words) {
      assert.ok(word.letters.length <= 6,
        `${pack.language}: "${word.text}" is ${word.letters.length} letters`);
    }
  }
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
