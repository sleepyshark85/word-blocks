// The word strip — where the word is assembled, and the only undo in the game.
//
// `ui.md` §7.2 (Vietnamese) and §8 (English). **One shape now, both languages**
// (revision 3, correction U14): *the word so far, plus one dashed cell for what is still
// needed*. Revision 2 gave Vietnamese a third cell naming the tone in words — `m ┊ èo ┊
// huyền` — which put a word a pre-literate child cannot read on the child's screen,
// holding something that is not part of his word. The owner saw exactly that and said so.
//
//   empty        ╎ · ╎                    one dashed cell, one centred dot
//   onset in     │ b │╎ · ╎               5 pt role1 underline under `b`
//   rime in      │ b ││ o │╎ · ╎          role1 + role2 underlines; a tone is still needed
//   tone in      │    bò     │            merged. The mark lands ON the rime, and a 5 pt
//                                         DOTTED role3 segment records that a tone was
//                                         chosen — colour, never a word (C20)
//   zero onset   │ ao │╎ · ╎              `ao` starts at the LEFT. No empty first cell.
//
// **Two gestures live on this object** (`ui.md` §2.2): a tap on a filled cell is undo —
// that symbol and everything after it goes home (`gameplay.md` §4.4) — and an 800 ms hold
// speaks the parts of what is assembled. The child-discoverable one is the harmless one.
//
// **There is no "wrong" cell state.** No red, no grey-out, no X, anywhere in this app
// (`acceptance-criteria.md` E3, E12). A cell is empty or it is filled.

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
 * A glyph in a strip cell, and the three things that happen to it.
 *
 * **M4 / M3 / M19 — arrival.** The glyph enters over 260 ms, or over 420 ms when the
 * placement was the idle ladder's (`acceptance-criteria.md` O8: *measurably slower than
 * the 260 ms of a child-initiated placement*).
 *
 * **M9 — the announcement hop.** `translateY −14`, `scale 1 → 1.14 → 1`, 90 ms apart by
 * cell. *You made a thing.*
 *
 * **M12 / C14 — the tone mark drop, onto the already-merged word.** When the text changes
 * from the blend to the marked word, the marked form cross-fades in from `scale` 1.8 and
 * `translateY` −10 over 260 ms with a 14% overshoot, while the previous form fades out
 * under it. *This mark is the thing that changed* — which only reads if the word is
 * already whole underneath it, which is why chant beat 3 merges before beat 4 marks.
 */
