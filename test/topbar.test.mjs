// The top bar's text fits the boxes the layout law gives it, measured from the shipped
// font files. **Restated for design revision 6, and the restatement is the point.**
//
// `ui.md` §3.1: *"The mode title is on every screen… **Every screenshot the tester takes
// carries its own label.**"* A label that reads `Word Blo…` is not that label, and the
// owner saw it in every English screenshot for three revisions. It shipped because
// `src/ui/TopBar.js` gave the title `flex: 1` and gave the 32 pt gate-dot column `flex: 1`
// as well, so the slack either side of the shelf was split equally and the title got
// **74 pt** on his 430 pt phone against the 81.4 pt the text measures.
//
// **Revision 6 moved every box this file measures.** The bar is 72 pt and carries three
// children: a 72 pt language control, the shelf **with the mode title under it**, and a
// 65 pt parent door carrying a *word*. So:
//
//   * the mode title's box is the **shelf row** (`F19`), not the space left over at the
//     left edge;
//   * there is a **second** string to measure — the door's label — and its box is
//     `DOOR_W − 2·DOOR_PAD` (`F22`);
//   * and the whole bar has to fit the content width with all three in it (`F18`).
//
// **The revision-5 version of this file still passed.** It computed
// `box = CW − shelfW − GATE_DOT`, and `GATE_DOT` no longer exists in the component, so
// `Number(undefined)` made the box `NaN`, every `box < worst` comparison was `false`, and
// the gate reported success having measured nothing. *That* is the failure mode this
// file is built against: an arithmetic model of a stylesheet it does not read. Every
// number below is read from either the layout law or the component, and the last test
// asserts the component really is shaped the way this arithmetic assumes.

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

import { REPO } from './helpers/load.mjs';
import {
  planFor, TOP_BAR, LANG_W, DOOR_W, DOOR_PAD, DOOR_LABEL_PT, TITLE_PT, BAR_AIR, SLOT_GAP,
  shelfRowW, PLAN_RULES, LAW,
} from '../src/layout/layout.mjs';
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

const TOPBAR = readFileSync(path.join(REPO, 'src', 'ui', 'TopBar.js'), 'utf8');

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

/** Both mode titles and — **new in revision 6** — both parent-door labels. */
const TITLES = [vi.modeTitle, en.modeTitle];
const DOOR_LABELS = [vi.parentDoor, en.parentDoor];
const HINTS = [vi.holdHint, en.holdHint];
const WIDTHS = measure(MODE_TITLE.family, [...TITLES, ...DOOR_LABELS, ...HINTS], MODE_TITLE.size);
const widest = (strings) => Math.max(...strings.map((s) => WIDTHS[s].pt));

/**
 * The viewports the app actually serves, taken from `ui.md` §4.4's own table plus the
 * floor. Both run lengths, because the shelf is sized from the content width and the
 * content width is what changes between them.
 */
const DEVICES = [
  ['iPhone 17 Plus', 430, 932, 59, 34],
  ['iPhone 17 Pro Max', 440, 956, 59, 34],
  ['iPhone 13/14', 390, 844, 47, 34],
  ['the 360 x 640 floor', 360, 640, 24, 0],
  ['iPad 10.9 portrait', 834, 1194, 24, 20],
  ['Android 412 x 915', 412, 915, 24, 24],
];
const RUNS = [[29, 6], [26]];

/** Every served (device, language) pair, with the layout the law gives it. */
function* served() {
  for (const [name, W, H, top, bottom] of DEVICES) {
    for (const runs of RUNS) {
      const plan = planFor({
        Wv: W, Hv: H, insetT: top, insetB: bottom, insetL: 0, insetR: 0,
      }, runs);
      if (!plan) continue; // not served for this language; V35's card, not this bar
      yield { name: `${name} runs=[${runs}]`, L: plan.L };
    }
  }
}

test('every string the bar draws renders at all, in the face the bar draws it in', () => {
  assert.equal(MODE_TITLE.size, 13);
  for (const s of [...TITLES, ...DOOR_LABELS, ...HINTS]) {
    assert.deepEqual(WIDTHS[s].missing, [],
      `${MODE_TITLE.family} has no glyph for ${WIDTHS[s].missing.join(' ')} in "${s}"`);
    assert.ok(WIDTHS[s].pt > 0);
  }
  // `Ghép Chữ` is the Vietnamese mode title and the one with the stacked marks on it;
  // `Cha mẹ` carries a dot below. Both are the diacritics this app exists to render.
  assert.equal(vi.modeTitle, 'Ghép Chữ');
  assert.equal(en.modeTitle, 'Word Blocks');
  assert.equal(vi.parentDoor, 'Cha mẹ');
  assert.equal(en.parentDoor, 'Parent');
});

