// Word Blocks — the English machine, **revision 5**.
//
// **The table is the alphabet, `a`–`z`, one run of 26** (`literacy-en.md` §0.3), and a
// digraph is entered as its letters: `ship` is `s` `h` `i` `p` — four taps and three
// sounds. The ten multi-letter tiles `sh ch th ck ng ll ss ff gg zz` stopped being
// **cells**; they are still **sounds**, they are still in `pack.tiles`, and their clips
// are what a re-voicing second tap plays (§0.6, §0.9, AC D16).
//
// This is the cheap half of revision 5, and that is not a coincidence: English phonics
// already teaches a digraph by pointing at two letters and saying one sound. *"s-h says
// /ʃ/"* is the standard classroom formula, so the digraph tile was a convenience and
// never a doctrine.
//
// `ui.md` §8.1 / AC D1b, D1c: **a character with no words behind it is still on the
// board**, at full glyph opacity, permanently flat, and it speaks when pressed. `j`, `q`,
// `y` and `z` are those characters today. Nothing here special-cases them: they are in
// `inventoryOrder`, so they are drawn, and the prefix tree simply never makes them live.
//
// `literacy-en.md` §3.3's trap — a final-only sound offered where it cannot legally go —
// is closed for free and now by liveness rather than by a withheld tile: `c` then `k` is
// dead at position 1 because no pack word starts `ck` (D1f).

import { enLetterKind } from '../rules.mjs';
import { spansAt, unitText } from '../spans.mjs';

/**
 * `acceptance-criteria.md` D1, D1a, B2k — **one run, 26 cells, `a`–`z`.** The trailing
 * digraph run of revision 4 is deleted; `pack.mjs` has already completed the order
 * against the alphabet, so no letter can be missing however the manifest was edited.
 *
 * `kindOf` gives every letter its permanent role — vowel `role2`/split, consonant
 * `role1`/solid — which English always wanted (`literacy-en.md` §3.2) and Vietnamese now
 * shares (`ui.md` §5.5, AC D5, S5).
 */
export function runsFor(pack) {
  return [{
    role: 'letter',
    kind: 'letter',
    ids: pack.inventoryOrder.letter.slice(),
    kindOf: enLetterKind,
  }];
}

/** The taps: the word's letters. `duck` is `d` `u` `c` `k` — four, for three sounds. */
export function pathFor(word) {
  return word.letters.slice();
}

export function pathIsOnTable(inventory, path) {
  return path.every((letterId) => inventory.has(letterId));
}

/* ------------------------------------------------------------------ the parse */

/**
 * The reading of a prefix. English has no tone and no onset/rime split, so this is the
 * Vietnamese function with two branches removed — but it is **the same idea**, and the
 * important half is identical: the sound boundaries are **stored** (`word.tiles`, turned
 * into `word.spans` at load) and never inferred from the letters (`literacy-en.md` §0.5).
 */
export function readingOf(pack, node, prefix) {
  const completions = node ? node.words.map((id) => pack.wordById[id]).filter(Boolean) : [];
  const word = completions[0] ?? null;
  return {
    letters: prefix.slice(),
    tone: null,
    word,
    exact: null,
    spans: word ? spansAt(word.spans, prefix.length) : [],
    canLetter: Boolean(node && node.live.size > 0),
    canTone: false,
    done: node && node.wordId !== null ? pack.wordById[node.wordId] ?? null : null,
  };
}

function openSpanOf(reading) {
  const span = reading.spans[reading.spans.length - 1] ?? null;
  return span === null ? null : { ...span, text: unitText(reading.letters, span) };
}

function unitClip(pack, id) {
  const table = pack.unitAudio.letter;
  return table && table[id] ? table[id] : null;
}

/**
 * **What a tap says** (`literacy-en.md` §0.6, AC D1e, D7, D19, N14, E15, E16).
 *
 * > A tap speaks the unit it is building, and a tap that completes a digraph speaks the
 * > digraph — superseding, not adding.
 *
 * He hears /s/, then /ʃ/. He never hears /s/ **and** /h/. `c`+`k` says /k/ again, which is
 * the lesson; `g`+`g` says /ɡ/ once, which is the same lesson.
 *
 * Casing reaches none of this (D19): `A` says /æ/ because the clip is keyed on the stored
 * lowercase letter, and a glyph decision cannot touch an audio key.
 */
export function tapAudioFor(pack, reading, letter) {
  const open = openSpanOf(reading);
  if (open) {
    const joined = unitClip(pack, open.text + letter);
    if (joined) return joined;
  }
  return unitClip(pack, letter) ?? { long: null, short: null, silent: true };
}

/** `acceptance-criteria.md` E8 — an undo says the clip of **what is left**. */
export function remainingAudioFor(pack, reading) {
  const open = openSpanOf(reading);
  if (open === null) return null;
  return unitClip(pack, open.text) ?? { long: null, short: null, silent: true };
}

/* ------------------------------------------------------------------ the table */

function letterSymbol(pack, reading, entry) {
  return {
    id: entry.id,
    role: 'letter',
    kind: entry.kind,
    glyph: entry.id,
    label: entry.id,
    carrier: null,
    isVowel: entry.kind === 'vowel',
    audio: tapAudioFor(pack, reading, entry.id),
  };
}

/** Every letter, in its own permanent cell, at every position (B2a, B2n, D1a). */
export function symbolsFor(pack, inventory, prefix, reading) {
  return inventory.symbols.map((entry) => ({
    ...letterSymbol(pack, reading, entry),
    index: entry.index,
    page: entry.page,
    slot: entry.slot,
    runIndex: entry.runIndex,
  }));
}

