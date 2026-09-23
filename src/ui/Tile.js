// The character tile, live and flat. `ui.md` §5.4, §5.8, §9.1 — and §9.1a, because a
// page-rail button **is this same object doing a different job**.
//
//   LIVE  (standing)                      DISABLED  (lying flat)
//   ┌───────────────────────┐             ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
//   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 0.18t bar                              1.5pt dashed
//   │───────────────────────│ keyline     ╎                       ╎  neutralFace @55%
//   │          m            │ ink 13.4:1  ╎          b            ╎  inkSoft on ground
//   │───────────────────────│             ╎                       ╎  5.4-5.9:1
//   │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ 0.13t bar   └━━━━━━━━━━━━━━━━━━━━━━━┘  3pt roleEdge underbar
//   └───────────────────────┘ 2pt edge
//   white face                            ground face — no white, no cap, no keyline
//
// **The metaphor is standing up and lying flat, never on and off.** A disabled tile is
// not a punishment and not a failure: it keeps its letter at **full opacity**, it is
// still pressable, and it still speaks (`gameplay.md` §4.3). That is what makes `q` —
// which no word uses — a sound toy rather than a hole (`ui.md` §8.1, AC D1b).
//
// The discriminators, in `ui.md` §5.8's order of strength: **ink weight** (two heavy bars
// against a 3 pt line — 31% of the area against ~4%), **outline solidity** (solid against
// dashed), **glyph darkness** (`ink` against `inkSoft`), and colour last and redundant.
// The first two survive greyscale, which is what `acceptance-criteria.md` E6 and S8 ask.
//
// Motion: `transform` and `opacity` only, `useNativeDriver: true` (O1, O3). Every state
// change is two stacked faces cross-faded by opacity plus a 2 pt translate — a background
// colour is not a transform and may not be animated.
//
// **The `∅` socket is gone** (revision 3, AC B2f/N13): a vowel-initial word is started by
// tapping the vowel, so there is no placeholder for this component to draw.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useTheme, roleTokens } from '../theme';
import { EASING, SPRING } from '../motion/easing';
import { M } from '../motion/durations.mjs';
import { fitGlyph } from '../layout/layout.mjs';
import { glyphLength } from '../engine/index.mjs';
import { Glyph } from './Text';

/** The identity bar, drawn in the role's pattern (`ui.md` §5.5). */
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
 * **M7 / O12 — the tone carrier swap.** The six tone cells are the only cells in the app
 * whose glyph changes mid-word: a bare mark on a dotted circle while no rime is placed,
 * the seated rime marked the instant one can be chosen (`ui.md` §7.2, AC B2d, C5, C10).
 *
 * It is a **160 ms opacity cross-fade of two stacked `Text` layers, with no movement**:
 * the cell, its size, its bar and its position do not change, and nothing else on the
 * board animates. Deliberately the quietest transition in the app, because the board must
 * not look like it changed.
 */
