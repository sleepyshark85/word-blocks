// Screen: **Ghép Chữ**. `ui.md` §7.
//
// `ui.md` §3.2 is explicit that this is a separate screen from the English board and that
// "there is no `<Table lang=…>`". Nothing in this file mentions the other language,
// imports its board, or could render one of its tiles — the leak defence is structural,
// not a convention.
//
// Three things on screen and nothing else (`acceptance-criteria.md` B1):
//
//     top bar      mode title · the shelf of five · the gate dot
//     word strip   onset ┊ rime ┊ tone — three cells, always
//     the TABLE    the characters. Live ones stand up; the rest lie flat.
//
// **No picture, no picture frame, no veil, no caption strip.** The picture is the reward
// and it is not on the board.

import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme';
import { CaptionText } from '../Text';
import { TopBar } from '../TopBar';
import { WordStrip, arriveMsFor } from '../WordStrip';
import { CharacterTable } from '../CharacterTable';
import { Reveal } from '../Reveal';
import { useBoardLayout } from '../useBoardLayout';
import { TOP_BAR, GAP_STRIP, PAD_BOTTOM } from '../../layout/layout.mjs';

/** `ui.md` §5.5 — onset is `role1`/solid, rime `role2`/split, tone `role3`/dotted. */
const ROLE_OF = { onset: 'role1', rime: 'role2', tone: 'role3' };
const TINT_OF = { onset: 'role1Soft', rime: 'role2Soft', tone: 'role3Soft' };

/** `ui.md` §7.2 — the onset cell is 0.28 of the strip, the rime 0.44, the tone 0.28. */
const CELL_SHARE = [0.28, 0.44, 0.28];

export function BoardVi({ snapshot, controller, strings, settings, reduced, sourceFor, onOpenGate }) {
  const theme = useTheme();
  const L = useBoardLayout(snapshot.cells);

  const stripW = L.rowW ?? 0;
  const widths = CELL_SHARE.map((s) => Math.round((stripW - 8) * s));
  const arriveMs = arriveMsFor(Boolean(snapshot.autoPlacedId));
  const tint = theme[TINT_OF[snapshot.tableRole] ?? 'role1Soft'];

  // Where the strip sits, so the reveal can scale out of its rectangle (M13).
  const stripCentreY = L.insets.top + 4 + TOP_BAR + GAP_STRIP + (L.stripH ?? 0) / 2;
  const stripRect = { width: stripW, y: stripCentreY - (L.H ?? 0) / 2 };

  return (
    <View style={[styles.root, {
      backgroundColor: theme.ground,
      paddingTop: L.insets.top,
      paddingBottom: L.insets.bottom,
      paddingLeft: L.insets.left,
      paddingRight: L.insets.right,
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
          cells={snapshot.strip}
          widths={widths}
          height={L.stripH}
          fontSize={L.stripFont}
          roleOf={(cell) => ROLE_OF[cell.role]}
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
          tint={tint}
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
