// Screen: **Word Blocks**. `ui.md` §8.
//
// A separate screen from the other language's board, by `ui.md` §3.2. The differences are
// all structural: the strip grows rightwards and its **length is never shown**, one
// inventory in alphabetical order rather than a table that morphs, a `ground` tint
// because the roles are mixed, and `role3` is **never rendered**
// (`acceptance-criteria.md` D6). Nothing in this file names a tone.

import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme';
import { CaptionText } from '../Text';
import { TopBar } from '../TopBar';
import { WordStrip, arriveMsFor } from '../WordStrip';
import { CharacterTable } from '../CharacterTable';
import { Reveal } from '../Reveal';
import { useBoardLayout } from '../useBoardLayout';
import { TOP_BAR, GAP_STRIP, PAD_BOTTOM } from '../../layout/layout.mjs';

/** `ui.md` §5.6 — consonant → `role1`/solid, vowel → `role2`/split. Two of three. */
const roleOf = (cell) => (cell.isVowel ? 'role2' : 'role1');

export function BoardEn({ snapshot, controller, strings, settings, reduced, sourceFor, onOpenGate }) {
  const theme = useTheme();
  const L = useBoardLayout(snapshot.cells);

  // The strip grows to the right. It is capped at the table's width so a long word never
  // pushes a cell off screen; beyond six cells the cells share what there is.
  const stripW = L.rowW ?? 0;
  const n = Math.max(1, snapshot.strip.length);
  const cellW = Math.min(Math.round((L.stripH ?? 0) * 0.94), Math.floor((stripW - (n - 1) * 4) / n));
  const widths = snapshot.strip.map(() => cellW);
  const arriveMs = arriveMsFor(Boolean(snapshot.autoPlacedId));

  const stripCentreY = L.insets.top + 4 + TOP_BAR + GAP_STRIP + (L.stripH ?? 0) / 2;
  const stripRect = { width: cellW * n, y: stripCentreY - (L.H ?? 0) / 2 };

  return (
    <View style={[styles.root, {
      backgroundColor: theme.ground,
      paddingTop: L.insets.top,
      paddingBottom: L.insets.bottom,
      paddingLeft: L.insets.left,
      paddingRight: L.insets.right,
    }]}
    >
      <View style={{ height: 4, backgroundColor: theme.role1 }} />

      <View style={{ alignItems: 'center' }}>
        <TopBar
          width={L.CW}
          title={strings.modeTitle}
          shelf={snapshot.shelf}
          slotSize={L.shelf}
          sourceFor={sourceFor}
          reduced={reduced}
          onOpenGate={onOpenGate}
          onTapSlot={controller.tapShelf}
        />
      </View>

      <View style={{ height: GAP_STRIP }} />

      <View style={{ alignItems: 'center' }} onTouchStart={controller.stripDown}>
        <WordStrip
          cells={snapshot.strip}
          widths={widths}
          height={L.stripH}
          fontSize={L.stripFont}
          roleOf={(cell, i) => {
            const tile = snapshot.table.cells.find((c) => c.glyph === cell.glyph);
            return cell.filled && tile ? roleOf(tile) : (i === 0 ? 'role1' : 'role2');
          }}
          litCell={snapshot.chant ? snapshot.chant.cell : null}
          arriveMs={arriveMs}
          hopSeq={snapshot.hopSeq}
          merged={snapshot.merged}
          reduced={reduced}
          onCellDown={controller.stripDown}
          onCellUp={controller.stripUp}
        />
      </View>

      {/* `ui.md` §12 — **one** accessibility element for the whole board. The tiles
          inside are hidden from the screen reader; see `i18n/*.js` for why. */}
      <View
        style={styles.tableWrap}
        accessible
        accessibilityRole="none"
        accessibilityLabel={strings.boardA11y(
          snapshot.strip.filter((c) => c.filled).map((c) => c.glyph ?? '').filter(Boolean),
          snapshot.table.cells.filter((c) => c.live).length,
        )}
      >
        <CharacterTable
          table={snapshot.table}
          tableSeq={snapshot.tableSeq}
          tint={theme.ground}
          layout={L}
          roleOf={roleOf}
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
  // The table is **anchored to the bottom** of the content area, not centred in it.
  // `ui.md` §4.2 makes the table the flex element and caps `gapY` at 0.45 × tile, so a
  // narrow stage leaves real slack; §7's board puts the table in the lower half, which is
  // also where a seated child's hands are on a flat tablet. At stage 5 the stack fills the
  // screen and the two are the same thing.
  tableWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: PAD_BOTTOM },
});
