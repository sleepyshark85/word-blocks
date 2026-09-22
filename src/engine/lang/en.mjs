// Word Blocks — the English machine.
//
// English assembles letter by letter, and `literacy-en.md` §1 is explicit that this is
// correct here even though it would be wrong in Vietnamese. **One tile is one sound,
// never one letter**: `ship` is `sh` `i` `p`, `duck` is `d` `u` `ck`, `frog` is four
// tiles because `fr` is a blend and not a digraph.
//
// Matching is on the tile sequence, from the pack. The engine does not spell.

import { EN_TRAY, EN_MAX_TRAY } from '../stages.mjs';
import { conflicts, enSlotIsLegal } from '../rules.mjs';
import { shuffled } from '../rng.mjs';
import { wordFromParts } from '../pack.mjs';

export const id = 'en';
export const tileGroups = ['letter'];

/**
 * One socket per tile of the target (`acceptance-criteria.md` D1): 2 for `egg`, 3 for
 * `cat`, 4 for `frog`. **The socket count is the word's length** — a real, soundless,
 * textless clue (`ui.md` §8).
 */
export function cellsFor(word) {
  return word.tiles.map((expect, index) => ({ role: 'letter', expect, index }));
}

/**
 * The tray: the target's tiles plus distractors, to the count in `literacy-en.md` §6.2.
 *
 * Three hard rules, all of them about not offering a tile that cannot legally go where
 * the child might put it — the trap §3.3 names:
 *
 *   - **Never both `c` and `k`** (§6.2, `acceptance-criteria.md` D11). Read from the
 *     manifest's `neverTogether`, the same mechanism Vietnamese uses.
 *   - **A final-only tile** (`ck ll ss ff zz ng x`) is offered only when the target word
 *     itself ends in one, and an initial-only tile (`y`) only when the target begins
 *     with one (D12). So `cat`'s tray can never contain `ck`.
 *   - **Every tile the target needs is present**, with multiplicity — a word needing two
 *     `m`s gets two `m` tiles, so every round is solvable (B3, E10).
 *
 * And the preference that `literacy-en.md` §6.2 calls "the strongest single idea in the
 * English mode": distractors come from the same word family wherever possible, so that a
 * wrong answer is another real word with its own picture (D13, B11).
 */
export function buildPalette(pack, { word, stage, rngState }) {
  const sets = pack.neverTogether;
  const target = word.tiles;
  const lastIsFinalOnly = pack.tileById.letter[target[target.length - 1]].position === 'final';
  const firstIsInitialOnly = pack.tileById.letter[target[0]].position === 'initial';

  const wanted = Math.min(
    EN_MAX_TRAY,
    Math.max(EN_TRAY[stage] ?? EN_MAX_TRAY, Math.min(target.length + 1, EN_MAX_TRAY)),
  );
  const distractorCount = Math.max(0, wanted - target.length);

  const inTarget = new Set(target);
  const eligible = pack.tiles.letter.filter((t) => {
    if (inTarget.has(t.id)) return false;
    if (pack.stageOf.letter[t.id] === undefined) return false;
    if (pack.stageOf.letter[t.id] > stage) return false;
    if (t.position === 'final' && !lastIsFinalOnly) return false;
    if (t.position === 'initial' && !firstIsInitialOnly) return false;
    return true;
  });

  // A family distractor: swapping it into one slot of the target spells another word
  // this pack can actually show — `cat` -> `hat`, `bat`, `rat`.
  const makesWord = (t) => {
    for (let i = 0; i < target.length; i += 1) {
      if (!enSlotIsLegal(t.position, i, target.length)) continue;
      const alt = target.slice();
      alt[i] = t.id;
      const found = wordFromParts(pack, alt);
      if (found && found.id !== word.id) return true;
    }
    return false;
  };

  let rng = rngState;
  const [r1, preferred] = shuffled(rng, eligible.filter(makesWord));
  const [r2, rest] = shuffled(r1, eligible.filter((t) => !makesWord(t)));
  rng = r2;

  const chosenIds = target.slice();
  const distractors = [];
  for (const t of [...preferred, ...rest]) {
    if (distractors.length >= distractorCount) break;
    if (conflicts(sets, chosenIds, t.id)) continue;
    chosenIds.push(t.id);
    distractors.push(t.id);
  }

  // Instances rather than ids, because a word may need the same tile twice and two
  // sockets cannot both hold one tile.
  const all = [...target, ...distractors];
  const [r3, order] = shuffled(rng, all.map((tileId, i) => ({ tileId, i })));
  rng = r3;

  const tiles = order.map(({ tileId, i }) => {
    const tile = pack.tileById.letter[tileId];
    return {
      id: `letter:${i}:${tileId}`,
      role: 'letter',
      tileId,
      glyph: tile.glyph,
      isVowel: tile.isVowel,
      position: tile.position,
    };
  });

  return [rng, { kind: 'en', tiles }];
}

