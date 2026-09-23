// The character table. `ui.md` §5.8, §7.1, §7.1a and §9.1 — the board, and the whole
// mechanic.
//
// One fixed grid per page, row-major, in the pack's inventory order. **The contents do
// not depend on any word** (`gameplay.md` §3.2, §0B.1): `ng` is page 1, row 3, column 3,
// today and tomorrow, which is the largest single pedagogical gain of the correction and
// is why this component never reorders, never reshuffles and never removes a cell.
//
// What changes under his finger is which tiles are *standing*. That is M6, and it lives
// in `Tile`: two stacked faces cross-faded by opacity with a 2 pt rise, staggered 20 ms by
// cell index. Nothing here animates a layout, and **no tile ever moves cell**
// (`acceptance-criteria.md` B8, E7, B2c).
//
// **Revision 4 — paging.** The pages are laid out **side by side in one row**, all of
// them, and the window slides over them with a single `translateX` (M7a). That is the
// whole difference from the morph the owner rejected: a slide says *we moved along the
// board*, where the morph's cross-fade said *these cells are now something else*
// (`ui.md` §7.1a). Under reduce-motion it becomes a cross-fade of the same duration
// (§10.5), because a translation is the thing reduce-motion is for.
//
// Every page uses the **same tile size and column count**, computed once from the largest
// page, and is **top-aligned** (V9), so row 1 is at the same height on every page and a
// tile never resizes or reflows when he changes page.

import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { EASING } from '../motion/easing';
import { Tile } from './Tile';

function chunk(items, perLine) {
  const out = [];
  for (let i = 0; i < items.length; i += perLine) out.push(items.slice(i, i + perLine));
  return out;
}

function Page({
  cells, layout, roleOf, radius, hintId, hintLevel, pressedId, dipSeqs, shimmerSeq,
  autoPlacedId, reduced, onDown, onUp,
}) {
  const rows = chunk(cells, layout.cols);
  return (
    // **The grid is exactly `rowW` wide and its rows are left-aligned.** A centred row
    // would move every symbol in it whenever the row was short — the last row of a
    // 26-cell page in a 4 × 7 grid — and `acceptance-criteria.md` B7, B2a and P14 all
    // rest on a symbol staying in the cell he learned it in.
    <View style={[styles.grid, { width: layout.rowW }]}>
      {rows.map((row, r) => (
        // eslint-disable-next-line react/no-array-index-key -- the row index IS the key
        <View key={r} style={[styles.row, { marginTop: r === 0 ? 0 : layout.gapY }]}>
          {row.map((cell, c) => (
            <View key={cell.id} style={{ marginLeft: c === 0 ? 0 : layout.gap }}>
              <Tile
                glyph={cell.glyph}
                carrier={cell.carrier}
                role={roleOf(cell)}
                live={cell.live}
                size={layout.tile}
                fontSize={layout.tileFont}
                index={cell.slot}
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
  table, page, pageSeq, pageSlideMs, layout, roleOf, radius, hintSymbolId, hintLevel,
  pressedId, shimmerSeq, autoPlacedId, reduced, onSymbolDown, onSymbolUp,
}) {
  // **A tap on a flat tile dips it** (M5). The dip is a one-shot, so it is driven by a
  // counter per symbol rather than by a boolean that would have to be cleared.
  const [dipSeqs, setDipSeqs] = useState({});
  const down = (cell, e) => {
    if (!cell.live) setDipSeqs((seqs) => ({ ...seqs, [cell.id]: (seqs[cell.id] ?? 0) + 1 }));
    onSymbolDown(cell.id, e);
  };
  const up = (cell, e) => onSymbolUp(cell.id, e);

  const pages = [];
  for (const cell of table.cells) {
    const p = cell.page ?? 0;
    (pages[p] ?? (pages[p] = [])).push(cell);
  }

  // `translateX` for the sheet, `opacity` for the reduce-motion case. Both are transforms
  // or opacity, per the motion law (O1, O3) — **nothing here animates a layout.**
  const slide = useRef(new Animated.Value(page)).current;
  const shown = useRef(page);
  const lastSeq = useRef(pageSeq);

  useEffect(() => {
    if (pageSeq === lastSeq.current && page === shown.current) return undefined;
    lastSeq.current = pageSeq;
    shown.current = page;
    const anim = Animated.timing(slide, {
      toValue: page,
      duration: pageSlideMs,
      easing: EASING.enter,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [page, pageSeq, pageSlideMs, slide]);

  const width = layout.tableW ?? 0;
  const translateX = slide.interpolate({
    inputRange: [0, Math.max(1, pages.length - 1)],
    outputRange: [0, -width * Math.max(1, pages.length - 1)],
  });

  return (
    <View style={{ width, height: layout.tableH, overflow: 'hidden' }}>
      <Animated.View
        style={[styles.sheet, {
          width: width * pages.length,
          transform: reduced ? [] : [{ translateX }],
        }]}
      >
        {pages.map((cells, i) => {
          // Under reduce-motion the slide is a cross-fade of the same duration (§10.5),
          // so every page sits in the same place and only its opacity moves.
          const opacity = reduced
            ? slide.interpolate({
              inputRange: [i - 1, i, i + 1],
              outputRange: [0, 1, 0],
              extrapolate: 'clamp',
            })
            : 1;
          return (
            <Animated.View
              key={cells[0].id}
              style={[
                styles.page,
                {
                  width,
                  opacity,
                  ...(reduced ? { position: 'absolute', left: 0, top: 0 } : null),
                },
                // A page he is not looking at must not be touchable, or a fat finger at
                // the edge of the window would seat a symbol he cannot see.
                i === page ? null : styles.inert,
              ]}
            >
              <Page
                cells={cells}
                layout={layout}
                roleOf={roleOf}
                radius={radius}
                hintId={hintSymbolId}
                hintLevel={hintLevel}
                pressedId={pressedId}
                dipSeqs={dipSeqs}
                shimmerSeq={i === page ? shimmerSeq : 0}
                autoPlacedId={autoPlacedId}
                reduced={reduced}
                onDown={down}
                onUp={up}
              />
            </Animated.View>
          );
        })}
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
  sheet: { flexDirection: 'row' },
  // **Top-aligned** (V9): a short page — the six tones in a 26-cell grid — simply has
  // empty space below it, and row 1 never moves.
  page: { alignItems: 'center', justifyContent: 'flex-start' },
  grid: { alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center' },
});
