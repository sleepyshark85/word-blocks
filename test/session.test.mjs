// The session: the bag, the page, the album, the stage, and the assist bookkeeping the
// child is never told about.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSession, reduce, pageRail, partsHintSteps, resolvePack, artFor, langFor,
  ROUNDS_PER_PAGE, ROUNDS_PER_STAGE, MAX_STAGE, roundStage, MEETING_BUMP_CAP,
} from '../src/engine/index.mjs';
import { viPack, enPack, readPackInputs, packDir } from './helpers/load.mjs';
import { solve } from './helpers/play.mjs';

/** Play `n` rounds cleanly, stepping through album pages. */
function play(pack, state, n) {
  let s = state;
  for (let i = 0; i < n; i += 1) {
    if (s.phase === 'album') s = reduce(pack, s, { type: 'nextPage' });
    if (s.phase !== 'playing') break;
    s = reduce(pack, solve(pack, s), { type: 'advance' });
  }
  return s;
}

test('a session opens straight into round 1 — the child never starts a round', () => {
  for (const pack of [viPack(), enPack()]) {
    const s = createSession(pack, { seed: 'open' });
    assert.equal(s.phase, 'playing');
    assert.ok(s.round);
    assert.equal(s.round.id, 'r1');
    assert.equal(s.globalStage, 1);
  }
});

test('the page rail is five empty dots, and fills one per resolved round (H1, H2)', () => {
  const pack = viPack();
  let s = createSession(pack, { seed: 'rail' });
  assert.deepEqual(pageRail(s), [false, false, false, false, false]);
  for (let i = 1; i <= 4; i += 1) {
    s = reduce(pack, solve(pack, s), { type: 'advance' });
    assert.equal(pageRail(s).filter(Boolean).length, i);
  }
});

test('the fifth round ends the page, and play does not resume by itself (H3)', () => {
  const pack = viPack();
  const s = play(pack, createSession(pack, { seed: 'page' }), ROUNDS_PER_PAGE);
  assert.equal(s.phase, 'album');
  assert.equal(s.round, null);
  assert.equal(s.page.entries.length, 5);
  // Nothing but `nextPage` restarts it.
  assert.equal(reduce(pack, s, { type: 'tapTile', instanceId: 'onset:m' }), s);
  assert.equal(reduce(pack, s, { type: 'advance' }), s);
  assert.equal(reduce(pack, s, { type: 'settle' }), s);
});

test('the album page shows the five pictures made this page, and nothing else (H4)', () => {
  const pack = viPack();
  const s = play(pack, createSession(pack, { seed: 'album' }), ROUNDS_PER_PAGE);
  assert.equal(s.page.entries.length, 5);
  for (const e of s.page.entries) {
    assert.deepEqual(Object.keys(e).sort(), ['fallbackEmoji', 'image', 'text', 'wordId']);
    assert.ok(e.image !== undefined);
  }
  // No score, no star, no count anywhere in the state.
  assert.equal('score' in s, false);
  assert.equal('streak' in s, false);
  assert.equal('stars' in s, false);
});

test('the play card starts a new page and resets the rail (H6)', () => {
  const pack = viPack();
  const album = play(pack, createSession(pack, { seed: 'next' }), ROUNDS_PER_PAGE);
  const next = reduce(pack, album, { type: 'nextPage' });
  assert.equal(next.phase, 'playing');
  assert.deepEqual(pageRail(next), [false, false, false, false, false]);
  assert.ok(next.round);
  assert.equal(next.album.length, 5, 'the session album keeps everything');
});

test('no word repeats within a page while unmet eligible words remain (H12)', () => {
  for (const pack of [viPack(), enPack()]) {
    let s = createSession(pack, { seed: 'h12' });
    for (let page = 0; page < 6; page += 1) {
      s = play(pack, s, ROUNDS_PER_PAGE);
      const ids = s.page.entries.map((e) => e.wordId);
      assert.equal(new Set(ids).size, ids.length, `${pack.language} page ${page}: ${ids.join(',')}`);
      s = reduce(pack, s, { type: 'nextPage' });
    }
  }
});

test('the bag deals every eligible word once before dealing any word twice (gameplay §6.3)', () => {
  const input = readPackInputs(packDir('en-seed'));
  const pack = resolvePack({
    language: 'en', ...input,
    words: input.words.filter((w) => w.stage === 1), // 11 stage-1 words
  });
  assert.equal(pack.words.length, 11);
  let s = createSession(pack, { seed: 'bag' });
  const seen = [];
  for (let i = 0; i < 11; i += 1) {
    seen.push(s.round.targetId);
    s = play(pack, s, 1);
    if (s.phase === 'album') s = reduce(pack, s, { type: 'nextPage' });
  }
  assert.equal(new Set(seen).size, 11, `repeated inside one bag: ${seen.join(',')}`);
});

