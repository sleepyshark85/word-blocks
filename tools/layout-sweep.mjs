#!/usr/bin/env node
// layout-sweep.mjs -- verifies the Ghép Chữ / Word Blocks layout law over a CONTINUOUS
// viewport range rather than a handful of named devices.  Owner: game-designer.
// Specified by docs/design/ui.md §4.  Exits non-zero if any viewport fails the fit rule.
//
//   node tools/layout-sweep.mjs             # sweep + verdict
//   node tools/layout-sweep.mjs --devices   # the representative-device table for ui.md
//   node tools/layout-sweep.mjs --worst     # the tightest viewport for each rule
//
// REWRITTEN 2026-09-23 for the DISCOVERY mechanic (docs/design/gameplay.md §0.1).  The
// old law laid out a per-round PALETTE under a picture frame; the frame was the prompt.
// The picture is now the reward and is not on the board at all, so the layout problem is
// different: a CHARACTER TABLE of up to 24 cells, and above it the word being assembled.
// The caption strip is gone from the board (it lives on the reveal overlay), which is
// also the fix for the Slice-3 defect that the old law never budgeted for it.
//
// Android is the reason this is a sweep: aspect ratios, densities and safe areas vary
// far more than on iOS, so "it fits a 6.1 inch screen" is not a claim about anything.

const clamp = (v,lo,hi) => Math.max(lo, Math.min(hi, v));

/* ---------------- the layout law ---------------- *
 * One vertical stack, both orientations, both modes:
 *
 *      topBar   56    mode title · shelf of 5 · gate dot
 *      strip         the word being assembled, 1.05 x tile
 *      table         cols x rows of tiles -- THE CHARACTER TABLE
 *
 * Columns come from the motor floor and the width; rows from the stage's cell count.
 * The tile is the largest size in [72,116] at which the whole stack fits.  Nothing
 * scrolls, nothing is off-screen, and no live symbol is ever absent from the table.  */
export const TOP_BAR = 56, GAP_STRIP = 14, PAD_BOTTOM = 16;
export const CHROME  = TOP_BAR + GAP_STRIP + PAD_BOTTOM;   // 86
export const TILE_MIN = 72, TILE_MAX = 116;
export const MIN_TABLE = 20;            // every served viewport holds at least this many cells

const gapFor   = t => clamp(Math.round(t * 0.15), 10, 18);
const stripFor = t => clamp(Math.round(t * 1.05), 76, 140);

export function columnsFor(tableW) {
  let cols = 3;
  for (const c of [4,5,6]) if (c*TILE_MIN + (c-1)*10 <= tableW) cols = c;
  return cols;
}

export function layout({ Wv, Hv, insetT = 0, insetB = 0, insetL = 0, insetR = 0, cells }) {
  const W = Wv - insetL - insetR;
  const H = Hv - insetT - insetB;
  const gutter  = clamp(Math.round(W * 0.045), 14, 44);
  const CW      = W - 2 * gutter;
  const tableW  = Math.min(CW, 1280);              // ~200 mm two-handed reach cap
  const cols    = columnsFor(tableW);
  const rows    = Math.ceil(cells / cols);

  // Largest tile at which the whole stack fits.  Searched, not solved: stripH and gap
  // are both clamped functions of tile, so the closed form would be wrong at the clamps.
  let tile = null;
  for (let t = TILE_MAX; t >= TILE_MIN; t--) {
    const g = gapFor(t);
    if (cols*t + (cols-1)*g > tableW) continue;
    if (stripFor(t) + rows*t + (rows-1)*g + CHROME > H) continue;
    tile = t; break;
  }
  if (tile === null) return null;                  // this viewport does not serve this table

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
           slack:slackY,rowW,stripFont,tileFont,shelf };
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
];
export const fits = L => L !== null && RULES.every(([,f]) => f(L));

/** The largest table this viewport can show.  Stage caps the table; this caps the stage. */
export function maxCells(v) {
  let m = 0;
  for (let c = 1; c <= 24; c++) if (fits(layout({ ...v, cells: c }))) m = c;
  return m;
}

/* An orientation is supported iff it serves at least the 20-cell table (F7), which
   implies every smaller one.  A landscape phone fails this and is locked out. */
export const orientationOK = v => maxCells(v) >= MIN_TABLE;

/* ---------------- the sweep ---------------- */
const INSETS = [                         // representative safe-area shapes, pt/dp
  { insetT:  0, insetB:  0 },            // Android, no cutout, buttons nav
  { insetT: 24, insetB: 16 },            // Android status bar + gesture pill
  { insetT: 24, insetB: 48 },            // Android tall gesture bar
  { insetT: 48, insetB: 34 },            // Android punch-hole
  { insetT: 59, insetB: 34 },            // iPhone Dynamic Island portrait
  { insetT: 20, insetB:  0 },            // iPhone SE portrait
  { insetT: 24, insetB: 20 },            // iPad
  { insetT:  0, insetB: 21, insetL: 59, insetR: 59 }, // iPhone landscape (rejected anyway)
];