test('the layout law\'s two text constants ARE the shipped font\'s measurements', () => {
  // **This is the join, and without it F18, F19 and F22 are arithmetic about nothing.**
  // The law carries `TITLE_PT` and `DOOR_LABEL_PT` as literals so that neither the sweep
  // nor the app grows a font dependency; this is the one place that checks the literals
  // against the file, to one decimal place.
  assert.equal(Math.round(widest(TITLES) * 10) / 10, TITLE_PT);
  assert.equal(Math.round(widest(DOOR_LABELS) * 10) / 10, DOOR_LABEL_PT);
  // And the wider of each pair is the one the law names, which is what makes taking a
  // max over both languages meaningful rather than lucky.
  assert.ok(WIDTHS[en.modeTitle].pt > WIDTHS[vi.modeTitle].pt);
  assert.ok(WIDTHS[vi.parentDoor].pt > WIDTHS[en.parentDoor].pt);
});

test('F19 / §3.1 — the mode title fits UNDER THE SHELF, on every served viewport', () => {
  // **The box moved in revision 6 and this is the assertion that moved with it.** The
  // title is no longer at the left edge — the child's 72 pt language control is — so its
  // box is the shelf row, and it costs no width at all.
  const worst = widest(TITLES);
  const f19 = PLAN_RULES.find(([n]) => n.startsWith('F19'))[1];
  let checked = 0;
  const failures = [];
  for (const { name, L } of served()) {
    const box = shelfRowW(L.shelf);
    checked += 1;
    if (box < worst) failures.push(`${name} shelf=${L.shelf} box=${box} < ${worst.toFixed(1)}`);
    // …and the law's own rule agrees with the measurement, at the same viewport.
    assert.equal(f19({ L }), box >= TITLE_PT, `${name}: F19 and this arithmetic disagree`);
  }
  assert.ok(checked >= 10, `only ${checked} viewport/language combinations were measured`);
  assert.deepEqual(failures, [], `the mode title is clipped:\n  ${failures.join('\n  ')}`);
});

test('F22 / Y19 — the parent door\'s label fits inside its reserved 65 pt, unclipped', () => {
  // Y19: *the door's label is a word in the app's language, never an icon, and it is
  // rendered in the bundled face without truncation on every served viewport.* The door
  // is a fixed 65 pt on every device, so this is a constant — but it is a constant about
  // a **string**, and the string is the thing a translator changes.
  //
  // **The box is computed from the STYLESHEET, not from the law's two constants**, and
  // that is the whole lesson of this test. The first build of revision 6 put a 1.5 pt
  // border *and* 8 pt of padding inside a 65 pt border-box door, which left the label
  // 46 pt against 48.8 — and a browser rendered `Cha …`, the same defect as `Word Blo…`,
  // on the same bar. F22 says nothing about a border. This does.
  const door = (TOPBAR.match(/\bdoor:\s*\{([^}]*)\}/) ?? [])[1] ?? '';
  assert.notEqual(door, '', 'styles.door is gone; the parent door was restructured');
  const px = (name, fallback) => {
    const m = door.match(new RegExp(`${name}:\\s*([^,\\n]+)`));
    if (!m) return fallback;
    const expr = m[1].trim()
      .replace(/\bDOOR_W\b/g, String(DOOR_W))
      .replace(/\bDOOR_PAD\b/g, String(DOOR_PAD))
      .replace(/\bDOOR_BORDER\b/g, String((TOPBAR.match(/const DOOR_BORDER = ([\d.]+);/) ?? [])[1] ?? NaN));
    assert.match(expr, /^[\d.+\-* /()]+$/, `styles.door.${name} is not arithmetic this test can follow: ${expr}`);
    // eslint-disable-next-line no-new-func -- the expression is asserted to be arithmetic
    return Number(new Function(`return ${expr}`)());
  };
  const drawn = px('width', NaN) - 2 * px('borderWidth', 0) - 2 * px('paddingHorizontal', 0);
  assert.equal(drawn, DOOR_W - 2 * DOOR_PAD,
    `the drawn label box is ${drawn} pt and the law reserves ${DOOR_W - 2 * DOOR_PAD}`);
  const box = drawn;
  for (const label of DOOR_LABELS) {
    assert.ok(WIDTHS[label].pt <= box,
      `"${label}" measures ${WIDTHS[label].pt.toFixed(1)} pt and the door gives it ${box}`);
  }
  // The law's F22 is the same question asked of the constant, and it must agree.
  assert.equal(LAW.find(([n]) => n.startsWith('F22'))[1](), true);
  // The margin is **0.2 pt** on `Cha mẹ`, and that is not an accident: `DOOR_W` is the
  // ceiling `Cha mẹ` needs. A longer word does not fit, and F22 is what says so — the
  // designer's own injection was `Người lớn` at 60.2 pt.
  assert.ok(box - WIDTHS[vi.parentDoor].pt < 1);
});

