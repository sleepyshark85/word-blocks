import test from 'node:test';
import assert from 'node:assert/strict';
import { viPack, enPack, rawWord, rawManifest, loadPack } from './helpers/load.mjs';

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

test('the tile inventory matches the manifest (26 onsets, 35 rimes, 6 tones, 36 letters)', () => {
  const vi = viPack();
  assert.equal(vi.tiles.onset.length, 26);
  assert.equal(vi.tiles.rime.length, 35);
  assert.equal(vi.tiles.tone.length, 6);
  // 26 + 10: **all 26 letters, `q` included** (`ui.md` §8.1, AC D1a). It was 25 in
  // revision 2, and a missing letter is exactly the inconsistency the owner reported.
  const en = enPack();
  assert.equal(en.tiles.letter.length, 36);
  assert.equal(en.tiles.letter.filter((t) => [...t.id].length === 1).length, 26);
  assert.ok(en.tileById.letter.q, '`q` is not a tile');
  assert.ok(en.tileById.letter.q.audio.short, 'D1b — `q` must speak when pressed');
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

test('E12 — the inventory order is the board, and every declared tile is on it', () => {
  // `ui.md` §13.7 E12 — "the table takes the first `cells` of it, so this list *is* the
  // board. Nothing else may determine which symbol sits in which cell."
  for (const [label, pack, groups] of [
    ['Vietnamese', viPack(), ['onset', 'rime', 'tone']],
    ['English', enPack(), ['letter']],
  ]) {
    for (const group of groups) {
      const order = pack.inventoryOrder[group];
      assert.ok(Array.isArray(order), `${label}: no ${group} order`);
      assert.deepEqual(order, [...new Set(order)], `${label}: ${group} order has a duplicate`);
      // No tile is hidden from the board by an order that forgot it.
      assert.deepEqual([...order].sort(), pack.tiles[group].map((t) => t.id).sort(),
        `${label}: the ${group} order and the ${group} inventory disagree`);
    }
  }
});

test('D1 — the English letter inventory is in alphabetical order, digraphs after', () => {
  const order = enPack().inventoryOrder.letter;
  const singles = order.filter((id) => [...id].length === 1);
  const digraphs = order.filter((id) => [...id].length > 1);
  assert.deepEqual(singles, [...singles].sort(), 'the letters are not alphabetical');
  assert.deepEqual(digraphs, [...digraphs].sort());
  assert.deepEqual(order, [...singles, ...digraphs], 'a digraph sits among the letters');
  assert.equal(order[0], 'a', 'the alphabet song does not start with `a`');
});

test('a declared inventoryOrder wins, and an entry naming an unknown tile is dropped', () => {
  const input = { manifest: rawManifest('en-seed') };
  const declared = ['e', 'a', 'c', 'nope', 't'];
  const pack = loadPack('en-seed', 'en', {
    manifest: { ...input.manifest, inventoryOrder: { letter: declared } },
  });
  // Her order comes first, exactly as written, minus the tile this pack does not have.
  assert.deepEqual(pack.inventoryOrder.letter.slice(0, 4), ['e', 'a', 'c', 't']);
  assert.ok(pack.issues.some((i) => i.code === 'unknownInventoryEntry'));
  // And every tile she left out is still on the board, after hers.
  assert.deepEqual([...pack.inventoryOrder.letter].sort(),
    pack.tiles.letter.map((t) => t.id).sort());
});

test('a clean seed pack produces no issues at all', () => {
  assert.deepEqual(viPack().issues, []);
  assert.deepEqual(enPack().issues, []);
});
