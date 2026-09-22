// The prompt. `ui.md` §7.3 and §9.4.
//
// One photograph of the target word, under a `veil` at 0.16, inside a border divided into
// N segments — one per cell this round. Segment *i* lights when cell *i* is filled
// correctly and the veil steps down by `0.16 / N` at the same moment, so **the picture
// literally gets brighter as he works**: readable across a room, with the sound off, in
// one glance (`acceptance-criteria.md` B1, B2, E1).
//
// The frame is also the game's only button (`gameplay.md` §3.3): a tap replays the word,
// an 800 ms hold speaks the parts (§2.2).

import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { EASING } from '../motion/easing';
import { M } from '../motion/durations.mjs';
import { Glyph } from './Text';

/**
 * Which edge each segment sits on. `ui.md` §7.3 says "a rounded 6 pt bar along one edge";
 * this is the assignment, chosen so two cells read as top-and-bottom rather than as two
 * bars crowded on the same side.
 */
const EDGES = {
  1: ['top'],
  2: ['top', 'bottom'],
  3: ['top', 'right', 'bottom'],
  4: ['top', 'right', 'bottom', 'left'],
};

const BAR = 6;
const INSET = 16;

function segmentStyle(edge, w, h) {
  const along = { width: w - INSET * 2, height: BAR, left: INSET };
  const down = { width: BAR, height: h - INSET * 2, top: INSET };
  if (edge === 'top') return { ...along, top: 0 };
  if (edge === 'bottom') return { ...along, bottom: 0 };
  if (edge === 'left') return { ...down, left: 0 };
  return { ...down, right: 0 };
}

function Segment({ edge, w, h, lit }) {
  const theme = useTheme();
  const on = useRef(new Animated.Value(lit ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(on, {
      toValue: lit ? 1 : 0,
      duration: M.segmentLight,
      easing: EASING.calm,
      useNativeDriver: true,
    }).start();
  }, [lit, on]);
  const box = segmentStyle(edge, w, h);
  return (
    <View pointerEvents="none" style={[styles.segment, box]}>
      {/* unlit: `ink` at 14% over the photo's edge */}
      <View style={[StyleSheet.absoluteFill, {
        backgroundColor: theme.ink, opacity: 0.14, borderRadius: BAR / 2,
      }]}
      />
      {/* lit: a `reward` fill stacked over it, cross-faded by opacity — never a colour
          animation (`acceptance-criteria.md` O3). */}
      <Animated.View
        style={[StyleSheet.absoluteFill, {
          backgroundColor: theme.reward,
          borderWidth: 2,
          borderColor: theme.rewardEdge,
          borderRadius: BAR / 2,
          opacity: on,
        }]}
      />
    </View>
  );
}

/** The photograph, or the bundled fallback picture when the pack has no image. */
export function Picture({ source, emoji, width, height, radius = 18 }) {
  const theme = useTheme();
  if (source) {
    return (
      <Image
        source={source}
        style={{ width, height, borderRadius: radius }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    );
  }
  // `content-pipeline.md` §5 — a cartoon instead of a photo, never a placeholder, never
  // an X, never a grey box. The child cannot read an error and has no idea it is not his
  // fault.
  const inset = Math.round(Math.min(width, height) * 0.16);
  return (
    <View style={{
      width, height, borderRadius: radius, backgroundColor: theme.surface,
      alignItems: 'center', justifyContent: 'center',
    }}
    >
      {emoji ? (
        <Image
          source={emoji}
          style={{ width: width - inset * 2, height: height - inset * 2 }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </View>
  );
}

export function PictureFrame({
  width, height, segments, lit, veil, source, emoji,
  onPressIn, onPressOut, accessibilityLabel,
}) {
  const theme = useTheme();
  const veilAnim = useRef(new Animated.Value(veil)).current;

  useEffect(() => {
    Animated.timing(veilAnim, {
      toValue: veil,
      duration: M.segmentLight,
      easing: EASING.calm,
      useNativeDriver: true,
    }).start();
  }, [veil, veilAnim]);

  const edges = EDGES[Math.min(4, Math.max(1, segments))] ?? EDGES[3];

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ width, height }}
    >
      <View style={{ width, height, borderRadius: 18, overflow: 'hidden' }}>
        <Picture source={source} emoji={emoji} width={width} height={height} />
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.veil, opacity: veilAnim }]}
        />
      </View>
      {edges.map((edge, i) => (
        <Segment key={edge} edge={edge} w={width} h={height} lit={Boolean(lit[i])} />
      ))}
    </Pressable>
  );
}

/** The reveal's caption: the word, large, on the picture (`ui.md` §10.4 at 1400 ms). */
export function RevealWord({ text, size }) {
  const theme = useTheme();
  return (
    <View style={styles.revealWord}>
      <View style={{
        backgroundColor: theme.surface,
        paddingHorizontal: Math.round(size * 0.4),
        borderRadius: Math.round(size * 0.4),
      }}
      >
        <Glyph text={text} size={size} colour={theme.ink} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    position: 'absolute',
    borderRadius: BAR / 2,
    overflow: 'hidden',
  },
  revealWord: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '10%',
    alignItems: 'center',
  },
});