test('F18 — all three children of the 72 pt bar fit the content width, measured', () => {
  const title = widest(TITLES);
  const door = widest(DOOR_LABELS) + 2 * DOOR_PAD;
  const f18 = PLAN_RULES.find(([n]) => n.startsWith('F18'))[1];
  let worstAir = Infinity;
  let worstAt = '';
  for (const { name, L } of served()) {
    const need = LANG_W + Math.max(shelfRowW(L.shelf), title) + door + BAR_AIR;
    assert.ok(need <= L.CW,
      `${name}: the bar needs ${need.toFixed(1)} pt and has ${L.CW}`);
    assert.equal(f18({ L }), true, `${name}: F18 disagrees with the measurement`);
    const air = L.CW - need;
    if (air < worstAir) { worstAir = air; worstAt = name; }
  }
  // `ui.md` §4.2: `BAR_PAD` is slop, and 24 was not enough of it — at 24 the worst air
  // over the whole sweep was 0.2 pt, at 32 it is 6.2 pt. Over these named devices it is
  // wider still, and the number is printed so a regression is legible.
  assert.ok(worstAir >= 0, `the tightest bar is ${worstAir.toFixed(1)} pt at ${worstAt}`);
});

test('the revision-5 bar CANNOT hold revision 6\'s children — the arithmetic that moved the title', () => {
  // Recorded rather than argued. On the owner's own phone the content width is 392 pt.
  // With the mode title back at the left edge, beside a 72 pt language control and a
  // 65 pt door, the bar needs 447 pt. **That is why the title is drawn under the shelf**,
  // and F19 is the rule that makes it a fact instead of a hope.
  const L = planFor({ Wv: 430, Hv: 932, insetT: 59, insetB: 34, insetL: 0, insetR: 0 }, [26]).L;
  assert.equal(L.CW, 392);
  assert.equal(L.shelf, 41);
  const asRevision5 = LANG_W + WIDTHS[en.modeTitle].pt + shelfRowW(L.shelf) + DOOR_W;
  assert.ok(asRevision5 > L.CW,
    `the old geometry needs ${asRevision5.toFixed(1)} pt of ${L.CW} and should not fit`);
  // And the revision-6 geometry does, with room to spare.
  const asRevision6 = LANG_W + Math.max(shelfRowW(L.shelf), TITLE_PT)
    + (DOOR_LABEL_PT + 2 * DOOR_PAD) + BAR_AIR;
  assert.ok(asRevision6 <= L.CW);
});

