// Ghép Chữ — the Vietnamese machine, **revision 5**.
//
// **The input is letter by letter. The model is đánh vần.** The owner played revision 4
// and asked for the standard alphabet, then said his son enters a digraph by tapping its
// letters — *"Choose C and choose H"* — and separately confirmed the boy is being taught
// đánh vần (`literacy-vi.md` §0.1). So `ch` is two taps and is still one âm đầu; the word
// is still `(onset, rime, tone)`; the chant still says `chờ`.
//
//     the board      29 letters, the owner's alphabet, then 6 tones = 35 cells
//     a word         letters, then one tone tap:  chó = c · h · o · sắc
//     the strip      one cell per letter, and a BAR per sound (§7.2)
//
// Three rules this file exists to hold, all of them from `literacy-vi.md` §0:
//
//   1. **The onset/rime boundary is STORED, never inferred from the letter stream** (§0.5,
//      AC C4f). `gì` is the onset `gi` plus the rime `i` written with one `i`, and no rule
//      over `g` `i` can recover that. The parse comes off the word's own triple, through
//      `word.spans`, which `pack.mjs` built once at load.
//   2. **A tap speaks the unit it is building, as far as it has got** (§0.9, AC E15, E16,
//      N14). `c` says `cờ`; `h` then says `chờ`, *superseding* it — never `cờ` then `hờ`.
//      The speech channel already cuts hard (`ui.md` §11.2), so this is a lookup, not new
//      machinery: `tiles` first, then `prefixAudio`.
//   3. **The engine never composes a spelling** (§1.2, AC K5). Every glyph the child sees
//      — a letter, a marked rime on a tone cell, the finished word — is read from the
//      pack. A completed word's per-cell glyphs are `word.text` *split*, which is reading
//      a stored spelling rather than building one.
//
// The six tone cells keep their place and swap their **carrier** (`gameplay.md` §3.4a):
// a bare mark on a dotted circle while they are — always — disabled, and the seated rime
// with that tone's mark applied the instant one of them can be chosen. That still works
// *because* đánh vần survived: the rime is known. It is the largest single dividend of
// not throwing the model away (`literacy-vi.md` §0.3).
//
// This module is only ever reached through `lang/index.mjs`, which is handed the language
// once, at pack load. There is no branch on language anywhere below it.

import { viLegalTones, viLetterKind } from '../rules.mjs';
import { spansAt, unitText } from '../spans.mjs';

/** `ui.md` §7.2 — the carrier a tone cell wears while no rime is placed. */
const DOTTED_CIRCLE = '◌';
function bareMark(tone) {
  return DOTTED_CIRCLE + (tone && tone.mark ? tone.mark : '');
}

/**
 * `acceptance-criteria.md` B2, B2j, C21 — **the board: two runs, 35 cells.** The 29
 * letters in the owner's alphabet order, then the six tones in the set phrase `ngang
 * huyền sắc hỏi ngã nặng`. Both come from the pack's `inventoryOrder`, which `pack.mjs`
 * has already completed against the alphabet, so a letter cannot be missing from the
 * board however the manifest was edited.
 *
 * `kindOf` is what makes a role a **property of the glyph** (`ui.md` §5.5, AC B2l): `h` is
 * a consonant in `ch`, in `hoa` and on the tone page, for the life of the app.
 */
export function runsFor(pack) {
  return [
    {
      role: 'letter',
      kind: 'letter',
      ids: pack.inventoryOrder.letter.slice(),
      kindOf: viLetterKind,
    },
    {
      role: 'tone',
      kind: 'tone',
      ids: pack.inventoryOrder.tone.slice(),
      kindOf: () => 'tone',
    },
  ];
}

/**
 * The symbols a word is built from, in tap order: **its letters, then its tone.**
 * `chó` is `c` `h` `o` sắc — four taps for a two-sound word — and `áo` is `a` `o` sắc,
 * three taps with no onset (C19). Letters and tone ids are disjoint (`sac` is not a
 * letter), so a prefix is never ambiguous about which run its last symbol came from.
 */
export function pathFor(word) {
  return [...word.letters, word.syllables[0].tone];
}

/** A word is on the board iff every one of its symbols is in the inventory. */
export function pathIsOnTable(inventory, path) {
  return path.every((symbolId) => inventory.has(symbolId));
}

