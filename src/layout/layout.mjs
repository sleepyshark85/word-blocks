// The layout law (`ui.md` §4.2) and the fit rule (§4.3), revision 2.
//
// This is a transcription of `tools/layout-sweep.mjs`, which is the Tier-4 artefact and
// the authority. It is transcribed rather than imported because `tools/` is a build-time
// directory that the app must not pull into its bundle, and
// `test/layout-parity.test.mjs` sweeps both implementations over the full viewport range
// and fails on the first disagreement. A copy that is proven identical is honest; a copy
// that is merely believed identical is the bug this comment exists to prevent.
//
// **Revision 2.** The old law laid out a picture frame, a word plate and a palette band.
// There is no picture on the board any more (`gameplay.md` §0.5), so the stack is three
// things and nothing else:
//
//      topBar 56    mode title · the shelf of five · the gate dot
//      strip        the word he is assembling
//      table        cols x rows of characters -- THE CHARACTER TABLE
//
// There is **no caption-strip term**, because there is no caption strip
// (`acceptance-criteria.md` P16, `ui.md` correction U4). The Slice-3 deviation that used
// to live in `boardLayout` is closed by deletion rather than by arithmetic.
//
// Pure: no React, no `Dimensions`, no platform. That is what lets the parity test run in
// Node (`development-process.md` §5, "anything checkable off-device imports nothing that
// only runs on-device").

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Below this the app shows a parent-facing card and mounts no board (AC A8, §4.1). */
export const MIN_VIEWPORT = { width: 360, height: 600 };

export const TOP_BAR = 56;
export const GAP_STRIP = 14;
export const PAD_BOTTOM = 16;
export const CHROME = TOP_BAR + GAP_STRIP + PAD_BOTTOM; // 86

export const TILE_MIN = 72;
export const TILE_MAX = 116;

/** F7 — a served viewport holds at least the 20-cell table. */
export const MIN_TABLE = 20;

/** `gameplay.md` §6.1 — the table ceiling, and the most a 4-year-old is ever shown. */
export const MAX_TABLE = 24;

const gapFor = (t) => clamp(Math.round(t * 0.15), 10, 18);
const stripFor = (t) => clamp(Math.round(t * 1.05), 76, 140);

/** Columns come from the motor floor and the width, never from a proportion. */
export function columnsFor(tableW) {
  let cols = 3;
  for (const c of [4, 5, 6]) if (c * TILE_MIN + (c - 1) * 10 <= tableW) cols = c;
  return cols;
}

export function layout({ Wv, Hv, insetT = 0, insetB = 0, insetL = 0, insetR = 0, cells }) {
  const W = Wv - insetL - insetR;
  const H = Hv - insetT - insetB;
  const gutter = clamp(Math.round(W * 0.045), 14, 44);
  const CW = W - 2 * gutter;
  const tableW = Math.min(CW, 1280); // ~200 mm two-handed reach cap
  const cols = columnsFor(tableW);
  const rows = Math.ceil(cells / cols);

  // Largest tile at which the whole stack fits. Searched, not solved: `stripH` and `gap`
  // are both clamped functions of `tile`, so the closed form would be wrong at the clamps.
  let tile = null;
  for (let t = TILE_MAX; t >= TILE_MIN; t -= 1) {
    const g = gapFor(t);
    if (cols * t + (cols - 1) * g > tableW) continue;
    if (stripFor(t) + rows * t + (rows - 1) * g + CHROME > H) continue;
    tile = t;
    break;
  }
  if (tile === null) return null; // this viewport does not serve this table size

  const gap = gapFor(tile);
  const stripH = stripFor(tile);
  const tableH = rows * tile + (rows - 1) * gap;
  const slack = H - CHROME - stripH - tableH;
  // A tablet has slack to spare. Spend it on the gaps rather than on the tile (the tile
  // is capped by reach, not by room), so the table breathes instead of huddling.
  const gapY = clamp(gap + Math.floor(slack / (rows + 1)), gap, Math.round(tile * 0.45));
  const tableHy = rows * tile + (rows - 1) * gapY;
  const slackY = H - CHROME - stripH - tableHy;
  const rowW = cols * tile + (cols - 1) * gap;
  const stripFont = Math.floor((stripH - 16) / 1.55);
  const tileFont = Math.floor(Math.min(tile * 0.52, (tile - 16) / 1.55));
  // top bar: mode title (~96) + five shelf slots + gate dot (32) + padding (24)
  const shelf = clamp(Math.floor((CW - 96 - 32 - 24) / 5.4), 0, 44);

  return {
    W,
    H,
    gutter,
    CW,
    tableW,
    cols,
    rows,
    cells,
    tile,
    gap,
    gapY,
    stripH,
    tableH: tableHy,
    slack: slackY,
    rowW,
    stripFont,
    tileFont,
    shelf,
  };
}

/** `ui.md` §4.3 — the fit rule, executable. F7 is `maxCells`, below. */
export const RULES = [
  ['F1 table row fits the content width', (L) => L.rowW <= L.tableW],
  ['F2 tile >= 72 (motor floor, ~11.4 mm)', (L) => L.tile >= TILE_MIN],
  ['F3 the stack fits (slack >= 0)', (L) => L.slack >= 0],
  ['F4 assembled word >= 34pt', (L) => L.stripFont >= 34],
  ['F5 tile glyph >= 24pt', (L) => L.tileFont >= 24],
  ['F6 gap >= 10 (hit rects cannot overlap)', (L) => L.gap >= 10],
  ['F8 five shelf slots >= 22pt', (L) => L.shelf >= 22],
];

export const fits = (L) => L !== null && RULES.every(([, f]) => f(L));

/** The largest table this viewport can show. Stage caps the table; this caps the stage. */
export function maxCells(v) {
  let m = 0;
  for (let c = 1; c <= MAX_TABLE; c += 1) if (fits(layout({ ...v, cells: c }))) m = c;
  return m;
}

/**
 * `ui.md` §4.3 F7 — an orientation is supported iff it serves at least the 20-cell table,
 * which implies every smaller one. A landscape phone fails this and is locked out.
 * Evaluated once at startup from the screen metrics, never per frame.
 */
export const orientationOK = (v) => maxCells(v) >= MIN_TABLE;

/**
 * `ui.md` §6.3 / `acceptance-criteria.md` Q7 — a multi-character tile shrinks to fit 82%
 * of the tile width, never below 24 pt, and **never shrinks vertically**: the box stays
 * 1.55 em of the *unshrunk* size so `ngh` and `ăng` sit on the same baseline as `m`.
 *
 * `glyphLen` is a codepoint count from the engine's `glyphLength`, not `String.length` —
 * a decomposed `ăng` would measure 4 and size the tile wrong.
 */
export function fitGlyph(tile, tileFont, glyphLen) {
  if (glyphLen <= 1) return tileFont;
  // Be Vietnam Pro's lowercase advance is close to 0.56 em; a run of `glyphLen`
  // characters is about that times the size. Shrink only as far as 82% of the tile
  // demands.
  const budget = tile * 0.82;
  const wanted = Math.floor(budget / (glyphLen * 0.56));
  return Math.max(24, Math.min(tileFont, wanted));
}
