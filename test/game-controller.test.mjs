// The state layer, driven headlessly.
//
// Every timer in this app lives in `src/state/gameController.mjs`, and this is where the
// clock is fake and the assertions are about *when*. `acceptance-criteria.md` §F (the
// announcement and the reveal), §G (the idle ladder), §N (the audio rules), §O (motion
// timings) and §T (what a toddler actually does) are wall-clock criteria; the engine
// cannot hold them and a renderer cannot prove them.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createGameController, planAnnouncement, stepDurationMs,
} from '../src/state/gameController.mjs';
import { createGame, tableView, tapAudio } from '../src/engine/index.mjs';
import { createChannels, createPlayerBudget, MAX_PLAYERS } from '../src/audio/channels.mjs';
import { REVEAL, LADDER, HOLD, TAP, M, MOTIF } from '../src/motion/durations.mjs';
import { viPack, enPack } from './helpers/load.mjs';
import { createFakeClock, createFakeAudio, identityMedia } from './helpers/harness.mjs';
import { packWithADeadSymbol, phonePages } from './helpers/fixtures.mjs';

const SETTINGS = { showWord: true, mute: false, rate: 1, saySentence: true, reduceMotion: false };

/** The bundled non-speech sounds, as opaque handles the double can recognise. */
const UI = {
  motif3: 'ui:motif3',
  motif4: 'ui:motif4',
  cheer: null,
  seat: 'ui:seat',
  knock: 'ui:knock',
  unclick: 'ui:unclick',
  page: 'ui:page',
  shelfBell: 'ui:shelfBell',
  shelfTip: 'ui:shelfTip',
};

function rig(pack, over = {}) {
  const clock = createFakeClock();
  const audio = createFakeAudio();
  // `pages: null` is the tablet — one page, no rail. Pass `pages` for the owner's phone.
  const game = over.game ?? createGame(pack, { pages: over.pages ?? null });
  const ctl = createGameController({
    game,
    seed: over.seed ?? 'controller',
    mediaSource: identityMedia,
    ui: { ...UI, ...(over.ui ?? {}) },
    audio,
    settings: { ...SETTINGS, ...(over.settings ?? {}) },
    timers: clock.timers,
    now: clock.now,
    onSessionEnd: over.onSessionEnd,
    progress: over.progress,
    onProgress: over.onProgress,
  });
  return { ctl, clock, audio, game, pack: game.pack };
}

/** The owner's board: Vietnamese across three pages, 28 cells each (AC V3). */
function phoneRig(over = {}) {
  return rig(viPack(), { ...over, pages: phonePages('vi') });
}

/**
 * A rig whose board is **guaranteed** to show a flat tile beside a live one, whatever the
 * shipped content happens to look like (`helpers/fixtures.mjs`). Every assertion about
 * what a flat tile does needs one, and finding one in the seed pack is how seven tests
 * quietly stopped meaning anything when the inventory order improved.
 */
function rigWithAFlatTile(over = {}) {
  const fixture = packWithADeadSymbol('vi', over.pages ?? null);
  const r = rig(fixture.pack, { ...over, game: fixture.game });
  return { ...r, deadId: fixture.deadId, liveId: fixture.liveId };
}

/** Tap a symbol the way a finger does: down, then up, in the same place. */
function tap(r, symbolId) {
  r.ctl.symbolDown(symbolId, 10, 10);
  r.ctl.symbolUp(symbolId, 10, 10);
}

/**
 * Build the word `mèo`, which every Vietnamese assertion here uses. **Revision 5: four
 * taps, not three** — `m` `e` `o` and the huyền. The model is unchanged; `eo` is still
 * one vần, reached with two taps (`literacy-vi.md` §0.3).
 */
const MEO = ['m', 'e', 'o', 'huyen'];
function buildMeo(r) {
  for (const symbol of MEO) tap(r, symbol);
}

/* --------------------------------------------------------------- pure helpers */

test('stepDurationMs is the clip plus its stated gap, and a beat with no clip is its gap', () => {
  assert.equal(stepDurationMs({ audio: { ms: 400 }, gapAfterMs: 250 }), 650);
  assert.equal(stepDurationMs({ audio: { ms: null }, gapAfterMs: 0 }), 700);
  // A pack with no blend recording must not spend 700 ms of silence pretending to speak;
  // the beat is still shown (the merge), and it costs only its gap (`ui.md` §10.4).
  assert.equal(stepDurationMs({ audio: null, gapAfterMs: 400 }), 400);
});

test('planAnnouncement puts the whole word on the reveal, not at the end of the chant', () => {
  const plan = planAnnouncement([
    { step: 'onset', audio: { ms: 300 }, gapAfterMs: 250 },
    { step: 'rime', audio: { ms: 300 }, gapAfterMs: 250 },
    { step: 'word', audio: { ms: 500 }, gapAfterMs: 600 },
    { step: 'sentence', audio: { ms: 900 }, gapAfterMs: 0 },
  ]);
  assert.deepEqual(plan.timeline.map((e) => e.step.step), ['onset', 'rime']);
  assert.equal(plan.chantMs, 1100);
  assert.equal(plan.word.step, 'word');
  assert.equal(plan.sentence.step, 'sentence');
});

/* ------------------------------------------------------------------ §N audio */

test('N1 — the tile sound fires on touch-DOWN, before touch-up', () => {
  const r = rig(viPack());
  r.audio.drain();
  r.ctl.symbolDown('m', 10, 10);
  const onDown = r.audio.drain();
  assert.equal(onDown.length, 1);
  assert.equal(onDown[0].ch, 'speech');
  r.ctl.symbolUp('m', 10, 10);
});

