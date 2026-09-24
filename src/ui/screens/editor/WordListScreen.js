// Screen S9 — the word list (`ui.md` §13.1).
//
// **The rule this screen exists to hold is J2**: *a word that cannot yet be played
// appears in a named section with a one-line reason — never hidden and never deleted.*
// Nothing she types is ever thrown away, and a word that is not ready is a row with a
// sentence beside it rather than an absence she has to notice.
//
// The reason comes from `src/editor/list.mjs`, which takes it from the **resolved pack** —
// the same object the child's board obeys — so this screen cannot tell her a word is
// ready while the board withholds it.

import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../theme';
import { AppText } from '../../Text';
import { ParentScreen } from '../ParentChrome';
import { CompletenessDot, PlainGlyph, PrimaryButton, Thumb } from './EditorParts';

/** One row: 64 pt thumbnail, the word, its decomposition or its reason, a dot. */
function WordRow({ row, strings, sourceFor, onPress }) {
  const theme = useTheme();
  const reason = row.reason
    ? strings.editorReason[row.reason.code] ?? strings.editorReason.unknown
    : null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.row, { borderColor: theme.hairline }]}
    >
      <Thumb row={row} sourceFor={sourceFor} />
      <View style={styles.rowBody}>
        {/* D24 — her own spelling, never upper-cased. This draws through `PlainGlyph`,
            which does not read the pack's `display.glyphCase` at all. */}
        <PlainGlyph text={row.text} size={24} colour={theme.ink} style={styles.rowWord} />
        <AppText role="secondary" colour={theme.inkSoft} numberOfLines={1}>
          {row.decomposition ?? reason ?? ''}
        </AppText>
      </View>
      <CompletenessDot playable={row.playable} />
    </Pressable>
  );
}

function Section({ title, children }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <AppText role="secondary" colour={theme.inkSoft} style={styles.sectionLabel}>{title}</AppText>
      <View style={{ borderTopWidth: 1, borderColor: theme.hairline }}>{children}</View>
    </View>
  );
}

