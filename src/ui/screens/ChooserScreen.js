// Screen: the first-launch chooser. `ui.md` §9.6, `gameplay.md` §7.1.
//
// **The only screen in the app on which both languages appear** — the single documented
// exception to the no-mixing rule (`acceptance-criteria.md` R3). It is shown exactly once.
//
// Committing takes **two touches, seconds apart** (A2, A3): a tap expands a panel and
// speaks a sample word in that language; the confirm control under it commits. A toddler
// who grabs the device on first launch cannot commit by accident, and if he does, a parent
// changes it in twenty seconds.

import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, themeTokens } from '../../theme';
import { chooserPanels } from '../../i18n';
import { AppText, Glyph } from '../Text';
import { ThemeButtons } from '../ThemeButtons';

/**
 * One language panel. **The confirm control is a sibling of the expand control, never a
 * child of it.** Nesting them put a `<button>` inside a `<button>` — invalid HTML, a React
 * hydration error in every browser run, and a real interaction bug underneath it: a tap on
 * *Bắt đầu* bubbled to the panel and re-fired `onExpand`, so the sample word spoke again
 * at the moment the language was committed. The frame is a plain `View`; the two touches
 * A2 and A3 ask for are two separate targets inside it.
 */
function Panel({ panel, expanded, themeId, onExpand, onConfirm }) {
  const theme = useTheme();
  const tokens = themeTokens(themeId);
  return (
    <View
      style={[styles.panel, {
        backgroundColor: theme.surface,
        borderColor: expanded ? tokens.role1 : theme.hairline,
        borderWidth: expanded ? 3 : 1,
      }]}
    >
      <View style={[styles.band, { backgroundColor: tokens.role1 }]} />
      <Pressable
        onPress={() => onExpand(panel.language)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={styles.panelBody}
      >
        <Glyph text={panel.title} size={32} colour={theme.ink} />
        <AppText role="secondary" colour={theme.inkSoft}>{panel.subtitle}</AppText>
      </Pressable>
      {expanded ? (
        <View style={styles.confirmRow}>
          <Pressable
            onPress={() => onConfirm(panel.language)}
            accessibilityRole="button"
            style={[styles.confirm, { backgroundColor: theme.accentFace }]}
          >
            <AppText role="button" colour={theme.groundAlt}>{panel.start}</AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function ChooserScreen({ themeId, onSelectTheme, onSample, onConfirm }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(null);

  // A2: a tap expands the panel and **speaks a sample word in that language**, and no
  // language is committed. A4: a theme tap re-renders and commits nothing.
  const expand = (language) => {
    setExpanded(language);
    onSample(language);
  };

  return (
    <View style={[styles.root, {
      backgroundColor: theme.ground,
      paddingTop: insets.top + 24,
      paddingBottom: insets.bottom + 24,
      paddingLeft: insets.left + 24,
      paddingRight: insets.right + 24,
    }]}
    >
      <View style={styles.panels}>
        {chooserPanels().map((panel) => (
          <Panel
            key={panel.language}
            panel={panel}
            expanded={expanded === panel.language}
            themeId={themeId}
            onExpand={expand}
            onConfirm={onConfirm}
          />
        ))}
      </View>
      <ThemeButtons size={56} selected={themeId} onSelect={onSelectTheme} style={styles.themes} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'space-between' },
  panels: { flex: 1, justifyContent: 'center' },
  panel: {
    borderRadius: 22,
    overflow: 'hidden',
    marginVertical: 12,
  },
  band: { height: 14 },
  panelBody: { padding: 20, alignItems: 'center' },
  confirmRow: { alignItems: 'center', paddingBottom: 20 },
  confirm: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    minHeight: 44,
    justifyContent: 'center',
  },
  themes: { alignSelf: 'center' },
});
