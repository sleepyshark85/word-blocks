// The layout law (`ui.md` §4.2) and the fit rule (§4.3).
//
// This is a transcription of `tools/layout-sweep.mjs`, which is the Tier-4 artefact and
// the authority. It is transcribed rather than imported because `tools/` is a build-time
// directory that the app must not pull into its bundle, and
// `test/layout-parity.test.mjs` sweeps both implementations over the full viewport range
// and fails on the first disagreement. A copy that is proven identical is honest; a copy
// that is merely believed identical is the bug this comment exists to prevent.
//
// Pure: no React, no `Dimensions`, no platform. That is what lets the parity test run in
// Node (`development-process.md` §5, "anything checkable off-device imports nothing that
// only runs on-device").

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Below this the app shows a parent-facing card and mounts no board (AC A8, §4.1). */
export const MIN_VIEWPORT = { width: 360, height: 600 };

/** How a row of n tiles breaks into lines. Never more than two. */
const PER_LINE = [1, 2, 3, 2, 3, 3, 4, 4];

export function layout({ Wv, Hv, insetT = 0, insetB = 0, insetL = 0, insetR = 0, n }) {
  const W = Wv - insetL - insetR;
  const H = Hv - insetT - insetB;
  const gutter = clamp(Math.round(W * 0.045), 14, 44);
  const CW = W - 2 * gutter;
  const palBand = Math.min(CW, 1280);                  // ~200 mm two-handed reach cap
  const perLine = PER_LINE[n - 1];
  const lines = Math.ceil(n / perLine);
  const tileByW = Math.floor(palBand / (perLine + 0.15 * (perLine - 1)));
  const capH = 0.34 * H - 24;                          // the band may not eat the picture
  const tileByH = lines === 1 ? Math.floor(capH) : Math.floor(capH / 2.15);
  let tile = clamp(Math.min(tileByW, tileByH), 72, 116);
  let gap = clamp(Math.round(tile * 0.15), 10, 18);
  while (perLine * tile + (perLine - 1) * gap > palBand && tile > 72) {
    tile -= 1;
    gap = clamp(Math.round(tile * 0.15), 10, 18);
  }
  const rowW = perLine * tile + (perLine - 1) * gap;
  const bandH = lines * tile + (lines - 1) * gap + 24;
  const plateH = Math.round(tile * 1.26);              // holds a 1.55 em Vietnamese glyph box
  const overlap = Math.round(plateH * 0.42);           // the plate sits over the frame's lip
  const frameW = Math.min(CW, 860);
  const stripeH = 36;
  const gapFrameBand = 14;
  const padBottom = 16;
  const stackFixed = stripeH + bandH + (plateH - overlap) + gapFrameBand + padBottom;
  const frameH = clamp(H - stackFixed, 200, 620);
  const slack = H - stackFixed - frameH;
  const plateFont = Math.floor((plateH - 16) / 1.55);
  const tileFont = Math.floor(Math.min(tile * 0.52, (tile - 16) / 1.55));
  return {
    W, H, gutter, CW, palBand, perLine, lines, tile, gap, rowW, bandH, plateH, overlap,
    frameW, frameH, slack, stackFixed, plateFont, tileFont, topBar: stripeH,
    gapFrameBand, padBottom,
  };
}

export const RULES = [
  ['F1 row fits the content width', (L) => L.rowW <= L.CW],
  ['F2 tile >= 72 (motor floor, ~11.5 mm)', (L) => L.tile >= 72],
  ['F3 picture >= 200 and >= 28% of H', (L) => L.frameH >= 200 && L.frameH >= 0.28 * L.H],
  ['F4 the stack fits (slack >= 0)', (L) => L.slack >= 0],
  ['F5 picture visible above the plate >= 150', (L) => L.frameH - L.overlap >= 150],
  ['F6 plate glyph >= 30pt', (L) => L.plateFont >= 30],
  ['F7 tile glyph >= 24pt', (L) => L.tileFont >= 24],
];

export const fits = (L) => RULES.every(([, f]) => f(L));

/**
 * `gameplay.md` §1.1 — an orientation is supported iff the fit rule passes for **every**
 * palette size the progression can produce, evaluated once at startup from the screen
 * metrics, never per frame. In practice phones lock to portrait and tablets rotate.
 */
export const orientationOK = (v) => [1, 2, 3, 4, 5, 6, 7, 8]
  .every((n) => fits(layout({ ...v, n })));

/**
 * `ui.md` §6.3 — the glyph box, applied in both languages so a mode switch can never
 * clip. A box tuned to one font's outlines is a box that clips when the font is replaced,
 * and the font *was* replaced (Fredoka → Baloo 2) after these metrics were written.
 */
export const GLYPH_BOX = 1.55;

/** Below this the caption strip is not drawn at all — see `boardLayout`. */
export const CAPTION_MIN_FONT = 15;

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
  // Baloo 2's lowercase advance is close to 0.56 em; a run of `glyphLen` characters is
  // about that times the size. Shrink only as far as 82% of the tile demands.
  const budget = tile * 0.82;
  const wanted = Math.floor(budget / (glyphLen * 0.56));
  return Math.max(24, Math.min(tileFont, wanted));
}

/**
 * The board's stack, including the caption strip.
 *
 * **Deviation from `ui.md` §4.2, reported rather than absorbed.** §7 and §8 both draw a
 * caption strip between the word plate and the palette band, and §2.1 sizes it at
 * `0.42 × tile` on a 1.55 em line — up to 76 pt. `stackFixed` does not include it. Run
 * the sweep with the term added naively and eight layouts fail — all of them
 * **360 × 600 with 24/16 insets**, where `slack` goes to −7 and F5 loses 11 pt.
 *
 * So the law is extended here in the one way that keeps every rule true: the caption
 * comes out of the **picture**, which §4.2 already names as the flex element, and on the
 * single viewport where that is not enough the caption gives back the few points rather
 * than the board overflowing. The caption is the right thing to shrink: `acceptance-
 * criteria.md` M4 says the round must be completable with the strip covered, so no
 * information is ever lost with it.
 *
 * Recommendation to the game-designer: add `capH = round(round(tile*0.42) * 1.55)` to
 * `stackFixed` in §4.2 and re-run `tools/layout-sweep.mjs`.
 */
export function boardLayout(v) {
  const L = layout(v);
  const wanted = Math.round(Math.round(L.tile * 0.42) * GLYPH_BOX);
  // The floor the picture may not go below: F3's two clauses and F5's, together.
  const frameFloor = Math.max(200, Math.ceil(0.28 * L.H), L.overlap + 150);
  const room = clamp(L.H - L.stackFixed - frameFloor, 0, wanted);
  // Below a legible size the strip is not drawn at all rather than drawn at 3 pt. That
  // is safe by construction: `acceptance-criteria.md` M4 requires every round to be
  // completable with the caption covered, and `Show the word` off is already a supported
  // state. It only happens on viewports under ~520 pt of usable height.
  const captionFont = Math.floor(room / GLYPH_BOX) >= CAPTION_MIN_FONT
    ? Math.floor(room / GLYPH_BOX)
    : 0;
  const capH = captionFont > 0 ? room : 0;
  const frameH = clamp(L.H - L.stackFixed - capH, 200, 620);
  return {
    ...L,
    capH,
    captionFont,
    frameH,
    stackFixed: L.stackFixed + capH,
    slack: L.H - L.stackFixed - capH - frameH,
  };
}
