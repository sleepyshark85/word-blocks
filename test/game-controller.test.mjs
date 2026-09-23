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
  createGameController, planAnnouncement, stepDurationMs, clipVariant,
} from '../src/state/gameController.mjs';
import { createGame, tableView } from '../src/engine/index.mjs';
import { REVEAL, LADDER, HOLD, TAP, M, MOTIF } from '../src/motion/durations.mjs';
import { viPack, enPack } from './helpers/load.mjs';
import { createFakeClock, createFakeAudio, identityMedia } from './helpers/harness.mjs';

const SETTINGS = { showWord: true, mute: false, rate: 1, saySentence: true, reduceMotion: false };

/** The bundled non-speech sounds, as opaque handles the double can recognise. */
const UI = {
  motif3: 'ui:motif3',
  motif4: 'ui:motif4',
  cheer: null,
  seat: 'ui:seat',
  knock: 'ui:knock',
  unclick: 'ui:unclick',
  socket: 'ui:socket',
  shelfBell: 'ui:shelfBell',
  shelfTip: 'ui:shelfTip',
};

function rig(pack, over = {}) {
  const clock = createFakeClock();
  const audio = createFakeAudio();
  const game = createGame(pack, { maxCells: over.maxCells ?? 24 });
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
  });
  // The board only gets interesting above stage 1, and the stage is not a wall-clock
  // concern, so it is set directly rather than played up to.
  if (over.stage) {
    const engine = ctl._engine();
    Object.assign(engine, { stage: over.stage });
  }
  return { ctl, clock, audio, game, pack };
}

/** Tap a symbol the way a finger does: down, then up, in the same place. */
function tap(r, symbolId) {
  r.ctl.symbolDown(symbolId, 10, 10);
  r.ctl.symbolUp(symbolId, 10, 10);
}

/** The first flat symbol on the table right now. */
function firstFlat(r) {
  return r.ctl.getSnapshot().table.cells.find((c) => !c.live);
}

/** Build the word `mèo`, which every Vietnamese assertion here uses. */
function buildMeo(r) {
  tap(r, 'm');
  tap(r, 'eo');
  tap(r, 'huyen');
}

/* --------------------------------------------------------------- pure helpers */

test('stepDurationMs is the clip plus its stated gap, with a default for a silent clip', () => {
  assert.equal(stepDurationMs({ audio: { ms: 400 }, gapAfterMs: 250 }), 650);
  assert.equal(stepDurationMs({ audio: null, gapAfterMs: 0 }), 700);
});

test('D7 / D8 / D9 — the long clip only on the first touch, and never inside 900 ms', () => {
  assert.equal(clipVariant(true, false), 'long');
  assert.equal(clipVariant(true, true), 'short');
  assert.equal(clipVariant(false, false), 'short');
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
  const r = rig(viPack(), { stage: 5 });
  r.audio.drain();
  r.ctl.symbolDown('m', 10, 10);
  const onDown = r.audio.drain();
  assert.equal(onDown.length, 1);
  assert.equal(onDown[0].ch, 'tile');
  r.ctl.symbolUp('m', 10, 10);
});

test('E2 — a flat tile plays its own clip and then a knock at −9 dB, and seats nothing', () => {
  const r = rig(viPack(), { stage: 5 });
  const flat = firstFlat(r);
  assert.ok(flat, 'no flat tile on the stage-5 onset table');
  r.audio.drain();
  tap(r, flat.id);
  const log = r.audio.drain();
  assert.equal(log[0].ch, 'tile', 'the flat tile did not speak');
  const knock = log.find((e) => e.ch === 'ui' && e.source === UI.knock);
  assert.ok(knock, 'no knock');
  assert.equal(knock.db, -9);
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, [], 'a flat tile seated');
});

