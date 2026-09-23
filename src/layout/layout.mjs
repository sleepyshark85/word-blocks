// The layout law (`ui.md` §4.2), the fit rule (§4.3) and the page plan (§7.1) —
// **revision 4**.
//
// This is a transcription of `tools/layout-sweep.mjs`, which is the Tier-4 artefact and
// the authority. It is transcribed rather than imported because `tools/` is a build-time
// directory that the app must not pull into its bundle, and
// `test/layout-parity.test.mjs` sweeps both implementations over the full viewport range
// and fails on the first disagreement. A copy that is proven identical is honest; a copy
// that is merely believed identical is the bug this comment exists to prevent.
//
// **Revision 4 — the table pages.** Revision 2 laid out a table of at most 24 cells that
// morphed between onsets, rimes and tones; revision 3 made it constant and *truncated*
// each run to fit one screen. The owner overruled both: there is one table, it holds
// every character in the pack, characters never move, and on a screen too small to show
// the whole sequence at once it is **paged** — a window onto the same sequence, never a
// rearrangement of it (`gameplay.md` §0B.1).
//
// What that adds here: `railCols`/`railH` (the rail is charged off the top of the
// available height), `pagePlan` (runs never share a page; a long run splits into balanced
// consecutive pages) and `planFor` (the fixpoint: the rail costs height → lowers capacity
// → can raise the page count → can force the rail to wrap).
//
// There is **no caption-strip term**, because there is no caption strip
// (`acceptance-criteria.md` P16). There is **no `stage` term**, because there are no
// stages (`gameplay.md` §3.6).
//
// Pure: no React, no `Dimensions`, no platform. That is what lets the parity test run in
// Node (`development-process.md` §5, "anything checkable off-device imports nothing that
// only runs on-device").

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Below this the app shows a parent-facing card and mounts no board (AC A8, §4.1). */
export const MIN_VIEWPORT = { width: 360, height: 600 };

export const TOP_BAR = 56;
export const GAP_STRIP = 12;
export const PAD_BOTTOM = 12;
export const CHROME = TOP_BAR + GAP_STRIP + PAD_BOTTOM; // 80

export const TILE_MIN = 72;
export const TILE_MAX = 116;
export const COLS_MIN = 3;
export const COLS_MAX = 12;

/** F7 — a served viewport holds at least this many cells **per page**. */
export const MIN_TABLE = 12;

/** The search ceiling. No pack inventory is larger (`ui.md` §4.2). */
export const MAX_TABLE = 90;

/**
 * The page rail. One button per page, each a full 72 pt motor target — the control is a
 * thing a 4-year-old presses, so the floor applies to it exactly as it does to a tile
 * (`ui.md` §4.5, AC V20). It wraps when the buttons do not fit the content width, and
 * each wrapped row costs a row of table; a viewport needing a third row is not served.
 */
export const RAIL_GAP = 12;
export const RAIL_MAX_ROWS = 2;
export const railCols = (CW) => Math.max(1, Math.floor((CW + RAIL_GAP) / (TILE_MIN + RAIL_GAP)));
export const railH = (rows) => (rows === 0 ? 0 : rows * TILE_MIN + (rows - 1) * RAIL_GAP + RAIL_GAP);

/**
 * `ui.md` §7.1, AC V4–V6 — the page plan. **Runs never share a page**; a run longer than
 * one page is split into `ceil(len/cap)` pages of as equal size as possible, earlier
 * pages taking the remainder. Both are pure functions of (run lengths, capacity), so no
 * character ever changes page or slot when the word list changes (V7, V8, C22).
 */
export function pagePlan(runs, cap) {
  const pages = [];
  for (const len of runs) {
    if (len <= 0) continue;
    const k = Math.ceil(len / cap);
    const base = Math.floor(len / k);
    const extra = len % k;
    for (let i = 0; i < k; i += 1) pages.push(base + (i < extra ? 1 : 0));
  }
  return pages;
}

const gapFor = (t) => clamp(Math.round(t * 0.15), 10, 18);
const stripFor = (t) => clamp(Math.round(t * 1.05), 76, 140);

/**
 * The grid for `cells` characters: the (cols, rows, tile) that makes the **tile
 * largest**, searched over 3–12 columns. Ties go to the squarer grid, so a 26-cell table
 * on an iPad is 5 × 6 rather than 26 × 1.
 */
