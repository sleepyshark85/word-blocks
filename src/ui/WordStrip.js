// The word strip — where the word is assembled, and the only undo in the game.
//
// **Rewritten in revision 5** (`ui.md` §7.2, §9.2, §9.3). A word is now three to six taps
// and the onset may be two or three of them, so the strip has to say three things it never
// had to say before — *these letters are one sound*, *the next part of the word starts
// here*, and *this could end now, or it could go on* — with **no text**, and **without
// ever merging a cell into another**, which is the morph the owner rejected in revision 3.
//
//   empty        ╎ · ╎                        one dashed cell, one centred dot
//   c            │ c │╎ · ╎                   one cell, one bar, 5 pt role1 SOLID
//   c h          │ c │ h │╎ · ╎               THE BAR GREW (M22). Nothing merged.
//   c h o        │ c │ h │┃│ o │╎ · ╎         the bar BROKE, changed pattern, and a
//                                             2 pt divider faded in (M24)
//   c h ó        │ c │ h │┃│ ó │              the mark landed ON the carrier vowel
//   announcing   │      chó      │            chant beat 3 ONLY — the one merge left
//
// **Three redundant channels mark a sound boundary** (§7.2.2, AC X20, X23): the bar
// *breaks* (a 10 pt gap), the bar *changes pattern and colour* (solid `role1` → split
// `role2`), and a 2 pt `neutralFace` *divider* fades in. Two of the three survive
// greyscale, which is what X23 asks for.
//
// **The track never resizes and nothing that is seated ever moves** (X1, X3, X39). Six
// slots are reserved on every device in both languages, sized once at startup from the
// layout law, and only the used ones are drawn. Slot *k* is at the same x for every word.
// Left-aligned rather than centred, because centring would slide every seated letter left
// on each new tap — motion that says nothing and contradicts "nothing you have placed ever
// moves". This is writing; writing starts at the left margin.
//
// **The strip is ONE touch target, not six** (X9, D4, E8): a tap returns the last symbol,
// a hold of 800 ms is the parts hint, and there is no third gesture. That is geometry, not
// taste — five 72 pt cells need 392 pt and the 360 dp floor has 328 (`ui.md` §7.2.6).
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
 * **X28 / X33 — the mark-slot.** A dashed diacritic placeholder **above the carrier
 * vowel**, and *no extra cell*, because the mark lands on the rime rather than in a cell
 * of its own. It fades in over 180 ms by opacity only and disappears the instant the rime
 * stops being complete.
 *
 * It is drawn as a small dashed ring rather than as a floating tone mark: a real mark
 * would be a *claim about which tone*, and he has not chosen one.
 */
