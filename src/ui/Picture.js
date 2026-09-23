// The photograph — the reward, and the only picture anywhere in the child's game.
//
// `gameplay.md` §0.5: revision 1's picture frame, its veil and its N-segment border are
// deleted. The picture is not on the board, it is not a prompt, and it is not on screen
// until he has made something (`acceptance-criteria.md` B1). What is left is the image
// itself, used by the reveal, the shelf and the album.

import { Image, View } from 'react-native';

import { useTheme } from '../theme';
import { Glyph } from './Text';

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
      width,
      height,
      borderRadius: radius,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
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

/**
 * `ui.md` §9.5 — the word, large, on the photograph, with its sentence beneath it if the
 * pack has one and `Show the word` is on (F13). This is where the caption lives now: it
 * was deleted from the board, where it competed for 76 pt of a 4-year-old's screen, and
 * on the reveal it competes for nothing (correction U4).
 */
export function RevealWord({ text, sentence, size, Caption }) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{
        backgroundColor: theme.surface,
        paddingHorizontal: Math.round(size * 0.4),
        borderRadius: Math.round(size * 0.4),
      }}
      >
        <Glyph text={text} size={size} colour={theme.ink} />
      </View>
      {sentence && Caption ? (
        <View style={{ marginTop: 10 }}>
          <Caption>{sentence}</Caption>
        </View>
      ) : null}
    </View>
  );
}