test('E2 — the knock PRECEDES the letter by 120 ms, and they never overlap', () => {
  // **RESTATED in revision 3, and this is the inverse of revision 2's E2.** The knock and
  // the clip used to sound together, which is one of the three things that made "voices
  // mixed up with each other" (`ui.md` §11.0 item 3). Now: a 40 ms muted knock at −9 dB
  // within 60 ms, then the tile's own `short` clip **in full** at +120 ms.
  const r = rigWithAFlatTile();
  r.audio.drain();
  r.ctl.symbolDown(r.deadId, 10, 10);
  const immediate = r.audio.drain();
  assert.equal(immediate.length, 1, 'something else sounded with the knock');
  assert.equal(immediate[0].ch, 'ui');
  assert.equal(immediate[0].source, UI.knock);
  assert.equal(immediate[0].db, -9);

  r.clock.advance(M.flatClipAfter - 1);
  assert.deepEqual(r.audio.drain(), [], 'the letter arrived before +120 ms');
  r.clock.advance(2);
  const letter = r.audio.drain();
  assert.equal(letter.length, 1);
  assert.equal(letter[0].ch, 'speech', 'the flat tile did not speak its own clip');

  r.ctl.symbolUp(r.deadId, 10, 10);
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, [], 'a flat tile seated');
  assert.ok(!r.audio.drain().some((e) => e.source === UI.seat), 'a flat tap fired a seat click');
});

test('E1 — a live tap plays the clip, seats, and fires a seat click', () => {
  const r = rig(viPack());
  r.audio.drain();
  tap(r, 'm');
  const log = r.audio.drain();
  assert.equal(log[0].ch, 'speech');
  assert.ok(log.some((e) => e.ch === 'ui' && e.source === UI.seat), 'no seat click');
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, ['m']);
});

test('E13 — twenty taps on a flat tile play twenty clips and change nothing', () => {
  const r = rigWithAFlatTile();
  r.audio.drain();
  for (let i = 0; i < 20; i += 1) {
    tap(r, r.deadId);
    r.clock.advance(M.flatClipAfter + 1);
  }
  const log = r.audio.drain();
  assert.equal(log.filter((e) => e.ch === 'speech').length, 20);
  assert.equal(log.filter((e) => e.source === UI.knock).length, 20);
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, []);
  // Nothing was queued or delayed: after the taps the bag holds no pending clip timer.
  assert.ok(!r.clock.timers.has('hold'));
});

test('N13 / B2f — there is no ∅ tile and no open sound; a vowel word starts on the vowel', () => {
  // **The inverse of revision 2's N13** (§W3). *"The toddle just need to pick the vowel,
  // not the `.` character."*
  const r = rig(viPack());
  assert.ok(!r.ctl.getSnapshot().table.cells.some((c) => c.id === '∅'), 'the socket is back');
  assert.ok(!('socket' in UI) || UI.socket === undefined, 'the open sound is still bundled');
  r.audio.drain();
  tap(r, '∅');
  assert.deepEqual(r.audio.drain(), [], 'tapping a tile that does not exist made a sound');
  // `áo` = `a` `o` sắc: three taps, and the first one is a vowel LETTER (C19).
  tap(r, 'a');
  tap(r, 'o');
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, ['a', 'o']);
  tap(r, 'sac');
  assert.equal(r.ctl.getSnapshot().pending.text, 'áo');
});

test('N5 / N6 — a hold repeats the short clip 6 times and then stops; nothing is placed', () => {
  const r = rig(viPack());
  r.audio.drain();
  r.ctl.symbolDown('m', 10, 10);
  r.clock.advance(HOLD.startMs + HOLD.repeatMs * 12);
  // The touch-down clip plus the six repeats, and not a seventh.
  const clips = r.audio.drain().filter((e) => e.ch === 'speech').length;
  assert.equal(clips, 1 + HOLD.maxRepeats);
  r.ctl.symbolUp('m', 10, 10);
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, [], 'a hold placed a symbol');
});

test('N7 — a touch that travels more than 24 pt seats nothing', () => {
  const r = rig(viPack());
  r.ctl.symbolDown('m', 10, 10);
  r.ctl.symbolUp('m', 10 + TAP.maxSlopPt + 1, 10);
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, []);
});

test('T5 — two fingers on two tiles seat one symbol and play one sound', () => {
  const r = rig(viPack());
  r.audio.drain();
  r.ctl.symbolDown('m', 10, 10);
  r.ctl.symbolDown('b', 90, 10); // the second finger is ignored while the first owns it
  const log = r.audio.drain();
  assert.equal(log.filter((e) => e.ch === 'speech').length, 1);
  r.ctl.symbolUp('m', 10, 10);
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, ['m']);
});

/** The literal this file owns, so the bound's *value* is guarded and not just its use. */
const SAFE_CEILING = 32;

/**
 * A controller wired to the **real** pool (`src/audio/channels.mjs`), over a player that
 * counts instead of playing. The fake audio engine in `helpers/harness.mjs` has no pool
 * at all, which is exactly why it could not see the defect this replaces: it recorded
 * `prepare(100 sources)` as happily as `prepare(22)`.
 */
function pooledRig(pack, over = {}) {
  const clock = createFakeClock();
  const live = new Set();
  let peak = 0;
  const budget = createPlayerBudget(over.max ?? MAX_PLAYERS);
  const createPlayer = (source) => {
    live.add(source);
    peak = Math.max(peak, live.size);
    return {
      volume: 1,
      pause() {}, seekTo() {}, setPlaybackRate() {}, play() {},
      remove() { live.delete(source); },
    };
  };
  const audio = createChannels({ createPlayer, budget });
  const game = over.game ?? createGame(pack, { pages: over.pages ?? null });
  const ctl = createGameController({
    game,
    seed: 'pooled',
    mediaSource: identityMedia,
    ui: UI,
    audio,
    settings: { ...SETTINGS, ...(over.settings ?? {}) },
    timers: clock.timers,
    now: clock.now,
  });
  return { ctl, clock, audio, game, live, peak: () => peak, budget };
}

/** What a tap on each cell of the page he is looking at would ask the audio engine for. */
function reachableClips(game, ctl) {
  const state = ctl._engine();
  const cells = tableView(game, state).cells.filter((c) => c.page === state.page);
  const out = [];
  for (const cell of cells) {
    const spoken = tapAudio(game, state, cell.id);
    if (spoken && spoken.short) out.push({ cell, source: identityMedia(spoken.short.src ?? spoken.short) });
  }
  return out;
}

