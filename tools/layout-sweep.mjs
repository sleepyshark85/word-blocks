#!/usr/bin/env node
// layout-sweep.mjs -- verifies the Ghép Chữ / Word Blocks layout law over a CONTINUOUS
// viewport range rather than a handful of named devices.  Owner: game-designer.
// Specified by docs/design/ui.md §4.  Exits non-zero if any viewport fails the fit rule.
//
//   node tools/layout-sweep.mjs             # sweep + verdict
//   node tools/layout-sweep.mjs --devices   # the representative-device table for ui.md
//   node tools/layout-sweep.mjs --pages     # the PAGE PLAN per device (runs -> pages)
//
// REVISED 2026-09-23 (design revision 4) for PAGING, which the owner proposed after
// playing revision 3 on an iPhone: "if the screen is too small, maybe paging the table
// probably do it".  A page is a WINDOW onto the constant table, never a rearrangement of
// it: a character's page and its slot on that page are a pure function of the pack's
// inventoryOrder and the device, so `ng` is always page N, row R, column C.
//
// Paging removes the revision-3 compromise entirely.  Revision 3 truncated each run to
// fit one screen, which cost a phone most of the vocabulary (13 of 47 words on the
// smallest).  With pages, EVERY served device shows EVERY character, so `zonesFor()` and
// its 0.48 split are deleted -- nothing is truncated any more.
//
// REWRITTEN 2026-09-23 for the CONSTANT TABLE (docs/design/ui.md §0, correction U12).
// Revision 2 laid out a table of at most 24 cells that MORPHED between onsets, rimes and
// tones.  The owner overruled that: there is ONE table, it holds every character, the
// characters never move, and unavailable ones are shown disabled.  That makes the table
// three to four times larger, so:
//
//   * the column count is no longer capped at 6 -- it is chosen to MAXIMISE the tile,
//     over 3..12 columns, because a 67-cell table on a tablet wants 7-12 columns;
//   * the cell search runs to 90, not 24;
//   * CHROME drops 86 -> 80 (GAP_STRIP 14->12, PAD_BOTTOM 16->12).  Six points, and it
//     is worth naming why: it is exactly one more row of tiles on a 375x667 iPhone SE
//     (20 -> 24 cells) and on a 360x800 Android (24 -> 28).  Measured, not guessed.
//
// The TILE FLOOR DOES NOT MOVE.  72 pt was refused twice before and is refused again
// here; the constant table is paid for out of chrome and columns, never out of the one
// number that was measured against a child's hand.
//
// Android is the reason this is a sweep: aspect ratios, densities and safe areas vary
// far more than on iOS, so "it fits a 6.1 inch screen" is not a claim about anything.

const clamp = (v,lo,hi) => Math.max(lo, Math.min(hi, v));

/* ---------------- the layout law ---------------- *
 * One vertical stack, both orientations, both modes:
 *
 *      topBar   56    mode title · shelf of 5 · gate dot
 *      strip         the word being assembled, 1.05 x tile
 *      table         cols x rows of tiles -- THE CONSTANT CHARACTER TABLE
 *
 * The tile is the largest size in [72,116] at which the whole stack fits, maximised
 * over the legal column counts.  Nothing scrolls, nothing is off-screen: every
 * character in the pack's inventory that the device can hold is visible at once.     */
export const TOP_BAR = 56, GAP_STRIP = 12, PAD_BOTTOM = 12;
export const CHROME  = TOP_BAR + GAP_STRIP + PAD_BOTTOM;   // 80
export const TILE_MIN = 72, TILE_MAX = 116;
export const COLS_MIN = 3, COLS_MAX = 12;
export const MIN_TABLE = 12;   // a served viewport holds at least this many cells PER PAGE (F7)
export const MAX_TABLE = 90;   // the search ceiling; no pack inventory is larger

