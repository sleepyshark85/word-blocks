// The chrome every parent surface wears. `ui.md` §1 and §13.
//
// The game and the parent surfaces "must not be confusable, by anyone, including the
// tester. That is why they share only the colour tokens and nothing else." So: `groundAlt`
// (white) rather than the theme's bright ground, Be Vietnam Pro rather than Baloo 2, a
// back chevron and a title on **every** screen, and the mode title in the corner as the
// leak detector (`acceptance-criteria.md` I10, P13, R7).
//
// On a tablet it renders as a centred **520 pt column**, not a stretched form (J13).

import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { AppText } from '../Text';

export const PARENT_COLUMN = 520;

export function ParentScreen({ title, modeTitle, onBack, children }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const columnWidth = Math.min(PARENT_COLUMN, width - insets.left - insets.right - 32);

  return (
    <View style={[styles.root, {
      backgroundColor: theme.groundAlt,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }]}
    >
      <View style={styles.bar}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          hitSlop={12}
          style={styles.chevron}
        >
          <AppText role="screenTitle" colour={theme.ink}>‹</AppText>
        </Pressable>
        <AppText role="modeTitle" colour={theme.inkSoft}>{modeTitle}</AppText>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ width: columnWidth }}>
          <AppText role="screenTitle" style={styles.title}>{title}</AppText>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

export function Row({ label, detail, onPress, first }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.row, {
        borderTopWidth: first ? 0 : 1,
        borderColor: theme.hairline,
      }]}
    >
      <AppText role="body">{label}</AppText>
      {detail ? <AppText role="secondary" colour={theme.inkSoft}>{detail}</AppText> : null}
    </Pressable>
  );
}

export function PrimaryButton({ label, onPress, disabled }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={[styles.primary, {
        backgroundColor: theme.accentFace,
        opacity: disabled ? 0.45 : 1,
      }]}
    >
      <AppText role="button" colour={theme.groundAlt}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  chevron: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  scroll: { alignItems: 'center', paddingBottom: 32 },
  title: { marginBottom: 16 },
  row: {
    minHeight: 56,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primary: {
    marginTop: 24,
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