function CellGlyph({ text, size, arriveMs, hopSeq, hopDelay, reduced }) {
  const theme = useTheme();
  const arrive = useRef(new Animated.Value(text === null ? 0 : 1)).current;
  const drop = useRef(new Animated.Value(1)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const [previous, setPrevious] = useState(null);
  const lastText = useRef(text);
  const lastHop = useRef(hopSeq);

  useEffect(() => {
    if (text === lastText.current) return undefined;
    const was = lastText.current;
    lastText.current = text;
    if (was === null) {
      arrive.setValue(0);
      const anim = Animated.timing(arrive, {
        toValue: 1, duration: arriveMs, easing: EASING.enter, useNativeDriver: true,
      });
      anim.start();
      return () => anim.stop();
    }
    setPrevious(was);
    drop.setValue(0);
    const anim = Animated.timing(drop, {
      toValue: 1, duration: M.toneDrop, easing: EASING.enter, useNativeDriver: true,
    });
    anim.start(({ finished }) => { if (finished) setPrevious(null); });
    return () => anim.stop();
  }, [text, arriveMs, arrive, drop]);

  useEffect(() => {
    if (hopSeq === lastHop.current || hopSeq === 0) return undefined;
    lastHop.current = hopSeq;
    hop.setValue(0);
    const anim = Animated.timing(hop, {
      toValue: 1, duration: M.hop, delay: hopDelay, easing: EASING.calm, useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [hopSeq, hopDelay, hop]);

  const arriveScale = arrive.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [reduced ? 1 : 0.7, reduced ? 1 : 1.06, 1],
  });
  const dropScale = drop.interpolate({
    inputRange: [0, 0.86, 1],
    outputRange: [reduced ? 1 : 1.8, reduced ? 1 : 1.14, 1],
  });
  const dropY = drop.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : -10, 0] });
  const hopY = hop.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, reduced ? 0 : -M.hopLiftPt, 0],
  });
  const hopScale = hop.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, reduced ? 1 : 1.14, 1],
  });
  const hopOpacity = hop.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, reduced ? 0.7 : 1, 1],
  });

  return (
    <Animated.View style={{
      opacity: hopOpacity,
      transform: [{ scale: hopScale }, { translateY: hopY }],
    }}
    >
      {previous === null ? null : (
        <Animated.View style={[StyleSheet.absoluteFill, styles.centre, {
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
      </Animated.View>
    </Animated.View>
  );
}

/**
 * `ui.md` §7.2 / AC C20 — the tone is recorded in **colour, not in text**: a 5 pt dotted
 * `role3` segment under the rime's solid `role2` one. A parent can still read the shape
 * of a Vietnamese syllable off the strip; the child is never shown a word he cannot read.
 */
function ToneSegment({ width, colour }) {
  const seg = Math.round(width * 0.18);
  const gap = Math.round(width * 0.09);
  return (
    <View style={[styles.toneSeg, { width }]}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            width: seg, height: 5, borderRadius: 3, backgroundColor: colour, marginLeft: i === 0 ? 0 : gap,
          }}
        />
      ))}
    </View>
  );
}

/**
 * One cell. `ui.md` §9.2 and correction U11: the chant lights the cell's **face** with
 * `reward` gold and the glyph stays `ink`. Revision 1 turned the glyph gold — measured
 * 1.60–2.05:1, unreadable, at the single most important moment in the literacy ritual.
 * A gold block also reads across a room; a gold letter does not.
 */
