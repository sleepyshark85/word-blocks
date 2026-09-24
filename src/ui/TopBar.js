// The top bar. `ui.md` §9.4 — **72 pt in revision 6**, on the ground, above the word strip.
//
//  ┌──────────────────────────────────────────────────────────────────┐
//  │ ┌────────┐                                                       │
//  │ │ ▓▓▓▓▓▓ │      [img][img][  ][  ][  ]          ┌──────────┐     │
//  │ │ ┌────┐ │          Ghép Chữ                    │  Cha mẹ  │     │
//  │ │ └────┘ │                                      └──────────┘     │
//  │ └────────┘                                                       │
//  └──────────────────────────────────────────────────────────────────┘
//    LANGUAGE        THE SHELF: 5 slots, 29–41 pt square, 6 pt gap.    THE PARENT DOOR
//    72 × 72         Filled = the photograph he found. Empty = a       65 × 32, §9.4b
//    the CHILD'S     1.5 pt inkSoft ring. MODE TITLE UNDER IT.
//    §9.4a
//
// **Three children, and each belongs to a different person.** The left is the child's,
// the centre is his progress, the right is his parents'. The bar is `space-between`;
// nothing claims flex-grow; the title may shrink and nothing else may.
//
// **What revision 6 changed, and why** (`ui.md` §0D). The owner ran the app on a real
// iPhone and reported that he could not find the language switch or the editor. Both
// lived behind a 1.2 s hold on a 32 pt dot at 30 % opacity: **hiding the gate had also
// hidden the door**, and those are separable. So the dot became a labelled door, the
// language switch came out from behind the gate entirely — *"I think he should be able to
// change the language himself"* — and the mode title moved out of the left edge to make
// room, down under the shelf, where it costs no width at all (F19).
//
// The mode title is still the **leak detector** (`ui.md` §3.1): every screenshot the
// tester takes carries its own label, so a Vietnamese screen showing `Word Blocks` is
// visible in the evidence rather than only in the source.

import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { EASING } from '../motion/easing';
import { M } from '../motion/durations.mjs';
import { LANG_W, DOOR_W, DOOR_PAD, SLOT_GAP, TOP_BAR } from '../layout/layout.mjs';
import { chooserPanels } from '../i18n';
import { AppText } from './Text';
import { Picture } from './Picture';

/** §9.4b — the door is 65 × 32 with a 16 pt radius. The width is the layout law's. */
const DOOR_H = 32;
/**
 * §9.4b — the outline is 1.5 pt, and **it is drawn inside the 8 pt padding, not outside
 * it.** React Native's box model is border-box: a 65 pt door with a 1.5 pt border and
 * 8 pt of padding gives its label `65 − 3 − 16 = 46` pt, and `Cha mẹ` measures 48.8.
 *
 * **It shipped for exactly one browser run**, which rendered `Cha …` — the same defect as
 * `Word Blo…`, on the same bar, found the same way. F22 reserves
 * `DOOR_LABEL_PT + 2 · DOOR_PAD ≤ DOOR_W` and says nothing about a border, so the
 * component owes the label the full `DOOR_W − 2 · DOOR_PAD` and pays for its own outline.
 * `test/topbar.test.mjs` now computes this box **from this stylesheet** rather than from
 * the law's two constants, which is what makes it a check instead of a restatement.
 */
const DOOR_BORDER = 1.5;
/** §9.4a — each bar is 44 × 20 with a 6 pt radius, 8 pt apart, inside the 72 pt square. */
const LANG_BAR_W = 44;
const LANG_BAR_H = 20;
const LANG_BAR_GAP = 8;

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
 * **The centre column: the shelf, with the mode title under it** (`ui.md` §9.4, F19).
 *
 * The title used to sit at the left edge and reserve 96 pt of the content width there.
 * The child's language control needs that room, so the title moved here — 44 pt of shelf
 * plus an 18 pt line is 62 ≤ 72, and the shelf row (159–244 pt) is always wider than the
 * title (81.4 pt), so it costs **no width at all**. That is F19, and
 * `test/topbar.test.mjs` measures it from the shipped font file on every served viewport.
 */
