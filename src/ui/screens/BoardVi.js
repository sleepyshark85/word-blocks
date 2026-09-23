// Screen: **Ghép Chữ**. `ui.md` §7.
//
// `ui.md` §3.2 is explicit that this is a separate screen from the English board and that
// "there is no `<Table lang=…>`". Nothing in this file mentions the other language,
// imports its board, or could render one of its tiles — the leak defence is structural,
// not a convention.
//
// Four things on screen and nothing else (`acceptance-criteria.md` B1, §3.1):
//
//     top bar      mode title · the shelf of five · the gate dot
//     word strip   the word so far, plus one dashed cell
//     the TABLE    every character in the pack. Live ones stand up; the rest lie flat.
//     the RAIL     one button per page — **only when the table is paged** (V1, V2).
//                  Absent entirely on a tablet, which shows all 67 at once.
//
// **No picture, no picture frame, no veil, no caption strip.** The picture is the reward
// and it is not on the board.

import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme';
import { CaptionText } from '../Text';
import { TopBar } from '../TopBar';
import { WordStrip, arriveMsFor } from '../WordStrip';
import { CharacterTable } from '../CharacterTable';
import { PageRail } from '../PageRail';
import { Reveal } from '../Reveal';
import { TOP_BAR, GAP_STRIP, PAD_BOTTOM } from '../../layout/layout.mjs';

/** `ui.md` §5.5 — onset is `role1`/solid, rime `role2`/split, tone `role3`/dotted. */
const ROLE_OF = { onset: 'role1', rime: 'role2', tone: 'role3' };

export function BoardVi({
  snapshot, controller, strings, settings, reduced, sourceFor, layout: L, insets, onOpenGate,
}) {
  const theme = useTheme();

  const stripW = L.rowW ?? 0;
  const cells = snapshot.strip;
  const n = Math.max(1, cells.length);
  // A merged word takes the whole strip; otherwise the cells share it evenly, capped so
  // that a two-cell strip does not stretch into two slabs.
  const even = Math.min(Math.round((L.stripH ?? 0) * 1.25), Math.floor((stripW - (n - 1) * 4) / n));
  const widths = cells.map((c) => (c.merged ? stripW : even));
  const arriveMs = arriveMsFor(Boolean(snapshot.autoPlacedId));

  // Where the strip sits, so the reveal can scale out of its rectangle (M13).
  const stripCentreY = insets.top + 4 + TOP_BAR + GAP_STRIP + (L.stripH ?? 0) / 2;
  const stripRect = { width: stripW, y: stripCentreY - (L.H ?? 0) / 2 };

  return (
    <View style={[styles.root, {
      backgroundColor: theme.ground,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    }]}
    >
      {/* `ui.md` §7 — a 4 pt rule in the mode's role1 across the top. */}
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

      <View
        style={{ alignItems: 'center' }}
        // `ui.md` §2.2 — press and hold the strip for 800 ms to hear the parts of what is
        // assembled. A short tap on a cell is undo; both live on the same object, and the
        // child-discoverable one is the harmless one.
        onTouchStart={controller.stripDown}
      >
        <WordStrip
          cells={cells}
          widths={widths}
          height={L.stripH}
          fontSize={L.stripFont}
          // The dashed cell has no run (`role: 'next'`), and no underline is drawn for
          // it; `role2` is simply what its unused tokens resolve to.
          roleOf={(cell) => ROLE_OF[cell.role] ?? 'role2'}
          lit={snapshot.chant ? snapshot.chant.lit : null}
          arriveMs={arriveMs}
          hopSeq={snapshot.hopSeq}
          merged={snapshot.merged}
          reduced={reduced}
          onCellDown={controller.stripDown}
          onCellUp={controller.stripUp}
        />
      </View>

      {/* `ui.md` §12 — **one** accessibility element for the whole board, and **the page
          rail is a second one**. The tiles inside are hidden from the screen reader; see
          `i18n/*.js` for why. */}
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
          roleOf={(cell) => ROLE_OF[cell.role]}
          radius={0.22}
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
          roleOf={(button) => ROLE_OF[button.role]}
          radius={0.22}
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