test('E1 — a live tap plays the clip, seats, and fires a seat click', () => {
  const r = rig(viPack(), { stage: 5 });
  r.audio.drain();
  tap(r, 'm');
  const log = r.audio.drain();
  assert.equal(log[0].ch, 'tile');
  assert.ok(log.some((e) => e.ch === 'ui' && e.source === UI.seat), 'no seat click');
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, ['m']);
});

test('E13 — twenty taps on a flat tile play twenty clips and change nothing', () => {
  const r = rig(viPack(), { stage: 5 });
  const flat = firstFlat(r);
  r.audio.drain();
  for (let i = 0; i < 20; i += 1) {
    tap(r, flat.id);
    r.clock.advance(1);
  }
  const log = r.audio.drain();
  assert.equal(log.filter((e) => e.ch === 'tile').length, 20);
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, []);
  // Nothing was queued or delayed: after the taps the bag holds no pending clip timer.
  assert.ok(!r.clock.timers.has('hold'));
});

test('N13 / C3 — the ∅ socket plays a wooden open, never a speech clip', () => {
  const r = rig(viPack(), { stage: 5 });
  r.audio.drain();
  tap(r, '∅');
  const log = r.audio.drain();
  assert.equal(log[0].ch, 'tile');
  assert.equal(log[0].source, UI.socket);
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, ['∅']);
});

test('N5 / N6 — a hold repeats the short clip 6 times and then stops; nothing is placed', () => {
  const r = rig(viPack(), { stage: 5 });
  r.audio.drain();
  r.ctl.symbolDown('m', 10, 10);
  r.clock.advance(HOLD.startMs + HOLD.repeatMs * 12);
  // The touch-down clip plus the six repeats, and not a seventh.
  const clips = r.audio.drain().filter((e) => e.ch === 'tile').length;
  assert.equal(clips, 1 + HOLD.maxRepeats);
  r.ctl.symbolUp('m', 10, 10);
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, [], 'a hold placed a symbol');
});

test('N7 — a touch that travels more than 24 pt seats nothing', () => {
  const r = rig(viPack(), { stage: 5 });
  r.ctl.symbolDown('m', 10, 10);
  r.ctl.symbolUp('m', 10 + TAP.maxSlopPt + 1, 10);
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, []);
});

test('T5 — two fingers on two tiles seat one symbol and play one sound', () => {
  const r = rig(viPack(), { stage: 5 });
  r.audio.drain();
  r.ctl.symbolDown('m', 10, 10);
  r.ctl.symbolDown('b', 90, 10); // the second finger is ignored while the first owns it
  const log = r.audio.drain();
  assert.equal(log.filter((e) => e.ch === 'tile').length, 1);
  r.ctl.symbolUp('m', 10, 10);
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, ['m']);
});

test('N11 — every clip the table can produce is resident before the morph completes', () => {
  const r = rig(viPack(), { stage: 5 });
  const before = r.audio.prepared();
  assert.ok(before.length > 20, `only ${before.length} clips preloaded for the onset table`);
  tap(r, 'm');
  const after = r.audio.prepared();
  assert.notDeepEqual(before, after, 'the table changed and nothing was reloaded');
  // Every rime the new table shows has both its clips resident.
  for (const cell of r.ctl.getSnapshot().table.cells) {
    if (cell.kind === 'socket') continue;
    for (const which of ['long', 'short']) {
      const ref = cell.audio[which];
      if (!ref) continue;
      assert.ok(after.includes(identityMedia(ref.src)), `${cell.id}.${which} is not resident`);
    }
  }
});

/* ------------------------------------------------- §F the announcement timeline */

test('F1 / F4 — the motif fires on the tap that completes the word, four notes when new', () => {
  const r = rig(viPack(), { stage: 5 });
  tap(r, 'm');
  tap(r, 'eo');
  r.audio.drain();
  tap(r, 'huyen');
  const log = r.audio.drain();
  const motif = log.find((e) => e.ch === 'motif');
  assert.ok(motif, 'no motif');
  assert.equal(motif.source, UI.motif4, 'a new word did not get the fourth note');
  // Before the chant, not after it: nothing has been spoken yet.
  assert.ok(!log.some((e) => e.ch === 'speech'), 'the chant started before the motif finished');
});

