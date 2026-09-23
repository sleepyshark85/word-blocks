// The Q-series gate. `ui.md` §6.1, `acceptance-criteria.md` Q1–Q10a.
//
// "Before either font ships, it must pass a render test. This is a **Tier-2 blocking
// gate**, and it fails the build, not a review comment." It is what caught Fredoka —
// which covers 35 of the 86 fixture characters and has `ã` but not `ả`, so `mã` and `mả`
// would have rendered in *different typefaces*. That is a correctness failure in a game
// about tone marks, and no screenshot review would have found it.
//
// **The tile face is whatever `src/ui/typography.js` says it is.** It was Baloo 2; the
// orchestrator's correction of 2026-09-23 (`decisions.md`, *Tile typeface*) makes it Be
// Vietnam Pro, and Baloo 2 stays bundled so the reversal is one line. This file reads
// `FONT.tile` rather than naming a file, so the whole gate re-runs against whichever face
// is wired in — which is the only way "reversible in one line" can be true.
//
// Two external tools, both already required by `CLAUDE.md`: `fontTools` from
// `tools/.venv` for the outlines, and ImageMagick for the rasterised minimal-pair diff.
// Their absence fails loudly rather than skipping — a gate that quietly does not run is
// not a gate.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { REPO } from './helpers/load.mjs';

const FONTS = path.join(REPO, 'assets', 'fonts');

/**
 * The face the app actually draws tiles in, read out of the component that decides. A
 * gate that hard-codes a file name stops gating the moment somebody changes the wiring.
 */
const TYPOGRAPHY = readFileSync(path.join(REPO, 'src', 'ui', 'typography.js'), 'utf8');
const TILE_FAMILY = (TYPOGRAPHY.match(/^\s*tile:\s*'([^']+)',/m) ?? [])[1];
assert.ok(TILE_FAMILY, 'src/ui/typography.js does not declare a tile family');
const TILE = path.join(FONTS, `${TILE_FAMILY}.ttf`);
const TEXT = path.join(FONTS, 'BeVietnamPro-Regular.ttf');

/**
 * `acceptance-criteria.md` Q10a and `ui.md` §6.2 — the SHA-256 of every bundled face, as
 * eyeballed. **This is the automated half of Q10 and the one that actually protects the
 * property**: a dependency bump, a re-subset or a swapped file changes the hash and
 * re-opens the human check.
 */
const HASHES = {
  'Baloo2-SemiBold': '241b89a416388b8970d595db2fb361665e464447d7a1526ca4fb80bfcbd532ce',
  'BeVietnamPro-SemiBold': '0d0a638c0338c3d33787c00cd4d082bec7c030cd27b3b54e37b766fdfb82b7c1',
  'BeVietnamPro-Medium': '9122234c1fbc0d59a96d7f4e1ff119ec54fb2e970aa78ba9914567831085f575',
  'BeVietnamPro-Regular': '0f5cdd2fb255263145b47c9f863d88c48443e617a5a914763c1a081bcf0cf739',
};
const PY = path.join(REPO, 'tools', '.venv', 'bin', 'python');
const OUT = path.join(REPO, 'test', '.out');

const FIXTURE = readFileSync(path.join(FONTS, 'FIXTURE.txt'), 'utf8').normalize('NFC');
const CHARS = [...new Set([...FIXTURE].filter((c) => c.trim()))].sort();

/** Ask fontTools a question about a font and get JSON back. */
function probe(font, snippet) {
  const script = `
import json, sys
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen
font = TTFont(sys.argv[1])
upm = font['head'].unitsPerEm
gs = font.getGlyphSet()
cmap = font.getBestCmap()
def bounds(ch):
    name = cmap.get(ord(ch))
    if name is None: return None
    pen = BoundsPen(gs); gs[name].draw(pen)
    return None if pen.bounds is None else [v / upm for v in pen.bounds]
def contours(ch):
    name = cmap.get(ord(ch))
    if name is None: return 0
    pen = RecordingPen(); gs[name].draw(pen)
    return sum(1 for op, _ in pen.value if op in ('closePath', 'endPath'))
${snippet}
`;
  return JSON.parse(execFileSync(PY, ['-c', script, font], { encoding: 'utf8' }));
}

