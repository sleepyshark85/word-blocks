// Orthographic rules for both languages, in one place, so that the pack builder, the
// validator and any future tool cannot disagree about them.
//
// Every rule here is transcribed from a literacy-designer document and cites it. Nothing
// here is invented by the content pipeline — where a rule is ours (the tone-mark placer,
// §5.5) it is marked ADVISORY, because the composed spelling is stored as data and a
// human confirms it in the editor before it is ever read at runtime
// (`literacy-vi.md` §1.2, §5.4).

/* ------------------------------------------------------------------ Vietnamese */

/** `literacy-vi.md` §5.1. Order is the tone-row order the child sees. */
export const VI_TONES = [
  { id: 'ngang', name: 'ngang', mark: null },
  { id: 'huyen', name: 'huyền', mark: '̀' }, // combining grave
  { id: 'sac', name: 'sắc', mark: '́' }, // combining acute
  { id: 'hoi', name: 'hỏi', mark: '̉' }, // combining hook above
  { id: 'nga', name: 'ngã', mark: '̃' }, // combining tilde
  { id: 'nang', name: 'nặng', mark: '̣' }, // combining dot below
];
export const VI_TONE_IDS = VI_TONES.map((t) => t.id);

/** Diacritic name in the word list -> ascii tone id. */
export const VI_TONE_BY_NAME = Object.fromEntries(VI_TONES.map((t) => [t.name, t.id]));

/**
 * `literacy-vi.md` §5.2 — the checked-syllable rule. A rime ending in p/t/c/ch carries
 * only sắc or nặng. Stated in that document as "hard, exceptionless".
 */
const VI_STOP_FINALS = ['ch', 'p', 't', 'c'];
export function viIsStopFinal(rime) {
  return VI_STOP_FINALS.some((f) => rime.endsWith(f));
}
export function viLegalTones(rime) {
  return viIsStopFinal(rime) ? ['sac', 'nang'] : VI_TONE_IDS.slice();
}

/**
 * `literacy-vi.md` §4.1 — the three spelling pairs. Which member is correct is decided
 * entirely by the rime, and the child cannot hear the difference, so the palette must
 * never offer both and a pack entry must never pair the wrong one.
 *
 * Note the `y` asymmetry, which that document flags at confidence `check`: `k` takes
 * i/y/e/ê, `gh` and `ngh` take i/e/ê only.
 */
export const VI_SPELLING_PAIRS = [
  { front: 'k', back: 'c', frontVowels: 'iyeê' },
  { front: 'gh', back: 'g', frontVowels: 'ieê' },
  { front: 'ngh', back: 'ng', frontVowels: 'ieê' },
];

const VI_VOWEL_LETTERS = 'aăâeêioôơuưy';

/** The rime's first vowel letter — what §4.1 keys on. */
export function viFirstVowel(rime) {
  for (const ch of rime) if (VI_VOWEL_LETTERS.includes(ch)) return ch;
  return null;
}

/**
 * Returns an error string, or null. `qu` is exempt: §4.1 lists it as a third spelling of
 * /k/ selected by the labial medial, not by the rime's front-ness (`quạt`, `quê`).
 */
