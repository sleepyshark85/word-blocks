// The tone-mark placer — **ADVISORY, and the editor is the only thing allowed to call it.**
//
// `literacy-vi.md` §5.4: *"Composition happens once, in the editor, in front of a human —
// never at runtime."* `acceptance-criteria.md` K5 says the same thing from the other
// side: a rime his mother adds has its six toned forms **stored**, and no runtime code
// composes a spelling or places a tone mark.
//
// So this file exists exactly once in the app, it is reached only from the add-a-rime
// screen (§13.3, K3/K4), and `test/purity.test.mjs` keeps it out of `src/engine/` — the
// engine may not even name `viApplyTone`. Everything it produces is written to the pack
// and shown to her for correction before the child ever meets it.
//
// It is a transcription of `tools/lib/rules.mjs`, which is the authority, for the same
// reason `src/layout/layout.mjs` transcribes `tools/layout-sweep.mjs`: the app must not
// bundle the asset pipeline. `test/editor-parity.test.mjs` runs every rime in both packs
// and every tone through both copies and fails on the first disagreement, so a copy that
// drifts is a failing build rather than a wrong spelling on her phone.

/** `literacy-vi.md` §5.1, in the tone-row order the child sees. */
export const VI_TONE_MARKS = {
  ngang: null,
  huyen: '̀', // combining grave
  sac: '́', // combining acute
  hoi: '̉', // combining hook above
  nga: '̃', // combining tilde
  nang: '̣', // combining dot below
};

/** Consonant finals, longest first — stripped to expose the vowel cluster. */
const VI_FINALS = ['ngh', 'nh', 'ng', 'ch', 'm', 'n', 'p', 't', 'c'];

const VI_VOWEL_LETTERS = 'aăâeêioôơuưy';

/**
 * Place a tone mark on a rime, per `literacy-vi.md` §5.5:
 *
 *   1 vowel                      -> mark it                     (`bò`, `cá`, `mũ`)
 *   2+ vowels, consonant final   -> mark the LAST vowel          (`bánh`, `tiếng`)
 *   2  vowels, no final          -> mark the FIRST vowel         (`mèo`, `mưa`, `hòa`)
 *   3  vowels, no final          -> mark the SECOND vowel        (`chuối`, `người`)
 *
 * Returns null rather than throwing on input it cannot place a mark on, because the
 * caller is a screen and a thrown error there is a blank screen in front of a parent.
 */
export function viApplyTone(rime, toneId) {
  if (typeof rime !== 'string' || rime === '') return null;
  if (!Object.prototype.hasOwnProperty.call(VI_TONE_MARKS, toneId)) return null;
  const mark = VI_TONE_MARKS[toneId];
  const nfc = rime.normalize('NFC');
  if (!mark) return nfc;

  let body = nfc;
  let hasFinal = false;
  for (const f of VI_FINALS) {
    if (body.length > f.length && body.endsWith(f)) { body = body.slice(0, -f.length); hasFinal = true; break; }
  }

  const chars = [...nfc];
  const vowelIdx = [];
  for (let i = 0; i < body.length; i += 1) if (VI_VOWEL_LETTERS.includes(chars[i])) vowelIdx.push(i);
  if (!vowelIdx.length) return null;

  let target;
  if (vowelIdx.length === 1) target = vowelIdx[0];
  else if (hasFinal) target = vowelIdx[vowelIdx.length - 1];
  else if (vowelIdx.length === 2) target = vowelIdx[0];
  else target = vowelIdx[1];

  chars.splice(target + 1, 0, mark);
  return chars.join('').normalize('NFC');
}

/**
 * **The inverse, and it is the diagnostic half rather than the authoritative one.**
 *
 * `§13.3`'s *unknown rime* screen has to say *"I know `ch`. I do not know the rime
 * `uông`"* when she typed `chuống` — so something has to get from the marked form back to
 * the bare one. That is this, and it is the only place in the app that decomposes a
 * character.
 *
 * It is **never** how a word is parsed: `analyseVi` matches her spelling against the
 * forms the pack already stores (`model.mjs`), and only when that fails does this run, to
 * write the sentence on the help screen and to seed the add-a-rime screen she then
 * corrects by hand (K4).
 */
export function viStripTone(text) {
  if (typeof text !== 'string') return { base: '', tone: 'ngang' };
  const decomposed = text.normalize('NFD');
  for (const [id, mark] of Object.entries(VI_TONE_MARKS)) {
    if (mark && decomposed.includes(mark)) {
      return { base: decomposed.split(mark).join('').normalize('NFC'), tone: id };
    }
  }
  return { base: decomposed.normalize('NFC'), tone: 'ngang' };
}

/**
 * Every toned form of a rime, with the illegal ones explicitly null — the shape
 * `content-pipeline.md` §3.1 stores and the six cells §13.3's add-a-rime screen draws
 * (K3). `legalTones` is passed in rather than recomputed so that the one copy of the
 * checked-syllable rule stays in `src/engine/rules.mjs`.
 */
export function viTonedForms(rime, legalTones) {
  const legal = new Set(legalTones);
  const out = {};
  for (const id of Object.keys(VI_TONE_MARKS)) {
    out[id] = legal.has(id) ? viApplyTone(rime, id) : null;
  }
  return out;
}
