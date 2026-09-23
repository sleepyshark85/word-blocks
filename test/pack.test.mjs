import test from 'node:test';
import assert from 'node:assert/strict';
import { viPack, enPack, rawWord, rawManifest, loadPack } from './helpers/load.mjs';
import { VI_ALPHABET, EN_ALPHABET } from '../src/engine/rules.mjs';

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

test('E12 / B2n — the inventory order IS the board, and it is the whole alphabet', () => {
  // `ui.md` §13.7 E12 — "the table takes the first `cells` of it, so this list *is* the
  // board. Nothing else may determine which symbol sits in which cell." **Revision 5: a
  // board cell is a LETTER, not a tile id** (`content-pipeline.md` §3.7), so the order is
  // checked against the alphabet and the tone tiles rather than against `tiles`.
  for (const [label, pack, expected] of [
    ['Vietnamese', viPack(), { letter: VI_ALPHABET, tone: ['ngang', 'huyen', 'sac', 'hoi', 'nga', 'nang'] }],
    ['English', enPack(), { letter: EN_ALPHABET }],
  ]) {
    assert.deepEqual(Object.keys(pack.inventoryOrder).sort(), Object.keys(expected).sort(),
      `${label}: the board has the wrong runs`);
    for (const [group, ids] of Object.entries(expected)) {
      const order = pack.inventoryOrder[group];
      assert.deepEqual(order, [...new Set(order)], `${label}: ${group} order has a duplicate`);
      assert.deepEqual(order, ids, `${label}: the ${group} run is not the one the design names`);
    }
    // And the retired revision-4 runs are gone from the board, though `tiles` still
    // carries the model they belong to.
    for (const retired of ['onset', 'rime', 'digraph']) {
      assert.equal(retired in pack.inventoryOrder, false, `${label}: ${retired} is still a run`);
    }
  }
});

test('D1 / B2k — the English board is `a`–`z` and holds no digraph cell', () => {
  const pack = enPack();
  const order = pack.inventoryOrder.letter;
  assert.deepEqual(order, 'abcdefghijklmnopqrstuvwxyz'.split(''));
  assert.equal(order.every((id) => [...id].length === 1), true, 'a digraph has a cell');
  // **D16 — the ten digraph clips are kept**, because they are what a re-voiced second
  // tap plays. They lost their cells, not their existence (`literacy-en.md` §0.9).
  for (const id of ['ch', 'ck', 'ff', 'gg', 'll', 'ng', 'sh', 'ss', 'th', 'zz']) {
    assert.ok(pack.tileById.letter[id], `the ${id} tile was deleted with its cell`);
    assert.ok(pack.tileById.letter[id].audio.short, `${id} lost its clip`);
  }
});

test('a declared inventoryOrder wins, and an entry naming a non-letter is dropped', () => {
  const input = { manifest: rawManifest('en-seed') };
  const declared = ['e', 'a', 'c', 'nope', 't'];
  const pack = loadPack('en-seed', 'en', {
    manifest: { ...input.manifest, inventoryOrder: { letter: declared } },
  });
  // Her order comes first, exactly as written, minus the entry that is not a letter.
  assert.deepEqual(pack.inventoryOrder.letter.slice(0, 4), ['e', 'a', 'c', 't']);
  assert.ok(pack.issues.some((i) => i.code === 'unknownInventoryEntry'));
  // **And every letter she left out is still on the board, after hers** — a letter that
  // is not on the board is every word containing it made unbuildable, which is the defect
  // revision 4 actually shipped (`content-pipeline.md` §3.7).
  assert.deepEqual([...pack.inventoryOrder.letter].sort(), [...EN_ALPHABET].sort());
});

