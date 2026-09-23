// Orthographic rules the *runtime* needs, transcribed from the literacy documents.
//
// Why this is not `tools/lib/rules.mjs`
// ------------------------------------
// It is deliberately a strict **subset**. `tools/lib/rules.mjs` also exports
// `viApplyTone` / `viTonedForms`, the tone-mark placer, and `acceptance-criteria.md` K5
// and `literacy-vi.md` §5.4 forbid that code from existing in a runtime path:
// "Composition happens once, in the editor, in front of a human — never at runtime."
// Re-exporting the tools module would drag the placer into the app bundle, where the
// only defence against it being called would be nobody calling it.
//
// The two modules must never disagree about the rules they share. That is enforced by
// execution, not by intention: `test/rules-parity.test.mjs` runs every onset × every
// rime, every rime's legal tone set, and every dialect's homophone list through both and
// asserts identical answers. Change one without the other and the suite goes red.

/** `literacy-vi.md` §5.1. The order is the order the child sees in the tone row. */
export const VI_TONE_IDS = ['ngang', 'huyen', 'sac', 'hoi', 'nga', 'nang'];

/**
 * `literacy-vi.md` §0.4, §0.13 — **the board, revision 5**: the 29 Vietnamese letters in
 * the order the owner typed them. `f j w z` are not Vietnamese letters and are not on it,
 * which is why Vietnamese is 29 and English 26.
 *
 * It is here rather than only in the pack because `inventoryOrder` is untrusted content:
 * a letter she deletes by accident is every word containing it made unbuildable
 * (`content-pipeline.md` §3.7), so the runtime needs its own answer to *what the alphabet
 * is* in order to put the missing one back on the board.
 */
export const VI_ALPHABET = [
  'a', 'ă', 'â', 'b', 'c', 'd', 'đ', 'e', 'ê', 'g', 'h', 'i', 'k', 'l', 'm',
  'n', 'o', 'ô', 'ơ', 'p', 'q', 'r', 's', 't', 'u', 'ư', 'v', 'x', 'y',
].map((c) => c.normalize('NFC'));

/** `literacy-en.md` §0.3 — `a`–`z`, one run, and no digraph cells. */
export const EN_ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

/**
 * `ui.md` §4.2 / §7.2.1, `acceptance-criteria.md` X6, E20 — **six letters is the longest
 * word the smallest supported phone can draw legibly.** It is `STRIP_CELLS` in the layout
 * law; the engine carries its own copy because a word longer than the strip has to be
 * withheld from the tree rather than clipped in front of the child, and the engine may
 * not import the layout module. `test/layout-parity.test.mjs` asserts the two agree.
 */
export const MAX_WORD_LETTERS = 6;

/** `literacy-vi.md` §5.2 — a rime ending p/t/c/ch carries only sắc or nặng. Exceptionless. */
const VI_STOP_FINALS = ['ch', 'p', 't', 'c'];

export function viIsStopFinal(rime) {
  return typeof rime === 'string' && VI_STOP_FINALS.some((f) => rime.endsWith(f));
}

export function viLegalTones(rime) {
  return viIsStopFinal(rime) ? ['sac', 'nang'] : VI_TONE_IDS.slice();
}

/**
 * `literacy-vi.md` §4.1 — three spellings of one sound each, selected entirely by the
 * rime that follows. The child cannot hear the difference and must never be asked to.
 * Note the `y` asymmetry: `k` takes i/y/e/ê, `gh` and `ngh` take i/e/ê only.
 */
export const VI_SPELLING_PAIRS = [
  { front: 'k', back: 'c', frontVowels: 'iyeê' },
  { front: 'gh', back: 'g', frontVowels: 'ieê' },
  { front: 'ngh', back: 'ng', frontVowels: 'ieê' },
];

/**
 * `literacy-vi.md` §0.5 — the twelve vowel letters. Two jobs, and they are the same fact:
 * §4.1 keys on the rime's first vowel, and **vowel-initial ≡ rime-initial**, which is what
 * makes `role2` a property of the glyph rather than of his progress (`ui.md` §5.5, B2l).
 */
export const VI_VOWEL_LETTERS = 'aăâeêioôơuưy';

/** The rime's first vowel letter — what §4.1 keys on. */
export function viFirstVowel(rime) {
  if (typeof rime !== 'string') return null;
  for (const ch of rime.normalize('NFC')) if (VI_VOWEL_LETTERS.includes(ch)) return ch;
  return null;
}

/**
 * Returns an error string, or null when the pair is orthographically legal. `qu` is
 * exempt: §4.1 lists it as a third spelling of /k/ selected by the labial medial, not by
 * the rime's front-ness (`quạt`, `quê`).
 */
export function viCheckSpellingRule(onset, rime) {
  if (onset == null || onset === '') return null;
  if (onset === 'qu') return null;
  const v = viFirstVowel(rime);
  if (!v) return null;
  for (const p of VI_SPELLING_PAIRS) {
    const isFront = p.frontVowels.includes(v);
    if (onset === p.front && !isFront) {
      return `onset "${p.front}" is only legal before i/e/ê${p.frontVowels.includes('y') ? '/y' : ''}, but rime "${rime}" begins with "${v}" — the correct spelling is "${p.back}" (literacy-vi.md §4.1)`;
    }
    if (onset === p.back && isFront) {
      return `onset "${p.back}" is not legal before "${v}" — the correct spelling is "${p.front}" (literacy-vi.md §4.1)`;
    }
  }
  return null;
}

