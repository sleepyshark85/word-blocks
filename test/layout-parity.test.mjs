// `src/layout/layout.mjs` is a transcription of the Tier-4 artefact. This is what makes
// the transcription a fact rather than an intention: both implementations are swept over
// the full supported range and every field of every result is compared.
//
// `acceptance-criteria.md` P1–P6, P11, P14–P16.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  layout as appLayout, fits as appFits, maxCells as appMaxCells,
  orientationOK as appOrientationOK, fitGlyph, RULES, MIN_TABLE, MAX_TABLE,
  TILE_MIN, CHROME, TOP_BAR, GAP_STRIP, PAD_BOTTOM,
} from '../src/layout/layout.mjs';

// `tools/layout-sweep.mjs` is a CLI: importing it runs the sweep and calls
// `process.exit`, which would end this file after one test and report a pass it had not
// earned. So the module half of it is loaded on its own, from the committed source, by
// cutting the file at the CLI boundary. The comparison is still against the real tool
// text — nothing is duplicated here.
const toolSource = readFileSync(new URL('../tools/layout-sweep.mjs', import.meta.url), 'utf8');
const cut = toolSource.indexOf('/* ---------------- the sweep ---------------- */');
assert.ok(cut > 0, 'tools/layout-sweep.mjs no longer has the sweep marker this test cuts at');
const tool = await import(`data:text/javascript;base64,${Buffer.from(toolSource.slice(0, cut)).toString('base64')}`);

const INSETS = [
  { insetT: 0, insetB: 0 },
  { insetT: 24, insetB: 16 },
  { insetT: 24, insetB: 48 },
  { insetT: 48, insetB: 34 },
  { insetT: 59, insetB: 34 },
  { insetT: 20, insetB: 0 },
  { insetT: 24, insetB: 20 },
  { insetT: 0, insetB: 21, insetL: 59, insetR: 59 },
];

test('the app layout law is identical to tools/layout-sweep.mjs across the whole range', () => {
  let compared = 0;
  let served = 0;
  for (let Wv = 360; Wv <= 1400; Wv += 4) {
    for (let Hv = 600; Hv <= 1440; Hv += 16) {
      for (const ins of INSETS) {
        for (let cells = 1; cells <= MAX_TABLE; cells += 1) {
          const a = appLayout({ Wv, Hv, ...ins, cells });
          const b = tool.layout({ Wv, Hv, ...ins, cells });
          if (a === null || b === null) {
            assert.equal(a, b, `one implementation serves ${Wv}x${Hv} cells=${cells} and the other does not`);
            compared += 1;
            continue;
          }
          for (const key of Object.keys(b)) {
            if (a[key] !== b[key]) {
              assert.fail(`${key} differs at ${Wv}x${Hv} ${JSON.stringify(ins)} cells=${cells}: app ${a[key]} vs tool ${b[key]}`);
            }
          }
          assert.equal(appFits(a), tool.fits(b));
          compared += 1;
        }
        assert.equal(appMaxCells({ Wv, Hv, ...ins }), tool.maxCells({ Wv, Hv, ...ins }));
        const ok = appOrientationOK({ Wv, Hv, ...ins });
        assert.equal(ok, tool.orientationOK({ Wv, Hv, ...ins }));
        if (ok) served += 1;
      }
    }
  }
  assert.ok(compared > 400000, `swept ${compared} layouts`);
  assert.ok(served > 10000, `only ${served} viewport/inset combinations served`);
});

test('the fit rule holds on every served layout — nothing scrolls, nothing is clipped', () => {
  let checked = 0;
  for (let Wv = 360; Wv <= 1400; Wv += 8) {
    for (let Hv = 600; Hv <= 1440; Hv += 16) {
      for (const ins of INSETS) {
        const v = { Wv, Hv, ...ins };
        const mc = appMaxCells(v);
        if (mc < MIN_TABLE) continue;
        for (let cells = 1; cells <= mc; cells += 1) {
          const L = appLayout({ ...v, cells });
          for (const [name, rule] of RULES) {
            assert.ok(rule(L), `${name} fails at ${Wv}x${Hv} ${JSON.stringify(ins)} cells=${cells}`);
          }
          // B13 / P3 — every cell the stage exposes is on screen at once.
          assert.ok(L.rows * L.cols >= cells);
          assert.ok(L.stripH + L.tableH + CHROME <= L.H);
          checked += 1;
        }
      }
    }
  }
  assert.ok(checked > 100000, `only checked ${checked}`);
});

test('P5 — an iPad 11" in portrait at stage 5 is 6 x 4 at 112 pt with a 118 pt strip', () => {
  const L = appLayout({ Wv: 834, Hv: 1194, insetT: 24, insetB: 20, cells: 24 });
  assert.equal(L.cols, 6);
  assert.equal(L.rows, 4);
  assert.equal(L.tile, 112);
  assert.equal(L.stripH, 118);
  assert.equal(L.gapY, 50);
  assert.equal(L.rowW, 757);
  assert.equal(L.tableH, 598);
  assert.equal(L.shelf, 44);
  assert.equal(L.stripFont, 65);
  assert.equal(L.tileFont, 58);
});

test('P6 — a 360 x 640 Android tops out at 20 cells, 4 x 5 at 73 pt, row 325 of 328', () => {
  const v = { Wv: 360, Hv: 640, insetT: 24, insetB: 16 };
  assert.equal(appMaxCells(v), 20);
  const L = appLayout({ ...v, cells: 20 });
  assert.equal(L.cols, 4);
  assert.equal(L.rows, 5);
  assert.equal(L.tile, 73);
  assert.equal(L.rowW, 325);
  assert.equal(L.tableW, 328);
  assert.equal(L.stripH, 77);
  assert.equal(L.shelf, 32);
});

