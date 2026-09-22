// The state layer, driven headlessly.
//
// Every timer in this app lives in `src/state/gameController.js`, and this is where the
// clock is fake and the assertions are about *when*. `acceptance-criteria.md` §F (the
// reveal's timeline), §G (the idle ladder), §N (the audio rules) and §T (what a toddler
// actually does) are wall-clock criteria; the engine cannot hold them and a renderer
// cannot prove them.

import test from 'node:test';
import assert from 'node:assert/strict';

import { createGameController, planResolution, stepDurationMs, clipVariant } from '../src/state/gameController.mjs';
import { langFor } from '../src/engine/index.mjs';
import { readFileSync } from 'node:fs';
import { REVEAL, LADDER, HOLD, TAP, M } from '../src/motion/durations.mjs';
import { viPack, enPack } from './helpers/load.mjs';
import { createFakeClock, createFakeAudio, identityMedia } from './helpers/harness.mjs';

const SETTINGS = { showWord: true, mute: false, rate: 1, saySentence: true, reduceMotion: false };

function rig(pack, over = {}) {
  const clock = createFakeClock();
  const audio = createFakeAudio();
  const ctl = createGameController({
    pack,
    seed: over.seed ?? 'controller',
    mediaSource: identityMedia,
    audio,
    settings: { ...SETTINGS, ...(over.settings ?? {}) },
    timers: clock.timers,
    now: clock.now,
    onSessionEnd: over.onSessionEnd,
  });
  return { ctl, clock, audio, pack, lang: langFor(pack.language) };
}

/** Tap a band instance the way a finger does: down, then up, in the same place. */
function tapTile(r, instanceId) {
  r.ctl.tileDown(instanceId, 10, 10);
  r.ctl.tileUp(instanceId, 10, 10);
}

function bandInstanceFor(r, tileId) {
  return r.ctl.getSnapshot().band.find((i) => i.tileId === tileId);
}

/** Play the current round correctly, one correct tile at a time. */
function solveRound(r) {
  let guard = 0;
  for (;;) {
    const snap = r.ctl.getSnapshot();
    if (!snap.round || snap.round.status !== 'building') return;
    const next = snap.round.cells.find((c) => c.tileId === null);
    if (!next) return;
    const inst = bandInstanceFor(r, next.expect);
    assert.ok(inst, `"${next.expect}" was not in the band`);
    tapTile(r, inst.id);
    assert.ok(guard++ < 16, 'solveRound did not terminate');
  }
}

/* ------------------------------------------------------------------ pure helpers */

test('clipVariant: long on the first touch, short after, always short inside 900 ms (D7–D9)', () => {
  assert.equal(clipVariant(true, false), 'long');
  assert.equal(clipVariant(false, false), 'short');
  assert.equal(clipVariant(true, true), 'short', 'a burst is six short clips, not six long ones');
  assert.equal(clipVariant(false, true), 'short');
});

test('planResolution splits the chant from the reveal at the word step', () => {
  for (const pack of [viPack(), enPack()]) {
    const lang = langFor(pack.language);
    const word = pack.words[0];
    const plan = planResolution(lang.chant(pack, word));
    assert.ok(plan.word, 'the word step is the reveal, not a chant step');
    assert.ok(!plan.timeline.some((e) => e.step.step === 'word'));
    assert.equal(plan.timeline[0].at, 0);
    assert.equal(plan.totalMs, plan.timeline.reduce((n, e) => n + stepDurationMs(e.step), 0));
  }
});

/* ------------------------------------------------------------------ the round */

test('a controller opens straight into round 1 with an unlit board (B1, B2, H1)', () => {
  for (const pack of [viPack(), enPack()]) {
    const r = rig(pack);
    const snap = r.ctl.getSnapshot();
    assert.equal(snap.phase, 'playing');
    assert.equal(snap.status, 'building');
    assert.equal(snap.lit.filter(Boolean).length, 0);
    assert.equal(snap.veil, 0.16, 'the prompt photo sits under a 0.16 veil');
    assert.deepEqual(snap.rail, [false, false, false, false, false]);
    assert.ok(snap.band.length > 0);
    r.ctl.destroy();
  }
});

