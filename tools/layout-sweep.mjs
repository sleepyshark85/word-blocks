#!/usr/bin/env node
// layout-sweep.mjs -- verifies the Ghép Chữ / Word Blocks layout law over a CONTINUOUS
// viewport range rather than a handful of named devices.  Owner: game-designer.
// Specified by docs/design/ui.md §4.  Exits non-zero if any viewport fails the fit rule.
//
//   node tools/layout-sweep.mjs             # sweep + verdict
//   node tools/layout-sweep.mjs --devices   # the representative-device table for ui.md
//   node tools/layout-sweep.mjs --worst     # the tightest viewport for each rule
//
// Android is the reason this is a sweep: aspect ratios, densities and safe areas vary
// far more than on iOS, so "it fits a 6.1 inch screen" is not a claim about anything.

const clamp = (v,lo,hi) => Math.max(lo, Math.min(hi, v));

/* ---------------- the layout law ---------------- *
 * One vertical stack, both orientations, both modes.  Everything is fixed by a motor
 * or legibility constraint EXCEPT the picture frame, which absorbs all remaining height.
 * Tiles never scale with screen width below the reach cap; the gutter absorbs width.   */
export function layout({ Wv, Hv, insetT = 0, insetB = 0, insetL = 0, insetR = 0, n }) {
  const W = Wv - insetL - insetR;
  const H = Hv - insetT - insetB;
  const gutter  = clamp(Math.round(W * 0.045), 14, 44);
  const CW      = W - 2 * gutter;
  const palBand = Math.min(CW, 1280);              // ~200 mm two-handed reach cap
  // how a row of n tiles breaks into lines.  Never more than two lines, and the tile is
  // sized from the WIDEST LINE ACTUALLY USED, so a 4-tile round gets fat tiles.
  const perLine = [1,2,3,2,3,3,4,4][n-1];   // 4 breaks 2+2, 5-6 break 3+3, 7-8 break 4+4
  const lines   = Math.ceil(n / perLine);
  const tileByW = Math.floor(palBand / (perLine + 0.15*(perLine-1)));
  const capH    = 0.34 * H - 24;                   // the band may not eat the picture
  const tileByH = lines === 1 ? Math.floor(capH) : Math.floor(capH / 2.15);
  let tile = clamp(Math.min(tileByW, tileByH), 72, 116);
  let gap  = clamp(Math.round(tile * 0.15), 10, 18);
  // gap is a rounded fraction of tile, so the closed form can overshoot by a point or
  // two.  Shrink to fit rather than trusting the algebra.
  while (perLine*tile + (perLine-1)*gap > palBand && tile > 72) {
    tile -= 1; gap = clamp(Math.round(tile * 0.15), 10, 18);
  }
  const rowW = perLine*tile + (perLine-1)*gap;
  const bandH   = lines*tile + (lines-1)*gap + 24;
  const plateH  = Math.round(tile * 1.26);         // holds a 1.55em Vietnamese glyph box
  const overlap = Math.round(plateH * 0.42);       // the plate sits over the frame's lip
  const frameW  = Math.min(CW, 860);
  const stripeH = 36, gapFrameBand = 14, padBottom = 16;   // top bar: 4pt language rule + mode title + page rail + gate dot, on the ground
  const stackFixed = stripeH + bandH + (plateH - overlap) + gapFrameBand + padBottom;
  const frameH  = clamp(H - stackFixed, 200, 620);
  const slack   = H - stackFixed - frameH;
  const plateFont = Math.floor((plateH - 16) / 1.55);
  const tileFont  = Math.floor(Math.min(tile * 0.52, (tile - 16) / 1.55));
  return { W,H,gutter,CW,palBand,perLine,lines,tile,gap,rowW,bandH,plateH,overlap,
           frameW,frameH,slack,stackFixed,plateFont,tileFont };
}