test('the stage advances after eight assist-free rounds and never decreases (gameplay §6.2)', () => {
  const pack = enPack();
  let s = createSession(pack, { seed: 'stage' });
  assert.equal(s.globalStage, 1);
  s = play(pack, s, ROUNDS_PER_STAGE - 1);
  assert.equal(s.globalStage, 1, 'seven is not enough');
  s = play(pack, s, 1);
  assert.equal(s.globalStage, 2);
  s = play(pack, s, ROUNDS_PER_STAGE);
  assert.equal(s.globalStage, 3);
  // It never goes down, however badly the next rounds go.
  const before = s.globalStage;
  for (let i = 0; i < 12; i += 1) {
    if (s.phase === 'album') s = reduce(pack, s, { type: 'nextPage' });
    s = reduce(pack, reduce(pack, s, { type: 'autoPlace' }), { type: 'autoPlace' });
    s = reduce(pack, solve(pack, s), { type: 'advance' });
    assert.ok(s.globalStage >= before);
  }
  assert.equal(s.globalStage, before, 'assisted rounds do not count toward advancement (G10)');
});

test('the stage never exceeds the language maximum', () => {
  for (const pack of [viPack(), enPack()]) {
    let s = createSession(pack, { seed: 'cap' });
    s = play(pack, s, ROUNDS_PER_STAGE * 12);
    assert.ok(s.globalStage <= MAX_STAGE[pack.language], `${pack.language}: ${s.globalStage}`);
  }
});

test('roundStage: a word met twice comes back harder, capped at +2 (gameplay §6.2)', () => {
  assert.equal(roundStage('vi', 5, 1, 0), 1, 'a new word comes in easy even at stage 5');
  assert.equal(roundStage('vi', 5, 1, 1), 2);
  assert.equal(roundStage('vi', 5, 1, 2), 3);
  assert.equal(roundStage('vi', 5, 1, 9), 3, `the bump is capped at +${MEETING_BUMP_CAP}`);
  assert.equal(roundStage('vi', 2, 1, 5), 2, 'the global stage is still the ceiling');
  assert.equal(roundStage('vi', 9, 9, 9), 5, 'and the language maximum is still the ceiling');
});

test('a correct placement resets the idle ladder; an incorrect one does not (G7, G8)', () => {
  const pack = viPack();
  const s = createSession(pack, { seed: 'idle' });
  const lang = langFor('vi');
  const right = lang.activeRow(s.round).instances.find((i) => i.tileId === s.round.cells[0].expect);
  const wrong = lang.activeRow(s.round).instances.find((i) => i.tileId !== s.round.cells[0].expect);

  const after = reduce(pack, s, { type: 'tapTile', instanceId: right.id });
  assert.equal(after.idle.resetSeq, s.idle.resetSeq + 1);

  const miss = reduce(pack, s, { type: 'tapTile', instanceId: wrong.id });
  assert.equal(miss.idle.resetSeq, s.idle.resetSeq, 'no reset');
  assert.equal(miss.idle.touchSeq, s.idle.touchSeq + 1, 'but a deferral');
});

test('the parts hint changes nothing at all (B7)', () => {
  const pack = viPack();
  const s = createSession(pack, { seed: 'hint' });
  assert.equal(reduce(pack, s, { type: 'partsHint' }), s, 'the identical state object');
  const steps = partsHintSteps(pack, s);
  assert.ok(steps.length >= 2);
  assert.ok(!steps.some((x) => x.step === 'word'), 'the parts, not the word (B6)');
});

test('tapping the frame is a touch but not a reset (B5, G9)', () => {
  const pack = viPack();
  const s = createSession(pack, { seed: 'frame' });
  const after = reduce(pack, s, { type: 'tapFrame' });
  assert.equal(after.idle.touchSeq, s.idle.touchSeq + 1);
  assert.equal(after.idle.resetSeq, s.idle.resetSeq);
});

test('an auto-place seats the right tile, is recorded, and restarts the ladder (G5, G6)', () => {
  const pack = viPack();
  const s = createSession(pack, { seed: 'auto' });
  const after = reduce(pack, s, { type: 'autoPlace' });
  assert.equal(after.round.cells[0].tileId, s.round.cells[0].expect);
  assert.equal(after.round.assists, 1);
  assert.equal(after.round.placements[0].assist, true);
  assert.equal(after.idle.resetSeq, s.idle.resetSeq + 1, 'the ladder restarts for the next cell');
});

test('three auto-places send the word back into the front third (G10)', () => {
  const pack = viPack();
  let checked = 0;
  for (let n = 0; n < 20; n += 1) {
    let s = createSession(pack, { seed: `g10-${n}` });
    const targetId = s.round.targetId;
    for (let i = 0; i < 8 && s.round.cells.some((c) => c.tileId === null); i += 1) {
      const before = s;
      s = reduce(pack, s, { type: 'autoPlace' });
      assert.notEqual(s, before, 'auto-place did nothing — the round could never complete (G6)');
    }
    assert.ok(s.round.cells.every((c) => c.tileId !== null), 'the ladder must finish every round (G6)');
    assert.ok(s.round.assists >= 3, `only ${s.round.assists} assists`);
    assert.equal(s.round.outcome.kind, 'target');

    const after = reduce(pack, s, { type: 'advance' });
    assert.equal(after.stageProgress, 0, 'an assisted round does not count toward the stage');

    // `gameplay.md` §6.3: a uniformly random position in the FRONT THIRD. The bag it
    // landed in is the one before the next round was dealt, so add the drawn word back.
    const bagLen = after.bag.length + (after.round ? 1 : 0);
    const third = Math.max(1, Math.ceil(bagLen / 3));
    const idx = after.round && after.round.targetId === targetId
      ? 0
      : after.bag.indexOf(targetId) + (after.round ? 1 : 0);
    assert.ok(idx >= 0, `${targetId} did not come back at all`);
    assert.ok(idx < third,
      `${targetId} came back at ${idx} of ${bagLen}, outside the front third (${third})`);
    checked += 1;
  }
  assert.equal(checked, 20);
});