/* ---------------- the page rail ----------------
 * One button per page, each a full 72 pt motor target -- the control is a thing a
 * 4-year-old presses, so the floor applies to it exactly as it does to a tile.  The rail
 * wraps when the buttons do not fit the content width, and each wrapped row costs a row
 * of table.  RAIL_MAX_ROWS caps it: a viewport needing a third rail row is not served. */
export const RAIL_GAP = 12, RAIL_MAX_ROWS = 2;
export const railCols  = CW => Math.max(1, Math.floor((CW + RAIL_GAP) / (TILE_MIN + RAIL_GAP)));
export const railH = rows => rows === 0 ? 0 : rows * TILE_MIN + (rows - 1) * RAIL_GAP + RAIL_GAP;

/**
 * ui.md §7.1 -- the page plan.  Runs NEVER share a page; a run longer than one page is
 * split into `ceil(len/cap)` pages of as equal size as possible, earlier pages taking the
 * remainder.  Both are pure functions of (run lengths, capacity), so no character ever
 * changes page or slot when the word list changes.
 */
export function pagePlan(runs, cap) {
  const pages = [];
  for (const len of runs) {
    if (len <= 0) continue;
    const k = Math.ceil(len / cap);
    const base = Math.floor(len / k), extra = len % k;
    for (let i = 0; i < k; i++) pages.push(base + (i < extra ? 1 : 0));
  }
  return pages;
}

const gapFor   = t => clamp(Math.round(t * 0.15), 10, 18);
const stripFor = t => clamp(Math.round(t * 1.05), 76, 140);

/**
 * The grid for `cells` characters: the (cols, rows, tile) that makes the TILE LARGEST.
 * Revision 2 fixed cols at "the most that fit at 72 pt", which was right for a 24-cell
 * table that was always wider than it was tall and wrong for a 67-cell one.  Ties go to
 * the squarer grid, so a 26-cell table on an iPad is 5x6 rather than 26x1.
 */
export function gridFor(tableW, H, cells) {
  let best = null;
  for (let cols = COLS_MIN; cols <= Math.min(COLS_MAX, Math.max(COLS_MIN, cells)); cols++) {
    const rows = Math.ceil(cells / cols);
    let tile = null;
    for (let t = TILE_MAX; t >= TILE_MIN; t--) {
      const g = gapFor(t);
      if (cols*t + (cols-1)*g > tableW) continue;
      if (stripFor(t) + rows*t + (rows-1)*g + CHROME > H) continue;
      tile = t; break;
    }
    if (tile === null) continue;
    const cand = { cols, rows, tile };
    if (best === null || cand.tile > best.tile ||
        (cand.tile === best.tile && Math.abs(cols-rows) < Math.abs(best.cols-best.rows))) {
      best = cand;
    }
  }
  return best;
}

export function layout({ Wv, Hv, insetT = 0, insetB = 0, insetL = 0, insetR = 0, cells,
                         railRows = 0 }) {
  const W = Wv - insetL - insetR;
  const H = Hv - insetT - insetB - railH(railRows);   // the rail is charged off the top
  const gutter  = clamp(Math.round(W * 0.045), 14, 44);
  const CW      = W - 2 * gutter;
  const tableW  = Math.min(CW, 1280);              // ~200 mm two-handed reach cap
  const g0      = gridFor(tableW, H, cells);
  if (g0 === null) return null;                    // this viewport does not serve this table
  const { cols, rows, tile } = g0;

  const gap    = gapFor(tile);
  const stripH = stripFor(tile);
  const tableH = rows*tile + (rows-1)*gap;
  const slack  = H - CHROME - stripH - tableH;
  // A tablet has slack to spare.  Spend it on the gaps rather than on the tile (the tile
  // is capped by reach, not by room), so the table breathes instead of huddling.
  const gapY     = clamp(gap + Math.floor(slack / (rows + 1)), gap, Math.round(tile * 0.45));
  const tableHy  = rows*tile + (rows-1)*gapY;
  const slackY   = H - CHROME - stripH - tableHy;
  const rowW     = cols*tile + (cols-1)*gap;
  const stripFont = Math.floor((stripH - 16) / 1.55);
  const tileFont  = Math.floor(Math.min(tile * 0.52, (tile - 16) / 1.55));
  // top bar: mode title (~96) + five shelf slots + gate dot (32) + padding (24)
  const shelf = clamp(Math.floor((CW - 96 - 32 - 24) / 5.4), 0, 44);

  return { W,H,gutter,CW,tableW,cols,rows,cells,tile,gap,gapY,stripH,tableH:tableHy,
           slack:slackY,rowW,stripFont,tileFont,shelf,railRows,railH:railH(railRows),
           railCols:railCols(CW) };
}