function sweep() {
  const fail = [], worst = new Map();
  let tested = 0, rejected = 0, served = 0, cap20 = 0, cap24 = 0;
  for (let Wv = 360; Wv <= 1400; Wv += 4) {
    for (let Hv = 600; Hv <= 1440; Hv += 4) {
      for (const ins of INSETS) {
        const v = { Wv, Hv, ...ins };
        const mc = maxCells(v);
        if (mc < MIN_TABLE) { rejected++; continue; }   // not served in this orientation
        served++;
        if (mc >= 24) cap24++; else cap20++;
        for (let cells = 1; cells <= mc; cells++) {
          const L = layout({ ...v, cells }); tested++;
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
  return { fail, tested, rejected, served, cap20, cap24, worst };
}

const DEVICES = [
  ['Android compact  360x640  (the supported floor)', { Wv:360, Hv:640, insetT:24, insetB:16 }],
  ['Android tall     360x800',                        { Wv:360, Hv:800, insetT:24, insetB:48 }],
  ['Android large    412x915',                        { Wv:412, Hv:915, insetT:48, insetB:34 }],
  ['iPhone SE 3      375x667',                        { Wv:375, Hv:667, insetT:20, insetB: 0 }],
  ['iPhone 15/16     393x852',                        { Wv:393, Hv:852, insetT:59, insetB:34 }],
  ['iPhone 15 Pro Max 430x932',                       { Wv:430, Hv:932, insetT:59, insetB:34 }],
  ['iPad 11" portrait  834x1194',                     { Wv:834, Hv:1194, insetT:24, insetB:20 }],
  ['iPad 11" landscape 1194x834',                     { Wv:1194, Hv:834, insetT:24, insetB:20 }],
  ['iPad 13" landscape 1366x1024',                    { Wv:1366, Hv:1024, insetT:24, insetB:20 }],
  ['Android tablet   800x1280 portrait',              { Wv:800, Hv:1280, insetT:24, insetB:24 }],
  ['Android tablet   1280x800 landscape',             { Wv:1280, Hv:800, insetT:24, insetB:24 }],
  ['iPhone 15 LANDSCAPE 852x393 (must be rejected)',  { Wv:852, Hv:393, insetT:0, insetB:21, insetL:59, insetR:59 }],
];

if (process.argv.includes('--devices')) {
  const hdr = ['device','orient','max','cells','grid','tile','gap','row','strip','table','shelf','glyph w/t'];
  const wid = [38,7,4,6,6,5,5,6,6,6,6,10];
  console.log(hdr.map((h,i)=>h.padEnd(wid[i])).join(''));
  for (const [label, v] of DEVICES) {
    const mc = maxCells(v), ok = mc >= MIN_TABLE;
    let first = true;
    for (const cells of [6, 12, mc || 6]) {
      const L = layout({ ...v, cells });
      if (!L) { console.log((first?label:'').padEnd(38) + 'LOCKED'); first = false; continue; }
      console.log(
        (first?label:'').padEnd(38) + (first ? (ok?'served':'LOCKED') : '').padEnd(7) +
        (first ? String(mc) : '').padEnd(4) +
        String(cells).padEnd(6) + `${L.cols}x${L.rows}`.padEnd(6) +
        String(L.tile).padEnd(5) + String(L.gapY).padEnd(5) + String(L.rowW).padEnd(6) +
        String(L.stripH).padEnd(6) + String(L.tableH).padEnd(6) + String(L.shelf).padEnd(6) +
        `${L.stripFont}/${L.tileFont}`.padEnd(10) +
        (ok && !fits(L) ? '  <-- FAILS' : ''));
      first = false;
    }
  }
  process.exit(0);
}

/* ---------------- the sweep ---------------- */
const r = sweep();
console.log(`swept viewports 360..1400 x 600..1440 step 4, x ${INSETS.length} safe-area shapes, x cells=1..maxCells`);
console.log(`  ${r.served} viewport/inset combinations served (fit rule passes for cells=1..${MIN_TABLE}+)`);
console.log(`    of those, ${r.cap24} hold the full 24-cell table and ${r.cap20} top out at 20`);
console.log(`  ${r.rejected} rejected for this orientation -- the app locks portrait there`);
console.log(`  ${r.tested} layouts checked against ${RULES.length} rules`);
const w = r.worst.get('tightest');
console.log(`\ntightest served layout: ${w.Wv}x${w.Hv} insets ${JSON.stringify(w.ins)} cells=${w.cells}`);
console.log(`  tile ${w.L.tile}  grid ${w.L.cols}x${w.L.rows}  row ${w.L.rowW}/${w.L.tableW}  strip ${w.L.stripH}` +
            `  table ${w.L.tableH}  slack ${w.L.slack}  shelf ${w.L.shelf}  margin ${w.margin}`);
if (r.fail.length) {
  console.log('\nFAILURES:');
  for (const f of r.fail) console.log(`  ${f.name}  at ${f.Wv}x${f.Hv} ${JSON.stringify(f.ins)} cells=${f.cells}`, f.L);
}
console.log(`\n${r.fail.length === 0 ? 'PASS' : 'FAIL'} - ${r.fail.length} failing layout(s).`);
process.exit(r.fail.length === 0 ? 0 : 1);
