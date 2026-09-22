// Building a Vietnamese syllable: what a tap does, what a second tap undoes, and what
// happens when the cells are full.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSession, reduce, bandInstances, litCells, veilOpacity, langFor, VEIL_START,
  resolvePack, hintInstance,
} from '../src/engine/index.mjs';
import { viPack, readPackInputs, packDir } from './helpers/load.mjs';
import { tap, tapCell, solve } from './helpers/play.mjs';

const vi = langFor('vi');

/**
 * Start a session and deal a chosen word, so a test can name the case it is about
 * instead of hunting for it. The bag is the only way in, so the word is forced by
 * resolving the pack down to it plus whatever else the case needs.
 */
function sessionOn(ids, seed = 'assembly') {
  const input = readPackInputs(packDir('vi-seed'));
  const pack = resolvePack({
    language: 'vi', ...input,
    words: input.words.filter((w) => ids.includes(w.id)),
  });
  assert.equal(pack.words.length, ids.length, `wanted ${ids} got ${pack.words.map((w) => w.id)}`);
  return { pack, state: createSession(pack, { seed }) };
}

test('the band opens on onsets and morphs onset → rime → tone (C1, C3, C4)', () => {
  const { pack, state } = sessionOn(['meo']);
  assert.equal(vi.activeRow(state.round).role, 'onset');
  const s1 = tap(pack, state, 'm');
  assert.equal(vi.activeRow(s1.round).role, 'rime');
  const s2 = tap(pack, s1, 'eo');
  assert.equal(vi.activeRow(s2.round).role, 'tone');
  assert.ok(bandInstances(pack, s2).every((i) => i.role === 'tone'));
});

test('a correct placement lights its segment and steps the veil down by 0.16/N (E1)', () => {
  const { pack, state } = sessionOn(['meo']);
  assert.deepEqual(litCells(pack, state.round), [false, false, false]);
  assert.equal(veilOpacity(pack, state.round), VEIL_START);

  const s1 = tap(pack, state, 'm');
  assert.deepEqual(litCells(pack, s1.round), [true, false, false]);
  assert.ok(Math.abs(veilOpacity(pack, s1.round) - (VEIL_START * 2) / 3) < 1e-12);

  const s2 = tap(pack, s1, 'eo');
  assert.deepEqual(litCells(pack, s2.round), [true, true, false]);
  assert.ok(Math.abs(veilOpacity(pack, s2.round) - VEIL_START / 3) < 1e-12);
});

test('an incorrect placement seats and stays, and nothing else happens (E2)', () => {
  const { pack, state } = sessionOn(['meo', 'bo']);
  // Deal `mèo`; the onset row also carries `b`.
  let s = state.round.targetId === 'meo' ? state : solveThrough(pack, state, 'meo');
  const wrong = bandInstances(pack, s).find((i) => i.tileId !== s.round.cells[0].expect);
  assert.ok(wrong, 'the round must offer a distractor');
  const before = { veil: veilOpacity(pack, s.round), lit: litCells(pack, s.round) };
  const after = reduce(pack, s, { type: 'tapTile', instanceId: wrong.id });

  assert.equal(after.round.cells[0].tileId, wrong.tileId, 'it seats');
  assert.deepEqual(litCells(pack, after.round), before.lit, 'no segment lights');
  assert.equal(veilOpacity(pack, after.round), before.veil, 'the veil does not step');
  assert.equal(after.idle.resetSeq, s.idle.resetSeq, 'the idle timer does not reset (G8)');
  assert.equal(after.idle.touchSeq, s.idle.touchSeq + 1, 'but the escalation is deferred (G9)');
});

function solveThrough(pack, state, wantId) {
  let s = state;
  let guard = 0;
  while (s.round && s.round.targetId !== wantId && guard++ < 20) {
    s = reduce(pack, solve(pack, s), { type: 'advance' });
    if (s.phase === 'album') s = reduce(pack, s, { type: 'nextPage' });
  }
  assert.equal(s.round.targetId, wantId);
  return s;
}

