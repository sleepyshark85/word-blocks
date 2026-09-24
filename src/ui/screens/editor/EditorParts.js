// The small pieces every editor screen is made of.
//
// **The rule that shapes this file is D24**: *"Given the editor and every parent surface,
// then words and letters are shown exactly as she typed them — never upper-cased."* So
// nothing here draws through `Glyph`, which is where the pack's `display.glyphCase` is
// applied (`src/ui/Text.js`). The editor has its own glyph, deliberately, and
// `test/presentation-audit.test.mjs` is what keeps the two from being confused.
//
// The other rule is `ui.md` §13.3a: the two new screens explain themselves **by drawing
// the strip the child will see**, not by describing it. So `TapStrip` below is a parent-
// surface rendering of `src/ui/WordStrip.js`'s visual vocabulary — one bar per sound,
// solid for a consonant span and split for a vowel span, a 2 pt divider in the gap at a
// boundary — at a fixed size that fits the 520 pt column.

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme, roleTokens } from '../../../theme';
import { AppText } from '../../Text';
import { FONT, GLYPH_BOX_EM } from '../../typography';
import { Picture } from '../../Picture';

/**
 * The strip in the editor: 46 × 70 cells with a 6 pt gap.
 *
 * Sized so that **seven** of them fit the narrowest column this screen ever has —
 * `7 × 52 − 6 = 358` against the 398 pt a 430 pt phone leaves after the parent chrome's
 * 32 pt of padding — because X8 asks for *"the strip drawn to scale with the extra letter
 * falling off the end"*, and a seventh cell that is clipped away entirely shows her
 * nothing. Six cells is `6 × 52 − 6 = 306`, and the board's edge is drawn at exactly that.
 */
const EDIT_CELL_W = 46;
const EDIT_CELL_H = 70;
const EDIT_GAP = 6;

/**
 * A glyph on a parent surface. Be Vietnam Pro, the 1.55 em box of `ui.md` §6.3 so a
 * stacked mark cannot clip, and **no casing** — she sees what she typed.
 */