function MarkSlot({ size, colour, reduced }) {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(fade, {
      toValue: 1, duration: M.markSlotFade, easing: EASING.calm, useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [fade]);
  const d = Math.max(8, Math.round(size * 0.26));
  return (
    <Animated.View
      style={[styles.inert, styles.markSlot, {
        width: d,
        height: Math.round(d * 0.55),
        // Above the glyph, where the mark will land — not beside it and not in a cell of
        // its own, because the mark lands on the rime (X28).
        top: Math.round(size * 0.12),
        borderRadius: d,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: colour,
        opacity: reduced ? 1 : fade,
      }]}
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
 * **M12 / C14 — the tone mark drop.** When the text changes from the blend to the marked
 * word, the marked form cross-fades in from `scale` 1.8 and `translateY` −10 over 260 ms
 * with a 14% overshoot, while the previous form fades out under it. *This mark is the
 * thing that changed* — which only reads if the word is already whole underneath it,
 * which is why chant beat 3 merges before beat 4 marks.
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
 * `ui.md` §7.2 / AC C20, X16 — the tone is recorded in **colour, not in text**: a 5 pt
 * dotted `role3` segment under the vowel span's split one. A parent can still read the
 * shape of a Vietnamese syllable off the strip; the child is never shown a word he cannot
 * read.
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
 * **The span bar — revision 5's new object** (`ui.md` §9.2, AC X10, X12, X15, X16, X18).
 *
 * It is not a property of a cell; it is a property of a **run of cells that are one
 * sound**, which is what carries the whole explanation: *these letters say one thing*.
 *
 *   * **M22, the tie.** When the span grows, the bar reveals by `scaleX` from
 *     `old / new` to 1, **anchored at its left edge**, over 220 ms. It *reaches out from
 *     under the letter he already placed to under the one he just placed.*
 *   * **M24, the break.** A span that starts is a new bar in the other colour and pattern,
 *     fading in with the arriving cell — deliberately the visual opposite.
 *
 * `scaleX` on a left-anchored box, never a width: `acceptance-criteria.md` O1/O3 forbid
 * animating a layout property, and `transformOrigin` is not portable, so the anchor is a
 * half-width translate either side of the scale.
 */
function SpanBar({
  width, height, colour, pattern, cells, reduced,
}) {
  const grow = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const lastCells = useRef(cells);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      // M24 — a bar that has just appeared fades in with its cell rather than growing
      // from nothing, so *a new part starts here* cannot be read as *the last one grew*.
      fade.setValue(0);
      const anim = Animated.timing(fade, {
        toValue: 1, duration: M.dividerFade, easing: EASING.enter, useNativeDriver: true,
      });
      anim.start();
      return () => anim.stop();
    }
    if (cells === lastCells.current) return undefined;
    const from = lastCells.current / cells;
    lastCells.current = cells;
    // A span only ever grows by a tap or shrinks by an undo; both are the same animation,
    // run from wherever the bar was (X12, X18).
    grow.setValue(reduced ? 1 : from);
    const anim = Animated.timing(grow, {
      toValue: 1, duration: M.spanGrow, easing: EASING.enter, useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [cells, grow, fade, reduced]);

  const anchored = grow.interpolate({
    inputRange: [0, 1],
    outputRange: [-(width / 2), 0],
  });
  const style = {
    width,
    height,
    opacity: fade,
    transform: [{ translateX: anchored }, { scaleX: grow }],
  };
  if (pattern === 'split') {
    const seg = (width - width * 0.08) / 2;
    return (
      <Animated.View style={[styles.inert, styles.barRow, style]}>
        <View style={{ width: seg, height, borderRadius: 3, backgroundColor: colour }} />
        <View style={{ width: width * 0.08, height }} />
        <View style={{ width: seg, height, borderRadius: 3, backgroundColor: colour }} />
      </Animated.View>
    );
  }
  return (
    <Animated.View style={[styles.inert, style, {
      borderRadius: 3, backgroundColor: colour,
    }]}
    />
  );
}

/**
 * One cell. `ui.md` §9.2 and correction U11: the chant lights the cell's **face** with
 * `reward` gold and the glyph stays `ink`. Revision 1 turned the glyph gold — measured
 * 1.60–2.05:1, unreadable, at the single most important moment in the literacy ritual.
 * A gold block also reads across a room; a gold letter does not.
 *
 * **X14 / C12f — the gold is per cell and never a plate across a span.** A `neutralFace`
 * divider measures 1.58–2.12:1 on `reward` (§5.8b), so the gaps stay on the ground.
 */
function StripCell({
  cell, width, height, fontSize, lit, arriveMs, hopSeq, hopDelay, outline, reduced,
}) {
  const theme = useTheme();
  const toneTokens = roleTokens(theme, 'role3');
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
      {cell.markSlot ? <MarkSlot size={fontSize} colour={theme.neutralFace} reduced={reduced} /> : null}
      {cell.toned ? (
        <View style={[styles.toneUnder, { width: width - 16 }]}>
          <ToneSegment width={width - 16} colour={toneTokens.face} />
        </View>
      ) : null}
    </Animated.View>
  );
}

/**
 * The drawn cells, grouped into **spans** — the object the whole strip is built around.
 * The dashed next-cell is its own group with no bar: it is not a character and is not
 * part of any sound (X32).
 */
function groupsOf(cells) {
  const groups = [];
  for (const cell of cells) {
    const last = groups[groups.length - 1];
    if (last && cell.filled && last.role !== null && last.key === cell.span) {
      last.cells.push(cell);
      continue;
    }
    groups.push({
      key: cell.filled ? cell.span : `next-${cell.index}`,
      start: cell.index,
      role: cell.filled ? cell.spanRole : null,
      cells: [cell],
    });
  }
  return groups;
}

/**
 * **One sound.** Its cells, side by side and never merging, and the bar under them.
 *
 * **M23 — the re-voice** (`ui.md` §7.2.3, AC X13, X14): when a letter joins this span,
 * **both cells pulse together**, one `scale` 1 → 1.08 → 1 on *this container*, so they
 * move as one body. It is the only animation in the app that re-animates something
 * already seated, and that is precisely its meaning: *this sound is these two, and the one
 * you heard a moment ago is gone.* A pulse on the new cell alone would say *h arrived*.
 *
 * **It is motion, not gold** (X14): the `reward` face is reserved for a finished word, and
 * a span being built can still carry a `neutralFace` divider or mark-slot, both of which
 * measure 1.58–2.12:1 on gold (§5.8b).
 */
function SpanGroup({
  group, cellW, cellH, gap, trackW, fontSize, isLit, arriveMs, hopSeq, outline, slide,
  merged, reduced,
}) {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;
  const lastCount = useRef(group.cells.length);
  const mounted = useRef(false);

  useEffect(() => {
    const count = group.cells.length;
    const grew = mounted.current && count > lastCount.current;
    mounted.current = true;
    lastCount.current = count;
    if (!grew) return undefined;
    pulse.setValue(0);
    const anim = Animated.timing(pulse, {
      toValue: 1, duration: M.revoice, easing: EASING.pop, useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [group.cells.length, pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, reduced ? 1 : 1.08, 1],
  });
  // Under reduce-motion M23 is an α 1 → 0.75 → 1 pulse on both cells together, same
  // duration, so audio sync and every criterion above still hold (X40).
  const opacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, reduced ? 0.75 : 1, 1],
  });
  const only = group.cells[0];
  const wide = only.merged;
  const width = wide ? trackW : group.cells.length * cellW + (group.cells.length - 1) * gap;
  // M10 — the cells close up their gaps, each translating left by `k × gap`, and **the
  // leftmost does not move** (X26).
  const closeUp = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, reduced || merged === false ? 0 : -group.start * gap],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: group.start * (cellW + gap),
        width,
        transform: [{ translateX: closeUp }, { scale }],
        opacity,
      }}
    >
      <View style={styles.row}>
        {group.cells.map((cell, i) => (
          <View key={cell.index} style={{ marginLeft: i === 0 ? 0 : gap }}>
            <StripCell
              cell={cell}
              width={cell.merged ? trackW : cellW}
              height={cellH}
              fontSize={fontSize}
              lit={isLit(cell)}
              arriveMs={arriveMs}
              hopSeq={hopSeq}
              hopDelay={cell.index * M.hopStagger}
              outline={outline}
              reduced={reduced}
            />
          </View>
        ))}
      </View>
      {group.role === null || only.merged ? null : (
        <View style={[styles.inert, styles.barWrap, { width }]}>
          <SpanBar
            width={width}
            height={5}
            colour={roleTokens(theme, group.role).face}
            pattern={group.role === 'role2' ? 'split' : 'solid'}
            cells={group.cells.length}
            reduced={reduced}
          />
        </View>
      )}
    </Animated.View>
  );
}

