// Ghép Chữ — the Vietnamese machine, **revision 4**.
//
// A syllable is `âm đầu + vần + thanh` (`literacy-vi.md` §1). The engine matches on the
// `(onset, rime, tone)` triple and **never concatenates strings**: `gi` + `i` is `gì`, not
// `gii` (§1.2). Every spelling the child sees comes out of the pack.
//
// **Revision 3 deleted the morph and the `∅` socket** (`gameplay.md` §3.2, §3.4). There
// is one constant table holding every character in the pack, in three contiguous runs —
// `[onsets][rimes][tones]` — and a word that starts with a vowel is started by tapping
// the vowel. `áo` is `ao` + `sắc`: **two taps, no placeholder.**
//
// **Revision 4 pages that table** (`table.mjs`), which changes nothing here: a page is a
// window onto this same sequence, so this module still produces the whole of it.
//
// The one exception to "the characters never change" is the six tone cells, which keep
// their place and swap their **carrier** (`gameplay.md` §3.4a): a bare mark on a dotted
// circle while they are — always — disabled, and the seated rime with that tone's mark
// applied the instant one of them can be chosen. `literacy-vi.md` §5.4 then holds exactly
// as written, at the only moment he is choosing.
//
// This module is only ever reached through `lang/index.mjs`, which is handed the language
// once, at pack load. There is no branch on language anywhere below it.

import { viLegalTones } from '../rules.mjs';

export const tileGroups = ['onset', 'rime', 'tone'];

/** `ui.md` §7.2 — the carrier a tone cell wears while no rime is placed. */
const DOTTED_CIRCLE = '◌';
function bareMark(tone) {
  return DOTTED_CIRCLE + (tone && tone.mark ? tone.mark : '');
}

/**
 * `acceptance-criteria.md` B2, C15, C21 — the table's three runs, in order, complete.
 * Every character the pack declares is here; nothing is truncated and nothing depends on
 * the word list (C22).
 */
export function runsFor(pack) {
  return [
    { role: 'onset', ids: pack.inventoryOrder.onset.slice() },
    { role: 'rime', ids: pack.inventoryOrder.rime.slice() },
    { role: 'tone', ids: pack.inventoryOrder.tone.slice() },
  ];
}

/**
 * The symbols a word is built from, in tap order. **A zero-onset word is two taps**
 * (C19): the rime, then the tone. Onset ids are consonantal and rime ids are
 * vowel-initial, so the two sets are disjoint and a prefix is never ambiguous.
 */
export function pathFor(word) {
  const s = word.syllables[0];
  return s.onset === null ? [s.rime, s.tone] : [s.onset, s.rime, s.tone];
}

/** A word is on the board iff every one of its symbols is in the inventory. */
export function pathIsOnTable(inventory, path) {
  return path.every((symbolId) => inventory.has(symbolId));
}

/** Which run a placed prefix's symbols belong to, by position. */
function rolesOf(pack, prefix) {
  const zeroOnset = prefix.length > 0 && !pack.tileById.onset[prefix[0]];
  return zeroOnset ? ['rime', 'tone'] : ['onset', 'rime', 'tone'];
}

/** The rime in the prefix, if one has been placed. It is what the tone cells carry. */
function rimeOf(pack, prefix) {
  const roles = rolesOf(pack, prefix);
  const at = roles.indexOf('rime');
  const rimeId = at >= 0 && at < prefix.length ? prefix[at] : null;
  return rimeId === null ? null : (pack.tileById.rime[rimeId] ?? null);
}

function onsetSymbol(pack, tileId) {
  const tile = pack.tileById.onset[tileId];
  return {
    id: tileId, role: 'onset', glyph: tile.glyph, label: tile.label, audio: tile.audio,
  };
}

function rimeSymbol(pack, tileId) {
  const tile = pack.tileById.rime[tileId];
  return {
    id: tileId, role: 'rime', glyph: tile.glyph, label: tile.glyph, audio: tile.audio,
  };
}

/**
 * `acceptance-criteria.md` B2d, C6, C7 — a tone cell, in whichever carrier this prefix
 * calls for.
 *
 * With no rime placed it is the **bare mark on a dotted circle**, and it is disabled by
 * construction — a tone cannot be placed before a rime, so the abstraction is never a
 * choice (`gameplay.md` §3.4a). With a rime placed it is **that rime, marked**, read out
 * of the rime's `toned` map; where the orthography has no such form (an illegal tone on a
 * stop-final rime) the cell keeps the bare mark and stays flat. **All six cells are
 * always present**: legality and completability are both flatness now.
 */