export function gridFor(tableW, H, cells) {
  let best = null;
  for (let cols = COLS_MIN; cols <= Math.min(COLS_MAX, Math.max(COLS_MIN, cells)); cols += 1) {
    const rows = Math.ceil(cells / cols);
    let tile = null;
    for (let t = TILE_MAX; t >= TILE_MIN; t -= 1) {
      const g = gapFor(t);
      if (cols * t + (cols - 1) * g > tableW) continue;
      if (stripFor(t) + rows * t + (rows - 1) * g + CHROME > H) continue;
      tile = t;
      break;
    }
    if (tile === null) continue;
    const cand = { cols, rows, tile };
    if (best === null || cand.tile > best.tile
        || (cand.tile === best.tile && Math.abs(cols - rows) < Math.abs(best.cols - best.rows))) {
      best = cand;
    }
  }
  return best;
}

export function layout({
  Wv, Hv, insetT = 0, insetB = 0, insetL = 0, insetR = 0, cells, railRows = 0,
}) {
  const W = Wv - insetL - insetR;
  const H = Hv - insetT - insetB - railH(railRows); // the rail is charged off the top
  const gutter = clamp(Math.round(W * 0.045), 14, 44);
  const CW = W - 2 * gutter;
  const tableW = Math.min(CW, 1280); // ~200 mm two-handed reach cap
  const g0 = gridFor(tableW, H, cells);
  if (g0 === null) return null; // this viewport does not serve this table size
  const { cols, rows, tile } = g0;

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
    railRows,
    railH: railH(railRows),
    railCols: railCols(CW),
  };
}

/** `ui.md` §4.3 — the fit rule, executable. F7 is `planFor`, below. */
export const RULES = [
  ['F1 table row fits the content width', (L) => L.rowW <= L.tableW],
  ['F2 tile >= 72 (motor floor, ~11.4 mm)', (L) => L.tile >= TILE_MIN],
  ['F3 the stack fits (slack >= 0)', (L) => L.slack >= 0],
  ['F4 assembled word >= 34pt', (L) => L.stripFont >= 34],
  ['F5 tile glyph >= 24pt', (L) => L.tileFont >= 24],
  ['F6 gap >= 10 (hit rects cannot overlap)', (L) => L.gap >= 10],
  ['F8 five shelf slots >= 22pt', (L) => L.shelf >= 22],
  ['F9 the rail holds at least one button per row', (L) => L.railCols >= 1],
];

/**
 * Plan-level rules. F1–F9 are about **one layout**; these are about the **page plan**,
 * which is what revision 4 adds and therefore what is most likely to be wrong.
 */
export const PLAN_RULES = [
  ['F9p  every page fits the rail', (P) => !P.paged || P.pages.length <= P.railRows * P.L.railCols],
  ['F10  the paging fixpoint converged', (P) => P.steps <= RAIL_MAX_ROWS + 1],
  ['F11  every page fits the computed grid', (P) => Math.max(...P.pages) <= P.cells && P.cells <= P.cap],
  ['F12  every character is on exactly one page', (P, runs) => P.pages.reduce((a, b) => a + b, 0) === runs.reduce((a, b) => a + b, 0)],
  ['F13  no page is empty', (P) => P.pages.every((n) => n > 0)],
];

export const planFits = (P, runs) => P !== null && PLAN_RULES.every(([, f]) => f(P, runs));
export const fits = (L) => L !== null && RULES.every(([, f]) => f(L));

/**
 * The **cell budget**: the largest single page this viewport can show at that rail
 * height. There are no stages, so this is simply how much of the inventory fits one
 * window, decided once at startup.
 */
export function maxCells(v, railRows = 0) {
  let m = 0;
  for (let c = 1; c <= MAX_TABLE; c += 1) if (fits(layout({ ...v, cells: c, railRows }))) m = c;
  return m;
}

/**
 * **The paging fixpoint** (`ui.md` §4.2, U23). The rail costs table height, which lowers
 * the page capacity, which can raise the page count, which can force the rail to wrap and
 * cost another row. Iterate to a fixpoint; it is monotone (capacity only falls, pages only
 * rise), so it terminates, and the sweep measures convergence at 1 step worst case (F10).
 *
 * `runs` is the pack's inventory as run lengths: VI `[onsets, rimes, tones]`, EN
 * `[letters, digraphs]`. Returns null if this viewport cannot serve this pack.
 */