function ShelfColumn({ title, shelf, slotSize, sourceFor, reduced, onTapSlot }) {
  const theme = useTheme();
  return (
    <View style={styles.centre}>
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
      ) : null}
      <AppText role="modeTitle" colour={theme.inkSoft} numberOfLines={1} style={styles.title}>
        {title}
      </AppText>
    </View>
  );
}

/**
 * **The language control — the child's, and it is not a tile** (`ui.md` §9.4a, AC Y1–Y10).
 *
 * Two stacked bars, **no glyph, no letter and no word**: a letter would be read as
 * something to add to his word, and a word is the one channel he cannot use. The top bar
 * is **Vietnamese in both languages** and the bottom is **English in both languages** —
 * the order comes from `chooserPanels()`, the same function the chooser lays its panels
 * out from, because the control is a *picture of the destination*. Filled is the language
 * you are in; the outline is the other one. That is the live-tile / flat-tile distinction,
 * which is the first visual grammar this app teaches him.
 *
 * Position, not colour, carries which is which, so it survives greyscale, all three
 * dichromacies and the theme picker (Y3).
 *
 * **It is not a tile** (Y10): an 18 pt radius against the tile's, a neutral outline
 * instead of a role outline, **no identity bar**, no glyph, and it is not an instance of
 * the tile component. The one thing it must never be is the sixty-first character.
 *
 * **M26 / Y9** — the two bars swap over 260 ms on the new board, cross-faded in place, so
 * the board itself confirms what his tap did. The control mounts with the *previous*
 * arrangement drawn and fades to this one.
 */