test('the bar the arithmetic above models is the bar the component draws', () => {
  // **The arithmetic models a stylesheet, so it has to read that stylesheet.** The
  // revision-5 version of this test read a `GATE_DOT` constant out of the component; when
  // the constant went away the read produced `NaN`, every comparison became `false`, and
  // the gate stayed green while measuring nothing. So the shape is asserted directly.

  // 1. The bar is 72 pt and takes its three widths from the LAW, not from literals here.
  assert.equal(TOP_BAR, 72);
  assert.match(TOPBAR, /height: TOP_BAR/);
  assert.match(TOPBAR, /import \{[^}]*LANG_W[^}]*DOOR_W[^}]*\} from '\.\.\/layout\/layout\.mjs'/s);
  assert.match(TOPBAR, /lane: \{ width: LANG_W/);
  assert.match(TOPBAR, /doorLane: \{ width: DOOR_W/);
  assert.match(TOPBAR, /width: DOOR_W,/); // the door itself, not just its lane
  assert.ok(!/GATE_DOT/.test(TOPBAR), 'the 32 pt gate dot is gone; it is a labelled door now');
  // The shelf gap is the layout law's `SLOT_GAP`, which is what `shelfRowW` spends.
  assert.equal(SLOT_GAP, 6);
  assert.match(TOPBAR, /marginLeft: index === 0 \? 0 : SLOT_GAP/);

  // 2. **The mode title is drawn UNDER THE SHELF.** F19's whole premise.
  const shelfColumn = TOPBAR.slice(
    TOPBAR.indexOf('function ShelfColumn('),
    TOPBAR.indexOf('function LanguageControl('),
  );
  assert.ok(shelfColumn.length > 200, 'ShelfColumn is gone; the top bar was restructured');
  assert.match(shelfColumn, /role="modeTitle"/);
  assert.match(shelfColumn, /styles\.shelf/);
  assert.ok(shelfColumn.indexOf('styles.shelf') < shelfColumn.indexOf('role="modeTitle"'),
    'the title is drawn before the shelf, so it is not under it');
  assert.match(TOPBAR, /numberOfLines=\{1\}/);

  // 3. **No child of the bar claims flex-grow**, so the three lanes really do take the
  // widths the law reserves and `space-between` distributes what is left. A fault
  // injection that put `flex: 1` back on one of them left the numbers above untouched
  // and the gate green, which is the exact shape of a check that cannot fail.
  const block = TOPBAR.slice(TOPBAR.indexOf('const styles = StyleSheet.create('));
  const decl = (name) => (block.match(new RegExp(`\\b${name}:\\s*\\{([^}]*)\\}`)) ?? [])[1] ?? '';
  for (const name of ['lane', 'doorLane', 'centre', 'shelf', 'title']) {
    const body = decl(name);
    assert.notEqual(body, '', `styles.${name} is gone; the top bar was restructured`);
    assert.ok(!/(^|[^a-zA-Z])flex\s*:/.test(body),
      `styles.${name} claims flex-grow (${body.trim()}), so the slack is not shared the way this test models it`);
    assert.ok(!/flexGrow\s*:\s*[1-9]/.test(body), `styles.${name} claims flexGrow`);
  }
  assert.match(decl('title'), /flexShrink:\s*1/,
    'the title must be allowed to shrink, or a 2x font scale pushes the shelf out of the bar');
  assert.match(decl('centre'), /flexShrink:\s*1/,
    'the shelf column must be allowed to shrink with it');
});

test('Y1 / Y10 / Y20 — the control is 72 pt of INK, is not a tile, and the door is silent', () => {
  // Y1: *its ink is 72 × 72 — not a 72 pt hit rect around something smaller.* The lane
  // and the control are both `LANG_W`, and `LANG_W >= TILE_MIN` is F20 in the law.
  assert.equal(LANG_W, 72);
  assert.match(TOPBAR, /lang: \{\s*width: LANG_W,\s*height: LANG_W,/);
  assert.equal(LAW.find(([n]) => n.startsWith('F20'))[1](), true);
  assert.equal(LAW.find(([n]) => n.startsWith('F21'))[1](), true);

  // Y10: no role identity bar, a different radius from a tile, and **not** an instance of
  // the tile component.
  assert.ok(!/from '\.\/Tile'/.test(TOPBAR), 'the top bar imports the tile component');
  assert.ok(!/role1|role2|role3|roleOf/.test(TOPBAR), 'the language control wears a role');
  assert.match(TOPBAR, /lang: \{[^}]*borderRadius: 18/s);

  // Y2: no glyph, no letter, no word on the control — it draws two bars and nothing else.
  const control = TOPBAR.slice(
    TOPBAR.indexOf('function LanguageControl('),
    TOPBAR.indexOf('function HoldHint('),
  );
  assert.ok(control.length > 200, 'LanguageControl is gone');
  assert.ok(!/<Glyph|<AppText|role="modeTitle"/.test(control),
    'the language control draws text; Y2 says it carries no glyph, no letter and no word');
  assert.match(control, /chooserPanels\(\)/,
    'the row order must come from the chooser, so "Vietnamese on top" is one fact');

  // Y20: **the door is the only control in the app that never makes a sound.** Nothing in
  // this file plays anything at all — the shelf replays through the controller, and the
  // language control's one UI tap is `controller.languageTap()`.
  assert.ok(!/\bplay(Ui|Speech|Motif)\b|\baudio\./.test(TOPBAR),
    'the top bar reaches the audio engine; the parent door must be silent (Y20)');
});