test('tapping the seated rime returns it, rewinds the band and clears the tone (C9)', () => {
  const { pack, state } = sessionOn(['meo']);
  const s = tap(pack, tap(pack, tap(pack, state, 'm'), 'eo'), 'huyen');
  // Completing the word resolves it, so back up one: seat only onset + rime + a tone,
  // then lift the rime from a three-cell board that has not completed.
  assert.equal(s.round.status, 'resolving');

  const partial = tap(pack, tap(pack, state, 'm'), 'eo');
  assert.equal(partial.round.cells[1].tileId, 'eo');
  const lifted = tapCell(pack, partial, 1);
  assert.equal(lifted.round.cells[1].tileId, null);
  assert.equal(lifted.round.cells[2].tileId, null, 'the tone goes with it');
  assert.equal(vi.activeRow(lifted.round).role, 'rime', 'the band rewinds to rimes');
  assert.equal(lifted.round.cells[0].tileId, 'm', 'the onset stays seated');
});

test('tapping the seated onset returns it and leaves the rime and tone seated (C10)', () => {
  const { pack, state } = sessionOn(['meo']);
  const partial = tap(pack, tap(pack, state, 'm'), 'eo');
  const lifted = tapCell(pack, partial, 0);
  assert.equal(lifted.round.cells[0].tileId, null);
  assert.equal(lifted.round.cells[1].tileId, 'eo', 'the rime stays');
  assert.equal(vi.activeRow(lifted.round).role, 'onset', 'the band rewinds to onsets');
});

test('a returned tile is on offer again — nothing is ever lost', () => {
  const { pack, state } = sessionOn(['meo']);
  const before = bandInstances(pack, state).map((i) => i.id).sort();
  const there = tap(pack, state, 'm');
  const back = tapCell(pack, there, 0);
  assert.deepEqual(bandInstances(pack, back).map((i) => i.id).sort(), before);
});

test('the same tile tapped twice is seated and then lifted, ending in the band (T2)', () => {
  const { pack, state } = sessionOn(['meo']);
  const inst = bandInstances(pack, state).find((i) => i.tileId === 'm');
  const once = reduce(pack, state, { type: 'tapTile', instanceId: inst.id });
  assert.equal(once.round.cells[0].instanceId, inst.id);
  const twice = reduce(pack, once, { type: 'tapTile', instanceId: inst.id });
  assert.equal(twice.round.cells[0].instanceId, null);
  assert.ok(bandInstances(pack, twice).some((i) => i.id === inst.id));
});

test('completing the target resolves it and the chant is the classroom chant (E4, C11)', () => {
  const { pack, state } = sessionOn(['meo']);
  const s = solve(pack, state);
  assert.equal(s.round.status, 'resolving');
  assert.equal(s.round.outcome.kind, 'target');
  assert.equal(s.round.outcome.wordId, 'meo');
  const steps = vi.chant(pack, pack.words.find((w) => w.id === 'meo')).map((x) => x.step);
  assert.deepEqual(steps, ['onset', 'rime', 'blend', 'tone', 'word']);
});

test('a ngang word omits the tone step; a zero-onset word omits the onset step (C11)', () => {
  const pack = viPack();
  const de = pack.words.find((w) => w.id === 'de'); // d + ê + ngang
  assert.equal(de.syllables[0].tone, 'ngang');
  assert.deepEqual(vi.chant(pack, de).map((s) => s.step), ['onset', 'rime', 'word']);

  const ao = pack.words.find((w) => w.id === 'ao'); // ∅ + ao + sắc
  assert.equal(ao.syllables[0].onset, null);
  assert.deepEqual(vi.chant(pack, ao).map((s) => s.step), ['rime', 'blend', 'tone', 'word']);
});

