// The word list (`ui.md` §13.1) as **data**, so that what his mother is told and what the
// child's board actually does cannot drift apart.
//
// `acceptance-criteria.md` J2: *a word that cannot yet be played appears in a named
// section with a one-line reason — **never hidden and never deleted***. K8: *the
// validator returns a **reason string the UI renders**, not a boolean*.
//
// The authority for *why* is `pack.catalogue` — the resolved pack, which is the thing the
// board obeys — and `analyse()` is consulted only to turn the two reasons that say
// nothing useful (`draft`, and a word the catalogue never saw) into the sentence she can
// act on. Deriving the reason independently here is how the editor would come to say
// "ready" about a word the board withholds.

import { analyse } from './model.mjs';

function decompositionOf(record, pack) {
  if (pack.language === 'vi') {
    const s = Array.isArray(record.syllables) ? record.syllables[0] : null;
    if (!s || typeof s !== 'object') return null;
    const tone = pack.tiles.tone.find((t) => t.id === s.tone);
    return [s.onset, s.rime, tone ? tone.label : s.tone].filter(Boolean).join(' · ');
  }
  return Array.isArray(record.tiles) && record.tiles.length > 0 ? record.tiles.join(' · ') : null;
}

/**
 * One row of §13.1: a thumbnail, the word **as she typed it** (D24 — nothing on a parent
 * surface is upper-cased), its decomposition, and a completeness dot.
 */
export function rowFor(record, pack) {
  const entry = pack.catalogue.find((c) => c.id === record.id) ?? null;
  const playable = Boolean(entry && entry.playable);
  let reason = entry ? entry.reason : { code: 'unknown', message: null };

  // A draft is not a diagnosis. Ask the model what is actually in the way, so the row
  // says `7 chữ cái` or `hai tiếng` rather than `this word is still being added`.
  if (!playable && (reason === null || reason.code === 'draft' || reason.code === 'unknown')) {
    const text = typeof record.text === 'string' ? record.text : '';
    const looked = analyse(pack, text);
    if (looked.problem) reason = { code: looked.problem.code, detail: looked.problem };
    else if (!Array.isArray(record.images) || record.images.length === 0) {
      reason = { code: 'noPicture', detail: null };
    } else if (!record.audio || !record.audio.word) reason = { code: 'noWordAudio', detail: null };
    else reason = { code: 'draft', detail: null };
  }

  const images = Array.isArray(record.images) ? record.images : [];
  return {
    id: record.id,
    text: typeof record.text === 'string' ? record.text : '',
    thumb: images.length > 0 && images[0] && typeof images[0].src === 'string' ? images[0].src : null,
    fallbackEmoji: typeof record.fallbackEmoji === 'string' ? record.fallbackEmoji : null,
    imageCount: images.length,
    hasAudio: Boolean(record.audio && record.audio.word),
    decomposition: decompositionOf(record, pack),
    playable,
    reason: playable ? null : reason,
    section: playable ? 'playable' : 'notYet',
  };
}

/**
 * The whole list, in the three sections of §13.1, plus the unreadable files.
 *
 * `unreadable` is not dropped: `content-pipeline.md` §6 says a word file that will not
 * parse is quarantined and *"the editor shows '1 word could not be read'"*. The child
 * never meets it; the adult who can fix it always does (K9).
 */
export function buildList({ words, unreadable = [], trash = [], pack }) {
  const rows = words.map((w) => rowFor(w, pack));
  // Her own words first inside each section, then alphabetically, so a word she just
  // added is where she is looking.
  const byText = (a, b) => (a.text < b.text ? -1 : a.text > b.text ? 1 : 0);
  return {
    playable: rows.filter((r) => r.section === 'playable').sort(byText),
    notYet: rows.filter((r) => r.section === 'notYet').sort(byText),
    deleted: trash.map((t) => ({
      id: t.id,
      text: typeof t.word.text === 'string' ? t.word.text : '',
      thumb: Array.isArray(t.word.images) && t.word.images[0] ? t.word.images[0].src : null,
      fallbackEmoji: typeof t.word.fallbackEmoji === 'string' ? t.word.fallbackEmoji : null,
      expiresInDays: t.expiresInDays,
      section: 'deleted',
    })),
    unreadable: unreadable.slice(),
    counts: {
      playable: rows.filter((r) => r.section === 'playable').length,
      notYet: rows.filter((r) => r.section === 'notYet').length,
      deleted: trash.length,
    },
  };
}
