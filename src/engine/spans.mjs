// **A word's sounds, as runs of letters** — the one idea revision 5 adds to the engine.
//
// The board is the alphabet and a digraph is two taps (`literacy-vi.md` §0, `literacy-
// en.md` §0), so the thing the strip draws, the thing a chant beat lights and the thing a
// tap speaks are all the same object: a **span**, a contiguous run of letters that is one
// sound.
//
//     chó     letters c h o      spans  [c h] [o]            2 spans, 3 letters
//     ship    letters s h i p    spans  [s h] [i] [p]        3 spans, 4 letters
//     áo      letters a o        spans  [a o]                1 span,  2 letters
//
// **The spans are STORED, never inferred from the letter stream** (`literacy-vi.md` §0.5,
// `acceptance-criteria.md` C4f). They are built once, at pack load, from the word's own
// decomposition — `onsetLetterCount` in Vietnamese, `tiles` in English — because `gì` is
// the onset `gi` plus the rime `i` written with a single `i`, and no rule over its two
// letters can recover that. Deriving the boundary would also be *composing a spelling*,
// which `literacy-vi.md` §1.2 forbids at runtime for the same reason.
//
// Nothing in this file knows which language it is looking at: a span is `{ start, end,
// group, unit, kind }` in both, and the per-language part — what the groups are called and
// which tile each unit is — is decided in `pack.mjs` when the word is resolved.
//
// Pure, and cheap: the truncation below is what a half-built word is, and it is recomputed
// on every keystroke of a 4-year-old's, which is to say a handful of array slices.

/**
 * The spans of the first `n` letters of a word — **what the strip is showing right now.**
 * The last one may be *partial*: `c` of `ch` is the state where a tap on `h` will grow the
 * span rather than start a new one, and it is the state that speaks `cờ` before `chờ`
 * supersedes it (`literacy-vi.md` §0.9).
 *
 * @param {{start:number,end:number,group:string,unit:string,kind:string}[]} spans
 * @param {number} n  how many letters are placed
 */
export function spansAt(spans, n) {
  const out = [];
  for (const span of spans) {
    if (span.start >= n) break;
    const end = Math.min(span.end, n);
    out.push({ ...span, end, partial: end < span.end });
  }
  return out;
}

/** The span a letter at `index` belongs to, or null. */
export function spanOf(spans, index) {
  return spans.find((s) => index >= s.start && index < s.end) ?? null;
}

/** The letters of a span, as the string the pack keys audio on (`ch`, `sh`, `ăn`). */
export function unitText(letters, span) {
  return letters.slice(span.start, span.end).join('');
}

/**
 * The span being built after `n` letters, and what it says so far. `null` on an empty
 * strip, which is the one state where a tap starts a span rather than continuing one.
 */
export function openSpan(spans, letters, n) {
  if (n <= 0) return null;
  const placed = spansAt(spans, n);
  const last = placed[placed.length - 1];
  return last ? { ...last, text: unitText(letters, last) } : null;
}