function LanguageControl({ language, reduced, onPress }) {
  const theme = useTheme();
  const rows = chooserPanels();
  const current = rows.findIndex((row) => row.language === language);
  const swap = useRef(new Animated.Value(reduced ? 1 : 0)).current;

  useEffect(() => {
    if (reduced) { swap.setValue(1); return undefined; }
    const anim = Animated.timing(swap, {
      toValue: 1,
      duration: M.langSwap,
      easing: EASING.calm,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [swap, reduced]);

  return (
    <Pressable
      onPress={onPress ?? undefined}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={current >= 0 ? rows[current].subtitle : undefined}
      style={[styles.lang, { backgroundColor: theme.surface, borderColor: theme.neutralFace }]}
    >
      {rows.map((row, i) => {
        // At t = 0 the *other* row is filled — the language he just left — and at t = 1
        // this one is. The cross-fade is the sentence: *you are now the other one.*
        const filled = i === current
          ? swap
          : swap.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
        const outlined = filled.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
        return (
          <View
            key={row.language}
            style={[styles.langRow, { marginTop: i === 0 ? 0 : LANG_BAR_GAP }]}
          >
            <Animated.View
              style={[styles.langBar, styles.inert, {
                backgroundColor: theme.ink,
                opacity: filled,
              }]}
            />
            <Animated.View
              style={[styles.langBar, styles.langBarOutline, StyleSheet.absoluteFill, styles.inert, {
                borderColor: theme.neutralFace,
                opacity: outlined,
              }]}
            />
          </View>
        );
      })}
    </Pressable>
  );
}

/**
 * **The hold hint** (`ui.md` §9.4b, §10.6 M27, AC I2, Y21) — the word `Giữ` / `Hold` and a
 * 1.2 s ring, drawn under the door, **silent**, in `inkSoft`.
 *
 * Revision 5 said a tap on the door does nothing. ***"Nothing happens" is a failure for an
 * adult exactly as it is for a child*** — it is what the owner did, and it is why he
 * concluded there was no button.
 *
 * Opacity only, no rise, no bounce: it is information for an adult, not a flourish, and it
 * must not read as something to play with. Repeated taps inside the window do not restart
 * it (Y22): the sequence is only started when it is not already running.
 */
function HoldHint({ label, holdMs, seq, reduced, onShown }) {
  const theme = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const running = useRef(false);
  const shown = useRef(onShown);
  shown.current = onShown;

  useEffect(() => {
    if (seq === 0 || running.current) return undefined;
    running.current = true;
    if (shown.current) shown.current();
    sweep.setValue(0);
    const anim = Animated.parallel([
      Animated.sequence([
        Animated.timing(fade, {
          toValue: 1, duration: M.hintIn, easing: EASING.enter, useNativeDriver: true,
        }),
        Animated.delay(holdMs),
        Animated.timing(fade, {
          toValue: 0, duration: M.hintOut, easing: EASING.exit, useNativeDriver: true,
        }),
      ]),
      // The ring shows the length of the press the door wants: the same 1200 ms.
      Animated.timing(sweep, {
        toValue: 1, duration: M.gateHold, easing: EASING.linear, useNativeDriver: true,
      }),
    ]);
    anim.start(() => { running.current = false; });
    return () => { anim.stop(); running.current = false; };
  }, [seq, holdMs, fade, sweep]);

  const rotate = sweep.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[styles.hint, styles.inert, { opacity: fade }]}>
      <View style={[styles.hintRing, { borderColor: theme.inkSoft }]}>
        <Animated.View style={[styles.hintSweep, { transform: reduced ? [] : [{ rotate }] }]}>
          <View style={[styles.hintSweepHalf, { backgroundColor: theme.inkSoft }]} />
        </Animated.View>
      </View>
      <AppText role="modeTitle" colour={theme.inkSoft} numberOfLines={1}>{label}</AppText>
    </Animated.View>
  );
}

/**
 * **The parent door** (`ui.md` §9.4b, AC I1–I4, Y19–Y23) — a 65 × 32 pill carrying the
 * word `Cha mẹ` / `Parent`. **A word, not an icon**: every icon is a *picture*, and
 * pictures are the child's channel in this app. A gear is interesting to a 4-year-old; a
 * word is furniture.
 *
 * **The lock behind it is unchanged, and that is the ruling.** Press and hold 1.2 s; then
 * the spelled-out multiplication. Hiding the door never was the lock — a child who taps
 * everything finds a 32 pt dot in a corner in under a minute, and 1.2 s is nothing to a
 * child who holds a tile for thirty seconds. The barrier is reading plus arithmetic.
 *
 * **It is the only object in the app that never makes a sound when it is touched** (Y20).
 * Every tile talks, the shelf replays a word, the rail clicks. He will find this once, get
 * a grey word and silence, and go back to the board.
 *
 * **M25** — the fill sweeps left → right behind the label, `scaleX` anchored at the left
 * edge, `neutralFace` at 22 %, 1200 ms **linear**: a progress indicator that eases is
 * lying about the time left. Releasing early runs it back to 0 in 160 ms (I4), which says
 * *it emptied* rather than *it vanished*.
 */
function ParentDoor({ label, reduced, onOpen, onTap }) {
  const theme = useTheme();
  const fill = useRef(new Animated.Value(0)).current;
  const running = useRef(null);
  const opened = useRef(false);

  useEffect(() => () => { if (running.current) running.current.stop(); }, []);

  const begin = () => {
    opened.current = false;
    fill.setValue(0);
    running.current = Animated.timing(fill, {
      toValue: 1,
      duration: M.gateHold,
      easing: EASING.linear,
      useNativeDriver: true,
    });
    running.current.start(({ finished }) => {
      if (!finished) return;
      opened.current = true;
      onOpen();
    });
  };

  const release = () => {
    if (running.current) running.current.stop();
    // I2 — a press that was **not** a hold is a tap, and a tap is no longer nothing: it
    // asks for the hint. Y23: a press that already opened the gate does neither again.
    if (!opened.current && onTap) onTap();
    const back = Animated.timing(fill, {
      toValue: 0,
      duration: M.doorFillBack,
      easing: EASING.exit,
      useNativeDriver: true,
    });
    running.current = back;
    back.start();
  };

  // `scaleX` on a left-anchored box, never a width: O1/O3 forbid animating a layout
  // property and `transformOrigin` is not portable, so the anchor is a half-width
  // translate either side of the scale — the same idiom the strip's span bar uses.
  const anchored = fill.interpolate({
    inputRange: [0, 1],
    outputRange: [-(DOOR_W / 2), 0],
  });

  return (
    <Pressable
      onPressIn={begin}
      onPressOut={release}
      // I3 — the fill runs for exactly 1200 ms, so it must start when he touches down.
      delayPressIn={0}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={[styles.door, { borderColor: theme.neutralFace }]}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.inert, {
          backgroundColor: theme.neutralFace,
          opacity: 0.22,
          transform: reduced ? [] : [{ translateX: anchored }, { scaleX: fill }],
        }]}
      />
      <AppText role="modeTitle" colour={theme.inkSoft} numberOfLines={1}>{label}</AppText>
    </Pressable>
  );
}

