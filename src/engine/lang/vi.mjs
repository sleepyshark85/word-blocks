// Ghép Chữ — the Vietnamese machine.
//
// A syllable is `âm đầu + vần + thanh` (`literacy-vi.md` §1). Three decisions, in that
// order, never letter by letter. The engine matches on the `(onset, rime, tone)` triple
// and **never concatenates strings**: `gi` + `i` is `gì`, not `gii`, and `gi` + `iêng` is
// `giêng` (§1.2). Every spelling the child ever sees comes out of the pack.
//
// This module is only ever reached through `lang/index.mjs`, which is handed the
// language once, at pack load. There is no branch on language anywhere below it.

import {
  VI_ROWS, VI_TONES_BY_STAGE, VI_MAX_PER_ROW,
} from '../stages.mjs';
import { viIsStopFinal, viCheckSpellingRule, conflicts } from '../rules.mjs';
import { shuffled, deriveSeed } from '../rng.mjs';
import { wordFromParts } from '../pack.mjs';

export const id = 'vi';
export const tileGroups = ['onset', 'rime', 'tone'];

/**
 * The cells of a round — one per decision, which is also the number of frame segments
 * (`acceptance-criteria.md` B2: 2–3 in Vietnamese).
 *
 * A zero-onset word (`ong`, `áo`) has two: the plate shows **one full-width cell** and
 * the onset row is never rendered at all (C2). There is no `∅` tile to press; the shape
 * of the screen is the instruction.
 */
export function cellsFor(word) {
  const s = word.syllables[0];
  const cells = [];
  if (s.onset !== null) cells.push({ role: 'onset', expect: s.onset });
  cells.push({ role: 'rime', expect: s.rime });
  cells.push({ role: 'tone', expect: s.tone });
  return cells.map((c, index) => ({ ...c, index }));
}

function instance(role, tileId, glyph, extra) {
  return { id: `${role}:${tileId}`, role, tileId, glyph, ...extra };
}

/**
 * The tone row for one rime. `literacy-vi.md` §5.4: the tone tiles render **the chosen
 * rime with each tone's mark applied** (`eo èo éo ẻo ẽo ẹo`), never a bare diacritic —
 * and the marked forms are read out of the pack, because §5.4 puts composition in the
 * editor, in front of a human, and forbids it at runtime.
 */
function toneRowFor(rimeTile, { stage, mustInclude, seed, sets }) {
  const legal = rimeTile.legalTones;

  // `literacy-vi.md` §5.2 and `acceptance-criteria.md` C6: a rime ending p/t/c/ch takes
  // only sắc and nặng, so its row is exactly two tiles whatever the stage table says.
  // The palette gets simpler exactly where the structure gets harder, which is free.
  if (viIsStopFinal(rimeTile.id)) return legal.slice();

  const cap = Math.min(VI_MAX_PER_ROW, VI_ROWS[stage].tone, legal.length);
  const chosen = [];
  // The target's own tone is always offered, even if the stage table has not introduced
  // it yet. `word-list.md` does not assign stages strictly by tone — `mũ` is a stage-2
  // word carrying `ngã` — and "the palette contains every tile the target needs"
  // (`acceptance-criteria.md` B3) outranks the progression table.
  if (mustInclude && legal.includes(mustInclude)) chosen.push(mustInclude);

  const introduced = VI_TONES_BY_STAGE[stage] ?? [];
  const pools = [
    legal.filter((t) => introduced.includes(t) && !chosen.includes(t)),
    legal.filter((t) => !introduced.includes(t) && !chosen.includes(t)),
  ];
  let s = seed;
  for (const pool of pools) {
    const [s2, order] = shuffled(s, pool);
    s = s2;
    for (const t of order) {
      if (chosen.length >= cap) break;
      if (conflicts(sets, chosen, t)) continue; // §6.1: hỏi/ngã are one sound in the south
      chosen.push(t);
    }
  }
  // Display order is the classroom order of §5.1, not the order they were drawn.
  return legal.filter((t) => chosen.includes(t));
}