/* ------------------------------------------------------------------ the strip */

const SPAN_ROLE = { consonant: 'role1', vowel: 'role2' };

/**
 * `ui.md` §7.2 / AC D2, D3, X1–X3, X10, X19, X31 — **the same component Vietnamese uses,
 * with one run missing.** `ship` is `s` `h` (one span) `i` (new span) `p` (new span):
 * four cells, three bars, **two dividers**.
 *
 * English carries a divider at *every* sound boundary where Vietnamese carries exactly
 * one, and that is right rather than an inconsistency: English has no onset/rime split to
 * single out. The mark-slot never appears (X31) — there is no tone to be missing.
 */
export function stripCells(pack, prefix, reading) {
  const { letters, spans } = reading;
  const cells = letters.map((letter, i) => {
    const span = spans.find((sp) => i >= sp.start && i < sp.end) ?? null;
    const spanIndex = span ? spans.indexOf(span) : 0;
    return {
      index: i,
      role: span ? span.kind : enLetterKind(letter),
      spanRole: span ? SPAN_ROLE[span.kind] : SPAN_ROLE[enLetterKind(letter)],
      span: spanIndex,
      spanStart: span ? span.start : i,
      spanEnd: span ? span.end : i + 1,
      dividerBefore: Boolean(span && span.start === i && i > 0),
      filled: true,
      merged: false,
      toned: false,
      markSlot: false,
      glyph: letter,
    };
  });
  // D3 — the number of cells is the number of letters placed plus one, and **the target
  // length is never shown**. The dashed cell goes the moment nothing can follow.
  if (reading.canLetter) {
    cells.push({
      index: letters.length,
      role: 'next',
      spanRole: null,
      span: -1,
      spanStart: letters.length,
      spanEnd: letters.length + 1,
      dividerBefore: false,
      filled: false,
      merged: false,
      toned: false,
      markSlot: false,
      glyph: null,
    });
  }
  return cells;
}

export function symbolAt(pack, prefix, index) {
  if (index < 0 || index >= prefix.length) return null;
  const id = prefix[index];
  return {
    id,
    role: 'letter',
    kind: enLetterKind(id),
    glyph: id,
    label: id,
    audio: (pack.unitAudio.letter && pack.unitAudio.letter[id]) ?? { long: null, short: null },
  };
}

/* ------------------------------------------------------------------ the chant */

/**
 * `gameplay.md` §5.4 / `ui.md` §10.4 / AC D10 — **one beat per sound, and a beat lights
 * its span.** Revision 4 said "each letter lighting as it speaks", which is wrong for five
 * of the forty words: beat 1 of `ship` lights `s` **and** `h`, because they are one sound,
 * exactly as beat 1 of `chó` lights `c` and `h`.
 *
 * The `short` clips left to right, then the cells merge and the whole word is spoken.
 * Never the `long` anchored form: chanting *"kuh, cat" · "ah, apple"* would be four
 * seconds of noise ending in a word he has already heard twice.
 */
export function chant(pack, word) {
  const gaps = (pack.chant && pack.chant.gapsMs) || {};
  const cellsUpTo = (n) => stripCells(pack, word.letters.slice(0, n), {
    letters: word.letters.slice(0, n),
    spans: spansAt(word.spans, n),
    canLetter: false,
  });
  const indicesOf = (span) => {
    const out = [];
    for (let i = span.start; i < span.end; i += 1) out.push(i);
    return out;
  };

  const steps = word.spans.map((span, i) => {
    const tile = pack.tileById.letter[span.unit];
    return {
      step: 'tile',
      audio: tile ? tile.audio.short : null,
      caption: span.unit,
      cells: cellsUpTo(span.end),
      lit: indicesOf({ start: 0, end: span.end }),
      spanLit: indicesOf(span),
      merged: false,
      gapAfterMs: i === word.spans.length - 1 ? (gaps.lastTile ?? 350) : (gaps.tile ?? 200),
    };
  });

  const merged = [{
    index: 0,
    role: 'consonant',
    spanRole: 'role1',
    span: 0,
    spanStart: 0,
    spanEnd: 1,
    dividerBefore: false,
    filled: true,
    merged: true,
    toned: false,
    markSlot: false,
    glyph: word.text,
  }];
  steps.push({
    step: 'word',
    audio: word.audio.word,
    caption: word.text,
    cells: merged,
    lit: [0],
    spanLit: [0],
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
      spanLit: [],
      merged: true,
      gapAfterMs: 0,
    });
  }
  return steps;
}

/**
 * `acceptance-criteria.md` M2, D9, N14 — the parts hint is **the only place the `long`
 * anchored clips are ever heard**, and its parts are the **sounds**: `s h i p` says
 * /ʃ/ · /ɪ/ · /p/, three parts for four letters.
 */
export function partsHint(pack, prefix, reading) {
  return reading.spans.map((span) => {
    const text = unitText(reading.letters, span);
    const clip = unitClip(pack, text);
    const lit = [];
    for (let i = span.start; i < span.end; i += 1) lit.push(i);
    return {
      step: 'tile',
      audio: clip ? (clip.long ?? clip.short) : null,
      caption: text,
      cells: null,
      lit,
      spanLit: lit,
      merged: false,
      gapAfterMs: 200,
    };
  });
}