test('N11 (BOUNDED) — the pool NEVER exceeds its bound, for either seed pack', () => {
  // **The bug this replaces.** N11 as written in revision 5 — *every clip the constant
  // table can produce is resident before the first tap* — meant `preloadForTable` asked
  // for **100** native players for `vi-seed` and **121** for `en-seed` in one call. iOS
  // runs out; every construction after that threw; `acquire` swallowed it and returned
  // `null`; `start` returned 0; the app went **completely silent** on the owner's iPhone,
  // the bundled seat click included. Chromium survives 157 players, which is why no
  // browser run ever saw it. This is the check, driven through the real warm path.
  for (const [name, pack] of [['vi-seed', viPack()], ['en-seed', enPack()]]) {
    for (const plan of ['tablet', 'phone']) {
      const pages = plan === 'phone' ? phonePages(pack.language) : null;
      const r = pooledRig(pack, { pages });
      const bound = (where) => {
        assert.ok(
          r.live.size <= MAX_PLAYERS,
          `${name}/${plan}: ${r.live.size} native players ${where}, over the bound of ${MAX_PLAYERS}`,
        );
        // **And absolutely, against a literal this test owns.** The line above compares
        // `live` with the very constant it is guarding, so the two move together and a
        // `MAX_PLAYERS` of 100000 would pass it. 100 native players were MEASURED to
        // silence the owner's iPhone; 32 is the most this test will pass on the word of a
        // team that has no device (`acceptance-criteria.md` §0E).
        assert.ok(
          r.live.size <= SAFE_CEILING,
          `${name}/${plan}: ${r.live.size} native players ${where}. The owner's iPhone went `
          + `completely silent at 100; this test allows ${SAFE_CEILING} without a device.`,
        );
      };
      bound('after the pack loaded');

      // A session's worth of taps: a word, its announcement, its reveal, and the pages.
      const cells = tableView(r.game, r.ctl._engine()).cells;
      for (const cell of cells.filter((c) => c.page === r.ctl._engine().page)) {
        r.ctl.symbolDown(cell.id, 10, 10);
        r.ctl.symbolUp(cell.id, 10, 10);
        bound(`after tapping ${cell.id}`);
        r.clock.advance(4000);
        bound(`after the reveal that followed ${cell.id}`);
      }
      for (let page = 0; page < r.game.pageCount; page += 1) {
        r.ctl.tapPage(page);
        r.clock.advance(1000);
        bound(`after paging to ${page}`);
      }
      assert.equal(r.audio.stats().failed, 0, `${name}/${plan}: a player failed to build`);
      assert.equal(r.audio.stats().silenced, 0, `${name}/${plan}: a request made no sound`);
    }
  }
});

test('N11 (BOUNDED) — every clip the CURRENT BOARD STATE can ask for is resident', () => {
  // The bounded guarantee that replaces "the whole table". On the owner's phone plan the
  // whole reachable set fits inside the budget: 7 pinned UI sounds + 14 tap clips on a
  // `vi-seed` page + the undo's = 22 of 24. So a tap on anything he can see is a
  // `seekTo(0)` and a `play()`, which is what N1's 60 ms is bought with.
  for (const [name, pack] of [['vi-seed', viPack()], ['en-seed', enPack()]]) {
    const r = pooledRig(pack, { pages: phonePages(pack.language) });
    const check = (where) => {
      for (const { cell, source } of reachableClips(r.game, r.ctl)) {
        assert.ok(r.live.has(source), `${name}: ${cell.id} is not resident ${where}`);
      }
      for (const key of ['seat', 'knock', 'unclick', 'page', 'motif3', 'motif4']) {
        assert.ok(r.live.has(UI[key]), `${name}: the ${key} sound is not resident ${where}`);
      }
    };
    check('at the start');
    // And after a tap, when the board state — and therefore the reachable set — changed.
    const first = tableView(r.game, r.ctl._engine()).cells.find((c) => c.live && c.page === 0);
    r.ctl.symbolDown(first.id, 10, 10);
    r.ctl.symbolUp(first.id, 10, 10);
    check(`after tapping ${first.id}`);
    // And after a page change, which is the other thing that moves the reachable set.
    r.ctl.tapPage(r.game.pageCount - 1);
    r.clock.advance(1000);
    check('after a page change');
  }
});

test('N11a — the app REPORTS a device that will not build players; it does not just go quiet', () => {
  // The owner has an iPhone and this team does not. If 24 is still too many, the About
  // screen has to say so in numbers he can read back, because "completely silent" is what
  // the last report had to be and it cost a device to interpret.
  const pack = viPack();
  let allowed = 12;
  const clock = createFakeClock();
  let live = 0;
  const audio = createChannels({
    createPlayer: () => {
      if (live >= allowed) throw new Error('AVPlayer: failed to allocate rendering resources');
      live += 1;
      return { volume: 1, pause() {}, seekTo() {}, setPlaybackRate() {}, play() {}, remove() { live -= 1; } };
    },
    budget: createPlayerBudget(MAX_PLAYERS),
  });
  createGameController({
    game: createGame(pack, { pages: phonePages('vi') }),
    seed: 'starved',
    mediaSource: identityMedia,
    ui: UI,
    audio,
    settings: SETTINGS,
    timers: clock.timers,
    now: clock.now,
  });
  const stats = audio.stats();
  assert.ok(stats.failed > 0, 'a starved device produced no reported failure at all');
  // Absolute, against what this fake device allows — not against `MAX_PLAYERS`, which
  // would make the assertion move with the constant it is supposed to be guarding.
  assert.ok(stats.max <= allowed,
    `the ceiling settled at ${stats.max} on a device that allows ${allowed}: it did not come down`);
  assert.match(String(stats.lastError), /rendering resources/,
    'the failure the owner would report is not carried out to a surface he can read');
  assert.ok(live <= allowed, `${live} players live on a device that allows ${allowed}`);
});

/* ------------------------------------------------- §F the announcement timeline */

