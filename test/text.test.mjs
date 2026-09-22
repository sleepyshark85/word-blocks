// Vietnamese normalisation is a correctness requirement, not an i18n chore. A word the
// mother types on a phone and a word the seed builder wrote must compare equal.

import test from 'node:test';
import assert from 'node:assert/strict';
import { nfc, sameText, glyphLength } from '../src/engine/text.mjs';
import { viPack } from './helpers/load.mjs';

const NFD_MEO = 'mèo';   // m + e + combining grave + o
const NFC_MEO = 'mèo';

test('NFD and NFC Vietnamese are different strings', () => {
  assert.notEqual(NFD_MEO, NFC_MEO);
  assert.equal(NFD_MEO.length, 4);
  assert.equal(NFC_MEO.length, 3);
});

test('nfc() makes them the same', () => {
  assert.equal(nfc(NFD_MEO), NFC_MEO);
  assert.equal(sameText(NFD_MEO, NFC_MEO), true);
});

test('sameText is false for genuinely different words — mả is not mã', () => {
  assert.equal(sameText('mả', 'mã'), false);
  assert.equal(sameText('hổ', 'hô'), false);
});

test('nfc passes non-strings through, so optional fields can be normalised blind', () => {
  assert.equal(nfc(null), null);
  assert.equal(nfc(undefined), undefined);
  assert.equal(nfc(7), 7);
});

test('glyphLength counts characters a reader sees, not UTF-16 units', () => {
  assert.equal(glyphLength('ăng'), 3);
  assert.equal(glyphLength('uôi'), 3);
  assert.equal(glyphLength('ăng'), 3); // decomposed ă
  assert.equal(glyphLength('ngh'), 3);
});

test('a word stored decomposed loads equal to the same word stored composed', () => {
  const pack = viPack();
  const meo = pack.words.find((w) => w.id === 'meo');
  assert.equal(meo.text, NFC_MEO);
  assert.equal(sameText(meo.text, NFD_MEO), true);
});

test('every string the pack hands the engine is already NFC', () => {
  for (const lang of ['vi', 'en']) {
    const pack = lang === 'vi' ? viPack() : null;
    if (!pack) continue;
    for (const w of pack.words) assert.equal(w.text, w.text.normalize('NFC'), w.id);
    for (const t of pack.tiles.rime) {
      assert.equal(t.glyph, t.glyph.normalize('NFC'), t.id);
      for (const k of Object.keys(t.toned)) {
        assert.equal(t.toned[k], t.toned[k].normalize('NFC'), `${t.id}.${k}`);
      }
    }
    for (const t of pack.tiles.onset) assert.equal(t.label, t.label.normalize('NFC'), t.id);
    for (const t of pack.tiles.tone) assert.equal(t.label, t.label.normalize('NFC'), t.id);
  }
});

test('a decomposed rime id in a word file still resolves — normalised at the boundary', async () => {
  const { resolvePack } = await import('../src/engine/index.mjs');
  const { readPackInputs, packDir } = await import('./helpers/load.mjs');
  const input = readPackInputs(packDir('vi-seed'));
  const words = input.words.map((w) => (w.id !== 'sua' ? w : {
    ...w,
    text: w.text.normalize('NFD'),
    syllables: [{ ...w.syllables[0], rime: w.syllables[0].rime.normalize('NFD') }],
  }));
  const pack = resolvePack({ language: 'vi', ...input, words });
  const sua = pack.words.find((w) => w.id === 'sua');
  assert.ok(sua, 'a decomposed word must not be lost');
  assert.equal(sua.text, 'sữa');
  assert.equal(sua.syllables[0].rime, 'ưa');
});
