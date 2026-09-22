// The tile. `ui.md` §5.4 and §9.1.
//
//         ┌───────────────────────┐  ← 2 pt roleEdge outline, radius 0.22*tile
//         │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← 0.18*tile identity bar, the owner's bright hex
//         │───────────────────────│  ← 1.5 pt roleDeep keyline
//         │          m            │  ← tileFace #FFFFFF, tileGlyph ink, 13.4:1
//         │───────────────────────│
//         │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← 0.13*tile base bar
//         └───────────────────────┘
//
// ~31% of the tile is the owner's saturated colour, undarkened, and the letter is on
// white at 13.4:1 — identical in all three themes. That was the point of §5.4: the fix
// for a failing contrast sweep was to move the colour, not to dull it.
//
// **Role is carried by the bar pattern as much as by the hue** (§5.5, S8): solid for an
// onset/consonant, split for a rime/vowel, dotted for a tone. The patterns are drawn, so
// the app survives being rendered in greyscale.
//
// Motion: `transform` and `opacity` only, `useNativeDriver: true` (O1, O3).

import { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useTheme, roleTokens } from '../theme';
import { EASING, SPRING } from '../motion/easing';
import { M } from '../motion/durations.mjs';
import { fitGlyph } from '../layout/layout.mjs';
import { glyphLength } from '../engine/index.mjs';
import { Glyph } from './Text';

/** The identity bar, drawn in the role's pattern (§5.5). */
function Bar({ width, height, colour, pattern }) {
  if (pattern === 'split') {
    const seg = (width - width * 0.12) / 2;
    return (
      <View style={[styles.barRow, { height }]}>
        <View style={{ width: seg, height, backgroundColor: colour }} />
        <View style={{ width: width * 0.12, height }} />
        <View style={{ width: seg, height, backgroundColor: colour }} />
      </View>
    );
  }
  if (pattern === 'dotted') {
    const seg = width * 0.2;
    const gap = (width - seg * 3) / 2;
    return (
      <View style={[styles.barRow, { height }]}>
        <View style={{ width: seg, height, backgroundColor: colour }} />
        <View style={{ width: gap, height }} />
        <View style={{ width: seg, height, backgroundColor: colour }} />
        <View style={{ width: gap, height }} />
        <View style={{ width: seg, height, backgroundColor: colour }} />
      </View>
    );
  }
  return <View style={{ width, height, backgroundColor: colour }} />;
}

/**
 * @param {object}  props
 * @param {string}  props.glyph     what the child reads
 * @param {string}  props.role      role1 | role2 | role3
 * @param {number}  props.size      the tile edge, from the layout law
 * @param {number}  props.radius    0.22 Vietnamese, 0.32 English (`gameplay.md` §2)
 * @param {number}  props.hitSlop   half the gap, so no two hit rects overlap (P11)
 * @param {'rest'|'breathe'|'rim'}  props.hint
 */
export function Tile({
  glyph, role, size, fontSize, radius = 0.22, hitSlop = 6, pressed = false,
  hint = 'rest', reduced = false, onPressIn, onPressOut, disabled = false,
}) {
  const theme = useTheme();
  const tokens = roleTokens(theme, role);
  const press = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(1)).current;

  // M1/M2: press-in over 70 ms on touch-down, spring back on release. Reduced motion
  // keeps the duration and drops the translation (`ui.md` §10.5).
  useEffect(() => {
    if (pressed) {
      Animated.timing(press, {
        toValue: 1, duration: M.pressIn, easing: EASING.exit, useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(press, { toValue: 0, ...SPRING.pop, useNativeDriver: true }).start();
    }
  }, [pressed, press]);

  // M15/G3: 1200 ms on, 1600 ms pause, repeating. Slow on purpose — a fast pulse reads
  // as urgency and this game has none.
  useEffect(() => {
    breathe.stopAnimation();
    if (hint !== 'breathe') {
      breathe.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 0, duration: M.breatheOn / 2, easing: EASING.calm, useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 1, duration: M.breatheOn / 2, easing: EASING.calm, useNativeDriver: true }),
      Animated.delay(M.breatheOff),
    ]));
    loop.start();
    return () => loop.stop();
  }, [hint, breathe]);

  const capH = Math.round(size * 0.18);
  const baseH = Math.round(size * 0.13);
  const keyline = 1.5;
  const glyphSize = fontSize ?? Math.floor(Math.min(size * 0.52, (size - 16) / 1.55));
  const fitted = useMemo(
    () => fitGlyph(size, glyphSize, glyphLength(glyph ?? '')),
    [size, glyphSize, glyph],
  );

  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, reduced ? 1 : 0.92] });
  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, reduced ? 0 : 3] });
  const pressOpacity = press.interpolate({ inputRange: [0, 1], outputRange: [1, reduced ? 0.8 : 1] });
  const breatheOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 1 : 1.05, 1] });

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      // `ui.md` §12: the game screen exposes one accessibility element; letting a screen
      // reader speak letter *names* over a game whose thesis is letter *sounds* would
      // teach the opposite of the app.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={[
          styles.tile,
          {
            width: size,
            height: size,
            borderRadius: size * radius,
            borderWidth: 2,
            borderColor: tokens.edge,
            backgroundColor: theme.tileFace,
            opacity: Animated.multiply(pressOpacity, breatheOpacity),
            transform: [
              { scale: Animated.multiply(scale, breatheScale) },
              { translateY },
            ],
          },
        ]}
      >
        {/* The two bars are absolutely positioned and the glyph is centred in the whole
            tile, rather than the three being stacked. Stacked, the 1.55 em box plus the
            0.18 + 0.13 bars comes to ~1.14 x the tile and the base bar is clipped away —
            seen on a 393 pt phone, where a 91 pt tile wanted 104 pt of stack.
            Overlapping is safe by measurement: Baloo 2's worst ink span is 1.088 em
            inside a 1.55 em box (`ui.md` §6.0.1, §6.3), so the ink stops 0.23 em short of
            each end of the box, which is more than the bar is tall at every tile size the
            layout law produces. Q6 is unaffected — the box is still 1.55 x fontSize. */}
        <View style={styles.bars} pointerEvents="none">
          <View>
            <Bar width={size - 4} height={capH} colour={tokens.face} pattern={tokens.pattern} />
            <View style={{ height: keyline, backgroundColor: tokens.deep }} />
          </View>
          <View>
            <View style={{ height: keyline, backgroundColor: tokens.deep }} />
            <Bar width={size - 4} height={baseH} colour={tokens.face} pattern={tokens.pattern} />
          </View>
        </View>
        <Glyph text={glyph} size={fitted} colour={theme.tileGlyph} />
      </Animated.View>
      {hint === 'rim' ? (
        // G4: a steady `reward` rim. A second, larger ring rather than an animated
        // border, because a border width is not a transform (O3).
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, {
            borderRadius: size * radius + 3,
            borderWidth: 3,
            borderColor: theme.reward,
            margin: -3,
          }]}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bars: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barRow: {
    flexDirection: 'row',
  },
});