test('a correct placement lights one segment and steps the veil down by 0.16/N (E1)', () => {
  const pack = enPack();
  const r = rig(pack);
  const snap = r.ctl.getSnapshot();
  const n = snap.round.cells.length;
  const first = bandInstanceFor(r, snap.round.cells[0].expect);
  tapTile(r, first.id);
  const after = r.ctl.getSnapshot();
  assert.equal(after.lit.filter(Boolean).length, 1);
  assert.ok(Math.abs(after.veil - (0.16 - 0.16 / n)) < 1e-9, `veil ${after.veil}`);
  r.ctl.destroy();
});

test('an incorrect placement seats, sounds, and does nothing else (E2, E3)', () => {
  const pack = enPack();
  const r = rig(pack);
  const snap = r.ctl.getSnapshot();
  const wrong = snap.band.find((i) => i.tileId !== snap.round.cells[0].expect);
  const veilBefore = snap.veil;
  r.audio.drain();
  tapTile(r, wrong.id);
  const after = r.ctl.getSnapshot();
  assert.equal(after.round.cells[0].tileId, wrong.tileId, 'the tile seats and stays');
  assert.equal(after.lit.filter(Boolean).length, 0, 'no segment');
  assert.equal(after.veil, veilBefore, 'no veil step');
  const played = r.audio.drain();
  assert.equal(played.length, 1, 'the tile’s own sound and nothing else');
  assert.equal(played[0].ch, 'tile');
  r.ctl.destroy();
});

test('the sound fires on touch-DOWN, not on touch-up (N1)', () => {
  const pack = enPack();
  const r = rig(pack);
  const inst = r.ctl.getSnapshot().band[0];
  r.audio.drain();
  r.ctl.tileDown(inst.id, 0, 0);
  assert.equal(r.audio.drain().length, 1, 'nothing may wait for the finger to lift');
  r.ctl.tileUp(inst.id, 0, 0);
  r.ctl.destroy();
});

test('the first touch owns the gesture; a second finger is ignored (T4)', () => {
  const pack = enPack();
  const r = rig(pack);
  const [a, b] = r.ctl.getSnapshot().band;
  r.audio.drain();
  r.ctl.tileDown(a.id, 0, 0);
  r.ctl.tileDown(b.id, 40, 0);
  assert.equal(r.audio.drain().length, 1, 'two fingers, one sound');
  r.ctl.tileUp(b.id, 40, 0);
  assert.equal(r.ctl.getSnapshot().round.cells.filter((c) => c.tileId !== null).length, 0,
    'the non-owner cannot place');
  r.ctl.tileUp(a.id, 0, 0);
  assert.equal(r.ctl.getSnapshot().round.cells.filter((c) => c.tileId !== null).length, 1,
    'two fingers, one seated tile');
  r.ctl.destroy();
});

test('a hold is not a tap, and a drag seats nothing (N7, T5)', () => {
  const pack = enPack();
  const r = rig(pack);
  const inst = r.ctl.getSnapshot().band[0];

  r.ctl.tileDown(inst.id, 0, 0);
  r.clock.advance(TAP.maxMs + 50);
  r.ctl.tileUp(inst.id, 0, 0);
  assert.equal(r.ctl.getSnapshot().round.cells.filter((c) => c.tileId !== null).length, 0,
    'held past 600 ms — nothing is placed');

  r.ctl.tileDown(inst.id, 0, 0);
  r.ctl.tileUp(inst.id, TAP.maxSlopPt + 10, 0);
  assert.equal(r.ctl.getSnapshot().round.cells.filter((c) => c.tileId !== null).length, 0,
    'a finger that travelled 34 pt seats nothing');
  r.ctl.destroy();
});

test('holding past 600 ms repeats the short clip every 700 ms, at most six times (N5, N6)', () => {
  const pack = enPack();
  const r = rig(pack);
  const inst = r.ctl.getSnapshot().band[0];
  r.audio.drain();
  r.ctl.tileDown(inst.id, 0, 0);
  assert.equal(r.audio.drain().length, 1, 'the touch-down clip');
  r.clock.advance(HOLD.startMs + HOLD.repeatMs * 20);
  const repeats = r.audio.drain().filter((e) => e.ch === 'tile').length;
  assert.equal(repeats, HOLD.maxRepeats, `${repeats} repeats`);
  r.clock.advance(30000);
  assert.equal(r.audio.drain().filter((e) => e.ch === 'tile').length, 0,
    'held for 30 s — the tile audio has stopped (the idle ladder is a separate voice)');
  r.ctl.tileUp(inst.id, 0, 0);
  assert.equal(r.ctl.getSnapshot().round.cells.filter((c) => c.tileId !== null).length, 0,
    'on release nothing is placed');
  r.ctl.destroy();
});

