// Content is hostile input.
//
// Every case here is a real thing that happens: a stray comma, a photograph deleted from
// the camera roll, a half-finished word, a pack from a newer build, a file his mother
// typed by hand. The requirement is never "reject it" — it is **degrade to a usable app
// and tell the adult**. A child seeing a blank screen because his mother typed a stray
// comma is the defect that matters most in this app.

import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePack, createGame, createSession, tableView } from '../src/engine/index.mjs';

/** A session over a pack, the way the app starts one. */
const open = (pack, seed) => {
  const game = createGame(pack, { maxCells: 24 });
  return { game, state: createSession(game, { seed }) };
};
import { readPackInputs, packDir, rawManifest } from './helpers/load.mjs';

const viInput = () => readPackInputs(packDir('vi-seed'));
const enInput = () => readPackInputs(packDir('en-seed'));

function withWords(input, fn) {
  return { ...input, words: input.words.map(fn).filter((w) => w !== null) };
}

function mutate(input, id, patch) {
  return withWords(input, (w) => (w.id === id ? { ...w, ...patch } : w));
}

/* ------------------------------------------------- one bad entry costs one word */

test('a word file that would not parse costs one word and is reported (K9)', () => {
  const input = viInput();
  const words = input.words.filter((w) => w.id !== 'meo');
  const pack = resolvePack({
    language: 'vi', ...input, words,
    unreadable: [{ name: 'meo.json', error: 'Unexpected token }' }],
  });
  assert.equal(pack.words.length, 46, 'the other 46 must still play');
  assert.ok(pack.issues.some((i) => i.code === 'unreadable' && i.where === 'meo.json'));
  // The child never sees a blank screen.
  const { game, state } = open(pack, 'k9');
  assert.equal(state.phase, 'playing');
  assert.ok(tableView(game, state).cells.some((c) => c.live), 'the board has nothing live on it');
});

test('a word that is not an object at all is survived', () => {
  const input = viInput();
  const pack = resolvePack({ language: 'vi', ...input, words: [...input.words, 42, null, [], 'mèo'] });
  assert.equal(pack.words.length, 47);
  assert.equal(pack.issues.filter((i) => i.code === 'badShape').length, 4);
});

test('every kind of broken decomposition withholds exactly one word, with a reason', () => {
  const cases = [
    ['unknown rime', { syllables: [{ onset: 'm', rime: 'uông', tone: 'huyen' }] }, 'unknownRime'],
    ['unknown onset', { syllables: [{ onset: 'zz', rime: 'eo', tone: 'huyen' }] }, 'unknownOnset'],
    ['unknown tone', { syllables: [{ onset: 'm', rime: 'eo', tone: 'shouting' }] }, 'unknownTone'],
    ['two syllables', { syllables: [{ onset: 'm', rime: 'ay', tone: 'sac' }, { onset: 'b', rime: 'ay', tone: 'ngang' }] }, 'twoSyllables'],
    ['no decomposition', { syllables: [] }, 'noDecomposition'],
    ['decomposition is junk', { syllables: 'm-eo-huyen' }, 'noDecomposition'],
    ['illegal tone on a stop-final rime', { syllables: [{ onset: 's', rime: 'ach', tone: 'huyen' }] }, 'illegalTone'],
    ['illegal spelling: ngh before a', { syllables: [{ onset: 'ngh', rime: 'a', tone: 'ngang' }] }, 'illegalSpelling'],
    ['illegal spelling: c before em', { syllables: [{ onset: 'c', rime: 'em', tone: 'ngang' }] }, 'illegalSpelling'],
  ];
  for (const [name, patch, code] of cases) {
    const pack = resolvePack({ language: 'vi', ...mutate(viInput(), 'meo', patch) });
    assert.equal(pack.words.length, 46, name);
    const entry = pack.catalogue.find((c) => c.id === 'meo');
    assert.equal(entry.playable, false, name);
    assert.equal(entry.reason.code, code, `${name}: got ${entry.reason.code}`);
    assert.ok(entry.reason.message.length > 5, name);
  }
});

test('an English word whose tiles do not spell it is withheld (content-pipeline §3.3)', () => {
  const pack = resolvePack({ language: 'en', ...mutate(enInput(), 'cat', { tiles: ['c', 'a', 'p'] }) });
  assert.equal(pack.words.length, 39);
  assert.equal(pack.catalogue.find((c) => c.id === 'cat').reason.code, 'spellingMismatch');
});

test('an English word putting a final-only tile first is withheld (literacy-en §3.3)', () => {
  const pack = resolvePack({
    language: 'en',
    ...mutate(enInput(), 'cat', { text: 'ckat', tiles: ['ck', 'a', 't'] }),
  });
  assert.equal(pack.catalogue.find((c) => c.id === 'cat').reason.code, 'badPosition');
});

/* ------------------------------------------------------------ the language wall */