/**
 * Build the round's palette: the target's tiles plus distractors, per the stage
 * progression of `literacy-vi.md` §8.3.
 *
 * Three constraints are hard, and two of them are about not asking the child to guess:
 *
 *   - **No never-together pair** (§4.1, §6.1). `c`/`k`, `g`/`gh`, `ng`/`ngh` are one
 *     sound each and only one spelling is ever legal; the dialect sets are distinctions
 *     the child's own speech does not make. Read from the manifest as data.
 *   - **Every (onset, rime) pair the palette can produce must be orthographically
 *     legal** (§4.1 rule 3). A palette holding `ngh` and the rime `a` teaches a spelling
 *     that does not exist.
 *   - **Every tile the target needs is present** (`acceptance-criteria.md` B3), which is
 *     what makes every round solvable (E10).
 *
 * And one preference with a measured target: distractors are drawn from the tiles the
 * live vocabulary actually uses, and among those the ones that make *another real word*
 * are preferred (`gameplay.md` §4.5, `acceptance-criteria.md` B11).
 */
export function buildPalette(pack, { word, stage, rngState }) {
  const s = word.syllables[0];
  const sets = pack.neverTogether;
  const rows = VI_ROWS[stage];
  let rng = rngState;

  /* ---- rimes. Chosen first, because they constrain which onsets are spellable. ---- */
  const rimeCap = Math.min(VI_MAX_PER_ROW, rows.rime);
  const rimeIds = [s.rime];
  {
    const eligible = pack.tiles.rime.filter((t) => (
      t.id !== s.rime
      && pack.stageOf.rime[t.id] !== undefined
      && pack.stageOf.rime[t.id] <= stage
      && viCheckSpellingRule(s.onset, t.id) === null
    ));
    // Prefer a rime that makes a real word with the target's own onset — `bò`/`bơ`.
    const makesWord = (t) => pack.words.some((w) => {
      const x = w.syllables[0];
      return x.onset === s.onset && x.rime === t.id;
    });
    const [r1, preferred] = shuffled(rng, eligible.filter(makesWord));
    const [r2, rest] = shuffled(r1, eligible.filter((t) => !makesWord(t)));
    rng = r2;
    for (const t of [...preferred, ...rest]) {
      if (rimeIds.length >= rimeCap) break;
      if (conflicts(sets, rimeIds, t.id)) continue;
      rimeIds.push(t.id);
    }
  }

  /* ---- onsets, constrained to be legal with *every* rime on offer ---- */
  const onsetIds = [];
  if (s.onset !== null) {
    onsetIds.push(s.onset);
    const onsetCap = Math.min(VI_MAX_PER_ROW, rows.onset);
    const eligible = pack.tiles.onset.filter((t) => (
      t.id !== s.onset
      && pack.stageOf.onset[t.id] !== undefined
      && pack.stageOf.onset[t.id] <= stage
      && rimeIds.every((r) => viCheckSpellingRule(t.id, r) === null)
    ));
    const makesWord = (t) => pack.words.some((w) => {
      const x = w.syllables[0];
      return x.onset === t.id && rimeIds.includes(x.rime);
    });
    const [r1, preferred] = shuffled(rng, eligible.filter(makesWord));
    const [r2, rest] = shuffled(r1, eligible.filter((t) => !makesWord(t)));
    rng = r2;
    for (const t of [...preferred, ...rest]) {
      if (onsetIds.length >= onsetCap) break;
      if (conflicts(sets, onsetIds, t.id)) continue;
      onsetIds.push(t.id);
    }
  }

  /* ---- row order. Shuffled, so the answer is not always leftmost. ---- */
  const [r3, onsetOrder] = shuffled(rng, onsetIds);
  const [r4, rimeOrder] = shuffled(r3, rimeIds);
  rng = r4;

  /* ---- a tone row per rime, precomputed. ----------------------------------------
     The tone row depends on the rime he seats, and he may seat a distractor. Deriving
     each row from a sub-seed of the round's state rather than from the live generator
     keeps it stable: seating `eo`, lifting it, and seating it again shows the same six
     tiles, whatever he did in between. */
  const tonesByRime = Object.create(null);
  for (const rid of rimeOrder) {
    const rimeTile = pack.tileById.rime[rid];
    tonesByRime[rid] = toneRowFor(rimeTile, {
      stage,
      mustInclude: rid === s.rime ? s.tone : null,
      seed: deriveSeed(rng, `tone:${rid}`),
      sets,
    }).map((toneId) => ({
      // The id carries the rime: every rime on offer has its own tone row, and two rows
      // must never share an instance id or a tap could land in the wrong one.
      id: `tone:${rid}:${toneId}`,
      role: 'tone',
      tileId: toneId,
      glyph: rimeTile.toned[toneId],
      rimeId: rid,
    }));
  }

  const palette = {
    kind: 'vi',
    onsets: onsetOrder.map((oid) => instance('onset', oid, pack.tileById.onset[oid].glyph)),
    rimes: rimeOrder.map((rid) => instance('rime', rid, pack.tileById.rime[rid].glyph)),
    tonesByRime,
  };
  return [rng, palette];
}