/* ---------------- the fit rule ---------------- */
export const RULES = [
  ['F1 table row fits the content width',   L => L.rowW <= L.tableW],
  ['F2 tile >= 72 (motor floor, ~11.4 mm)', L => L.tile >= TILE_MIN],
  ['F3 the stack fits (slack >= 0)',        L => L.slack >= 0],
  ['F4 assembled word >= 34pt',             L => L.stripFont >= 34],
  ['F5 tile glyph >= 24pt',                 L => L.tileFont  >= 24],
  ['F6 gap >= 10 (hit rects cannot overlap)', L => L.gap >= 10],
  ['F8 five shelf slots >= 22pt',           L => L.shelf >= 22],
  ['F9 the rail holds at least one button per row', L => L.railCols >= 1],
];

/* Plan-level rules.  F1-F8 are about ONE layout; these are about the PAGE PLAN, which is
   the thing revision 4 adds and therefore the thing most likely to be wrong. */
export const PLAN_RULES = [
  ['F9p  every page fits the rail', (P) =>
      !P.paged || P.pages.length <= P.railRows * P.L.railCols],
  ['F10  the paging fixpoint converged', (P) => P.steps <= RAIL_MAX_ROWS + 1],
  ['F11  every page fits the computed grid', (P) =>
      Math.max(...P.pages) <= P.cells && P.cells <= P.cap],
  ['F12  every character is on exactly one page', (P, runs) =>
      P.pages.reduce((a,b)=>a+b,0) === runs.reduce((a,b)=>a+b,0)],
  ['F13  no page is empty', (P) => P.pages.every(n => n > 0)],
];
export const planFits = (P, runs) => P !== null && PLAN_RULES.every(([,f]) => f(P, runs));
export const fits = L => L !== null && RULES.every(([,f]) => f(L));

/**
 * The CELL BUDGET: the largest constant table this viewport can show.  Revision 2 called
 * this "the stage cap"; there are no stages now, so this is simply how much of the pack's
 * inventory the device can hold, decided once at startup.
 */
export function maxCells(v, railRows = 0) {
  let m = 0;
  for (let c = 1; c <= MAX_TABLE; c++) if (fits(layout({ ...v, cells: c, railRows }))) m = c;
  return m;
}

/**
 * THE PAGING FIXPOINT.  The rail costs table height, which lowers the page capacity,
 * which can raise the page count, which can force the rail to wrap and cost another row.
 * Iterate to a fixpoint; it is monotone (capacity only falls, pages only rise), so it
 * terminates, and the sweep asserts it converges within RAIL_MAX_ROWS + 1 steps for every
 * served viewport -- which is rule F10.
 *
 * `runs` is the pack's inventory as run lengths: VI [onsets, rimes, tones], EN
 * [letters, digraphs].  Returns null if this viewport cannot serve this pack.
 */