/* ------------------------------------------------------------------ the parse */

/**
 * **The reading of a prefix**, and the only place the parse is decided.
 *
 * It is read off a word that completes the prefix — `node.words[0]`, which every reachable
 * prefix has — so the onset/rime boundary is the *stored* one (§0.5). At every reachable
 * letter prefix of the pack, all completing words agree about that boundary; the
 * literacy-designer measured zero disagreements over all 50 seed words, and the one
 * spelling that could disagree (`gì`) is why this is read rather than derived.
 *
 * @param {object} pack
 * @param {object|null} node  the prefix tree node at this prefix
 * @param {string[]} prefix
 */
export function readingOf(pack, node, prefix) {
  const last = prefix.length > 0 ? prefix[prefix.length - 1] : null;
  const tone = last !== null && pack.tileById.tone[last] ? last : null;
  const letters = tone === null ? prefix.slice() : prefix.slice(0, -1);
  const completions = node ? node.words.map((id) => pack.wordById[id]).filter(Boolean) : [];
  const word = completions[0] ?? null;
  // The word whose letters are *exactly* these: the one a tone would finish. It is what
  // the tone cells carry (B2d, C5) and what an undo of the tone speaks (C11).
  const exact = completions.find((w) => w.letters.length === letters.length) ?? null;
  const live = node ? node.live : new Set();
  let canTone = false;
  let canLetter = false;
  for (const id of live) {
    if (pack.tileById.tone[id]) canTone = true;
    else canLetter = true;
  }
  return {
    letters,
    tone,
    word,
    exact,
    spans: word ? spansAt(word.spans, letters.length) : [],
    canLetter,
    canTone,
    /** The word this exact prefix spells, tone and all. */
    done: tone !== null && node && node.wordId !== null ? pack.wordById[node.wordId] ?? null : null,
  };
}

/** The span being built, and the text it has so far — `c` of `ch`, `ă` of `ăng`. */
function openSpanOf(reading) {
  const span = reading.spans[reading.spans.length - 1] ?? null;
  return span === null ? null : { ...span, text: unitText(reading.letters, span) };
}

function unitClip(pack, group, id) {
  const table = pack.unitAudio[group];
  return table && table[id] ? table[id] : null;
}

/**
 * **What a tap says** (`literacy-vi.md` §0.9, AC E15, E16, C4a, C4b, C18, N14).
 *
 * > A tap always speaks the unit it is currently building, as far as it has got.
 *
 * `c` says `cờ`; `h` after `c` says **`chờ`**, which *replaces* `cờ` rather than adding
 * `hờ` to it. The rime half is the same rule, which is what makes it one rule: `ă` says
 * `á`, `ăn` says `ăn`, `ăng` says `ăng`.
 *
 * The cascade is four lookups, in this order, and it answers for a **flat** tile too
 * (E16 — `h` with `c` seated says `chờ` whether or not `ch` leads anywhere here):
 *
 *   1. this span, extended by the letter    `c` + `h` -> onset `ch`
 *   2. the next unit, started by the letter `c` + `a` -> rime `a`
 *   3. this span's group, the letter alone  a letter that starts neither
 *   4. any group, the letter alone          so that every tap answers
 */
export function tapAudioFor(pack, reading, letter) {
  if (pack.tileById.tone[letter]) return pack.tileById.tone[letter].audio;
  const open = openSpanOf(reading);
  const group = open ? open.group : 'onset';
  const next = 'rime';
  const tries = open
    ? [[group, open.text + letter], [next, letter], [group, letter]]
    : [['onset', letter], ['rime', letter]];
  for (const [g, id] of tries) {
    const clip = unitClip(pack, g, id);
    if (clip) return clip;
  }
  for (const g of ['onset', 'rime']) {
    const clip = unitClip(pack, g, letter);
    if (clip) return clip;
  }
  return { long: null, short: null, silent: true };
}

/**
 * **What an undo says: the clip of what is LEFT** (`gameplay.md` §4.4, AC E8, C11).
 * Undoing `h` from `c h` says `cờ`, not `hờ` — the tap rule running backwards.
 *
 * With the tone returned from `c h o` the thing left is a whole toneless syllable, and
 * what that says is the word's **blend** clip — `cho` — which is the same recording chant
 * beat 3 plays. C11 names all four clips of emptying `chó`: `cho`, `chờ`, `cờ`, nothing.
 */