/** Every instance in the palette, including tone rows that may never be shown. */
export function paletteInstances(palette) {
  const out = [...palette.onsets, ...palette.rimes];
  for (const rid of Object.keys(palette.tonesByRime)) out.push(...palette.tonesByRime[rid]);
  return out;
}

/**
 * Which row the band is showing. `gameplay.md` §2.1: exactly one row is on screen — the
 * next decision — and it morphs to the next. That is also why there is **never an inert
 * tile on screen** (`acceptance-criteria.md` C8): the tone row does not exist until the
 * moment it is the right question.
 */
export function activeRow(round) {
  const next = round.cells.find((c) => c.tileId === null);
  if (!next) return { role: null, instances: [] };
  if (next.role === 'onset') return { role: 'onset', instances: round.palette.onsets };
  if (next.role === 'rime') return { role: 'rime', instances: round.palette.rimes };
  const seatedRime = round.cells.find((c) => c.role === 'rime');
  const rid = seatedRime ? seatedRime.tileId : null;
  if (rid === null) return { role: null, instances: [] };
  return { role: 'tone', instances: round.palette.tonesByRime[rid] ?? [] };
}

/**
 * Where an instance seats. Vietnamese has no ambiguity — the band only ever offers tiles
 * for the cell that is next (`gameplay.md` §4.1).
 */
export function targetCellFor(round, inst) {
  const cell = round.cells.find((c) => c.role === inst.role);
  return cell ? cell.index : -1;
}

/**
 * Lifting a rime clears the tone with it (`acceptance-criteria.md` C9). It has to: the
 * tone tile *is* the rime, marked, so a tone without its rime is not a thing the child
 * ever chose.
 *
 * With the band showing one row at a time, a seated tone and a liftable rime cannot both
 * exist — seating the tone fills the last cell and resolves the round. The rule is
 * stated here anyway rather than left to that argument, because the argument depends on
 * the band, and `test/round-vi.test.mjs` exercises it directly.
 */
export function dependentCells(round, cellIndex) {
  const cell = round.cells[cellIndex];
  if (cell.role !== 'rime') return [];
  const tone = round.cells.find((c) => c.role === 'tone');
  return tone ? [tone.index] : [];
}

/**
 * Is this cell filled with the right tile?
 *
 * A tone is only correct **on the correct rime**. `èo` on the rime `ao` is not "the
 * right tone placed correctly" — it is part of a different word — and lighting a segment
 * for it would brighten the picture for something that is not the answer. It also keeps
 * E8 honest: the lit tiles that stay seated after a not-a-word settle are never left
 * depending on a tile that flew home.
 */
export function cellCorrect(round, index) {
  const cell = round.cells[index];
  if (cell.tileId === null) return false;
  if (cell.tileId !== cell.expect) return false;
  if (cell.role !== 'tone') return true;
  const rime = round.cells.find((c) => c.role === 'rime');
  return rime ? rime.tileId === rime.expect : false;
}

/** The triple the board currently spells, for the found-word lookup. */
export function partsFrom(round) {
  const get = (role) => {
    const c = round.cells.find((x) => x.role === role);
    return c ? c.tileId : null;
  };
  return { onset: get('onset'), rime: get('rime'), tone: get('tone') };
}

export function lookup(pack, parts) {
  if (parts.rime === null || parts.tone === null) return null;
  return wordFromParts(pack, parts);
}

/**
 * What the two-cell word plate shows (`ui.md` §7.2). The rime cell carries the **toned**
 * spelling once a tone is seated — read out of `rime.toned`, never composed here.
 */
