// Word Blocks — the English machine, revision 2.
//
// English assembles letter by letter, and `literacy-en.md` §1 is explicit that this is
// correct here even though it would be wrong in Vietnamese. **One tile is one sound,
// never one letter**: `ship` is `sh` `i` `p`, `duck` is `d` `u` `ck`, `frog` is four
// tiles because `fr` is a blend and not a digraph.
//
// **Revision 2 deleted the tray builder.** There is no target, so there are no
// distractors to choose and no multiplicity to guarantee. What is left is one inventory,
// in alphabetical order, the same table at every position — and the prefix tree deciding
// which of its tiles stand up.
//
// `literacy-en.md` §3.3's trap — a final-only tile offered where it cannot legally go —
// is now closed for free: `ck`, `ll`, `ss`, `ff`, `zz`, `ng` and `x` are disabled on an
// empty strip because no pack word begins with them (`acceptance-criteria.md` D12). The
// rule is not enforced anywhere; it is a consequence of B4.

export const id = 'en';
export const tileGroups = ['letter'];

/** `acceptance-criteria.md` B2 — the first `cells` of the pack's inventory order. */
export function inventoryFor(pack, cells) {
  return { letter: pack.inventoryOrder.letter.slice(0, cells) };
}

export function pathFor(word) {
  return word.tiles.slice();
}

export function pathIsOnTable(inventory, path) {
  return path.every((t) => inventory.letter.includes(t));
}

function letterSymbol(pack, tileId) {
  const tile = pack.tileById.letter[tileId];
  return {
    id: tileId,
    role: 'letter',
    kind: 'tile',
    glyph: tile.glyph,
    label: tile.glyph,
    isVowel: tile.isVowel,
    audio: tile.audio,
  };
}

/** One table, every position. `ui.md` §8: the letters in alphabetical order. */
export function tableFor(pack, inventory) {
  return { position: 0, role: 'letter', symbols: inventory.letter.map((t) => letterSymbol(pack, t)) };
}

/**
 * `acceptance-criteria.md` D2, D3 — the symbols placed **plus one empty cell**, and the
 * target length is never shown. An English word's length is part of the discovery.
 */
export function stripCells(pack, prefix) {
  const cells = prefix.map((tileId, index) => ({
    index,
    role: 'letter',
    filled: true,
    socket: false,
    glyph: pack.tileById.letter[tileId].glyph,
  }));
  cells.push({ index: prefix.length, role: 'letter', filled: false, socket: false, glyph: null });
  return cells;
}

export function symbolAt(pack, prefix, index) {
  if (index < 0 || index >= prefix.length) return null;
  return letterSymbol(pack, prefix[index]);
}

/**
 * `gameplay.md` §5.4 and `acceptance-criteria.md` D10: the chant uses **short** clips
 * left to right, then the whole word — never the long anchored form. Chanting
 * `"kuh, cat" · "ah, apple" · "tuh, ten" → "cat"` would be four seconds of noise ending
 * in a word he has already heard twice.
 */
export function chant(pack, word) {
  const gaps = (pack.chant && pack.chant.gapsMs) || {};
  const steps = word.tiles.map((tileId, i) => ({
    step: 'tile',
    cell: i,
    audio: pack.tileById.letter[tileId].audio.short,
    caption: pack.tileById.letter[tileId].glyph,
    gapAfterMs: i === word.tiles.length - 1 ? (gaps.lastTile ?? 350) : (gaps.tile ?? 200),
  }));
  steps.push({ step: 'word', cell: null, audio: word.audio.word, caption: word.text, gapAfterMs: gaps.word ?? 600 });
  if (word.audio.sentence) {
    steps.push({ step: 'sentence', cell: null, audio: word.audio.sentence, caption: null, gapAfterMs: 0 });
  }
  return steps;
}

/** `acceptance-criteria.md` M2 — the parts of what is assembled, never a completion. */
export function partsHint(pack, prefix) {
  return prefix.map((tileId, i) => ({
    step: 'tile',
    cell: i,
    audio: pack.tileById.letter[tileId].audio.short,
    caption: pack.tileById.letter[tileId].glyph,
    gapAfterMs: 200,
  }));
}