test('F1 / F4 — the motif fires on the tap that completes the word, four notes when new', () => {
  const r = rig(viPack());
  tap(r, 'm');
  tap(r, 'e');
  tap(r, 'o');
  r.audio.drain();
  tap(r, 'huyen');
  const log = r.audio.drain();
  const motif = log.find((e) => e.ch === 'motif');
  assert.ok(motif, 'no motif');
  assert.equal(motif.source, UI.motif4, 'a new word did not get the fourth note');
  // **F19, RESTATED — the motif STOPS the speech channel, it does not duck it.** The tap
  // that completes the word has just played the tone's clip; the motif cuts it.
  const motifAt = log.findIndex((e) => e.ch === 'motif');
  assert.equal(log[motifAt - 1].ch, 'cut', 'the motif played OVER a speech clip');
  // And nothing is spoken after it until the chant starts at 440 ms.
  assert.ok(!log.slice(motifAt).some((e) => e.ch === 'speech'),
    'the chant started before the motif finished');
});

test('N3 / N3a / N3d — one speech channel, cut hard, newest wins', () => {
  const r = rig(viPack());
  r.audio.drain();
  // Six taps in 400 ms, which is what a 4-year-old actually does (N4/N16).
  for (const id of ['m', 'b', 'c', 'd', 'g', 'h']) {
    r.ctl.symbolDown(id, 10, 10);
    r.ctl.symbolCancel();
    r.clock.advance(66);
  }
  const log = r.audio.drain();
  const speech = log.filter((e) => e.ch === 'speech');
  assert.equal(speech.length, 6, 'six taps did not make six clips');
  // Every clip after the first cut the one before it: at no instant are two un-paused.
  assert.equal(log.filter((e) => e.ch === 'cut').length, 5);
  for (let i = 1; i < log.length; i += 1) {
    if (log[i].ch === 'speech') assert.equal(log[i - 1].ch, 'cut', `clip ${i} did not cut its predecessor`);
  }
});

test('N3b — a knock, a seat click or a page sound never cuts a speech clip', () => {
  const r = rigWithAFlatTile();
  r.audio.drain();
  tap(r, r.liveId);            // a live tap: its clip, then the seat click
  const log = r.audio.drain();
  const seatAt = log.findIndex((e) => e.source === UI.seat);
  assert.ok(seatAt > 0, 'no seat click');
  assert.ok(!log.slice(0, seatAt).some((e) => e.ch === 'cut' && e.source === UI.seat));
  assert.equal(log.filter((e) => e.ch === 'cut').length, 0, 'the UI channel cut speech');
});

test('F5 — a re-discovery gets three notes and skips the parts chant', () => {
  const r = rig(viPack());
  buildMeo(r);
  r.clock.advance(20000);
  r.audio.drain();
  buildMeo(r);
  const log = r.audio.drain();
  assert.equal(log.find((e) => e.ch === 'motif').source, UI.motif3);
  r.clock.advance(REVEAL.chantAt + 10);
  // The chant is empty, so the reveal has already begun.
  assert.ok(r.ctl.getSnapshot().reveal, 'the re-discovery still ran a parts chant');
});

test('F6 — the cheer plays over the motif when the pack has one, and is simply absent otherwise', () => {
  const without = rig(viPack());
  without.audio.drain();
  buildMeo(without);
  assert.ok(!without.audio.drain().some((e) => e.ch === 'cheer'));

  const with_ = rig(viPack(), { ui: { cheer: 'ui:cheer' } });
  with_.audio.drain();
  buildMeo(with_);
  const log = with_.audio.drain();
  const motifAt = log.findIndex((e) => e.ch === 'motif');
  const cheerAt = log.findIndex((e) => e.ch === 'cheer');
  assert.ok(cheerAt >= 0, 'the recorded cheer did not play');
  assert.ok(cheerAt > motifAt, 'the cheer should layer over the motif, at t = 0');
});

test('the announcement runs motif → merge → confetti → chant → reveal, in that order', () => {
  const r = rig(viPack());
  buildMeo(r);
  let snap = r.ctl.getSnapshot();
  assert.equal(snap.hopSeq, 1, 'the strip did not hop on his tap');
  assert.equal(snap.merged, false);

  r.clock.advance(REVEAL.mergeAt);
  assert.equal(r.ctl.getSnapshot().merged, true);
  r.clock.advance(REVEAL.confettiAt - REVEAL.mergeAt);
  assert.equal(r.ctl.getSnapshot().confettiSeq, 1);

  r.audio.drain();
  r.clock.advance(REVEAL.chantAt - REVEAL.confettiAt + 1);
  assert.ok(r.audio.drain().some((e) => e.ch === 'speech'), 'the chant did not start at 440 ms');

  // Run to the reveal, and no further: three seconds after it settles it flies away.
  let guard = 0;
  while (!r.ctl.getSnapshot().reveal && guard < 20000) { r.clock.advance(1); guard += 1; }
  snap = r.ctl.getSnapshot();
  assert.ok(snap.reveal, 'the picture never arrived');
  assert.equal(snap.reveal.text, 'mèo');
  // The strip holds the **whole word**, merged and gold, as the picture lifts off it
  // (M13 scales from the strip's rectangle): the last chant beat is beat 5, never a part.
  assert.equal(snap.chant.stepKind, 'word');
  assert.deepEqual(snap.strip.map((c) => c.glyph), ['mèo']);
  assert.equal(snap.merged, true);
  // And it clears when the picture flies to the shelf.
  r.clock.advance(REVEAL.autoAdvance + M.shelfFly + 100);
  assert.equal(r.ctl.getSnapshot().chant, null, 'the chant is still lit on the board');
});

test('F8 / F9 — the word is spoken 200 ms after full screen, silent to 1400, again at 2200', () => {
  const r = rig(viPack(), { settings: { saySentence: false } });
  buildMeo(r);
  // Run to the exact millisecond the reveal begins, so the offsets below are the spec's.
  let guard = 0;
  while (!r.ctl.getSnapshot().reveal && guard < 20000) { r.clock.advance(1); guard += 1; }
  assert.ok(r.ctl.getSnapshot().reveal, 'the reveal never started');

  r.audio.drain();
  r.clock.advance(REVEAL.fullBleed + REVEAL.speak);
  assert.ok(r.audio.drain().some((e) => e.ch === 'speech'), 'the word was not spoken at +620 ms');

  r.clock.advance(REVEAL.motionEnds - (REVEAL.fullBleed + REVEAL.speak));
  assert.equal(r.ctl.getSnapshot().reveal.phase, 'held');
  r.audio.drain();
  r.clock.advance(REVEAL.sayItTogether - REVEAL.motionEnds - 1);
  assert.deepEqual(r.audio.drain().filter((e) => e.ch === 'speech'), [],
    'something spoke during the say-it-together silence');
  r.clock.advance(2);
  assert.ok(r.audio.drain().some((e) => e.ch === 'speech'), 'the word was not repeated at +2200 ms');
});

