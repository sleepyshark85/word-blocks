// Word Blocks — the English machine, **revision 4**.
//
// English assembles letter by letter, and `literacy-en.md` §1 is explicit that this is
// correct here even though it would be wrong in Vietnamese. **One tile is one sound,
// never one letter**: `ship` is `sh` `i` `p`, `duck` is `d` `u` `ck`.
//
// The table is **the alphabet, `a`–`z`, in alphabetical order, then the digraphs**
// (`ui.md` §8). Two runs, so two pages on a phone and one on a tablet — and on the
// owner's iPhone page 1 is the whole alphabet in one grid, which is literally what he
// asked for.
//
// `ui.md` §8.1 / AC D1b: **a character with no words behind it is still on the board**,
// at full glyph opacity, permanently flat, and it speaks when pressed. `q` is that
// character today. Nothing here special-cases it: it is in `inventoryOrder`, so it is
// drawn, and the prefix tree simply never makes it live.
//
// `literacy-en.md` §3.3's trap — a final-only tile offered where it cannot legally go —
// is closed for free: `ck`, `ll`, `ss`, `ff`, `zz`, `ng` and `x` are disabled on an empty
// strip because no pack word begins with them (AC D12). The rule is not enforced
// anywhere; it is a consequence of B4.

export const tileGroups = ['letter'];

const glyphLen = (s) => [...String(s)].length;

/**
 * `acceptance-criteria.md` D1, D1a, V4 — two runs: the 26 single letters, then the
 * digraphs. Split by length rather than by a manifest field so the runs are contiguous by
 * construction, which is what makes "runs never share a page" meaningful.
 */
export function runsFor(pack) {
  const order = pack.inventoryOrder.letter;
  const letters = order.filter((tileId) => glyphLen(tileId) === 1);
  const digraphs = order.filter((tileId) => glyphLen(tileId) !== 1);
  const runs = [{ role: 'letter', kind: 'letter', ids: letters }];
  if (digraphs.length > 0) runs.push({ role: 'letter', kind: 'digraph', ids: digraphs });
  return runs;
}

export function pathFor(word) {
  return word.tiles.slice();
}

export function pathIsOnTable(inventory, path) {
  return path.every((tileId) => inventory.has(tileId));
}

function letterSymbol(pack, tileId) {
  const tile = pack.tileById.letter[tileId];
  return {
    id: tileId,
    role: 'letter',
    glyph: tile.glyph,
    label: tile.glyph,
    isVowel: tile.isVowel,
    audio: tile.audio,
  };
}

/** Every letter, in its own permanent cell, at every position (B2a, B2c). */
export function symbolsFor(pack, inventory) {
  return inventory.symbols.map((entry) => ({
    ...letterSymbol(pack, entry.id),
    kind: entry.kind,
    index: entry.index,
    page: entry.page,
    slot: entry.slot,
    runIndex: entry.runIndex,
  }));
}

/**
 * `acceptance-criteria.md` D2, D3 — the symbols placed **plus one empty cell**, and the
 * target length is never shown. An English word's length is part of the discovery.
 */
export function stripCells(pack, prefix) {
  const cells = prefix.map((tileId, index) => ({
    index,
    undoTo: index,
    role: 'letter',
    filled: true,
    merged: false,
    toned: false,
    glyph: pack.tileById.letter[tileId].glyph,
  }));
  // The dashed cell is where the next thing goes; it is not a letter and carries no run
  // (the same `next` role Vietnamese uses, so the strip component is one component).
  cells.push({
    index: prefix.length,
    undoTo: prefix.length,
    role: 'next',
    filled: false,
    merged: false,
    toned: false,
    glyph: null,
  });
  return cells;
}

export function symbolAt(pack, prefix, index) {
  if (index < 0 || index >= prefix.length) return null;
  return letterSymbol(pack, prefix[index]);
}

/**
 * `gameplay.md` §5.4 / AC D10 — the chant uses **short** clips left to right, each letter
 * lighting as it speaks and **the lit run growing**, then the cells merge and the whole
 * word is spoken. Never the `long` anchored form: chanting `"kuh, cat" · "ah, apple"`
 * would be four seconds of noise ending in a word he has already heard twice.
 */
export function chant(pack, word) {
  const gaps = (pack.chant && pack.chant.gapsMs) || {};
  const placed = word.tiles.map((tileId, index) => ({
    index,
    undoTo: index,
    role: 'letter',
    filled: true,
    merged: false,
    toned: false,
    glyph: pack.tileById.letter[tileId].glyph,
  }));
  const steps = word.tiles.map((tileId, i) => ({
    step: 'tile',
    audio: pack.tileById.letter[tileId].audio.short,
    caption: pack.tileById.letter[tileId].glyph,
    cells: placed.slice(0, i + 1),
    lit: placed.slice(0, i + 1).map((_, n) => n),
    merged: false,
    gapAfterMs: i === word.tiles.length - 1 ? (gaps.lastTile ?? 350) : (gaps.tile ?? 200),
  }));
  const merged = [{
    index: 0, undoTo: 0, role: 'letter', filled: true, merged: true, toned: false, glyph: word.text,
  }];
  steps.push({
    step: 'word',
    audio: word.audio.word,
    caption: word.text,
    cells: merged,
    lit: [0],
    merged: true,
    gapAfterMs: gaps.word ?? 600,
  });
  if (word.audio.sentence) {
    steps.push({
      step: 'sentence',
      audio: word.audio.sentence,
      caption: null,
      cells: merged,
      lit: [],
      merged: true,
      gapAfterMs: 0,
    });
  }
  return steps;
}

/**
 * `acceptance-criteria.md` M2, D9, N14 — the parts hint is **the only place the `long`
 * anchored clips are ever heard**. It is a gesture an adult knows and a child does not,
 * made when the board is quiet.
 */
export function partsHint(pack, prefix) {
  return prefix.map((tileId, i) => ({
    step: 'tile',
    audio: pack.tileById.letter[tileId].audio.long ?? pack.tileById.letter[tileId].audio.short,
    caption: pack.tileById.letter[tileId].glyph,
    cells: null,
    lit: [i],
    merged: false,
    gapAfterMs: 200,
  }));
}
