import test from 'node:test';
import assert from 'node:assert/strict';
import { viPack, enPack, rawWord } from './helpers/load.mjs';

test('both seed packs resolve, and the counts match the seed build', () => {
  const vi = viPack();
  const en = enPack();
  // `content-pipeline.md` §9.1: 47 Vietnamese enabled + 3 appendix, 40 English.
  assert.equal(vi.catalogue.length, 50);
  assert.equal(vi.words.length, 47);
  assert.equal(en.catalogue.length, 40);
  assert.equal(en.words.length, 40);
});

test('the three withheld Vietnamese words are withheld for a reason a person can read', () => {
  const vi = viPack();
  const withheld = vi.catalogue.filter((c) => !c.playable);
  assert.deepEqual(withheld.map((c) => c.id).sort(), ['bun', 'non', 'pho']);
  for (const w of withheld) {
    // `acceptance-criteria.md` K8: a reason string the UI renders, not a boolean.
    assert.equal(typeof w.reason.code, 'string');
    assert.ok(w.reason.message.length > 3, `${w.id} has no readable reason`);
  }
});

test('a withheld word is still listed — never hidden and never deleted (J2)', () => {
  const vi = viPack();
  assert.ok(vi.catalogue.some((c) => c.id === 'pho'));
  assert.ok(!vi.words.some((w) => w.id === 'pho'));
});

test('build-time keys never reach the engine (word-list.md §1)', () => {
  for (const pack of [viPack(), enPack()]) {
    for (const w of pack.words) {
      assert.equal('build' in w, false, `${w.id} still carries build`);
      assert.equal('assetConcept' in w, false);
      assert.equal('draft' in w, false);
    }
  }
  // ...and the raw file does carry it, so the assertion above is not vacuous.
  assert.ok('build' in rawWord('vi-seed', 'meo'));
});

test('no word carries a language field (acceptance-criteria R8)', () => {
  for (const pack of [viPack(), enPack()]) {
    for (const w of pack.words) assert.equal('language' in w, false, w.id);
    for (const c of pack.catalogue) assert.equal('language' in c, false);
  }
});

test('the Vietnamese pack has no English shape and vice versa', () => {
  const vi = viPack();
  const en = enPack();
  for (const w of vi.words) {
    assert.ok(Array.isArray(w.syllables), w.id);
    assert.equal('tiles' in w, false, w.id);
  }
  for (const w of en.words) {
    assert.ok(Array.isArray(w.tiles), w.id);
    assert.equal('syllables' in w, false, w.id);
  }
  assert.deepEqual(Object.keys(vi.tiles).sort(), ['onset', 'rime', 'tone']);
  assert.deepEqual(Object.keys(en.tiles), ['letter']);
});

test('asking for the wrong language throws rather than degrading (R4)', async () => {
  const { resolvePack } = await import('../src/engine/index.mjs');
  const { readPackInputs, packDir } = await import('./helpers/load.mjs');
  assert.throws(
    () => resolvePack({ language: 'en', ...readPackInputs(packDir('vi-seed')) }),
    /languages never mix/,
  );
});

test('the tile inventory matches the manifest (26 onsets, 35 rimes, 6 tones, 35 letters)', () => {
  const vi = viPack();
  assert.equal(vi.tiles.onset.length, 26);
  assert.equal(vi.tiles.rime.length, 35);
  assert.equal(vi.tiles.tone.length, 6);
  assert.equal(enPack().tiles.letter.length, 35);
});

test('every tile has both audio slots, even where they are the same file (ui.md E4, N12)', () => {
  for (const pack of [viPack(), enPack()]) {
    for (const group of Object.keys(pack.tiles)) {
      for (const t of pack.tiles[group]) {
        assert.ok('long' in t.audio && 'short' in t.audio, `${group}/${t.id}`);
        assert.equal(t.audio.silent, false, `${group}/${t.id} is silent`);
      }
    }
  }
});

test('a stop-final rime carries exactly sắc and nặng (literacy-vi §5.2)', () => {
  const vi = viPack();
  for (const id of ['ach', 'at', 'ăt', 'it']) {
    const r = vi.tiles.rime.find((x) => x.id === id);
    assert.deepEqual(r.legalTones, ['sac', 'nang'], id);
    assert.equal(Object.keys(r.toned).length, 2, id);
  }
  const eo = vi.tiles.rime.find((x) => x.id === 'eo');
  assert.equal(eo.legalTones.length, 6);
  assert.deepEqual(Object.values(eo.toned), ['eo', 'èo', 'éo', 'ẻo', 'ẽo', 'ẹo']);
});

test('a tone tile carries no glyph — it renders the seated rime, marked (literacy-vi §5.4)', () => {
  for (const t of viPack().tiles.tone) {
    assert.equal('glyph' in t, false, `${t.id} carries a glyph of its own`);
    assert.ok(t.label.length > 0);
  }
});

test('the never-together rules come from the manifest, as data', () => {
  const vi = viPack();
  assert.ok(vi.neverTogether.some((s) => s.includes('c') && s.includes('k')));
  assert.ok(vi.neverTogether.some((s) => s.includes('ng') && s.includes('ngh')));
  assert.ok(vi.neverTogether.some((s) => s.includes('hoi') && s.includes('nga')));
  assert.deepEqual(enPack().neverTogether, [['c', 'k']]);
});

test('every playable word resolves to a word audio clip that exists', () => {
  for (const pack of [viPack(), enPack()]) {
    for (const w of pack.words) {
      assert.ok(w.audio.word && w.audio.word.src, `${w.id} has no word clip`);
    }
  }
});

test('every playable word has a picture or a fallback emoji (content-pipeline §5)', () => {
  for (const pack of [viPack(), enPack()]) {
    for (const w of pack.words) {
      assert.ok(w.images.length > 0 || w.fallbackEmoji !== null, `${w.id} has neither`);
    }
  }
});

test('stage pools are derived from the live vocabulary, not a hand-written table', () => {
  const vi = viPack();
  // `bò`, `dê`, `gà`, `xe` … are stage 1, so their parts are available at stage 1.
  assert.equal(vi.stageOf.rime.o, 1);
  assert.equal(vi.stageOf.onset.b, 1);
  assert.equal(vi.stageOf.rime.eo, 2); // first seen in `mèo`
  assert.equal(vi.stageOf.rime.ach, 4); // first seen in `sách`
  // A rime no word uses is not in the pool at all, so it can never be a distractor.
  assert.equal(vi.stageOf.rime.uôi !== undefined, true);
  const en = enPack();
  assert.equal(en.stageOf.letter.a, 1);
  assert.equal(en.stageOf.letter.ck, 6);
  assert.equal(en.stageOf.letter.k, undefined, '`k` is used by no seed word');
});

test('a clean seed pack produces no issues at all', () => {
  assert.deepEqual(viPack().issues, []);
  assert.deepEqual(enPack().issues, []);
});