test('a tile touched twice plays long then short; a burst is all short (D7, D8, D9)', () => {
  const pack = enPack();
  const r = rig(pack);
  const lang = r.lang;
  const snap = r.ctl.getSnapshot();
  const inst = snap.band[0];
  const tile = pack.tileById.letter[inst.tileId];

  r.audio.drain();
  r.ctl.tileDown(inst.id, 0, 0);
  assert.equal(r.audio.drain()[0].source, identityMedia(tile.audio.long.src));
  r.ctl.tileUp(inst.id, 0, 0);

  // Same tile again, immediately — inside the 900 ms window, so short either way.
  const again = r.ctl.getSnapshot().band[0];
  r.ctl.tileDown(again.id, 0, 0);
  const second = r.audio.drain()[0];
  assert.equal(second.source, identityMedia(pack.tileById.letter[again.tileId].audio.short.src));
  r.ctl.tileUp(again.id, 0, 0);
  assert.ok(lang.id === 'en');
  r.ctl.destroy();
});

/* ------------------------------------------------------------------ the reveal */

test('the reveal timeline is F1–F6, to the millisecond', () => {
  const pack = enPack();
  const r = rig(pack);
  solveRound(r);
  assert.equal(r.ctl.getSnapshot().status, 'resolving');

  const steps = planResolution(r.lang.chant(pack, pack.words.find((w) => w.id === r.ctl.getSnapshot().round.outcome.wordId)));
  r.audio.drain();
  r.clock.advance(steps.totalMs);        // the chant runs, then the reveal starts at t=0
  const atZero = r.ctl.getSnapshot();
  assert.ok(atZero.reveal, 'the reveal has begun');
  assert.equal(atZero.reveal.phase, 'running');
  assert.equal(atZero.reveal.photoSwapped, false);

  r.clock.advance(REVEAL.photoSwap);
  assert.equal(r.ctl.getSnapshot().reveal.photoSwapped, true, 'F2: the photo swaps at 180 ms');

  r.audio.drain();
  r.clock.advance(REVEAL.speak - REVEAL.photoSwap);
  assert.equal(r.audio.drain().filter((e) => e.ch === 'speech').length, 1, 'F3: spoken at 600 ms');

  r.clock.advance(REVEAL.motionEnds - REVEAL.speak);
  assert.equal(r.ctl.getSnapshot().reveal.phase, 'held', 'F3: motion ends by 1400 ms');

  r.audio.drain();
  r.clock.advance(REVEAL.sayItTogether - REVEAL.motionEnds - 1);
  assert.equal(r.audio.drain().length, 0, 'F4: silence from 1400 to 2200 ms');
  r.clock.advance(1);
  assert.equal(r.audio.drain().filter((e) => e.ch === 'speech').length, 1, 'F4: spoken again at 2200');

  r.clock.advance(REVEAL.autoAdvance - REVEAL.sayItTogether - 1);
  assert.equal(r.ctl.getSnapshot().rail.filter(Boolean).length, 0, 'F6: not yet');
  r.clock.advance(1);
  assert.equal(r.ctl.getSnapshot().rail.filter(Boolean).length, 1, 'F6: the next round at 3000 ms');
  r.ctl.destroy();
});

