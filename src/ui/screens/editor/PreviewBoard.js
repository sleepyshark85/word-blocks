// Step 5 — **the real board, with her word in it** (`acceptance-criteria.md` J9).
//
// `ui.md` §13.2: *"The preview is where she learns the most important thing about this app
// without being told it: her photograph is not a clue, it is the prize. She will otherwise
// choose photographs as if they were hints. One screen, no explanation, and she sees it."*
//
// So this is not a mock-up. It resolves a pack — the words on disk **plus the one she is
// entering**, through the same `resolvePack` the game uses — builds a prefix tree over
// it, and mounts the real `BoardVi` / `BoardEn`. If her decomposition is wrong, the board
// refuses to build the word here, in front of her, rather than in front of him.
//
// The hooks are unconditional and the component is mounted only on step 5, which is what
// keeps the Rules of Hooks satisfiable on a screen that is one of five.

import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../Text';
import { CasingProvider } from '../../Text';
import { useTheme } from '../../../theme';
import { useGame } from '../../../state/useGame';
import { usePagePlan } from '../../useBoardLayout';
import { packInputs, emojiSource } from '../../../content/loadPack';
import { UI_AUDIO } from '../../../../assets/audio';
import { resolvePack, createGame, langFor } from '../../../engine/index.mjs';
import { buildWordRecord } from '../../../editor/wordFile.mjs';
import { boardFor } from '../boardFor';

export function PreviewBoard({ language, packId, draft, looked, strings, settings, audio, reserveBottom = 0 }) {
  const theme = useTheme();

  const built = useMemo(() => {
    try {
      const inputs = packInputs(language);
      const record = buildWordRecord(
        { ...draft, choice: looked.choice, draft: false },
        { language, addedAt: null },
      );
      // Her word replaces the draft already on disk rather than joining it, or
      // `resolvePack` would report a duplicate id and withhold both.
      const words = [
        ...inputs.words.filter((w) => w && w.id !== record.id),
        record,
      ];
      const pack = resolvePack({
        language, manifest: inputs.manifest, words, hasMedia: inputs.hasMedia,
      });
      return { pack, mediaSource: inputs.mediaSource, wordId: record.id };
    } catch {
      return null;
    }
  }, [language, packId, draft, looked]);

  const runLengths = useMemo(() => (built
    ? langFor(language).runsFor(built.pack).map((run) => run.ids.length)
    : []), [built, language]);
  const { plan, insets } = usePagePlan(runLengths, reserveBottom);
  const pagesKey = plan ? plan.pages.join(',') : '';

  const game = useMemo(
    () => (built && plan ? createGame(built.pack, { pages: plan.pages }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the SHAPE is the dependency
    [built, pagesKey],
  );

  const sourceFor = useMemo(() => {
    const fn = (ref) => (built && ref ? built.mediaSource(ref.src ?? ref) : null);
    fn.emoji = emojiSource;
    return fn;
  }, [built]);

  const { controller, snapshot } = useGame({
    game,
    seed: `preview-${packId}`,
    mediaSource: built ? built.mediaSource : () => null,
    ui: UI_AUDIO,
    audio,
    settings,
  });

  const live = built && built.pack.wordById[built.wordId];

  if (!built || !plan || !controller || !snapshot || snapshot.phase !== 'playing') {
    return (
      <View style={[styles.frame, { borderColor: theme.hairline, backgroundColor: theme.ground }]}>
        <AppText role="secondary" colour={theme.inkSoft} style={styles.note}>
          {strings.editorNoParse}
        </AppText>
      </View>
    );
  }

  const Board = boardFor(language);
  return (
    <View style={styles.full}>
      {/* The preview draws through the same glyph component the board does, so it obeys
          the pack's `display.glyphCase` exactly as the child's board will (D17, E22).
          The rest of the editor does not, and must not (D24). */}
      <CasingProvider casing={built.pack.glyphCase}>
        <Board
          snapshot={snapshot}
          controller={controller}
          strings={strings}
          settings={settings}
          reduced={false}
          sourceFor={sourceFor}
          layout={plan.L}
          insets={insets}
          /**
           * **The preview is a board she looks at, not one she operates.** It draws both
           * doors, because J9 says she sees what he will see, and neither does anything:
           * a chooser opened from inside the editor would tear down the pack she is
           * editing, and the gate is already behind her.
           */
          doors={{
            language,
            doorLabel: strings.parentDoor,
            hintLabel: strings.holdHint,
            hintSeq: 0,
            onOpenGate: () => {},
            onOpenChooser: null,
            onTapDoor: null,
          }}
        />
      </CasingProvider>
      {/* A hairline in the word's own state: green once the board can build it, amber
          while it cannot. It is the only editor chrome on this screen, because the screen
          is teaching her what the child sees. */}
      <View style={[styles.edge, { backgroundColor: live ? theme.role3Edge : theme.rewardEdge }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  edge: { height: 3, width: '100%' },
  frame: {
    borderWidth: 2, borderRadius: 16, overflow: 'hidden', marginTop: 12, minHeight: 220,
  },
  note: { padding: 16 },
});