export function plateCells(pack, round) {
  const onset = round.cells.find((c) => c.role === 'onset');
  const rime = round.cells.find((c) => c.role === 'rime');
  const tone = round.cells.find((c) => c.role === 'tone');
  const out = [];
  if (onset) {
    out.push({
      role: 'onset',
      cellIndex: onset.index,
      glyph: onset.tileId === null ? null : pack.tileById.onset[onset.tileId].glyph,
    });
  }
  let rimeGlyph = null;
  if (rime.tileId !== null) {
    const tile = pack.tileById.rime[rime.tileId];
    rimeGlyph = tone.tileId !== null && tile.toned[tone.tileId] != null
      ? tile.toned[tone.tileId]
      : tile.glyph;
  }
  out.push({ role: 'rime', cellIndex: rime.index, glyph: rimeGlyph, toneCellIndex: tone.index });
  return out;
}

/**
 * The chant (`literacy-vi.md` §7.2, `acceptance-criteria.md` C11):
 * `onset · rime · toneless-blend · tone · word`, with the tone step omitted for `ngang`
 * and the onset step omitted for a zero onset. A missing blend clip skips step 3 and the
 * chant continues (`content-pipeline.md` §5); a missing sentence skips step 6.
 */
export function chant(pack, word) {
  const s = word.syllables[0];
  const gaps = (pack.chant && pack.chant.gapsMs) || {};
  const steps = [];
  if (s.onset !== null) {
    steps.push({ step: 'onset', audio: pack.tileById.onset[s.onset].audio.short, caption: pack.tileById.onset[s.onset].label, gapAfterMs: gaps.onset ?? 250 });
  }
  steps.push({ step: 'rime', audio: pack.tileById.rime[s.rime].audio.short, caption: pack.tileById.rime[s.rime].glyph, gapAfterMs: gaps.rime ?? 250 });
  if (word.audio.blend) {
    steps.push({ step: 'blend', audio: word.audio.blend, caption: null, gapAfterMs: gaps.blend ?? 400 });
  }
  const skip = Array.isArray(pack.chant && pack.chant.skipToneStepFor)
    ? pack.chant.skipToneStepFor
    : ['ngang'];
  if (!skip.includes(s.tone)) {
    steps.push({ step: 'tone', audio: pack.tileById.tone[s.tone].audio.short, caption: pack.tileById.tone[s.tone].label, gapAfterMs: gaps.tone ?? 250 });
  }
  steps.push({ step: 'word', audio: word.audio.word, caption: word.text, gapAfterMs: gaps.word ?? 600 });
  if (word.audio.sentence) {
    steps.push({ step: 'sentence', audio: word.audio.sentence, caption: null, gapAfterMs: 0 });
  }
  return steps;
}

/**
 * The read-back after a combination that is not a word (`gameplay.md` §4.4 C): the parts,
 * **with no whole-word step**. There is no composed spelling to say, which is the point.
 */
export function readBack(pack, round) {
  const parts = partsFrom(round);
  const steps = [];
  if (parts.onset !== null) {
    const t = pack.tileById.onset[parts.onset];
    steps.push({ step: 'onset', audio: t.audio.short, caption: t.label });
  }
  if (parts.rime !== null) {
    const t = pack.tileById.rime[parts.rime];
    steps.push({ step: 'rime', audio: t.audio.short, caption: t.glyph });
  }
  if (parts.tone !== null) {
    const t = pack.tileById.tone[parts.tone];
    steps.push({ step: 'tone', audio: t.audio.short, caption: t.label });
  }
  return steps;
}

/** The parts hint (`gameplay.md` §2.5, `acceptance-criteria.md` B6) — the target's parts. */
export function partsHint(pack, word) {
  return chant(pack, word).filter((s) => s.step === 'onset' || s.step === 'rime' || s.step === 'tone');
}

/**
 * `acceptance-criteria.md` E10 / B3 — the palette holds every tile the target needs, and
 * the tone the target needs is in the tone row of the *target's* rime, not merely
 * somewhere in the palette.
 */
export function canSolve(round) {
  const onset = round.cells.find((c) => c.role === 'onset');
  const rime = round.cells.find((c) => c.role === 'rime');
  const tone = round.cells.find((c) => c.role === 'tone');
  if (onset && !round.palette.onsets.some((i) => i.tileId === onset.expect)) return false;
  if (!round.palette.rimes.some((i) => i.tileId === rime.expect)) return false;
  const row = round.palette.tonesByRime[rime.expect] ?? [];
  return row.some((i) => i.tileId === tone.expect);
}