test('F10 / F11 / T13 — a tap replays and turns the photo; 3000 ms of quiet exits', () => {
  const r = rig(viPack());
  buildMeo(r);
  let guard = 0;
  while (r.ctl.getSnapshot().reveal?.phase !== 'held' && guard < 200) { r.clock.advance(50); guard += 1; }
  const held = r.ctl.getSnapshot().reveal;
  assert.equal(held.phase, 'held');

  const images = r.pack.words.find((w) => w.id === 'meo').images.length;
  const seen = [held.imageIndex];
  for (let i = 0; i < 30; i += 1) {
    r.ctl.tapReveal();
    seen.push(r.ctl.getSnapshot().reveal.imageIndex);
    r.clock.advance(10);
  }
  assert.equal(r.ctl.getSnapshot().reveal.bounceSeq, 30);
  if (images > 1) assert.ok(new Set(seen).size > 1, 'the photograph never advanced');

  // The exit timer restarted on every tap; 3000 ms after the last one it flies away.
  r.clock.advance(REVEAL.autoAdvance - 20);
  assert.ok(r.ctl.getSnapshot().reveal, 'the reveal left before 3000 ms of quiet');
  r.clock.advance(40);
  assert.equal(r.ctl.getSnapshot().reveal.phase, 'flying');
  r.clock.advance(M.shelfFly + 10);
  assert.equal(r.ctl.getSnapshot().reveal, null, 'the reveal never unmounted');
  assert.equal(r.ctl.getSnapshot().shelf.filter(Boolean).length, 1);
});

test('N8 — tile taps during the announcement do not interrupt it and seat nothing', () => {
  const r = rig(viPack());
  buildMeo(r);
  r.clock.advance(REVEAL.chantAt + 50);
  const before = r.ctl.getSnapshot().engine.prefix.slice();
  tap(r, 'b');
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, before);
});

/* ---------------------------------------------------------- §G the idle ladder */

test('G2–G5 — the ladder escalates at 20 / 40 / 60 / 80 s and then plays a symbol', () => {
  const r = rig(viPack());
  assert.equal(r.ctl.getSnapshot().hintLevel, 0);

  r.clock.advance(LADDER.step);
  assert.equal(r.ctl.getSnapshot().shimmerSeq, 1, 'no shimmer at 20 s');
  assert.equal(r.ctl.getSnapshot().hintLevel, 1);

  r.clock.advance(LADDER.step);
  let snap = r.ctl.getSnapshot();
  assert.equal(snap.hintLevel, 2);
  const breathing = snap.hintSymbolId;
  assert.ok(breathing, 'nothing is breathing at 40 s');
  assert.ok(snap.table.cells.find((c) => c.id === breathing).live, 'a flat tile is breathing');

  r.clock.advance(LADDER.step);
  assert.equal(r.ctl.getSnapshot().hintLevel, 3);
  assert.equal(r.ctl.getSnapshot().hintSymbolId, breathing, 'the rim moved to a different tile');

  r.audio.drain();
  r.clock.advance(LADDER.step);
  snap = r.ctl.getSnapshot();
  assert.deepEqual(snap.engine.prefix, [breathing],
    'the tile that flew is not the tile that had been breathing');
  assert.equal(snap.autoPlacedId, breathing);
  assert.ok(r.audio.drain().some((e) => e.ch === 'speech'), 'the auto-play was silent');
  // G6 — the ladder restarts at 20 s.
  assert.equal(r.ctl.getSnapshot().hintLevel, 0);
});

test('G6 — left completely alone, the app announces a word by itself', () => {
  const r = rig(viPack());
  r.audio.drain();
  r.clock.advance(LADDER.step * 4 * 4);
  assert.ok(r.audio.drain().some((e) => e.ch === 'motif'), 'the app never made a word by itself');
});

test('G9 — any touch defers the next escalation by 4 s', () => {
  const r = rigWithAFlatTile();
  r.clock.advance(LADDER.step - 1000);
  tap(r, r.deadId);                      // a touch, not a placement
  r.clock.advance(1001);
  assert.equal(r.ctl.getSnapshot().hintLevel, 0, 'the shimmer fired inside the 4 s deferral');
  r.clock.advance(LADDER.deferMs);
  assert.equal(r.ctl.getSnapshot().hintLevel, 1);
});

test('G7 — a seated symbol resets the ladder to zero', () => {
  const r = rig(viPack());
  r.clock.advance(LADDER.step * 2);
  assert.equal(r.ctl.getSnapshot().hintLevel, 2);
  tap(r, 'm');
  assert.equal(r.ctl.getSnapshot().hintLevel, 0);
  assert.equal(r.ctl.getSnapshot().hintSymbolId, null);
});

test('the ladder does not run during the announcement', () => {
  const r = rig(viPack());
  buildMeo(r);
  // Long past the 20 s first rung, but still inside the reveal's hold.
  r.clock.advance(LADDER.step + 1000);
  assert.equal(r.ctl.getSnapshot().hintLevel, 0);
  assert.equal(r.ctl.getSnapshot().shimmerSeq, 0);
});

/* -------------------------------------------------------------- undo and hints */

