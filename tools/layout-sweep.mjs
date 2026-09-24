#!/usr/bin/env node
// layout-sweep.mjs -- verifies the Ghép Chữ / Word Blocks layout law over a CONTINUOUS
// viewport range rather than a handful of named devices.  Owner: game-designer.
// Specified by docs/design/ui.md §4.  Exits non-zero if any viewport fails the fit rule.
//
//   node tools/layout-sweep.mjs             # sweep + verdict
//   node tools/layout-sweep.mjs --devices   # the representative-device table for ui.md
//   node tools/layout-sweep.mjs --pages     # the PAGE PLAN per device (runs -> pages)
//
// REVISED 2026-09-23 (design revision 5) for the LETTER-BY-LETTER BOARD.  The owner:
// "the characters being displayed feel really random and un-organized and doesn't give my
// son a sense of character order in the table ... display the full standard character
// table", and then "for character combining, he will still going through character by
// character, event for combine ones like ch, tr (Choose C and choose H)".  So the runs
// change -- VI [29 letters, 6 tones], EN [26 letters] -- and, because a word is now up to
// SIX taps rather than three, the WORD STRIP becomes a real layout term for the first
// time.  Revision 4 never sized it horizontally; it held at most three cells and always
// fitted.  STRIP_CELLS, STRIP_GAP, STRIP_PAD, STRIP_CELL_MIN and the rules F4 / F15 / F16
// / F17 are that pricing, and F17 is the one that is not circular: it asks whether the
// PACK's longest word fits the strip the DEVICE laid out.
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
/* ---------------- DESIGN REVISION 6: the top bar carries two doors ----------------
 * The owner ran the app on a real iPhone and could not find the language switch or the
 * editor.  Both lived behind a 1.2 s hold on a 32 pt dot at 30% opacity: hiding the GATE
 * had also hidden the DOOR.  Revision 6 separates them, and the owner then overruled the
 * half of the remedy that was an assumption -- "I think he should be able to change the
 * language himself" -- so the board gains TWO controls, in opposite corners:
 *
 *   LEFT   a 72 pt LANGUAGE CONTROL -- the CHILD'S, no gate, no hold.  It is a child
 *          target, so TILE_MIN applies to it exactly as it does to a page-rail button
 *          (ui.md 4.5: "the floor is about his hand, not about the importance of the
 *          control").  That is what forces TOP_BAR 56 -> 72.
 *   RIGHT  a 65 pt PARENT DOOR -- a WORD in a thin outline, 32 pt tall.  Same lock as the
 *          old dot (1.2 s hold, then the multiplication); the only change is that it is
 *          legible.  A word is the perfect child-proof label: it is the one channel this
 *          app deliberately denies the child.
 *
 * The mode title leaves the left edge -- the 72 pt control needs that room -- and is drawn
 * UNDER the shelf inside the same 72 pt bar (44 pt shelf + 18 pt line = 62 <= 72), which
 * costs NO width at all, because the shelf row is always wider than the title.  F19 is the
 * rule that says so, measured against the shipped font rather than against a budget.
 *
 * MEASURED COST of TOP_BAR 56 -> 72 (CHROME 80 -> 96), from this tool:
 *   iPhone 17 Plus 430x932   VI 3 pages [15|14|6], tile 101 -> 99.  EN 1 page, no rail.
 *   360x640 floor            UNCHANGED: VI 3 pages [15|14|6] tile 73, EN 2 pages.
 *   iPad 834x1194            UNCHANGED: 35 cells, one page, no rail, tile 116.
 *   360x800 Android          EN 1 page -> 2 pages.  That is the whole regression.
 *   served combinations      491,283 -> 491,251.  Thirty-two shapes lost.
 * A 72 pt row of its OWN would have cost 84 pt and taken the iPad's Vietnamese board from
 * one page to two (measured); putting the control in the word-strip row drops the 360 dp
 * strip glyph to 27 pt against F4's 34 pt floor (measured).  Both were rejected.        */
export const TOP_BAR = 72, GAP_STRIP = 12, PAD_BOTTOM = 12;
export const CHROME  = TOP_BAR + GAP_STRIP + PAD_BOTTOM;   // 96

