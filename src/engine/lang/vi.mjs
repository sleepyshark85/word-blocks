// Ghép Chữ — the Vietnamese machine, revision 2.
//
// A syllable is `âm đầu + vần + thanh` (`literacy-vi.md` §1). Three decisions, in that
// order, never letter by letter. The engine matches on the `(onset, rime, tone)` triple
// and **never concatenates strings**: `gi` + `i` is `gì`, not `gii`, and `gi` + `iêng` is
// `giêng` (§1.2). Every spelling the child ever sees comes out of the pack.
//
// **Revision 2 deleted the palette builder.** There is no target, so there is nothing to
// build a palette for. What this module now owns is the *table*: which symbols exist at
// which position, in a fixed order that does not depend on any word (`gameplay.md` §3.2),
// and what the word strip shows while he assembles one.
//
// This module is only ever reached through `lang/index.mjs`, which is handed the
// language once, at pack load. There is no branch on language anywhere below it.

import { viLegalTones } from '../rules.mjs';

export const id = 'vi';
export const tileGroups = ['onset', 'rime', 'tone'];

/**
 * `gameplay.md` §4.6 — **the zero onset is a pressable tile in discovery mode.**
 *
 * `literacy-vi.md` §2 lists it as "(no tile)", which was right when the app chose the
 * word: a zero-onset round simply rendered a one-cell plate. In discovery he has to be
 * able to *start* `ong` and `áo` himself, so there must be something to press. It is
 * drawn as an empty socket, it is the last cell of the onset table, and its sound is a
 * wooden *open* rather than a đánh vần name (`acceptance-criteria.md` C2, C3, N13).
 *
 * U+2205 is not a letter, so it cannot collide with a spelling; `inventoryFor` drops a
 * pack onset that claims this id rather than letting it shadow the socket.
 */
export const ZERO_ONSET = '∅';

/** Three cells, always: `onset ┊ rime ┊ tone` (`gameplay.md` §4.5). */
export const STRIP_CELLS = [
  { index: 0, role: 'onset' },
  { index: 1, role: 'rime' },
  { index: 2, role: 'tone' },
];

/**
 * `acceptance-criteria.md` B2, C2 — the table's contents at each position, from the
 * pack's `inventoryOrder` and the stage's cell count, and from nothing else. The onset
 * table spends its last cell on the socket, so it is `cells - 1` written onsets plus ∅.
 */
export function inventoryFor(pack, cells) {
  const onsets = pack.inventoryOrder.onset.filter((t) => t !== ZERO_ONSET);
  return {
    onset: [...onsets.slice(0, Math.max(0, cells - 1)), ZERO_ONSET],
    rime: pack.inventoryOrder.rime.slice(0, cells),
  };
}

/** The symbols a word is built from, in tap order. */
export function pathFor(word) {
  const s = word.syllables[0];
  return [s.onset === null ? ZERO_ONSET : s.onset, s.rime, s.tone];
}

/**
 * `gameplay.md` §6.1 — a word is eligible iff every one of its symbols is on the table.
 * The tone is not checked against a cell count: the tone table is generated from the
 * seated rime's legal set (`literacy-vi.md` §5.2), so it is never truncated by the stage.
 */
export function pathIsOnTable(inventory, path) {
  return inventory.onset.includes(path[0]) && inventory.rime.includes(path[1]);
}

function onsetSymbol(pack, tileId) {
  if (tileId === ZERO_ONSET) {
    return {
      id: ZERO_ONSET, role: 'onset', kind: 'socket', glyph: null, label: null,
      audio: { long: null, short: null },
    };
  }
  const tile = pack.tileById.onset[tileId];
  return {
    id: tileId, role: 'onset', kind: 'tile', glyph: tile.glyph, label: tile.label,
    audio: tile.audio,
  };
}

function rimeSymbol(pack, tileId) {
  const tile = pack.tileById.rime[tileId];
  return {
    id: tileId, role: 'rime', kind: 'tile', glyph: tile.glyph, label: tile.glyph,
    audio: tile.audio,
  };
}

/**
 * `literacy-vi.md` §5.4 / `acceptance-criteria.md` C6 — a tone tile renders **the chosen
 * rime with that tone's mark applied** (`eo èo éo ẻo ẽo ẹo`), never a bare diacritic, and
 * the marked form is read out of the pack rather than composed here.
 *
 * `acceptance-criteria.md` C7 — a rime ending p/t/c/ch produces a **two-cell** table.
 * Illegal tones are not rendered at all, which is a different thing from rendered and
 * disabled: *legality is absence; completability is flatness*, and the two never have to
 * be told apart.
 */
function toneSymbols(pack, rimeId) {
  const rime = pack.tileById.rime[rimeId];
  if (!rime) return [];
  const legal = viLegalTones(rimeId);
  return rime.legalTones
    .filter((t) => legal.includes(t))
    .map((t) => {
      const tile = pack.tileById.tone[t];
      return {
        id: t,
        role: 'tone',
        kind: 'tile',
        glyph: rime.toned[t],
        label: tile ? tile.label : t,
        audio: tile ? tile.audio : { long: null, short: null },
      };
    });
}

