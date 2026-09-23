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

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import * as R from './lib/rules.mjs';
import * as L from './lib/licence.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const VALIDATE = path.join(ROOT, 'tools', 'pack-validate.mjs');
const SRC_VI = path.join(ROOT, 'packs', 'vi-seed');
const SRC_EN = path.join(ROOT, 'packs', 'en-seed');

let work;
before(() => {
  work = mkdtempSync(path.join(tmpdir(), 'packtest-'));
  assert.ok(existsSync(SRC_VI), `${SRC_VI} must exist — run: node tools/build-seed-pack.mjs`);
});

/*
 * ALWAYS, INCLUDING AFTER A FAILURE OR AN EXCEPTION. A run that leaves its fixtures
 * behind is a defect in the test: sixteen abandoned runs at 26 GB each filled the root
 * filesystem and broke every command in the session, and the symptom (ENOSPC, truncated
 * files, commands failing for unrelated reasons) points nowhere near the harness.
 */
after(() => {
  if (work) rmSync(work, { recursive: true, force: true });
});

/**
 * DIRECTORIES A FIXTURE MUST NOT COPY.
 *
 * A pack directory is ~470 MB, and only ~15 MB of that is the pack. The rest is
 * `.candidates/` — the curation scratch: raw downloads, contact sheets and the fetch
 * cache (`content-pipeline.md` §2). This harness makes ~28 copies per run, so a naive
 * recursive copy is 13 GB per run, and a handful of runs filled the machine's root
 * filesystem to 532 KB free and broke every command in the session.
 *
 * NOTHING UNDER VALIDATION NEEDS IT. `pack-validate.mjs` reads `.candidates/` only for
 * the curation-yield denominator, and that path already falls back to `build.fetched` on
 * the word precisely because the scratch gets cleared (`pack-validate.mjs` §CURATION
 * YIELD). Excluding it from a fixture costs nothing.
 *
 * `.candidates/` itself must NOT be deleted from the real packs: clearing it is what
 * silently erased the yield statistic once already.
 */
const FIXTURE_EXCLUDE = new Set(['.candidates', '.tmp-audio', '.trash', 'node_modules']);

/** Copy a pack without its scratch. */
function copyPack(src, dst) {
  cpSync(src, dst, {
    recursive: true,
    filter: (from) => !FIXTURE_EXCLUDE.has(path.basename(from)),
  });
}