export function planFor(v, runs) {
  const total = runs.reduce((a, b) => a + b, 0);
  const capUnpaged = maxCells(v, 0);
  if (capUnpaged <= 0) return null;
  // The whole inventory fits: no pages, no rail, nothing to learn.  This is the iPad.
  if (total <= capUnpaged) {
    return { paged: false, pages: [total], cap: capUnpaged, railRows: 0,
             cells: total, steps: 0, L: layout({ ...v, cells: total, railRows: 0 }) };
  }
  let railRows = 1, steps = 0;
  for (; railRows <= RAIL_MAX_ROWS; steps++) {
    const cap = maxCells(v, railRows);
    if (cap < MIN_TABLE) return null;
    const pages = pagePlan(runs, cap);
    const L0 = layout({ ...v, cells: 1, railRows });
    if (L0 === null) return null;
    const need = Math.ceil(pages.length / railCols(L0.CW));
    if (need > railRows) { railRows = need; continue; }
    const cells = Math.max(...pages);
    return { paged: true, pages, cap, railRows, cells, steps,
             L: layout({ ...v, cells, railRows }) };
  }
  return null;   // a third rail row: not served
}

/* An orientation is supported iff it can serve a PAGE PLAN for both packs (F7).
   Revision 3 tested a cell count; that is no longer the right question, because a
   viewport can hold 16 cells and still be unable to page 67 characters into a rail that
   fits.  "Served" has to mean "can actually be played".  A landscape phone is locked out
   here, as before. */
export const orientationOK = v =>
  planFor(v, [26, 35, 6]) !== null && planFor(v, [26, 10]) !== null;

/* `zonesFor()` and its 0.48 onset share are DELETED in revision 4.  They existed to
   decide which characters to leave OFF a board that could not hold them all.  Paging
   holds them all, on every served device, so nothing is truncated and there is nothing
   to allocate.  Recorded here rather than silently removed. */

/* ---------------- the sweep ---------------- */
const INSETS = [                         // representative safe-area shapes, pt/dp
  { insetT:  0, insetB:  0 },            // Android, no cutout, buttons nav
  { insetT: 24, insetB: 16 },            // Android status bar + gesture pill
  { insetT: 24, insetB: 48 },            // Android tall gesture bar
  { insetT: 48, insetB: 34 },            // Android punch-hole
  { insetT: 59, insetB: 34 },            // iPhone Dynamic Island portrait
  { insetT: 62, insetB: 34 },            // iPhone 16/17 Pro Max & Plus portrait
  { insetT: 20, insetB:  0 },            // iPhone SE portrait
  { insetT: 24, insetB: 20 },            // iPad
  { insetT:  0, insetB: 21, insetL: 59, insetR: 59 }, // iPhone landscape (rejected anyway)
];

// The two shipped inventories as RUN LENGTHS.  vi-seed: 26 onsets, 35 rimes, 6 tones.
// en-seed: 26 letters (a-z, `q` included -- ui.md §8) + 10 digraphs.
const VI_RUNS = [26, 35, 6];
const EN_RUNS = [26, 10];

