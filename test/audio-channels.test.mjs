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

import {
  createChannels, createPlayerBudget, MAX_PLAYERS, PLAYER_FLOOR,
} from '../src/audio/channels.mjs';

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

test('N11 (BOUNDED) — prepare holds the warm set in priority order, inside the bound', () => {
  const r = rig();
  r.audio.prepare(['a', 'b', 'c']);
  assert.deepEqual([...r.players.keys()], ['a', 'b', 'c']);
  assert.equal(r.audio.stats().live, 3);
  r.drain();
  r.audio.prepare(['b', 'c', 'd']);
  // Nothing was decoded twice, and nothing was thrown away that still fits: the bound is
  // what releases players now, not the shape of the wanted list.
  assert.ok(!r.log.includes('b:remove'));
  assert.ok(!r.log.includes('c:remove'));
  assert.equal(r.audio.stats().live, 4);
});

/**
 * **The literals this file owns.** They are written out here, deliberately, instead of
 * being imported from the source: every other assertion about the bound compares `live`
 * with `MAX_PLAYERS`, and those two move together, so **a bound of 100000 passes all of
 * them**. That is the shape of green check this project keeps catching, and it was caught
 * here too — by injecting a one-token edit to the constant rather than to the code.
 */
const SAFE_CEILING = 32;
const SAFE_FLOOR = 8;

test('N11 — the BOUND ITSELF is inside the range a real device is known to survive', () => {
  // **This is the assertion that argues with the device instead of with a number.**
  //
  // Measured, on the owner's iPhone, 2026-09-24: holding one player per clip for the whole
  // table is **100** for `vi-seed` and **121** for `en-seed`, and the phone went COMPLETELY
  // silent — the bundled seat click included — because every `AVPlayer` construction past
  // AVFoundation's per-process ceiling threw. Nobody on this team owns an iPhone, so the
  // true ceiling has never been measured; 24 is the smallest number that still holds the
  // interactive working set (7 pinned UI + 14 tap clips of a `vi-seed` page + the undo's),
  // and 32 is the highest anyone here can defend without a device in hand.
  //
  // If you are here to raise this constant: a green suite is not permission. The evidence
  // required is a real iPhone playing a round with `failed 0` on the About screen at the
  // higher number. See `acceptance-criteria.md` §0E.
  assert.ok(
    MAX_PLAYERS <= SAFE_CEILING,
    `MAX_PLAYERS is ${MAX_PLAYERS}. A pool of 100 (vi-seed) / 121 (en-seed) was MEASURED to `
    + `silence the owner's iPhone completely, and nobody on this team has a device to find `
    + `the real ceiling with. ${SAFE_CEILING} is the most this test will pass without one.`,
  );
  assert.ok(
    MAX_PLAYERS >= PLAYER_FLOOR && PLAYER_FLOOR >= SAFE_FLOOR,
    `MAX_PLAYERS is ${MAX_PLAYERS} against a floor of ${PLAYER_FLOOR}: below ${SAFE_FLOOR} `
    + 'there is not one player per channel plus a seat click and a tile, and the game stops '
    + 'being able to make its own sounds.',
  );
});

test('N11 — a DEFAULT engine holds at most 32 players, whatever the constant says', () => {
  // The value check above can be argued with; this one cannot. It drives the pool the app
  // actually builds — `createChannels` with no budget, exactly as `audio/engine.js` does —
  // and counts native players against a **literal**. `MAX_PLAYERS = 100000` fails here.
  const log = [];
  let live = 0;
  const audio = createChannels({
    createPlayer: (source) => {
      live += 1;
      const p = recorder(log)(source);
      const remove = p.remove;
      p.remove = () => { live -= 1; remove(); };
      return p;
    },
  });
  for (let i = 0; i < 400; i += 1) {
    audio.playSpeech(`clip${i}`);
    assert.ok(live <= SAFE_CEILING,
      `${live} native players are live. The owner's iPhone was silenced by 100; this test `
      + `will not pass more than ${SAFE_CEILING} without a device that survived them.`);
  }
  audio.prepare(Array.from({ length: 400 }, (_, i) => `warm${i}`));
  assert.ok(live <= SAFE_CEILING,
    `prepare left ${live} native players live, over the ${SAFE_CEILING} this test allows.`);
});

