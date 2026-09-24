// The shape of a word on disk, built from what she entered — and nothing else.
//
// Pure, and it is the only place in the app that writes `letters` or `onsetLetterCount`
// (`content-pipeline.md` §3.7, `ui.md` §13.7 E19). Everything downstream *validates* them
// — `src/engine/pack.mjs` `resolveViLetters` re-checks that the first
// `onsetLetterCount` letters spell the stored onset, and refuses the word otherwise — so
// this file being wrong is a word she cannot play rather than a board that lies.
//
// **`draft` is the whole of J4.** A draft is written after every screen, before the word
// is valid, because she will be interrupted by a 4-year-old. `content-pipeline.md` §4.3
// makes `draft: true` imply `enabled: false`, and `resolvePack` withholds it from the
// child: a half-entered word can be on her phone for a week and never reach him.

import { nfc } from '../engine/text.mjs';
import { normaliseTyped } from './model.mjs';

/**
 * **The id is minted once and never recomputed** (`content-pipeline.md` §3.2: *"opaque,
 * stable, ascii. NEVER recomputed from the text."*).
 *
 * It has to exist at step 1, the *picture* step, which is before she has typed anything —
 * that is what makes the draft recoverable after a kill — so it cannot be a slug of the
 * word. It is `w` plus a base-36 stamp, lower-case ascii, matching the pack's id rule.
 * Nothing renders it.
 *
 * `stamp` and `seq` are injected rather than read from a clock here, because this module
 * is executed in Node by the test suite and a module that reads `Date.now()` cannot be
 * replayed.
 */
export function mintWordId(stamp, seq, taken = []) {
  const base = `w${Number(stamp).toString(36)}${Number(seq).toString(36)}`
    .toLowerCase().replace(/[^a-z0-9]/g, '');
  let id = base;
  let n = 1;
  while (taken.includes(id)) { n += 1; id = `${base}-${n}`; }
  return id;
}

/** A media object in the pack's shape, for something that is hers (§3.4, §11). */
function ownImage(blob, addedAt, source) {
  return {
    src: blob.src,
    bytes: blob.bytes ?? null,
    w: blob.w ?? null,
    h: blob.h ?? null,
    // `tools/lib/licence.mjs`: `camera` and `own-work` are the family's and carry no
    // third-party obligation at all. Her photograph is not a licence question.
    source,
    license: null,
    creator: null,
    addedAt,
  };
}

function ownClip(blob, text, addedAt) {
  return {
    src: blob.src,
    bytes: blob.bytes ?? null,
    ms: Number.isFinite(blob.ms) ? Math.round(blob.ms) : null,
    // §3.6 — a recording and a generated clip are the same object in the schema; the
    // difference is `engine: null` plus a `by`.
    engine: null,
    voice: null,
    text: text ?? null,
    by: 'parent',
    addedAt,
  };
}

export { ownImage, ownClip };

/**
 * Build the word file.
 *
 * @param {object} draft   the editor's working copy
 * @param {object} draft.choice   an `analyse()` choice, or null when nothing parsed
 *
 * **There is no `over` flag.** The first version took one, for X8's *too long for the
 * board* case — and it was dead the moment `analyse` learned to check the length before
 * parsing, because a word longer than the strip has no choice to carry. A fault injection
 * that flipped it changed nothing, which is how it was found. A word that did not parse,
 * for whatever reason, is stored with everything she entered and is not enabled.
 */
export function buildWordRecord(draft, { language, addedAt = null } = {}) {
  const text = normaliseTyped(draft.text ?? '');
  const choice = draft.choice ?? null;
  const parsed = choice !== null;

  const record = {
    id: draft.id,
    text,
    // Revision 4 deleted the stage ladder (`gameplay.md` §3.6) and `ui.md` §13.7 E1 says
    // the field *"may stay in the pack, and nothing renders it"* — but `resolvePack`
    // still withholds a word whose `stage` is null, so the editor writes one. A word she
    // adds is available from the first minute, which is the only meaning left.
    stage: 1,
    // K6 / K7 — **the save is never blocked.** A word that did not decompose, or that is
    // too long for the strip, is stored with everything she entered and filed under
    // *Chưa chơi được* with a reason she can read.
    enabled: parsed && !draft.draft,
    draft: Boolean(draft.draft) || !parsed,
    fallbackEmoji: null,
    images: draft.images ?? [],
    audio: {
      word: draft.audio?.word ?? null,
      blend: draft.audio?.blend ?? null,
      sentence: draft.audio?.sentence ?? null,
    },
    build: {
      from: 'editor',
      addedAt,
    },
  };

  if (!record.enabled) {
    record.disabledReason = draft.disabledReason ?? null;
  }

  if (language === 'vi') {
    record.syllables = parsed
      ? [{ onset: choice.onset ?? null, rime: choice.rime, tone: choice.tone }]
      : [];
    record.letters = parsed ? choice.letters.map(nfc) : [];
    record.onsetLetterCount = parsed ? choice.onsetLetterCount : 0;
    // `content-pipeline.md` §3.7 — the opt-out for a spelling in which the onset and the
    // rime share a character (`gì`). It is written by the one place that can see the
    // overlap, and the validator refuses the word without it.
    if (parsed && choice.spellingException) record.build.spellingException = true;
  } else {
    record.tiles = parsed ? choice.tiles.slice() : [];
    record.letters = parsed ? choice.letters.map(nfc) : [];
  }

  return record;
}

/**
 * Fold what she just entered into the word already on disk, **without losing anything the
 * editor does not know about** — `build.fetched`, a `fallbackEmoji`, a `sentence` clip, a
 * field a later version of the app added. She is editing a seed word as often as one of
 * her own, and a seed word carries provenance this screen never asks about.
 */
export function mergeWordRecord(existing, next) {
  if (!existing || typeof existing !== 'object') return next;
  return {
    ...existing,
    ...next,
    // A seed word's bundled emoji is its last line of defence if every photograph is
    // later lost (`content-pipeline.md` §5), so editing the word must not take it away.
    fallbackEmoji: existing.fallbackEmoji ?? null,
    // **Only the clip the editor asks about may change.** A blanket spread here wiped
    // `audio.sentence` — the optional step-6 clip §7.2 plays after the word — off every
    // seed word she opened, because `buildWordRecord` writes an explicit `null` for the
    // two slots the editor never offers. Caught by a test written for provenance.
    audio: {
      ...(existing.audio ?? {}),
      word: next.audio.word ?? (existing.audio ? existing.audio.word ?? null : null),
    },
    build: { ...(existing.build ?? {}), ...next.build },
  };
}

/**
 * The other direction: the word on disk, opened for editing. Hostile input like every
 * other read — a missing array is an empty one, never a crash three screens later.
 */
export function draftFromRecord(record) {
  return {
    id: typeof record.id === 'string' ? record.id : null,
    text: typeof record.text === 'string' ? record.text : '',
    images: Array.isArray(record.images)
      ? record.images.filter((i) => i && typeof i === 'object' && typeof i.src === 'string')
      : [],
    audio: {
      word: record.audio && typeof record.audio === 'object' ? record.audio.word ?? null : null,
      blend: record.audio && typeof record.audio === 'object' ? record.audio.blend ?? null : null,
      sentence: record.audio && typeof record.audio === 'object' ? record.audio.sentence ?? null : null,
    },
    draft: record.draft === true,
    parseIndex: 0,
  };
}
