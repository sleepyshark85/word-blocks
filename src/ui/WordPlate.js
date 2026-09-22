// Where the answer is built.
//
// Two shapes, because the two languages assemble differently and `ui.md` §7.2/§8 draw
// them differently — a Vietnamese two-cell **plate** whose divider dissolves at the
// chant's blend step, and an English row of **sockets** whose count is the word's length.
//
// **There is no "wrong" cell state** (§9.2). A filled-but-not-correct cell looks exactly
// like a filled-and-correct one *minus* the lit segment and the brightening. No red, no
// grey-out, no X, anywhere in this app (`acceptance-criteria.md` E3, S7).

import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useTheme, roleTokens } from '../theme';
import { EASING } from '../motion/easing';
import { M } from '../motion/durations.mjs';
import { Glyph } from './Text';

/** `ui.md` §9.2 — an empty cell is a 2 pt dashed outline with a single centred dot. */
function EmptyMark({ size, colour }) {
  return (
    <View style={{
      width: Math.round(size * 0.1),
      height: Math.round(size * 0.1),
      borderRadius: size,
      backgroundColor: colour,
    }}
    />
  );
}

/**
 * A glyph in a cell, and the three things that can happen to it.
 *
 * **M4 / M3 / M16 — arrival.** The glyph enters over 260 ms, or over 420 ms when the
 * placement was the hint ladder's (`acceptance-criteria.md` O8: *measurably slower than
 * the 260 ms of a child-initiated placement*). See `arriveMs`.
 *
 * **M9 — the chant lift.** 1.0 → 1.12 with the glyph crossing to gold. Two stacked `Text`
 * layers cross-faded by **opacity**, because a text colour cannot be animated (O3).
 *
 * **M11 / C13 — the tone mark drop.** When the text changes from the unmarked form to the
 * marked one, the marked form cross-fades in from `scale` 1.8 and `translateY` −10 over
 * 260 ms with a 14% overshoot, while the unmarked form fades out under it. The previous
 * text is held in state for exactly as long as that takes, which is why this component
 * renders two glyphs rather than one.
 */
function CellGlyph({ text, size, active, arriveMs, reduced }) {
  const theme = useTheme();
  const gold = useRef(new Animated.Value(0)).current;
  // A cell that already holds a glyph when this mounts is not an arrival; starting
  // the value at 0 there would render it invisible until something changed.
  const arrive = useRef(new Animated.Value(text === null ? 0 : 1)).current;
  const drop = useRef(new Animated.Value(1)).current;
  const [previous, setPrevious] = useState(null);
  const lastText = useRef(text);

  useEffect(() => {
    Animated.timing(gold, {
      toValue: active ? 1 : 0,
      duration: M.chantLift,
      easing: EASING.calm,
      useNativeDriver: true,
    }).start();
  }, [active, gold]);

  useEffect(() => {
    if (text === lastText.current) return undefined;
    const was = lastText.current;
    lastText.current = text;
    if (was === null) {
      // An empty cell being filled: this is an arrival, not a mark drop.
      arrive.setValue(0);
      const anim = Animated.timing(arrive, {
        toValue: 1, duration: arriveMs, easing: EASING.enter, useNativeDriver: true,
      });
      anim.start();
      return () => anim.stop();
    }
    // The same part wearing a new mark — `o` becoming `ò` (C13).
    setPrevious(was);
    drop.setValue(0);
    const anim = Animated.timing(drop, {
      toValue: 1, duration: M.toneDrop, easing: EASING.enter, useNativeDriver: true,
    });
    anim.start(({ finished }) => { if (finished) setPrevious(null); });
    return () => anim.stop();
  }, [text, arriveMs, arrive, drop]);

  const liftScale = gold.interpolate({ inputRange: [0, 1], outputRange: [1, reduced ? 1 : 1.12] });
  const arriveScale = arrive.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [reduced ? 1 : 0.7, reduced ? 1 : 1.06, 1],
  });
  const dropScale = drop.interpolate({
    inputRange: [0, 0.86, 1],
    outputRange: [reduced ? 1 : 1.8, reduced ? 1 : 1.14, 1],
  });
  const dropY = drop.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : -10, 0] });

  return (
    <Animated.View style={{ transform: [{ scale: liftScale }] }}>
      {previous === null ? null : (
        <Animated.View style={[StyleSheet.absoluteFill, {
          opacity: drop.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        }]}
        >
          <Glyph text={previous} size={size} colour={theme.ink} />
        </Animated.View>
      )}
      <Animated.View style={{
        opacity: previous === null ? arrive : drop,
        transform: [
          { scale: previous === null ? arriveScale : dropScale },
          { translateY: previous === null ? 0 : dropY },
        ],
      }}
      >
        <Glyph text={text} size={size} colour={theme.ink} />
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: gold }]}>
          <Glyph text={text} size={size} colour={theme.reward} />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

/**
 * `ui.md` §7.2 — the Vietnamese plate. Two cells divided by a 1 pt `hairline`, the onset
 * cell `0.32 × plateW`. Each cell carries a 5 pt underline in its role colour, so the
 * plate states the structure of a syllable even when empty.
 *
 * `acceptance-criteria.md` C2 — a zero-onset word has **one full-width cell** and the
 * onset row is never rendered. The shape of the screen is the instruction; there is no
 * `∅` tile to press.
 */
