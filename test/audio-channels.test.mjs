// **The cut rule, driven against the real implementation.** `ui.md` §11.2, AC N3, N3a,
// N3b, N3c, N3d, F19, A15, N10, R6.
//
// **Why this file exists.** For two revisions the cut rule was exercised only through
// `test/helpers/harness.mjs`, a double that implements the rule *itself* — so the suite
// stayed green when the motif's stop was deleted from `src/audio/engine.js`. That was
// caught by injecting the fault (`development-process.md` §5) and it is the reason the
// channel logic now lives in `src/audio/channels.mjs`, with the player injected: the
// rule is the app's, and the app's version of it is what is tested here.
//
// The player double records **every call, in order**, because the rule is about order:
// `pause()` then `seekTo(0)` on the outgoing player, *then* `seekTo(0)` + `play()` on the
// incoming one, in the same call.

import test from 'node:test';
import assert from 'node:assert/strict';

import { createChannels } from '../src/audio/channels.mjs';

/** A player that plays nothing and remembers everything. */
function recorder(log) {
  return (source) => {
    const me = {
      source,
      playing: false,
      volume: 1,
      pause() { me.playing = false; log.push(`${source}:pause`); },
      seekTo(t) { log.push(`${source}:seek${t}`); },
      setPlaybackRate(r) { log.push(`${source}:rate${r}`); },
      play() { me.playing = true; log.push(`${source}:play`); },
      remove() { log.push(`${source}:remove`); },
    };
    return me;
  };
}

function rig() {
  const log = [];
  const players = new Map();
  const createPlayer = (source) => {
    const p = recorder(log)(source);
    players.set(source, p);
    return p;
  };
  const audio = createChannels({ createPlayer });
  return {
    audio,
    log,
    players,
    /** N3a — how many players are un-paused at this instant. */
    unpaused: () => [...players.values()].filter((p) => p.playing).length,
    drain: () => log.splice(0, log.length),
  };
}

test('N3 — a new speech clip cuts the old one: pause, seek, THEN play, in one call', () => {
  const r = rig();
  r.audio.playSpeech('a');
  assert.deepEqual(r.drain(), ['a:seek0', 'a:rate1', 'a:play']);
  r.audio.playSpeech('b');
  // The outgoing player is stopped **before** the incoming one starts. No fade, no
  // crossfade, no duck, no queue.
  assert.deepEqual(r.drain(), ['a:pause', 'a:seek0', 'b:seek0', 'b:rate1', 'b:play']);
});

test('N3a — at most one speech player is ever un-paused', () => {
  const r = rig();
  for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) {
    r.audio.playSpeech(id);
    assert.equal(r.unpaused(), 1, `two speech players are playing after ${id}`);
  }
});

test('N3d — the newest request always wins; nothing is queued or dropped', () => {
  const r = rig();
  r.audio.playSpeech('first');
  r.audio.playSpeech('second');
  r.audio.playSpeech('third');
  assert.equal(r.players.get('third').playing, true);
  assert.equal(r.players.get('first').playing, false);
  assert.equal(r.players.get('second').playing, false);
  // A queue would have replayed the earlier ones; nothing does. `third:play` is the last
  // `play` in the log, so nothing came back for its turn.
  assert.equal(r.log.lastIndexOf('third:play'), r.log.map((e) => e.endsWith(':play')).lastIndexOf(true));
});

test('N3b — a knock, a seat click or a page sound never cuts a speech clip', () => {
  const r = rig();
  r.audio.playSpeech('letter');
  r.drain();
  r.audio.playUi('knock', -9);
  r.audio.playUi('seat');
  r.audio.playUi('page', -6);
  assert.equal(r.players.get('letter').playing, true, 'the UI channel cut speech');
  assert.ok(!r.log.includes('letter:pause'));
  // And the UI channel cuts *itself*, so three clicks do not pile up.
  assert.equal(r.players.get('knock').playing, false);
  assert.equal(r.players.get('page').playing, true);
});

test('F19 (RESTATED) — the motif STOPS speech before it starts; it does not duck it', () => {
  // **This is the assertion the test double could not make.** Revision 2's F19 required
  // tile audio to continue at −18 dB under the motif; speech under music is two voices by
  // specification (`ui.md` §11.0 item 2), and this is its inverse.
  const r = rig();
  r.audio.playSpeech('tone-name');
  r.drain();
  r.audio.playMotif('motif4');
  const log = r.drain();
  assert.deepEqual(log.slice(0, 2), ['tone-name:pause', 'tone-name:seek0'],
    'the motif started without stopping the speech channel');
  assert.ok(log.includes('motif4:play'));
  assert.equal(r.players.get('tone-name').playing, false);
  // Nothing was ducked: the outgoing player's volume is untouched, because it is stopped.
  assert.equal(r.players.get('tone-name').volume, 1);
});