function toneSymbol(pack, toneId, rime) {
  const tile = pack.tileById.tone[toneId];
  const marked = rime && rime.toned ? rime.toned[toneId] : null;
  const legal = rime ? viLegalTones(rime.id).includes(toneId) : false;
  return {
    id: toneId,
    role: 'tone',
    glyph: marked && legal ? marked : bareMark(tile),
    carrier: marked && legal ? 'rime' : 'mark',
    label: tile ? tile.label : toneId,
    audio: tile ? tile.audio : { long: null, short: null },
  };
}

/**
 * `acceptance-criteria.md` B2b, B2c — every character in the pack, in its own permanent
 * cell, at every position. Only the tone carriers depend on the prefix, and only they.
 */
export function symbolsFor(pack, inventory, prefix) {
  const rime = rimeOf(pack, prefix);
  return inventory.symbols.map((entry) => {
    if (entry.role === 'onset') return { ...onsetSymbol(pack, entry.id), ...slotOf(entry) };
    if (entry.role === 'rime') return { ...rimeSymbol(pack, entry.id), ...slotOf(entry) };
    return { ...toneSymbol(pack, entry.id, rime), ...slotOf(entry) };
  });
}

function slotOf(entry) {
  return {
    index: entry.index, page: entry.page, slot: entry.slot, runIndex: entry.runIndex,
  };
}

/**
 * `ui.md` §7.2 / `acceptance-criteria.md` C1, C19, C20 — **the strip is the word so far,
 * plus one dashed cell for what is still needed.** No tone cell, ever: the tone is the
 * mark, it lands on the rime, and that a tone was chosen is recorded by a dotted `role3`
 * segment rather than by the word `huyền` on a pre-literate child's screen.
 *
 * When the tone seats, the cells **merge into one word** taken from the pack (`word.text`),
 * because composing a Vietnamese spelling at runtime is forbidden (`literacy-vi.md` §1.2,
 * AC K5).
 */
