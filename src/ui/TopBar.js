// The top bar. `ui.md` §9.5 — 36 pt, on the ground, above the frame.
//
//  ┌───────────────────────────────────────────────────────────────┐
//  │ Ghép Chữ              ● ● ○ ○ ○                          ◔    │
//  └───────────────────────────────────────────────────────────────┘
//    13pt inkSoft          page rail: 5 dots, 10pt,          gate dot,
//    mode title            8pt gap                           32pt, 30%
//
// The mode title is the **leak detector** (`ui.md` §3.1): every screenshot the tester
// takes carries its own label, so a Vietnamese screen showing `Word Blocks` is visible in
// the evidence rather than only in the source.
//
// The gate dot is the only non-play affordance on the game screen, it is the smallest
// target in the app, and on a flat tablet it is the point furthest from a seated child's
// hands. All three properties are deliberate (`acceptance-criteria.md` I1).

import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { M } from '../motion/durations.mjs';
import { AppText } from './Text';

const GATE_DOT = 32;

/** `gameplay.md` §6.4 — five dots. A shape, not a score; nothing accumulates. */
function PageRail({ rail }) {
  const theme = useTheme();
  return (
    <View style={styles.rail}>
      {rail.map((filled, i) => (
        <View
          // eslint-disable-next-line react/no-array-index-key -- position is the identity
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            marginLeft: i === 0 ? 0 : 8,
            backgroundColor: theme.inkSoft,
            opacity: filled ? 1 : 0.22,
          }}
        />
      ))}
    </View>
  );
}

/**
 * `acceptance-criteria.md` I2–I4 — a tap does nothing; a **hold** fills a ring over
 * 1200 ms and opens the gate at 1200 ms; releasing early resets the ring.
 *
 * M18 is "the only progress indicator in the app", and it is drawn as a rotating
 * half-disc rather than an animated arc, because an arc is a border and a border is not a
 * transform (`acceptance-criteria.md` O3).
 */
function GateDot({ reduced, onOpen }) {
  const theme = useTheme();
  const fill = useRef(new Animated.Value(0)).current;
  const running = useRef(null);

  useEffect(() => () => { if (running.current) running.current.stop(); }, []);

  const begin = () => {
    fill.setValue(0);
    running.current = Animated.timing(fill, {
      toValue: 1,
      duration: M.gateHold,
      useNativeDriver: true,
    });
    running.current.start(({ finished }) => { if (finished) onOpen(); });
  };

  const cancel = () => {
    if (running.current) running.current.stop();
    fill.setValue(0);
  };

  const rotate = fill.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Pressable
      onPressIn={begin}
      onPressOut={cancel}
      accessibilityRole="button"
      accessibilityLabel="parent"
      hitSlop={6}
      style={{ width: GATE_DOT, height: GATE_DOT }}
    >
      <View style={[styles.gateDot, {
        borderColor: theme.neutralFace,
        opacity: 0.3,
      }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, {
          opacity: fill,
          transform: reduced ? [] : [{ rotate }],
          alignItems: 'center',
          justifyContent: 'center',
        }]}
      >
        <View style={{
          width: GATE_DOT - 8,
          height: GATE_DOT - 8,
          borderRadius: (GATE_DOT - 8) / 2,
          backgroundColor: theme.neutralFace,
        }}
        />
      </Animated.View>
    </Pressable>
  );
}

export function TopBar({ title, rail, reduced, onOpenGate, width }) {
  const theme = useTheme();
  return (
    <View style={[styles.bar, { width }]}>
      <AppText role="modeTitle" colour={theme.inkSoft} style={styles.title}>{title}</AppText>
      {rail ? <PageRail rail={rail} /> : <View />}
      <View style={styles.right}>
        <GateDot reduced={reduced} onOpen={onOpenGate} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { flex: 1 },
  rail: { flexDirection: 'row', alignItems: 'center' },
  right: { flex: 1, alignItems: 'flex-end' },
  gateDot: {
    width: GATE_DOT,
    height: GATE_DOT,
    borderRadius: GATE_DOT / 2,
    borderWidth: 3,
  },
});