test('tapping the held reveal replays the word and restarts the 3 s hold (F5, T12)', () => {
  const pack = enPack();
  const r = rig(pack);
  solveRound(r);
  r.clock.advance(10000 - REVEAL.autoAdvance + 1); // long enough for the chant + hold
  // Re-solve: the first round has advanced. Do it properly instead.
  r.ctl.destroy();

  const r2 = rig(pack);
  solveRound(r2);
  const plan = planResolution(r2.lang.chant(pack, pack.words.find((w) => w.id === r2.ctl.getSnapshot().round.outcome.wordId)));
  r2.clock.advance(plan.totalMs + REVEAL.motionEnds);
  assert.equal(r2.ctl.getSnapshot().reveal.phase, 'held');

  for (let i = 0; i < 30; i += 1) {
    r2.clock.advance(100);
    r2.audio.drain();
    r2.ctl.tapReveal();
    assert.equal(r2.audio.drain().filter((e) => e.ch === 'speech').length, 1,
      'one replay per tap, no pile-up');
    assert.equal(r2.ctl.getSnapshot().rail.filter(Boolean).length, 0, 'the round is still held');
  }
  r2.clock.advance(REVEAL.autoAdvance);
  assert.equal(r2.ctl.getSnapshot().rail.filter(Boolean).length, 1,
    'the next round begins after the last tap plus 3000 ms');
  r2.ctl.destroy();
});

test('the next round’s clips are decoded during this round’s celebration (N11)', () => {
  const pack = viPack();
  const r = rig(pack);
  const firstRoundClips = r.audio.prepared().length;
  assert.ok(firstRoundClips > 0);
  solveRound(r);
  const plan = planResolution(r.lang.chant(pack, pack.words.find((w) => w.id === r.ctl.getSnapshot().round.outcome.wordId)));
  const before = r.audio.prepared();
  r.clock.advance(plan.totalMs + 1);
  const after = r.audio.prepared();
  assert.notDeepEqual(after, before, 'the celebration preloads the next round, not the current one');
  assert.ok(after.length > 0);
  r.ctl.destroy();
});

/* ------------------------------------------------------------- the idle ladder */

test('the idle ladder is 20 / 40 / 60 / 80 s and every round completes (G2–G6)', () => {
  const pack = viPack();
  const r = rig(pack);
  r.audio.drain();

  r.clock.advance(LADDER.step - 1);
  assert.equal(r.audio.drain().length, 0);
  r.clock.advance(1);
  assert.equal(r.audio.drain().filter((e) => e.ch === 'speech').length, 1,
    'G2: the word is spoken again at 20 s');

  r.clock.advance(LADDER.step);
  assert.equal(r.ctl.getSnapshot().hintLevel, 2, 'G3: the correct tile breathes at 40 s');
  assert.ok(r.ctl.getSnapshot().hintInstanceId, 'and the presentation is told which one');

  r.clock.advance(LADDER.step);
  assert.equal(r.ctl.getSnapshot().hintLevel, 3, 'G4: a steady rim at 60 s');

  const seatedBefore = r.ctl.getSnapshot().round.cells.filter((c) => c.tileId !== null).length;
  r.clock.advance(LADDER.step);
  const afterAuto = r.ctl.getSnapshot();
  assert.equal(afterAuto.round.cells.filter((c) => c.tileId !== null).length, seatedBefore + 1,
    'G5: the tile flies into place by itself at 80 s');
  assert.equal(afterAuto.lastPlacement.assist, true);
  assert.equal(afterAuto.hintLevel, 0, 'G6: the ladder restarts for the next cell');

  // And it keeps going until the round is finished — there is no state that waits for ever.
  for (let i = 0; i < 6; i += 1) r.clock.advance(LADDER.step * 4);
  assert.ok(r.ctl.getSnapshot().rail.filter(Boolean).length >= 1, 'the round completed by itself');
  r.ctl.destroy();
});

test('a correct placement resets the ladder; a wrong one only defers it 4 s (G7, G8, G9)', () => {
  const pack = enPack();
  const r = rig(pack);

  r.clock.advance(LADDER.step - 2000);
  const wrong = r.ctl.getSnapshot().band.find((i) => i.tileId !== r.ctl.getSnapshot().round.cells[0].expect);
  r.audio.drain();
  tapTile(r, wrong.id);
  r.clock.advance(2000);
  assert.equal(r.audio.drain().filter((e) => e.ch === 'speech').length, 0,
    'G9: no escalation within 4 s of a touch');
  r.clock.advance(2000);
  assert.equal(r.audio.drain().filter((e) => e.ch === 'speech').length, 1,
    'G8: but the ladder did not restart — it only slipped 4 s');

  // Now a correct one.
  const snap = r.ctl.getSnapshot();
  const empty = snap.round.cells.find((c) => c.tileId === null);
  const right = r.ctl.getSnapshot().band.find((i) => i.tileId === empty.expect);
  tapTile(r, right.id);
  r.audio.drain();
  r.clock.advance(LADDER.step - 1);
  assert.equal(r.audio.drain().filter((e) => e.ch === 'speech').length, 0, 'G7: reset to 0');
  r.ctl.destroy();
});