export function planFor(v, runs) {
  const total = runs.reduce((a, b) => a + b, 0);
  const capUnpaged = maxCells(v, 0);
  if (capUnpaged <= 0) return null;
  // The whole inventory fits: no pages, no rail, nothing to learn. This is the iPad.
  if (total <= capUnpaged) {
    return {
      paged: false,
      pages: [total],
      cap: capUnpaged,
      railRows: 0,
      cells: total,
      steps: 0,
      L: layout({ ...v, cells: total, railRows: 0 }),
    };
  }
  let railRows = 1;
  let steps = 0;
  for (; railRows <= RAIL_MAX_ROWS; steps += 1) {
    const cap = maxCells(v, railRows);
    if (cap < MIN_TABLE) return null;
    const pages = pagePlan(runs, cap);
    const L0 = layout({ ...v, cells: 1, railRows });
    if (L0 === null) return null;
    const need = Math.ceil(pages.length / railCols(L0.CW));
    if (need > railRows) { railRows = need; continue; }
    const cells = Math.max(...pages);
    return {
      paged: true, pages, cap, railRows, cells, steps, L: layout({ ...v, cells, railRows }),
    };
  }
  return null; // a third rail row: not served
}

/**
 * `ui.md` §4.3 F7 — an orientation is supported iff it can build a **page plan for both
 * packs**. Revision 3 tested a cell count; that is no longer the right question, because
 * a viewport can hold 16 cells and still be unable to page 67 characters into a rail that
 * fits. A landscape phone is locked out here, as before (P7, P8).
 */
export const orientationOK = (v) => planFor(v, [26, 35, 6]) !== null && planFor(v, [26, 10]) !== null;

/**
 * `acceptance-criteria.md` **P7 / P8** — which orientations the app actually allows,
 * decided once at startup from the screen metrics, never per frame.
 *
 * **Deviation, reported rather than absorbed.** `gameplay.md` §2.1 says an orientation is
 * supported *iff the fit rule passes*, and observes that in practice "phones lock to
 * portrait (a landscape phone serves a 16-cell table and is rejected — arithmetic, not
 * taste)". **Revision 4 broke that arithmetic**: paging serves a landscape 430 × 932
 * iPhone 17 Plus (5 pages, 18 cells per page, 9 × 2 at 72 pt), so F7 alone no longer
 * locks the biggest phones out, and P7 — "given a phone, the app is locked to portrait" —
 * would fail on the owner's own device.
 *
 * P7 and P8 are the numbered criteria, so they are what this builds to. The extra clause
 * is stated in the design's own terms rather than as a device list (which `ui.md` §4.1
 * forbids): **rotate freely iff the portrait board needs no page rail** — which is
 * exactly `gameplay.md` §3.5's definition of a tablet ("every tablet: one page, no rail")
 * and exactly §2's "tablets rotate freely, phones lock to portrait".
 */
export function orientationPolicy(window, insets) {
  const top = Math.round(insets.top ?? 0);
  const bottom = Math.round(insets.bottom ?? 0);
  const portrait = {
    Wv: Math.round(Math.min(window.width, window.height)),
    Hv: Math.round(Math.max(window.width, window.height)),
    insetT: top,
    insetB: bottom,
    insetL: 0,
    insetR: 0,
  };
  // The landscape counterpart of the same screen: the side insets stand in for the
  // top/bottom ones, which is what a notch actually does when a phone is turned.
  const landscape = {
    Wv: portrait.Hv, Hv: portrait.Wv, insetT: 0, insetB: bottom, insetL: top, insetR: top,
  };
  if (!orientationOK(portrait) || !orientationOK(landscape)) return 'portrait';
  const unpaged = (v) => [[26, 35, 6], [26, 10]].every((runs) => {
    const P = planFor(v, runs);
    return P !== null && !P.paged;
  });
  return unpaged(portrait) ? 'both' : 'portrait';
}

/* `zonesFor()` and its 0.48 onset share are DELETED in revision 4 (U21). They existed to
   decide which characters to leave OFF a board that could not hold them all. Paging holds
   them all, on every served device, so nothing is truncated and there is nothing to
   allocate. Recorded here rather than silently removed. */

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