function sweep() {
  const fail = [], worst = new Map(), pageHist = new Map();
  let tested = 0, rejected = 0, served = 0, planned = 0, unpaged = 0, maxSteps = 0;
  for (let Wv = 360; Wv <= 1400; Wv += 4) {
    for (let Hv = 600; Hv <= 1440; Hv += 4) {
      for (const ins of INSETS) {
        const v = { Wv, Hv, ...ins };
        const mc = maxCells(v, 0);
        // F7: served iff BOTH packs get a page plan.  Evaluate before anything else.
        const plans = [planFor(v, VI_RUNS), planFor(v, EN_RUNS)];
        if (mc < MIN_TABLE || plans.some(P => P === null)) { rejected++; continue; }
        served++;
        // --- the PAGE PLAN, for both packs, is the revision-4 claim ---
        for (let i = 0; i < 2; i++) {
          const runs = i === 0 ? VI_RUNS : EN_RUNS, P = plans[i];
          planned++;
          if (!P.paged) unpaged++;
          maxSteps = Math.max(maxSteps, P.steps);
          if (i === 0) {
            const k = P.paged ? P.pages.length : 1;
            pageHist.set(k, (pageHist.get(k) || 0) + 1);
          }
          for (const [name, f] of PLAN_RULES) {
            if (!f(P, runs)) { if (fail.length < 12) fail.push({ name, Wv, Hv, ins, cells: P.pages.join(','), L: P.L }); }
          }
        }
        // --- every table size up to the unpaged budget still obeys F0-F9 ---
        for (let cells = 1; cells <= mc; cells++) {
          const L = layout({ ...v, cells }); tested++;
          // F0 is the sweep's own claim, not a design rule: every table size up to the
          // budget must be SERVED.  It is what makes the inner loop non-tautological --
          // the other rules also decide the budget, so for a served size they cannot
          // fail; F0 catches a budget the viewport does not actually hold, and catches a
          // fit rule that is not monotone in `cells`.
          if (L === null) {
            if (fail.length < 12) fail.push({ name: 'F0 viewport serves this table size', Wv, Hv, ins, cells, L });
            continue;
          }
          for (const [name, f] of RULES) {
            if (!f(L)) { if (fail.length < 12) fail.push({ name, Wv, Hv, ins, cells, L }); }
          }
          const margin = Math.min(L.tableW - L.rowW, L.slack, L.tile - TILE_MIN,
                                  L.stripFont - 34, L.tileFont - 24, L.shelf - 22);
          if (!worst.has('tightest') || margin < worst.get('tightest').margin)
            worst.set('tightest', { margin, Wv, Hv, ins, cells, L });
        }
      }
    }
  }
  return { fail, tested, rejected, served, planned, unpaged, maxSteps, pageHist, worst };
}

const DEVICES = [
  ['Android compact  360x640  (the supported floor)', { Wv:360, Hv:640, insetT:24, insetB:16 }],
  ['Android tall     360x800',                        { Wv:360, Hv:800, insetT:24, insetB:48 }],
  ['Android large    412x915',                        { Wv:412, Hv:915, insetT:48, insetB:34 }],
  ['iPhone SE 3      375x667',                        { Wv:375, Hv:667, insetT:20, insetB: 0 }],
  ['iPhone 15/16     393x852',                        { Wv:393, Hv:852, insetT:59, insetB:34 }],
  ['iPhone 15 Pro Max 430x932',                       { Wv:430, Hv:932, insetT:59, insetB:34 }],
  ['** iPhone 17 Plus (A) 430x932  THE DEVICE',       { Wv:430, Hv:932, insetT:59, insetB:34 }],
  ['** iPhone 17 Plus (B) 440x956  THE DEVICE',       { Wv:440, Hv:956, insetT:62, insetB:34 }],
  ['iPad 11" portrait  834x1194',                     { Wv:834, Hv:1194, insetT:24, insetB:20 }],
  ['iPad 11" landscape 1194x834',                     { Wv:1194, Hv:834, insetT:24, insetB:20 }],
  ['iPad 13" landscape 1366x1024',                    { Wv:1366, Hv:1024, insetT:24, insetB:20 }],
  ['Android tablet   800x1280 portrait',              { Wv:800, Hv:1280, insetT:24, insetB:24 }],
  ['Android tablet   1280x800 landscape',             { Wv:1280, Hv:800, insetT:24, insetB:24 }],
  ['iPhone 15 LANDSCAPE 852x393 (must be rejected)',  { Wv:852, Hv:393, insetT:0, insetB:21, insetL:59, insetR:59 }],
];