test('an auto-place flies for 420 ms, not the 260 ms of his own tap (O8)', () => {
  assert.equal(M.autoPlaceFly, 420);
  assert.equal(M.flight, 260);
  assert.ok(M.autoPlaceFly > M.flight);
});

/* ---------------------------------------------------------------- the settle */

test('a not-a-word combination rocks, reads back, and tidies itself (E7, E8, E9)', () => {
  const pack = enPack();
  const r = rig(pack);
  // Fill every slot with the wrong tile wherever possible.
  let guard = 0;
  for (;;) {
    const snap = r.ctl.getSnapshot();
    if (!snap.round || snap.round.status !== 'building') break;
    const empty = snap.round.cells.find((c) => c.tileId === null);
    if (!empty) break;
    const inst = snap.band.find((i) => i.tileId !== empty.expect) ?? snap.band[0];
    tapTile(r, inst.id);
    assert.ok(guard++ < 16);
  }
  const settling = r.ctl.getSnapshot();
  if (settling.status !== 'settling') {
    // He built a different real word — that is a found-word win, covered elsewhere.
    r.ctl.destroy();
    return;
  }
  const rockBefore = settling.rockSeq;
  assert.ok(rockBefore > 0, 'the plate rocks');

  r.clock.advance(60000);
  const after = r.ctl.getSnapshot();
  assert.equal(after.status, 'building', 'the board is back in a valid partial state');
  assert.ok(after.round.cells.some((c) => c.tileId === null), 'the wrong tiles went home');
  for (let i = 0; i < after.round.cells.length; i += 1) {
    if (after.round.cells[i].tileId !== null) {
      assert.equal(after.lit[i], true, 'every tile still seated is a lit one');
    }
  }
  r.ctl.destroy();
});

/* ------------------------------------------------------- session and lifecycle */

test('five rounds reach the album, and play does not resume by itself (H3, H6)', () => {
  const pack = viPack();
  const r = rig(pack);
  for (let i = 0; i < 5; i += 1) {
    solveRound(r);
    r.clock.advance(20000);
  }
  const album = r.ctl.getSnapshot();
  assert.equal(album.phase, 'album');
  assert.equal(album.page.length, 5);
  r.clock.advance(120000);
  assert.equal(r.ctl.getSnapshot().phase, 'album', 'nothing resumes by itself');
  r.ctl.nextPage();
  assert.equal(r.ctl.getSnapshot().phase, 'playing');
  assert.deepEqual(r.ctl.getSnapshot().rail, [false, false, false, false, false]);
  r.ctl.destroy();
});

test('finishing the session fades the audio and reaches a screen with no way back (H8–H10)', () => {
  const pack = enPack();
  let ended = false;
  const r = rig(pack, { onSessionEnd: () => { ended = true; } });
  solveRound(r);
  r.audio.drain();
  r.ctl.finishSession();
  const log = r.audio.drain();
  assert.ok(log.some((e) => e.ch === 'fadeOut' && e.ms === 800), JSON.stringify(log));
  assert.ok(ended);
  assert.equal(r.ctl.getSnapshot().phase, 'ended');
  r.ctl.nextPage();
  r.ctl.tapReveal();
  r.clock.advance(120000);
  assert.equal(r.ctl.getSnapshot().phase, 'ended', 'nothing on this screen starts play');
  r.ctl.destroy();
});

test('destroy() leaves no timer pending and no audio handle open (A10, R6, T16)', () => {
  const pack = viPack();
  const r = rig(pack);
  solveRound(r);
  r.clock.advance(300);
  assert.ok(r.clock.timers.size() > 0, 'there were timers to leak');
  r.ctl.destroy();
  assert.deepEqual(r.clock.timers.pending(), [], 'every timer is cancelled on unmount');
  assert.equal(r.audio.isDisposed(), true);
  // And nothing it might still be holding can move the state afterwards.
  const frozen = r.ctl.getSnapshot();
  r.ctl.tileDown(frozen.band[0] ? frozen.band[0].id : 'x', 0, 0);
  r.ctl.nextPage();
  r.clock.advance(120000);
  assert.deepEqual(r.clock.timers.pending(), []);
});