test('D4 / E8 — ONE tap on the strip returns ONE symbol, and says what is left', () => {
  // **RESTATED in revision 5** (`gameplay.md` §4.4): the strip is one target and a tap
  // takes back the last symbol. The clip is the clip of **what remains** — undoing `h`
  // from `c h` says `cờ`, not `hờ` — and one descending unclick sounds under it.
  const r = rig(viPack());
  tap(r, 'c');
  tap(r, 'h');
  r.audio.drain();
  r.ctl.stripDown();
  r.ctl.stripUp();
  const log = r.audio.drain();
  assert.equal(log.filter((e) => e.ch === 'ui' && e.source === UI.unclick).length, 1);
  const spoken = log.filter((e) => e.ch === 'speech');
  assert.equal(spoken.length, 1, 'an undo played more than one clip');
  assert.equal(spoken[0].source, identityMedia(r.pack.unitAudio.onset.c.short.src),
    'the undo said the clip of what was taken, not of what is left');
  assert.deepEqual(r.ctl.getSnapshot().returning, ['h'], 'more than one symbol flew home');
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, ['c'], 'undo took back more than one');
  r.clock.advance(M.flyHome);
  assert.deepEqual(r.ctl.getSnapshot().returning, [], 'the returning list never cleared');

  // E9 — emptying it is one tap per symbol, each with its own sound.
  r.audio.drain();
  r.ctl.stripDown();
  r.ctl.stripUp();
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, []);
  // X35 / T20 — and on an empty strip a tap does nothing and plays nothing.
  r.audio.drain();
  r.ctl.stripDown();
  r.ctl.stripUp();
  assert.deepEqual(r.audio.drain(), [], 'an empty strip made a sound');
});

test('M2 / M3 / X36 — an 800 ms hold on the strip speaks the parts, and undoes nothing', () => {
  const r = rig(viPack());
  tap(r, 'm');
  tap(r, 'e');
  r.audio.drain();
  r.ctl.stripDown();
  r.clock.advance(800);
  const captions = r.audio.drain().filter((e) => e.ch === 'speech').length;
  r.clock.advance(4000);
  assert.ok(captions >= 1, 'the parts hint said nothing');
  // X36 — the hold consumed the gesture, so the release is not an undo. The strip keeps
  // exactly two gestures and there is no third.
  r.ctl.stripUp();
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, ['m', 'e'], 'the hold also undid the word');
  assert.equal(r.ctl.getSnapshot().hintLevel, 0);
});

test('T3 / X37 — seat a symbol and lift it 120 ms later; both sounds play, it ends on the table', () => {
  const r = rig(viPack());
  r.audio.drain();
  tap(r, 'c');
  r.clock.advance(120);
  tap(r, 'h');                       // two letters, so the undo has something to say
  r.ctl.stripDown();
  r.ctl.stripUp();
  r.clock.advance(M.flyHome);
  const log = r.audio.drain();
  assert.ok(log.filter((e) => e.ch === 'speech').length >= 3,
    'one of the three sounds was lost: `cờ`, `chờ`, and `cờ` again as it came back');
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, ['c']);
});

/* ------------------------------------------------------- lifecycle and settings */

test('T8 — backgrounded mid-chant: audio stops and the board is never half-merged', () => {
  const r = rig(viPack());
  buildMeo(r);
  r.clock.advance(REVEAL.chantAt + 100);
  r.audio.drain();
  r.ctl.onBackground();
  const log = r.audio.drain();
  assert.ok(log.some((e) => e.ch === 'stopAll'), 'audio kept playing in the background');
  const snap = r.ctl.getSnapshot();
  assert.equal(snap.chant, null, 'the chant is frozen mid-word');
  assert.equal(snap.reveal.phase, 'held', 'the board is neither pre-chant nor revealed');
  assert.equal(r.clock.timers.size(), 0, 'timers survived backgrounding');
  r.ctl.onForeground();
  assert.ok(r.clock.timers.has('advance'), 'the reveal has no way to end');
});

test('N10 — mute silences the game and the ladder still fires', () => {
  const r = rig(viPack(), { settings: { mute: true } });
  r.audio.drain();
  tap(r, 'm');
  assert.ok(r.audio.drain().every((e) => e.muted !== false), 'something played while muted');
  r.clock.advance(LADDER.step);
  assert.equal(r.ctl.getSnapshot().shimmerSeq, 1, 'the ladder stopped when muted');
});

test('H14 — Finish session fades the audio over 800 ms and calls back', () => {
  let ended = false;
  const r = rig(viPack(), { onSessionEnd: () => { ended = true; } });
  r.audio.drain();
  r.ctl.finishSession();
  assert.ok(r.audio.drain().some((e) => e.ch === 'fadeOut' && e.ms === 800));
  assert.equal(ended, true);
  assert.equal(r.ctl.getSnapshot().phase, 'ended');
});

test('A10 / R6 — destroy clears every timer and releases every audio handle', () => {
  const r = rig(viPack());
  tap(r, 'm');
  r.clock.advance(LADDER.step);
  assert.ok(r.clock.timers.size() > 0);
  r.ctl.destroy();
  assert.equal(r.clock.timers.size(), 0, `timers left: ${r.clock.timers.pending().join(', ')}`);
  assert.equal(r.audio.isDisposed(), true);
  // And nothing it is asked to do afterwards schedules anything new.
  tap(r, 'e');
  r.ctl.tapReveal();
  r.ctl.finishSession();
  assert.equal(r.clock.timers.size(), 0);
});

test('no timer outlives the state it belongs to — the bag is empty when the board is idle', () => {
  const r = rig(viPack());
  buildMeo(r);
  r.clock.advance(60000);
  // The reveal has come and gone; what is left is the ladder and nothing else.
  assert.deepEqual(r.clock.timers.pending().filter((n) => !n.startsWith('ladder')), []);
});

/* ------------------------------------------------------------------- English */

test('D7 / D8 / N14 (RESTATED) — a tap ALWAYS plays `short`, first touch or five-hundredth', () => {
  // **The inverse of revision 2's D7.** The `long` anchored clip ("kuh, cat") is 2.9–3.5 s
  // of two utterances; a 4-year-old taps every 300–600 ms, so it was always cut mid-word,
  // and a fragment of an English word landing on the next letter's onset is exactly what
  // "voices seem to be mixed up with each other" describes (`ui.md` §11.0 item 1).
  const r = rig(enPack());
  const long = identityMedia(r.pack.tileById.letter.c.audio.long.src);
  const short = identityMedia(r.pack.tileById.letter.c.audio.short.src);
  assert.notEqual(long, short, 'the pack has one clip, so this test cannot tell them apart');
  for (let i = 0; i < 4; i += 1) {
    r.audio.drain();
    r.ctl.symbolDown('c', 10, 10);
    const played = r.audio.drain().filter((e) => e.ch === 'speech');
    assert.equal(played[0].source, short, `touch ${i + 1} played the long clip`);
    r.ctl.symbolUp('c', 10, 10);
    r.clock.advance(5000);
    while (r.ctl.getSnapshot().engine.prefix.length > 0) r.ctl.stripUp();
    r.clock.advance(2000);
  }
});