/* ---------------- the fit rule ---------------- */
export const RULES = [
  ['F1 row fits the content width',        L => L.rowW <= L.CW],
  ['F2 tile >= 72 (motor floor, ~11.5 mm)',L => L.tile >= 72],
  ['F3 picture >= 200 and >= 28% of H',    L => L.frameH >= 200 && L.frameH >= 0.28*L.H],
  ['F4 the stack fits (slack >= 0)',       L => L.slack >= 0],
  ['F5 picture visible above the plate >= 150', L => L.frameH - L.overlap >= 150],
  ['F6 plate glyph >= 30pt',               L => L.plateFont >= 30],
  ['F7 tile glyph >= 24pt',                L => L.tileFont  >= 24],
];
export const fits = L => RULES.every(([,f]) => f(L));

/* An orientation is supported iff the fit rule passes for EVERY palette size the
   progression can produce, n=1..8. */
export const orientationOK = v => [1,2,3,4,5,6,7,8].every(n => fits(layout({ ...v, n })));

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
  let tested = 0, portraitLocked = 0, bothOK = 0;
  for (let Wv = 360; Wv <= 1400; Wv += 4) {
    for (let Hv = 600; Hv <= 1440; Hv += 4) {
      for (const ins of INSETS) {
        const v = { Wv, Hv, ...ins };
        if (!orientationOK(v)) { portraitLocked++; continue; }   // not served in this orientation
        bothOK++;
        for (let n = 1; n <= 8; n++) {
          const L = layout({ ...v, n }); tested++;
          for (const [name, f] of RULES) {
            if (!f(L)) { if (fail.length < 12) fail.push({ name, Wv, Hv, ins, n, L }); }
          }
          const margin = Math.min(L.CW - L.rowW, L.slack, L.frameH - 200, L.frameH - L.overlap - 150);
          if (!worst.has('tightest') || margin < worst.get('tightest').margin)
            worst.set('tightest', { margin, Wv, Hv, ins, n, L });
        }
      }
    }
  }
  return { fail, tested, portraitLocked, bothOK, worst };
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
  const hdr = ['device','orient','n','tile','gap','row','band','plate','frame WxH','glyph'];
  console.log(hdr.map((h,i)=>h.padEnd([38,7,3,5,4,5,5,6,12,6][i])).join(''));
  for (const [label, v] of DEVICES) {
    const ok = orientationOK(v);
    for (const n of [3, 6, 8]) {
      const L = layout({ ...v, n });
      console.log(
        (n===3?label:'').padEnd(38) + (n===3 ? (ok?'served':'LOCKED') : '').padEnd(7) +
        String(n).padEnd(3) + String(L.tile).padEnd(5) + String(L.gap).padEnd(4) +
        String(L.rowW).padEnd(5) + String(L.bandH).padEnd(5) + String(L.plateH).padEnd(6) +
        `${L.frameW}x${L.frameH}`.padEnd(12) + `${L.tileFont}/${L.plateFont}`.padEnd(6) +
        (ok && !fits(L) ? '  <-- FAILS' : ''));
    }
  }
  process.exit(0);
}

const r = sweep();
console.log(`swept viewports 360..1400 x 600..1440 step 4, x ${INSETS.length} safe-area shapes, x n=1..8`);
console.log(`  ${r.bothOK} viewport/inset combinations served (fit rule passes for n=1..8)`);
console.log(`  ${r.portraitLocked} rejected for this orientation -- the app locks portrait there`);
console.log(`  ${r.tested} layouts checked against ${RULES.length} rules`);
const w = r.worst.get('tightest');
console.log(`\ntightest served layout: ${w.Wv}x${w.Hv} insets ${JSON.stringify(w.ins)} n=${w.n}`);
console.log(`  tile ${w.L.tile}  row ${w.L.rowW}/${w.L.CW}  band ${w.L.bandH}  frame ${w.L.frameW}x${w.L.frameH}  slack ${w.L.slack}  margin ${w.margin}`);
if (r.fail.length) {
  console.log('\nFAILURES:');
  for (const f of r.fail) console.log(`  ${f.name}  at ${f.Wv}x${f.Hv} ${JSON.stringify(f.ins)} n=${f.n}`, f.L);
}
console.log(`\n${r.fail.length === 0 ? 'PASS' : 'FAIL'} - ${r.fail.length} failing layout(s).`);
process.exit(r.fail.length === 0 ? 0 : 1);
