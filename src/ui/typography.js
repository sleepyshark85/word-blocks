// The two bundled faces, and the glyph box they sit in.
//
// `ui.md` §6: **Baloo 2** for tiles, the word plate and the album; **Be Vietnam Pro** for
// the caption strip and every parent surface. Both bundled; **the system font is never
// used for Vietnamese text** — on Android the OEM font varies and a dropped tone mark is
// a *correctness* failure here, not a cosmetic one.
//
// `Fredoka` is forbidden and is not in this repository: it covers 35 of the 90 fixture
// characters, and `ã` exists in it while `ả` does not, so `mã` and `mả` would render in
// different typefaces (`ui.md` §6.0). `test/font.test.mjs` is the Q-series gate over
// whatever is actually in `assets/fonts/`.

export const FONT = {
  /** The tile, the word plate, the album. Single-storey `a` and `g` (Q10). */
  tile: 'Baloo2-SemiBold',
  text: 'BeVietnamPro-Regular',
  textMedium: 'BeVietnamPro-Medium',
  textSemiBold: 'BeVietnamPro-SemiBold',
};

export const FONT_ASSETS = {
  [FONT.tile]: require('../../assets/fonts/Baloo2-SemiBold.ttf'),
  [FONT.text]: require('../../assets/fonts/BeVietnamPro-Regular.ttf'),
  [FONT.textMedium]: require('../../assets/fonts/BeVietnamPro-Medium.ttf'),
  [FONT.textSemiBold]: require('../../assets/fonts/BeVietnamPro-SemiBold.ttf'),
};

/**
 * `ui.md` §6.3 — `glyphBox = 1.55 × fontSize`, in both languages, so a mode switch can
 * never clip. Vietnamese stacks marks above *and* below: `ộ` is a circumflex plus a dot
 * below, `ỹ` a tilde plus a descender.
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
