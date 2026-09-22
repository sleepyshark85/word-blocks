// The properties that must hold after every single action, in every round, for ever.
//
// This is the fuzzer's assertion set (`test/fuzz.test.mjs`), and it lives in `src/`
// rather than in the test so that a tester — or a debug build — can call it on a live
// session and get the same answer. It returns a list of violations rather than throwing,
// because the caller decides whether a violation is a failed test or a logged defect.
//
// `docs/slices.md` names the Slice 2 gate: *thousands of fuzzed rounds violate no
// invariant, and every round is solvable with the palette offered.*

import { langFor } from './lang/index.mjs';
import { isSolvable } from './round.mjs';
import { VI_MAX_PER_ROW, EN_MAX_TRAY, MAX_STAGE } from './stages.mjs';

export function checkInvariants(pack, state, context = {}) {
  const bad = [];
  const fail = (code, detail) => bad.push({ code, detail, ...context });

  /* --- the language never changes mid-session (`acceptance-criteria.md` R4, A10) --- */
  if (state.language !== pack.language) fail('languageDrift', `${state.language} vs ${pack.language}`);
  if (context.language && state.language !== context.language) {
    fail('languageDrift', `session started as ${context.language}`);
  }

  if (!Number.isInteger(state.globalStage) || state.globalStage < 1
      || state.globalStage > MAX_STAGE[pack.language]) {
    fail('stageOutOfRange', String(state.globalStage));
  }

  const round = state.round;
  if (!round) return bad;

  const lang = langFor(pack.language);
  const instances = lang.paletteInstances(round.palette);

  /* ------------------------------------------------- ids are unique (`T1`) ------- */
  const ids = new Set();
  for (const i of instances) {
    if (ids.has(i.id)) fail('duplicateInstanceId', i.id);
    ids.add(i.id);
  }

  /* --------------- no tile outside the language's inventory --------------------- */
  for (const i of instances) {
    const group = i.role;
    if (!lang.tileGroups.includes(group)) { fail('foreignRole', `${i.id}:${group}`); continue; }
    if (!pack.tileById[group] || !pack.tileById[group][i.tileId]) {
      fail('tileNotInInventory', `${group}/${i.tileId}`);
    }
  }

  /* ----------------- the palette caps (`acceptance-criteria.md` B3) -------------- */
  if (round.palette.kind === 'vi') {
    if (round.palette.onsets.length > VI_MAX_PER_ROW) fail('onsetRowTooWide', String(round.palette.onsets.length));
    if (round.palette.rimes.length > VI_MAX_PER_ROW) fail('rimeRowTooWide', String(round.palette.rimes.length));
    for (const rid of Object.keys(round.palette.tonesByRime)) {
      if (round.palette.tonesByRime[rid].length > VI_MAX_PER_ROW) fail('toneRowTooWide', rid);
    }
  } else if (round.palette.tiles.length > EN_MAX_TRAY) {
    fail('trayTooWide', String(round.palette.tiles.length));
  }

  /* ------------- no never-together pair in anything on screen (B4, D11) --------- */
  const rows = round.palette.kind === 'vi'
    ? [round.palette.onsets, round.palette.rimes,
      ...Object.values(round.palette.tonesByRime)]
    : [round.palette.tiles];
  for (const row of rows) {
    const idsInRow = row.map((i) => i.tileId);
    for (const set of pack.neverTogether) {
      const hits = set.filter((m) => idsInRow.includes(m));
      if (hits.length > 1) fail('neverTogetherViolated', hits.join('+'));
    }
  }

  /* ---------- assembled state never exceeds the word's length ------------------- */
  const target = pack.words.find((w) => w.id === round.targetId);
  if (!target) fail('targetNotInPack', round.targetId);
  else {
    const expected = pack.language === 'vi'
      ? (target.syllables[0].onset === null ? 2 : 3)
      : target.tiles.length;
    if (round.cells.length !== expected) fail('cellCountWrong', `${round.cells.length} vs ${expected}`);
  }
  const seatedCount = round.cells.filter((c) => c.tileId !== null).length;
  if (seatedCount > round.cells.length) fail('overfilled', String(seatedCount));

  /* --------- every instance is in the band or in exactly one cell (T1) ---------- */
  const seatedInstances = round.cells.map((c) => c.instanceId).filter((x) => x !== null);
  if (new Set(seatedInstances).size !== seatedInstances.length) {
    fail('instanceSeatedTwice', seatedInstances.join(','));
  }
  for (const c of round.cells) {
    if (c.instanceId === null) {
      if (c.tileId !== null) fail('cellHasTileWithoutInstance', String(c.index));
      continue;
    }
    const inst = instances.find((i) => i.id === c.instanceId);
    if (!inst) fail('seatedInstanceNotInPalette', c.instanceId);
    else if (inst.tileId !== c.tileId) fail('cellTileMismatch', `${c.instanceId}`);
    else if (inst.role !== c.role) fail('cellRoleMismatch', `${c.instanceId}`);
  }

  /* ---- a seated tone is a tone the seated rime can actually take ---------------
     `literacy-vi.md` §5.2's checked-syllable rule is hard and exceptionless, and the
     tone tile *is* the rime wearing a mark (§5.4), so a tone seated against a rime that
     has no stored form for it is a board state with no spelling. Found by the Slice 2
     tester as a reachable state on `quạt`; the reducer now refuses it, and this is the
     assertion that says so after every action rather than at the one call site. */
  if (round.palette.kind === 'vi') {
    const rimeCell = round.cells.find((c) => c.role === 'rime');
    const toneCell = round.cells.find((c) => c.role === 'tone');
    if (toneCell && toneCell.tileId !== null) {
      if (!rimeCell || rimeCell.tileId === null) {
        fail('toneWithoutRime', toneCell.tileId);
      } else {
        const rimeTile = pack.tileById.rime[rimeCell.tileId];
        if (!rimeTile || !rimeTile.legalTones.includes(toneCell.tileId)
            || rimeTile.toned[toneCell.tileId] == null) {
          fail('illegalToneSeated', `${rimeCell.tileId}+${toneCell.tileId}`);
        }
        const toneInst = instances.find((i) => i.id === toneCell.instanceId);
        if (toneInst && toneInst.rimeId !== rimeCell.tileId) {
          fail('toneFromAnotherRimeRow', `${toneInst.id} on ${rimeCell.tileId}`);
        }
      }
    }
  }

  /* ------------------ every round is solvable with the palette offered (E10) ---- */
  if (!isSolvable(pack, round)) fail('unsolvable', round.targetId);

  /* ------------------------- the page never overruns five (H1, H2) -------------- */
  if (state.page.entries.length > 5) fail('pageOverflow', String(state.page.entries.length));

  return bad;
}