/* ---------------- the two doors, as widths ----------------
 * TITLE_PT and DOOR_LABEL_PT are ADVANCE WIDTHS MEASURED FROM THE SHIPPED FONT FILE
 * (assets/fonts/BeVietnamPro-Medium.ttf at 13 pt, the type scale's `modeTitle` size):
 *
 *   'Word Blocks'  6.265 em -> 81.4 pt   the wider of the two mode titles
 *   'Ghep Chu'     4.837 em -> 62.9 pt
 *   'Cha me'       3.751 em -> 48.8 pt   the wider of the two door labels
 *   'Parent'       3.324 em -> 43.2 pt
 *
 * They are constants here for the same reason VI_MAX_LETTERS is: this tool must not grow a
 * font dependency, and the app-side gate that DOES read the file is test/topbar.test.mjs. */
export const LANG_W = 72;          // the child's language control: one motor-floor square
export const DOOR_PAD = 8;         // horizontal padding inside the parent door's outline
export const DOOR_LABEL_PT = 48.8;
/* DOOR_W IS A LITERAL, AND THAT IS THE POINT.  It was first written as
 * `ceil(DOOR_LABEL_PT + 2*DOOR_PAD)` -- derived from the label -- and the fault injection
 * that lengthened the label to `Nguoi lon` (60.2 pt) then PASSED, exit 0: raising the label
 * raised the reservation, the shelf shrank to pay for it, and F18 never noticed.  A check
 * whose input moves with the thing it checks cannot fail.  The layout RESERVES a fixed
 * 65 pt; F18 asks whether the label fits inside it.                                      */
export const DOOR_W = 65;
export const TITLE_PT = 81.4;
/* BAR_PAD is SLOP, and 24 was not enough of it.  The shelf's `/5.4` divisor models five
 * slots plus four gaps as 5.4 slot-widths -- a gap of 0.1 x slot, true at the 44 pt ceiling
 * and false at 23, where the four real 6 pt gaps cost 24 pt and the model reserves 9.  At
 * 24 the worst F18 air over the whole sweep was 0.2 pt; at 32 it is 6.2 pt.  Costs the
 * shelf slot 3 pt: 44 -> 41 on the owner's phone, 32 -> 29 at the floor.                 */
export const BAR_PAD = 32;
export const BAR_AIR = 12;         // two 6 pt separations between the bar's three children
export const SLOT_GAP = 6;         // between shelf slots (src/ui/TopBar.js)
export const shelfRowW = shelf => 5 * shelf + 4 * SLOT_GAP;
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

/* ---------------- the word strip (design revision 5) ----------------
 * Revision 4's strip held an onset, a rime and a tone -- three cells, never more, and it
 * was never checked against the content width because three cells always fitted.
 * Revision 5 builds a word letter by letter, so the strip holds up to SIX cells:
 * `trường` is t-r-u-o-n-g, and `chuối` is five letters plus, while it is incomplete, one
 * dashed cell for the letter that is still missing.
 *
 * STRIP_CELLS = 6 is a MEASURED ceiling, not a preference.  At seven cells the strip
 * glyph on a 360 dp phone falls to 31 pt against F4's 34 pt floor (measured: tableW 328,
 * cellW 40, font 31).  Six is therefore the longest word the smallest supported phone can
 * show at a legible size, and it is handed to the content-engineer as the cap the editor
 * must enforce -- see F17, which is the rule that checks it against the real pack.
 *
 * A strip cell is NOT a 72 pt motor target.  It cannot be: five 72 pt cells need
 * 5*72 + 4*8 = 392 pt and a 360 dp phone has 328 pt of content width, so per-cell undo is
 * geometrically impossible at the floor.  Undo is the whole strip instead (ui.md §7.2), so
 * STRIP_CELL_MIN is a LEGIBILITY floor: 34 pt of glyph (F4) times the 1.15 width a `ư`
 * with a horn and a tone mark needs is 39.1, rounded up to 40.                          */
