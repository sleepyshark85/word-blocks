// The two kinds of text in this app, and nothing else.
//
// `ui.md` §1: the game and the parent surfaces "share only the colour tokens and nothing
// else". Two components is how that is kept true — a parent screen cannot accidentally
// borrow a tile's face, and a tile cannot accidentally borrow Dynamic Type.

import React, { createContext, useContext, useMemo } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../theme';
import { applyCasing } from '../engine/index.mjs';
import { FONT, GLYPH_BOX_EM, TYPE, textLineHeight } from './typography';

/**
 * **`ui.md` §8.2 / AC D17–D24 — the glyph casing, and the only place it is applied.**
 *
 * The owner answered `open-questions-ui.md` Q7 with `A B C D`: English glyphs are
 * uppercase. It is **one field per pack**, read once at pack load, carried here beside
 * the theme tokens, and applied at exactly one place — `Glyph`, below.
 *
 * §8.2.2 item 3 is explicit: **a `toUpperCase()` in a component is a bug**, in exactly
 * the sense a colour literal in a component is one. It would be right in one language and
 * wrong in the other, and it could not be reversed without a developer. So no component
 * in `src/ui/` calls it; `applyCasing` does, in the engine, where `test/presentation-
 * audit.test.mjs` can see that nothing else does.
 *
 * `AppText` and `CaptionText` deliberately do **not** consume it: parent surfaces and the
 * editor show his mother exactly what she typed (D24).
 */
const CasingContext = createContext('lower');

export function CasingProvider({ casing, children }) {
  const value = useMemo(() => (casing === 'upper' ? 'upper' : 'lower'), [casing]);
  return <CasingContext.Provider value={value}>{children}</CasingContext.Provider>;
}

/** A glyph never takes a touch; its tile does. The style key, not the deprecated prop. */
const GLYPH_INERT = { pointerEvents: 'none' };

/**
 * Parent-facing text. `ui.md` §12: parent surfaces honour Dynamic Type / font scale up to
 * **2.0×**.
 */
export function AppText({ role = 'body', colour, style, numberOfLines, children, ...rest }) {
  const theme = useTheme();
  const spec = TYPE[role] ?? TYPE.body;
  return (
    <Text
      maxFontSizeMultiplier={2}
      // `ui.md` §3.1 — the mode title is the leak detector and must read as one line in
      // a 56 pt bar. On a 393 pt phone `Word Blocks` wrapped to two lines and pushed the
      // shelf out of place; seen in a browser at the iPhone viewport.
      numberOfLines={numberOfLines}
      style={[{
        fontFamily: spec.family,
        fontSize: spec.size,
        lineHeight: spec.line,
        color: colour ?? theme.ink,
      }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

/**
 * The reveal caption: the word's sentence under the photograph, 20 pt Be Vietnam Pro
 * Regular (`ui.md` §6.4). The board has no caption strip at all in revision 2 — its job
 * was to show *her* the target word, and there is no target (`ui.md` §2.1, correction U4).
 * **Child surfaces do not scale** — `ui.md` §12 records that as a deliberate exception,
 * because the tile is a motor constant and a scaled glyph would clip or shrink it.
 */
export function CaptionText({ size = 20, colour, style, children, ...rest }) {
  const theme = useTheme();
  return (
    <Text
      allowFontScaling={false}
      numberOfLines={2}
      style={[{
        fontFamily: FONT.text,
        fontSize: size,
        lineHeight: textLineHeight(size),
        color: colour ?? theme.inkSoft,
        textAlign: 'center',
      }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

/**
 * A tile or word-strip glyph, inside the 1.55 em box of `ui.md` §6.3.
 *
 * **Deviation, recorded rather than smuggled:** §6.3 also specifies the baseline at
 * `1.19 × fontSize` from the box top. React Native exposes no baseline offset on any
 * platform, so the glyph is centred in a `1.55 em` line box instead. Measured against Be
 * Vietnam Pro's own metrics that puts the baseline within about 3% of 1.19 em, and the
 * box is 30% larger than the face's worst ink span (1.189 em, `ui.md` §6.3), so nothing
 * can clip either way — which is the property Q4 actually gates.
 */
export function Glyph({ text, size, colour, style, ...rest }) {
  const theme = useTheme();
  const casing = useContext(CasingContext);
  const box = Math.round(size * GLYPH_BOX_EM);
  // D17 / D18 — the table tile, the strip cell, the merged word at chant beat 3, a rail
  // button and the reveal's word all draw through here, so all five obey the pack's one
  // field and nothing else in the app has to know about it.
  const shown = applyCasing(text, casing);
  return (
    <View style={[GLYPH_INERT, { height: box, justifyContent: 'center' }, style]}>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={{
          fontFamily: FONT.tile,
          fontSize: size,
          lineHeight: box,
          color: colour ?? theme.tileGlyph,
          textAlign: 'center',
          includeFontPadding: false,
        }}
        {...rest}
      >
        {shown}
      </Text>
    </View>
  );
}