/**
 * `literacy-vi.md` §6.1 — sets that must never co-occur in one palette, by dialect.
 *
 * The runtime reads this list from `pack.json` (`rules.neverTogether`), because the
 * manifest is where it can change with the `dialect` field without a rebuild. This
 * function exists so the engine still has a defensible answer when a pack arrives with
 * the field missing or mangled, which is the case `development-process.md` §4 is about.
 */
export function viHomophoneSets(dialect) {
  const always = [['c', 'k'], ['g', 'gh'], ['ng', 'ngh']]; // §4.1, both dialects
  if (dialect === 'northern') {
    return [...always, ['d', 'gi', 'r'], ['s', 'x'], ['ch', 'tr']];
  }
  if (dialect === 'southern') {
    return [...always, ['hoi', 'nga'], ['d', 'gi']];
  }
  // Dialect not yet chosen (`open-questions.md` Q1): forbid every pair either dialect
  // merges. Costs palette variety; costs the child nothing.
  return [...always, ['d', 'gi', 'r'], ['s', 'x'], ['ch', 'tr'], ['hoi', 'nga']];
}

/* --------------------------------------------------------------------- English */

/** `literacy-en.md` §3.2, `ui.md` §5.6 — five vowels; `y` is /j/ and a consonant here. */
export const EN_VOWELS = ['a', 'e', 'i', 'o', 'u'];

/** `literacy-en.md` §3.3, §7 — tiles that can never start a word. */
export const EN_FINAL_ONLY = ['ck', 'll', 'ss', 'ff', 'zz', 'gg', 'ng', 'x'];

/** `literacy-en.md` §3.1 — `y` is /j/ and initial-only in v1. */
export const EN_INITIAL_ONLY = ['y'];

/**
 * `literacy-en.md` §3.1, §3.5 — no picturable CVC word, so **no v1 word is built from
 * `q`**. It gates WORDS, not tiles.
 *
 * It is deliberately **not** excluded from the board. `ui.md` §8.1 and
 * `acceptance-criteria.md` D1a/D1b/S14 (revision 4): every character in `inventoryOrder`
 * is drawn always, and one with no words behind it is permanently flat and still speaks.
 * A missing letter is exactly the inconsistency the owner reported from playing it.
 */
export const EN_EXCLUDED = ['q'];

/** `literacy-en.md` §6.2 and `literacy-vi.md` §4.1: same rule, same reason, both languages. */
export const EN_HOMOPHONE_SETS = [['c', 'k']];

/**
 * Where a tile may legally sit in a word of `length` tiles. `position` comes from the
 * pack (`any` | `initial` | `final`), with the literacy document's lists as the fallback
 * for a tile whose `position` field is missing or junk.
 */
export function enPositionOf(tileId, declared) {
  if (declared === 'any' || declared === 'initial' || declared === 'final') return declared;
  if (EN_FINAL_ONLY.includes(tileId)) return 'final';
  if (EN_INITIAL_ONLY.includes(tileId)) return 'initial';
  return 'any';
}

export function enSlotIsLegal(position, slotIndex, length) {
  if (position === 'initial') return slotIndex === 0;
  if (position === 'final') return slotIndex === length - 1;
  return true;
}

/* -------------------------------------------------------------- shared helpers */

/**
 * True when adding `candidate` to `chosen` would put two members of one never-together
 * set in the same palette (`acceptance-criteria.md` B4, D11).
 */
export function conflicts(sets, chosen, candidate) {
  for (const set of sets) {
    if (!set.includes(candidate)) continue;
    for (const c of chosen) if (c !== candidate && set.includes(c)) return true;
  }
  return false;
}

/**
 * `ui.md` §5.5 / AC B2l, C15, D5, S5 — **a role is a permanent property of the glyph.**
 * A consonant letter is `role1`/solid, a vowel letter `role2`/split, a tone `role3`/
 * dotted, in **both** languages. Revision 4 made role a stage of the word (onset, rime,
 * tone); a colour that depended on the job a letter is doing *this time* would change
 * under his finger, which is the morph the owner rejected.
 */
export function viLetterKind(letter) {
  return VI_VOWEL_LETTERS.includes(letter) ? 'vowel' : 'consonant';
}

export function enLetterKind(letter) {
  return EN_VOWELS.includes(letter) ? 'vowel' : 'consonant';
}

/**
 * **`ui.md` §8.2 / `content-pipeline.md` §3.8 — the render policy, `display.glyphCase`.**
 *
 * The owner answered `open-questions-ui.md` Q7 with `A B C D`: English glyphs are
 * uppercase. The field is **nested under `display`** because that makes AC D20's boundary
 * structural rather than remembered — *nothing under `display` may reach stored data,
 * audio, ordering or any parent surface* — and the name carries the scope: it reaches the
 * glyph and nothing else.
 *
 * **Two values, and everything else is lowercase** (D23). Absent, empty, misspelled or the
 * wrong shape all render lowercase and the app starts normally: content is hostile input
 * and a casing flag is never worth refusing to boot over. The validator is harsher than
 * this on purpose (a typo is a warning, a broken *shape* is an error), because the app
 * surviving something is not the same as it being acceptable.
 */
export const GLYPH_CASES = ['lower', 'upper'];
export const DEFAULT_GLYPH_CASE = 'lower';

export function readGlyphCase(manifest) {
  const d = manifest && manifest.display;
  if (!d || typeof d !== 'object' || Array.isArray(d)) return DEFAULT_GLYPH_CASE;
  const v = d.glyphCase;
  return typeof v === 'string' && GLYPH_CASES.includes(v) ? v : DEFAULT_GLYPH_CASE;
}
