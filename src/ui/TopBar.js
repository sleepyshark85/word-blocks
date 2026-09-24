// The top bar. `ui.md` §9.4 — 56 pt, on the ground, above the word strip.
//
//  ┌────────────────────────────────────────────────────────────────┐
//  │ Ghép Chữ           [img][img][  ][  ][  ]                  ◔   │
//  └────────────────────────────────────────────────────────────────┘
//    13pt inkSoft       THE SHELF: 5 slots, 32-44pt square,       gate dot,
//    mode title         6pt gap. Filled = the photograph he       32pt,
//    (leak detector)    found. Empty = a 1.5pt inkSoft ring.      neutralFace @30%
//
// **The shelf replaces revision 1's five-dot page rail**, in the same place, doing the
// same job — *how much is left before we stop* — but each slot fills with the photograph
// he just found instead of an abstract dot (`gameplay.md` §6.2). It is a shape, not a
// score: nothing accumulates across shelves, no number is shown, and it resets when it
// tips into the album.
//
// The mode title is the **leak detector** (`ui.md` §3.1): every screenshot the tester
// takes carries its own label, so a Vietnamese screen showing `Word Blocks` is visible in
// the evidence rather than only in the source.
//
// The gate dot is the only non-play affordance on the board, it is the smallest target in
// the app, and on a flat tablet it is the point furthest from a seated child's hands. All
// three are deliberate (`acceptance-criteria.md` B15, I1).

import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { EASING } from '../motion/easing';
import { M } from '../motion/durations.mjs';
import { AppText } from './Text';
import { Picture } from './Picture';

const GATE_DOT = 32;
const SLOT_GAP = 6;

/** One shelf slot. A tap on a filled one replays its word and bounces it (H13). */
function Slot({ entry, size, index, sourceFor, reduced, onPress }) {
  const theme = useTheme();
  const fill = useRef(new Animated.Value(entry ? 1 : 0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const wasFilled = useRef(Boolean(entry));

  useEffect(() => {
    const filled = Boolean(entry);
    if (filled === wasFilled.current) return undefined;
    wasFilled.current = filled;
    // The picture landing in the slot is the tail of M15. It arrives, it does not grow.
    const anim = Animated.timing(fill, {
      toValue: filled ? 1 : 0,
      duration: filled ? M.shelfFly / 2 : M.albumCard,
      easing: filled ? EASING.enter : EASING.exit,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [entry, fill]);

  const tap = () => {
    if (!entry || !onPress) return;
    onPress(entry);
    const anim = Animated.sequence([
      Animated.timing(bounce, { toValue: 1, duration: 120, easing: EASING.enter, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0, duration: 180, easing: EASING.calm, useNativeDriver: true }),
    ]);
    anim.start();
  };

  const scale = Animated.add(
    fill.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 1 : 0.7, 1] }),
    bounce.interpolate({ inputRange: [0, 1], outputRange: [0, reduced ? 0 : 0.08] }),
  );

  return (
    <Pressable
      onPress={tap}
      disabled={!entry}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ marginLeft: index === 0 ? 0 : SLOT_GAP }}
    >
      {/* The empty slot: a 1.5 pt `inkSoft` ring at 40%. It is always drawn, so the shelf
          states how many are left without a number. */}
      <View style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        borderWidth: 1.5,
        borderColor: theme.inkSoft,
        opacity: 0.4,
      }}
      />
      {entry ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: fill, transform: [{ scale }] }]}
        >
          <View style={{
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.26),
            borderWidth: 2,
            borderColor: theme.rewardEdge,
            overflow: 'hidden',
          }}
          >
            <Picture
              source={sourceFor(entry.image)}
              emoji={sourceFor.emoji(entry.fallbackEmoji)}
              width={size - 4}
              height={size - 4}
              radius={Math.round(size * 0.22)}
            />
          </View>
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

/**
 * `acceptance-criteria.md` I2–I4 — a tap does nothing; a **hold** fills a ring over
 * 1200 ms and opens the gate at 1200 ms; releasing early resets the ring.
 *
 * M21 is "the only progress indicator in the app", and it is drawn as a rotating
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
      // I3 — the ring fills over exactly 1200 ms, so it must start when he touches down.
      delayPressIn={0}
      accessibilityRole="button"
      accessibilityLabel="parent"
      hitSlop={6}
      style={{ width: GATE_DOT, height: GATE_DOT }}
    >
      <View style={[styles.gateDot, { borderColor: theme.neutralFace, opacity: 0.3 }]} />
      <Animated.View
        style={[styles.inert, StyleSheet.absoluteFill, {
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

export function TopBar({
  title, shelf, slotSize = 32, sourceFor, reduced, onOpenGate, onTapSlot, width,
}) {
  const theme = useTheme();
  return (
    <View style={[styles.bar, { width }]}>
      <AppText role="modeTitle" colour={theme.inkSoft} numberOfLines={1} style={styles.title}>{title}</AppText>
      {shelf ? (
        <View style={styles.shelf}>
          {shelf.map((entry, i) => (
            <Slot
              // eslint-disable-next-line react/no-array-index-key -- the slot IS the identity
              key={i}
              entry={entry}
              index={i}
              size={slotSize}
              sourceFor={sourceFor}
              reduced={reduced}
              onPress={onTapSlot}
            />
          ))}
        </View>
      ) : <View />}
      <View style={styles.right}>
        <GateDot reduced={reduced} onOpen={onOpenGate} />
      </View>
    </View>
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
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  /**
   * **The mode title takes the width its own text needs, and the free space is shared
   * between the three, not between two of them.**
   *
   * It read `flex: 1` on the title and `flex: 1` on the (32 pt) gate-dot column, which
   * split the space either side of the shelf equally — so on the owner's 430 pt phone the
   * title box was **74 pt** against the 81.4 pt `Word Blocks` measures at 13 pt in Be
   * Vietnam Pro Medium, and every English screenshot he has ever seen says `Word Blo…`.
   * The gate-dot column asked for half the slack and used none of it.
   *
   * `flexShrink: 1` keeps the old behaviour as the *failure* mode rather than the normal
   * one: at a 2× font scale the title still truncates to one line instead of pushing the
   * shelf out of the bar. `test/topbar.test.mjs` measures both mode titles against the
   * layout law's own box on every served viewport, from the shipped font file.
   */
  title: { flexShrink: 1 },
  shelf: { flexDirection: 'row', alignItems: 'center' },
  right: { alignItems: 'flex-end' },
  gateDot: {
    width: GATE_DOT,
    height: GATE_DOT,
    borderRadius: GATE_DOT / 2,
    borderWidth: 3,
  },
});
