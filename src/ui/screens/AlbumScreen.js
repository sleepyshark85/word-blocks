// Screen: the album page, and the end screen. `ui.md` §9.6, `gameplay.md` §6.6–6.7.
//
// The album page is **the designed stopping point**. After the fifth round play stops and
// does not resume by itself; negotiating an exit mid-round is a tantrum, negotiating it
// here is "we finished the page".
//
// The end screen is the same grid with the play card removed. That *is* the mechanism:
// the device can be handed back to the child with something pleasant to look at and no
// way to restart, and restarting requires the gate (`acceptance-criteria.md` H9, H10).
//
// Neither screen shows a score, a star, a count or a "5 of 5". There is nothing in this
// file that could render one (F7, H4).

import { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { EASING } from '../../motion/easing';
import { M } from '../../motion/durations.mjs';
import { Picture } from '../PictureFrame';
import { TopBar } from '../TopBar';
import { ThemeButtons } from '../ThemeButtons';
import { Glyph } from '../Text';

/** M17 — the cards arrive 320 ms each, 90 ms apart. *Here is everything you made.* */
function Card({ index, size, source, emoji, dim, reduced, onPress }) {
  const theme = useTheme();
  const enter = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: M.albumCard,
      delay: index * M.albumStagger,
      easing: EASING.enter,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [enter, index]);

  const tap = () => {
    onPress();
    const anim = Animated.sequence([
      Animated.timing(bounce, { toValue: 1, duration: 120, easing: EASING.enter, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0, duration: 180, easing: EASING.calm, useNativeDriver: true }),
    ]);
    anim.start();
  };

  const scale = Animated.add(
    enter.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 1 : 0.82, 1] }),
    bounce.interpolate({ inputRange: [0, 1], outputRange: [0, reduced ? 0 : 0.04] }),
  );

  return (
    <Pressable onPress={onPress ? tap : undefined} disabled={!onPress} style={{ margin: 10 }}>
      <Animated.View style={{
        opacity: dim ? Animated.multiply(enter, 0.7) : enter,
        transform: [{ scale }],
      }}
      >
        <View style={[styles.card, { borderColor: theme.hairline, backgroundColor: theme.surface }]}>
          <Picture source={source} emoji={emoji} width={size} height={size} radius={16} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

/** The one control on the album page: a photo-shaped card with a play chevron. */
function PlayCard({ size, onPress }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.playCard, {
        width: size,
        height: Math.round(size * 0.62),
        backgroundColor: theme.accentFace,
      }]}
    >
      <Glyph text="▶" size={Math.round(size * 0.28)} colour={theme.groundAlt} />
    </Pressable>
  );
}

export function AlbumScreen({
  entries, strings, themeId, onSelectTheme, onPlay, onTapEntry, onOpenGate, reduced, sourceFor,
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // `ui.md` §9.6 — 2 + 2 + 1 in portrait, 3 + 2 in landscape. The wrap is forced by
  // capping the grid's width at `perRow` cards, because flex-wrap on its own would fit
  // as many as the screen allows and a tablet would silently render 3 + 2 in portrait.
  const perRow = width > height ? 3 : 2;
  const usable = width - insets.left - insets.right - 48;
  const size = Math.min(220, Math.floor(usable / perRow) - 24);
  // card + its 2 pt border on each side + its 10 pt margin on each side
  const gridWidth = perRow * (size + 24);

  return (
    <View style={[styles.root, {
      backgroundColor: theme.ground,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }]}
    >
      <View style={{ height: 4, backgroundColor: theme.role1 }} />
      <View style={{ alignItems: 'center' }}>
        <TopBar
          width={width - insets.left - insets.right - 32}
          title={strings.modeTitle}
          rail={null}
          reduced={reduced}
          onOpenGate={onOpenGate}
        />
      </View>

      <ScrollView style={styles.scrollFill} contentContainerStyle={styles.scroll}>
        <View style={[styles.grid, { width: gridWidth }]}>
          {entries.map((entry, i) => (
            <Card
              key={`${entry.wordId}-${i}`}
              index={i}
              size={size}
              source={sourceFor(entry.image)}
              emoji={sourceFor.emoji(entry.fallbackEmoji)}
              dim={!onPlay}
              reduced={reduced}
              onPress={onTapEntry ? () => onTapEntry(entry) : null}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {onSelectTheme
          ? <ThemeButtons size={44} selected={themeId} onSelect={onSelectTheme} />
          : <View />}
        {onPlay ? <PlayCard size={Math.min(180, size)} onPress={onPlay} /> : <View />}
        <View style={{ width: 44 * 3 + 24 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollFill: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { borderRadius: 18, borderWidth: 2, overflow: 'hidden' },
  playCard: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
});