export function stripCells(pack, prefix, word = null) {
  const roles = rolesOf(pack, prefix);
  const complete = prefix.length === roles.length;

  if (complete && word) {
    return [{
      index: 0,
      undoTo: 0,
      role: 'rime',
      filled: true,
      merged: true,
      toned: true,
      glyph: word.text,
    }];
  }

  const cells = prefix.map((symbolId, i) => {
    const role = roles[i];
    const tile = role === 'onset' ? pack.tileById.onset[symbolId] : pack.tileById.rime[symbolId];
    return {
      index: i,
      undoTo: i,
      role,
      filled: true,
      merged: false,
      toned: false,
      glyph: tile ? tile.glyph : symbolId,
    };
  });
  // **The dashed cell is not a character and has no run.** Its role is `next`, not the
  // run whose turn it is: revision 2's strip had a *tone cell*, and a cell that claims to
  // be a tone is exactly what U14 deleted. It is where the next thing goes, and nothing
  // more (`ui.md` §7.2).
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

/** The symbol descriptor for a seated position, so undo can play its own clip (E8). */
export function symbolAt(pack, prefix, index) {
  if (index < 0 || index >= prefix.length) return null;
  const role = rolesOf(pack, prefix)[index];
  if (role === 'onset') return onsetSymbol(pack, prefix[index]);
  if (role === 'rime') return rimeSymbol(pack, prefix[index]);
  return toneSymbol(pack, prefix[index], rimeOf(pack, prefix));
}

/**
 * The toneless blend — beat 3's spelling. Preferred from the pack (the blend clip records
 * the text it says); composed only as a fallback, and only from stored spellings.
 *
 * A `ngang` word's blend **is** the word (`gameplay.md` §5.4), which is why the seed pack
 * generates no separate clip for one.
 */
function blendOf(pack, word) {
  const s = word.syllables[0];
  const onset = s.onset === null ? null : pack.tileById.onset[s.onset];
  const rime = pack.tileById.rime[s.rime];
  const clip = word.audio.blend;
  if (clip && clip.text) return { text: clip.text, audio: clip };
  if (s.tone === 'ngang') return { text: word.text, audio: word.audio.word };
  // The fallback composes, which Vietnamese generally forbids; it is reached only when a
  // pack carries no blend clip for a marked word, and it composes from stored spellings
  // (the unmarked rime) rather than from a rule. `gi` + `i` is the case it gets wrong,
  // and `content-pipeline.md` is where a blend clip for such a word belongs.
  const base = rime && rime.toned && rime.toned.ngang ? rime.toned.ngang : (rime ? rime.glyph : '');
  return { text: `${onset ? onset.glyph : ''}${base}`, audio: clip };
}

/**
 * **The chant, revision 3 — it accumulates** (`gameplay.md` §5.4, `ui.md` §10.4,
 * AC C12, C12a, C12b, C14).
 *
 *   | beat | shown      | spoken        |
 *   |------|------------|---------------|
 *   | 1    | `b`        | `bờ`          |
 *   | 2    | `b` `o`    | `o`           |
 *   | 3    | `bo`       | `audio.blend` |
 *   | 4    | `bò`       | `huyền`       |
 *   | 5    | `bò`       | `audio.word`  |
 *
 * Every beat carries **the strip as it must look at that beat**, so nothing on screen is
 * ever something that is not part of the word — which is the rule revision 2's tone cell
 * broke. `ngang` skips beat 4; a zero-onset word skips beat 1.
 */
export function chant(pack, word) {
  const s = word.syllables[0];
  const gaps = (pack.chant && pack.chant.gapsMs) || {};
  const onset = s.onset === null ? null : pack.tileById.onset[s.onset];
  const rime = pack.tileById.rime[s.rime];
  const tone = pack.tileById.tone[s.tone];
  const blend = blendOf(pack, word);

  const cell = (glyph, role, extra = {}) => ({
    index: 0, undoTo: 0, role, filled: true, merged: false, toned: false, glyph, ...extra,
  });
  const parts = [];
  if (onset) parts.push(cell(onset.glyph, 'onset'));
  parts.push({ ...cell(rime.glyph, 'rime'), index: parts.length, undoTo: parts.length });

  const steps = [];
  if (onset) {
    steps.push({
      step: 'onset',
      audio: onset.audio.short,
      caption: onset.label,
      cells: [parts[0]],
      lit: [0],
      merged: false,
      gapAfterMs: gaps.onset ?? 250,
    });
  }
  steps.push({
    step: 'rime',
    audio: rime.audio.short,
    caption: rime.glyph,
    cells: parts.slice(),
    lit: parts.map((_, i) => i),
    merged: false,
    gapAfterMs: gaps.rime ?? 250,
  });
  const merged = (glyph, toned) => [{
    index: 0, undoTo: 0, role: 'rime', filled: true, merged: true, toned, glyph,
  }];
  steps.push({
    step: 'blend',
    audio: blend.audio,
    caption: blend.text,
    cells: merged(blend.text, false),
    lit: [0],
    merged: true,
    gapAfterMs: gaps.blend ?? 400,
  });
  const skip = Array.isArray(pack.chant && pack.chant.skipToneStepFor)
    ? pack.chant.skipToneStepFor
    : ['ngang'];
  if (!skip.includes(s.tone) && tone) {
    steps.push({
      step: 'tone',
      audio: tone.audio.short,
      caption: tone.label,
      cells: merged(word.text, true),
      lit: [0],
      merged: true,
      gapAfterMs: gaps.tone ?? 250,
    });
  }
  steps.push({
    step: 'word',
    audio: word.audio.word,
    caption: word.text,
    cells: merged(word.text, s.tone !== 'ngang'),
    lit: [0],
    merged: true,
    gapAfterMs: gaps.word ?? 600,
  });
  if (word.audio.sentence) {
    steps.push({
      step: 'sentence',
      audio: word.audio.sentence,
      caption: null,
      cells: merged(word.text, s.tone !== 'ngang'),
      lit: [],
      merged: true,
      gapAfterMs: 0,
    });
  }
  return steps;
}

/**
 * `ui.md` §2.2 / `acceptance-criteria.md` M2 — hold the strip and the app speaks **the
 * parts of what is currently assembled**, never a completion and never a suggestion. In
 * Vietnamese the `long` slot is the đánh vần name, which is the `short` clip too (N12).
 */
export function partsHint(pack, prefix) {
  const steps = [];
  for (let i = 0; i < prefix.length; i += 1) {
    const sym = symbolAt(pack, prefix, i);
    if (!sym) continue;
    steps.push({
      step: sym.role,
      audio: sym.audio.long ?? sym.audio.short,
      caption: sym.label,
      cells: null,
      lit: [i],
      merged: false,
      gapAfterMs: 250,
    });
  }
  return steps;
}