test('F5 — a re-discovery gets three notes and skips the parts chant', () => {
  const r = rig(viPack(), { stage: 5 });
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
  const without = rig(viPack(), { stage: 5 });
  without.audio.drain();
  buildMeo(without);
  assert.ok(!without.audio.drain().some((e) => e.ch === 'cheer'));

  const with_ = rig(viPack(), { stage: 5, ui: { cheer: 'ui:cheer' } });
  with_.audio.drain();
  buildMeo(with_);
  const log = with_.audio.drain();
  const motifAt = log.findIndex((e) => e.ch === 'motif');
  const cheerAt = log.findIndex((e) => e.ch === 'cheer');
  assert.ok(cheerAt >= 0, 'the recorded cheer did not play');
  assert.ok(cheerAt > motifAt, 'the cheer should layer over the motif, at t = 0');
});

test('the announcement runs motif → merge → confetti → chant → reveal, in that order', () => {
  const r = rig(viPack(), { stage: 5 });
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
  assert.equal(snap.chant, null, 'the chant is still lit under the picture');
});

test('F8 / F9 — the word is spoken 200 ms after full screen, silent to 1400, again at 2200', () => {
  const r = rig(viPack(), { stage: 5, settings: { saySentence: false } });
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
  const r = rig(viPack(), { stage: 5 });
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
  const r = rig(viPack(), { stage: 5 });
  buildMeo(r);
  r.clock.advance(REVEAL.chantAt + 50);
  const before = r.ctl.getSnapshot().engine.prefix.slice();
  tap(r, 'b');
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, before);
});

/* ---------------------------------------------------------- §G the idle ladder */

test('G2–G5 — the ladder escalates at 20 / 40 / 60 / 80 s and then plays a symbol', () => {
  const r = rig(viPack(), { stage: 5 });
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
  assert.ok(r.audio.drain().some((e) => e.ch === 'tile'), 'the auto-play was silent');
  // G6 — the ladder restarts at 20 s.
  assert.equal(r.ctl.getSnapshot().hintLevel, 0);
});

test('G6 — left completely alone, the app announces a word by itself', () => {
  const r = rig(viPack(), { stage: 5 });
  r.audio.drain();
  r.clock.advance(LADDER.step * 4 * 4);
  assert.ok(r.audio.drain().some((e) => e.ch === 'motif'), 'the app never made a word by itself');
});

test('G9 — any touch defers the next escalation by 4 s', () => {
  const r = rig(viPack(), { stage: 5 });
  r.clock.advance(LADDER.step - 1000);
  const flat = firstFlat(r);
  tap(r, flat.id);                       // a touch, not a placement
  r.clock.advance(1001);
  assert.equal(r.ctl.getSnapshot().hintLevel, 0, 'the shimmer fired inside the 4 s deferral');
  r.clock.advance(LADDER.deferMs);
  assert.equal(r.ctl.getSnapshot().hintLevel, 1);
});

test('G7 — a seated symbol resets the ladder to zero', () => {
  const r = rig(viPack(), { stage: 5 });
  r.clock.advance(LADDER.step * 2);
  assert.equal(r.ctl.getSnapshot().hintLevel, 2);
  tap(r, 'm');
  assert.equal(r.ctl.getSnapshot().hintLevel, 0);
  assert.equal(r.ctl.getSnapshot().hintSymbolId, null);
});

test('the ladder does not run during the announcement', () => {
  const r = rig(viPack(), { stage: 5 });
  buildMeo(r);
  // Long past the 20 s first rung, but still inside the reveal's hold.
  r.clock.advance(LADDER.step + 1000);
  assert.equal(r.ctl.getSnapshot().hintLevel, 0);
  assert.equal(r.ctl.getSnapshot().shimmerSeq, 0);
});