function StripCell({
  cell, width, height, fontSize, role, toneRole, lit, arriveMs, hopSeq, hopDelay, outline,
  reduced, onPressIn, onPressOut,
}) {
  const theme = useTheme();
  const tokens = roleTokens(theme, role);
  const toneTokens = roleTokens(theme, toneRole);
  const gold = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(gold, {
        toValue: lit ? 1 : 0, duration: M.chantLight, easing: EASING.calm, useNativeDriver: true,
      }),
      Animated.timing(lift, {
        toValue: lit ? 1 : 0, duration: M.chantLight, easing: EASING.calm, useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [lit, gold, lift]);

  const liftScale = lift.interpolate({ inputRange: [0, 1], outputRange: [1, reduced ? 1 : 1.12] });

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      delayPressIn={0}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height }}
    >
      <Animated.View
        style={[styles.cell, {
          width,
          height,
          backgroundColor: theme.surface,
          transform: [{ scale: liftScale }],
        }]}
      >
        {/* The gold face, over the white one, cross-faded by opacity. */}
        <Animated.View
          style={[styles.inert, StyleSheet.absoluteFill, { backgroundColor: theme.reward, opacity: gold }]}
        />
        {/* **M10 — the cell's own outline is the thing that dissolves.** It is drawn as an
            overlay rather than as the cell's `borderColor`, because a colour cannot be
            animated (`acceptance-criteria.md` O3) and a border that simply switched off at
            300 ms would pop. Faded by opacity, the cells become one word. */}
        <Animated.View
          style={[styles.inert, StyleSheet.absoluteFill, {
            borderWidth: 2,
            borderRadius: 16,
            borderColor: cell.filled ? theme.hairline : theme.neutralFace,
            borderStyle: cell.filled ? 'solid' : 'dashed',
            opacity: outline,
          }]}
        />
        {cell.glyph === null
          ? <EmptyMark size={fontSize} colour={theme.neutralFace} />
          : (
            <CellGlyph
              text={cell.glyph}
              size={fontSize}
              arriveMs={arriveMs}
              hopSeq={hopSeq}
              hopDelay={hopDelay}
              reduced={reduced}
            />
          )}
        {cell.filled ? (
          <View style={[styles.underline, { width: width - 16 }]}>
            <View style={{ height: 5, borderRadius: 3, backgroundColor: tokens.face }} />
            {cell.toned ? <ToneSegment width={width - 16} colour={toneTokens.face} /> : null}
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

/**
 * The strip. `merged` is M10: the dividers dissolve and the symbols slide together into
 * one word — *these are one word*. It is driven by the chant beat the engine resolved
 * (C12a/C12b), never derived here.
 *
 * @param {object[]} cells   from `stripView`, or from the current chant beat
 * @param {number[]} lit     which cells the chant has lit **so far** — it accumulates
 */
export function WordStrip({
  cells, widths, height, fontSize, roleOf, lit, arriveMs, hopSeq, merged, reduced,
  onCellDown, onCellUp,
}) {
  const theme = useTheme();
  const dividers = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(dividers, {
        toValue: merged ? 0 : 1,
        duration: M.mergeFade,
        easing: EASING.enter,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: merged ? 1 : 0,
        duration: M.merge,
        easing: EASING.enter,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [merged, dividers, slide]);

  const isLit = (cell) => Array.isArray(lit) && lit.includes(cell.index);

  return (
    <View style={[styles.strip, { height }]}>
      {cells.map((cell, i) => {
        // M10 — the glyphs slide together. Each cell moves toward the centre of the strip
        // by a fraction of its own width; nothing animates a layout.
        const centre = (cells.length - 1) / 2;
        const toCentre = slide.interpolate({
          inputRange: [0, 1],
          outputRange: [0, reduced ? 0 : (centre - i) * Math.round(widths[i] * 0.18)],
        });
        return (
          <Animated.View
            key={`${cell.role}-${cell.index}`}
            style={{
              marginLeft: i === 0 ? 0 : 4,
              transform: [{ translateX: toCentre }],
            }}
          >
            <StripCell
              cell={cell}
              width={widths[i]}
              height={height}
              fontSize={fontSize}
              role={roleOf(cell, i)}
              toneRole="role3"
              lit={isLit(cell)}
              arriveMs={arriveMs}
              hopSeq={hopSeq}
              hopDelay={i * M.hopStagger}
              outline={dividers}
              reduced={reduced}
              onPressIn={() => onCellDown(cell.undoTo ?? cell.index)}
              onPressOut={() => onCellUp(cell.undoTo ?? cell.index)}
            />
          </Animated.View>
        );
      })}
      {/* The dividers, dissolved by opacity at M10 rather than unmounted. */}
      {cells.slice(1).map((cell, i) => {
        const left = widths.slice(0, i + 1).reduce((a, b) => a + b, 0) + (i + 1) * 4 - 2;
        return (
          <Animated.View
            key={`div-${cell.role}-${cell.index}`}
            style={[styles.inert, styles.divider, { left, backgroundColor: theme.hairline, opacity: dividers }]}
          />
        );
      })}
    </View>
  );
}

/**
 * `acceptance-criteria.md` O8 — a child's placement arrives in 260 ms; the idle ladder's
 * arrives in 420 ms, so *the app did it* reads differently from *he did it*.
 */
export function arriveMsFor(assisted) {
  return assisted ? M.autoPlaceFly : M.flight;
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
  strip: { flexDirection: 'row', alignItems: 'center' },
  cell: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  underline: { position: 'absolute', bottom: 6 },
  toneSeg: { flexDirection: 'row', marginTop: 3 },
  divider: { position: 'absolute', top: 10, bottom: 10, width: 1 },
});