export function remainingAudioFor(pack, reading) {
  if (reading.letters.length === 0) return null;
  if (reading.tone === null && reading.exact) {
    const blend = reading.exact.audio.blend;
    if (blend) return { long: blend, short: blend };
    // A `ngang` word's blend IS the word, so the pack generates no separate clip for one
    // (`gameplay.md` §5.4).
    if (reading.exact.syllables[0].tone === 'ngang' && reading.exact.audio.word) {
      return { long: reading.exact.audio.word, short: reading.exact.audio.word };
    }
  }
  const open = openSpanOf(reading);
  if (open === null) return null;
  return unitClip(pack, open.group, open.text) ?? { long: null, short: null, silent: true };
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
    audio: tapAudioFor(pack, reading, entry.id),
  };
}

/**
 * `acceptance-criteria.md` B2d, C6, C7 — a tone cell, in whichever carrier this prefix
 * calls for.
 *
 * With no complete rime placed it is the **bare mark on a dotted circle**, and it is
 * disabled by construction — a tone cannot be placed before a rime, so the abstraction is
 * never a choice (`gameplay.md` §3.4a). With one placed it is **that rime, marked**, read
 * out of the rime's `toned` map; where the orthography has no such form (an illegal tone
 * on a stop-final rime) the cell keeps the bare mark and stays flat. **All six cells are
 * always present** (C7).
 *
 * C5: the swap happens on the letter that **completes** the rime, because that is when a
 * word ends exactly here. `ăng` holds bare marks through `ă` and `ăn`.
 */
function toneSymbol(pack, toneId, rime) {
  const tile = pack.tileById.tone[toneId];
  const marked = rime && rime.toned ? rime.toned[toneId] : null;
  const legal = rime ? viLegalTones(rime.id).includes(toneId) : false;
  return {
    id: toneId,
    role: 'tone',
    kind: 'tone',
    glyph: marked && legal ? marked : bareMark(tile),
    carrier: marked && legal ? 'rime' : 'mark',
    label: tile ? tile.label : toneId,
    audio: tile ? tile.audio : { long: null, short: null },
  };
}

function slotOf(entry) {
  return {
    index: entry.index, page: entry.page, slot: entry.slot, runIndex: entry.runIndex,
  };
}

/**
 * `acceptance-criteria.md` B2a, B2c, B2n — every character in the pack, in its own
 * permanent cell, at every position. Only the tone carriers depend on the prefix, and
 * only they; a letter's cell, size, bar and role never change.
 *
 * The **clip** a cell would play does depend on the prefix (E15), and that is not a change
 * to the board: nothing about the tile is drawn from it.
 */
export function symbolsFor(pack, inventory, prefix, reading) {
  const rimeId = reading && reading.exact ? reading.exact.syllables[0].rime : null;
  const rime = rimeId === null ? null : (pack.tileById.rime[rimeId] ?? null);
  return inventory.symbols.map((entry) => {
    if (entry.role === 'tone') return { ...toneSymbol(pack, entry.id, rime), ...slotOf(entry) };
    return { ...letterSymbol(pack, reading, entry), ...slotOf(entry) };
  });
}

/* ------------------------------------------------------------------ the strip */

const SPAN_ROLE = { consonant: 'role1', vowel: 'role2' };

/**
 * Which cell wears the mark. It is the rime's stored carrier (`pack.mjs` read it out of
 * the rime's own toned forms), offset by where the rime starts in the strip.
 *
 * The fallback covers the one spelling that can collapse a rime to nothing of its own —
 * `gì`, the onset `gi` plus the rime `i` sharing a single `i` — where the mark lands on a
 * letter inside the onset span. Nothing in the seed list does it; his mother can type it
 * tomorrow, and the app degrades to marking the last vowel letter rather than to nothing.
 */
function carrierIndex(word, reading) {
  const rimeSpan = word.spans.find((s) => s.group === 'rime') ?? null;
  if (rimeSpan && rimeSpan.end > rimeSpan.start) {
    return Math.min(rimeSpan.start + (word.carrierOffset ?? 0), rimeSpan.end - 1);
  }
  for (let i = reading.letters.length - 1; i >= 0; i -= 1) {
    if (viLetterKind(reading.letters[i]) === 'vowel') return i;
  }
  return Math.max(0, reading.letters.length - 1);
}