export function TopBar({
  title, shelf, slotSize = 32, sourceFor, reduced, onOpenGate, onTapSlot, width,
  language, doorLabel, hintLabel, hintSeq = 0, hintHoldMs = M.hintHold, onHintShown,
  onOpenChooser = null, hideLanguage = false, onTapDoor,
}) {
  return (
    <View style={[styles.bar, { width }]}>
      {/* The 72 pt column is reserved whether or not the control is drawn, so the shelf
          does not move when the reveal hides it (Y8). */}
      <View style={styles.lane}>
        {hideLanguage ? null : (
          <LanguageControl language={language} reduced={reduced} onPress={onOpenChooser} />
        )}
      </View>
      <ShelfColumn
        title={title}
        shelf={shelf}
        slotSize={slotSize}
        sourceFor={sourceFor}
        reduced={reduced}
        onTapSlot={onTapSlot}
      />
      <View style={styles.doorLane}>
        <ParentDoor
          label={doorLabel}
          reduced={reduced}
          onOpen={onOpenGate}
          onTap={onTapDoor}
        />
        <HoldHint
          label={hintLabel}
          holdMs={hintHoldMs}
          seq={hintSeq}
          reduced={reduced}
          onShown={onHintShown}
        />
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
    height: TOP_BAR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  /**
   * **No child of the bar claims flex-grow, and that is load-bearing.**
   *
   * It used to read `flex: 1` on the mode title and `flex: 1` on the 32 pt gate-dot
   * column, which split the space either side of the shelf equally — so on the owner's
   * 430 pt phone the title box was **74 pt** against the 81.4 pt `Word Blocks` measures at
   * 13 pt in Be Vietnam Pro Medium, and every English screenshot he ever saw said
   * `Word Blo…`. The gate-dot column asked for half the slack and used none of it.
   *
   * Now the three lanes take exactly the widths the **layout law** reserves for them —
   * `LANG_W`, the shelf row, `DOOR_W` — and `space-between` distributes what is left.
   * `test/topbar.test.mjs` measures both mode titles and both door labels against those
   * boxes, from the shipped font file, on every served viewport.
   */
  lane: { width: LANG_W, height: LANG_W, justifyContent: 'center' },
  doorLane: { width: DOOR_W, alignItems: 'center' },
  centre: { alignItems: 'center', flexShrink: 1 },
  shelf: { flexDirection: 'row', alignItems: 'center' },
  /** The title shrinks rather than pushing the shelf out of the bar at a 2× font scale. */
  title: { flexShrink: 1 },
  lang: {
    width: LANG_W,
    height: LANG_W,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langRow: { width: LANG_BAR_W, height: LANG_BAR_H },
  langBar: { width: LANG_BAR_W, height: LANG_BAR_H, borderRadius: 6 },
  /** No fill at all — the outline IS the state. */
  langBarOutline: { borderWidth: 1.5 },
  door: {
    width: DOOR_W,
    height: DOOR_H,
    borderRadius: 16,
    borderWidth: DOOR_BORDER,
    paddingHorizontal: DOOR_PAD - DOOR_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hint: {
    position: 'absolute',
    top: DOOR_H + 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hintRing: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, marginRight: 4,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  /** A half-disc that sweeps, not an animated arc: an arc is a border, and a border is
      not a transform (`acceptance-criteria.md` O3). */
  hintSweep: { width: 13, height: 13, flexDirection: 'row' },
  hintSweepHalf: { width: 6.5, height: 13 },
});
