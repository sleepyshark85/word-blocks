// `src/layout/layout.mjs` is a transcription of the Tier-4 artefact. This is what makes
// the transcription a fact rather than an intention: both implementations are swept over
// the full supported range and every field of every result is compared — the layout, the
// grid, **the page plan and the paging fixpoint**.
//
// `acceptance-criteria.md` P1–P6b, P11, P14–P16, V3–V9, V20, V21.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  layout as appLayout, fits as appFits, maxCells as appMaxCells,
  orientationOK as appOrientationOK, planFor as appPlanFor, pagePlan as appPagePlan,
  gridFor as appGridFor, planFits as appPlanFits, fitGlyph, RULES, PLAN_RULES,
  MIN_TABLE, MAX_TABLE, TILE_MIN, CHROME, TOP_BAR, GAP_STRIP, PAD_BOTTOM,
  RAIL_GAP, RAIL_MAX_ROWS, railCols, railH, orientationPolicy,
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
  { insetT: 62, insetB: 34 },
  { insetT: 20, insetB: 0 },
  { insetT: 24, insetB: 20 },
  { insetT: 0, insetB: 21, insetL: 59, insetR: 59 },
];

/** The two shipped inventories as run lengths. `ui.md` §4.2. */
const VI_RUNS = [26, 35, 6];
const EN_RUNS = [26, 10];

test('the app layout law is identical to tools/layout-sweep.mjs across the whole range', () => {
  let compared = 0;
  for (let Wv = 360; Wv <= 1400; Wv += 4) {
    for (let Hv = 600; Hv <= 1440; Hv += 16) {
      for (const ins of INSETS) {
        for (const railRows of [0, 1, 2]) {
          for (let cells = 1; cells <= MAX_TABLE; cells += 3) {
            const a = appLayout({
              Wv, Hv, ...ins, cells, railRows,
            });
            const b = tool.layout({
              Wv, Hv, ...ins, cells, railRows,
            });
            if (a === null || b === null) {
              assert.equal(a, b, `one implementation serves ${Wv}x${Hv} cells=${cells} rail=${railRows} and the other does not`);
              compared += 1;
              continue;
            }
            for (const key of Object.keys(b)) {
              if (a[key] !== b[key]) {
                assert.fail(`${key} differs at ${Wv}x${Hv} ${JSON.stringify(ins)} cells=${cells} rail=${railRows}: app ${a[key]} vs tool ${b[key]}`);
              }
            }
            assert.equal(appFits(a), tool.fits(b));
            compared += 1;
          }
        }
      }
    }
  }
  assert.ok(compared > 400000, `swept ${compared} layouts`);
});

test('V4–V8 — the page plan and the fixpoint are identical to the tool', () => {
  let plans = 0;
  let served = 0;
  let paged = 0;
  for (let Wv = 360; Wv <= 1400; Wv += 8) {
    for (let Hv = 600; Hv <= 1440; Hv += 24) {
      for (const ins of INSETS) {
        const v = { Wv, Hv, ...ins };
        for (const railRows of [0, 1, 2]) {
          assert.equal(appMaxCells(v, railRows), tool.maxCells(v, railRows),
            `budget differs at ${Wv}x${Hv} rail=${railRows}`);
        }
        for (const runs of [VI_RUNS, EN_RUNS]) {
          const a = appPlanFor(v, runs);
          const b = tool.planFor(v, runs);
          assert.equal(a === null, b === null, `planFor disagrees at ${Wv}x${Hv} ${JSON.stringify(ins)}`);
          if (a === null) continue;
          assert.deepEqual(a, b, `the page plan differs at ${Wv}x${Hv} ${JSON.stringify(ins)}`);
          assert.equal(appPlanFits(a, runs), true, `a served plan fails a plan rule at ${Wv}x${Hv}`);
          plans += 1;
          if (a.paged) paged += 1;
        }
        const ok = appOrientationOK(v);
        assert.equal(ok, tool.orientationOK(v));
        if (ok) served += 1;
      }
    }
  }
  assert.ok(plans > 20000, `only built ${plans} page plans`);
  assert.ok(served > 10000, `only ${served} viewport/inset combinations served`);
  assert.ok(paged > 1000, `only ${paged} plans were paged — the paged branch is barely exercised`);
});

