// The stage tables, transcribed from the literacy documents.
//
// `gameplay.md` §6.1: the child is never told about a stage. There is no level-up
// screen, no badge and no sound (`acceptance-criteria.md` H11). The palette simply gets
// one tile wider, some day, between two rounds.

/**
 * `literacy-vi.md` §8.3. How many tiles are in each row at each stage. The screen total
 * is never the sum — exactly one row is on screen at a time (`gameplay.md` §2.1).
 *
 * The tone row can be smaller than this: it is generated from the seated rime's legal
 * tone set (§5.2), so a stop-final rime produces two tiles whatever the stage says.
 */
export const VI_ROWS = {
  1: { onset: 2, rime: 2, tone: 1 },
  2: { onset: 3, rime: 3, tone: 2 },
  3: { onset: 4, rime: 4, tone: 3 },
  4: { onset: 5, rime: 5, tone: 4 },
  5: { onset: 6, rime: 6, tone: 6 },
};

/** `literacy-vi.md` §8.3, "Tones available". Cumulative. */
export const VI_TONES_BY_STAGE = {
  1: ['ngang', 'huyen'],
  2: ['ngang', 'huyen', 'sac'],
  3: ['ngang', 'huyen', 'sac', 'nang'],
  4: ['ngang', 'huyen', 'sac', 'nang', 'hoi'],
  5: ['ngang', 'huyen', 'sac', 'nang', 'hoi', 'nga'],
};

/** `literacy-vi.md` §8.1 — the cap is per row. `acceptance-criteria.md` B3. */
export const VI_MAX_PER_ROW = 6;

/**
 * `literacy-en.md` §6.2 — tiles on screen, the whole tray at once. The distractor column
 * of that table is this number minus the three tiles a CVC word needs; it is derived
 * rather than stored, because a 2-tile word (`egg`) and a 4-tile word (`frog`) both
 * occur and only the total is a real constraint.
 */
export const EN_TRAY = { 1: 4, 2: 5, 3: 6, 4: 6, 5: 7, 6: 8, 7: 8 };

/** `literacy-en.md` §6.1 — English caps at 8. `acceptance-criteria.md` B3. */
export const EN_MAX_TRAY = 8;

export const MAX_STAGE = { vi: 5, en: 7 };

/** `gameplay.md` §6.2 — 8 rounds resolved at the current stage with no auto-place assist. */
export const ROUNDS_PER_STAGE = 8;

/** `gameplay.md` §6.2 — a word met twice comes back with a wider palette. Capped at +2. */
export const MEETING_BUMP_CAP = 2;

/** `gameplay.md` §6.4 — a page is five rounds. */
export const ROUNDS_PER_PAGE = 5;

/** `gameplay.md` §6.5 / `acceptance-criteria.md` G10 — three auto-places and the word comes back. */
export const ASSISTS_BEFORE_REQUEUE = 3;

export function clampStage(language, stage) {
  const max = MAX_STAGE[language];
  if (!Number.isFinite(stage)) return 1;
  return Math.min(max, Math.max(1, Math.floor(stage)));
}

/**
 * `gameplay.md` §6.2:
 *   roundStage(word) = min( globalStage , word.minStage + min(word.meetings, 2) )
 *
 * A word met twice deserves a harder palette; a word met for the first time comes in
 * easy even at stage 5.
 */
export function roundStage(language, globalStage, wordStage, meetings) {
  const base = Number.isFinite(wordStage) ? wordStage : 1;
  const bump = Math.min(Math.max(0, meetings | 0), MEETING_BUMP_CAP);
  return clampStage(language, Math.min(clampStage(language, globalStage), base + bump));
}