export const STRIP_CELLS = 6, STRIP_GAP = 8, STRIP_PAD = 8, STRIP_CELL_MIN = 40;
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
  // THE WORD STRIP.  `stripCellH` is exactly revision 4's term -- stripH - 2*STRIP_PAD is
  // stripH - 16 -- so the height half of the strip is unchanged.  What revision 5 adds is
  // the WIDTH half: six cells and five gaps have to fit the content width, and on a phone
  // that is what binds, not the height.
  const stripCellH = stripH - 2 * STRIP_PAD;
  const stripFitW  = Math.floor((tableW - (STRIP_CELLS - 1) * STRIP_GAP) / STRIP_CELLS);
  const stripCellW = Math.min(Math.round(stripCellH * 0.82), stripFitW, TILE_MAX);
  const stripRowW  = STRIP_CELLS * stripCellW + (STRIP_CELLS - 1) * STRIP_GAP;
  const stripFont  = Math.floor(Math.min(stripCellH / 1.55, stripCellW * 0.82));
  const tileFont  = Math.floor(Math.min(tile * 0.52, (tile - 16) / 1.55));
  // top bar: mode title (~96) + five shelf slots + gate dot (32) + padding (24)
  // top bar, REVISION 6: language control (72) + shelf of five + parent door (65) + slop.
  // Revision 5 reserved 96 for the mode title at the left edge and 32 for the gate dot;
  // the title is now drawn under the shelf and costs no width, and the dot is the door.
  const shelf = clamp(Math.floor((CW - LANG_W - DOOR_W - BAR_PAD) / 5.4), 0, 44);

  return { W,H,gutter,CW,tableW,cols,rows,cells,tile,gap,gapY,stripH,tableH:tableHy,
           slack:slackY,rowW,stripFont,tileFont,shelf,railRows,railH:railH(railRows),
           railCols:railCols(CW),
           stripCellH, stripCellW, stripRowW, stripCells: STRIP_CELLS };
}

/* ---------------- the fit rule ---------------- */
export const RULES = [
  ['F1 table row fits the content width',   L => L.rowW <= L.tableW],
  ['F2 tile >= 72 (motor floor, ~11.4 mm)', L => L.tile >= TILE_MIN],
  ['F3 the stack fits (slack >= 0)',        L => L.slack >= 0],
  // F4 is revision 4's rule with revision 5's formula.  The glyph is now limited by the
  // strip CELL, not by the strip's height, because six cells across a phone is the
  // binding constraint.  Measured: it never bound under the old formula (0 layouts in
  // 17,321,319 where F4 was the only failing rule), and it binds under the new one.
  ['F4 assembled word >= 34pt',             L => L.stripFont >= 34],
  ['F15 the 6-cell word strip fits the content width', L => L.stripRowW <= L.tableW],
  ['F16 strip cell >= 40 (legibility, not motor)',     L => L.stripCellW >= STRIP_CELL_MIN],
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
  // F17 is the only strip rule that is NOT circular.  F4/F15/F16 also DECIDE the cell
  // budget, so for a served table size they cannot fail -- the same tautology F0 exists to
  // break.  F17 asks a question the budget cannot answer: does the PACK's longest word fit
  // the strip the DEVICE laid out?  It fails the moment a pack grows a word longer than
  // STRIP_CELLS letters, which is the real-world failure mode -- his mother adding
  // `nghiêng` (n-g-h-i-ê-n-g, seven letters) in the editor.
  ['F17  the pack\'s longest word fits the strip', (P, runs, maxLetters) =>
      maxLetters <= P.L.stripCells && P.L.stripFont >= 34],
  /* ---- REVISION 6.  THE TOP BAR, WHICH WAS NEVER CHECKED AGAINST THE TEXT IT DRAWS ----
   * That omission is how `Word Blo...` shipped on the owner's phone for three revisions.
   *
   * THESE ARE PLAN RULES AND NOT FIT RULES, AND THAT IS NOT A DETAIL.  A rule in RULES
   * also DECIDES the cell budget, so it can never be observed failing: a viewport it
   * rejects simply becomes unserved and the sweep still prints "0 failing layouts".  That
   * is the F0 tautology, and both of these rules were first written into RULES, where
   * poisoning TITLE_PT to 200 pt silently deleted every 360 dp phone from the sweep and
   * exited 0.  A PLAN rule is asked only of viewports that ARE served, so it can fail.
   *
   * F18 is not tautological in the other direction either: the shelf formula reserves the
   * LITERAL DOOR_W, while F18 spends DOOR_LABEL_PT + 2*DOOR_PAD -- the width the label
   * actually needs in the shipped face.  Translate `Cha me` as `Nguoi lon` (60.2 pt at
   * 13 pt) and F18 fails while every other rule stays green.                             */
  ['F18  the top bar\'s three children fit the content width', (P) =>
      LANG_W + Math.max(shelfRowW(P.L.shelf), TITLE_PT)
             + (DOOR_LABEL_PT + 2 * DOOR_PAD) + BAR_AIR <= P.L.CW],
  /* F19: the mode title is drawn UNDER the shelf, so the shelf row is its box.  This is
   * the rule that replaces the 96 pt budget the title held at the left edge.             */
  ['F19  the mode title fits under the shelf', (P) => TITLE_PT <= shelfRowW(P.L.shelf)],
];
export const planFits = (P, runs, maxLetters = 1) =>
  P !== null && PLAN_RULES.every(([,f]) => f(P, runs, maxLetters));
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

