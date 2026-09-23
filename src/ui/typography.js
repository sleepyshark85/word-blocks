// The bundled faces, and the glyph box they sit in.
//
// `ui.md` §6: **Be Vietnam Pro** for every parent surface and the reveal caption, and —
// since the orchestrator's correction of 2026-09-23 (`decisions.md`, *Tile typeface*) —
// for the **tiles and the word strip** as well. Both faces are bundled; **the system font
// is never used for Vietnamese text.** On Android the OEM font varies and a dropped or
// flattened tone mark is a *correctness* failure here — `mả` and `mã` differ by nothing
// else.
//
// **Why the tile face changed.** The game-designer chose Baloo 2 on "single-storey `a`
// and `g`", called the first and decisive criterion because this is a letter-teaching
// app. The measurement was wrong in both directions: Baloo 2's `a` is double-storey and
// Be Vietnam Pro's is single (`ui.md` §6.0.1, correction U8). The criterion was right when
// it was written, so it selects Be Vietnam Pro. Be Vietnam Pro also measures better on
// every Vietnamese minimal pair — 513 px against 365 at 116 pt for the binding `hổ`/`hô`
// pair, measured here on the shipped files — and it is drawn for Vietnamese. What is
// given up is roundness, which is a real cost in a toddler's app and is recorded as one.
//
// **Baloo 2 stays bundled and the switch back is this one line.** `FONT.tile` is the only
// thing that decides, `assets/fonts/Baloo2-SemiBold.ttf` still ships, and
// `test/font.test.mjs` re-runs the whole Q-series against whatever `FONT.tile` names.
//
// `Fredoka` is forbidden and is not in this repository: it covers 35 of the 86 fixture
// characters, and `ã` exists in it while `ả` does not, so `mã` and `mả` would render in
// different typefaces (`ui.md` §6.0).

export const FONT = {
  /** The tile, the word strip, the album. Single-storey `a` and `g` (Q10). */
  tile: 'BeVietnamPro-SemiBold',
  text: 'BeVietnamPro-Regular',
  textMedium: 'BeVietnamPro-Medium',
  textSemiBold: 'BeVietnamPro-SemiBold',
  /** Bundled, loaded, and not used — the one-line reversal of the decision above. */
  rounded: 'Baloo2-SemiBold',
};

export const FONT_ASSETS = {
  [FONT.tile]: require('../../assets/fonts/BeVietnamPro-SemiBold.ttf'),
  [FONT.text]: require('../../assets/fonts/BeVietnamPro-Regular.ttf'),
  [FONT.textMedium]: require('../../assets/fonts/BeVietnamPro-Medium.ttf'),
  [FONT.rounded]: require('../../assets/fonts/Baloo2-SemiBold.ttf'),
};

/**
 * `ui.md` §6.3 — `glyphBox = 1.55 × fontSize`, in both languages, so a mode switch can
 * never clip. Vietnamese stacks marks above *and* below: `ộ` is a circumflex plus a dot
 * below, `ỹ` a tilde plus a descender. Be Vietnam Pro's worst ink span is 1.189 em, so
 * the box keeps 30% headroom over the face that now ships.
 */
export const GLYPH_BOX_EM = 1.55;

/** `ui.md` §6.4 — parent text, 1.55 em leading with a 1.45 floor. */
export function textLineHeight(size) {
  return Math.max(Math.round(size * 1.45), Math.round(size * GLYPH_BOX_EM));
}

/** `ui.md` §6.4 — the type scale for parent surfaces, one place. */
export const TYPE = {
  modeTitle: { size: 13, line: 18, family: FONT.textMedium },
  screenTitle: { size: 24, line: 32, family: FONT.textSemiBold },
  body: { size: 17, line: 26, family: FONT.text },
  secondary: { size: 15, line: 23, family: FONT.text },
  button: { size: 18, line: 24, family: FONT.textSemiBold },
  gateOperands: { size: 28, line: 42, family: FONT.textMedium },
};
