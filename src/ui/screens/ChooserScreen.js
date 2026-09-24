// Screen: the language chooser. `ui.md` §9.6, `gameplay.md` §7.1.
//
// **The only screen in the app on which both languages appear** — the single documented
// exception to the no-mixing rule (`acceptance-criteria.md` R3).
//
// **Revision 6 makes it the child's screen, and reaches it in one tap.** It used to be
// shown exactly once, at first launch. The owner: *"I think he should be able to change
// the language himself"*, so the board's top-left control opens this same screen, with no
// gate and no hold (`ui.md` §9.4a). Two things changed here and nothing else:
//
//   1. **A panel speaks the language's own name**, `Tiếng Việt` / `English`, not a sample
//      word (A2, E23). A sample word identifies a language only to someone who already
//      knows that word *and* has connected it to a language; a 4-year-old who knows `mèo`
//      knows it is a cat. **Y33 — the clips do not exist yet, and the degradation is
//      silence**: the panel expands and says nothing, and the chooser still works.
//   2. **The confirm control is a 72 pt `▶`** (A3, Y14), not a labelled button, because
//      the child uses this screen now and `▶` is already the album's play control.
//
// Committing still takes **two touches** on every route (A3), and the reason is better
// than it was at first launch: **the first touch is the preview.** He taps, he hears
// `English`, and then he decides.
//
// **Y11 / Y12 — opened from the board, the current language's panel carries a "you are
// here" mark, and confirming it is a free return**: the board comes back with the strip,
// the shelf, the session and the audio untouched. An accidental press costs nothing,
// which is the whole reason this is a chooser and not a toggle.

import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, themeTokens } from '../../theme';
import { chooserPanels } from '../../i18n';
import { AppText, Glyph } from '../Text';
import { ThemeButtons } from '../ThemeButtons';

/** Y14 — every tappable thing on this screen is ≥ 72 pt in its smallest dimension. */
const CONFIRM = 72;
/** §9.6 — the "you are here" dot, 12 pt in `rewardEdge`. */
const HERE_DOT = 12;

/**
 * One language panel. **The confirm control is a sibling of the expand control, never a
 * child of it.** Nesting them put a `<button>` inside a `<button>` — invalid HTML, a React
 * hydration error in every browser run, and a real interaction bug underneath it: a tap on
 * the confirm bubbled to the panel and re-fired `onExpand`, so the clip spoke again at the
 * moment the language was committed. The frame is a plain `View`; the two touches A2 and
 * A3 ask for are two separate targets inside it.
 */
function Panel({ panel, expanded, here, themeId, onExpand, onConfirm }) {
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
        accessibilityState={{ expanded, selected: here }}
        style={styles.panelBody}
      >
        <Glyph text={panel.title} size={32} colour={theme.ink} />
        <AppText role="secondary" colour={theme.inkSoft}>{panel.subtitle}</AppText>
      </Pressable>
      {/* **Y11** — drawn only when the chooser was opened from the board. At first launch
          there is no *here* yet, and neither panel carries it. */}
      {here ? (
        <View style={[styles.here, styles.inert, { backgroundColor: theme.rewardEdge }]} />
      ) : null}
      {expanded ? (
        <View style={styles.confirmRow}>
          <Pressable
            onPress={() => onConfirm(panel.language)}
            accessibilityRole="button"
            accessibilityLabel={panel.start}
            style={[styles.confirm, { backgroundColor: theme.accentFace }]}
          >
            {/* A symbol he has met: it is the album's play control, the same figure. */}
            <AppText role="screenTitle" colour={theme.groundAlt}>▶</AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function ChooserScreen({ current = null, themeId, onSelectTheme, onSample, onConfirm }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(null);

  // A2: a tap expands the panel and **speaks the language's own name**, and no language is
  // committed. A4: a theme tap re-renders and commits nothing.
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
            here={panel.language === current}
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
  /** The style key, never the deprecated prop: the mark is decoration, not a target. */
  inert: { pointerEvents: 'none' },
  root: { flex: 1, justifyContent: 'space-between' },
  panels: { flex: 1, justifyContent: 'center' },
  panel: {
    borderRadius: 22,
    overflow: 'hidden',
    marginVertical: 12,
  },
  band: { height: 14 },
  panelBody: { padding: 20, alignItems: 'center', minHeight: CONFIRM },
  here: {
    position: 'absolute',
    top: 14 + 12,
    right: 16,
    width: HERE_DOT,
    height: HERE_DOT,
    borderRadius: HERE_DOT / 2,
  },
  confirmRow: { alignItems: 'center', paddingBottom: 20 },
  confirm: {
    width: CONFIRM,
    height: CONFIRM,
    borderRadius: CONFIRM / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themes: { alignSelf: 'center' },
});