/**
 * The strip.
 *
 * `merged` is M10, chant beat 3: the dividers dissolve and the cells close up their gaps
 * — **the only merge in the app, and it happens after the word is already made** (X26).
 * It is driven by the chant beat the engine resolved (C12a/C12b), never derived here.
 *
 * @param {object[]} cells   from `stripView`, or from the current chant beat
 * @param {number[]} lit     which cells the chant has lit **so far** — it accumulates
 */
export function WordStrip({
  cells, cellW, cellH, gap, slots, fontSize, lit, arriveMs, hopSeq, merged, reduced,
  onStripDown, onStripUp,
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
  // X1 — six slots are reserved on every device, and only the used ones are drawn (X2).
  // A merged word takes the whole track; every other cell is the one width the layout law
  // computed, so slot *k* is at the same x for every word (X3).
  const trackW = slots * cellW + (slots - 1) * gap;
  const groups = groupsOf(cells);

  return (
    // X9 / D4 / E8 — **one target.** Tap returns the last symbol; an 800 ms hold is the
    // parts hint (§2.2). There is no third gesture and no per-cell hit rect.
    <Pressable
      onPressIn={onStripDown}
      onPressOut={onStripUp}
      delayPressIn={0}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.strip, { width: trackW, height: cellH + 16 }]}
    >
      {groups.map((group) => (
        <SpanGroup
          key={`span-${group.key}-${group.start}`}
          group={group}
          cellW={cellW}
          cellH={cellH}
          gap={gap}
          trackW={trackW}
          fontSize={fontSize}
          isLit={isLit}
          arriveMs={arriveMs}
          hopSeq={hopSeq}
          outline={dividers}
          slide={slide}
          merged={merged}
          reduced={reduced}
        />
      ))}

      {/* **The divider** (X20, X22, X25): 2 pt, half the cell height, `neutralFace`,
          centred in the cell gap, faded in over 180 ms. It is drawn **only** at a sound
          boundary — revision 4's hairline between every pair of cells is gone, so a line
          between two letters now means one thing and nothing else. */}
      {cells.filter((c) => c.dividerBefore).map((cell) => (
        <Animated.View
          key={`div-${cell.index}`}
          style={[styles.inert, styles.divider, {
            left: cell.index * (cellW + gap) - Math.round(gap / 2) - 1,
            height: Math.round(cellH * 0.5),
            top: Math.round(cellH * 0.25) + 8,
            backgroundColor: theme.neutralFace,
            opacity: dividers,
          }]}
        />
      ))}
    </Pressable>
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
  strip: { position: 'relative', justifyContent: 'center' },
  cell: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  barRow: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  barWrap: { alignItems: 'flex-start', marginTop: 3 },
  markSlot: { position: 'absolute', alignSelf: 'center' },
  toneUnder: { position: 'absolute', bottom: 2 },
  toneSeg: { flexDirection: 'row' },
  divider: { position: 'absolute', width: 2, borderRadius: 1 },
});