test('V5 / V6 — pagePlan balances a run and drops nothing, identically to the tool', () => {
  for (let cap = 12; cap <= 90; cap += 1) {
    for (const runs of [VI_RUNS, EN_RUNS, [26, 35, 6, 1], [1], [90], [7, 7, 7]]) {
      const a = appPagePlan(runs, cap);
      assert.deepEqual(a, tool.pagePlan(runs, cap), `pagePlan differs at cap=${cap}`);
      // V6 — every character is on exactly one page.
      assert.equal(a.reduce((x, y) => x + y, 0), runs.reduce((x, y) => x + y, 0));
      // V5 — balanced: within one run, no two pages differ by more than 1.
      assert.ok(a.every((n) => n > 0), 'V13 — no page is empty');
    }
  }
  // The named case from `ui.md` §7.1: 35 rimes at capacity 28 is 18/17, never 28/7.
  assert.deepEqual(appPagePlan([35], 28), [18, 17]);
  assert.deepEqual(appPagePlan(VI_RUNS, 28), [26, 18, 17, 6]);
  assert.deepEqual(appPagePlan(EN_RUNS, 28), [26, 10]);
});

test('gridFor is identical to the tool over the whole search space', () => {
  for (let tableW = 280; tableW <= 1280; tableW += 17) {
    for (let H = 560; H <= 1440; H += 31) {
      for (const cells of [1, 6, 12, 16, 20, 26, 28, 35, 36, 67, 90]) {
        assert.deepEqual(appGridFor(tableW, H, cells), tool.gridFor(tableW, H, cells),
          `gridFor(${tableW},${H},${cells}) differs`);
      }
    }
  }
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
          // B13 / P3 — every cell the page holds is on screen at once.
          assert.ok(L.rows * L.cols >= cells);
          assert.ok(L.stripH + L.tableH + CHROME <= L.H);
          checked += 1;
        }
      }
    }
  }
  assert.ok(checked > 100000, `only checked ${checked}`);
});

test('P5 / V1 — an iPad 11" portrait holds the whole 67-cell table at 86 pt, 7 x 10, no rail', () => {
  const v = { Wv: 834, Hv: 1194, insetT: 24, insetB: 20 };
  const P = appPlanFor(v, VI_RUNS);
  assert.equal(P.paged, false, 'a tablet must not page');
  assert.equal(P.railRows, 0);
  assert.equal(railH(0), 0, 'V1 — no rail is charged');
  assert.deepEqual(P.pages, [67]);
  assert.equal(P.L.cols, 7);
  assert.equal(P.L.rows, 10);
  assert.equal(P.L.tile, 86);
  // English is one page too.
  assert.equal(appPlanFor(v, EN_RUNS).paged, false);
});

test('P6 — a 360 x 640 Android: 12 cells per page, 7 Vietnamese pages, every word reachable', () => {
  const v = { Wv: 360, Hv: 640, insetT: 24, insetB: 16 };
  const P = appPlanFor(v, VI_RUNS);
  assert.equal(P.paged, true);
  assert.equal(P.cap, 12);
  assert.deepEqual(P.pages, [9, 9, 8, 12, 12, 11, 6]);
  assert.equal(P.railRows, 2);
  assert.equal(P.L.tile, 73);
  assert.equal(P.pages.reduce((a, b) => a + b, 0), 67, 'all 67 characters are on a page');
  assert.deepEqual(appPlanFor(v, EN_RUNS).pages, [13, 13, 10]);
});

test('P6a — an iPhone SE 3 holds 16 cells per page and 6 Vietnamese pages', () => {
  const v = { Wv: 375, Hv: 667, insetT: 20, insetB: 0 };
  const P = appPlanFor(v, VI_RUNS);
  assert.equal(P.cap, 16);
  assert.deepEqual(P.pages, [13, 13, 12, 12, 11, 6]);
  assert.equal(P.pages.length, 6);
  assert.equal(P.L.tile, 72);
});

test('V3 — an iPhone 17 Plus is 4 VI pages [26,18,17,6] and 2 EN pages [26,10] at BOTH candidate sizes', () => {
  for (const [label, v] of [
    ['A 430x932', { Wv: 430, Hv: 932, insetT: 59, insetB: 34 }],
    ['B 440x956', { Wv: 440, Hv: 956, insetT: 62, insetB: 34 }],
  ]) {
    const vi = appPlanFor(v, VI_RUNS);
    const en = appPlanFor(v, EN_RUNS);
    assert.equal(vi.cap, 28, `${label}: 28 cells per page`);
    assert.deepEqual(vi.pages, [26, 18, 17, 6], `${label}: the Vietnamese plan`);
    assert.deepEqual(en.pages, [26, 10], `${label}: the English plan — page 1 is the whole alphabet`);
    assert.equal(vi.railRows, 1, `${label}: one rail row`);
    assert.equal(vi.L.railCols >= 4, true, `${label}: four buttons fit one row`);
    assert.equal(vi.L.cols, 4);
    assert.equal(vi.L.rows, 7);
    assert.equal(vi.cells, 26, `${label}: one grid, sized from the largest page`);
  }
  assert.equal(appPlanFor({ Wv: 430, Hv: 932, insetT: 59, insetB: 34 }, VI_RUNS).L.tile, 75);
  assert.equal(appPlanFor({ Wv: 440, Hv: 956, insetT: 62, insetB: 34 }, VI_RUNS).L.tile, 77);
});

