// Screen: **Word Blocks**. `ui.md` §8.
//
// A separate screen from the other language's board, by `ui.md` §3.2. The differences are
// all structural: the strip grows rightwards and its **length is never shown**, the table
// is the alphabet `a`–`z` and **nothing else** — one run of 26, which on the owner's
// iPhone is a single page with **no rail at all** (D1d) — and `role3` is **never
// rendered** (`acceptance-criteria.md` D6). Nothing in this file names a tone.
//
// `q` is on the board like every other letter, permanently flat, and it speaks when
// pressed (`ui.md` §8.1, AC D1a/D1b). Nothing here special-cases it.

import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme';
import { CaptionText } from '../Text';
import { TopBar } from '../TopBar';
import { WordStrip, arriveMsFor } from '../WordStrip';
import { CharacterTable } from '../CharacterTable';
import { PageRail } from '../PageRail';
import { Reveal } from '../Reveal';
import {
  TOP_BAR, GAP_STRIP, PAD_BOTTOM, STRIP_GAP,
} from '../../layout/layout.mjs';

/**
 * `ui.md` §5.5, §5.6 / AC D5, D6, S5 — consonant → `role1`/solid, vowel → `role2`/split.
 * Two of three: English never renders `role3`, because it has no tone. `y` is /j/ in this
 * pack and therefore a consonant here, where it is a vowel letter in Vietnamese — each
 * language's own answer, and the language never mixes.
 */
const ROLE_OF = { consonant: 'role1', vowel: 'role2' };

export function BoardEn({
  snapshot, controller, strings, settings, reduced, sourceFor, layout: L, insets, doors,
}) {
  const theme = useTheme();

  // **X1 — the strip is six cells, sized once by the layout law**, identical to the
  // Vietnamese one: the same component, with one run missing. `ship` is `s` `h` (one
  // span) `i` (new span) `p` (new span) — four cells, three bars, two dividers (X19).
  const cells = snapshot.strip;
  const arriveMs = arriveMsFor(Boolean(snapshot.autoPlacedId));
  const trackW = L.stripRowW ?? 0;

  const stripCentreY = insets.top + 4 + TOP_BAR + GAP_STRIP + (L.stripH ?? 0) / 2;
  const stripRect = { width: trackW, y: stripCentreY - (L.H ?? 0) / 2 };

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
        {/* `ui.md` §9.4 — three children, each belonging to a different person: the
            child's language control, his shelf, his parents' door. `doors` is assembled
            in the shell, because both doors are the shell's business and this screen
            must know nothing about either language. */}
        <TopBar
          width={L.CW}
          title={strings.modeTitle}
          shelf={snapshot.shelf}
          slotSize={L.shelf}
          sourceFor={sourceFor}
          reduced={reduced}
          onTapSlot={controller.tapShelf}
          {...doors}
        />
      </View>

      <View style={{ height: GAP_STRIP }} />

      {/* `ui.md` §7.2.6 — **one target**: tap = take the last one back, hold = say what
          I have. There is no per-cell undo in either language (D4, E8, E9). */}
      <View style={{ alignItems: 'center' }}>
        <WordStrip
          cells={cells}
          cellW={L.stripCellW}
          cellH={L.stripCellH}
          gap={STRIP_GAP}
          slots={L.stripCells}
          fontSize={L.stripFont}
          lit={snapshot.chant ? snapshot.chant.lit : null}
          arriveMs={arriveMs}
          hopSeq={snapshot.hopSeq}
          merged={snapshot.merged}
          reduced={reduced}
          onStripDown={controller.stripDown}
          onStripUp={controller.stripUp}
        />
      </View>

      {/* `ui.md` §12 — **one** accessibility element for the whole board, and the page
          rail is a second one. The tiles inside are hidden from the screen reader. */}
      <View
        style={styles.tableWrap}
        accessible
        accessibilityRole="none"
        accessibilityLabel={strings.boardA11y(
          cells.filter((c) => c.filled).map((c) => c.glyph ?? '').filter(Boolean),
          snapshot.table.cells.filter((c) => c.live).length,
        )}
      >
        <CharacterTable
          table={snapshot.table}
          page={snapshot.page}
          pageSeq={snapshot.pageSeq}
          pageSlideMs={snapshot.pageSlideMs}
          layout={L}
          roleOf={(cell) => ROLE_OF[cell.kind]}
          radius={0.32}
          hintSymbolId={snapshot.hintSymbolId}
          hintLevel={snapshot.hintLevel}
          pressedId={snapshot.pressedId}
          shimmerSeq={snapshot.shimmerSeq}
          autoPlacedId={snapshot.autoPlacedId}
          reduced={reduced}
          onSymbolDown={(id, e) => controller.symbolDown(id, e.nativeEvent.pageX, e.nativeEvent.pageY)}
          onSymbolUp={(id, e) => controller.symbolUp(id, e.nativeEvent.pageX, e.nativeEvent.pageY)}
        />
      </View>

      <View
        style={{ alignItems: 'center', paddingBottom: PAD_BOTTOM }}
        accessible={snapshot.rail.paged}
        accessibilityRole="none"
        accessibilityLabel={snapshot.rail.paged
          ? strings.railA11y(snapshot.page + 1, snapshot.rail.buttons.length,
            snapshot.rail.buttons.filter((b) => b.live).map((b) => b.page + 1))
          : undefined}
      >
        <PageRail
          rail={snapshot.rail}
          railCols={L.railCols}
          roleOf={(button) => ROLE_OF[button.kind]}
          radius={0.32}
          reduced={reduced}
          shimmerSeq={snapshot.shimmerSeq}
          hintPage={snapshot.hintPage}
          hintLevel={snapshot.hintLevel}
          onPressPage={controller.tapPage}
        />
      </View>

      {snapshot.reveal ? (
        <Reveal
          reveal={snapshot.reveal}
          width={L.W}
          height={L.H}
          stripRect={stripRect}
          wordSize={Math.max(40, Math.round(L.stripFont * 0.9))}
          sources={{
            image: sourceFor(snapshot.reveal.image),
            emoji: sourceFor.emoji(snapshot.reveal.fallbackEmoji),
          }}
          sentence={snapshot.reveal.sentence}
          showWord={settings.showWord}
          reduced={reduced}
          Caption={CaptionText}
          onTap={controller.tapReveal}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // The table is **anchored to the bottom** of the content area, not centred in it: a
  // seated child's hands are in the lower half of a flat tablet. The rail sits under it,
  // where his thumb is on a phone.
  tableWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
});