/**
 * **The per-cell glyphs of a finished word** — `b` `ò`, not `b` `o`.
 *
 * `word.text` is the stored spelling; splitting it by codepoint is **reading** it, not
 * composing one (§1.2). It is used only when the split has exactly one character per
 * letter, which every NFC Vietnamese syllable in the pack does; anything else keeps the
 * plain letters, so a strange spelling costs a mark on screen rather than a wrong word.
 */
function tonedGlyphs(word, letters) {
  const chars = [...String(word.text).normalize('NFC')];
  return chars.length === letters.length ? chars : letters;
}

/**
 * `ui.md` §7.2 / AC X1–X3, X10, X11, X19–X33 — **the strip: one cell per letter, one bar
 * per sound, and a divider where the next part of the word starts.**
 *
 * Nothing merges while he is building. Revision 3's rejected morph was cells becoming
 * other cells, and revision 5's answer is that the *bar* grows instead: `c` then `h` is
 * two cells under one bar (X11, X12). The only merge left in the app is chant beat 3,
 * after the word is already made (X26).
 *
 * Two ways something can be missing, and they are different shapes (X27, X28, X29): a
 * **dashed next-cell** means another letter goes here; a **dashed mark-slot above the
 * carrier vowel** means a mark goes here. At `b`+`o`, `c`+`a` and `m`+`u` both are true
 * and both are drawn.
 */
export function stripCells(pack, prefix, reading) {
  const { letters, spans, done } = reading;
  const glyphs = done ? tonedGlyphs(done, letters) : letters;
  const carrier = reading.word ? carrierIndex(reading.word, reading) : -1;
  const marked = done !== null;
  const cells = letters.map((letter, i) => {
    const span = spans.find((sp) => i >= sp.start && i < sp.end) ?? null;
    const spanIndex = span ? spans.indexOf(span) : 0;
    return {
      index: i,
      role: span ? span.kind : 'consonant',
      spanRole: span ? SPAN_ROLE[span.kind] : 'role1',
      span: spanIndex,
      spanStart: span ? span.start : i,
      spanEnd: span ? span.end : i + 1,
      // X20, X24 — a divider is drawn where a sound ends, and a zero-onset word has no
      // onset to be divided from, so `áo` draws none at all.
      dividerBefore: Boolean(span && span.start === i && i > 0),
      filled: true,
      merged: false,
      toned: marked && i === carrier,
      markSlot: !marked && reading.canTone && i === carrier,
      glyph: glyphs[i],
    };
  });
  // X27 / X30 — the dashed cell is drawn only while another letter can follow, and never
  // once the word is made. It is **not a character**: it has no run, no clip and no tile
  // in the table (X32).
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

/** The symbol descriptor at a seated position — what flies home on an undo (E8). */
export function symbolAt(pack, prefix, index, reading) {
  if (index < 0 || index >= prefix.length) return null;
  const id = prefix[index];
  if (pack.tileById.tone[id]) {
    const rimeId = reading && reading.word ? reading.word.syllables[0].rime : null;
    return toneSymbol(pack, id, rimeId === null ? null : pack.tileById.rime[rimeId]);
  }
  return {
    id,
    role: 'letter',
    kind: viLetterKind(id),
    glyph: id,
    label: id,
    audio: pack.unitAudio.onset[id] ?? pack.unitAudio.rime[id] ?? { long: null, short: null },
  };
}

/* ------------------------------------------------------------------ the chant */

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
 * **The chant — five beats, and a beat lights a SPAN** (`gameplay.md` §5.4, `ui.md` §10.4,
 * AC C12, C12a, C12e, C14, U38).
 *
 *   | beat | shown        | lit          | spoken        |
 *   |------|--------------|--------------|---------------|
 *   | 1    | `c` `h`      | both cells   | `chờ`         |
 *   | 2    | `c` `h` `o`  | `o`          | `o`           |
 *   | 3    | `cho`        | merged       | `audio.blend` |
 *   | 4    | `chó`        | merged       | `sắc`         |
 *   | 5    | `chó`        | merged       | `audio.word`  |
 *
 * **The beat count is a property of the model, not of the taps**: `chó` is four taps and
 * five beats, exactly as `bò` is three taps and five beats. That is the whole of what đánh
 * vần buys and the reason revision 5 did not throw it away.
 *
 * Every beat carries **the strip as it must look at that beat**, so nothing on screen is
 * ever something that is not part of the word. `ngang` skips beat 4; a zero-onset word
 * skips beat 1, and its two letters are one span from the first tap, so beat 2 lights both.
 */
export function chant(pack, word) {
  const s = word.syllables[0];
  const gaps = (pack.chant && pack.chant.gapsMs) || {};
  const rime = pack.tileById.rime[s.rime];
  const tone = pack.tileById.tone[s.tone];
  const blend = blendOf(pack, word);
  const spans = word.spans;

  const cellsUpTo = (n) => stripCells(pack, word.letters.slice(0, n), {
    letters: word.letters.slice(0, n),
    tone: null,
    word,
    exact: null,
    spans: spansAt(spans, n),
    canLetter: false,
    canTone: false,
    done: null,
  });
  const indicesOf = (span) => {
    const out = [];
    for (let i = span.start; i < span.end; i += 1) out.push(i);
    return out;
  };

  const steps = [];
  const onsetSpan = spans.find((sp) => sp.group === 'onset') ?? null;
  const rimeSpan = spans.find((sp) => sp.group === 'rime') ?? null;

  if (onsetSpan) {
    const onset = pack.tileById.onset[onsetSpan.unit];
    steps.push({
      step: 'onset',
      audio: onset ? onset.audio.short : null,
      caption: onset ? onset.label : onsetSpan.unit,
      cells: cellsUpTo(onsetSpan.end),
      lit: indicesOf({ start: 0, end: onsetSpan.end }),
      spanLit: indicesOf(onsetSpan),
      merged: false,
      gapAfterMs: gaps.onset ?? 250,
    });
  }
  if (rimeSpan) {
    steps.push({
      step: 'rime',
      audio: rime ? rime.audio.short : null,
      caption: rime ? rime.glyph : s.rime,
      cells: cellsUpTo(rimeSpan.end),
      lit: indicesOf({ start: 0, end: rimeSpan.end }),
      spanLit: indicesOf(rimeSpan),
      merged: false,
      gapAfterMs: gaps.rime ?? 250,
    });
  }

  const merged = (glyph, toned) => [{
    index: 0,
    role: 'rime',
    spanRole: 'role2',
    span: 0,
    spanStart: 0,
    spanEnd: 1,
    dividerBefore: false,
    filled: true,
    merged: true,
    toned,
    markSlot: false,
    glyph,
  }];

  steps.push({
    step: 'blend',
    audio: blend.audio,
    caption: blend.text,
    cells: merged(blend.text, false),
    lit: [0],
    spanLit: [0],
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
      spanLit: [0],
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
    spanLit: [0],
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
      spanLit: [],
      merged: true,
      gapAfterMs: 0,
    });
  }
  return steps;
}