export function paletteInstances(palette) {
  return palette.tiles.slice();
}

/** One tray, the whole thing at once, up to 8 (`literacy-en.md` §6.1). */
export function activeRow(round) {
  return { role: 'letter', instances: round.palette.tiles };
}

/**
 * `acceptance-criteria.md` D2 and D3: a tap fills the **leftmost empty** slot; if every
 * slot is full it takes the **leftmost** slot and the previous occupant walks home.
 */
export function targetCellFor(round, _inst) {
  const empty = round.cells.find((c) => c.tileId === null);
  return empty ? empty.index : 0;
}

/** Nothing in English depends on another slot. */
export function dependentCells() {
  return [];
}

export function cellCorrect(round, index) {
  const cell = round.cells[index];
  return cell.tileId !== null && cell.tileId === cell.expect;
}

export function partsFrom(round) {
  return round.cells.map((c) => c.tileId);
}

export function lookup(pack, parts) {
  if (parts.some((p) => p === null)) return null;
  return wordFromParts(pack, parts);
}

export function plateCells(pack, round) {
  return round.cells.map((c) => ({
    role: 'letter',
    cellIndex: c.index,
    glyph: c.tileId === null ? null : pack.tileById.letter[c.tileId].glyph,
  }));
}

/**
 * `gameplay.md` §5.2 and `acceptance-criteria.md` D10: the chant uses **short** clips
 * left to right, then the whole word — never the long anchored form. Chanting
 * `"kuh, cat" · "ah, apple" · "tuh, ten" → "cat"` would be four seconds of noise ending
 * in a word he has already heard twice.
 */
export function chant(pack, word) {
  const gaps = (pack.chant && pack.chant.gapsMs) || {};
  const steps = word.tiles.map((tileId, i) => ({
    step: 'tile',
    slot: i,
    audio: pack.tileById.letter[tileId].audio.short,
    caption: pack.tileById.letter[tileId].glyph,
    gapAfterMs: i === word.tiles.length - 1 ? (gaps.lastTile ?? 350) : (gaps.tile ?? 200),
  }));
  steps.push({ step: 'word', audio: word.audio.word, caption: word.text, gapAfterMs: gaps.word ?? 600 });
  if (word.audio.sentence) {
    steps.push({ step: 'sentence', audio: word.audio.sentence, caption: null, gapAfterMs: 0 });
  }
  return steps;
}

/** The parts read back after a not-a-word combination, with no whole-word step. */
export function readBack(pack, round) {
  return round.cells
    .filter((c) => c.tileId !== null)
    .map((c) => ({
      step: 'tile',
      slot: c.index,
      audio: pack.tileById.letter[c.tileId].audio.short,
      caption: pack.tileById.letter[c.tileId].glyph,
    }));
}

export function partsHint(pack, word) {
  return chant(pack, word).filter((s) => s.step === 'tile');
}

/**
 * `acceptance-criteria.md` E10 / B3 — the tray holds the target's tiles *with
 * multiplicity*, so a word needing two `m`s can actually be built.
 */
export function canSolve(round) {
  const have = new Map();
  for (const i of round.palette.tiles) have.set(i.tileId, (have.get(i.tileId) ?? 0) + 1);
  const need = new Map();
  for (const c of round.cells) need.set(c.expect, (need.get(c.expect) ?? 0) + 1);
  for (const [tileId, n] of need) if ((have.get(tileId) ?? 0) < n) return false;
  return true;
}