test('a Vietnamese entry carrying an English field is rejected and the app still runs (R9)', () => {
  const pack = resolvePack({ language: 'vi', ...mutate(viInput(), 'meo', { tiles: ['m', 'e', 'o'] }) });
  assert.equal(pack.words.length, 46);
  assert.equal(pack.catalogue.find((c) => c.id === 'meo').reason.code, 'wrongDecomposition');
  assert.equal(open(pack, 'r9').state.phase, 'playing');
});

test('an English entry carrying Vietnamese syllables is rejected (R9)', () => {
  const pack = resolvePack({
    language: 'en',
    ...mutate(enInput(), 'cat', { syllables: [{ onset: 'c', rime: 'a', tone: 'ngang' }] }),
  });
  assert.equal(pack.catalogue.find((c) => c.id === 'cat').reason.code, 'wrongDecomposition');
});

test('a word carrying a language field is rejected (R8)', () => {
  const pack = resolvePack({ language: 'vi', ...mutate(viInput(), 'meo', { language: 'vi' }) });
  assert.equal(pack.catalogue.find((c) => c.id === 'meo').reason.code, 'languageField');
});

test('a foreign tile group in the manifest is ignored and named', () => {
  const manifest = { ...rawManifest('vi-seed') };
  manifest.tiles = { ...manifest.tiles, letter: [{ id: 'c', glyph: 'c' }] };
  const pack = resolvePack({ language: 'vi', ...viInput(), manifest });
  assert.ok(pack.issues.some((i) => i.code === 'foreignTileGroup'));
  assert.deepEqual(Object.keys(pack.tiles).sort(), ['onset', 'rime', 'tone']);
  assert.equal(pack.words.length, 47, 'the words still load');
});

/* ------------------------------------------------- media that is not on the disk */

test('some images gone: the survivors are used, and rotation indexes the survivors', () => {
  const input = viInput();
  // `pho` is the only seed word with photographs, and it is disabled pending a stage.
  // Borrow its three images for a word that plays, so the survivor list is observable.
  const pho = input.words.find((w) => w.id === 'pho');
  assert.equal(pho.images.length, 3, 'the fixture needs three photographs');
  const words = input.words.map((w) => (w.id === 'meo' ? { ...w, images: pho.images } : w));

  const all = resolvePack({ language: 'vi', ...input, words });
  assert.deepEqual(all.words.find((w) => w.id === 'meo').images.map((i) => i.src),
    pho.images.map((i) => i.src));

  const gone = pho.images[0].src;
  const some = resolvePack({
    language: 'vi', ...input, words, hasMedia: (r) => r !== gone && input.hasMedia(r),
  });
  const meo = some.words.find((w) => w.id === 'meo');
  assert.equal(meo.images.length, 2, 'the survivors are used');
  assert.ok(!meo.images.some((i) => i.src === gone));
  assert.deepEqual(some.issues, [], 'and nothing is said to the child about it');
});

test('all images gone but a fallback emoji set: the word still plays', () => {
  const pack = resolvePack({ language: 'vi', ...viInput(), hasMedia: (r) => !r.startsWith('media/img/') });
  const meo = pack.words.find((w) => w.id === 'meo');
  assert.ok(meo, 'a word with a fallback emoji must survive losing every photograph');
  assert.equal(meo.images.length, 0);
  assert.equal(meo.fallbackEmoji, 'Cat');
});

test('all images gone and no fallback: the word is withheld, not shown broken', () => {
  const pack = resolvePack({ language: 'vi', ...mutate(viInput(), 'meo', { fallbackEmoji: null, images: [] }) });
  assert.equal(pack.catalogue.find((c) => c.id === 'meo').reason.code, 'noPicture');
  assert.equal(pack.words.length, 46);
});

test('the word clip gone: the word is withheld — the chant has no final step', () => {
  const input = viInput();
  const meo = input.words.find((w) => w.id === 'meo');
  const gone = meo.audio.word.src;
  const pack = resolvePack({ language: 'vi', ...input, hasMedia: (r) => r !== gone && input.hasMedia(r) });
  assert.equal(pack.catalogue.find((c) => c.id === 'meo').reason.code, 'noWordAudio');
});

test('the blend clip gone: step 3 is skipped and the chant continues', async () => {
  const { langFor } = await import('../src/engine/index.mjs');
  const input = viInput();
  const meo = input.words.find((w) => w.id === 'meo');
  const gone = meo.audio.blend.src;
  const pack = resolvePack({ language: 'vi', ...input, hasMedia: (r) => r !== gone && input.hasMedia(r) });
  const word = pack.words.find((w) => w.id === 'meo');
  assert.ok(word, 'the word still plays');
  const steps = langFor('vi').chant(pack, word).map((s) => s.step);
  assert.deepEqual(steps, ['onset', 'rime', 'tone', 'word']);
  // ...and with the clip present it is there, so the assertion above means something.
  const full = langFor('vi').chant(pack, resolvePack({ language: 'vi', ...input }).words.find((w) => w.id === 'meo'));
  assert.deepEqual(full.map((s) => s.step), ['onset', 'rime', 'blend', 'tone', 'word']);
});

