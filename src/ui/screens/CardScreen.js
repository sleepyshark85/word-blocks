// The parent-facing cards that stand in for a game the app will not draw.
//
// `acceptance-criteria.md` A8 (viewport below 360 × 600), L6 (every word deleted), K9 (a
// damaged pack) and Q9 (the bundled font is missing) all land here. The rule they share
// is `development-process.md` §4: **degrade to a usable app rather than a crash**, and
// **the child never sees a blank screen** — he sees nothing at all, because what is on
// screen is addressed to the adult who can fix it.

import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { AppText } from '../Text';

export function CardScreen({ title, body, modeTitle }) {
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  mode: { position: 'absolute', top: 12, left: 16 },
  body: { flex: 1, justifyContent: 'center', maxWidth: 520, alignSelf: 'center' },
  title: { marginBottom: 12 },
});