/* MOVED ABOVE `orientationOK` in revision 5, and EXPORTED, because it had been left
   holding revision 4's runs while the sweep below used revision 5's -- the app reads
   `orientationOK` for P7/P8 and would have decided rotation against a 67-cell board that
   no longer exists.  One source for the run lengths, used by both. */
// The two shipped inventories as RUN LENGTHS -- DESIGN REVISION 5.
//   vi-seed: 29 letters (a ă â b c d đ e ê g h i k l m n o ô ơ p q r s t u ư v x y) then
//            6 tones.  The onset and rime runs are gone: nothing on the board is an onset
//            or a rime any more, because `ch` is entered as `c` then `h`.
//   en-seed: 26 letters, a-z.  ONE run: the ten digraph tiles are gone for the same
//            reason (`ship` is s-h-i-p).
// literacy-vi.md §0.13, literacy-en.md §0.3.
export const VI_RUNS = [29, 6];
export const EN_RUNS = [26];

// The longest word in each pack, in LETTERS -- the thing the word strip has to hold.
//   vi-seed: `chuối` / `trăng` / `trứng`, 5 letters (literacy-vi.md §0.11)
//   en-seed: `ship` / `fish` / `duck` / `sock`, 4 letters (literacy-en.md §0.2)
// F17 checks these against the strip the device lays out.  Raise VI_MAX_LETTERS to 7 --
// his mother adding `nghiêng` -- and the sweep exits 1 naming F17.  That is the fault
// injection this rule exists to survive.
const VI_MAX_LETTERS = 5;
const EN_MAX_LETTERS = 4;

/* An orientation is supported iff it can serve a PAGE PLAN for both packs (F7).
   Revision 3 tested a cell count; that is no longer the right question, because a
   viewport can hold 16 cells and still be unable to page 35 characters into a rail that
   fits.  "Served" has to mean "can actually be played".  A landscape phone is locked out
   here, as before. */
export const orientationOK = v =>
  planFor(v, VI_RUNS) !== null && planFor(v, EN_RUNS) !== null;

/* `zonesFor()` and its 0.48 onset share are DELETED in revision 4.  They existed to
   decide which characters to leave OFF a board that could not hold them all.  Paging
   holds them all, on every served device, so nothing is truncated and there is nothing
   to allocate.  Recorded here rather than silently removed. */

/* ---------------- REVISION 6: the constant law, checked before the sweep ----------------
 * F20-F22 are facts about CONSTANTS, not about a viewport, so they are checked once and
 * they stop the run.  They are not in RULES for the reason given above, and not in
 * PLAN_RULES because a constant that is wrong should not be reported 982,000 times.      */