export function WordPlateVi({
  cells, width, height, fontSize, merged, rockSeq, activeStep, arriveMs, reduced, onTapCell,
}) {
  const theme = useTheme();
  const rock = useRef(new Animated.Value(0)).current;
  const hairline = useRef(new Animated.Value(1)).current;
  const lastRock = useRef(rockSeq);

  // M7 / O7 — +-4 pt, three times, 520 ms total. A rock, not a shake: a fast shake means
  // *error* in every interface he will ever meet, and this game has no errors.
  useEffect(() => {
    if (rockSeq === lastRock.current) return undefined;
    lastRock.current = rockSeq;
    const leg = M.rockTotal / 6;
    const to = (v) => Animated.timing(rock, {
      toValue: v, duration: leg, easing: EASING.calm, useNativeDriver: true,
    });
    const anim = Animated.sequence([to(1), to(-1), to(1), to(-1), to(1), to(0)]);
    anim.start();
    return () => anim.stop();
  }, [rockSeq, rock]);

  // M10 — the hairline dissolves and the glyphs slide together at the blend step (C12).
  useEffect(() => {
    Animated.timing(hairline, {
      toValue: merged ? 0 : 1,
      duration: M.mergeFade,
      easing: EASING.enter,
      useNativeDriver: true,
    }).start();
  }, [merged, hairline]);

  const translateX = rock.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-M.rockAmplitude, 0, M.rockAmplitude],
  });
  const rockOpacity = rock.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.7, 1, 0.7] });

  const hasOnset = cells.length > 1;
  const onsetW = hasOnset ? Math.round(width * 0.32) : 0;

  return (
    <Animated.View
      style={[styles.plate, {
        width,
        height,
        backgroundColor: theme.surface,
        borderColor: theme.hairline,
        transform: [{ translateX: reduced ? 0 : translateX }],
        opacity: reduced ? rockOpacity : 1,
      }]}
    >
      {cells.map((cell, i) => {
        const role = cell.role === 'onset' ? 'role1' : 'role2';
        const tokens = roleTokens(theme, role);
        const w = cell.role === 'onset' ? onsetW : width - onsetW;
        return (
          <Pressable
            key={cell.role}
            style={{ width: w, height, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => onTapCell(cell.cellIndex)}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {cell.glyph === null
              ? <EmptyMark size={fontSize} colour={theme.neutralFace} />
              : (
                <CellGlyph
                  text={cell.glyph}
                  size={fontSize}
                  active={activeStep === cell.role}
                  arriveMs={arriveMs}
                  reduced={reduced}
                />
              )}
            <View style={[styles.underline, { backgroundColor: tokens.face, width: w - 16 }]} />
            {i === 0 && hasOnset ? (
              <Animated.View
                pointerEvents="none"
                style={[styles.divider, { backgroundColor: theme.hairline, opacity: hairline }]}
              />
            ) : null}
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

/**
 * `ui.md` §8 — the English slot row. **The socket count is the word's length**, a real,
 * soundless, textless clue. Each socket is `0.94 × tile` wide with a 6 pt gap, underlined
 * in that slot's expected role colour (`acceptance-criteria.md` D1).
 */
export function SlotRowEn({
  cells, expectVowel, tile, height, fontSize, rockSeq, activeStep, arriveMs, reduced, onTapCell,
}) {
  const theme = useTheme();
  const rock = useRef(new Animated.Value(0)).current;
  const lastRock = useRef(rockSeq);

  useEffect(() => {
    if (rockSeq === lastRock.current) return undefined;
    lastRock.current = rockSeq;
    const leg = M.rockTotal / 6;
    const to = (v) => Animated.timing(rock, {
      toValue: v, duration: leg, easing: EASING.calm, useNativeDriver: true,
    });
    const anim = Animated.sequence([to(1), to(-1), to(1), to(-1), to(1), to(0)]);
    anim.start();
    return () => anim.stop();
  }, [rockSeq, rock]);

  const translateX = rock.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-M.rockAmplitude, 0, M.rockAmplitude],
  });
  const rockOpacity = rock.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.7, 1, 0.7] });
  const slotW = Math.round(tile * 0.94);

  return (
    <Animated.View
      style={[styles.slotRow, {
        transform: [{ translateX: reduced ? 0 : translateX }],
        opacity: reduced ? rockOpacity : 1,
      }]}
    >
      {cells.map((cell, i) => {
        const tokens = roleTokens(theme, expectVowel(i) ? 'role2' : 'role1');
        return (
          <Pressable
            key={cell.cellIndex}
            onPress={() => onTapCell(cell.cellIndex)}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.slot, {
              width: slotW,
              height,
              marginLeft: i === 0 ? 0 : 6,
              backgroundColor: theme.surface,
              borderColor: cell.glyph === null ? theme.neutralFace : theme.hairline,
              borderStyle: cell.glyph === null ? 'dashed' : 'solid',
            }]}
          >
            {cell.glyph === null
              ? <EmptyMark size={fontSize} colour={theme.neutralFace} />
              : (
                <CellGlyph
                  text={cell.glyph}
                  size={fontSize}
                  active={activeStep === i}
                  arriveMs={arriveMs}
                  reduced={reduced}
                />
              )}
            <View style={[styles.underline, { backgroundColor: tokens.face, width: slotW - 10 }]} />
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  plate: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
  },
  slotRow: { flexDirection: 'row', alignItems: 'center' },
  slot: {
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  underline: {
    position: 'absolute',
    bottom: 6,
    height: 5,
    borderRadius: 3,
  },
  divider: {
    position: 'absolute',
    right: 0,
    top: 10,
    bottom: 10,
    width: 1,
  },
});
