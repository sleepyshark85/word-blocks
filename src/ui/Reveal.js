// The reveal — the payoff of the whole loop, and the **only** picture in the child's game.
//
// `ui.md` §9.5, §10.4; `gameplay.md` §5.3. The picture scales and translates **from the
// word strip's rectangle** to full screen, so the word he made visibly becomes the thing
// it means. That is the whole design in one motion (M13).
//
// Every mark on this timeline is owned by the state layer, not by this component: it is
// handed `phase` and replays it. A dropped frame therefore cannot change when the word is
// spoken or when the board returns, which is the whole of `development-process.md` §3's
// third rule.
//
// `acceptance-criteria.md` F12: no number, score, star, percentage, "well done" count or
// streak appears here. There is nothing in this file that could render one.

import { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { EASING } from '../motion/easing';
import { M, REVEAL } from '../motion/durations.mjs';
import { Picture, RevealWord } from './Picture';

/** M20 — 12 soft shapes in the mode accent and `reward`, drifting outward and fading. */
function Confetti({ width, height, seq }) {
  const theme = useTheme();
  const drift = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    return {
      key: `c${i}`,
      dx: Math.cos(angle) * width * 0.46,
      dy: Math.sin(angle) * height * 0.38,
      colour: [theme.role1, theme.role2, theme.reward][i % 3],
      size: 12 + (i % 3) * 5,
    };
  }), [width, height, theme]);

  useEffect(() => {
    drift.setValue(0);
    const anim = Animated.timing(drift, {
      toValue: 1,
      duration: 900,
      easing: EASING.exit,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [drift, seq]);

  const fade = drift.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.9, 0] });

  return (
    <View style={[styles.inert, StyleSheet.absoluteFill, styles.centre]}>
      {pieces.map((p) => (
        <Animated.View
          key={p.key}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: p.size / 3,
            backgroundColor: p.colour,
            opacity: fade,
            transform: [
              { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] }) },
              { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, p.dy] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

/**
 * @param {object} reveal      from the state layer: `{ phase, image, text, bounceSeq }`
 * @param {object} stripRect   where the strip is, so M13 can start from it
 */
export function Reveal({
  reveal, width, height, stripRect, wordSize, sources, sentence, showWord, reduced,
  Caption, onTap,
}) {
  const theme = useTheme();
  const rise = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const out = useRef(new Animated.Value(0)).current;
  const lastBounce = useRef(reveal.bounceSeq);

  useEffect(() => {
    // M13 — `scale` and `translate` from the strip's rectangle to full screen, never
    // width/height (`acceptance-criteria.md` O3). Under reduce-motion it is a 300 ms
    // cross-fade with no scale and no confetti (O4), and **the audio is identical**.
    const anim = Animated.timing(rise, {
      toValue: 1,
      duration: reduced ? 300 : REVEAL.fullBleed,
      easing: EASING.enter,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [rise, reduced]);

  useEffect(() => {
    if (reveal.phase !== 'flying') return undefined;
    // M15 — the picture flies into the shelf slot. *That one is kept.*
    const anim = Animated.timing(out, {
      toValue: 1,
      duration: M.shelfFly,
      easing: EASING.exit,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reveal.phase, out]);

  useEffect(() => {
    if (reveal.bounceSeq === lastBounce.current) return undefined;
    lastBounce.current = reveal.bounceSeq;
    // F10 — the picture bounces 1.04x on every tap and turns to the next photograph.
    const anim = Animated.sequence([
      Animated.timing(bounce, { toValue: 1, duration: REVEAL.bounce, easing: EASING.enter, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0, duration: REVEAL.bounceBack, easing: EASING.calm, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [reveal.bounceSeq, bounce]);

  // The card starts the size and place of the word strip and ends full-bleed.
  const startScale = stripRect && stripRect.width > 0
    ? Math.max(0.12, Math.min(1, stripRect.width / width))
    : 0.5;
  const startY = stripRect ? stripRect.y - height / 2 : 0;

  const scale = Animated.add(
    Animated.add(
      rise.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 1 : startScale, 1] }),
      bounce.interpolate({ inputRange: [0, 1], outputRange: [0, reduced ? 0 : 0.04] }),
    ),
    out.interpolate({ inputRange: [0, 1], outputRange: [0, reduced ? 0 : -0.92] }),
  );
  const translateY = Animated.add(
    rise.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : startY, 0] }),
    out.interpolate({ inputRange: [0, 1], outputRange: [0, reduced ? 0 : startY] }),
  );
  const opacity = Animated.multiply(rise, out.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }));

  return (
    <Pressable style={[StyleSheet.absoluteFill, styles.centre]} onPress={onTap}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.ground }]} />
      <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
        <Picture
          source={sources.image}
          emoji={sources.emoji}
          width={width}
          height={height}
          radius={24}
        />
        {/* `acceptance-criteria.md` F13 — the word and its sentence, under the picture,
            if `Show the word` is on. Off, neither is shown and nothing else differs. */}
        {showWord ? (
          <View style={styles.word}>
            <RevealWord text={reveal.text} sentence={sentence} size={wordSize} Caption={Caption} />
          </View>
        ) : null}
      </Animated.View>
      {!reduced && reveal.phase !== 'flying'
        ? <Confetti width={width} height={height} seq={reveal.bounceSeq} />
        : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /** See `Tile.js` — the style key, not the deprecated prop. */
  inert: { pointerEvents: 'none' },
  centre: { alignItems: 'center', justifyContent: 'center' },
  word: { position: 'absolute', left: 0, right: 0, bottom: '8%', alignItems: 'center' },
});
