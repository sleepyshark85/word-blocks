// Screen: **Word Blocks**. `ui.md` §8.
//
// A separate screen from the Vietnamese board, by `ui.md` §3.2. The differences are all
// structural: 2–4 sockets rather than a two-cell plate, one tray rather than a morphing
// band, a `ground` tint because the roles are mixed, and **`role3` is never rendered**
// (`acceptance-criteria.md` D6). Nothing in this file mentions a tone.

import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme';
import { CaptionText } from '../Text';
import { TopBar } from '../TopBar';
import { PictureFrame } from '../PictureFrame';
import { SlotRowEn } from '../WordPlate';
import { TileBand } from '../TileBand';
import { Reveal } from '../Reveal';
import { useBoardLayout } from '../useBoardLayout';
import { M } from '../../motion/durations.mjs';

export function BoardEn({ snapshot, controller, strings, reduced, sourceFor, onOpenGate }) {
  const theme = useTheme();
  const L = useBoardLayout(snapshot.maxRow);
  const art = snapshot.art;

  const promptSource = art ? sourceFor(art.prompt) : null;
  const revealSource = art ? sourceFor(art.reveal) : null;
  const emoji = art ? sourceFor.emoji(art.fallbackEmoji) : null;

  // `ui.md` §8 — each socket is underlined in the role the *target* expects there, which
  // is a clue he can read without reading.
  const expectVowel = (i) => {
    const cell = snapshot.round ? snapshot.round.cells[i] : null;
    if (!cell) return false;
    const inst = snapshot.round.palette.tiles.find((t) => t.tileId === cell.expect);
    return Boolean(inst && inst.isVowel);
  };

  const activeStep = snapshot.chant && snapshot.chant.stepKind === 'tile'
    ? snapshot.chant.index
    : null;
  // M3 vs M16 / `acceptance-criteria.md` O8 — a child's placement arrives in 260 ms; the
  // hint ladder's arrives in 420 ms, so *the app did it* reads differently from *he did*.
  const last = snapshot.lastPlacement;
  const arriveMs = last && last.assist ? M.autoPlaceFly : M.flight;

  return (
    <View style={[styles.root, {
      backgroundColor: theme.ground,
      paddingTop: L.insets.top,
      paddingBottom: L.insets.bottom + L.padBottom,
      paddingLeft: L.insets.left,
      paddingRight: L.insets.right,
    }]}
    >
      <View style={{ height: 4, backgroundColor: theme.role1 }} />
      <View style={{ alignItems: 'center' }}>
        <TopBar
          width={L.CW}
          title={strings.modeTitle}
          rail={snapshot.rail}
          reduced={reduced}
          onOpenGate={onOpenGate}
        />
      </View>

      <View style={styles.stack}>
        <PictureFrame
          width={L.frameW}
          height={L.frameH}
          segments={snapshot.round ? snapshot.round.cells.length : 0}
          lit={snapshot.lit}
          veil={snapshot.veil}
          source={promptSource}
          emoji={emoji}
          accessibilityLabel={strings.modeTitle}
          onPressIn={controller.frameDown}
          onPressOut={controller.frameUp}
        />

        <View style={{ marginTop: -L.overlap }}>
          <SlotRowEn
            cells={snapshot.plate}
            expectVowel={expectVowel}
            tile={L.tile}
            height={L.plateH}
            fontSize={L.plateFont}
            rockSeq={snapshot.rockSeq}
            activeStep={activeStep}
            arriveMs={arriveMs}
            reduced={reduced}
            onTapCell={controller.tapCell}
          />
        </View>

        {L.captionFont > 0 ? (
          <View style={{ height: L.capH, justifyContent: 'center' }}>
            <CaptionText tile={Math.round(L.captionFont / 0.42)}>{snapshot.caption}</CaptionText>
          </View>
        ) : null}

        <View style={{ height: L.gapFrameBand }} />

        <TileBand
          instances={snapshot.band}
          bandSeq={snapshot.bandSeq}
          tint={theme.ground}
          layout={L}
          maxRow={snapshot.maxRow}
          roleOf={(inst) => (inst.isVowel ? 'role2' : 'role1')}
          radius={0.32}
          hintInstanceId={snapshot.hintInstanceId}
          hintLevel={snapshot.hintLevel}
          pressedId={snapshot.pressedId}
          returning={snapshot.returning}
          reduced={reduced}
          onTileDown={(id, e) => controller.tileDown(id, e.nativeEvent.pageX, e.nativeEvent.pageY)}
          onTileUp={(id, e) => controller.tileUp(id, e.nativeEvent.pageX, e.nativeEvent.pageY)}
        />
      </View>

      {snapshot.reveal ? (
        <Reveal
          reveal={snapshot.reveal}
          width={L.frameW}
          height={L.frameH}
          wordSize={L.plateFont}
          tile={L.tile}
          sources={{ prompt: promptSource, reveal: revealSource }}
          emoji={emoji}
          reduced={reduced}
          caption={snapshot.caption}
          onTap={controller.tapReveal}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stack: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