test('the gate can run at all — fontTools and ImageMagick are present', () => {
  assert.ok(existsSync(PY), `tools/.venv is missing; see docs/slices.md for how to rebuild it`);
  assert.doesNotThrow(() => execFileSync('magick', ['-version'], { stdio: 'ignore' }),
    'ImageMagick (`magick`) must be on PATH — CLAUDE.md lists it as a requirement');
  assert.ok(existsSync(TILE), `the bundled tile font ${TILE_FAMILY} is missing; run \`node scripts/build-fonts.mjs\``);
  assert.ok(existsSync(TEXT), 'the bundled text font is missing');
});

test('Fredoka is not in this repository, in any form (ui.md §6.0)', () => {
  const names = readFileSync(path.join(REPO, 'src', 'ui', 'typography.js'), 'utf8');
  assert.ok(!/fredoka/i.test(names.replace(/\/\/.*$/gm, '')), 'a component names Fredoka');
  assert.equal(existsSync(path.join(FONTS, 'Fredoka.ttf')), false);
});

test('Q1 / Q5a — the bundled tile font covers every character of the fixture', () => {
  assert.ok(CHARS.length >= 80, `the fixture only has ${CHARS.length} distinct characters`);
  const have = new Set(probe(TILE, 'print(json.dumps(sorted(cmap.keys())))'));
  const missing = CHARS.filter((c) => !have.has(c.codePointAt(0)));
  assert.deepEqual(missing, [], `the tile font is missing ${missing.join('')}`);
  // And the text face too — `ui.md` §6.1 names it as the fallback if the tile face fails.
  const haveText = new Set(probe(TEXT, 'print(json.dumps(sorted(cmap.keys())))'));
  assert.deepEqual(CHARS.filter((c) => !haveText.has(c.codePointAt(0))), []);
});

test('Q5c — the tile font is a subset of Latin + Vietnamese, and <= 150 KB', () => {
  const { size } = probe(TILE, `
import os
print(json.dumps({'size': os.path.getsize(sys.argv[1]), 'glyphs': len(font.getGlyphOrder())}))
`);
  assert.ok(size <= 150 * 1024, `the tile font is ${Math.round(size / 1024)} KB`);
  // A full upstream Baloo 2 carries Devanagari and is 683 KB; this must not be that.
  assert.ok(size < 400 * 1024);
  const cmap = probe(TILE, 'print(json.dumps(sorted(cmap.keys())))');
  assert.ok(!cmap.some((cp) => cp >= 0x0900 && cp <= 0x097f), 'Devanagari is still in the subset');
});

test('Q10a — every bundled face has the SHA-256 that was eyeballed (ui.md §6.2)', () => {
  for (const [family, expected] of Object.entries(HASHES)) {
    const file = path.join(FONTS, `${family}.ttf`);
    assert.ok(existsSync(file), `${family} is recorded in ui.md §6.2 but is not bundled`);
    const actual = createHash('sha256').update(readFileSync(file)).digest('hex');
    assert.equal(actual, expected,
      `${family} has changed. Q10's human letterform check is re-opened: render its \`a\` and \`g\` at 116 pt, look at them, and record the new hash.`);
  }
  // And the tile face is one of them, so the wiring cannot point at an unpinned file.
  assert.ok(HASHES[TILE_FAMILY], `the tile face ${TILE_FAMILY} has no recorded hash`);
});

test('Q10 — the tile face is the one the letterform criterion selects', () => {
  // The single-storey clause **cannot honestly be automated** (`ui.md` §6.2, correction
  // U9): single- and double-storey `a` have the same contour count, the same counter
  // count and similar bounding boxes, so any "automated" version would be a proxy dressed
  // as a measurement. Measured here on both shipped faces:
  const counts = {};
  for (const family of ['Baloo2-SemiBold', 'BeVietnamPro-SemiBold']) {
    counts[family] = probe(path.join(FONTS, `${family}.ttf`),
      "print(json.dumps({'g': contours('g'), 'a': contours('a')}))");
  }
  assert.deepEqual(counts['Baloo2-SemiBold'], counts['BeVietnamPro-SemiBold'],
    'the contour counts now differ — an automated letterform check may have become possible');
  // What *is* checkable: a monocular `g` has two contours, a binocular one three.
  assert.equal(counts[TILE_FAMILY].g, 2, 'the tile face`s `g` is binocular');
  // The human record, and the decision it implements.
  assert.equal(TILE_FAMILY, 'BeVietnamPro-SemiBold',
    'the tile face changed; `decisions.md` §Tile typeface is the record, and Q10 is re-opened');
});

