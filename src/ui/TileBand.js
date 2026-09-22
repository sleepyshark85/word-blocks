// The palette band. `ui.md` §7.1 and §8.
//
// Vietnamese shows **one row at a time** and morphs between them; English shows the whole
// tray at once, in one or two lines. Both are this component, because the band is a
// component and not a screen — `ui.md` §3.2's rule is that no *screen* is shared, and the
// two boards compose this differently.
//
// The morph (M6, `acceptance-criteria.md` C3, C4): two absolutely-positioned rows of the
// same size, cross-faded by **opacity** plus an 8 pt `translateY` over 280 ms. The band
// never changes size or position; only its contents cross-fade. The outgoing row is
// `pointerEvents="none"` while it fades, and the engine independently refuses a tile that
// is not in the active row — two defences, because during those 280 ms the outgoing tiles
// are still drawn and a four-year-old taps six times in 400 ms.

import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { EASING } from '../motion/easing';
import { M } from '../motion/durations.mjs';
import { Tile } from './Tile';

/** `ui.md` §4.2 — how a row of n tiles breaks into lines. Never more than two. */
const PER_LINE = [1, 2, 3, 2, 3, 3, 4, 4];

function chunk(items, perLine) {
  const out = [];
  for (let i = 0; i < items.length; i += perLine) out.push(items.slice(i, i + perLine));
  return out;
}

/**
 * `acceptance-criteria.md` E8 — after a not-a-word settle, **only the unlit tiles** fly
 * home, 140 ms apart. The state layer publishes which instances are returning and in what
 * order; this turns that into a staggered entrance. It never decides *which* tiles walk
 * home — the engine already resolved that.
 */
function Returning({ index, reduced, children }) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: M.flyHome,
      delay: index * M.flyHomeStagger,
      easing: EASING.exit,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [enter, index]);
  return (
    <Animated.View style={{
      opacity: enter,
      transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 1 : 0.6, 1] }) }],
    }}
    >
      {children}
    </Animated.View>
  );
}

function Row({ instances, layout, maxRow, roleOf, radius, hintId, hintLevel, pressedId, returning, reduced, onDown, onUp }) {
  // `acceptance-criteria.md` C15 — the break is computed from the widest row the round
  // will ever show, not from how many tiles happen to be on screen now, so a tile never
  // changes size or column under his finger when the band morphs.
  const perLine = PER_LINE[Math.max(0, Math.min(7, maxRow - 1))];
  const lines = chunk(instances, perLine);
  return (
    <View style={styles.rowStack}>
      {lines.map((line, i) => (
        // eslint-disable-next-line react/no-array-index-key -- the line index IS the key
        <View key={i} style={[styles.line, { marginTop: i === 0 ? 0 : layout.gap }]}>
          {line.map((inst, j) => {
            const tile = (
              <Tile
                glyph={inst.glyph}
                role={roleOf(inst)}
                size={layout.tile}
                fontSize={layout.tileFont}
                radius={radius}
                hitSlop={Math.floor(Math.min(6, layout.gap / 2))}
                pressed={pressedId === inst.id}
                hint={hintId === inst.id ? (hintLevel >= 3 ? 'rim' : 'breathe') : 'rest'}
                reduced={reduced}
                onPressIn={(e) => onDown(inst.id, e)}
                onPressOut={(e) => onUp(inst.id, e)}
              />
            );
            // Only a tile that has just walked home gets an entrance. Wrapping every
            // tile would fade the whole band in on every re-render.
            const back = returning.indexOf(inst.id);
            return (
              <View key={inst.id} style={{ marginLeft: j === 0 ? 0 : layout.gap }}>
                {back < 0 ? tile : <Returning index={back} reduced={reduced}>{tile}</Returning>}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function TileBand({
  instances, bandSeq, tint, layout, maxRow, roleOf, radius, hintInstanceId, hintLevel,
  pressedId, returning = [], reduced, onTileDown, onTileUp,
}) {
  const theme = useTheme();
  const fade = useRef(new Animated.Value(1)).current;
  // The row that is on screen under the current sequence, captured in the effect and
  // never during render — writing it during render would hand the morph the *new* row as
  // the thing to fade out, which is a cross-fade from a thing to itself.
  const shownSeq = useRef(bandSeq);
  const shownRow = useRef({ instances, tint });
  const [outgoing, setOutgoing] = useState(null);

  // **This effect must depend on `bandSeq` and nothing else.**
  //
  // `instances` is a fresh array on every snapshot — the state layer emits several times
  // a second during a chant. An effect that also depended on it re-ran on each emit, and
  // its cleanup called `anim.stop()`, so the completion callback never saw `finished` and
  // the outgoing row was never unmounted. Seen on device: the seated tone tile was still
  // sitting in the band, fully opaque, through the whole chant. The previous row is
  // therefore carried in a ref, and only the sequence the state layer publishes can start
  // a morph.
  useEffect(() => {
    if (bandSeq === shownSeq.current) return undefined;
    const previous = shownRow.current;
    shownSeq.current = bandSeq;
    shownRow.current = { instances, tint };
    setOutgoing(previous);
    fade.setValue(0);
    const anim = Animated.timing(fade, {
      toValue: 1,
      duration: M.bandMorph,
      easing: EASING.enter,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => { if (finished) setOutgoing(null); });
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bandSeq]);

  const enterY = fade.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : M.bandRise, 0] });
  const leaveOpacity = fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  const body = (row, key) => (
    <Row
      key={key}
      instances={row.instances}
      layout={layout}
      maxRow={maxRow}
      roleOf={roleOf}
      radius={radius}
      hintId={hintInstanceId}
      hintLevel={hintLevel}
      pressedId={pressedId}
      returning={returning}
      reduced={reduced}
      onDown={onTileDown}
      onUp={onTileUp}
    />
  );

  return (
    <View style={{ width: layout.palBand, height: layout.bandH, alignItems: 'center', justifyContent: 'center' }}>
      {/* The tint is two stacked views cross-faded by opacity — a background colour is
          not a transform, so it may not be animated (`acceptance-criteria.md` O3).
          Paint order: the incoming tint, the outgoing tint fading off it, then the two
          rows of tiles in the same order. */}
      <View
        style={[StyleSheet.absoluteFill, {
          backgroundColor: tint ?? theme.ground,
          borderRadius: 20,
        }]}
      />
      {outgoing ? (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, {
            backgroundColor: outgoing.tint ?? theme.ground,
            borderRadius: 20,
            opacity: leaveOpacity,
          }]}
        />
      ) : null}
      {outgoing ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.layer, { opacity: leaveOpacity }]}
        >
          {body(outgoing, 'out')}
        </Animated.View>
      ) : null}
      <Animated.View style={{ opacity: fade, transform: [{ translateY: enterY }] }}>
        {body({ instances, tint }, 'in')}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowStack: { alignItems: 'center' },
  line: { flexDirection: 'row', alignItems: 'center' },
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