test('P4 / P7 / P8 — a phone locks portrait, a tablet rotates, every served view holds 20', () => {
  const both = (w, h, top, bottom) => {
    const portrait = { Wv: Math.min(w, h), Hv: Math.max(w, h), insetT: top, insetB: bottom, insetL: 0, insetR: 0 };
    const landscape = { Wv: portrait.Hv, Hv: portrait.Wv, insetT: 0, insetB: bottom, insetL: top, insetR: top };
    return appOrientationOK(portrait) && appOrientationOK(landscape);
  };
  assert.equal(both(834, 1194, 24, 20), true, 'an iPad must rotate freely');
  assert.equal(both(800, 1280, 24, 24), true, 'an Android tablet must rotate freely');
  assert.equal(both(393, 852, 59, 34), false, 'an iPhone must lock to portrait');
  assert.equal(both(360, 640, 24, 16), false, 'a compact Android must lock to portrait');
  assert.equal(both(412, 915, 48, 34), false, 'a large Android phone must lock to portrait');
  // F7 restated: served means at least 20 cells, and 20 cells means every rule holds.
  assert.equal(appOrientationOK({ Wv: 852, Hv: 393, insetT: 0, insetB: 21, insetL: 59, insetR: 59 }), false);
});

test('P2 / P11 — the tile never goes below 72 pt and hit rects can never overlap', () => {
  let tightest = Infinity;
  for (let Wv = 360; Wv <= 1400; Wv += 4) {
    for (let Hv = 600; Hv <= 1440; Hv += 16) {
      for (const ins of INSETS) {
        const mc = appMaxCells({ Wv, Hv, ...ins });
        if (mc < MIN_TABLE) continue;
        for (let cells = 1; cells <= mc; cells += 1) {
          const L = appLayout({ Wv, Hv, ...ins, cells });
          assert.ok(L.tile >= TILE_MIN);
          // `ui.md` §4.5 — the hit rect extends 6 pt but is clipped to half the gap, so
          // two rects can touch and never overlap.
          assert.ok(Math.min(6, Math.floor(L.gap / 2)) * 2 <= L.gap);
          tightest = Math.min(tightest, L.tile);
        }
      }
    }
  }
  assert.equal(tightest, TILE_MIN, 'the floor is never actually reached — is it doing anything?');
});

test('P16 — the layout law has no caption-strip term, because the board has no caption', () => {
  const L = appLayout({ Wv: 834, Hv: 1194, insetT: 24, insetB: 20, cells: 24 });
  assert.ok(!('capH' in L), 'the layout still budgets a caption strip');
  assert.ok(!('captionFont' in L));
  assert.ok(!('frameH' in L), 'the layout still budgets a picture frame');
  assert.ok(!('plateH' in L), 'the layout still budgets a word plate');
  assert.ok(!('veil' in L));
  // And the chrome is the three things §4.2 names, and nothing else.
  assert.equal(CHROME, TOP_BAR + GAP_STRIP + PAD_BOTTOM);
  assert.equal(CHROME, 86);
});

test('P14 — a rotation changes the grid but never the reading order', () => {
  // The table is filled row-major from the same inventory order, so cell *i* is symbol
  // *i* in both orientations. That is the whole of P14, and it is a property of the
  // renderer's loop rather than of the law — what the law must not do is reorder.
  const portrait = appLayout({ Wv: 834, Hv: 1194, insetT: 24, insetB: 20, cells: 24 });
  const landscape = appLayout({ Wv: 1194, Hv: 834, insetT: 24, insetB: 20, cells: 24 });
  assert.equal(portrait.cols, 6);
  assert.equal(landscape.cols, 6);
  assert.equal(portrait.cols * portrait.rows >= 24, true);
  assert.equal(landscape.cols * landscape.rows >= 24, true);
});

test('Q7 — a multi-character glyph shrinks to fit but never below 24 pt', () => {
  const L = appLayout({ Wv: 360, Hv: 640, insetT: 24, insetB: 16, cells: 20 });
  assert.equal(fitGlyph(L.tile, L.tileFont, 1), L.tileFont);
  const three = fitGlyph(L.tile, L.tileFont, 3); // `ngh`
  assert.ok(three < L.tileFont, `a 3-glyph tile should shrink from ${L.tileFont}, got ${three}`);
  assert.ok(three >= 24, `never below 24 pt, got ${three}`);
  assert.ok(three * 3 * 0.56 <= L.tile * 0.82 + 1, 'fits 82% of the tile width');
  assert.equal(fitGlyph(72, 36, 12), 24);
});

test('the parity sweep can fail — a one-pixel drift in the app law is caught', () => {
  // `development-process.md` §5: never trust a green check you have not seen fail.
  // A transcription that is only *believed* identical is the defect this file exists for,
  // so the comparison is proven to notice one changed constant.
  const drifted = ({ Wv, Hv, insetT = 0, insetB = 0, insetL = 0, insetR = 0, cells }) => {
    const L = appLayout({ Wv, Hv, insetT, insetB, insetL, insetR, cells });
    return L === null ? null : { ...L, tile: L.tile - 1 };
  };
  let caught = false;
  const a = drifted({ Wv: 834, Hv: 1194, insetT: 24, insetB: 20, cells: 24 });
  const b = tool.layout({ Wv: 834, Hv: 1194, insetT: 24, insetB: 20, cells: 24 });
  for (const key of Object.keys(b)) if (a[key] !== b[key]) caught = true;
  assert.ok(caught, 'the field-by-field comparison would not notice a changed tile size');
});