function CarrierGlyph({ text, size, colour, reduced }) {
  const swap = useRef(new Animated.Value(1)).current;
  const [previous, setPrevious] = useState(null);
  const lastText = useRef(text);

  useEffect(() => {
    if (text === lastText.current) return undefined;
    const was = lastText.current;
    lastText.current = text;
    setPrevious(was);
    swap.setValue(0);
    const anim = Animated.timing(swap, {
      toValue: 1,
      duration: reduced ? M.toneSwap : M.toneSwap,
      easing: EASING.calm,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => { if (finished) setPrevious(null); });
    return () => anim.stop();
  }, [text, swap, reduced]);

  return (
    <View>
      {previous === null ? null : (
        <Animated.View
          style={[styles.inert, StyleSheet.absoluteFill, styles.centre, {
            opacity: swap.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          }]}
        >
          <Glyph text={previous} size={size} colour={colour} />
        </Animated.View>
      )}
      <Animated.View style={{ opacity: previous === null ? 1 : swap }}>
        <Glyph text={text} size={size} colour={colour} />
      </Animated.View>
    </View>
  );
}

/**
 * @param {object}   props
 * @param {string}   props.glyph      what the child reads
 * @param {'mark'|'rime'} [props.carrier]  which carrier a tone cell is wearing (B2d/B2e)
 * @param {string}   props.role       role1 | role2 | role3
 * @param {boolean}  props.live       standing up, or lying flat
 * @param {boolean}  [props.current]  §9.1a — a rail button for the page he is on
 * @param {number}   props.size       the tile edge, from the layout law
 * @param {number}   props.index      the slot on its page — M6 staggers by 20 ms of it
 * @param {number}   props.hitSlop    half the gap, so no two hit rects overlap (P11)
 * @param {'rest'|'breathe'|'rim'} props.hint
 */
export function Tile({
  glyph, carrier = null, role, live, size, fontSize, index = 0, radius = 0.22, hitSlop = 6,
  pressed = false, dipSeq = 0, hint = 'rest', shimmerSeq = 0, flying = false,
  current = false, currentFace = null, reduced = false, onPressIn, onPressOut,
}) {
  const theme = useTheme();
  const tokens = roleTokens(theme, role);
  const press = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(1)).current;
  const stand = useRef(new Animated.Value(live ? 1 : 0)).current;
  const dip = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const lastDip = useRef(dipSeq);
  const lastShimmer = useRef(shimmerSeq);

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

  // **M6 — standing up and lying down is the teaching moment.** 200 ms cross-fade, a 2 pt
  // rise or fall, staggered 20 ms by slot index so the board reads as a wave across it
  // rather than a flicker (`acceptance-criteria.md` E7, O10, O11).
  useEffect(() => {
    const anim = Animated.timing(stand, {
      toValue: live ? 1 : 0,
      duration: M.standChange,
      delay: reduced ? 0 : index * M.standStagger,
      easing: EASING.calm,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [live, stand, index, reduced]);

  // M5 / O7 — the disabled dip: 120 ms, 2 pt, and back. Measurably the smallest motion in
  // the app, on purpose. *I heard you; this one is lying down.* Never a shake.
  useEffect(() => {
    if (dipSeq === lastDip.current) return undefined;
    lastDip.current = dipSeq;
    const leg = M.disabledDip / 2;
    const anim = Animated.sequence([
      Animated.timing(dip, { toValue: 1, duration: leg, easing: EASING.calm, useNativeDriver: true }),
      Animated.timing(dip, { toValue: 0, duration: leg, easing: EASING.calm, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [dipSeq, dip]);

  // M17 / G2 — the shimmer at 20 s idle: a soft wave of light across the **live** tiles,
  // left to right. It says *these ones*, with no words and no pointing at one answer.
  useEffect(() => {
    if (shimmerSeq === lastShimmer.current || !live) return undefined;
    lastShimmer.current = shimmerSeq;
    shimmer.setValue(0);
    const anim = Animated.timing(shimmer, {
      toValue: 1,
      duration: reduced ? M.shimmer : Math.round(M.shimmer * 0.4),
      delay: reduced ? 0 : index * 24,
      easing: EASING.calm,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [shimmerSeq, shimmer, live, index, reduced]);

  // M18 / G3: 1200 ms on, 1600 ms pause, repeating. Slow on purpose — a fast pulse reads
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
  const underH = 3;
  const keyline = 1.5;
  const glyphSize = fontSize ?? Math.floor(Math.min(size * 0.52, (size - 16) / 1.55));
  const fitted = useMemo(
    () => fitGlyph(size, glyphSize, glyphLength(glyph ?? '')),
    [size, glyphSize, glyph],
  );

  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, reduced ? 1 : 0.92] });
  const pressY = press.interpolate({ inputRange: [0, 1], outputRange: [0, reduced ? 0 : 3] });
  const pressOpacity = press.interpolate({ inputRange: [0, 1], outputRange: [1, reduced ? 0.8 : 1] });
  // The 2 pt rise of M6: a live tile sits 2 pt higher than a flat one.
  const standY = stand.interpolate({
    inputRange: [0, 1],
    outputRange: [reduced ? 0 : M.standRisePt, 0],
  });
  const dipY = dip.interpolate({
    inputRange: [0, 1],
    outputRange: [0, reduced ? 0 : M.disabledDipPt],
  });
  const dipOpacity = dip.interpolate({ inputRange: [0, 1], outputRange: [1, reduced ? 0.85 : 1] });
  const breatheOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const breatheScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 1 : 1.05, 1] });
  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.25, 0],
  });
  const flyScale = flying ? 1.06 : 1;

  // **B2e — the bare tone mark is drawn in `ink`, not `inkSoft`.** A diacritic is thinner
  // than any letter, so it takes the darkest token; measured 11.96–13.06:1 on the ground
  // and gated as a `glyph` pair in `tools/theme-contrast.mjs` (S13).
  const flatGlyphColour = carrier === 'mark' ? theme.ink : theme.inkSoft;

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      // **`ui.md` §11.1 — the sound fires on touch-DOWN, within 60 ms.** The press
      // responder's default `delayPressIn` is **50 ms**, which spends the whole budget
      // before a line of this app runs and, worse, **drops a tap shorter than 50 ms
      // entirely** — measured in a browser at 0/10/40 ms holds, where nothing fired at
      // all. A 4-year-old's tap is exactly that fast. Zero is not a tuning choice here;
      // it is the criterion (`acceptance-criteria.md` N1, N2).
      delayPressIn={0}
      hitSlop={hitSlop}
      // `ui.md` §12: the board exposes one accessibility element. Letting a screen reader
      // speak letter *names* over a game whose entire thesis is letter *sounds* would
      // teach the opposite of the app.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          opacity: Animated.multiply(Animated.multiply(pressOpacity, breatheOpacity), dipOpacity),
          transform: [
            { scale: Animated.multiply(Animated.multiply(scale, breatheScale), flyScale) },
            { translateY: Animated.add(Animated.add(pressY, standY), dipY) },
          ],
        }}
      >
        {/* The flat face, underneath. `ground`, a dashed neutral outline, a 3 pt role
            underbar so the role survives, and the glyph in `inkSoft` — or in `ink` when
            it is a bare tone mark (B2e). */}
        <View
          style={[styles.inert, StyleSheet.absoluteFill, styles.face, {
            borderRadius: size * radius,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: theme.neutralFace,
            backgroundColor: theme.ground,
          }]}
        >
          <View style={[styles.underbar, {
            height: underH, width: size - 8, backgroundColor: tokens.edge,
          }]}
          />
          <CarrierGlyph text={glyph} size={fitted} colour={flatGlyphColour} reduced={reduced} />
        </View>

        {/* The standing face, over it, cross-faded by opacity. White, two role bars at
            31% of the area, a solid 2 pt outline, and the glyph in `ink` at 13.4:1.
            **V18 — a rail button for the current page takes the `reward` face instead**,
            keeping the ink glyph: 6.53 / 8.70 / 8.34:1, the chant's already-gated pair. */}
        <Animated.View
          style={[styles.inert, StyleSheet.absoluteFill, styles.face, {
            borderRadius: size * radius,
            borderWidth: 2,
            borderColor: current ? theme.rewardEdge : tokens.edge,
            backgroundColor: current && currentFace ? currentFace : theme.tileFace,
            opacity: current ? 1 : stand,
          }]}
        >
          {current ? null : (
            <View style={[styles.inert, styles.bars]}>
              <View>
                <Bar width={size - 4} height={capH} colour={tokens.face} pattern={tokens.pattern} />
                <View style={{ height: keyline, backgroundColor: tokens.deep }} />
              </View>
              <View>
                <View style={{ height: keyline, backgroundColor: tokens.deep }} />
                <Bar width={size - 4} height={baseH} colour={tokens.face} pattern={tokens.pattern} />
              </View>
            </View>
          )}
          <CarrierGlyph text={glyph} size={fitted} colour={theme.tileGlyph} reduced={reduced} />
        </Animated.View>

        {/* M17 — the shimmer, a light wash that never changes what the tile is. */}
        <Animated.View
          style={[styles.inert, StyleSheet.absoluteFill, {
            borderRadius: size * radius,
            backgroundColor: theme.reward,
            opacity: shimmerOpacity,
          }]}
        />
      </Animated.View>

      {hint === 'rim' ? (
        // G4: a steady `reward` rim. A second, larger ring rather than an animated
        // border, because a border width is not a transform (O3).
        <View
          style={[styles.inert, StyleSheet.absoluteFill, {
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
  /**
   * `pointerEvents` as a **prop** is deprecated in React Native 0.81 and is not applied
   * by react-native-web 0.21 — measured in a browser, an overlay declaring it kept a
   * computed `pointer-events: auto`. The **style** key is honoured on both (native since
   * RN 0.73), so it is the portable spelling, and it is the one that actually makes an
   * overlay inert.
   */
  inert: { pointerEvents: 'none' },
  centre: { alignItems: 'center', justifyContent: 'center' },
  face: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bars: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barRow: { flexDirection: 'row' },
  underbar: { position: 'absolute', bottom: 0, borderRadius: 2 },
});