test('backgrounding mid-chant stops audio and leaves a whole board, never a half-merge (T7)', () => {
  const pack = viPack();
  const r = rig(pack);
  solveRound(r);
  r.clock.advance(120);           // inside the chant
  assert.equal(r.ctl.getSnapshot().status, 'resolving');
  r.audio.drain();
  r.ctl.onBackground();
  assert.ok(r.audio.drain().some((e) => e.ch === 'stopAll'));
  const held = r.ctl.getSnapshot();
  assert.equal(held.reveal.phase, 'held', 'resolved, not half-merged');
  r.ctl.onForeground();
  r.clock.advance(REVEAL.autoAdvance);
  assert.equal(r.ctl.getSnapshot().rail.filter(Boolean).length, 1, 'and it advances normally');
  r.ctl.destroy();
});

test('mute silences the game and the hint ladder still finishes the round (N10, T15)', () => {
  const pack = viPack();
  const r = rig(pack, { settings: { mute: true } });
  r.audio.drain();
  for (let i = 0; i < 20; i += 1) r.clock.advance(LADDER.step);
  const played = r.audio.drain().filter((e) => e.ch === 'tile' || e.ch === 'speech');
  assert.ok(played.length > 0, 'the ladder still fires');
  assert.ok(played.every((e) => e.muted === true), 'and every clip it fires is silenced');
  assert.ok(r.ctl.getSnapshot().rail.filter(Boolean).length >= 1,
    'and the round still completed — the ladder does not need sound');
  r.ctl.destroy();
});

test('`Show the word` off shows one dot per cell and no letters (M1, M2)', () => {
  const pack = viPack();
  const on = rig(pack, { settings: { showWord: true } });
  const off = rig(pack, { settings: { showWord: false } });
  const target = pack.words.find((w) => w.id === on.ctl.getSnapshot().round.targetId);
  assert.equal(on.ctl.getSnapshot().caption, target.text);
  const dots = off.ctl.getSnapshot().caption;
  assert.equal(dots, '·'.repeat(off.ctl.getSnapshot().round.cells.length));
  assert.ok(!/[a-z]/i.test(dots));
  on.ctl.destroy();
  off.ctl.destroy();
});

test('the band shows exactly one Vietnamese row at a time and morphs (C1, C3, C4, C8)', () => {
  const pack = viPack();
  const r = rig(pack);
  const snap = r.ctl.getSnapshot();
  const roles = new Set(snap.band.map((i) => i.role));
  assert.equal(roles.size, 1, 'exactly one role is on screen');
  const firstRole = snap.bandRole;
  const seq = snap.bandSeq;

  const empty = snap.round.cells.find((c) => c.tileId === null);
  tapTile(r, bandInstanceFor(r, empty.expect).id);
  const next = r.ctl.getSnapshot();
  if (next.status === 'building') {
    assert.notEqual(next.bandRole, firstRole, 'the band morphed to the next decision');
    assert.equal(next.bandSeq, seq + 1, 'and the cross-fade has something to key on');
    assert.equal(new Set(next.band.map((i) => i.role)).size, 1);
  }
  r.ctl.destroy();
});

test('no English tile, letter or clip appears in a Vietnamese session (R1, R2)', () => {
  const vi = rig(viPack());
  const en = rig(enPack());
  assert.ok(vi.ctl.getSnapshot().band.every((i) => ['onset', 'rime', 'tone'].includes(i.role)));
  assert.ok(en.ctl.getSnapshot().band.every((i) => i.role === 'letter'));
  assert.ok(en.ctl.getSnapshot().band.every((i) => i.role !== 'tone'), 'D6: role3 is never rendered in English');
  assert.equal(vi.ctl.getSnapshot().language, 'vi');
  assert.equal(en.ctl.getSnapshot().language, 'en');
  vi.ctl.destroy();
  en.ctl.destroy();
});