/**
 * `ui.md` §2.2 / `acceptance-criteria.md` M2 — hold the strip and the app speaks **the
 * parts of what is currently assembled**, never a completion and never a suggestion.
 *
 * The parts are the **sounds**, not the letters: `c h o` says `chờ` · `o`, which is what
 * the strip's two bars are drawing. In Vietnamese the `long` slot is the đánh vần name,
 * which is the `short` clip too (N12).
 */
export function partsHint(pack, prefix, reading) {
  const steps = [];
  for (const span of reading.spans) {
    const text = unitText(reading.letters, span);
    const clip = unitClip(pack, span.group, text);
    steps.push({
      step: span.group,
      audio: clip ? (clip.long ?? clip.short) : null,
      caption: text,
      cells: null,
      lit: indicesBetween(span.start, span.end),
      spanLit: indicesBetween(span.start, span.end),
      merged: false,
      gapAfterMs: 250,
    });
  }
  if (reading.tone !== null) {
    const tile = pack.tileById.tone[reading.tone];
    steps.push({
      step: 'tone',
      audio: tile ? (tile.audio.long ?? tile.audio.short) : null,
      caption: tile ? tile.label : reading.tone,
      cells: null,
      lit: [],
      spanLit: [],
      merged: false,
      gapAfterMs: 250,
    });
  }
  return steps;
}

function indicesBetween(start, end) {
  const out = [];
  for (let i = start; i < end; i += 1) out.push(i);
  return out;
}
