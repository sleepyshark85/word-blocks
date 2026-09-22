// The reveal — the payoff moment of the app. `ui.md` §10.4, `gameplay.md` §5.3.
//
// "The picture stops being a thumbnail and becomes the room."
//
// Every mark on this timeline is owned by the state layer, not by this component: it is
// handed `phase` and `photoSwapped` and replays them. A dropped frame therefore cannot
// change when the word is spoken or when the next round begins, which is the whole of
// `development-process.md` §3's third rule.
//
// `acceptance-criteria.md` F7: no number, score, star, percentage, "well done" count or
// streak appears here. There is nothing in this file that could render one.

import { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { EASING } from '../motion/easing';
import { REVEAL } from '../motion/durations.mjs';
import { Picture, RevealWord } from './PictureFrame';
import { CaptionText } from './Text';

/** `ui.md` §10.4 — eight soft shapes in `role1`/`role2`/`reward`, drifting outward. */
function Confetti({ width, height }) {
  const theme = useTheme();
  const drift = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(() => Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    return {
      key: `c${i}`,
      dx: Math.cos(angle) * width * 0.42,
      dy: Math.sin(angle) * height * 0.34,
      colour: [theme.role1, theme.role2, theme.reward][i % 3],
      size: 12 + (i % 3) * 5,
    };
  }), [width, height, theme]);

  useEffect(() => {
    const anim = Animated.timing(drift, {
      toValue: 1,
      duration: REVEAL.confettiTo - REVEAL.confettiFrom,
      delay: REVEAL.confettiFrom,
      easing: EASING.exit,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [drift]);

  const fade = drift.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.9, 0] });

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.centre]}>
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

/** `ui.md` §10.4 at 420 ms — a radial light sprite, `scale` 0.4 → 1.6, α 0.55 → 0. */
function LightSprite({ size }) {
  const theme = useTheme();
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(t, {
      toValue: 1,
      duration: REVEAL.lightSprite,
      delay: REVEAL.fullBleed,
      easing: EASING.exit,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.reward,
        opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
        transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.6] }) }],
      }}
    />
  );
}

export function Reveal({
  reveal, width, height, wordSize, tile, sources, emoji, reduced, caption, onTap,
}) {
  const theme = useTheme();
  const rise = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0.22)).current;
  const bounce = useRef(new Animated.Value(0)).current;
  const lastBounce = useRef(reveal.bounceSeq);

  useEffect(() => {
    // M12 — the card scales and translates toward full-bleed. `scale` and `translate`,
    // never width/height (`acceptance-criteria.md` O3). Under reduce-motion it is a
    // 300 ms cross-fade with no scale and no sprites (O4), and the *audio is identical*.
    const anim = Animated.timing(rise, {
      toValue: 1,
      duration: reduced ? 300 : REVEAL.fullBleed,
      easing: EASING.enter,
      useNativeDriver: true,
    });
    const flashAnim = Animated.timing(flash, {
      toValue: 0, duration: REVEAL.flash, easing: EASING.exit, useNativeDriver: true,
    });
    anim.start();
    flashAnim.start();
    return () => { anim.stop(); flashAnim.stop(); };
  }, [rise, flash, reduced]);

  useEffect(() => {
    if (reveal.bounceSeq === lastBounce.current) return undefined;
    lastBounce.current = reveal.bounceSeq;
    // F5 — the picture bounces 1.04x on every tap.
    const anim = Animated.sequence([
      Animated.timing(bounce, { toValue: 1, duration: 120, easing: EASING.enter, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0, duration: 180, easing: EASING.calm, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [reveal.bounceSeq, bounce]);

  const scale = Animated.add(
    rise.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 1 : 0.86, 1] }),
    bounce.interpolate({ inputRange: [0, 1], outputRange: [0, reduced ? 0 : 0.04] }),
  );

  const source = reveal.photoSwapped ? sources.reveal : sources.prompt;

  return (
    <Pressable style={[StyleSheet.absoluteFill, styles.centre]} onPress={onTap}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.ground }]} />
      <Animated.View style={{ opacity: rise, transform: [{ scale }] }}>
        <Picture source={source} emoji={emoji} width={width} height={height} radius={24} />
        {reveal.phase === 'held' || reveal.phase === 'running' ? (
          <RevealWord text={reveal.wordText} size={wordSize} />
        ) : null}
      </Animated.View>
      {!reduced ? <LightSprite size={Math.max(width, height)} /> : null}
      {!reduced ? <Confetti width={width} height={height} /> : null}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: theme.groundAlt, opacity: reduced ? 0 : flash }]}
      />
      {caption ? (
        <View style={styles.caption}>
          <CaptionText tile={tile}>{caption}</CaptionText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: 'center', justifyContent: 'center' },
  caption: { position: 'absolute', left: 16, right: 16, bottom: 16 },
});