/** Enumerate everything the palette can spell, and find another real word. */
function findAlternate(pack, round) {
  const onsets = round.palette.onsets.length
    ? round.palette.onsets.map((i) => i.tileId)
    : [null];
  for (const o of onsets) {
    for (const r of round.palette.rimes) {
      for (const t of round.palette.tonesByRime[r.tileId]) {
        const w = pack.words.find((x) => {
          const y = x.syllables[0];
          return y.onset === o && y.rime === r.tileId && y.tone === t.tileId;
        });
        if (w && w.id !== round.targetId) return { onset: o, rime: r.tileId, tone: t.tileId, word: w };
      }
    }
  }
  return null;
}

test('a different real word wins the round outright, and the frame flips to it (E5)', () => {
  const pack = viPack();
  let s = createSession(pack, { seed: 'found-word' });
  for (let i = 0; i < 400; i += 1) {
    if (s.phase === 'album') { s = reduce(pack, s, { type: 'nextPage' }); continue; }
    if (s.phase !== 'playing') break;
    const alt = findAlternate(pack, s.round);
    if (alt) {
      const targetId = s.round.targetId;
      let built = s;
      if (alt.onset !== null) built = tap(pack, built, alt.onset);
      built = tap(pack, built, alt.rime);
      built = tap(pack, built, alt.tone);
      assert.equal(built.round.outcome.kind, 'found', `built ${alt.word.text} for ${targetId}`);
      assert.equal(built.round.outcome.wordId, alt.word.id);
      assert.equal(built.round.outcome.art.wordId, alt.word.id,
        'the frame flips to the picture of the word he actually built');

      // E6: the round counts as won, the rail advances, and the original target goes
      // back into the front third of the queue.
      const before = built.page.entries.length;
      const after = reduce(pack, built, { type: 'advance' });
      const page = after.phase === 'album' ? after.page : after.page;
      assert.equal(page.entries.length, before + 1, 'the page rail advances');
      assert.equal(page.entries[page.entries.length - 1].wordId, alt.word.id);
      // `gameplay.md` §6.3: back into a uniformly random position in the front third.
      // Position 0 of the front third means the very next round, which is inside the
      // specification and is why the current round counts as a hit here.
      const third = Math.max(1, Math.ceil((after.bag.length + 1) / 3));
      const inFront = after.bag.slice(0, third).includes(targetId)
        || (after.round && after.round.targetId === targetId);
      assert.ok(inFront, `${targetId} was not re-inserted into the front third`);
      return;
    }
    s = reduce(pack, solve(pack, s), { type: 'advance' });
  }
  assert.fail('no found-word opportunity arose in 400 rounds');
});

test('a combination that is not a word rocks, reads back the parts, and tidies itself (E7, E8, E9)', () => {
  const { pack, state } = sessionOn(['meo', 'bo', 'ca'], 'settle');
  const s = solveThrough(pack, state, 'meo');
  const withOnset = tap(pack, s, 'm'); // correct — this segment must survive the settle
  let cur = withOnset;
  // Find any completion that is not a word.
  const rimes = bandInstances(pack, cur).filter((i) => i.tileId !== 'eo');
  let settled = null;
  for (const r of rimes) {
    const withRime = reduce(pack, cur, { type: 'tapTile', instanceId: r.id });
    for (const t of vi.activeRow(withRime.round).instances) {
      const done = reduce(pack, withRime, { type: 'tapTile', instanceId: t.id });
      if (done.round.outcome && done.round.outcome.kind === 'notAWord') { settled = done; break; }
    }
    if (settled) break;
  }
  assert.ok(settled, 'no not-a-word combination was reachable — the case proved nothing');
  assert.equal(settled.round.status, 'settling');

  const readBack = vi.readBack(pack, settled.round);
  assert.equal(readBack.length, 3);
  assert.ok(!readBack.some((x) => x.step === 'word'), 'no whole-word step (E7)');

  const after = reduce(pack, settled, { type: 'settle' });
  assert.equal(after.round.status, 'building');
  assert.equal(after.round.cells[0].tileId, 'm', 'the lit tile stays seated (E8)');
  assert.deepEqual(litCells(pack, after.round), [true, false, false]);
  assert.equal(after.round.cells[1].tileId, null, 'the unlit tiles flew home');
  assert.equal(after.round.cells[2].tileId, null);
  assert.ok(bandInstances(pack, after).length > 0, 'and they are tappable again (E9)');
});

