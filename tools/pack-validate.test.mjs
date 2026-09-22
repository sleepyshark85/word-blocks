#!/usr/bin/env node
// Corruption harness for the pack validator. Tier 2 of the verification strategy
// (`development-process.md` §5).
//
//   node --test tools/pack-validate.test.mjs
//
// "NEVER TRUST A GREEN CHECK YOU HAVE NOT SEEN FAIL." Every case below takes a real
// pack, breaks it in one specific way a human or a filesystem could actually break it,
// and asserts that the validator exits NON-ZERO and says why. A validator that has only
// ever been run on good packs is a claim, not a check.
//
// Each case also asserts the message mentions the thing that is wrong, because a
// validator that fails for the wrong reason passes this file by accident.

import { test, before, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const VALIDATE = path.join(ROOT, 'tools', 'pack-validate.mjs');
const SRC_VI = path.join(ROOT, 'packs', 'vi-seed');
const SRC_EN = path.join(ROOT, 'packs', 'en-seed');

let work;
before(() => {
  work = mkdtempSync(path.join(tmpdir(), 'packtest-'));
  assert.ok(existsSync(SRC_VI), `${SRC_VI} must exist — run: node tools/build-seed-pack.mjs`);
});

/** A throwaway copy of a pack. */
function copy(src, name) {
  const dst = path.join(work, `${name}-${Math.random().toString(36).slice(2, 8)}`);
  cpSync(src, dst, { recursive: true });
  return dst;
}

function validate(dir, ...flags) {
  const r = spawnSync(process.execPath, [VALIDATE, dir, ...flags], { encoding: 'utf8' });
  return { code: r.status, out: `${r.stdout}${r.stderr}` };
}

const readJson = (f) => JSON.parse(readFileSync(f, 'utf8'));
const writeJson = (f, o) => writeFileSync(f, `${JSON.stringify(o, null, 2)}\n`);

/** Mutate one word file in place. */
function breakWord(dir, id, fn) {
  const f = path.join(dir, 'words', `${id}.json`);
  const w = readJson(f);
  const out = fn(w);
  writeJson(f, out ?? w);
  return f;
}
function breakManifest(dir, fn) {
  const f = path.join(dir, 'pack.json');
  const m = readJson(f);
  writeJson(f, fn(m) ?? m);
  // pack.json.bak would rescue the pack and mask the fault under test.
  rmSync(path.join(dir, 'pack.json.bak'), { force: true });
}

/**
 * Assert the validator rejects, and that it says why. `code` is checked first because a
 * tool that prints a complaint and exits 0 is worse than one that says nothing.
 */
function rejects(dir, needle, flags = []) {
  const { code, out } = validate(dir, ...flags);
  assert.equal(code, 1, `expected exit 1, got ${code}. Output:\n${out}`);
  assert.match(out, needle, `exit 1 was for the wrong reason. Output:\n${out}`);
  return out;
}

/* ============================================================== the baseline ==== */

describe('baseline', () => {
  test('the English seed pack is valid — so a later rejection means something', () => {
    const { code, out } = validate(SRC_EN);
    assert.equal(code, 0, `packs/en-seed should validate clean. Output:\n${out}`);
    assert.match(out, /OK/);
  });

  test('the Vietnamese seed pack is valid', () => {
    // It was not, when this harness was written: `word-list.md` gave `hổ` the rime `o`,
    // so the pack composed `hỏ`. The validator caught it, the literacy document was
    // corrected (`word-list.md:141`, and the correction note at :151), and the pack was
    // rebuilt. This assertion is what stops it coming back.
    const { code, out } = validate(SRC_VI);
    assert.equal(code, 0, `packs/vi-seed should validate clean. Output:\n${out}`);
    assert.match(out, /OK/);
  });

  test('a missing directory is exit 2, not exit 1 — "cannot look" is not "is bad"', () => {
    const r = spawnSync(process.execPath, [VALIDATE, path.join(work, 'nope')], { encoding: 'utf8' });
    assert.equal(r.status, 2);
  });
});

/* ======================================================== the filesystem breaks == */

describe('a filesystem or an interrupted write', () => {
  test('a word file that is not JSON — the stray-comma case', () => {
    const d = copy(SRC_EN, 'badjson');
    writeFileSync(path.join(d, 'words', 'cat.json'), '{ "id": "cat", "text": "cat", }\n');
    const out = rejects(d, /does not parse as JSON/);
    // The whole point, and the reason there is one file per word: the pack still has 40
    // words and 39 of them are intact and playable. A single `words.json` array would
    // have lost all 40 to the same comma.
    assert.match(out, /words\s+40 \(39 enabled, 39 playable, 0 photographed, 1 UNREADABLE\)/);
  });

  test('a word file truncated mid-write', () => {
    const d = copy(SRC_EN, 'trunc');
    const f = path.join(d, 'words', 'dog.json');
    writeFileSync(f, readFileSync(f, 'utf8').slice(0, 60));
    rejects(d, /does not parse as JSON/);
  });

  test('an empty word file', () => {
    const d = copy(SRC_EN, 'empty');
    writeFileSync(path.join(d, 'words', 'pig.json'), '');
    rejects(d, /does not parse as JSON/);
  });

  test('pack.json unparseable AND no .bak — the pack cannot be opened', () => {
    const d = copy(SRC_EN, 'nomanifest');
    writeFileSync(path.join(d, 'pack.json'), '{ broken');
    rmSync(path.join(d, 'pack.json.bak'), { force: true });
    rejects(d, /unparseable/);
  });

  test('pack.json unparseable but .bak is good — the pack survives, with a warning', () => {
    const d = copy(SRC_EN, 'bakrescue');
    writeFileSync(path.join(d, 'pack.json.bak'), readFileSync(path.join(d, 'pack.json')));
    writeFileSync(path.join(d, 'pack.json'), '{ broken');
    const { code, out } = validate(d);
    assert.equal(code, 0, `the .bak should rescue the pack. Output:\n${out}`);
    assert.match(out, /validated against pack\.json\.bak/);
  });

  test('DANGLING IMAGE: a word points at a blob that is not on disk', () => {
    const d = copy(SRC_EN, 'dangling');
    breakWord(d, 'cat', (w) => {
      w.images = [{
        src: 'media/img/DOES-NOT-EXIST.jpg',
        source: 'commons.wikimedia.org',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:X.jpg',
        license: 'CC BY-SA 4.0',
        creator: 'Someone',
        modified: 'cropped',
      }];
      return w;
    });
    // This is the case that was under-reported: the only finding used to be an
    // attribution warning, and the missing file was silent.
    rejects(d, /points at media\/img\/DOES-NOT-EXIST\.jpg, which is not in the pack/);
  });

  test('DANGLING AUDIO: a word points at a clip that is not on disk', () => {
    const d = copy(SRC_EN, 'danglingaud');
    breakWord(d, 'bus', (w) => { w.audio.word.src = 'media/aud/gone.mp3'; return w; });
    rejects(d, /media\/aud\/gone\.mp3, which is not in the pack/);
  });

  test('a media file that is zero bytes', () => {
    const d = copy(SRC_EN, 'zerobyte');
    const w = readJson(path.join(d, 'words', 'sun.json'));
    writeFileSync(path.join(d, w.audio.word.src), '');
    rejects(d, /empty or non-file/);
  });

  test('an HTML error page saved with a .jpg name — magic bytes, not the extension', () => {
    const d = copy(SRC_EN, 'htmljpg');
    mkdirSync(path.join(d, 'media', 'img'), { recursive: true });
    writeFileSync(path.join(d, 'media', 'img', 'fake.jpg'), '<!DOCTYPE html><html>429 Too Many Requests</html>');
    breakWord(d, 'fox', (w) => {
      w.images = [{ src: 'media/img/fake.jpg', source: 'camera' }];
      return w;
    });
    rejects(d, /is not a jpeg file \(magic bytes say unrecognised\)/);
  });

  test('a truncated mp3 that still starts with a valid header is NOT caught here', () => {
    // Recorded as a known limit rather than left as an assumption. Magic bytes prove the
    // first four bytes, nothing more. Decoding every clip is `tts.py`'s job at generation
    // time (it refuses a clip that decodes to silence); the validator does not decode.
    const d = copy(SRC_EN, 'halfmp3');
    const w = readJson(path.join(d, 'words', 'cup.json'));
    const f = path.join(d, w.audio.word.src);
    writeFileSync(f, readFileSync(f).subarray(0, 200));
    const { code } = validate(d);
    assert.equal(code, 0, 'documenting the limit: a truncated-but-well-headed mp3 passes');
  });
});

/* =========================================================== a human edits it ==== */

describe('a human editing the pack', () => {
  test('an unsafe media path escaping the pack', () => {
    const d = copy(SRC_EN, 'traversal');
    breakWord(d, 'cat', (w) => { w.images = [{ src: '../../../etc/passwd', source: 'camera' }]; return w; });
    rejects(d, /not a safe media reference/);
  });

  test('an absolute media path', () => {
    const d = copy(SRC_EN, 'abs');
    breakWord(d, 'cat', (w) => { w.images = [{ src: '/etc/hosts', source: 'camera' }]; return w; });
    rejects(d, /not a safe media reference/);
  });

  test('a media path outside media/', () => {
    const d = copy(SRC_EN, 'outside');
    breakWord(d, 'cat', (w) => { w.images = [{ src: 'pack.json', source: 'camera' }]; return w; });
    rejects(d, /must start with "media\/img\/" or "media\/aud\/"/);
  });

  test('two words claiming the same id', () => {
    const d = copy(SRC_EN, 'dupid');
    const w = readJson(path.join(d, 'words', 'cat.json'));
    w.text = 'rat';
    writeJson(path.join(d, 'words', 'rat.json'), w);
    rejects(d, /does not match the filename/);
  });

  test('a word id that does not match its filename', () => {
    const d = copy(SRC_EN, 'idmismatch');
    breakWord(d, 'hat', (w) => { w.id = 'hatt'; return w; });
    rejects(d, /does not match the filename/);
  });

  test('an image entry with no licence, from a third party', () => {
    const d = copy(SRC_EN, 'nolicence');
    mkdirSync(path.join(d, 'media', 'img'), { recursive: true });
    const jpg = path.join(d, 'media', 'img', 'real.jpg');
    execFileSync('magick', ['-size', '512x512', 'xc:gray', '-quality', '82', jpg]);
    breakWord(d, 'cat', (w) => { w.images = [{ src: 'media/img/real.jpg', source: 'commons.wikimedia.org' }]; return w; });
    rejects(d, /has no "license"/);
  });

  test('an image with no source field at all', () => {
    const d = copy(SRC_EN, 'nosource');
    mkdirSync(path.join(d, 'media', 'img'), { recursive: true });
    const jpg = path.join(d, 'media', 'img', 'real2.jpg');
    execFileSync('magick', ['-size', '512x512', 'xc:gray', '-quality', '82', jpg]);
    breakWord(d, 'cat', (w) => { w.images = [{ src: 'media/img/real2.jpg' }]; return w; });
    rejects(d, /has no "source"/);
  });

  test('a NoDerivatives image, which the crop-and-resize pipeline may not use', () => {
    const d = copy(SRC_EN, 'nd');
    mkdirSync(path.join(d, 'media', 'img'), { recursive: true });
    const jpg = path.join(d, 'media', 'img', 'nd.jpg');
    execFileSync('magick', ['-size', '512x512', 'xc:gray', '-quality', '82', jpg]);
    breakWord(d, 'cat', (w) => {
      w.images = [{ src: 'media/img/nd.jpg', source: 'commons.wikimedia.org', sourceUrl: 'https://x', creator: 'Y', license: 'CC BY-ND 4.0', modified: 'cropped' }];
      return w;
    });
    rejects(d, /NoDerivatives/);
  });
});

/* ==================================================== the no-mixing boundary ===== */

describe('the language boundary', () => {
  test('a word carrying a language field', () => {
    const d = copy(SRC_EN, 'langfield');
    breakWord(d, 'cat', (w) => { w.language = 'vi'; return w; });
    rejects(d, /must not carry a "language" field/);
  });

  test('Vietnamese syllables in an English pack', () => {
    const d = copy(SRC_EN, 'vishape');
    breakWord(d, 'cat', (w) => { w.syllables = [{ onset: 'm', rime: 'eo', tone: 'huyen' }]; return w; });
    rejects(d, /must not carry Vietnamese `syllables`/);
  });

  test('English tiles in a Vietnamese pack', () => {
    const d = copy(SRC_VI, 'enshape');
    breakWord(d, 'meo', (w) => { w.tiles = ['m', 'e', 'o']; return w; });
    rejects(d, /must not carry English `tiles`/);
  });

  test('a pack with no language', () => {
    const d = copy(SRC_EN, 'nolang');
    breakManifest(d, (m) => { delete m.language; return m; });
    rejects(d, /language must be one of/);
  });

  test('the wrong tile groups for the language', () => {
    const d = copy(SRC_EN, 'groups');
    breakManifest(d, (m) => { m.tiles = { onset: [], rime: [], tone: [] }; return m; });
    rejects(d, /must have exactly the tile groups letter/);
  });
});

/* ============================================ the writing system, Vietnamese ===== */

describe('Vietnamese orthography (literacy-vi.md)', () => {
  test('§5.2 an illegal tone on a stop-final rime', () => {
    const d = copy(SRC_VI, 'vitone');
    breakWord(d, 'sach', (w) => { w.syllables[0].tone = 'huyen'; return w; });
    rejects(d, /tone "huyen" is illegal on rime "ach"/);
  });

  test('§4.1 `ngh` before a non-front rime', () => {
    const d = copy(SRC_VI, 'vingh');
    breakWord(d, 'ngua', (w) => { w.syllables[0].onset = 'ngh'; return w; });
    rejects(d, /onset "ngh" is only legal before/);
  });

  test('§4.1 `c` before a front rime — the k/c pair', () => {
    const d = copy(SRC_VI, 'vick');
    breakWord(d, 'kem', (w) => { w.syllables[0].onset = 'c'; return w; });
    rejects(d, /the correct spelling is "k"/);
  });

  test('§4.1 `g` before ê — the g/gh pair', () => {
    const d = copy(SRC_VI, 'vigh');
    breakWord(d, 'ghe', (w) => { w.syllables[0].onset = 'g'; return w; });
    rejects(d, /the correct spelling is "gh"/);
  });

  test('§5.4 a rime storing a toned form for a tone that cannot exist', () => {
    const d = copy(SRC_VI, 'vitoned');
    breakManifest(d, (m) => {
      m.tiles.rime.find((r) => r.id === 'ach').toned.huyen = 'àch';
      return m;
    });
    rejects(d, /must be null/);
  });

  test('§5.4 a rime missing a form for a tone that IS legal — a blank tile', () => {
    const d = copy(SRC_VI, 'viblank');
    breakManifest(d, (m) => {
      m.tiles.rime.find((r) => r.id === 'eo').toned.nga = null;
      return m;
    });
    rejects(d, /the tone row would show a blank tile/);
  });

  test('§6.1 neverTogether going stale when the dialect changes', () => {
    const d = copy(SRC_VI, 'vidialect');
    breakManifest(d, (m) => { m.dialect = 'southern'; return m; });
    rejects(d, /does not match dialect "southern"/);
  });

  test('a spelling that disagrees with its decomposition', () => {
    const d = copy(SRC_VI, 'vispell');
    breakWord(d, 'meo', (w) => { w.text = 'méo'; return w; });
    rejects(d, /spelling disagrees with the decomposition/);
  });

  test('a decomposition naming a tile the pack does not have', () => {
    const d = copy(SRC_VI, 'vitile');
    breakWord(d, 'meo', (w) => { w.syllables[0].rime = 'zzz'; return w; });
    rejects(d, /rime "zzz" is not a tile in this pack/);
  });

  test('§1.1 syllables must be an array', () => {
    const d = copy(SRC_VI, 'viarr');
    breakWord(d, 'meo', (w) => { w.syllables = { onset: 'm', rime: 'eo', tone: 'huyen' }; return w; });
    rejects(d, /syllables must be a non-empty array/);
  });
});

/* =============================================== the writing system, English ===== */

describe('English orthography (literacy-en.md)', () => {
  test('§1 tiles that do not spell the word', () => {
    const d = copy(SRC_EN, 'enspell');
    breakWord(d, 'cat', (w) => { w.tiles = ['c', 'a', 'p']; return w; });
    rejects(d, /tiles spell "cap" but text is "cat"/);
  });

  test('§3.3 a final-only tile at the start of a word', () => {
    const d = copy(SRC_EN, 'enck');
    breakWord(d, 'duck', (w) => { w.tiles = ['ck', 'u', 'd']; w.text = 'ckud'; return w; });
    rejects(d, /can never start a word/);
  });

  test('§3.2 a word with no vowel tile', () => {
    const d = copy(SRC_EN, 'envowel');
    breakWord(d, 'cat', (w) => { w.tiles = ['c', 't']; w.text = 'ct'; return w; });
    rejects(d, /no vowel tile/);
  });

  test('§3.5 the excluded tile `q` reappearing in the inventory', () => {
    const d = copy(SRC_EN, 'enq');
    breakManifest(d, (m) => { m.tiles.letter.push({ id: 'q', glyph: 'q', kind: 'consonant', position: 'any', sound: 'kwuh', anchor: 'queen', audio: {} }); return m; });
    rejects(d, /excluded from v1/);
  });

  test('§3.3 a final-only tile declared as position "any"', () => {
    const d = copy(SRC_EN, 'enpos');
    breakManifest(d, (m) => { m.tiles.letter.find((t) => t.id === 'ck').position = 'any'; return m; });
    rejects(d, /must be position "final"/);
  });
});

/* ================================================================ versioning ===== */

describe('schema versioning', () => {
  test('a pack from a NEWER app is refused rather than silently downgraded', () => {
    const d = copy(SRC_EN, 'newschema');
    breakManifest(d, (m) => { m.schema = 99; return m; });
    rejects(d, /newer than this tool understands/);
  });

  test('a non-integer schema', () => {
    const d = copy(SRC_EN, 'badschema');
    breakManifest(d, (m) => { m.schema = '1'; return m; });
    rejects(d, /schema must be an integer/);
  });
});

/* ===================================================== incompleteness is not ===== */
/* =============================================================== corruption ===== */

describe('incomplete is not corrupt', () => {
  test('a freshly built pack with no media at all is VALID', () => {
    const d = copy(SRC_EN, 'nomedia');
    for (const f of ['words']) void f;
    const { execSync } = { execSync: null }; void execSync;
    // strip every media reference, as `build-seed-pack.mjs` leaves them
    for (const wf of ['cat', 'dog', 'bus']) {
      breakWord(d, wf, (w) => { w.images = []; w.audio = { word: null, sentence: null }; return w; });
    }
    const { code, out } = validate(d);
    assert.equal(code, 0, `an uncurated pack is incomplete, not broken. Output:\n${out}`);
    assert.match(out, /no word audio/);
  });

  test('...but --strict rejects it, because that is what "ready for a child" means', () => {
    const d = copy(SRC_EN, 'nomediastrict');
    breakWord(d, 'cat', (w) => { w.images = []; w.audio = { word: null, sentence: null }; return w; });
    const { code } = validate(d, '--strict');
    assert.equal(code, 1);
  });

  test('an unreferenced blob is a warning and is reported by --gc', () => {
    const d = copy(SRC_EN, 'orphan');
    mkdirSync(path.join(d, 'media', 'img'), { recursive: true });
    execFileSync('magick', ['-size', '512x512', 'xc:gray', '-quality', '82', path.join(d, 'media', 'img', 'orphan.jpg')]);
    const { code, out } = validate(d, '--gc');
    assert.equal(code, 0, 'an orphan blob is garbage, not corruption');
    assert.match(out, /orphan\s+media\/img\/orphan\.jpg/);
  });
});

/* ============================================================ drafts =========== */

describe('drafts — a word captured mid-play', () => {
  test('a draft with a picture and a recording but no decomposition is VALID', () => {
    const d = copy(SRC_VI, 'draft');
    const src = readJson(path.join(d, 'words', 'meo.json'));
    writeJson(path.join(d, 'words', 'conchim.json'), {
      id: 'conchim',
      text: 'con chim',
      draft: true,
      enabled: false,
      syllables: [],
      images: [],
      audio: { word: src.audio.word, blend: null, sentence: null },
    });
    const { code, out } = validate(d);
    assert.equal(code, 0, `a draft is incomplete, not wrong. Output:\n${out}`);
    assert.match(out, /1 draft/);
  });

  test('a draft that is still enabled is an ERROR — the child must not meet it', () => {
    const d = copy(SRC_VI, 'draftenabled');
    writeJson(path.join(d, 'words', 'conchim.json'), {
      id: 'conchim', text: 'con chim', draft: true, enabled: true, syllables: [], images: [], audio: {},
    });
    rejects(d, /is a draft but is not disabled/);
  });

  test('a draft with an unsafe media path is STILL an error', () => {
    const d = copy(SRC_VI, 'draftunsafe');
    writeJson(path.join(d, 'words', 'conchim.json'), {
      id: 'conchim', text: 'con chim', draft: true, enabled: false, syllables: [],
      images: [{ src: '../../escape.jpg', source: 'camera' }], audio: {},
    });
    rejects(d, /not a safe media reference/);
  });
});

/* ================================================= rebuilding must not destroy ==== */

describe('build-seed-pack preserves curation', () => {
  test('a rebuild keeps images, word audio and hand-supplied tile curriculum', () => {
    // This is the regression test for a real defect: the first builder deleted every
    // word file and wrote fresh ones with `images: []`, so fixing a typo in
    // `word-list.md` would have wiped every curated photograph in the pack.
    // The builder always writes to <out>/vi-seed, so the fixture must live at that path.
    const parent = path.join(work, `rebuild-${Math.random().toString(36).slice(2, 8)}`);
    mkdirSync(parent, { recursive: true });
    const d = path.join(parent, 'vi-seed');
    cpSync(SRC_VI, d, { recursive: true });
    const before = readJson(path.join(d, 'words', 'pho.json'));
    assert.ok(before.images.length > 0, 'fixture needs a word with images');
    assert.ok(before.audio.word?.src, 'fixture needs a word with audio');

    // A hand-edited tile label, which literacy-vi.md §5.3 says must be editable.
    const man = readJson(path.join(d, 'pack.json'));
    man.tiles.tone.find((t) => t.id === 'ngang').label = 'không dấu';
    writeJson(path.join(d, 'pack.json'), man);

    const r = spawnSync(process.execPath,
      [path.join(ROOT, 'tools', 'build-seed-pack.mjs'), '--lang', 'vi', '--out', parent],
      { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /preserved media on 50\/50 word\(s\)/);

    const after = readJson(path.join(d, 'words', 'pho.json'));
    assert.equal(after.images.length, before.images.length, 'images were destroyed by a rebuild');
    assert.equal(after.audio.word.src, before.audio.word.src, 'audio was destroyed by a rebuild');
    assert.equal(readJson(path.join(d, 'pack.json')).tiles.tone.find((t) => t.id === 'ngang').label,
      'không dấu', 'an edited tile label was destroyed by a rebuild');
    assert.equal(validate(d).code, 0);
  });
});