export function PlainGlyph({ text, size = 30, colour, style }) {
  const theme = useTheme();
  const box = Math.round(size * GLYPH_BOX_EM);
  return (
    <View style={[{ height: box, justifyContent: 'center' }, style]}>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={{
          fontFamily: FONT.tile,
          fontSize: size,
          lineHeight: box,
          color: colour ?? theme.tileGlyph,
          textAlign: 'center',
          includeFontPadding: false,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

/** `ui.md` §5.5 — the identity bar, in the role's own pattern. */
function Bar({ width, height, colour, pattern }) {
  if (pattern === 'dotted') {
    const seg = width * 0.2;
    const gap = (width - seg * 3) / 2;
    return (
      <View style={[styles.barRow, { height }]}>
        <View style={{ width: seg, height, backgroundColor: colour }} />
        <View style={{ width: gap, height }} />
        <View style={{ width: seg, height, backgroundColor: colour }} />
        <View style={{ width: gap, height }} />
        <View style={{ width: seg, height, backgroundColor: colour }} />
      </View>
    );
  }
  if (pattern === 'split') {
    const seg = (width - width * 0.12) / 2;
    return (
      <View style={[styles.barRow, { height }]}>
        <View style={{ width: seg, height, backgroundColor: colour }} />
        <View style={{ width: width * 0.12, height }} />
        <View style={{ width: seg, height, backgroundColor: colour }} />
      </View>
    );
  }
  return <View style={{ width, height, backgroundColor: colour }} />;
}

/**
 * **§13.3a — the taps, drawn to scale.** `letters` are the cells, `spans` say which of
 * them are one sound, and `overflow` is the count that does not fit: X8 asks for *"the
 * strip drawn to scale with the extra letter falling off the end"*, which is the whole
 * explanation and needs no number and no vocabulary.
 */
export function TapStrip({ letters, spans, cells = 6, tone = null }) {
  const theme = useTheme();
  // §13.3a draws the tone as a tap of its own — `chó` is `c` `h` `o` `´`, **four taps** —
  // because tap count is the thing she is confirming. That is deliberately not the board,
  // where the mark lands on the carrier vowel and adds no cell (X28): this screen answers
  // *how many times will he press*, and the board answers *what will he see*.
  const all = tone === null
    ? letters
    : [...letters, `\u25CC${tone.mark ?? ''}`];
  const toneSpan = tone === null
    ? []
    : [{ start: letters.length, end: letters.length + 1, kind: 'tone' }];
  const shown = all.slice(0, cells + 1);
  const spanFor = (i) => [...spans, ...toneSpan].find((s) => i >= s.start && i < s.end) ?? null;
  const pitch = EDIT_CELL_W + EDIT_GAP;

  const edge = cells * pitch - EDIT_GAP;

  return (
    <View style={styles.strip}>
      <View>
        <View style={styles.stripRow}>
          {shown.map((letter, i) => {
            const span = spanFor(i);
            const role = span && span.kind === 'vowel' ? 'role2'
              : span && span.kind === 'tone' ? 'role3' : 'role1';
            const tokens = roleTokens(theme, role);
            const first = span ? i === span.start : true;
            const last = span ? i === span.end - 1 : true;
            const over = i >= cells;
            return (
              <View
                // eslint-disable-next-line react/no-array-index-key -- the slot IS the identity
                key={i}
                style={[styles.cell, {
                  width: EDIT_CELL_W,
                  height: EDIT_CELL_H,
                  marginLeft: i === 0 ? 0 : EDIT_GAP,
                  backgroundColor: theme.tileFace,
                  borderColor: theme.hairline,
                  // **Falling off the end** (X8): past the sixth cell the letter is drawn
                  // at the same scale and the same pitch, faded, beyond the board's edge.
                  opacity: over ? 0.35 : 1,
                }]}
              >
                <View style={styles.cellBody}>
                  <PlainGlyph text={letter} size={30} colour={theme.ink} />
                </View>
                {/* One bar per sound: it runs under every cell of the span and is
                    interrupted only at a real boundary (X10, X20). */}
                <View style={[styles.barSlot, {
                  left: first ? 3 : -EDIT_GAP,
                  right: last ? 3 : -EDIT_GAP,
                }]}
                >
                  <Bar
                    width={EDIT_CELL_W - (first ? 3 : -EDIT_GAP) - (last ? 3 : -EDIT_GAP)}
                    height={5}
                    colour={tokens.edge}
                    pattern={span ? tokens.pattern : 'solid'}
                  />
                </View>
                {/* X20/X22 — the 2 pt divider, centred in the gap before a new sound.
                    **Not before the tone**: X16 says the tone's dotted segment *joins*
                    the vowel span rather than dividing from it, which is also what
                    §13.3a's own sketch draws (`┻┅┅┅┴┅┅┅┘`). The mark lands on the rime. */}
                {span && span.kind !== 'tone' && i === span.start && i > 0 ? (
                  <View style={[styles.divider, {
                    left: -EDIT_GAP / 2 - 1,
                    height: EDIT_CELL_H * 0.5,
                    top: EDIT_CELL_H * 0.25,
                    backgroundColor: theme.neutralFace,
                  }]}
                  />
                ) : null}
              </View>
            );
          })}
        </View>
        {/* The board's edge. Everything to the right of this line is a letter the strip
            cannot draw, and that is the whole explanation — no number, no vocabulary. */}
        {all.length > cells ? (
          <View style={[styles.edge, {
            left: edge + EDIT_GAP / 2 - 1,
            height: EDIT_CELL_H + 12,
            backgroundColor: theme.inkSoft,
          }]}
          />
        ) : null}
      </View>
    </View>
  );
}

/**
 * A model unit — an onset, a rime, a tone, an English sound — drawn as the tile it is in
 * `pack.tiles` (J5). Revision 5 took these **off the board**: the board is the alphabet,
 * and `tiles` is now *"the model only … what the editor offers her"*
 * (`content-pipeline.md` §3.7). They are still the vocabulary she reads.
 */
export function UnitTile({ glyph, role = 'role1', flat = false, onPress, selected = false }) {
  const theme = useTheme();
  const tokens = roleTokens(theme, role);
  const body = (
    <View style={[styles.unit, {
      backgroundColor: flat ? 'transparent' : theme.tileFace,
      borderColor: selected ? tokens.edge : theme.hairline,
      borderWidth: selected ? 2 : 1,
      borderStyle: flat ? 'dashed' : 'solid',
      opacity: flat ? 0.75 : 1,
    }]}
    >
      <PlainGlyph text={glyph} size={22} colour={flat ? theme.inkSoft : theme.ink} />
      <View style={styles.unitBar}>
        <Bar width={44} height={4} colour={tokens.edge} pattern={tokens.pattern} />
      </View>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.unitTap}>{body}</Pressable>
  );
}

/** §13.1 — the 64 pt thumbnail, or the word's bundled emoji, or an empty frame. */
export function Thumb({ row, sourceFor, size = 64 }) {
  const theme = useTheme();
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.ground,
      borderWidth: 1,
      borderColor: theme.hairline,
    }}
    >
      {row.thumb || row.fallbackEmoji ? (
        <Picture
          source={row.thumb ? sourceFor(row.thumb) : null}
          emoji={sourceFor.emoji(row.fallbackEmoji)}
          width={size}
          height={size}
          radius={12}
        />
      ) : null}
    </View>
  );
}

/** The big affordance every step ends with. 56 pt, full width of the column. */
export function PrimaryButton({ label, onPress, disabled = false, tone = 'accent' }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={disabled ? null : onPress}
      accessibilityRole="button"
      disabled={disabled}
      style={[styles.button, {
        backgroundColor: tone === 'accent' ? theme.accentFace : theme.groundAlt,
        borderColor: tone === 'accent' ? theme.accentFace : theme.hairline,
        opacity: disabled ? 0.4 : 1,
      }]}
    >
      <AppText role="button" colour={tone === 'accent' ? theme.groundAlt : theme.ink}>{label}</AppText>
    </Pressable>
  );
}

/** A green dot, an amber half-dot — §13.1's completeness indicator. */
export function CompletenessDot({ playable }) {
  const theme = useTheme();
  return (
    <View style={[styles.dot, {
      backgroundColor: playable ? theme.role3Edge : 'transparent',
      borderColor: playable ? theme.role3Edge : theme.rewardEdge,
    }]}
    />
  );
}

const styles = StyleSheet.create({
  barRow: { flexDirection: 'row', alignItems: 'center' },
  strip: { alignItems: 'flex-start', marginVertical: 12 },
  stripRow: { flexDirection: 'row', alignItems: 'flex-end' },
  cell: {
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellBody: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  barSlot: { position: 'absolute', bottom: 6, height: 5, justifyContent: 'center' },
  divider: { position: 'absolute', width: 2, borderRadius: 1 },
  edge: { position: 'absolute', top: -6, width: 2, borderRadius: 1 },
  unit: {
    minWidth: 56,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  unitBar: { marginTop: 2 },
  unitTap: { marginRight: 8, marginBottom: 8 },
  button: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
});