/** A throwaway copy of a pack. */
function copy(src, name) {
  const dst = path.join(work, `${name}-${Math.random().toString(36).slice(2, 8)}`);
  copyPack(src, dst);
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

const VENV = path.join(ROOT, 'tools', '.venv', 'bin', 'python');

/**
 * An unprimed frame-boundary cut: exactly the bug this suite exists to prevent.
 *
 * The cut frame is chosen because it PROVABLY cannot decode without its reservoir
 * history — `part2_3_length` exceeds the bits the frame carries itself. That matters:
 * an earlier version of this fixture just picked frame 3, which happened to be a frame
 * whose demand fit in its own bytes, so the decoder never complained and the case
 * passed against a validator that was doing nothing. Picking on the property rather
 * than on an index is the difference between a fixture and a coincidence.
 *
 * Hoisted to module scope by revision 5, because the new Vietnamese prefix clips have to
 * pass through the same gate and a second copy of this reasoning is a second place for it
 * to rot. The `ac` clip in `vi-seed` was cut at frame 6, then 12, then 15 by hand before
 * this helper was used, and all three decoded cleanly — the first fifteen frames are
 * gTTS's leading silence, which carries no reservoir. That is exactly the coincidence the
 * paragraph above is about, observed a second time.
 */
async function orphanedCut(srcFile) {
  const M = await import('./lib/mp3.mjs');
  const b = readFileSync(srcFile);
  const t = M.parseFrames(b);
  const from = t.frames.findIndex((fr, i) => i > 0 && M.sideInfo(b, fr).needsHistory);
  assert.ok(from > 0, `${srcFile} has no frame that provably needs reservoir history`);
  return b.subarray(t.frames[from].offset);
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
    // The photograph count is deliberately NOT asserted. It was `0 photographed` when this
    // test was written, and the assertion passed only because no word had been curated
    // yet; it broke the moment the content got better, which is the same trap as the
    // seven tests fixed by test/helpers/fixtures.mjs. What this test is about is that one
    // stray comma costs one word and not the other thirty-nine.
    assert.match(out, /words\s+40 \(39 enabled, 39 playable,.*1 UNREADABLE\)/);
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

  /**
   * **AC S14 / D1b, and this test is the inverse of the one it replaces.** Revision 2
   * rejected a `q` tile outright; `ui.md` §8.1 puts every character of `inventoryOrder`
   * on the board and says a character with **zero words behind it** is a normal,
   * permanent state — so the validator must accept it. What stays excluded
   * (`literacy-en.md` §3.5) is `q` inside a *word*, and that moved to the word check.
   */
  test('S14 a character with no words behind it is ACCEPTED — `q` on the board', () => {
    const { code, out } = validate(SRC_EN);
    assert.equal(code, 0, `en-seed ships q with no word behind it and must validate. Output:\n${out}`);
    assert.match(out, /tiles\.letter\[q\]/, 'the validator should still SAY q has no word, as a warning');
    assert.doesNotMatch(out, /ERROR[^\n]*letter\[q\]/, 'a wordless character is not an error');
  });

  test('S14 the same for Vietnamese — `ngh` has no seed word and is not an error', () => {
    const { code, out } = validate(SRC_VI);
    assert.equal(code, 0, `vi-seed ships ngh with no word behind it. Output:\n${out}`);
    assert.doesNotMatch(out, /ERROR[^\n]*onset\[ngh\]/);
  });

  test('§3.5 `q` inside a WORD is still rejected', () => {
    const d = copy(SRC_EN, 'enqword');
    breakWord(d, 'cat', (w) => { w.tiles = ['q', 'a', 't']; w.text = 'qat'; return w; });
    rejects(d, /excluded from v1 words/);
  });

  test('§3.3 a final-only tile declared as position "any"', () => {
    const d = copy(SRC_EN, 'enpos');
    breakManifest(d, (m) => { m.tiles.letter.find((t) => t.id === 'ck').position = 'any'; return m; });
    rejects(d, /must be position "final"/);
  });

  test('§3.3 EVERY final-only tile is rejected word-initially, `gg` included', () => {
    // `gg` was missing from EN_FINAL_ONLY and nothing failed, because the pack happened
    // to declare it correctly. Iterating the constant is what stops the next omission
    // being invisible too.
    for (const id of R.EN_FINAL_ONLY) {
      const d = copy(SRC_EN, `enfinal-${id}`);
      breakManifest(d, (m) => {
        const t = m.tiles.letter.find((x) => x.id === id);
        assert.ok(t, `${id} should be a tile in the English pack`);
        t.position = 'any';
        return m;
      });
      rejects(d, /must be position "final"/);
    }
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
    copyPack(SRC_VI, d);
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

/* ============================================ the clip duration budget (E15/N15) ==== */

/**
 * The owner played the built app and said the English letter sounds were "not good
 * enough, voices seem to be mixed up with each other". The cause was 1.6 s of engine
 * padding on every clip: `short` shipped at 1896–2832 ms against a spec that assumed
 * 350 ms, so a child tapping every 300–600 ms heard stubs. `ui.md` E15 / AC N15 put a
 * duration budget on a tap clip and made the gate the content-engineer's.
 *
 * A budget nothing enforces is a sentence in a document. These cases are what stop the
 * padding coming back, and each one has been seen to fail: the ceiling case reproduces
 * the exact defect by pointing a tile at one of the original untrimmed clips.
 */
describe('clip duration budget', () => {
  /** Build a valid MP3 of roughly `ms` by repeating a real clip's frames. */
  function stretchedClip(srcPack, ms) {
    const man = readJson(path.join(srcPack, 'pack.json'));
    const group = man.tiles.letter ? 'letter' : 'onset';
    const slot = man.tiles.letter ? 'short' : 'name';
    const tile = man.tiles[group].find((t) => t.audio?.[slot]?.src);
    const buf = readFileSync(path.join(srcPack, tile.audio[slot].src));
    const one = readFileSync(path.join(srcPack, tile.audio[slot].src));
    const reps = Math.ceil(ms / (tile.audio[slot].ms || 700));
    return { buf: Buffer.concat(Array.from({ length: reps }, () => one)), group, slot, tile, one: buf };
  }

  test('a tap clip over the pack ceiling is an ERROR — the padding cannot come back', () => {
    const d = copy(SRC_EN, 'overlong');
    const { buf, group, slot } = stretchedClip(SRC_EN, 2400);
    mkdirSync(path.join(d, 'media', 'aud'), { recursive: true });
    writeFileSync(path.join(d, 'media', 'aud', 'overlong.mp3'), buf);
    breakManifest(d, (m) => {
      const t = m.tiles[group].find((x) => x.audio?.[slot]);
      t.audio[slot] = { ...t.audio[slot], src: 'media/aud/overlong.mp3', bytes: buf.length };
      return m;
    });
    rejects(d, /ceiling for a tap clip/);
  });

  test('the ceiling is read from the manifest, not hard-coded — she can change it', () => {
    const d = copy(SRC_EN, 'tighter');
    breakManifest(d, (m) => { m.media.audio.tapCeilingMs = 300; return m; });
    // Every shipped short clip is longer than 300 ms, so tightening the budget must bite.
    rejects(d, /ceiling for a tap clip is 300 ms/);
  });

  test('duration comes from the BYTES, not from `audio.ms` — a claim is not a measurement', () => {
    const d = copy(SRC_EN, 'lying');
    const { buf, group, slot } = stretchedClip(SRC_EN, 2400);
    writeFileSync(path.join(d, 'media', 'aud', 'overlong.mp3'), buf);
    breakManifest(d, (m) => {
      const t = m.tiles[group].find((x) => x.audio?.[slot]);
      // Claim it is well within budget. The file says otherwise, and the file wins.
      t.audio[slot] = { ...t.audio[slot], src: 'media/aud/overlong.mp3', bytes: buf.length, ms: 400 };
      return m;
    });
    rejects(d, /ceiling for a tap clip/);
  });

  test('a clip whose ms disagrees with its frames is reported', () => {
    const d = copy(SRC_EN, 'msdrift');
    breakManifest(d, (m) => {
      const t = m.tiles.letter.find((x) => x.audio?.short);
      t.audio.short = { ...t.audio.short, ms: 12 };
      return m;
    });
    const { code, out } = validate(d);
    assert.equal(code, 0, 'a wrong ms is a warning, not a broken pack');
    assert.match(out, /claim a duration their bytes do not support/);
  });

  test('an mp3 with valid magic bytes but no decodable frames is an ERROR', () => {
    // content-pipeline.md §6 records that magic-byte sniffing proves four bytes and
    // nothing more. Reading the frame table is what closes part of that gap.
    const d = copy(SRC_EN, 'notframes');
    // `ID3` + a tag that swallows the whole (tiny) file: sniffs as mp3, holds no audio.
    const fake = Buffer.concat([Buffer.from('ID3\x04\x00\x00\x00\x00\x02\x01', 'latin1'), Buffer.alloc(64, 0)]);
    writeFileSync(path.join(d, 'media', 'aud', 'hollow.mp3'), fake);
    breakManifest(d, (m) => {
      const t = m.tiles.letter.find((x) => x.audio?.short);
      t.audio.short = { ...t.audio.short, src: 'media/aud/hollow.mp3', bytes: fake.length };
      return m;
    });
    rejects(d, /cannot read its MPEG frames/);
  });

  test('a non-tap clip gets the longer ceiling, so a word clip is not judged as a letter', () => {
    const d = copy(SRC_EN, 'longslot');
    // Every shipped `long` clip is over the 700 ms tap target and several are over
    // 1500 ms; none of that may fail the pack, because nothing fires them on a tap.
    const man = readJson(path.join(d, 'pack.json'));
    const longs = man.tiles.letter.map((t) => t.audio?.long?.ms).filter(Boolean);
    assert.ok(Math.max(...longs) > man.media.audio.tapCeilingMs,
      'fixture needs a `long` clip past the tap ceiling, or this case proves nothing');
    assert.equal(validate(d).code, 0);
  });
});

/* ================================================= every clip must DECODE cleanly ==== */

/**
 * THE CHECK THAT WAS MISSING, AND THE DEFECT THAT PROVED IT WAS MISSING.
 *
 * `audio-trim.mjs` cut engine padding at MP3 frame boundaries and verified the result by
 * decoding it and comparing samples against the original. Every clip passed. It shipped
 * 29 of 70 English clips that made libmpg123 report `part2_3_length too large for
 * available bit count` on their FIRST frame — the start of the letter sound.
 *
 * The sample comparison could not see it: Layer III keeps a frame's data up to 255 bytes
 * behind it in the bit reservoir, a frame-boundary cut orphans the first retained frame
 * from history that is no longer in the file, and libmpg123 CONCEALS the underrun by
 * decoding with whatever bits it has. So the samples matched while the stream was
 * malformed, and another decoder is free to click, mute or drop instead.
 *
 * Note what the duration gate does NOT do here: the poisoned clip below is 768 ms, well
 * inside the 1500 ms ceiling. The two checks are independent and both are needed.
 */
describe('clips must decode without decoder diagnostics', () => {
  test('a clip whose bit reservoir was orphaned is an ERROR, even though it is short enough', async (t) => {
    if (!existsSync(VENV)) return t.skip('no venv — the decode check needs a decoder');
    const d = copy(SRC_EN, 'orphaned');
    const man = readJson(path.join(d, 'pack.json'));
    const tile = man.tiles.letter.find((x) => x.audio?.short?.src);
    const src = path.join(d, tile.audio.short.src);
    const cut = await orphanedCut(src);
    writeFileSync(path.join(d, 'media', 'aud', 'orphaned.mp3'), cut);
    breakManifest(d, (m) => {
      const x = m.tiles.letter.find((y) => y.id === tile.id);
      x.audio.short = { ...x.audio.short, src: 'media/aud/orphaned.mp3', bytes: cut.length, ms: 400 };
      return m;
    });
    const out = rejects(d, /decoder diagnostic/);
    assert.match(out, /part2_3_length/, 'the message must name the actual complaint');
  });

  test("the shipped packs' clips all decode cleanly — the baseline a rejection is measured against", (t) => {
    if (!existsSync(VENV)) return t.skip('no venv');
    for (const pack of [SRC_EN, SRC_VI]) {
      const { code, out } = validate(pack);
      assert.equal(code, 0, `${pack} should validate clean. Output:\n${out}`);
      assert.doesNotMatch(out, /decoder diagnostic/, `${pack} has a clip that does not decode cleanly`);
    }
  });

  test('audio-trim produces a clip that decodes cleanly, and says which strategy it used', async (t) => {
    if (!existsSync(VENV)) return t.skip('no venv');
    // Round-trip through the real tool, from a real untrimmed clip, and let the decoder
    // judge the result rather than the tool's own arithmetic.
    const d = copy(SRC_EN, 'trimrt');
    const man = readJson(path.join(d, 'pack.json'));
    const tile = man.tiles.letter.find((x) => x.audio?.short?.src);
    const src = path.join(d, tile.audio.short.src);
    const out = path.join(d, 'roundtrip.mp3');
    const r = spawnSync(process.execPath,
      [path.join(ROOT, 'tools', 'audio-trim.mjs'), '--in', src, '--out', out], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /decoder diagnostics: NONE/,
      `the trimmer must report a clean decode. Output:\n${r.stdout}`);
    const m = spawnSync(VENV, [path.join(ROOT, 'tools', 'audio-measure.py'), '--require-clean', out],
      { encoding: 'utf8' });
    assert.equal(m.status, 0, `the trimmed clip must decode cleanly:\n${m.stdout}`);
  });
});

/* ==================================== design revision 5 — the letter board ==== */

/*
 * The owner played the built app: the character table "feel really random and
 * un-organized and doesn't give my son a sense of character order", and a digraph is
 * entered letter by letter — "Choose C and choose H". So `inventoryOrder` became
 * `{ letter, tone }`, every word carries the letter stream it is tapped as, and ten
 * reachable partial states that are not tiles got clips of their own.
 *
 * Every case below was run against the REAL migrated pack and seen to exit 1 before it
 * was written down. Three of them were written the other way round first and passed for
 * the wrong reason — see the frame-cut case, which had to be moved twice before it
 * produced the underrun it claims to detect.
 */
describe('revision 5 — the board is the alphabet', () => {
  test('a pack that still lists onsets on the board is rejected as un-migrated', () => {
    const d = copy(SRC_VI, 'r5-onsetrun');
    breakManifest(d, (m) => { m.inventoryOrder.onset = ['b', 'c']; return m; });
    rejects(d, /still carries "onset"/);
  });

  test('a letter missing from the board is an error, not a cosmetic difference', () => {
    // The revision-4 defect, in its new form: an ordering that omits a symbol makes every
    // word containing it unbuildable, and nothing else in the report would say so.
    const d = copy(SRC_VI, 'r5-shortboard');
    breakManifest(d, (m) => {
      m.inventoryOrder.letter = m.inventoryOrder.letter.filter((c) => c !== 'ư');
      return m;
    });
    const out = rejects(d, /1 missing: ư/);
    assert.match(out, /is not on this pack's board/, 'the words that became unbuildable must be named too');
  });

  test('a digraph put back on the board as a cell is rejected', () => {
    const d = copy(SRC_VI, 'r5-digraphcell');
    breakManifest(d, (m) => { m.inventoryOrder.letter.push('ch'); return m; });
    rejects(d, /is not part of the 29-letter Vietnamese alphabet/);
  });

  test('English loses its digraph cells too, and keeps the digraph TILES', () => {
    const d = copy(SRC_EN, 'r5-endigraph');
    breakManifest(d, (m) => { m.inventoryOrder.letter.push('sh'); return m; });
    rejects(d, /is not part of the a-z alphabet/);
    // And the tile is still there, because §0.9 keeps the ten digraph clips: they are
    // what a re-voiced second tap plays.
    const man = readJson(path.join(SRC_EN, 'pack.json'));
    assert.ok(man.tiles.letter.some((t) => t.id === 'sh' && t.audio?.short?.src),
      'the `sh` tile and its clip must survive revision 5; only the CELL went away');
  });

  test('the tone order is the set phrase, and the shipped frequency order is caught', () => {
    // `ngang huyền sắc hỏi ngã nặng` — the owner's answer, asked directly.
    // A reordering is his mother's right, so it is a warning; `--strict` still fails.
    const d = copy(SRC_VI, 'r5-toneorder');
    breakManifest(d, (m) => {
      m.inventoryOrder.tone = ['ngang', 'sac', 'huyen', 'hoi', 'nang', 'nga'];
      return m;
    });
    const { code, out } = validate(d);
    assert.equal(code, 0, 'reordering the tones she can read is not corruption');
    assert.match(out, /not in the standard order.*ngang huyen sac hoi nga nang/);
    assert.equal(validate(d, '--strict').code, 1, '--strict means "ready for a child"');
  });

  test('onsetLetterCount that misplaces the digraph boundary is rejected', () => {
    // The whole reason the boundary is STORED: `chó` is c-h-o, three taps, onset `ch`.
    // Saying the onset is one letter long would make the chant say `cờ`, not `chờ`.
    const d = copy(SRC_VI, 'r5-boundary');
    breakWord(d, 'cho', (w) => { w.onsetLetterCount = 1; return w; });
    rejects(d, /onsetLetterCount is 1 but the onset "ch" is 2 letter\(s\) long/);
  });

  test('letters that do not recompose to the stored decomposition are rejected', () => {
    const d = copy(SRC_VI, 'r5-letters');
    breakWord(d, 'trang', (w) => { w.letters = ['t', 'r', 'a', 'n', 'g']; return w; });
    rejects(d, /letters spell "trang" but onset \+ rime is "trăng"/);
  });

  test('a word with no letters at all is rejected', () => {
    const d = copy(SRC_VI, 'r5-noletters');
    breakWord(d, 'meo', (w) => { delete w.letters; return w; });
    rejects(d, /has no "letters"/);
  });

  test('`gì`-shaped collapse is allowed, but only when the pack says so', () => {
    // `gi` + rime `i` is written with one `i` (literacy-vi.md §1.2, §0.5). Nothing in the
    // seed list does it; his mother can type it tomorrow. The opt-out must exist AND must
    // not be the default, so this case asserts both directions.
    const d = copy(SRC_VI, 'r5-gi');
    const man = readJson(path.join(d, 'pack.json'));
    assert.ok(man.tiles.onset.some((t) => t.id === 'gi'), 'this pack still has the `gi` onset');
    assert.ok(man.tiles.rime.some((t) => t.id === 'i'), 'and the rime `i`');
    const f = path.join(d, 'words', 'gi.json');
    const word = {
      id: 'gi',
      text: 'gì',
      stage: null,
      enabled: false,
      syllables: [{ onset: 'gi', rime: 'i', tone: 'huyen' }],
      letters: ['g', 'i'],
      onsetLetterCount: 2,
      fallbackEmoji: null,
      images: [],
      audio: { word: null, blend: null, sentence: null },
      build: { assetConcept: 'what is that', flags: [], from: 'revision-5 harness' },
    };
    writeJson(f, word);
    // Without the flag it is an error, because 999 times out of 1000 it is a typo.
    rejects(d, /letters spell "gi" but onset \+ rime is "gii"/);
    // With it, the stored letters win and the pack is clean again.
    writeJson(f, { ...word, build: { ...word.build, spellingException: true } });
    const { code, out } = validate(d);
    assert.equal(code, 0, `the declared exception must be honoured. Output:\n${out}`);
  });

  test('a reachable prefix state with no entry is an error — that tap would be silent', () => {
    const d = copy(SRC_VI, 'r5-prefixgone');
    breakManifest(d, (m) => {
      m.prefixAudio.rime = m.prefixAudio.rime.filter((t) => t.id !== 'ăn');
      return m;
    });
    rejects(d, /"ăn" is reachable/);
  });

  test('prefixAudio may not duplicate a state that is already a tile', () => {
    const d = copy(SRC_VI, 'r5-prefixdup');
    breakManifest(d, (m) => {
      m.prefixAudio.rime.push({ id: 'ao', glyph: 'ao', role: 'rime', label: 'ao', audio: { name: null } });
      return m;
    });
    rejects(d, /"ao" is already a rime tile/);
  });

  test('prefixAudio may not invent a state no word can reach', () => {
    const d = copy(SRC_VI, 'r5-prefixbogus');
    breakManifest(d, (m) => {
      m.prefixAudio.rime.push({ id: 'ươ', glyph: 'ươ', role: 'rime', label: 'ươ', audio: { name: null } });
      return m;
    });
    rejects(d, /is not a prefix of any rime in this pack/);
  });

  test('a prefix clip goes through the DURATION gate like every other tap clip', () => {
    const d = copy(SRC_VI, 'r5-prefixlong');
    const man = readJson(path.join(d, 'pack.json'));
    const p = man.prefixAudio.onset.find((t) => t.id === 'p');
    assert.ok(p?.audio?.name?.src, 'the `pờ` clip must exist to be lengthened');
    const f = path.join(d, p.audio.name.src);
    const b = readFileSync(f);
    writeFileSync(f, Buffer.concat([b, b, b]));   // ~1872 ms against a 1500 ms ceiling
    rejects(d, /prefixAudio\.onset\[p\]\.name is \d+ ms of audio/);
  });

  test('a prefix clip goes through the DECODE gate like every other clip', async (t) => {
    if (!existsSync(VENV)) return t.skip('no venv');
    const d = copy(SRC_VI, 'r5-prefixdecode');
    const man = readJson(path.join(d, 'pack.json'));
    const ac = man.prefixAudio.rime.find((x) => x.id === 'ac');
    assert.ok(ac?.audio?.name?.src, 'the `ac` clip must exist to be corrupted');
    const f = path.join(d, ac.audio.name.src);
    const cut = await orphanedCut(f);
    writeFileSync(f, cut);
    const out = rejects(d, /decoder diagnostic/);
    assert.match(out, /prefixAudio\.rime\[ac\]/, 'the finding must name the prefix state');
  });

  test('the migrated packs really do carry the new fields — the baseline', () => {
    const vi = readJson(path.join(SRC_VI, 'pack.json'));
    assert.deepEqual(Object.keys(vi.inventoryOrder).sort(), ['letter', 'tone']);
    assert.deepEqual(vi.inventoryOrder.letter, R.VI_ALPHABET);
    assert.deepEqual(vi.inventoryOrder.tone, R.VI_TONE_IDS);
    // The prefix states are DERIVED, so the pack is checked against the derivation.
    assert.deepEqual(vi.prefixAudio.onset.map((t) => t.id),
      R.prefixStates(vi.tiles.onset.map((t) => t.id)).sort(R.viCollate));
    assert.deepEqual(vi.prefixAudio.rime.map((t) => t.id),
      R.prefixStates(vi.tiles.rime.map((t) => t.id)).sort(R.viCollate));
    for (const g of ['onset', 'rime']) {
      for (const p of vi.prefixAudio[g]) {
        assert.ok(p.audio?.name?.src, `prefixAudio.${g}[${p.id}] has no clip`);
      }
    }
    const en = readJson(path.join(SRC_EN, 'pack.json'));
    assert.deepEqual(Object.keys(en.inventoryOrder), ['letter']);
    assert.deepEqual(en.inventoryOrder.letter, R.EN_ALPHABET);
    // And `literacy-vi.md` §0.13's two printed lists, which are a TEST of the collation
    // rather than its source.
    assert.equal(vi.tiles.onset.map((t) => t.id).join(' '),
      'b c ch d đ g gh gi h k kh l m n ng ngh nh ph qu r s t th tr v x');
    assert.equal(vi.tiles.rime.map((t) => t.id).join(' '),
      'a ach ai am anh ao at ay ăng ăt ân âu ây e em en eo ê i im it o oa oi on ong ô ơ u ua ui un uôi ưa ưng');
  });
});

/* ================================= revision 5 — glyph casing (ui.md §8.2, E22) ==== */

/*
 * The owner answered `open-questions-ui.md` Q7: **English tiles are UPPERCASE.** The
 * casing is one pack field, read once at pack load, applied at one place in the glyph
 * component. The interesting part of this suite is that the three outcomes are
 * deliberately different — absent is fine, a wrong VALUE is a warning, a wrong SHAPE is
 * an error — so a test that only checked "exit 1 somewhere" would pass while the
 * behaviour the owner's decision depends on was broken.
 */
describe('revision 5 — glyph casing', () => {
  const FIXTURE = path.join(ROOT, 'assets', 'fonts', 'FIXTURE.txt');

  test('the seed packs carry the owner\'s answer', () => {
    assert.equal(readJson(path.join(SRC_EN, 'pack.json')).display.glyphCase, 'upper');
    assert.equal(readJson(path.join(SRC_VI, 'pack.json')).display.glyphCase, 'lower');
  });

  test('D23 — an ABSENT field is not a finding at all', () => {
    const d = copy(SRC_EN, 'case-absent');
    breakManifest(d, (m) => { delete m.display; return m; });
    const { code, out } = validate(d);
    assert.equal(code, 0, `a pack without a casing field is a valid pack. Output:\n${out}`);
    assert.doesNotMatch(out, /display/, 'absence must not even warn — lowercase is the default');
  });

  test('D23 — an unrecognised VALUE warns and does not fail the pack', () => {
    // She typed "uppercase" instead of "upper". The app renders lowercase and starts
    // (D23); the validator is not the app, and something has to be able to tell her why
    // her board came back the wrong way round.
    const d = copy(SRC_EN, 'case-typo');
    breakManifest(d, (m) => { m.display.glyphCase = 'uppercase'; return m; });
    const { code, out } = validate(d);
    assert.equal(code, 0, `an unrecognised value must not refuse the pack. Output:\n${out}`);
    assert.match(out, /warn +pack\.json display\.glyphCase/);
    assert.match(out, /renders LOWERCASE and starts normally/);
  });

  test('D23 — an empty value is the same case', () => {
    const d = copy(SRC_EN, 'case-empty');
    breakManifest(d, (m) => { m.display.glyphCase = ''; return m; });
    const { code, out } = validate(d);
    assert.equal(code, 0);
    assert.match(out, /warn +pack\.json display\.glyphCase/);
  });

  test('a malformed SHAPE is an error, not a silent fallback', () => {
    const d = copy(SRC_EN, 'case-shape');
    breakManifest(d, (m) => { m.display = 'upper'; return m; });
    rejects(d, /display: must be an object/);
  });

  test('a non-string glyphCase is an error', () => {
    const d = copy(SRC_EN, 'case-type');
    breakManifest(d, (m) => { m.display = { glyphCase: true }; return m; });
    rejects(d, /display\.glyphCase: must be a string/);
  });

  /*
   * Q13. `assets/fonts/FIXTURE.txt` carries seven uppercase Vietnamese letters and none
   * of the precomposed marked capitals, so Q5a would report green and say nothing about
   * `Ẫ`. Both bundled faces contain the glyphs — and a font that contains a glyph is not
   * a gate that has rendered it. `mả`/`mã` are 34 px apart at 36 pt and a mark on a
   * capital sits against cap height, which compresses the pair further.
   */
  test('Q13 — a Vietnamese pack cannot be flipped to uppercase', () => {
    const d = copy(SRC_VI, 'case-vi-upper');
    breakManifest(d, (m) => { m.display.glyphCase = 'upper'; return m; });
    const out = rejects(d, /render gate has never drawn/);
    assert.match(out, /Ẫ/, 'the message must name the characters the fixture does not cover');
    assert.match(out, /Q13/);
  });

  test('Q13 — the fixture really does lack the marked capitals, which is why the gate bites', () => {
    const fx = readFileSync(FIXTURE, 'utf8');
    const upper = [...new Set([...fx])].filter((c) => c.toLowerCase() !== c);
    assert.equal(upper.length, 7, `expected exactly the 7 plain uppercase letters, got ${upper.join('')}`);
    assert.deepEqual(upper.sort(), [...'ĂÂĐÊÔƠƯ'].sort());
  });

  test('Q13 — the gate is a COMPUTATION and lifts when the fixture covers the forms', () => {
    // The whole reason it is not a hard-coded `if (lang === 'vi')`: a constant is
    // something nobody remembers to delete. Extend the fixture, re-run Q1-Q5c, and this
    // stops complaining by itself.
    const fx = readFileSync(FIXTURE, 'utf8');
    const words = ['mả', 'mã', 'ngựa', 'chuối', 'trứng', 'phở'];
    const gaps = R.viUppercaseGaps(words, fx);
    assert.ok(gaps.length > 0, 'the shipped fixture must NOT cover these — otherwise the gate is vacuous');
    assert.deepEqual(R.viUppercaseGaps(words, `${fx}\n${gaps.join(' ')}\n`), [],
      'extending the fixture with exactly the reported gaps must clear it');
  });

  test('D20 — nothing stored may be upper-cased instead of the glyph', () => {
    // The cheap way to give the owner uppercase tiles is to upper-case the DATA, and it
    // would look right and be wrong four ways at once.
    const a = copy(SRC_EN, 'case-d20-order');
    breakManifest(a, (m) => {
      m.inventoryOrder.letter = m.inventoryOrder.letter.map((c) => c.toUpperCase());
      return m;
    });
    assert.match(rejects(a, /inventoryOrder\.letter contains uppercase/), /AC D20/);

    const b = copy(SRC_EN, 'case-d20-letters');
    breakWord(b, 'ship', (w) => { w.letters = w.letters.map((c) => c.toUpperCase()); return w; });
    rejects(b, /letters contains uppercase/);

    const c = copy(SRC_VI, 'case-d20-syllable');
    breakWord(c, 'cho', (w) => { w.syllables[0].onset = 'CH'; return w; });
    rejects(c, /syllables contains uppercase/);
  });

  test('D20 — the shipped packs store nothing uppercase, which is the baseline', () => {
    const upper = (s) => typeof s === 'string' && [...s].some((ch) => ch !== ch.toLowerCase());
    for (const dir of [SRC_VI, SRC_EN]) {
      const man = readJson(path.join(dir, 'pack.json'));
      for (const run of Object.values(man.inventoryOrder)) {
        for (const c of run) assert.ok(!upper(c), `${dir}: inventoryOrder holds "${c}"`);
      }
      for (const g of Object.keys(man.tiles)) {
        for (const t of man.tiles[g]) assert.ok(!upper(t.id), `${dir}: tile id "${t.id}"`);
      }
      for (const f of readdirSync(path.join(dir, 'words'))) {
        if (!f.endsWith('.json')) continue;
        const w = readJson(path.join(dir, 'words', f));
        assert.ok(!upper(w.id), `${dir}/${f}: id`);
        for (const c of w.letters ?? []) assert.ok(!upper(c), `${dir}/${f}: letters "${c}"`);
        for (const c of w.tiles ?? []) assert.ok(!upper(c), `${dir}/${f}: tiles "${c}"`);
      }
      for (const kind of ['img', 'aud']) {
        const md = path.join(dir, 'media', kind);
        if (!existsSync(md)) continue;
        for (const f of readdirSync(md)) assert.ok(!upper(f), `${dir}: media name "${f}"`);
      }
    }
  });

  test('D19 — casing reaches no clip key: every tile clip is still keyed by its lowercase id', () => {
    // `A` says /æ/, never "ay". The clip lookup is by tile id and the id is lowercase, so
    // there is structurally nowhere for a letter NAME to enter. Asserted rather than
    // assumed, because "uppercase smuggles letter names back in" is exactly the failure
    // literacy-en.md §0.4 argues against.
    const man = readJson(path.join(SRC_EN, 'pack.json'));
    for (const t of man.tiles.letter) {
      if (!t.audio?.short?.text) continue;
      assert.equal(t.audio.short.text, t.sound,
        `${t.id}: the short clip says "${t.audio.short.text}", not its sound "${t.sound}"`);
      assert.ok(!/^[A-Z]$/.test(t.audio.short.text), `${t.id}: the clip text is a bare capital`);
    }
  });
});

/* ============================== licensing: one predicate, two tools ============== */

/*
 * `tools/pack-validate.mjs` and `tools/pack-attributions.mjs` both decide whether an
 * image can ship, from the same `images[]` entries — **and they used to disagree.** The
 * validator passed `packs/vi-seed`; the attributions generator refused to let it be
 * published, over `đèn` and `mũi`, both `"Public domain"` with `creator: null`. The
 * validator was right: a public-domain work has no attribution obligation, there is no
 * rights-holder to credit, and a null creator is the honest representation of that rather
 * than missing data. The generator's rule was `!e.creator`, applied to everything.
 *
 * The repair is not "relax the generator". It is that both now read `lib/licence.mjs`, so
 * they can be wrong together — which is fixable — rather than wrong differently, which is
 * not detectable. **Every case below runs BOTH binaries and asserts they return the same
 * verdict**, because a test that only drove one of them is what let this happen.
 */
describe('licensing — the shared predicate', () => {
  function attributions(dir, ...flags) {
    const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'pack-attributions.mjs'), dir, ...flags],
      { encoding: 'utf8' });
    return { code: r.status, out: `${r.stdout}${r.stderr}` };
  }

  /** Both tools, one verdict. Returns the attributions output for message assertions. */
  function bothAgree(dir, expected, why) {
    const a = attributions(dir);
    const v = validate(dir);
    assert.equal(a.code, expected, `${why}: pack-attributions exited ${a.code}. Output:\n${a.out}`);
    assert.equal(v.code, expected, `${why}: pack-validate exited ${v.code}. Output:\n${v.out}`);
    return a.out;
  }

  /** Change the first image matching `pick`, in place. Returns the word id it hit. */
  function breakFirstImage(dir, pick, mutate) {
    for (const f of readdirSync(path.join(dir, 'words')).sort()) {
      if (!f.endsWith('.json')) continue;
      const p = path.join(dir, 'words', f);
      const w = readJson(p);
      const im = (w.images ?? []).find(pick);
      if (!im) continue;
      mutate(im);
      writeJson(p, w);
      return w.id;
    }
    assert.fail('no image in this pack matched the fixture predicate');
    return null;
  }

  test('the shipped packs are publishable, and BOTH tools say so', () => {
    for (const dir of [SRC_VI, SRC_EN]) bothAgree(dir, 0, path.basename(dir));
  });

  /* --- the side that must NOT fail ------------------------------------------- */

  test('a public-domain image with no author is not a failure — in either tool', () => {
    // The exact fault that was blocking `packs/vi-seed`, made worse on purpose: every
    // public-domain and CC0 image in the pack loses its creator at once.
    const d = copy(SRC_VI, 'lic-pd');
    let n = 0;
    for (const f of readdirSync(path.join(d, 'words'))) {
      if (!f.endsWith('.json')) continue;
      const p = path.join(d, 'words', f);
      const w = readJson(p);
      let hit = false;
      for (const im of w.images ?? []) {
        if (L.licenceObligations(im.license).publicDomain) { im.creator = null; hit = true; n += 1; }
      }
      if (hit) writeJson(p, w);
    }
    assert.ok(n >= 2, `expected the pack to contain public-domain images; nulled ${n}`);
    const out = bothAgree(d, 0, 'public domain needs no author');
    assert.match(out, /no attribution obligation/);
  });

  test('`Phạm vi công cộng` is public domain too — it is in the pack and was not matched', () => {
    // vi.wikipedia's own public-domain tag. Before `lib/licence.mjs` it fell into the
    // attribution-REQUIRED bucket; it happens to carry an author, which is the only
    // reason nothing failed. A latent false blocker is still a false blocker.
    assert.equal(L.licenceObligations('Phạm vi công cộng').publicDomain, true);
    assert.equal(L.licenceObligations('Phạm vi công cộng').attribution, false);
    const found = readdirSync(path.join(SRC_VI, 'words'))
      .filter((f) => f.endsWith('.json'))
      .flatMap((f) => readJson(path.join(SRC_VI, 'words', f)).images ?? [])
      .some((im) => im.license === 'Phạm vi công cộng');
    assert.ok(found, 'packs/vi-seed no longer contains this licence string; the case above is now hypothetical');
  });

  /* --- the side that must STILL fail hard ------------------------------------ */

  for (const [label, licence] of [
    ['CC BY-SA 4.0', 'CC BY-SA 4.0'],
    ['CC BY 2.0', 'CC BY 2.0'],
    ['GFDL 1.2', 'GFDL 1.2'],
  ]) {
    test(`a ${label} image with no author fails HARD — in both tools`, () => {
      const d = copy(SRC_VI, `lic-${licence.replace(/\W+/g, '')}`);
      const id = breakFirstImage(d, (im) => im.license === licence && im.creator,
        (im) => { im.creator = null; });
      const out = bothAgree(d, 1, `${licence} requires an author`);
      assert.match(out, /cannot be attributed. This pack must not be published/);
      assert.match(out, new RegExp(`is missing creator`), `the message must name what is missing (word ${id})`);
    });
  }

  test('an UNRECOGNISED licence is treated as requiring attribution, not waved through', () => {
    // The safe direction, and the live example is `Copyrighted free use` — a Commons tag
    // meaning the holder permits free use, which is not the same as abandoning copyright.
    assert.equal(L.licenceObligations('Copyrighted free use').attribution, true);
    assert.equal(L.licenceObligations('Some Bespoke Museum Terms').attribution, true);
    const d = copy(SRC_VI, 'lic-unknown');
    breakFirstImage(d, (im) => im.creator, (im) => {
      im.license = 'Some Bespoke Museum Terms';
      im.creator = null;
    });
    bothAgree(d, 1, 'an unknown licence must not be assumed attribution-free');
  });

  test('no licence recorded at all fails, whatever else is present', () => {
    const d = copy(SRC_VI, 'lic-none');
    breakFirstImage(d, () => true, (im) => { im.license = null; });
    bothAgree(d, 1, 'an image whose licence nobody recorded cannot be shipped');
  });

  test('a missing sourceUrl fails even for a public-domain work', () => {
    // The asymmetry is the point: the claim "this needs no credit" has to be auditable.
    const d = copy(SRC_VI, 'lic-nourl');
    breakFirstImage(d, (im) => L.licenceObligations(im.license).publicDomain,
      (im) => { im.sourceUrl = null; });
    bothAgree(d, 1, 'the no-credit-needed claim must be checkable');
  });

  /* --- the predicate itself, so the table is readable in one place ------------ */

  test('the obligation table, stated as a test', () => {
    const cases = [
      // licence,                 attribution, shareAlike, licenceText, publicDomain
      ['CC BY-SA 4.0', true, true, false, false],
      ['CC BY-SA 3.0 de', true, true, false, false],
      ['CC BY 2.0', true, false, false, false],
      ['CC BY 2.5 dk', true, false, false, false],
      ['GFDL 1.2', true, false, true, false],
      ['GFDL', true, false, true, false],
      ['GNU Free Documentation License 1.3', true, false, true, false],
      ['Public domain', false, false, false, true],
      ['Phạm vi công cộng', false, false, false, true],
      ['CC0', false, false, false, true],
      ['PDM 1.0', false, false, false, true],
      ['No known copyright restrictions', false, false, false, true],
      ['Copyrighted free use', true, false, false, false],
      ['Some Bespoke Museum Terms', true, false, false, false],
    ];
    for (const [lic, attribution, shareAlike, licenceText, publicDomain] of cases) {
      const ob = L.licenceObligations(lic);
      assert.equal(ob.attribution, attribution, `${lic}: attribution`);
      assert.equal(ob.shareAlike, shareAlike, `${lic}: shareAlike`);
      assert.equal(ob.licenceText, licenceText, `${lic}: licenceText`);
      assert.equal(ob.publicDomain, publicDomain, `${lic}: publicDomain`);
    }
    // An unrecorded licence is not public domain and is not silently fine.
    for (const empty of [null, undefined, '', '   ']) {
      const ob = L.licenceObligations(empty);
      assert.equal(ob.recorded, false, `${JSON.stringify(empty)}: recorded`);
      assert.equal(ob.publicDomain, false, `${JSON.stringify(empty)}: publicDomain`);
      assert.deepEqual(L.missingCredit({ source: 'commons.wikimedia.org', license: empty }),
        ['license', 'sourceUrl', 'creator'], `${JSON.stringify(empty)}: everything is required`);
    }
    // And our own photographs oblige nothing at all.
    for (const src of L.OWN_SOURCES) assert.deepEqual(L.missingCredit({ source: src }), []);
  });

  test('--check still notices a stale ATTRIBUTION.md', () => {
    const d = copy(SRC_VI, 'lic-stale');
    assert.equal(attributions(d, '--check').code, 0, 'the committed notice must be current');
    writeFileSync(path.join(d, 'ATTRIBUTION.md'), '# not what the pack says\n');
    const { code, out } = attributions(d, '--check');
    assert.equal(code, 1, `a stale notice must fail --check. Output:\n${out}`);
    assert.match(out, /out of date/);
  });
});
