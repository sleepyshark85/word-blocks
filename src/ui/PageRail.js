// The page rail. `ui.md` §7.1b, §9.1a; `acceptance-criteria.md` V16–V21, V26.
//
// **It is made of tiles.** That is the entire design idea: the rail speaks the only
// visual language the child has already been taught, so *there is something for you over
// there* needs no explanation, no icon and no reading.
//
//   ┏━━━━┓   ┌────┐   ┌ ── ┐      current  = raised 4 pt, `reward` face, ink glyph
//   ┃ m  ┃   │ ưa │   ╎ ◌̀ ╎      standing = exactly a live tile
//   ┗━━━━┛   └────┘   └ ── ┘      flat     = exactly a disabled tile, and still pressable
//
// The glyph on a button is **that page's first character** — a sample of what is over
// there, not a number and not a word. Pressing one plays **the page sound only, never
// speech** (V19): the glyph is a label, not a character he is choosing, and speaking it
// would teach that pressing a character and pressing a page are the same act.
//
// **Absent entirely when the table is not paged** (V1). Every tablet has no rail at all,
// which is the best version of the board.

import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { M } from '../motion/durations.mjs';
import { RAIL_GAP, TILE_MIN } from '../layout/layout.mjs';
import { Tile } from './Tile';

export function PageRail({
  rail, railCols, roleOf, radius, reduced, shimmerSeq, hintPage, hintLevel, onPressPage,
}) {
  const theme = useTheme();
  if (!rail || !rail.paged) return null;

  const cols = Math.max(1, railCols || 1);
  const rows = [];
  for (let i = 0; i < rail.buttons.length; i += cols) rows.push(rail.buttons.slice(i, i + cols));

  return (
    <View style={styles.rail} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {rows.map((row) => (
        <View key={`rail-${row[0].page}`} style={[styles.row, { marginTop: RAIL_GAP }]}>
          {row.map((button, c) => (
            <View
              key={button.page}
              style={{
                marginLeft: c === 0 ? 0 : RAIL_GAP,
                // V18 — the current page's button sits 4 pt proud. A margin, not an
                // animation: nothing about the rail's geometry moves.
                marginTop: button.current ? -M.railRise : 0,
              }}
            >
              <Tile
                glyph={button.glyph}
                role={roleOf(button)}
                live={button.live}
                current={button.current}
                currentFace={theme.reward}
                size={TILE_MIN}
                fontSize={Math.floor(TILE_MIN * 0.42)}
                index={button.page}
                radius={radius}
                hitSlop={Math.floor(RAIL_GAP / 2)}
                // V26 — at 20 s the shimmer also crosses the standing buttons of pages he
                // is not on; at 40 s the breathing element is that button rather than a
                // tile he cannot see.
                shimmerSeq={button.current ? 0 : shimmerSeq}
                hint={hintPage === button.page ? (hintLevel >= 3 ? 'rim' : 'breathe') : 'rest'}
                reduced={reduced}
                onPressIn={() => onPressPage(button.page)}
                onPressOut={() => {}}
              />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
});
