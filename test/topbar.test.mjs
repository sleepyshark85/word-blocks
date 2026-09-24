// The mode title fits the top bar, measured from the shipped font file.
//
// `ui.md` §3.1: *"The mode title is on every screen. Top-left of the top bar, 13 pt
// `inkSoft`: `Ghép Chữ` or `Word Blocks`. **Every screenshot the tester takes carries its
// own label.**"* A label that reads `Word Blo…` is not that label, and it is on the app's
// own name — the owner has seen it in every English screenshot since revision 3.
//
// It shipped because `src/ui/TopBar.js` gave the title `flex: 1` and gave the 32 pt
// gate-dot column `flex: 1` as well, so the slack either side of the shelf was split
// equally and the title got **74 pt** on the owner's 430 pt phone against the 81.4 pt the
// text measures. No layout rule covered it: the layout law budgets `96` for the title
// inside `shelf`, and nothing checked that the component spent it that way.
//
// This is the check. It reads the font the component actually draws in, sums the advance
// widths of both mode titles, and compares them with the box the component gives the
// title on every viewport the layout law serves.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

import { REPO } from './helpers/load.mjs';
import { planFor, TOP_BAR } from '../src/layout/layout.mjs';
import vi from '../src/i18n/vi.js';
import en from '../src/i18n/en.js';

const PY = path.join(REPO, 'tools', '.venv', 'bin', 'python');
const FONTS = path.join(REPO, 'assets', 'fonts');

/**
 * The type scale, read out of `src/ui/typography.js` as **text**. It cannot be imported:
 * it `require()`s the font binaries for Metro, which Node will not do — the same reason
 * `test/font.test.mjs` reads the tile family with a regex rather than importing it. What
 * matters is that the size and the family come from the file the component draws with, so
 * changing either re-runs this gate.
 */
const TYPOGRAPHY = readFileSync(path.join(REPO, 'src', 'ui', 'typography.js'), 'utf8');
const MODE_TITLE = (() => {
  const m = TYPOGRAPHY.match(/modeTitle:\s*\{\s*size:\s*(\d+),\s*line:\s*(\d+),\s*family:\s*FONT\.(\w+)\s*\}/);
  assert.ok(m, 'src/ui/typography.js does not declare TYPE.modeTitle in the expected shape');
  const family = (TYPOGRAPHY.match(new RegExp(`^\\s*${m[3]}:\\s*'([^']+)',`, 'm')) ?? [])[1];
  assert.ok(family, `src/ui/typography.js does not declare FONT.${m[3]}`);
  return { size: Number(m[1]), line: Number(m[2]), family };
})();

/** The bar's own constants, read from the component so a change to it re-runs the gate. */
const TOPBAR = readFileSync(path.join(REPO, 'src', 'ui', 'TopBar.js'), 'utf8');
const GATE_DOT = Number((TOPBAR.match(/const GATE_DOT = (\d+);/) ?? [])[1]);
const SLOT_GAP = Number((TOPBAR.match(/const SLOT_GAP = (\d+);/) ?? [])[1]);
const SHELF_SLOTS = 5;

/** Advance widths from the shipped file — the same tool `test/font.test.mjs` uses. */
function measure(family, strings, size) {
  const file = path.join(FONTS, `${family}.ttf`);
  assert.ok(existsSync(file), `${family}.ttf is not in this build`);
  assert.ok(existsSync(PY), 'tools/.venv is missing; a gate that quietly does not run is not a gate');
  const script = `
import json, sys, unicodedata
from fontTools.ttLib import TTFont
font = TTFont(${JSON.stringify(file)})
upm = font['head'].unitsPerEm
cmap = font.getBestCmap()
hmtx = font['hmtx']
out = {}
for s in json.loads(sys.argv[1]):
    total = 0
    missing = []
    for ch in unicodedata.normalize('NFC', s):
        g = cmap.get(ord(ch))
        if g is None:
            missing.append(ch)
            continue
        total += hmtx[g][0]
    out[s] = {'pt': total / upm * ${size}, 'missing': missing}
print(json.dumps(out))
`;
  return JSON.parse(execFileSync(PY, ['-c', script, JSON.stringify(strings)], { encoding: 'utf8' }));
}

const TITLES = [vi.modeTitle, en.modeTitle];

test('the mode titles render at all in the face the bar draws them in', () => {
  assert.equal(MODE_TITLE.size, 13);
  const widths = measure(MODE_TITLE.family, TITLES, MODE_TITLE.size);
  for (const title of TITLES) {
    assert.deepEqual(widths[title].missing, [],
      `${MODE_TITLE.family} has no glyph for ${widths[title].missing.join(' ')} in "${title}"`);
    assert.ok(widths[title].pt > 0);
  }
  // `Ghép Chữ` is the Vietnamese one and it is the one with the stacked marks on it.
  assert.equal(vi.modeTitle, 'Ghép Chữ');
  assert.equal(en.modeTitle, 'Word Blocks');
});

