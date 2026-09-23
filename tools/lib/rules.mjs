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

/* ============================================================ revision 5 — letters */
/*
 * `literacy-vi.md` §0 and `literacy-en.md` §0. The board stopped being a list of onsets,
 * rimes and digraphs and became **the standard alphabet**: a digraph is entered as its
 * letters and is still one unit of the model. The owner, from playing the built app:
 *
 *   "display the full standard character table … for character combining, he will still
 *    going through character by character, even for combine ones like ch, tr (Choose C
 *    and choose H). This to keep the table consistent"
 *
 * So there are two different orderings in a pack now, and they are not the same list:
 *
 *   inventoryOrder   what the CHILD sees — 29 Vietnamese letters, or a-z, then the tones
 *   tiles            what the EDITOR offers HER — the onsets, rimes and digraphs, which
 *                    are still the model and still what a word is stored as
 */

/**
 * `literacy-vi.md` §0.2, §0.4, §0.13 — the 29 letters, in the order the owner typed
 * them. `f j w z` are not Vietnamese letters and are not on the board; that is why
 * Vietnamese is 29 and English 26, and it is correct.
 */
export const VI_ALPHABET = [
  'a', 'ă', 'â', 'b', 'c', 'd', 'đ', 'e', 'ê', 'g', 'h', 'i', 'k', 'l', 'm',
  'n', 'o', 'ô', 'ơ', 'p', 'q', 'r', 's', 't', 'u', 'ư', 'v', 'x', 'y',
].map((c) => c.normalize('NFC'));

/** `literacy-en.md` §0.3 — a-z, one run, no digraphs. */
export const EN_ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

const VI_LETTER_RANK = new Map(VI_ALPHABET.map((c, i) => [c, i]));

/**
 * Vietnamese dictionary collation, over the 29-letter alphabet. This is what puts `ch`
 * immediately after `c` and `ăng` immediately after `a…`, and it is a FUNCTION rather
 * than a transcribed list precisely because `literacy-vi.md` §0.13 prints the two
 * expected lists — so the lists are a test of this comparator, not its source.
 * A shorter string that is a prefix of a longer one sorts first (`c` < `ch`, `on` < `ong`).
 */
export function viCollate(a, b) {
  const x = [...a.normalize('NFC')];
  const y = [...b.normalize('NFC')];
  for (let i = 0; i < Math.min(x.length, y.length); i += 1) {
    const rx = VI_LETTER_RANK.has(x[i]) ? VI_LETTER_RANK.get(x[i]) : VI_ALPHABET.length;
    const ry = VI_LETTER_RANK.has(y[i]) ? VI_LETTER_RANK.get(y[i]) : VI_ALPHABET.length;
    if (rx !== ry) return rx - ry;
    if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  }
  return x.length - y.length;
}