/**
 * `ui.md` §7.1 — **exactly one role is on the table at a time**, and the table morphs
 * onset → rime → tone in situ. Re-argued for revision 2 rather than inherited: the tone
 * tiles are undrawable before a rime exists, three tables would be 54 cells, and two of
 * the three would be entirely disabled, which is the inert-screen failure the brief
 * forbids (`acceptance-criteria.md` C16).
 */
export function tableFor(pack, inventory, prefix) {
  if (prefix.length === 0) {
    return { position: 0, role: 'onset', symbols: inventory.onset.map((t) => onsetSymbol(pack, t)) };
  }
  if (prefix.length === 1) {
    return { position: 1, role: 'rime', symbols: inventory.rime.map((t) => rimeSymbol(pack, t)) };
  }
  return { position: 2, role: 'tone', symbols: toneSymbols(pack, prefix[1]) };
}

/**
 * `ui.md` §7.2 — the strip states the shape of a Vietnamese syllable even when empty. The
 * rime cell shows the **marked** form once a tone is seated, read out of `rime.toned`,
 * and the tone cell names the tone (`huyền`). A zero-onset word fills the first cell with
 * the socket mark rather than collapsing the strip.
 */
export function stripCells(pack, prefix) {
  const onset = prefix.length > 0 ? prefix[0] : null;
  const rimeId = prefix.length > 1 ? prefix[1] : null;
  const toneId = prefix.length > 2 ? prefix[2] : null;
  const rime = rimeId === null ? null : pack.tileById.rime[rimeId];
  const tone = toneId === null ? null : pack.tileById.tone[toneId];
  return [
    {
      index: 0,
      role: 'onset',
      filled: onset !== null,
      socket: onset === ZERO_ONSET,
      glyph: onset === null || onset === ZERO_ONSET ? null : pack.tileById.onset[onset].glyph,
    },
    {
      index: 1,
      role: 'rime',
      filled: rime !== null,
      socket: false,
      glyph: rime === null ? null : (toneId !== null && rime.toned[toneId] != null ? rime.toned[toneId] : rime.glyph),
    },
    {
      index: 2,
      role: 'tone',
      filled: tone !== null,
      socket: false,
      glyph: tone === null ? null : tone.label,
    },
  ];
}

/** The symbol descriptor for a seated position, so undo can play its own clip (E8). */
export function symbolAt(pack, prefix, index) {
  if (index < 0 || index >= prefix.length) return null;
  if (index === 0) return onsetSymbol(pack, prefix[0]);
  if (index === 1) return rimeSymbol(pack, prefix[1]);
  return toneSymbols(pack, prefix[1]).find((s) => s.id === prefix[2]) ?? null;
}

/**
 * The chant (`literacy-vi.md` §7.2, `acceptance-criteria.md` C12):
 * `onset · rime · toneless-blend · tone · word`, with the tone step omitted for `ngang`
 * and the onset step omitted for a zero onset. A missing blend clip skips step 3 and the
 * chant continues (`content-pipeline.md` §5); a missing sentence skips the last step.
 */
export function chant(pack, word) {
  const s = word.syllables[0];
  const gaps = (pack.chant && pack.chant.gapsMs) || {};
  const steps = [];
  if (s.onset !== null) {
    const t = pack.tileById.onset[s.onset];
    steps.push({ step: 'onset', cell: 0, audio: t.audio.short, caption: t.label, gapAfterMs: gaps.onset ?? 250 });
  }
  const rime = pack.tileById.rime[s.rime];
  steps.push({ step: 'rime', cell: 1, audio: rime.audio.short, caption: rime.glyph, gapAfterMs: gaps.rime ?? 250 });
  if (word.audio.blend) {
    steps.push({ step: 'blend', cell: null, audio: word.audio.blend, caption: null, gapAfterMs: gaps.blend ?? 400 });
  }
  const skip = Array.isArray(pack.chant && pack.chant.skipToneStepFor)
    ? pack.chant.skipToneStepFor
    : ['ngang'];
  if (!skip.includes(s.tone)) {
    const t = pack.tileById.tone[s.tone];
    steps.push({ step: 'tone', cell: 2, audio: t.audio.short, caption: t.label, gapAfterMs: gaps.tone ?? 250 });
  }
  steps.push({ step: 'word', cell: null, audio: word.audio.word, caption: word.text, gapAfterMs: gaps.word ?? 600 });
  if (word.audio.sentence) {
    steps.push({ step: 'sentence', cell: null, audio: word.audio.sentence, caption: null, gapAfterMs: 0 });
  }
  return steps;
}

/**
 * `ui.md` §2.2 / `acceptance-criteria.md` M2 — hold the strip and the app speaks **the
 * parts of what is currently assembled**, never a completion and never a suggestion. It
 * is the pedagogically correct hint: say the pieces, let him find the rest.
 */
export function partsHint(pack, prefix) {
  const steps = [];
  for (let i = 0; i < prefix.length; i += 1) {
    const sym = symbolAt(pack, prefix, i);
    if (!sym || sym.kind === 'socket') continue;
    steps.push({ step: sym.role, cell: i, audio: sym.audio.short, caption: sym.label, gapAfterMs: 250 });
  }
  return steps;
}
