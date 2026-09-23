// The parent-facing cards that stand in for a game the app will not draw.
//
// `acceptance-criteria.md` A8 (viewport below 360 × 600), L6 (every word deleted), K9 (a
// damaged pack) and Q9 (the bundled font is missing) all land here. The rule they share
// is `development-process.md` §4: **degrade to a usable app rather than a crash**, and
// **the child never sees a blank screen** — he sees nothing at all, because what is on
// screen is addressed to the adult who can fix it.

import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { M } from '../../motion/durations.mjs';
import { AppText } from '../Text';

/**
 * **V35** — when the card is shown *instead of a board* (a viewport that cannot page this
 * pack, or a pack with nothing playable), the gate is on it. The parent can then switch
 * language or open the editor rather than being stuck with a card and no way out. It is
 * the same 1.2 s hold as on the board, so there is nothing new to learn; it is drawn as
 * an ordinary labelled control here because this is a parent surface (`ui.md` §1).
 */
export function CardScreen({ title, body, modeTitle, onOpenGate = null }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, {
      backgroundColor: theme.groundAlt,
      paddingTop: insets.top + 24,
      paddingBottom: insets.bottom + 24,
      paddingLeft: insets.left + 24,
      paddingRight: insets.right + 24,
    }]}
    >
      {modeTitle ? (
        <AppText role="modeTitle" colour={theme.inkSoft} style={styles.mode}>{modeTitle}</AppText>
      ) : null}
      <View style={styles.body}>
        <AppText role="screenTitle" style={styles.title}>{title}</AppText>
        <AppText role="body" colour={theme.inkSoft}>{body}</AppText>
      </View>
      {onOpenGate ? (
        <Pressable
          onLongPress={onOpenGate}
          delayLongPress={M.gateHold}
          accessibilityRole="button"
          accessibilityLabel="parent"
          style={[styles.gate, { borderColor: theme.hairline }]}
        >
          <AppText role="secondary" colour={theme.inkSoft}>•</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mode: { position: 'absolute', top: 12, left: 16 },
  body: { flex: 1, justifyContent: 'center', maxWidth: 520, alignSelf: 'center' },
  title: { marginBottom: 12 },
  gate: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.3,
  },
});