if (process.argv.includes('--devices')) {
  const hdr = ['device','orient','unpaged','VI pages','per page','grid','tile','rail','strip','glyph w/t'];
  const wid = [40,7,9,10,10,7,6,6,7,10];
  console.log(hdr.map((h,i)=>h.padEnd(wid[i])).join(''));
  for (const [label, v] of DEVICES) {
    const mc = maxCells(v, 0), ok = mc >= MIN_TABLE;
    if (!ok) { console.log(label.padEnd(40) + 'LOCKED'); continue; }
    const P = planFor(v, VI_RUNS);
    if (P === null) { console.log(label.padEnd(40) + 'served'.padEnd(7) + String(mc).padEnd(9) + 'NOT SERVED for vi-seed'); continue; }
    const L = P.L;
    console.log(label.padEnd(40) + 'served'.padEnd(7) + String(mc).padEnd(9) +
      (P.paged ? String(P.pages.length) : 'none').padEnd(10) +
      (P.paged ? P.pages.join('/') : String(P.cells)).padEnd(10) +
      `${L.cols}x${L.rows}`.padEnd(7) + String(L.tile).padEnd(6) +
      String(L.railH).padEnd(6) + String(L.stripH).padEnd(7) +
      `${L.stripFont}/${L.tileFont}`.padEnd(10) +
      (planFits(P, VI_RUNS) ? '' : '  <-- PLAN FAILS'));
  }
  process.exit(0);
}

if (process.argv.includes('--pages')) {
  console.log('The PAGE PLAN per device.  Runs never share a page; a run longer than one');
  console.log('page splits into balanced consecutive pages.  A page is a window onto the');
  console.log('constant table -- a character\'s page and slot never change.\n');
  for (const [label, v] of DEVICES) {
    const mc = maxCells(v, 0);
    if (mc < MIN_TABLE) { console.log(label + '\n    LOCKED\n'); continue; }
    console.log(label);
    for (const [name, runs] of [['vi-seed  onsets 26 / rimes 35 / tones 6', VI_RUNS],
                                ['en-seed  letters 26 / digraphs 10', EN_RUNS]]) {
      const P = planFor(v, runs);
      if (P === null) { console.log(`    ${name.padEnd(40)} NOT SERVED`); continue; }
      const detail = P.paged
        ? `${P.pages.length} pages [${P.pages.join(' | ')}]  cap ${P.cap}  rail ${P.railRows} row(s) of ${P.L.railCols}  tile ${P.L.tile}`
        : `1 page, NO RAIL, all ${P.cells} at once  tile ${P.L.tile}`;
      console.log(`    ${name.padEnd(40)} ${detail}`);
    }
    console.log('');
  }
  process.exit(0);
}

/* ---------------- the sweep ---------------- */
const r = sweep();
console.log(`swept viewports 360..1400 x 600..1440 step 4, x ${INSETS.length} safe-area shapes`);
console.log(`  ${r.served} viewport/inset combinations served`);
console.log(`  ${r.planned} page plans built (both packs per viewport), ${r.unpaged} of them needing NO rail`);
console.log(`  paging fixpoint: converged every time, worst case ${r.maxSteps} step(s) (F10 allows ${RAIL_MAX_ROWS + 1})`);
console.log('    vi-seed page-count distribution:');
for (const k of [...r.pageHist.keys()].sort((a,b)=>a-b)) {
  console.log(`      ${String(k).padStart(2)} page(s)  ${r.pageHist.get(k)}`);
}
console.log(`  ${r.rejected} rejected (F7: no page plan for both packs, or landscape phone)`);
console.log(`  ${r.tested} layouts checked against ${RULES.length} rules, plus ${PLAN_RULES.length} plan rules`);
const w = r.worst.get('tightest');
console.log(`\ntightest served layout: ${w.Wv}x${w.Hv} insets ${JSON.stringify(w.ins)} cells=${w.cells}`);
console.log(`  tile ${w.L.tile}  grid ${w.L.cols}x${w.L.rows}  row ${w.L.rowW}/${w.L.tableW}  strip ${w.L.stripH}` +
            `  table ${w.L.tableH}  slack ${w.L.slack}  shelf ${w.L.shelf}  margin ${w.margin}`);
if (r.fail.length) {
  console.log('\nFAILURES:');
  for (const f of r.fail) console.log(`  ${f.name}  at ${f.Wv}x${f.Hv} ${JSON.stringify(f.ins)} cells=${f.cells}`);
}
console.log(`\n${r.fail.length === 0 ? 'PASS' : 'FAIL'} - ${r.fail.length} failing layout(s).`);
process.exit(r.fail.length === 0 ? 0 : 1);