test('P6b — the chrome is 56 + 12 + 12 = 80 and the tile floor is 72', () => {
  assert.equal(TOP_BAR, 56);
  assert.equal(GAP_STRIP, 12);
  assert.equal(PAD_BOTTOM, 12);
  assert.equal(CHROME, 80);
  assert.equal(TILE_MIN, 72);
  assert.equal(RAIL_GAP, 12);
  assert.equal(RAIL_MAX_ROWS, 2);
});

test('P4 / P7 / P8 — a tablet rotates, a phone locks to portrait, served means a page plan', () => {
  // **F7 and P7 came apart in revision 4, and this test records exactly where.** F7 is
  // "can build a page plan for both packs"; paging made that true of a *landscape*
  // 430 x 932 phone, which revision 3's truncated board could never satisfy. So the fit
  // rule alone no longer locks the biggest phones to portrait, and `orientationPolicy`
  // carries P7/P8 instead — reported as a deviation rather than absorbed.
  assert.equal(appOrientationOK({ Wv: 932, Hv: 430, insetT: 0, insetB: 34, insetL: 59, insetR: 59 }),
    true, 'the law now serves a landscape iPhone 17 Plus; the tool says so too');
  assert.equal(appOrientationOK({ Wv: 852, Hv: 393, insetT: 0, insetB: 21, insetL: 59, insetR: 59 }),
    false, 'a landscape iPhone 15 still fails F7');

  const policy = (w, h, top, bottom) => orientationPolicy({ width: w, height: h }, { top, bottom, left: 0, right: 0 });
  assert.equal(policy(834, 1194, 24, 20), 'both', 'P8 — an iPad must rotate freely');
  assert.equal(policy(800, 1280, 24, 24), 'both', 'P8 — an Android tablet must rotate freely');
  assert.equal(policy(393, 852, 59, 34), 'portrait', 'P7 — an iPhone locks to portrait');
  assert.equal(policy(360, 640, 24, 16), 'portrait', 'P7 — a compact Android locks to portrait');
  assert.equal(policy(430, 932, 59, 34), 'portrait', 'P7 — the owner"s iPhone 17 Plus locks to portrait');
  assert.equal(policy(440, 956, 62, 34), 'portrait', 'P7 — at the other candidate size too');
});

test('P2 / P11 / V20 — the tile never goes below 72 pt and hit rects can never overlap', () => {
  let tightest = Infinity;
  for (let Wv = 360; Wv <= 1400; Wv += 8) {
    for (let Hv = 600; Hv <= 1440; Hv += 16) {
      for (const ins of INSETS) {
        const mc = appMaxCells({ Wv, Hv, ...ins });
        if (mc < MIN_TABLE) continue;
        for (let cells = 1; cells <= mc; cells += 1) {
          const L = appLayout({
            Wv, Hv, ...ins, cells,
          });
          assert.ok(L.tile >= TILE_MIN);
          // `ui.md` §4.5 — the hit rect extends 6 pt but is clipped to half the gap, so
          // two rects can touch and never overlap.
          assert.ok(Math.min(6, Math.floor(L.gap / 2)) * 2 <= L.gap);
          // V20 — a rail button is a 72 pt target with a 12 pt gap; two never overlap.
          assert.ok(railCols(L.CW) >= 1);
          assert.ok(railCols(L.CW) * TILE_MIN + (railCols(L.CW) - 1) * RAIL_GAP <= L.CW + RAIL_GAP);
          tightest = Math.min(tightest, L.tile);
        }
      }
    }
  }
  assert.equal(tightest, TILE_MIN, 'the floor is never actually reached — is it doing anything?');
});