test('the cheer layers OVER the motif — the one voice allowed to overlap anything', () => {
  const r = rig();
  r.audio.playMotif('motif3');
  r.audio.playCheer('cheer');
  assert.equal(r.players.get('motif3').playing, true, 'the cheer cut the motif');
  assert.equal(r.players.get('cheer').playing, true);
  // `gameplay.md` §5.2 — hers, at −3 dBFS, never rate-shifted.
  assert.ok(r.log.includes('cheer:rate1'));
  assert.ok(Math.abs(r.players.get('cheer').volume - 10 ** (-3 / 20)) < 1e-9);
});

test('the motif is never rate-shifted, even when the parent slows the speech', () => {
  const r = rig();
  r.audio.setRate(0.8);
  r.audio.playSpeech('word');
  r.audio.playMotif('motif3');
  assert.ok(r.log.includes('word:rate0.8'), 'the speech rate setting was ignored');
  assert.ok(r.log.includes('motif3:rate1'), 'a slowed motif is a different tune (F18)');
});

test('A15 — `stopAll` is a hard stop on every channel, synchronously', () => {
  const r = rig();
  r.audio.playSpeech('vi-word');
  r.audio.playUi('seat');
  r.audio.playMotif('motif4');
  r.audio.playCheer('cheer');
  r.drain();
  r.audio.stopAll();
  assert.equal(r.unpaused(), 0, 'something was still playing after a language switch');
  // Not a fade: nothing was stepped down, it was paused and rewound.
  const log = r.drain();
  assert.ok(log.every((e) => e.endsWith(':pause') || e.endsWith(':seek0')), log.join(' '));
});

test('N10 — mute silences everything and the app keeps running', () => {
  const r = rig();
  r.audio.setMuted(true);
  r.drain();
  assert.equal(r.audio.playSpeech('a'), 0, 'a muted request reported that it played');
  assert.deepEqual(r.drain(), [], 'something was played while muted');
  r.audio.setMuted(false);
  assert.equal(r.audio.playSpeech('a'), 1);
});

test('N11 / T19 — prepare holds exactly the wanted clips and releases the rest', () => {
  const r = rig();
  r.audio.prepare(['a', 'b', 'c']);
  assert.deepEqual([...r.players.keys()], ['a', 'b', 'c']);
  r.drain();
  r.audio.prepare(['b', 'c', 'd']);
  // `a` is gone; `b` and `c` were not decoded twice.
  assert.ok(r.log.includes('a:remove'));
  assert.ok(!r.log.includes('b:remove'));
  assert.equal(r.log.filter((e) => e === 'd:remove').length, 0);
});

test('a clip that is playing is never evicted under itself', () => {
  const r = rig();
  r.audio.playSpeech('holding');
  r.audio.prepare(['something-else']);
  assert.equal(r.players.get('holding').playing, true, 'prepare removed the player mid-clip');
});

test('R6 — dispose releases every handle and the engine goes quiet for good', () => {
  const r = rig();
  r.audio.prepare(['a', 'b']);
  r.audio.playSpeech('a');
  r.drain();
  r.audio.dispose();
  assert.ok(r.log.includes('a:remove') && r.log.includes('b:remove'));
  r.drain();
  assert.equal(r.audio.playSpeech('a'), 0, 'a disposed engine still plays');
  assert.deepEqual(r.drain(), []);
});

test('H14 / R6 — the fade is the one timer this module owns, and dispose clears it', () => {
  // `gameplay.md` §6.3's 800 ms fade is stepped with `setInterval`, which is the only
  // timer outside `state/timers.mjs` in the whole app. A timer that outlives the object
  // that made it is the defect `development-process.md` §3 exists to prevent, so the
  // clear is asserted rather than assumed — by counting the real thing.
  const realSet = globalThis.setInterval;
  const realClear = globalThis.clearInterval;
  const live = new Set();
  globalThis.setInterval = (fn, ms) => { const h = realSet(fn, ms); live.add(h); return h; };
  globalThis.clearInterval = (h) => { live.delete(h); return realClear(h); };
  try {
    const r = rig();
    r.audio.playSpeech('word');
    r.audio.fadeOut(800, () => {});
    assert.equal(live.size, 1, 'the fade scheduled nothing');
    r.audio.dispose();
    assert.equal(live.size, 0, 'the fade timer outlived dispose');

    // And a second fade does not leave the first one running.
    const s = rig();
    s.audio.fadeOut(800, () => {});
    s.audio.fadeOut(800, () => {});
    assert.equal(live.size, 1, 'two fades are stepping the same volume');
    s.audio.dispose();
    assert.equal(live.size, 0);
  } finally {
    for (const h of live) realClear(h);
    globalThis.setInterval = realSet;
    globalThis.clearInterval = realClear;
  }
});

test('a source of null is silence, not a crash', () => {
  const r = rig();
  assert.equal(r.audio.playSpeech(null), 0);
  assert.equal(r.audio.playUi(undefined), 0);
  assert.deepEqual(r.drain(), []);
});

test('a player that throws on creation costs one clip, not the app', () => {
  const log = [];
  const audio = createChannels({
    createPlayer: (source) => {
      if (source === 'broken') throw new Error('no decoder');
      return recorder(log)(source);
    },
  });
  assert.equal(audio.playSpeech('broken'), 0);
  assert.equal(audio.playSpeech('fine'), 1);
});