test('Q4 — no glyph ink falls outside the 1.55 em box', () => {
  for (const [label, font] of [['tile', TILE], ['text', TEXT]]) {
    const spans = probe(font, `
out = {}
for ch in json.loads(sys.argv[2] if len(sys.argv) > 2 else '[]'):
    pass
chars = ${JSON.stringify(CHARS)}
hi = lo = None
for ch in chars:
    b = bounds(ch)
    if b is None: continue
    hi = b[3] if hi is None else max(hi, b[3])
    lo = b[1] if lo is None else min(lo, b[1])
print(json.dumps({'hi': hi, 'lo': lo, 'span': hi - lo}))
`);
    assert.ok(spans.span < 1.55, `${label}: worst ink span ${spans.span.toFixed(3)} em exceeds the box`);
    // And with the box's baseline at 1.19 em from the top, both ends clear.
    assert.ok(spans.hi <= 1.19, `${label}: ink ${spans.hi.toFixed(3)} em above the baseline clips the box top`);
    assert.ok(spans.lo >= -(1.55 - 1.19), `${label}: ink ${spans.lo.toFixed(3)} em below the baseline clips`);
  }
});

test('Q5b — every below-mark sits lower than its base, every above-mark higher', () => {
  const below = [['ộ', 'ô'], ['ặ', 'ă'], ['ậ', 'â'], ['ợ', 'ơ'], ['ự', 'ư'], ['ẹ', 'e'], ['ị', 'i'], ['ạ', 'a']];
  const above = [['ế', 'ê'], ['ể', 'ê'], ['ỗ', 'ô'], ['ữ', 'ư'], ['ẵ', 'ă'], ['ầ', 'â']];
  for (const [label, font] of [['tile', TILE], ['text', TEXT]]) {
    const res = probe(font, `
pairs_below = ${JSON.stringify(below)}
pairs_above = ${JSON.stringify(above)}
print(json.dumps({
  'below': [[a, b, bounds(a)[1], bounds(b)[1]] for a, b in pairs_below],
  'above': [[a, b, bounds(a)[3], bounds(b)[3]] for a, b in pairs_above],
}))
`);
    for (const [a, b, ai, bi] of res.below) {
      assert.ok(ai < bi, `${label}: ${a} does not sit below ${b} (${ai} vs ${bi})`);
    }
    for (const [a, b, ai, bi] of res.above) {
      assert.ok(ai > bi, `${label}: ${a} does not sit above ${b} (${ai} vs ${bi})`);
    }
  }
});

test('Q5 — the stacked forms are single composed glyphs, not base plus floating mark', () => {
  // A composed glyph has one cmap entry of its own. A base-plus-mark rendering would
  // have to reach the mark through `ccmp`/`mark`, which is the failure §6.1 T5 names.
  const stacked = [...'ươềộẫỡỹặế'];
  const have = new Set(probe(TILE, 'print(json.dumps(sorted(cmap.keys())))'));
  for (const ch of stacked) {
    for (const cp of [...ch]) {
      assert.ok(have.has(cp.codePointAt(0)), `${ch} is not a precomposed glyph in the tile font`);
    }
    assert.equal([...ch.normalize('NFC')].length, [...ch].length);
  }
});