test('D8 — a whole session of play never fires a `long` clip from a tile tap', () => {
  const r = rig(enPack());
  const longs = new Set(Object.values(r.pack.tileById.letter)
    .map((t) => (t.audio.long ? identityMedia(t.audio.long.src) : null)).filter(Boolean));
  r.audio.drain();
  for (const id of ['c', 'a', 't', 'b', 'q', 'z', 'sh']) { tap(r, id); r.clock.advance(300); }
  r.clock.advance(60000);
  const heard = r.audio.drain().filter((e) => longs.has(e.source));
  assert.deepEqual(heard, [], 'a long clip was fired by a tap');
});

test('D9 / M2 — the parts hint is the ONLY place the long clips are heard', () => {
  const r = rig(enPack());
  const long = identityMedia(r.pack.tileById.letter.c.audio.long.src);
  tap(r, 'c');
  r.clock.advance(1000);
  r.audio.drain();
  r.ctl.stripDown();
  r.clock.advance(800);
  assert.ok(r.audio.drain().some((e) => e.source === long), 'the hint did not use the anchored clip');
});

test('the motif is the same file in both modes (F18, R10)', () => {
  const vi = rig(viPack());
  vi.audio.drain();
  buildMeo(vi);
  const a = vi.audio.drain().find((e) => e.ch === 'motif').source;

  const en = rig(enPack());
  en.audio.drain();
  tap(en, 'c');
  tap(en, 'a');
  tap(en, 't');
  const b = en.audio.drain().find((e) => e.ch === 'motif').source;
  assert.equal(a, b);
  assert.equal(a, UI.motif4);
});

test('MOTIF is the spec: three rising notes at 0/130/260, 440 ms, plus a fourth at 390', () => {
  assert.deepEqual(MOTIF.onsets, [0, 130, 260]);
  assert.equal(MOTIF.noteMs, 180);
  assert.equal(MOTIF.totalMs, 440);
  assert.equal(MOTIF.fourthAt, 390);
  assert.equal(REVEAL.chantAt, MOTIF.totalMs, 'the chant must start when the motif ends');
});

/* -------------------------------------------------------- the shelf and album */

test('H7 — the fifth slot tips into the album and a four-note phrase plays once', () => {
  const r = rig(viPack());
  const eligible = r.game.tree.eligible.slice(0, 5);
  for (const w of eligible) {
    // The taps are the word's letters and then its tone (revision 5).
    for (const symbol of [...w.letters, w.syllables[0].tone]) tap(r, symbol);
    r.clock.advance(30000);
  }
  const snap = r.ctl.getSnapshot();
  assert.equal(snap.phase, 'album');
  assert.equal(snap.album.length, 5);
  r.ctl.leaveAlbum();
  assert.equal(r.ctl.getSnapshot().phase, 'playing');
  assert.deepEqual(r.ctl.getSnapshot().shelf, [null, null, null, null, null]);
});

test('H13 — a filled shelf slot replays its word and opens no picture', () => {
  const r = rig(viPack());
  buildMeo(r);
  r.clock.advance(30000);
  const entry = r.ctl.getSnapshot().shelf.find(Boolean);
  assert.ok(entry);
  r.audio.drain();
  r.ctl.tapShelf(entry);
  assert.ok(r.audio.drain().some((e) => e.ch === 'speech'));
  assert.equal(r.ctl.getSnapshot().reveal, null, 'the shelf opened a full-screen picture');
});

test('H10 — an album card replays its word and turns to the next photograph', () => {
  const r = rig(viPack());
  buildMeo(r);
  r.clock.advance(30000);
  const entry = r.ctl.getSnapshot().album[0];
  const images = r.pack.words.find((w) => w.id === entry.wordId).images.length;
  r.audio.drain();
  r.ctl.tapAlbum(entry);
  assert.ok(r.audio.drain().some((e) => e.ch === 'speech'));
  if (images > 1) {
    assert.ok(r.ctl.getSnapshot().albumPhotos[entry.wordId], 'the card did not turn');
  }
});

/* ------------------------------------------------- the table the snapshot shows */

test('B8 — the snapshot reports the table, not a filtered live set', () => {
  const r = rig(viPack());
  const before = r.ctl.getSnapshot().table.cells.map((c) => c.id);
  tap(r, 'm');
  tap(r, 'e');
  r.ctl.stripDown();
  r.ctl.stripUp();
  assert.deepEqual(r.ctl.getSnapshot().table.cells.map((c) => c.id), before,
    'a cell moved, appeared or disappeared');
  // And the engine agrees with the snapshot about what is live.
  const fromEngine = tableView(r.game, r.ctl._engine()).cells.map((c) => c.live);
  assert.deepEqual(r.ctl.getSnapshot().table.cells.map((c) => c.live), fromEngine);
});

test('B2c — the table never morphs: one page bump per slide, and none per repaint', () => {
  // **The inverse of revision 2's morph test.** There is no role change and no cross-fade
  // to sequence; what moves is the window, and only when a page goes dead (V13).
  const r = phoneRig();
  const start = r.ctl.getSnapshot().pageSeq;
  // `m` and `e` are both on page 1 (`a`…`m`), so seating `m` moves nothing: the board
  // only slides off a page that has gone dead (V12, V13).
  tap(r, 'm');
  assert.equal(r.ctl.getSnapshot().pageSeq, start, 'the board slid while page 1 was still live');
  tap(r, 'e');
  const atRime = r.ctl.getSnapshot().pageSeq;
  assert.equal(atRime, start + 1, 'the board did not slide to the page holding `o`');
  // A chant emits several times a second; none of those may restart the slide.
  tap(r, 'o');
  const atTone = r.ctl.getSnapshot().pageSeq;
  assert.equal(atTone, atRime + 1);
  r.clock.advance(50);
  assert.equal(r.ctl.getSnapshot().pageSeq, atTone);
});

/* ------------------------------------------- §Y the child's language control (rev 6) */