test('taps during the chant are ignored and place nothing (N8)', () => {
  const pack = enPack();
  const r = rig(pack);
  solveRound(r);
  const during = r.ctl.getSnapshot();
  assert.equal(during.status, 'resolving');
  r.audio.drain();
  r.ctl.tileDown('letter:0:c', 0, 0);
  r.ctl.tapCell(0);
  assert.equal(r.audio.drain().length, 0, 'no tile clip cuts across the chant');
  assert.equal(r.ctl.getSnapshot().status, 'resolving');
  r.ctl.destroy();
});

test('holding the frame for 800 ms speaks the parts and leaves the ladder alone (B6, B7)', () => {
  const pack = viPack();
  const r = rig(pack);
  const ladderBefore = r.ctl._ladder().dueAt;
  r.audio.drain();
  r.ctl.frameDown();
  r.clock.advance(799);
  assert.equal(r.audio.drain().length, 0);
  r.clock.advance(1);
  assert.ok(r.audio.drain().filter((e) => e.ch === 'speech').length >= 1, 'the parts are spoken');
  assert.equal(r.ctl._ladder().dueAt, ladderBefore, 'the idle-hint ladder timer is unchanged');
  r.ctl.frameUp();
  r.ctl.destroy();
});

test('a short tap on the frame replays the whole word (B5)', () => {
  const pack = viPack();
  const r = rig(pack);
  const target = pack.words.find((w) => w.id === r.ctl.getSnapshot().round.targetId);
  r.audio.drain();
  r.ctl.frameDown();
  r.clock.advance(120);
  r.ctl.frameUp();
  const played = r.audio.drain();
  assert.equal(played.length, 1);
  assert.equal(played[0].source, identityMedia(target.audio.word.src));
  r.ctl.destroy();
});

test('200 random taps do not crash, leave the game, or corrupt the board (T10)', () => {
  for (const pack of [viPack(), enPack()]) {
    const r = rig(pack, { seed: 'fuzz-ui' });
    let rng = 12345;
    const rand = (n) => { rng = (rng * 1103515245 + 12345) & 0x7fffffff; return rng % n; };
    for (let i = 0; i < 200; i += 1) {
      const snap = r.ctl.getSnapshot();
      const roll = rand(8);
      if (roll < 4 && snap.band.length) {
        const inst = snap.band[rand(snap.band.length)];
        r.ctl.tileDown(inst.id, rand(400), rand(400));
        if (rand(4) !== 0) r.ctl.tileUp(inst.id, rand(400), rand(400));
        else r.ctl.tileCancel();
      } else if (roll === 4 && snap.round) {
        r.ctl.tapCell(rand(snap.round.cells.length));
      } else if (roll === 5) {
        r.ctl.frameDown();
        r.ctl.frameUp();
      } else if (roll === 6) {
        r.ctl.tapReveal();
      } else {
        r.ctl.nextPage();
      }
      r.clock.advance(rand(900));
    }
    const end = r.ctl.getSnapshot();
    assert.ok(['playing', 'album', 'ended', 'empty'].includes(end.phase));
    assert.notEqual(end.phase, 'ended', 'random taps never end the session — that needs the gate');
    if (end.round) {
      const seated = end.round.cells.map((c) => c.instanceId).filter(Boolean);
      assert.equal(new Set(seated).size, seated.length, 'no tile duplicated');
    }
    r.ctl.destroy();
  }
});

test('the state layer reaches the engine only through its published index (layer seam)', () => {
  // A guard on the seam rather than on a behaviour. Reaching past `index.mjs` into, say,
  // `lang/vi.mjs` would put a rule in layer 2, which is the thing `development-process.md`
  // §3 exists to prevent — and it would not fail any behaviour test for months.
  const src = readFileSync(new URL('../src/state/gameController.mjs', import.meta.url), 'utf8');
  for (const m of src.matchAll(/from\s+'([^']*engine[^']*)'/g)) {
    assert.equal(m[1], '../engine/index.mjs', `state layer imports ${m[1]}`);
  }
  // And it owns no renderer: a React import here would make it untestable in Node, which
  // is how a state layer stops being tested.
  assert.ok(!/from\s+'react/.test(src), 'the state layer must not import React');
});