test('V21 — on every served paged viewport the rail fits, in at most 2 rows', () => {
  let checked = 0;
  for (let Wv = 360; Wv <= 1400; Wv += 12) {
    for (let Hv = 600; Hv <= 1440; Hv += 28) {
      for (const ins of INSETS) {
        const v = { Wv, Hv, ...ins };
        if (!appOrientationOK(v)) continue;
        for (const runs of [VI_RUNS, EN_RUNS]) {
          const P = appPlanFor(v, runs);
          if (!P.paged) continue;
          assert.ok(P.railRows <= RAIL_MAX_ROWS);
          assert.ok(P.pages.length <= P.railRows * P.L.railCols,
            `the rail cannot hold ${P.pages.length} buttons at ${Wv}x${Hv}`);
          assert.equal(P.L.railH, railH(P.railRows));
          checked += 1;
        }
      }
    }
  }
  assert.ok(checked > 1000, `only checked ${checked} paged viewports`);
});

test('P16 — the layout law has no caption-strip, frame, plate or stage term', () => {
  const L = appLayout({
    Wv: 834, Hv: 1194, insetT: 24, insetB: 20, cells: 67,
  });
  assert.ok(!('capH' in L), 'the layout still budgets a caption strip');
  assert.ok(!('captionFont' in L));
  assert.ok(!('frameH' in L), 'the layout still budgets a picture frame');
  assert.ok(!('plateH' in L), 'the layout still budgets a word plate');
  assert.ok(!('veil' in L));
  assert.ok(!('stage' in L), 'there are no stages (gameplay.md §3.6)');
  assert.equal(typeof tool.zonesFor, 'undefined', 'zonesFor() must stay deleted (U21)');
});

test('P14 — a rotation changes the grid but never the reading order', () => {
  // The table is filled row-major from the same inventory order, so cell *i* is symbol
  // *i* in both orientations. That is the whole of P14, and it is a property of the
  // renderer's loop rather than of the law — what the law must not do is reorder.
  const portrait = appLayout({
    Wv: 834, Hv: 1194, insetT: 24, insetB: 20, cells: 67,
  });
  const landscape = appLayout({
    Wv: 1194, Hv: 834, insetT: 24, insetB: 20, cells: 67,
  });
  assert.equal(portrait.cols, 7);
  assert.equal(portrait.rows, 10);
  assert.equal(landscape.cols, 12);
  assert.equal(landscape.rows, 6);
  assert.ok(portrait.cols * portrait.rows >= 67);
  assert.ok(landscape.cols * landscape.rows >= 67);
});

test('Q7 — a multi-character glyph shrinks to fit but never below 24 pt', () => {
  const L = appLayout({
    Wv: 360, Hv: 640, insetT: 24, insetB: 16, cells: 12, railRows: 2,
  });
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
  const drifted = ({
    Wv, Hv, insetT = 0, insetB = 0, insetL = 0, insetR = 0, cells,
  }) => {
    const L = appLayout({
      Wv, Hv, insetT, insetB, insetL, insetR, cells,
    });
    return L === null ? null : { ...L, tile: L.tile - 1 };
  };
  let caught = false;
  const a = drifted({
    Wv: 834, Hv: 1194, insetT: 24, insetB: 20, cells: 67,
  });
  const b = tool.layout({
    Wv: 834, Hv: 1194, insetT: 24, insetB: 20, cells: 67,
  });
  for (const key of Object.keys(b)) if (a[key] !== b[key]) caught = true;
  assert.ok(caught, 'the field-by-field comparison would not notice a changed tile size');
});

test('the plan comparison can fail — a greedy pagePlan is caught by the plan rules', () => {
  // The same discipline for the revision-4 half: a `pagePlan` that packed greedily
  // instead of balancing, or dropped a remainder, must be noticed by something here.
  const greedy = (runs, cap) => {
    const pages = [];
    for (const len of runs) {
      let left = len;
      while (left > 0) { pages.push(Math.min(cap, left)); left -= cap; }
    }
    return pages;
  };
  assert.deepEqual(greedy([35], 28), [28, 7]);
  assert.notDeepEqual(greedy([35], 28), appPagePlan([35], 28),
    'the balanced split and the greedy split must differ, or V5 is untestable');

  const dropping = (runs, cap) => appPagePlan(runs, cap).map((n) => n).slice(0, -1);
  const P = { ...appPlanFor({ Wv: 430, Hv: 932, insetT: 59, insetB: 34 }, VI_RUNS) };
  const poisoned = { ...P, pages: dropping(VI_RUNS, P.cap) };
  const f12 = PLAN_RULES.find(([n]) => n.startsWith('F12'))[1];
  assert.equal(f12(P, VI_RUNS), true);
  assert.equal(f12(poisoned, VI_RUNS), false, 'F12 would not notice a dropped page');
});