/** English: the alphabet first, then the digraphs alphabetised among themselves (§0.7). */
export function enCollate(a, b) {
  const la = [...a].length === 1 ? 0 : 1;
  const lb = [...b].length === 1 ? 0 : 1;
  if (la !== lb) return la - lb;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * `literacy-vi.md` §0.5 — **the letter stream of a syllable, which is what he taps.**
 *
 * Default: the onset's letters followed by the rime's letters, untoned; the tone is the
 * separate terminal tap (§0.8). It is DERIVED here, once, at build time, and then
 * STORED — never recomputed at runtime — because the derivation is not always right:
 * `gì` is onset `gi` + rime `i` written with a single `i`, and the letter stream cannot
 * express that. Such a word carries `build.spellingException` and an explicit `letters`,
 * and this function is not consulted for it.
 */
export function viLetters(onset, rime) {
  return [...`${onset ?? ''}${rime}`.normalize('NFC')];
}

/** How many of those letters belong to the onset. `ch` -> 2, `ngh` -> 3, zero onset -> 0. */
export function viOnsetLetterCount(onset) {
  return [...(onset ?? '').normalize('NFC')].length;
}

/** `literacy-en.md` §0.5 — English letters ARE the spelling, character for character. */
export function enLetters(text) {
  return [...text.normalize('NFC')];
}

/**
 * Every proper prefix of a symbol in `ids` that is not itself in `ids` — the states the
 * child can be in that no tile speaks for.
 *
 * `literacy-vi.md` §0.12: over the 26 onsets this is exactly `p` and `q` (bare `p` and
 * bare `q` are never onsets), and over the 35 rimes it is exactly
 * `ac an uô â ă ăn ư ưn`. Deriving it rather than listing it is what makes the answer
 * follow the pack when his mother adds `ngh` or a rime nobody thought of.
 */
export function prefixStates(ids) {
  const have = new Set(ids.map((s) => s.normalize('NFC')));
  const out = new Set();
  for (const id of have) {
    const chars = [...id];
    for (let n = 1; n < chars.length; n += 1) {
      const p = chars.slice(0, n).join('');
      if (!have.has(p)) out.add(p);
    }
  }
  return [...out];
}

/**
 * `literacy-vi.md` §0.9 — what a partial unit SAYS when the tap that makes it lands.
 * A rime-state reads itself aloud; an onset-state says its đánh vần name. Two vowels
 * cannot be said level at all, which is why they are voiced with a mark:
 *
 *   ă -> á   â -> ớ        (§0.4, confidence `check`: the owner can settle it from the book)
 *   p -> pờ  q -> quờ      (§0.6: neither is ever an onset on its own)
 *
 * Every other prefix state is read as written. §0.9 records the honest cost: several of
 * these are not real Vietnamese syllables read level, so **every one needs a human
 * listening check before it ships**.
 */
export const VI_PREFIX_SPEECH = { p: 'pờ', q: 'quờ', ă: 'á', â: 'ớ' };
export function viPrefixSpeech(id) {
  return VI_PREFIX_SPEECH[id.normalize('NFC')] ?? id.normalize('NFC');
}

/* ======================================== revision 5 — glyph casing (ui.md §8.2) */

/*
 * **The owner answered `open-questions-ui.md` Q7 on 2026-09-23: English tiles are
 * UPPERCASE.** `ui.md` §8.2 hands the content-engineer E22 — "one casing field per pack;
 * the name and shape are the content-engineer's" — and this is the answer.
 *
 *     "display": { "glyphCase": "upper" }
 *
 * **Why `display`, and why it is nested.** The manifest already groups policy-as-data by
 * what it governs: `media` is the degradation policy, `rules` the orthography, `chant` the
 * timing. `display` is the render policy, and putting the field under it makes D20's
 * boundary a fact about the schema rather than a rule somebody has to remember: **nothing
 * under `display` may reach stored data, audio, ordering or any parent surface.** A bare
 * top-level `glyphCase` sitting between `dialect` and `rules` would read like content, and
 * the next render-only field would have nowhere principled to go.
 *
 * **Why `glyphCase` and not `case` or `uppercase`.** §8.2 is emphatic that it reaches *the
 * glyph* and nothing else — not `letters`, not the clip key, not `inventoryOrder`'s sort,
 * not the editor. The name carries the scope.
 *
 * **Two values, and everything else is lowercase.** D23: absent, empty or unrecognised
 * renders lowercase and starts normally. A casing flag is never worth refusing to start
 * over (`CLAUDE.md`: content is hostile input).
 */
export const GLYPH_CASES = ['lower', 'upper'];
export const DEFAULT_GLYPH_CASE = 'lower';

/**
 * What a seed pack ships with. English upper (the owner's answer); Vietnamese lower —
 * and `ui.md` §8.2.3 is explicit that the asymmetry is a **correctness** constraint, not a
 * style preference. See `viUppercaseGaps` below for the gate that keeps it that way.
 */
export function seedGlyphCase(language) {
  return language === 'en' ? 'upper' : 'lower';
}

/** D23's fallback, applied to whatever the manifest actually holds. Never throws. */
export function readGlyphCase(manifest) {
  const d = manifest && manifest.display;
  if (!d || typeof d !== 'object' || Array.isArray(d)) return DEFAULT_GLYPH_CASE;
  const v = d.glyphCase;
  return typeof v === 'string' && GLYPH_CASES.includes(v) ? v : DEFAULT_GLYPH_CASE;
}

/**
 * **The Q13 gate, as a computation rather than a constant.**
 *
 * `ui.md` §8.2.3 / AC **Q13**: `assets/fonts/FIXTURE.txt` carries seven uppercase
 * Vietnamese letters — `Ă Â Đ Ê Ô Ơ Ư` — and **none of the ~130 precomposed marked
 * capitals**. The bundled faces do contain those glyphs, but *a font that contains a glyph
 * is not a gate that has rendered it*, and `mả`/`mã` are 34 px apart at 36 pt with the
 * mark sitting against cap height rather than x-height. `CLAUDE.md` calls rendering those
 * two alike a **correctness** failure.
 *
 * So rather than banning `vi` + `upper` with a constant that nobody will remember to
 * delete, this returns **the characters this specific pack would need and the fixture does
 * not cover**. Extend the fixture, re-run Q1–Q5c, and the gate lifts by itself.
 *
 * @param {string[]} texts   every string the child would see upper-cased
 * @param {string}   fixture the contents of assets/fonts/FIXTURE.txt
 * @returns {string[]} the uncovered characters, sorted
 */
export function viUppercaseGaps(texts, fixture) {
  const covered = new Set([...fixture.normalize('NFC')]);
  const need = new Set();
  for (const t of texts) {
    for (const ch of String(t).toLocaleUpperCase('vi').normalize('NFC')) {
      // ASCII is covered by the Latin half of the fixture and by every font on earth.
      // What Q13 is about is `Ẫ`, `Ộ`, `Ử` — a base letter carrying a diacritic AND a tone.
      if (ch.codePointAt(0) < 128) continue;
      if (ch.toLowerCase() === ch) continue;      // not a letter with a case
      if (!covered.has(ch)) need.add(ch);
    }
  }
  return [...need].sort();
}