test('a pack still declaring the revision-4 runs is an ERROR, not a silent ignore', () => {
  const manifest = rawManifest('vi-seed');
  const pack = loadPack('vi-seed', 'vi', {
    manifest: {
      ...manifest,
      inventoryOrder: { ...manifest.inventoryOrder, onset: ['m', 'b'], rime: ['eo'] },
    },
  });
  // An un-migrated pack would otherwise draw revision 4's 67-cell board.
  const codes = pack.issues.filter((i) => i.code === 'retiredInventoryRun');
  assert.equal(codes.length, 2, 'the retired runs were accepted');
  assert.equal(codes.every((i) => i.level === 'error'), true);
  assert.deepEqual(Object.keys(pack.inventoryOrder).sort(), ['letter', 'tone']);
  assert.equal(pack.inventoryOrder.letter.length, 29, 'the board is still the alphabet');
});

test('D17 / D18 / D23 / E22 — `display.glyphCase`, and Vietnamese may not take it', () => {
  // `ui.md` §8.2, the owner's answer to Q7; `content-pipeline.md` §3.8 owns the field's
  // name and shape. It is read once, here, and **absent, empty, misspelled or the wrong
  // shape is lowercase, silently** (D23) — content is hostile input and a casing flag is
  // never worth refusing to start over.
  assert.equal(enPack().glyphCase, 'upper', 'English ships uppercase glyphs');
  assert.equal(viPack().glyphCase, 'lower');
  assert.deepEqual(rawManifest('en-seed').display, { glyphCase: 'upper' });
  assert.deepEqual(rawManifest('vi-seed').display, { glyphCase: 'lower' });

  const en = rawManifest('en-seed');
  const cases = [
    [undefined, 'lower', null],
    [null, 'lower', null],
    [{}, 'lower', null],
    [{ glyphCase: '' }, 'lower', 'unknownGlyphCase'],
    [{ glyphCase: 'uppercase' }, 'lower', 'unknownGlyphCase'],
    [{ glyphCase: true }, 'lower', 'badGlyphCase'],
    [{ glyphCase: 'lower' }, 'lower', null],
    [{ glyphCase: 'upper' }, 'upper', null],
    ['upper', 'lower', 'badDisplayShape'],
  ];
  for (const [display, expected, code] of cases) {
    const pack = loadPack('en-seed', 'en', { manifest: { ...en, display } });
    assert.equal(pack.glyphCase, expected, `display=${JSON.stringify(display)}`);
    assert.ok(pack.words.length > 0, `display=${JSON.stringify(display)} stopped the pack loading`);
    if (code) assert.ok(pack.issues.some((i) => i.code === code), `display=${JSON.stringify(display)} was silent`);
    else assert.deepEqual(pack.issues, [], `display=${JSON.stringify(display)} complained`);
  }

  // **D18 / Q13 — a Vietnamese pack cannot be switched to uppercase**, and the refusal is
  // an error she can read rather than silent obedience: `mả`/`mã` is 34 px apart at 36 pt
  // and the font gate has never rendered a marked capital (`ui.md` §8.2.3).
  const vi = loadPack('vi-seed', 'vi', {
    manifest: { ...rawManifest('vi-seed'), display: { glyphCase: 'upper' } },
  });
  assert.equal(vi.glyphCase, 'lower');
  assert.ok(vi.issues.some((i) => i.code === 'viCannotBeUppercase' && i.level === 'error'));
  assert.ok(vi.words.length > 0, 'the pack refused to load over a casing flag');
});

test('D20 — nothing stored in either pack is uppercase', () => {
  for (const [label, pack] of [['vi', viPack()], ['en', enPack()]]) {
    for (const id of pack.inventoryOrder.letter) {
      assert.equal(id, id.toLowerCase(), `${label}: inventoryOrder holds "${id}"`);
    }
    for (const word of pack.words) {
      assert.equal(word.text, word.text.toLowerCase(), `${label}: "${word.text}" is stored capitalised`);
      assert.deepEqual(word.letters, word.letters.map((l) => l.toLowerCase()));
      for (const image of word.images) {
        assert.equal(image.src, image.src.toLowerCase(), `${label}: ${image.src}`);
      }
    }
  }
});

test('a clean seed pack produces no issues at all', () => {
  assert.deepEqual(viPack().issues, []);
  assert.deepEqual(enPack().issues, []);
});
