// The two kinds of text in this app, and nothing else.
//
// `ui.md` §1: the game and the parent surfaces "share only the colour tokens and nothing
// else". Two components is how that is kept true — a parent screen cannot accidentally
// borrow a tile's face, and a tile cannot accidentally borrow Dynamic Type.

import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../theme';
import { FONT, GLYPH_BOX_EM, TYPE, textLineHeight } from './typography';

/**
 * Parent-facing text. `ui.md` §12: parent surfaces honour Dynamic Type / font scale up to
 * **2.0×**.
 */
export function AppText({ role = 'body', colour, style, children, ...rest }) {
  const theme = useTheme();
  const spec = TYPE[role] ?? TYPE.body;
  return (
    <Text
      maxFontSizeMultiplier={2}
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
 * The caption strip's line: `0.42 × tile`, `inkSoft`, Be Vietnam Pro (`ui.md` §2.1).
 * **Child surfaces do not scale** — `ui.md` §12 records that as a deliberate exception,
 * because the tile is a motor constant and a scaled glyph would clip or shrink it.
 */
export function CaptionText({ tile, colour, style, children, ...rest }) {
  const theme = useTheme();
  const size = Math.round(tile * 0.42);
  return (
    <Text
      allowFontScaling={false}
      numberOfLines={1}
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
 * A tile or word-plate glyph, inside the 1.55 em box of `ui.md` §6.3.
 *
 * **Deviation, recorded rather than smuggled:** §6.3 also specifies the baseline at
 * `1.19 × fontSize` from the box top. React Native exposes no baseline offset on any
 * platform, so the glyph is centred in a `1.55 em` line box instead. Measured against
 * Baloo 2's own metrics that puts the baseline within about 2% of 1.19 em, and the box is
 * 52% larger than the face's worst ink span (1.017 em, `ui.md` §6.0.1), so nothing can
 * clip either way — which is the property Q4 actually gates.
 */
export function Glyph({ text, size, colour, style, ...rest }) {
  const theme = useTheme();
  const box = Math.round(size * GLYPH_BOX_EM);
  return (
    <View style={[{ height: box, justifyContent: 'center' }, style]} pointerEvents="none">
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
        {text}
      </Text>
    </View>
  );
}