/* -------------------------------------------------------------- undo and hints */

test('E8 — undo flies the symbols home 90 ms apart, each with its own clip and one unclick', () => {
  const r = rig(viPack(), { stage: 5 });
  tap(r, 'm');
  tap(r, 'eo');
  r.audio.drain();
  r.ctl.stripDown();
  r.ctl.stripUp(0);
  let log = r.audio.drain();
  assert.equal(log.filter((e) => e.ch === 'ui' && e.source === UI.unclick).length, 1);
  assert.deepEqual(r.ctl.getSnapshot().returning, ['eo', 'm']);
  r.clock.advance(1);
  log = r.audio.drain();
  assert.equal(log.filter((e) => e.ch === 'tile').length, 1, 'both clips played at once');
  r.clock.advance(M.flyHomeStagger);
  log = r.audio.drain();
  assert.equal(log.filter((e) => e.ch === 'tile').length, 1, 'the second clip did not follow');
  r.clock.advance(M.flyHome + M.flyHomeStagger);
  assert.deepEqual(r.ctl.getSnapshot().returning, [], 'the returning list never cleared');
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, []);
});

test('M2 / M3 — an 800 ms hold on the strip speaks the parts, and no completion', () => {
  const r = rig(viPack(), { stage: 5 });
  tap(r, 'm');
  tap(r, 'eo');
  r.audio.drain();
  r.ctl.stripDown();
  r.clock.advance(800);
  const captions = r.audio.drain().filter((e) => e.ch === 'speech').length;
  r.clock.advance(4000);
  assert.ok(captions >= 1, 'the parts hint said nothing');
  // The hold consumed the gesture, so the release is not an undo.
  r.ctl.stripUp(0);
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, ['m', 'eo'], 'the hold also undid the word');
  assert.equal(r.ctl.getSnapshot().hintLevel, 0);
});

test('T3 — seat a symbol and lift it 120 ms later; both sounds play and it ends on the table', () => {
  const r = rig(viPack(), { stage: 5 });
  r.audio.drain();
  tap(r, 'm');
  r.clock.advance(120);
  r.ctl.stripDown();
  r.ctl.stripUp(0);
  r.clock.advance(M.flyHome + M.flyHomeStagger);
  const log = r.audio.drain();
  assert.ok(log.filter((e) => e.ch === 'tile').length >= 2, 'one of the two sounds was lost');
  assert.deepEqual(r.ctl.getSnapshot().engine.prefix, []);
});

/* ------------------------------------------------------- lifecycle and settings */

test('T8 — backgrounded mid-chant: audio stops and the board is never half-merged', () => {
  const r = rig(viPack(), { stage: 5 });
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
  const r = rig(viPack(), { stage: 5, settings: { mute: true } });
  r.audio.drain();
  tap(r, 'm');
  assert.ok(r.audio.drain().every((e) => e.muted !== false), 'something played while muted');
  r.clock.advance(LADDER.step);
  assert.equal(r.ctl.getSnapshot().shimmerSeq, 1, 'the ladder stopped when muted');
});

test('H14 — Finish session fades the audio over 800 ms and calls back', () => {
  let ended = false;
  const r = rig(viPack(), { stage: 5, onSessionEnd: () => { ended = true; } });
  r.audio.drain();
  r.ctl.finishSession();
  assert.ok(r.audio.drain().some((e) => e.ch === 'fadeOut' && e.ms === 800));
  assert.equal(ended, true);
  assert.equal(r.ctl.getSnapshot().phase, 'ended');
});