export const LAW = [
  // The language control is a CHILD target and is held to the same floor as a tile and a
  // page-rail button.  It reads TILE_MIN, so lowering either one fails here.
  ['F20 the language control meets the motor floor (LANG_W >= TILE_MIN)', () => LANG_W >= TILE_MIN],
  // ...and the bar is tall enough to DRAW it.  Without this, TOP_BAR could quietly go back
  // to 56 and the control would be a 72 pt hit rect around 56 pt of ink, which ui.md 4.5
  // refuses in as many words: "a child aims at ink, not at hit rects".
  ['F21 the top bar is tall enough to draw it (TOP_BAR >= LANG_W)', () => TOP_BAR >= LANG_W],
  // ...and the door's reserved width really does hold its label.
  ['F22 the parent door holds its label', () => DOOR_LABEL_PT + 2 * DOOR_PAD <= DOOR_W],
];

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
          const maxLetters = i === 0 ? VI_MAX_LETTERS : EN_MAX_LETTERS;
          planned++;
          if (!P.paged) unpaged++;
          maxSteps = Math.max(maxSteps, P.steps);
          if (i === 0) {
            const k = P.paged ? P.pages.length : 1;
            pageHist.set(k, (pageHist.get(k) || 0) + 1);
          }
          for (const [name, f] of PLAN_RULES) {
            if (!f(P, runs, maxLetters)) { if (fail.length < 12) fail.push({ name, Wv, Hv, ins, cells: P.pages.join(','), L: P.L }); }
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
          const air = L.CW - (LANG_W + Math.max(shelfRowW(L.shelf), TITLE_PT)
                              + DOOR_LABEL_PT + 2 * DOOR_PAD);
          if (!worst.has('bar') || air < worst.get('bar').air) {
            worst.set('bar', { air, at: `${Wv}x${Hv} CW=${L.CW} shelf=${L.shelf}` });
          }
          const margin = Math.min(L.tableW - L.rowW, L.slack, L.tile - TILE_MIN,
                                  L.stripFont - 34, L.tileFont - 24, L.shelf - 22,
                                  L.tableW - L.stripRowW, L.stripCellW - STRIP_CELL_MIN);
          if (!worst.has('tightest') || margin < worst.get('tightest').margin)
            worst.set('tightest', { margin, Wv, Hv, ins, cells, L });
        }
      }
    }
  }
  return { fail, tested, rejected, served, planned, unpaged, maxSteps, pageHist, worst,
           worstBar: worst.get('bar') };
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
  const hdr = ['device','orient','unpaged','VI pages','per page','grid','tile','rail','strip','glyph w/t'];  // strip = band height; glyph w/t = strip glyph / tile glyph
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
      (planFits(P, VI_RUNS, VI_MAX_LETTERS) ? '' : '  <-- PLAN FAILS'));
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
    for (const [name, runs] of [['vi-seed  letters 29 / tones 6', VI_RUNS],
                                ['en-seed  letters 26', EN_RUNS]]) {
      const P = planFor(v, runs);
      if (P === null) { console.log(`    ${name.padEnd(40)} NOT SERVED`); continue; }
      const detail = P.paged
        ? `${P.pages.length} pages [${P.pages.join(' | ')}]  cap ${P.cap}  rail ${P.railRows} row(s) of ${P.L.railCols}  tile ${P.L.tile}`
        : `1 page, NO RAIL, all ${P.cells} at once  tile ${P.L.tile}`;
      console.log(`    ${name.padEnd(40)} ${detail}`);
      console.log(`    ${''.padEnd(40)} grid ${P.L.cols}x${P.L.rows}  strip ${STRIP_CELLS} cells of ` +
                  `${P.L.stripCellW}x${P.L.stripCellH} (row ${P.L.stripRowW}/${P.L.tableW}), glyph ${P.L.stripFont}pt`);
    }
    console.log('');
  }
  process.exit(0);
}

/* ---------------- the sweep ---------------- */
const lawFail = LAW.filter(([, f]) => !f());
if (lawFail.length) {
  console.log('THE CONSTANT LAW FAILS -- the sweep was NOT run:');
  for (const [name] of lawFail) console.log(`  ${name}`);
  console.log(`  TOP_BAR ${TOP_BAR}  LANG_W ${LANG_W}  TILE_MIN ${TILE_MIN}  ` +
              `DOOR_W ${DOOR_W}  DOOR_LABEL_PT ${DOOR_LABEL_PT}  DOOR_PAD ${DOOR_PAD}`);
  console.log(`\nFAIL - ${lawFail.length} failing law(s).`);
  process.exit(1);
}
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
console.log(`  ${r.tested} layouts checked against ${RULES.length} rules, plus ${PLAN_RULES.length} plan rules and ${LAW.length} constant laws`);
console.log(`  top bar (revision 6): language ${LANG_W} + shelf + door ${DOOR_W} in a ${TOP_BAR} pt bar` +
            (r.worstBar ? `; worst air ${r.worstBar.air.toFixed(1)} pt (F18 gate ${BAR_AIR}) at ${r.worstBar.at}` : ''));
const w = r.worst.get('tightest');
console.log(`\ntightest served layout: ${w.Wv}x${w.Hv} insets ${JSON.stringify(w.ins)} cells=${w.cells}`);
console.log(`  tile ${w.L.tile}  grid ${w.L.cols}x${w.L.rows}  row ${w.L.rowW}/${w.L.tableW}  strip ${w.L.stripH}` +
            `  table ${w.L.tableH}  slack ${w.L.slack}  shelf ${w.L.shelf}  margin ${w.margin}`);
console.log(`  word strip: ${STRIP_CELLS} cells of ${w.L.stripCellW}x${w.L.stripCellH}pt, ` +
            `row ${w.L.stripRowW}/${w.L.tableW}, glyph ${w.L.stripFont}pt (F4 floor 34, F16 floor ${STRIP_CELL_MIN})`);
if (r.fail.length) {
  console.log('\nFAILURES:');
  for (const f of r.fail) console.log(`  ${f.name}  at ${f.Wv}x${f.Hv} ${JSON.stringify(f.ins)} cells=${f.cells}`);
}
console.log(`\n${r.fail.length === 0 ? 'PASS' : 'FAIL'} - ${r.fail.length} failing layout(s).`);
process.exit(r.fail.length === 0 ? 0 : 1);