test('§3.1 — both mode titles fit on ONE LINE, unclipped, on every served viewport', () => {
  const widths = measure(MODE_TITLE.family, TITLES, MODE_TITLE.size);
  const worst = Math.max(...TITLES.map((t) => widths[t].pt));

  // The viewports the app actually serves, taken from `ui.md` §4.4's own table plus the
  // floor. Both run lengths, because the shelf is sized from the content width and the
  // content width is what changes between them.
  const DEVICES = [
    ['iPhone 17 Plus', 430, 932, 59, 34],
    ['iPhone 17 Pro Max', 440, 956, 59, 34],
    ['iPhone 13/14', 390, 844, 47, 34],
    ['the 360 x 640 floor', 360, 640, 24, 0],
    ['iPad 10.9 portrait', 834, 1194, 24, 20],
    ['Android 412 x 915', 412, 915, 24, 24],
  ];
  const RUNS = [[29, 6], [26]];

  let checked = 0;
  const failures = [];
  for (const [name, W, H, top, bottom] of DEVICES) {
    for (const runs of RUNS) {
      const plan = planFor({ Wv: W, Hv: H, insetT: top, insetB: bottom, insetL: 0, insetR: 0 }, runs);
      if (!plan) continue; // not served for this language; V35's card, not this bar
      const L = plan.L;
      const shelfW = SHELF_SLOTS * L.shelf + (SHELF_SLOTS - 1) * SLOT_GAP;
      // What `TopBar` actually gives the title: the bar is `space-between` over three
      // children, the title takes its natural width and shrinks only if it must, so the
      // room available to it is everything the shelf and the gate dot do not take.
      const box = L.CW - shelfW - GATE_DOT;
      checked += 1;
      if (box < worst) failures.push(`${name} runs=[${runs}] CW=${L.CW} shelf=${L.shelf} box=${box.toFixed(1)} < ${worst.toFixed(1)}`);
    }
  }
  assert.ok(checked >= 10, `only ${checked} viewport/language combinations were measured`);
  assert.deepEqual(failures, [],
    `the mode title is clipped:\n  ${failures.join('\n  ')}`);
});

test('the old geometry is recorded, and it FAILED on the owner\'s own device', () => {
  // The defect, kept as arithmetic so nobody restores the layout that caused it. With
  // `flex: 1` on the title and `flex: 1` on the gate-dot column, the slack was split in
  // two and the title got half of it.
  const widths = measure(MODE_TITLE.family, TITLES, MODE_TITLE.size);
  const plan = planFor({ Wv: 430, Hv: 932, insetT: 59, insetB: 34, insetL: 0, insetR: 0 }, [26]);
  const L = plan.L;
  const shelfW = SHELF_SLOTS * L.shelf + (SHELF_SLOTS - 1) * SLOT_GAP;
  const oldBox = (L.CW - shelfW) / 2;
  const newBox = L.CW - shelfW - GATE_DOT;
  assert.ok(oldBox < widths[en.modeTitle].pt,
    `the old box was ${oldBox}, which should have been too small for ${widths[en.modeTitle].pt}`);
  assert.ok(newBox >= widths[en.modeTitle].pt);
  // And the bar is still 56 pt and the title is still one line — the fix is width, not
  // height, and `ui.md` §9.4's geometry is untouched.
  assert.equal(TOP_BAR, 56);
  assert.match(TOPBAR, /numberOfLines=\{1\}/);
});

test('the bar\'s three children claim the width this test says they claim', () => {
  // **The arithmetic above models a stylesheet, so it has to read that stylesheet.** A
  // fault injection that put `flex: 1` back on the gate-dot column left the numbers
  // untouched and the gate green, which is the exact shape of a check that cannot fail.
  //
  // The model is: the title takes its own width and shrinks only if it must; the shelf
  // and the gate-dot column take theirs; `space-between` distributes what is left. So
  // **no child may claim flex-grow**, and the title must be allowed to shrink.
  const block = TOPBAR.slice(TOPBAR.indexOf('const styles = StyleSheet.create('));
  const decl = (name) => (block.match(new RegExp(`\\b${name}:\\s*\\{([^}]*)\\}`)) ?? [])[1] ?? '';
  for (const name of ['title', 'shelf', 'right']) {
    const body = decl(name);
    assert.notEqual(body, '', `styles.${name} is gone; the top bar was restructured`);
    assert.ok(!/(^|[^a-zA-Z])flex\s*:/.test(body),
      `styles.${name} claims flex-grow (${body.trim()}), so the slack is not shared the way this test models it`);
    assert.ok(!/flexGrow\s*:\s*[1-9]/.test(body), `styles.${name} claims flexGrow`);
  }
  assert.match(decl('title'), /flexShrink:\s*1/,
    'the title must be allowed to shrink, or a 2x font scale pushes the shelf out of the bar');
});