test('A10 / R6 — destroy clears every timer and releases every audio handle', () => {
  const r = rig(viPack(), { stage: 5 });
  tap(r, 'm');
  r.clock.advance(LADDER.step);
  assert.ok(r.clock.timers.size() > 0);
  r.ctl.destroy();
  assert.equal(r.clock.timers.size(), 0, `timers left: ${r.clock.timers.pending().join(', ')}`);
  assert.equal(r.audio.isDisposed(), true);
  // And nothing it is asked to do afterwards schedules anything new.
  tap(r, 'eo');
  r.ctl.tapReveal();
  r.ctl.finishSession();
  assert.equal(r.clock.timers.size(), 0);
});

test('no timer outlives the state it belongs to — the bag is empty when the board is idle', () => {
  const r = rig(viPack(), { stage: 5 });
  buildMeo(r);
  r.clock.advance(60000);
  // The reveal has come and gone; what is left is the ladder and nothing else.
  assert.deepEqual(r.clock.timers.pending().filter((n) => !n.startsWith('ladder')), []);
});

/* ------------------------------------------------------------------- English */

test('D7 / D8 — English plays the long clip once per session, then the short one', () => {
  const r = rig(enPack(), { stage: 5 });
  const pack = r.pack;
  const long = identityMedia(pack.tileById.letter.c.audio.long.src);
  const short = identityMedia(pack.tileById.letter.c.audio.short.src);
  r.audio.drain();
  r.ctl.symbolDown('c', 10, 10);
  assert.equal(r.audio.drain()[0].source, long);
  r.ctl.symbolUp('c', 10, 10);
  r.clock.advance(5000);
  r.audio.drain();
  r.ctl.symbolDown('c', 10, 10);
  assert.equal(r.audio.drain()[0].source, short);
  r.ctl.symbolUp('c', 10, 10);
});

test('D9 — inside 900 ms of another tile, even a first touch is short', () => {
  const r = rig(enPack(), { stage: 5 });
  const short = identityMedia(r.pack.tileById.letter.b.audio.short.src);
  tap(r, 'c');
  r.clock.advance(100);
  r.audio.drain();
  r.ctl.symbolDown('b', 10, 10);
  assert.equal(r.audio.drain()[0].source, short);
});

test('the motif is the same file in both modes (F18, R10)', () => {
  const vi = rig(viPack(), { stage: 5 });
  vi.audio.drain();
  buildMeo(vi);
  const a = vi.audio.drain().find((e) => e.ch === 'motif').source;

  const en = rig(enPack(), { stage: 5 });
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
  const r = rig(viPack(), { stage: 5 });
  const eligible = r.game.treeFor(24).eligible.slice(0, 5);
  for (const w of eligible) {
    const s = w.syllables[0];
    tap(r, s.onset ?? '∅');
    tap(r, s.rime);
    tap(r, s.tone);
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
  const r = rig(viPack(), { stage: 5 });
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
  const r = rig(viPack(), { stage: 5 });
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
  const r = rig(viPack(), { stage: 5 });
  const before = r.ctl.getSnapshot().table.cells.map((c) => c.id);
  tap(r, 'm');
  tap(r, 'eo');
  r.ctl.stripDown();
  r.ctl.stripUp(0);
  assert.deepEqual(r.ctl.getSnapshot().table.cells.map((c) => c.id), before,
    'a cell moved, appeared or disappeared');
  // And the engine agrees with the snapshot about what is live.
  const fromEngine = tableView(r.game, r.ctl._engine()).cells.map((c) => c.live);
  assert.deepEqual(r.ctl.getSnapshot().table.cells.map((c) => c.live), fromEngine);
});

test('the table morph publishes one sequence bump per role change, and none per repaint', () => {
  const r = rig(viPack(), { stage: 5 });
  const start = r.ctl.getSnapshot().tableSeq;
  tap(r, 'm');
  assert.equal(r.ctl.getSnapshot().tableSeq, start + 1);
  // A chant emits several times a second; none of those may restart the morph.
  tap(r, 'eo');
  const atTone = r.ctl.getSnapshot().tableSeq;
  r.clock.advance(50);
  assert.equal(r.ctl.getSnapshot().tableSeq, atTone);
});