test('Y5 — the language control plays exactly ONE UI tap sound, and never speech', () => {
  // `ui.md` §9.4a: *"The language names are spoken on the chooser, where both are present
  // and he can compare them. A name spoken on the board would be the outgoing language
  // announcing the incoming one, which is a sentence with no meaning."* It would also be
  // the one place in the app where a clip of the other language could be heard over this
  // board, which is R2.
  const r = phoneRig();
  tap(r, 'm'); // he is mid-word when he presses it, because he will be
  r.audio.drain();
  r.ctl.languageTap();
  const log = r.audio.drain();
  assert.equal(log.length, 1, 'the language control made more or less than one sound');
  assert.equal(log[0].ch, 'ui');
  assert.equal(log[0].source, UI.page);
  assert.ok(!log.some((e) => e.ch === 'speech'), 'the language control spoke');
  assert.ok(!log.some((e) => e.ch === 'cut'), 'the language control cut a speech clip');
  // Y12 — and it changes nothing: opening the chooser is not a teardown, so the strip he
  // had built is still there when he confirms the language he is already in.
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix.length, 1);
  assert.deepEqual(r.clock.timers.pending().filter((n) => n.startsWith('lang')), []);
});

test('Y5 — eight taps in one second make eight UI sounds and no speech, and nothing queues', () => {
  // T-series behaviour: he will press it repeatedly. The *chooser* is shown once (Y28,
  // guarded in the shell), and the control itself must stay a sound and nothing else.
  const r = phoneRig();
  r.audio.drain();
  for (let i = 0; i < 8; i += 1) { r.ctl.languageTap(); r.clock.advance(125); }
  const log = r.audio.drain();
  assert.equal(log.length, 8);
  assert.ok(log.every((e) => e.ch === 'ui' && e.source === UI.page));
  assert.deepEqual(r.clock.timers.pending().filter((n) => !n.startsWith('ladder')), [],
    'the language control left a timer behind');
});

/* ----------------------------------------------------------------- §V the rail */

test('V24 — a page change sounds, on the UI channel, and it does not cut speech', () => {
  const r = phoneRig();
  r.audio.drain();
  r.ctl.tapPage(2);
  const log = r.audio.drain();
  assert.equal(log.length, 1, 'a page change made more than one sound');
  assert.equal(log[0].ch, 'ui');
  assert.equal(log[0].source, UI.page);
  assert.equal(log[0].db, -6);
  // V19 — **never speech**: the glyph on a button is a label, not a character.
  assert.ok(!log.some((e) => e.ch === 'speech'), 'pressing a page button spoke a letter');
  assert.ok(!log.some((e) => e.ch === 'cut'), 'the page sound cut a speech clip');
});

test('V24 — the auto-advance sounds the same, and it is the app that is slower', () => {
  const r = phoneRig();
  r.audio.drain();
  tap(r, 'm');
  tap(r, 'e');                       // page 1 goes dead; the board slides itself to page 2
  const log = r.audio.drain();
  assert.ok(log.some((e) => e.ch === 'ui' && e.source === UI.page), 'the auto-advance was silent');
  // V11 — his slide is 300 ms, the app's is 420 ms, and the snapshot says which.
  assert.equal(r.ctl.getSnapshot().pageBy, 'auto');
  assert.equal(r.ctl.getSnapshot().pageSlideMs, M.pageSlideAuto);
  r.ctl.tapPage(0);
  assert.equal(r.ctl.getSnapshot().pageBy, 'self');
  assert.equal(r.ctl.getSnapshot().pageSlideMs, M.pageSlide);
  assert.ok(M.pageSlideAuto > M.pageSlide, 'the app must be measurably slower than he is');
});

test('V30 — thirty rapid rail taps end on the last page, with nothing left half-finished', () => {
  const r = phoneRig();
  r.audio.drain();
  for (let i = 0; i < 30; i += 1) { r.ctl.tapPage(i % 3); r.clock.advance(5); }
  assert.equal(r.ctl.getSnapshot().page, 29 % 3);
  r.clock.advance(5000);
  assert.deepEqual(r.clock.timers.pending().filter((n) => !n.startsWith('ladder')), [],
    'a page change left a timer behind');
});

test('V31 — an auto-advance under a finger seats nothing on the new page', () => {
  const r = phoneRig();
  // His finger goes down on `e` (page 0, after `m`) and up: page 0 goes dead and the
  // board slides to page 1. The same touch must not then seat anything there.
  tap(r, 'm');
  r.ctl.symbolDown('e', 10, 10);
  r.ctl.symbolUp('e', 10, 10);
  assert.equal(r.ctl.getSnapshot().page, 1);
  r.ctl.symbolUp('o', 10, 10);       // the same gesture ending over a tile on page 1
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, ['m', 'e'], 'the same touch seated twice');
});

test('V26 / V27 — the idle ladder reaches the rail, and the app changes page before it plays', () => {
  const r = phoneRig();
  tap(r, 'm');
  tap(r, 'e');                       // now on page 1; the only live letter is `o`
  r.clock.advance(LADDER.step * 2);  // 40 s: something breathes
  const snap = r.ctl.getSnapshot();
  assert.ok(snap.hintSymbolId, 'nothing is breathing at 40 s');
  const hintPage = r.game.inventory.pageOf(snap.hintSymbolId);
  // V26 — if the tile it wants is on another page, the BUTTON breathes instead.
  assert.equal(snap.hintPage, hintPage === snap.page ? null : hintPage);

  // V27 — at 80 s the app changes page first, **then** plays the tile: the slide is the
  // app's 420 ms, and the tap lands after it rather than on a board he cannot see.
  const before = r.ctl.getSnapshot().engine.prefix;
  r.audio.drain();
  r.clock.advance(LADDER.step * 2);
  if (snap.hintPage !== null) {
    assert.equal(r.ctl.getSnapshot().page, snap.hintPage, 'the app played a tile off screen');
    assert.deepEqual(r.ctl.getSnapshot().engine.prefix, before, 'it played before the slide');
    r.clock.advance(M.pageSlideAuto + 1);
  }
  const after = r.ctl.getSnapshot();
  assert.deepEqual(after.engine.prefix, [...before, snap.hintSymbolId],
    'the app never took its turn, or took a different one');
});