test('finishing the session leaves a screen with no way to start play (H8, H9, H10)', () => {
  const pack = viPack();
  let s = play(pack, createSession(pack, { seed: 'end' }), 3);
  s = reduce(pack, s, { type: 'finishSession' });
  assert.equal(s.phase, 'ended');
  assert.equal(s.round, null);
  assert.equal(s.album.length, 3, "everything he made this session is still there");
  for (const action of [{ type: 'nextPage' }, { type: 'advance' }, { type: 'tapFrame' },
    { type: 'tapTile', instanceId: 'x' }, { type: 'settle' }, { type: 'autoPlace' }]) {
    assert.equal(reduce(pack, s, action).phase, 'ended', `${action.type} restarted play`);
    assert.equal(reduce(pack, s, action).round, null);
  }
});

test('the image cycles across meetings: prompt is images[0], reveal is images[1..n] (B9)', () => {
  const word = { id: 'x', text: 'x', images: [{ src: 'a' }, { src: 'b' }, { src: 'c' }], fallbackEmoji: null };
  assert.deepEqual(artFor(word, 0), { wordId: 'x', prompt: { src: 'a' }, reveal: { src: 'b' }, fallbackEmoji: null });
  assert.equal(artFor(word, 1).reveal.src, 'c');
  assert.equal(artFor(word, 2).reveal.src, 'b', 'it cycles');
  assert.equal(artFor(word, 3).reveal.src, 'c');
  for (let i = 0; i < 8; i += 1) assert.equal(artFor(word, i).prompt.src, 'a');
});

test('one image: the reveal shows it and does not error (B10)', () => {
  const word = { id: 'y', text: 'y', images: [{ src: 'only' }], fallbackEmoji: null };
  for (let i = 0; i < 4; i += 1) {
    assert.equal(artFor(word, i).prompt.src, 'only');
    assert.equal(artFor(word, i).reveal.src, 'only');
  }
});

test('no images: the bundled fallback emoji carries the round', () => {
  const word = { id: 'z', text: 'z', images: [], fallbackEmoji: 'Cat' };
  const art = artFor(word, 0);
  assert.equal(art.prompt, null);
  assert.equal(art.reveal, null);
  assert.equal(art.fallbackEmoji, 'Cat');
});

test('the encounter counter drives the picture, and advances only on a resolution', () => {
  const pack = viPack();
  let s = createSession(pack, { seed: 'enc' });
  const id = s.round.targetId;
  assert.equal(s.encounters[id], undefined);
  s = reduce(pack, solve(pack, s), { type: 'advance' });
  assert.equal(s.encounters[id], 1);
  assert.equal(s.meetings[id], 1);
});

test('the state carries no score, no lives and no timer (G1)', () => {
  const pack = viPack();
  const s = play(pack, createSession(pack, { seed: 'g1' }), 3);
  const json = JSON.stringify(s);
  for (const banned of ['score', 'lives', 'streak', 'timeLeft', 'countdown', 'stars']) {
    assert.ok(!json.includes(`"${banned}"`), `the state carries ${banned}`);
  }
});

test('an empty pack gives a parent-facing empty state and no round (L6)', () => {
  const pack = resolvePack({ language: 'vi', manifest: null, words: [] });
  const s = createSession(pack, { seed: 'empty' });
  assert.equal(s.phase, 'empty');
  assert.equal(s.round, null);
  for (const action of [{ type: 'nextPage' }, { type: 'advance' }, { type: 'autoPlace' }]) {
    assert.equal(reduce(pack, s, action).phase, 'empty');
  }
});

test('a pack whose easiest word is above stage 1 still deals a round', () => {
  const input = readPackInputs(packDir('en-seed'));
  const pack = resolvePack({
    language: 'en', ...input,
    words: input.words.filter((w) => w.stage === 7), // crab, drum, frog
  });
  const s = createSession(pack, { seed: 'high' });
  assert.equal(s.phase, 'playing');
  assert.ok(['crab', 'drum', 'frog'].includes(s.round.targetId));
});

test('the language on the session is the pack’s, and no action changes it', () => {
  for (const pack of [viPack(), enPack()]) {
    let s = createSession(pack, { seed: 'lang' });
    assert.equal(s.language, pack.language);
    s = play(pack, s, 12);
    assert.equal(s.language, pack.language);
    for (const action of [{ type: 'setLanguage', language: 'fr' }, { type: 'finishSession' }]) {
      assert.equal(reduce(pack, s, action).language, pack.language);
    }
  }
});