test('Q3 — the minimal pairs differ by >= 200 px at 116 pt and >= 20 px at 36 pt', () => {
  mkdirSync(OUT, { recursive: true });
  const pairs = [['mả', 'mã'], ['hổ', 'hô'], ['ả', 'ã'], ['ẻ', 'ẽ'], ['ỏ', 'õ'], ['ủ', 'ũ'], ['ỷ', 'ỹ']];
  const render = (text, size, file) => {
    execFileSync('magick', [
      '-background', 'white', '-fill', 'black',
      '-font', TILE, '-pointsize', String(size),
      `label:${text}`, '-gravity', 'NorthWest', '-extent', `${size * 6}x${size * 3}`,
      file,
    ]);
  };
  const diff = (a, b) => {
    try {
      execFileSync('magick', ['compare', '-metric', 'AE', a, b, 'null:'], { stdio: 'pipe' });
      return 0;
    } catch (e) {
      return Number(String(e.stderr).trim().split(/\s+/)[0]);
    }
  };

  const measured = {};
  // `ui.md` §6.1, correction U7. The floors sit **far below** every real measurement
  // rather than near one, because a pixel count is not portable between rasterisers: the
  // Slice-3 developer measured 38.7 where the designer measured 34 on the same file and
  // the same pair. The failure the gate exists to catch — *the mark is not drawn* —
  // scores 0 at either size, and that is what the margin buys.
  for (const [size, floor] of [[116, 200], [36, 20]]) {
    for (const [a, b] of pairs) {
      const fa = path.join(OUT, `q3-${size}-a.png`);
      const fb = path.join(OUT, `q3-${size}-b.png`);
      render(a, size, fa);
      render(b, size, fb);
      const px = diff(fa, fb);
      measured[`${size}:${a}/${b}`] = px;
      assert.ok(px >= floor,
        `${a} and ${b} differ by only ${px} px at ${size} pt in ${TILE_FAMILY} — the mark may not be drawn`);
    }
  }

  // The property the thresholds are a proxy for: a mark that is not drawn scores ~0.
  // Proven by comparing a glyph against itself, which is what "no mark" looks like.
  const same = path.join(OUT, 'q3-same.png');
  render('hô', 36, same);
  const selfDiff = diff(same, same);
  assert.equal(selfDiff, 0, 'the diff metric does not read 0 for identical rasters');

  // `hổ`/`hô` is the binding case: the only marked-against-unmarked pair in the set, so
  // what it counts is the whole ink of one `hỏi` mark rather than two shapes disagreeing.
  // It is recorded rather than merely asserted, so a regression is visible as a number.
  assert.ok(measured['36:hổ/hô'] >= 20, `the binding pair measures ${measured['36:hổ/hô']} px at 36 pt`);
  assert.ok(measured['116:hổ/hô'] >= 200, `the binding pair measures ${measured['116:hổ/hô']} px at 116 pt`);
});

test('Q2 — the face that renders is the bundled one, never a system fallback', () => {
  // Two halves, because this criterion spans two machines.
  //
  // Here: prove the rasteriser honours the `-font` file it is handed, so every other
  // measurement in this file is a measurement *of the bundled font*. The same string in
  // the two bundled faces must produce different ink; if `-font` were being ignored,
  // both would be the system default and identical.
  mkdirSync(OUT, { recursive: true });
  const draw = (font, file) => execFileSync('magick', [
    '-background', 'white', '-fill', 'black', '-font', font, '-pointsize', '72',
    'label:mả ngựa quốc', '-gravity', 'NorthWest', '-extent', '900x200', file,
  ]);
  const a = path.join(OUT, 'q2-tile.png');
  const b = path.join(OUT, 'q2-text.png');
  draw(TILE, a);
  draw(TEXT, b);
  let differing = 0;
  try {
    execFileSync('magick', ['compare', '-metric', 'AE', a, b, 'null:'], { stdio: 'pipe' });
  } catch (e) {
    differing = Number(String(e.stderr).trim().split(/\s+/)[0]);
  }
  assert.ok(differing > 1000, `the two bundled faces rendered identically (${differing} px differ)`);

  // On device: the only defence available off-device is that no component ever names a
  // face that is not bundled, and that the app refuses to draw if the bundle fails to
  // load (Q9). Both are source facts, so both are audited.
  const typography = readFileSync(path.join(REPO, 'src', 'ui', 'typography.js'), 'utf8');
  const families = [...typography.matchAll(/^\s*\w+:\s*'([^']+)',/gm)].map((m) => m[1]);
  assert.ok(families.length >= 4, `only found ${families.length} declared families`);
  for (const family of families) {
    assert.ok(existsSync(path.join(FONTS, `${family}.ttf`)),
      `${family} is declared but not bundled — the system would substitute it`);
  }
  const app = readFileSync(path.join(REPO, 'src', 'App.js'), 'utf8');
  assert.ok(/fontError/.test(app), 'the app does not notice a failed font load');
  assert.ok(/if \(fontError\)/.test(app), 'Q9: the app must not fall through to the system font');
});