export function viCheckSpellingRule(onset, rime) {
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
 * Emitted into pack.json so the round generator reads the rule as data and it changes
 * with the `dialect` field rather than with a rebuild.
 */
export function viHomophoneSets(dialect) {
  const always = [['c', 'k'], ['g', 'gh'], ['ng', 'ngh']]; // §4.1, both dialects
  if (dialect === 'northern') {
    return [...always, ['d', 'gi', 'r'], ['s', 'x'], ['ch', 'tr']];
  }
  if (dialect === 'southern') {
    return [...always, ['hoi', 'nga'], ['d', 'gi']];
  }
  // dialect not yet chosen (open-questions.md Q1): be conservative and forbid every
  // pair either dialect merges. Costs palette variety; costs the child nothing.
  return [...always, ['d', 'gi', 'r'], ['s', 'x'], ['ch', 'tr'], ['hoi', 'nga']];
}

/* -------------------------------------- the tone-mark placer (ADVISORY, editor-only) */

/** Consonant finals, longest first — stripped to expose the vowel cluster. */
const VI_FINALS = ['ngh', 'nh', 'ng', 'ch', 'm', 'n', 'p', 't', 'c'];

/**
 * ADVISORY. Places a tone mark on a rime per `literacy-vi.md` §5.5. Used by the pack
 * builder and by the editor when the mother adds a rime; the result is stored as data
 * and shown to a human. **No runtime code calls this** (§5.4: "Composition happens
 * once, in the editor, in front of a human — never at runtime").
 *
 * Three cases, which is all §5.5 turns out to need:
 *
 *   1 vowel                      -> mark it                    (`bò`, `cá`, `mũ`)
 *   2+ vowels, consonant final   -> mark the LAST vowel         (`bánh`, `tiếng`, `chuông`)
 *   2  vowels, no final          -> mark the FIRST vowel        (`mèo`, `mưa`, `múa`, `hòa`)
 *   3  vowels, no final          -> mark the SECOND vowel       (`chuối`, `người`, `điều`)
 *
 * The open-2 case is §5.5's recommendation for `oa`/`oe`/`uy` (`hòa`, not `hoà`). Only
 * one seed word is affected and it carries `ngang`, so the seed list is unchanged either
 * way; the owner can flip one string if he disagrees.
 *
 * **Divergence from `literacy-vi.md` §3.1, recorded rather than silently absorbed.**
 * That section lists the medial `u` as occurring "before `â ê y i ơ`". Treating `u`
 * before `i` as a medial makes this function emit `uĩ` for `ui` + ngã, so the seed word
 * `mũi` would be built as `muĩ`. In `ui` the `u` is the nucleus and the `i` is a glide;
 * the genuine medial-before-i case is spelled `uy` (`quy`, `thúy`), never `ui`. The
 * placer therefore does not consult the medial list at all, and §3.1's `i` is flagged to
 * the literacy-designer in `open-questions-content.md`. Caught because the composed
 * spelling was cross-checked against the 47 spellings in `word-list.md`.
 */
export function viApplyTone(rime, toneId) {
  const tone = VI_TONES.find((t) => t.id === toneId);
  if (!tone) throw new Error(`unknown tone "${toneId}"`);
  const nfc = rime.normalize('NFC');
  if (!tone.mark) return nfc;

  let body = nfc;
  let hasFinal = false;
  for (const f of VI_FINALS) {
    if (body.length > f.length && body.endsWith(f)) { body = body.slice(0, -f.length); hasFinal = true; break; }
  }

  const chars = [...nfc];
  const vowelIdx = [];
  for (let i = 0; i < body.length; i += 1) if (VI_VOWEL_LETTERS.includes(chars[i])) vowelIdx.push(i);
  if (!vowelIdx.length) throw new Error(`rime "${rime}" has no vowel`);

  let target;
  if (vowelIdx.length === 1) target = vowelIdx[0];
  else if (hasFinal) target = vowelIdx[vowelIdx.length - 1];
  else if (vowelIdx.length === 2) target = vowelIdx[0];
  else target = vowelIdx[1];

  chars.splice(target + 1, 0, tone.mark);
  return chars.join('').normalize('NFC');
}

/** Every legal toned form of a rime; illegal tones are explicitly null (§5.4). */
export function viTonedForms(rime) {
  const legal = new Set(viLegalTones(rime));
  const out = {};
  for (const t of VI_TONE_IDS) out[t] = legal.has(t) ? viApplyTone(rime, t) : null;
  return out;
}

/* --------------------------------------------------------------------- English */

/** `literacy-en.md` §3.2. */
export const EN_VOWELS = ['a', 'e', 'i', 'o', 'u'];

/**
 * `literacy-en.md` §3.3 and §7 — tiles that can never start a word. Offering one where
 * the child might place it is the trap that document names.
 *
 * `gg` was missing from this list and nothing failed, because `packs/en-seed/pack.json`
 * declares `position: "final"` for it and the engine trusts the pack. That is the worst
 * shape a defect can take: correct today, silently wrong the first time a pack is built
 * without that field. Found by the app-developer in Slice 2.
 */
export const EN_FINAL_ONLY = ['ck', 'll', 'ss', 'ff', 'zz', 'gg', 'ng', 'x'];
/** §3.1 — `y` is /j/ and initial-only in v1. */
export const EN_INITIAL_ONLY = ['y'];
/**
 * §3.1, §3.5 — no picturable CVC word, so **no v1 word is built from `q`**. It gates
 * WORDS, not tiles.
 *
 * It is deliberately **not** excluded from the board. `ui.md` §8.1 and
 * `acceptance-criteria.md` D1a/D1b/S14 (revision 4): every character in `inventoryOrder`
 * is drawn always, and one with no words behind it is permanently flat and still speaks.
 * A missing letter is exactly the inconsistency the owner reported from playing it.
 */
export const EN_EXCLUDED = ['q'];

/** §6.2 and `literacy-vi.md` §4.1: same rule, same reason, both languages. */
export const EN_HOMOPHONE_SETS = [['c', 'k']];
