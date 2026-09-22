// `acceptance-criteria.md` B12, and the reason `development-process.md` §3 calls
// determinism load-bearing: **same seed plus same taps must produce the same rounds,
// palettes and outcomes**, or the tester cannot replay a failure and the whole
// verification strategy collapses.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, reduce, bandInstances, seedFrom } from '../src/engine/index.mjs';
import { viPack, enPack } from './helpers/load.mjs';
import { nextInt } from '../src/engine/rng.mjs';

/**
 * A scripted player. Every decision comes out of its own PRNG, so the *taps* are fixed
 * and the engine's own randomness is the only thing under test.
 */
function playScript(pack, seed, script, steps) {
  let s = createSession(pack, { seed });
  const trace = [];
  let cursor = 0;
  for (let i = 0; i < steps; i += 1) {
    trace.push(snapshot(pack, s));
    if (s.phase === 'ended' || s.phase === 'empty') break;
    if (s.phase === 'album') { s = reduce(pack, s, { type: 'nextPage' }); continue; }
    const round = s.round;
    if (round.status === 'settling') { s = reduce(pack, s, { type: 'settle' }); continue; }
    if (round.status === 'resolving') { s = reduce(pack, s, { type: 'advance' }); continue; }

    const choice = script[cursor % script.length];
    cursor += 1;
    const band = bandInstances(pack, s);
    const seated = round.cells.filter((c) => c.tileId !== null);
    if (choice % 7 === 0 && seated.length > 0) {
      s = reduce(pack, s, { type: 'tapCell', cellIndex: seated[choice % seated.length].index });
    } else if (choice % 23 === 0) {
      s = reduce(pack, s, { type: 'autoPlace' });
    } else if (band.length > 0) {
      s = reduce(pack, s, { type: 'tapTile', instanceId: band[choice % band.length].id });
    } else {
      s = reduce(pack, s, { type: 'tapFrame' });
    }
  }
  return trace;
}

function snapshot(pack, s) {
  return JSON.stringify({
    phase: s.phase,
    stage: s.globalStage,
    progress: s.stageProgress,
    rng: s.rng,
    bag: s.bag,
    page: s.page.entries.map((e) => e.wordId),
    album: s.album.map((e) => [e.wordId, e.image && e.image.src]),
    round: s.round && {
      id: s.round.id,
      target: s.round.targetId,
      stage: s.round.stage,
      status: s.round.status,
      outcome: s.round.outcome && [s.round.outcome.kind, s.round.outcome.wordId],
      cells: s.round.cells.map((c) => [c.role, c.tileId, c.instanceId]),
      palette: JSON.stringify(s.round.palette),
      placements: s.round.placements,
      assists: s.round.assists,
    },
  });
}

/** A fixed sequence of "which tile did his finger land on" decisions. */
function makeScript(seed, n) {
  let r = seedFrom(seed);
  const out = [];
  for (let i = 0; i < n; i += 1) { const [next, v] = nextInt(r, 97); r = next; out.push(v); }
  return out;
}

test('the same seed and the same taps replay identically (B12)', () => {
  for (const pack of [viPack(), enPack()]) {
    for (const seed of ['alpha', 'beta', 'ghép chữ', 17, '']) {
      const script = makeScript(`${seed}-taps`, 200);
      const a = playScript(pack, seed, script, 300);
      const b = playScript(pack, seed, script, 300);
      assert.equal(a.length, b.length, `${pack.language}/${seed}: trace lengths differ`);
      for (let i = 0; i < a.length; i += 1) {
        assert.equal(a[i], b[i], `${pack.language}/${seed}: diverged at step ${i}`);
      }
    }
  }
});

test('a different seed produces a different game — the replay is not trivially true', () => {
  const pack = viPack();
  const script = makeScript('same-taps', 200);
  const a = playScript(pack, 'seed-a', script, 60);
  const b = playScript(pack, 'seed-b', script, 60);
  assert.notDeepEqual(a, b);
});

test('a different tap sequence produces a different game', () => {
  const pack = enPack();
  const a = playScript(pack, 'fixed', makeScript('taps-1', 200), 60);
  const b = playScript(pack, 'fixed', makeScript('taps-2', 200), 60);
  assert.notDeepEqual(a, b);
});

test('the reducer never mutates the state it was given', () => {
  const pack = viPack();
  let s = createSession(pack, { seed: 'immutable' });
  const script = makeScript('immutable-taps', 120);
  for (let i = 0; i < 120; i += 1) {
    const before = snapshot(pack, s);
    const band = bandInstances(pack, s);
    const action = s.phase !== 'playing' ? { type: 'nextPage' }
      : s.round.status === 'settling' ? { type: 'settle' }
        : s.round.status === 'resolving' ? { type: 'advance' }
          : band.length ? { type: 'tapTile', instanceId: band[script[i] % band.length].id }
            : { type: 'tapFrame' };
    const next = reduce(pack, s, action);
    assert.equal(snapshot(pack, s), before, `step ${i}: ${action.type} mutated the input state`);
    s = next;
  }
});

test('the session records the seed it was created from, so a failure can be replayed', () => {
  const pack = viPack();
  const s = createSession(pack, { seed: 'record-me' });
  assert.equal(s.seed, seedFrom('record-me'));
  assert.equal(typeof s.seed, 'number');
});
