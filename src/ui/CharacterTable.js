// The character table. `ui.md` §5.8, §7.1 and §9.1 — the board, and the whole mechanic.
//
// A fixed grid of the stage's inventory, row-major, in the pack's inventory order. **The
// contents do not depend on any word** (`gameplay.md` §3.2): `m` is in the same cell today
// as yesterday, which is the largest single pedagogical gain of the correction and is why
// this component never reorders, never reshuffles and never removes a cell.
//
// What changes under his finger is which tiles are *standing*. That is M6, and it lives in
// `Tile`: two stacked faces cross-faded by opacity with a 2 pt rise, staggered 20 ms by
// cell index. Nothing here animates a layout, and **no tile ever moves cell**
// (`acceptance-criteria.md` B8, E7).
//
// Vietnamese morphs the whole table between roles (onset → rime → tone, M7). That is the
// one thing that does cross-fade at this level: two absolutely-positioned tables of the
// same size, opacity plus an 8 pt `translateY` over 280 ms. The outgoing table is
// inert while it fades, and the engine independently refuses a symbol
// that is not on the current table — two defences, because during those 280 ms the
// outgoing tiles are still drawn and a four-year-old taps six times in 400 ms.

import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { EASING } from '../motion/easing';
import { M } from '../motion/durations.mjs';
import { Tile } from './Tile';

function chunk(items, perLine) {
  const out = [];
  for (let i = 0; i < items.length; i += perLine) out.push(items.slice(i, i + perLine));
  return out;
}

function Grid({
  cells, layout, roleOf, radius, hintId, hintLevel, pressedId, dipSeqs, shimmerSeq,
  autoPlacedId, reduced, onDown, onUp,
}) {
  const rows = chunk(cells, layout.cols);
  return (
    // **The grid is exactly `rowW` wide and its rows are left-aligned.** A centred row
    // would move every symbol in it whenever the row was short — the last row of a
    // 21-cell table, or the two-cell tail of an 8-cell one — and `acceptance-criteria.md`
    // B7 and P14 both rest on a symbol staying in the cell he learned it in.
    <View style={[styles.grid, { width: layout.rowW }]}>
      {rows.map((row, r) => (
        // eslint-disable-next-line react/no-array-index-key -- the row index IS the key
        <View key={r} style={[styles.row, { marginTop: r === 0 ? 0 : layout.gapY }]}>
          {row.map((cell, c) => (
            <View key={cell.id} style={{ marginLeft: c === 0 ? 0 : layout.gap }}>
              <Tile
                glyph={cell.glyph}
                role={roleOf(cell)}
                live={cell.live}
                size={layout.tile}
                fontSize={layout.tileFont}
                index={cell.index}
                radius={radius}
                hitSlop={Math.floor(Math.min(6, layout.gap / 2))}
                pressed={pressedId === cell.id}
                dipSeq={dipSeqs[cell.id] ?? 0}
                shimmerSeq={shimmerSeq}
                flying={autoPlacedId === cell.id}
                hint={hintId === cell.id ? (hintLevel >= 3 ? 'rim' : 'breathe') : 'rest'}
                reduced={reduced}
                onPressIn={(e) => onDown(cell, e)}
                onPressOut={(e) => onUp(cell, e)}
              />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function CharacterTable({
  table, tableSeq, tint, layout, roleOf, radius, hintSymbolId, hintLevel, pressedId,
  shimmerSeq, autoPlacedId, reduced, onSymbolDown, onSymbolUp,
}) {
  const theme = useTheme();
  const fade = useRef(new Animated.Value(1)).current;
  // The table on screen under the current sequence, captured in the effect and never
  // during render — writing it during render would hand the morph the *new* table as the
  // thing to fade out, which is a cross-fade from a thing to itself.
  const shownSeq = useRef(tableSeq);
  const shownTable = useRef({ cells: table.cells, tint });
  const [outgoing, setOutgoing] = useState(null);

  // **A tap on a flat tile dips it** (M5). The dip is a one-shot, so it is driven by a
  // counter per symbol rather than by a boolean that would have to be cleared.
  const [dipSeqs, setDipSeqs] = useState({});

  // **This effect must depend on `tableSeq` and nothing else.** `table.cells` is a fresh
  // array on every snapshot — the state layer emits several times a second during a
  // chant. An effect that also depended on it re-ran on each emit, its cleanup called
  // `anim.stop()`, the completion callback never saw `finished`, and the outgoing row was
  // never unmounted. That defect was seen on device in Slice 3: the seated tone tile sat
  // in the band, fully opaque, through the whole chant.
  useEffect(() => {
    if (tableSeq === shownSeq.current) return undefined;
    const previous = shownTable.current;
    shownSeq.current = tableSeq;
    shownTable.current = { cells: table.cells, tint };
    setOutgoing(previous);
    fade.setValue(0);
    const anim = Animated.timing(fade, {
      toValue: 1,
      duration: M.tableMorph,
      easing: EASING.enter,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => { if (finished) setOutgoing(null); });
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableSeq]);

  const enterY = fade.interpolate({
    inputRange: [0, 1],
    outputRange: [reduced ? 0 : M.tableRise, 0],
  });
  const leaveOpacity = fade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  const down = (cell, e) => {
    if (!cell.live) setDipSeqs((s) => ({ ...s, [cell.id]: (s[cell.id] ?? 0) + 1 }));
    onSymbolDown(cell.id, e);
  };

  const body = (cells, key) => (
    <Grid
      key={key}
      cells={cells}
      layout={layout}
      roleOf={roleOf}
      radius={radius}
      hintId={hintSymbolId}
      hintLevel={hintLevel}
      pressedId={pressedId}
      dipSeqs={dipSeqs}
      shimmerSeq={shimmerSeq}
      autoPlacedId={autoPlacedId}
      reduced={reduced}
      onDown={down}
      onUp={(cell, e) => onSymbolUp(cell.id, e)}
    />
  );

  return (
    <View style={{ width: layout.tableW, height: layout.tableH, alignItems: 'center', justifyContent: 'center' }}>
      {/* The role tint is two stacked views cross-faded by opacity — a background colour
          is not a transform, so it may not be animated (`acceptance-criteria.md` O3). */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tint ?? theme.ground, borderRadius: 24 }]} />
      {outgoing ? (
        <Animated.View
          style={[styles.inert, StyleSheet.absoluteFill, {
            backgroundColor: outgoing.tint ?? theme.ground,
            borderRadius: 24,
            opacity: leaveOpacity,
          }]}
        />
      ) : null}
      {outgoing ? (
        <Animated.View style={[styles.inert, styles.layer, { opacity: leaveOpacity }]}>
          {body(outgoing.cells, 'out')}
        </Animated.View>
      ) : null}
      <Animated.View style={{ opacity: fade, transform: [{ translateY: enterY }] }}>
        {body(table.cells, 'in')}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * `pointerEvents` as a **prop** is deprecated in React Native 0.81 and is not applied
   * by react-native-web 0.21 — measured in a browser, an overlay declaring it kept a
   * computed `pointer-events: auto`. The **style** key is honoured on both (native since
   * RN 0.73), so it is the portable spelling, and it is the one that actually makes an
   * overlay inert.
   */
  inert: { pointerEvents: 'none' },
  grid: { alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center' },
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