test("a tile's clip gone: the tile is silent and everything else still works", () => {
  const input = viInput();
  const gone = rawManifest('vi-seed').tiles.onset.find((t) => t.id === 'm').audio.name.src;
  const pack = resolvePack({ language: 'vi', ...input, hasMedia: (r) => r !== gone && input.hasMedia(r) });
  const tile = pack.tileById.onset.m;
  assert.equal(tile.audio.long, null);
  assert.equal(tile.audio.short, null);
  assert.equal(tile.audio.silent, true);
  assert.equal(pack.words.length, 47, 'no word is lost to a silent tile');
});

test('the whole media directory gone: no playable words, an empty-state app, not a crash', () => {
  const pack = resolvePack({ language: 'vi', ...viInput(), hasMedia: () => false });
  assert.equal(pack.words.length, 0);
  assert.ok(pack.issues.some((i) => i.code === 'noPlayableWords'));
  const { game, state } = open(pack, 'gone');
  assert.equal(state.phase, 'empty');
  assert.deepEqual(tableView(game, state).cells.filter((c) => c.live), []);
});

/* ---------------------------------------------------- manifest, schema, drafts */

test('no manifest at all: the app reports it and does not crash', () => {
  const pack = resolvePack({ language: 'vi', ...viInput(), manifest: null });
  assert.ok(pack.issues.some((i) => i.code === 'noManifest'));
  assert.equal(pack.words.length, 0, 'without tiles nothing decomposes');
  assert.equal(open(pack, 'nm').state.phase, 'empty');
});

test('a newer schema opens read-only rather than being written (content-pipeline §7)', () => {
  const pack = resolvePack({
    language: 'vi', ...viInput(),
    manifest: { ...rawManifest('vi-seed'), schema: 99 },
  });
  assert.equal(pack.readOnly, true);
  assert.ok(pack.issues.some((i) => i.code === 'newerSchema'));
  assert.equal(pack.words.length, 47, 'and it still plays');
});

test('a mangled neverTogether list falls back to the built-in rules and says so', () => {
  const pack = resolvePack({
    language: 'vi', ...viInput(),
    manifest: { ...rawManifest('vi-seed'), rules: { neverTogether: ['c', 7, null] } },
  });
  assert.ok(pack.issues.some((i) => i.code === 'badNeverTogether'));
  assert.ok(pack.neverTogether.some((s) => s.includes('c') && s.includes('k')));
});

test('a draft never reaches the child (content-pipeline §4.3)', () => {
  const pack = resolvePack({ language: 'vi', ...mutate(viInput(), 'meo', { draft: true }) });
  assert.equal(pack.catalogue.find((c) => c.id === 'meo').reason.code, 'draft');
  assert.equal(pack.words.length, 46);
});

test('a disabled word keeps its own disabledReason for the editor to render', () => {
  const pack = resolvePack({ language: 'vi', ...viInput() });
  const pho = pack.catalogue.find((c) => c.id === 'pho');
  assert.equal(pho.reason.code, 'disabled');
  assert.match(pho.reason.message, /picture/);
});

test('two words built from the same parts: the first wins and the clash is reported', () => {
  const input = viInput();
  const meo = input.words.find((w) => w.id === 'meo');
  const twin = { ...meo, id: 'zzz-meo', text: 'mèo' };
  const pack = resolvePack({ language: 'vi', ...input, words: [...input.words, twin] });
  assert.equal(pack.words.filter((w) => w.text === 'mèo').length, 1);
  assert.equal(pack.catalogue.find((c) => c.id === 'zzz-meo').reason.code, 'duplicateParts');
  assert.ok(pack.issues.some((i) => i.code === 'duplicateParts'));
});

test('every word deleted: a parent-facing empty state, not a crash and not a blank board (L6)', () => {
  const pack = resolvePack({ language: 'vi', ...viInput(), words: [] });
  assert.equal(pack.words.length, 0);
  const { state } = open(pack, 'l6');
  assert.equal(state.phase, 'empty');
  assert.deepEqual(state.album, []);
});

test('resolvePack never throws on content, however mangled', () => {
  const junk = [
    { language: 'vi', manifest: {}, words: [] },
    { language: 'vi', manifest: { tiles: 'nope' }, words: [{}] },
    { language: 'en', manifest: { tiles: { letter: [null, 3, { id: '' }] } }, words: [{ id: 'x' }] },
    { language: 'vi', manifest: { schema: 'one', tiles: { rime: [{ id: 'a', toned: {} }] } }, words: [{ id: 'a', text: 'a' }] },
    { language: 'en', manifest: rawManifest('en-seed'), words: [{ id: 'q', text: 'q', tiles: ['q'], stage: 1, enabled: true }] },
  ];
  for (const input of junk) {
    assert.doesNotThrow(() => resolvePack({ hasMedia: () => true, ...input }));
  }
});

test('an unknown language is a caller error, and it throws', () => {
  assert.throws(() => resolvePack({ language: 'fr', manifest: {}, words: [] }), /unknown language/);
});