test('N11 (BOUNDED) / T19 — the pool NEVER exceeds the bound, however long he plays', () => {
  // **This is the check that would have caught the iPhone.** The old pool was unbounded:
  // `preloadForTable` asked for 100 players for `vi-seed` and 121 for `en-seed` in one
  // go, every construction past iOS's ceiling failed, and `acquire` returned `null` in
  // silence. Here the pool is driven far past the bound and asserted after every step.
  const r = rig();
  const clips = Array.from({ length: 400 }, (_, i) => `clip${i}`);
  r.audio.prepare(clips.slice(0, 50), { pin: ['ui:seat', 'ui:knock'] });
  assert.ok(r.audio.stats().live <= MAX_PLAYERS,
    `prepare held ${r.audio.stats().live} players, over the bound of ${MAX_PLAYERS}`);
  for (const clip of clips) {
    r.audio.playSpeech(clip);
    assert.ok(r.audio.stats().live <= MAX_PLAYERS,
      `${clip} took the pool to ${r.audio.stats().live}, over the bound of ${MAX_PLAYERS}`);
  }
  // And the pinned UI is still there at the end of it: a seat click that has to be
  // decoded is a seat click he hears after his finger has left the tile (N1).
  assert.equal(r.audio.playUi('ui:seat'), 1);
  assert.ok(!r.log.includes('ui:seat:remove'), 'a pinned UI sound was evicted');
});

test('N11a — a player that will not build is COUNTED and reported, never swallowed', () => {
  // The exact line that hid this bug from every browser run:
  //   try { entry = { player: createPlayer(source), source }; } catch { return null; }
  // A `catch` that returns null with no signal is why finding it needed a device.
  const log = [];
  const audio = createChannels({
    createPlayer: (source) => {
      if (String(source).startsWith('bad')) throw new Error('AVPlayer: out of rendering resources');
      return recorder(log)(source);
    },
  });
  assert.equal(audio.playSpeech('bad:meo'), 0);
  const stats = audio.stats();
  assert.equal(stats.failed, 2, 'the construction and its retry were not both counted');
  assert.equal(stats.silenced, 1, 'a request that made no sound was not counted');
  assert.match(stats.lastError, /rendering resources/, 'the error was not kept for the owner to read');
  // And the engine keeps working for everything that can be built: T15 — the game is
  // completable with no sound at all, so one dead clip may not take the app down.
  assert.equal(audio.playSpeech('good'), 1);
});

test('N11a — a failed construction LOWERS the ceiling, and the app plays on', () => {
  // Nobody on this team has an iPhone, so 24 is a judgement and not a measurement. If the
  // real ceiling is lower, the app has to find that out for itself rather than go silent.
  let ceiling = 10;
  const log = [];
  let live = 0;
  const audio = createChannels({
    createPlayer: (source) => {
      if (live >= ceiling) throw new Error('out of rendering resources');
      live += 1;
      const p = recorder(log)(source);
      const remove = p.remove;
      p.remove = () => { live -= 1; remove(); };
      return p;
    },
  });
  for (let i = 0; i < 40; i += 1) audio.playSpeech(`c${i}`);
  const stats = audio.stats();
  assert.ok(stats.failed > 0, 'the fake device never refused a player');
  // **Absolute, against the device's real limit rather than against the constant.**
  // `stats.max < MAX_PLAYERS` was the assertion here first, and it is vacuous: raise
  // `MAX_PLAYERS` to 100000 and a ceiling of 9 is still "less than". What has to be true
  // is that the app converged on what THIS device allows, whatever it started from.
  assert.ok(stats.max <= ceiling,
    `the ceiling settled at ${stats.max} on a device that allows ${ceiling}: it did not come down`);
  assert.ok(stats.max >= SAFE_FLOOR, `the ceiling fell below the floor: ${stats.max}`);
  assert.ok(PLAYER_FLOOR >= SAFE_FLOOR, `PLAYER_FLOOR is ${PLAYER_FLOOR}, below ${SAFE_FLOOR}`);
  assert.ok(live <= ceiling, `${live} players are live on a device that allows ${ceiling}`);
  // The last request was heard: the point of lowering the ceiling is that the game comes
  // back, quieter, instead of staying mute for the rest of the session.
  assert.equal(audio.playSpeech('after-the-storm'), 1);
});

test('N11 — two engines share one budget, because iOS counts players per PROCESS', () => {
  // The chooser's engine and the game's engine are two objects and one resource. The
  // chooser's `mèo` was the one clip that still worked on the owner's phone, precisely
  // because it was built before the pack asked for a hundred more.
  const budget = createPlayerBudget(6);
  const log = [];
  const chooser = createChannels({ createPlayer: recorder(log), budget });
  const game = createChannels({ createPlayer: recorder(log), budget });
  chooser.playSpeech('sample:meo');
  for (let i = 0; i < 30; i += 1) game.playSpeech(`tile${i}`);
  assert.ok(budget.stats().live <= 6, `${budget.stats().live} players live against a budget of 6`);
  assert.equal(chooser.stats().max, game.stats().max, 'the two engines disagree about the ceiling');
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