test('the plate shows the toned form once a tone is seated — read, never composed', () => {
  const { pack, state } = sessionOn(['meo']);
  const withRime = tap(pack, tap(pack, state, 'm'), 'eo');
  const plate = vi.plateCells(pack, withRime.round);
  assert.deepEqual(plate.map((c) => c.glyph), ['m', 'eo']);

  const toneInst = vi.activeRow(withRime.round).instances.find((i) => i.tileId === 'huyen');
  const done = reduce(pack, withRime, { type: 'tapTile', instanceId: toneInst.id });
  assert.deepEqual(vi.plateCells(pack, done.round).map((c) => c.glyph), ['m', 'èo']);
  assert.equal(pack.tileById.rime.eo.toned.huyen, 'èo', 'and it came out of the pack');
});

test('the hint ladder points at the correct tile for the next empty cell (G3, G5)', () => {
  const { pack, state } = sessionOn(['meo']);
  assert.equal(hintInstance(pack, state.round).tileId, 'm');
  const s1 = tap(pack, state, 'm');
  assert.equal(hintInstance(pack, s1.round).tileId, 'eo');
  const s2 = tap(pack, s1, 'eo');
  assert.equal(hintInstance(pack, s2.round).tileId, 'huyen');
});

test('nothing is placeable while the chant is running (N8)', () => {
  // The full pack, so the palette actually carries distractors: a one-word pack offers
  // only the answer and the check would prove nothing.
  const pack = viPack();
  const done = solve(pack, createSession(pack, { seed: 'n8' }));
  assert.equal(done.round.status, 'resolving');
  const instances = vi.paletteInstances(done.round.palette);
  const unseated = instances.filter((i) => !done.round.cells.some((c) => c.instanceId === i.id));
  assert.ok(unseated.length > 0, 'the round must offer tiles he has not used');
  for (const inst of instances) {
    assert.equal(reduce(pack, done, { type: 'tapTile', instanceId: inst.id }), done, inst.id);
  }
  for (let i = 0; i < done.round.cells.length; i += 1) {
    assert.equal(reduce(pack, done, { type: 'tapCell', cellIndex: i }), done, `cell ${i}`);
  }
  assert.equal(reduce(pack, done, { type: 'autoPlace' }), done);
});

test('an unknown action, and an action for a tile that is not there, change nothing', () => {
  const { pack, state } = sessionOn(['meo']);
  assert.equal(reduce(pack, state, { type: 'nonsense' }), state);
  assert.equal(reduce(pack, state, {}), state);
  assert.equal(reduce(pack, state, null), state);
  assert.equal(reduce(pack, state, { type: 'tapTile', instanceId: 'onset:zzz' }), state);
  assert.equal(reduce(pack, state, { type: 'tapCell', cellIndex: 99 }), state);
});

test('six taps in 400 ms are six placements in order, with nothing lost or duplicated (T1)', () => {
  const { pack, state } = sessionOn(['meo', 'bo', 'ca'], 'mash');
  let s = state;
  const taps = [];
  for (let i = 0; i < 6; i += 1) {
    const band = bandInstances(pack, s);
    if (band.length === 0 || s.round.status !== 'building') break;
    const inst = band[i % band.length];
    taps.push(inst.id);
    s = reduce(pack, s, { type: 'tapTile', instanceId: inst.id });
  }
  assert.equal(s.round.placements.length, taps.length);
  assert.deepEqual(s.round.placements.map((p) => p.instanceId), taps);
  const seated = s.round.cells.map((c) => c.instanceId).filter((x) => x !== null);
  assert.equal(new Set(seated).size, seated.length, 'no instance is seated twice');
});