export function WordListScreen({
  strings, list, sourceFor, onBack, onAdd, onOpen, onRestore, toast, onUndo, canWrite,
  confirmDelete, onConfirmDelete, onCancelDelete,
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const pending = confirmDelete
    ? [...list.playable, ...list.notYet].find((r) => r.id === confirmDelete) ?? null
    : null;

  const match = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (row) => q === '' || row.text.toLowerCase().includes(q);
  }, [query]);

  const playable = list.playable.filter(match);
  const notYet = list.notYet.filter(match);
  const deleted = list.deleted.filter(match);

  // **L1 — the confirmation shows the word *and its picture*.** A 4-year-old's word list
  // is a hundred rows of near-identical text; the photograph is what tells her which one
  // she is about to lose, and it is the only thing on this card that is not a word.
  if (pending) {
    return (
      <ParentScreen
        title={strings.editorDeleteTitle(pending.text)}
        modeTitle={strings.modeTitle}
        onBack={onCancelDelete}
      >
        <View style={styles.confirm}>
          <Thumb row={pending} sourceFor={sourceFor} size={160} />
          <PlainGlyph text={pending.text} size={32} style={styles.confirmWord} />
        </View>
        <PrimaryButton label={strings.editorDelete} onPress={() => onConfirmDelete(pending.id)} />
        <PrimaryButton label={strings.editorCancel} onPress={onCancelDelete} tone="plain" />
      </ParentScreen>
    );
  }

  const body = (
    <ParentScreen title={strings.editorListTitle} modeTitle={strings.modeTitle} onBack={onBack}>
      <View style={[styles.search, { borderColor: theme.hairline, backgroundColor: theme.ground }]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={strings.editorSearch}
          placeholderTextColor={theme.inkSoft}
          style={[styles.searchInput, { color: theme.ink }]}
          autoCorrect={false}
          accessibilityLabel={strings.editorSearch}
        />
      </View>

      {!canWrite ? (
        <AppText role="secondary" colour={theme.inkSoft} style={styles.note}>
          {strings.editorNoPack}
        </AppText>
      ) : null}

      {/* `content-pipeline.md` §6 — a word file that will not parse is quarantined and
          **his mother is told**, with the rest of the pack playing. The child never meets
          this line; the adult who can act on it always does (K9). */}
      {list.unreadable.length > 0 ? (
        <AppText role="secondary" colour={theme.rewardEdge} style={styles.note}>
          {strings.editorUnreadable(list.unreadable.length)}
        </AppText>
      ) : null}

      {playable.length + notYet.length + deleted.length === 0 ? (
        <AppText role="body" colour={theme.inkSoft} style={styles.note}>
          {strings.editorEmptyList}
        </AppText>
      ) : null}

      <View style={{ borderTopWidth: playable.length ? 1 : 0, borderColor: theme.hairline }}>
        {playable.map((row) => (
          <WordRow
            key={row.id}
            row={row}
            strings={strings}
            sourceFor={sourceFor}
            onPress={() => onOpen(row.id)}
          />
        ))}
      </View>

      {notYet.length > 0 ? (
        <Section title={strings.editorSectionNotYet(notYet.length)}>
          {notYet.map((row) => (
            <WordRow
              key={row.id}
              row={row}
              strings={strings}
              sourceFor={sourceFor}
              onPress={() => onOpen(row.id)}
            />
          ))}
        </Section>
      ) : null}

      {/* L3 — Recently deleted, restorable in one tap for 30 days. */}
      {deleted.length > 0 ? (
        <Section title={strings.editorSectionDeleted(deleted.length)}>
          {deleted.map((row) => (
            <Pressable
              key={row.id}
              onPress={() => onRestore(row.id)}
              accessibilityRole="button"
              style={[styles.row, { borderColor: theme.hairline }]}
            >
              <Thumb row={row} sourceFor={sourceFor} />
              <View style={styles.rowBody}>
                <PlainGlyph text={row.text} size={24} colour={theme.inkSoft} style={styles.rowWord} />
                <AppText role="secondary" colour={theme.inkSoft}>
                  {strings.editorDaysLeft(row.expiresInDays)}
                </AppText>
              </View>
              <AppText role="secondary" colour={theme.accentFace}>{strings.editorRestore}</AppText>
            </Pressable>
          ))}
        </Section>
      ) : null}

      {/* The list scrolls past the fold on a full pack, so the two controls that must be
          reachable at any scroll position are drawn **over** it, below. This spacer keeps
          the last row clear of them. */}
      <View style={{ height: 96 }} />
    </ParentScreen>
  );

  return (
    <View style={styles.root}>
      {body}
      {/* **L2 — the six-second Undo toast, pinned.** It was inside the scroll view and
          landed 4,359 pt down a 47-word list, which is a toast she would never see.
          Caught by driving it in a browser. The timer is in `useEditor`, cleaned up on
          unmount; this only draws what the state layer decided. */}
      {toast ? (
        <View style={[styles.toast, {
          backgroundColor: theme.ink,
          bottom: insets.bottom + 16,
          left: insets.left + 16,
          right: insets.right + 16,
        }]}
        >
          <AppText role="body" colour={theme.groundAlt} style={styles.toastText}>
            {strings.editorDeleted(toast.text)}
          </AppText>
          <Pressable onPress={onUndo} accessibilityRole="button" hitSlop={12} style={styles.undo}>
            <AppText role="button" colour={theme.reward}>{strings.editorUndo}</AppText>
          </Pressable>
        </View>
      ) : null}
      {/* §13.1 — the 56 pt `+`, bottom-right and always reachable. */}
      {canWrite && !toast ? (
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={strings.editorAdd}
          style={[styles.fab, {
            backgroundColor: theme.accentFace,
            bottom: insets.bottom + 16,
            right: insets.right + 16,
          }]}
        >
          <AppText role="screenTitle" colour={theme.groundAlt}>+</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undo: { minHeight: 44, justifyContent: 'center' },
  search: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: { fontSize: 17, minHeight: 44 },
  note: { marginBottom: 12 },
  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  rowBody: { flex: 1, paddingHorizontal: 12 },
  rowWord: { alignItems: 'flex-start' },
  section: { marginTop: 24 },
  sectionLabel: { marginBottom: 6 },
  toast: {
    position: 'absolute',
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toastText: { flex: 1, paddingRight: 12 },
  confirm: { alignItems: 'center', marginVertical: 24 },
  confirmWord: { marginTop: 16 },
});
