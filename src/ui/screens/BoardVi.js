// Screen: **Ghép Chữ**. `ui.md` §7.
//
// `ui.md` §3.2 is explicit that this is a separate screen from the English board and that
// "there is no `<Board lang=…>`". Nothing in this file mentions English, imports the
// English board, or could render a letter tile — the leak defence is structural, not a
// convention.
//
// Target `mèo` = `m` | `eo` | huyền. The plate has two cells; a zero-onset word (`ong`,
// `áo`) has one full-width cell and the onset row is never rendered at all (C2).

import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme';
import { CaptionText } from '../Text';
import { TopBar } from '../TopBar';
import { PictureFrame } from '../PictureFrame';
import { WordPlateVi } from '../WordPlate';
import { TileBand } from '../TileBand';
import { Reveal } from '../Reveal';
import { useBoardLayout } from '../useBoardLayout';
import { M } from '../../motion/durations.mjs';

/** `ui.md` §5.5 — onset is `role1`/solid, rime `role2`/split, tone `role3`/dotted. */
const ROLE_OF = { onset: 'role1', rime: 'role2', tone: 'role3' };
const TINT_OF = { onset: 'role1Soft', rime: 'role2Soft', tone: 'role3Soft' };

export function BoardVi({ snapshot, controller, strings, reduced, sourceFor, onOpenGate }) {
  const theme = useTheme();
  const L = useBoardLayout(snapshot.maxRow);
  const art = snapshot.art;

  const promptSource = art ? sourceFor(art.prompt) : null;
  const revealSource = art ? sourceFor(art.reveal) : null;
  const emoji = art ? sourceFor.emoji(art.fallbackEmoji) : null;

  // The chant lifts the part that is speaking (M9). `stepKind` is the engine's own name
  // for the step, replayed here — this component never decides what is being said.
  const activeStep = snapshot.chant ? snapshot.chant.stepKind : null;
  // M3 vs M16 / `acceptance-criteria.md` O8 — a child's placement arrives in 260 ms; the
  // hint ladder's arrives in 420 ms, so *the app did it* reads differently from *he did*.
  const last = snapshot.lastPlacement;
  const arriveMs = last && last.assist ? M.autoPlaceFly : M.flight;
  const merged = Boolean(snapshot.chant && ['blend', 'tone', 'word'].includes(activeStep));

  return (
    <View style={[styles.root, {
      backgroundColor: theme.ground,
      paddingTop: L.insets.top,
      paddingBottom: L.insets.bottom + L.padBottom,
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
          <WordPlateVi
            cells={snapshot.plate}
            width={Math.round(L.frameW * 0.72)}
            height={L.plateH}
            fontSize={L.plateFont}
            merged={merged}
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
          tint={theme[TINT_OF[snapshot.bandRole] ?? 'role1Soft']}
          layout={L}
          maxRow={snapshot.maxRow}
          roleOf={(inst) => ROLE_OF[inst.role]}
          radius={0.22}
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
