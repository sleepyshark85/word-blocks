// Screen: **Ghép Chữ**. `ui.md` §7.
//
// `ui.md` §3.2 is explicit that this is a separate screen from the English board and that
// "there is no `<Table lang=…>`". Nothing in this file mentions the other language,
// imports its board, or could render one of its tiles — the leak defence is structural,
// not a convention.
//
// Four things on screen and nothing else (`acceptance-criteria.md` B1, §3.1):
//
//     top bar      the language control · the shelf of five, mode title under it · the
//                  parent door  (72 pt, revision 6 — `ui.md` §9.4)
//     word strip   the word so far — one cell per letter, one bar per sound
//     the TABLE    29 letters then 6 tones. Live ones stand up; the rest lie flat.
//     the RAIL     one button per page — **only when the table is paged** (V1, V2).
//                  Absent entirely on a tablet, which shows all 35 at once.
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
import {
  TOP_BAR, GAP_STRIP, PAD_BOTTOM, STRIP_GAP,
} from '../../layout/layout.mjs';

/**
 * `ui.md` §5.5 / AC B2l, C15, S5 — **a role is a permanent property of the glyph**:
 * consonant `role1`/solid, vowel `role2`/split, tone `role3`/dotted. Revision 4 keyed it
 * on the run (onset, rime, tone); the letter run now holds both kinds interleaved, and at
 * the five branching onsets `c g k n t` a consonant and a vowel are live at the same time
 * meaning opposite things — which is why colour is now CVD-gated for that pair (S15).
 */
const ROLE_OF = { consonant: 'role1', vowel: 'role2', tone: 'role3' };

export function BoardVi({
  snapshot, controller, strings, settings, reduced, sourceFor, layout: L, insets, doors,
}) {
  const theme = useTheme();

  // **X1 / X5 — the strip is six cells, sized once by the layout law**, identical in both
  // languages and independent of the word being built. On his iPhone that is six 58 × 90
  // cells with an 8 pt gap and a 47 pt glyph.
  const cells = snapshot.strip;
  const arriveMs = arriveMsFor(Boolean(snapshot.autoPlacedId));
  const trackW = L.stripRowW ?? 0;

  // Where the strip sits, so the reveal can scale out of its rectangle (M13).
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
      {/* `ui.md` §7 — a 4 pt rule in the mode's role1 across the top. */}
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

      {/* `ui.md` §2.2, §7.2.6 — **the strip is one target**: a short tap is undo (one
          symbol, the last), an 800 ms hold speaks the parts of what is assembled, and
          there is no third gesture. The child-discoverable one is the harmless one. */}
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
          roleOf={(cell) => ROLE_OF[cell.kind]}
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
          roleOf={(button) => ROLE_OF[button.kind]}
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
