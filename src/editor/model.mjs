// **She types a word; the app derives the rest.**
//
// `content-pipeline.md` §3.7 and `ui.md` §13.7 E19: `letters` and `onsetLetterCount` are
// *derived data, written by the editor, never composed at runtime*. This is the door to
// the pair of files that derive them, and it is pure — no React, no filesystem, no clock —
// so every rule runs in Node against the two shipped packs, word for word
// (`test/editor-model.test.mjs`: all 47 `vi-seed` and all 40 `en-seed` decompositions are
// reproduced from their spelling alone).
//
// **This is the only file in the editor that names both languages**, exactly as
// `src/engine/lang/index.mjs` is the only one in the engine, and for the same reason: the
// lookup **throws** on an unknown language rather than defaulting, so a typo is a crash in
// development and never a leak in front of the child (`acceptance-criteria.md` R4).
// `src/editor/vi.mjs` and `src/editor/en.mjs` each see one language and no other.
//
// Three properties the pair exists to hold:
//
//   1. **The authoritative parse never touches a tone mark.** `vi.mjs` matches her
//      spelling against the forms the pack **already stores** — an onset glyph followed
//      by a rime's stored `toned[tone]` — so the one thing `literacy-vi.md` §1.2 forbids
//      (building the word by placing a mark) is not how the word is recognised. The mark
//      placer in `tone.mjs` is reached only when the match **fails**, to write the
//      sentence on the help screen and to seed the six cells she then corrects (K3, K4).
//
//   2. **Nothing it cannot parse is ever rejected.** Every failure returns a `problem`
//      with a code and a renderable sentence (K8), the screens in `ui.md` §13.3 render
//      it, and the save goes ahead as a not-yet-playable word (K6, K7). The word
//      "invalid" appears nowhere in this module or in the strings it keys.
//
//   3. **Six letters is a refusal at the moment she types it** (X8, E20, `ui.md`
//      §13.3a). It is reported as a `problem` beside the parse rather than instead of it,
//      because the *Too long for the board* screen has to draw the strip to scale with
//      the extra letter falling off the end — which needs the letters.

import { MAX_WORD_LETTERS } from '../engine/rules.mjs';
import { glyphLength } from '../engine/text.mjs';
import { normaliseTyped, problem, PROBLEMS } from './shared.mjs';
import * as viModel from './vi.mjs';
import * as enModel from './en.mjs';

export { MAX_WORD_LETTERS, normaliseTyped, PROBLEMS };
export { viRimeProposal } from './vi.mjs';

const MODELS = { vi: viModel, en: enModel };

/** Throws rather than defaulting: there is no fallback onto the other language (R4). */
function modelFor(language) {
  const model = MODELS[language];
  if (!model) throw new Error(`no editor model for language ${JSON.stringify(language)}`);
  return model;
}

/**
 * The letters a word would need **whatever its parse turns out to be** — the spelling
 * with the tone taken off. It is what the *Too long for the board* screen draws when the
 * word did not decompose at all, which is exactly `ui.md` §13.3a's own example:
 * `nghiêng` is seven letters and the rime `iêng` is not in the pack either, and the
 * length is the message that helps her.
 */
export function bareLetters(language, text) {
  return modelFor(language).bareLetters(normaliseTyped(text));
}

/**
 * The span bars the strip will draw for a choice — the same shape `src/engine/pack.mjs`
 * resolves for a stored word, so the *Confirm the taps* screen (S19) draws the picture the
 * child will actually see rather than a second rendering of the same idea.
 */
export function spansOf(choice) {
  return modelFor(choice.kind).spansOf(choice);
}

/** §13.3a / S19 — is there anything on this word for her to confirm? */
export function needsConfirm(choice) {
  return modelFor(choice.kind).needsConfirm(choice);
}

/**
 * **What the add-a-word flow calls, and the only thing it calls.**
 *
 * @returns {{
 *   text: string,            // normalised, and what will be stored
 *   parses: object[],        // every reading, best first; [] when nothing was recognised
 *   choice: object|null,     // `parses[index]` materialised into a word shape
 *   problem: object|null,    // a renderable reason (K8); never blocks the save (K6)
 *   needsConfirm: boolean,   // S19 — only when a unit is more than one letter (§13.3a)
 * }}
 */
export function analyse(pack, typed, index = 0) {
  const model = modelFor(pack.language);
  const text = normaliseTyped(typed);

  // **Three things are decided before anything is parsed**, and the order is §13.3's:
  // two syllables, then a character the board has no letter for, then a word longer than
  // the strip. None of them has a useful parse behind it — `máy bay` is two words and
  // `nghiêng`'s rime is missing as well as its seventh letter — and a 400-character paste
  // would otherwise walk a search tree to say so.
  const skip = text.includes(' ')
    || model.offAlphabet(text).length > 0
    || model.bareLetters(text).length > MAX_WORD_LETTERS;
  const parses = skip ? [] : model.parses(pack, text);

  if (parses.length === 0) {
    return {
      text, parses: [], choice: null, problem: model.explain(pack, text), needsConfirm: false,
    };
  }

  const at = Math.min(Math.max(0, index), parses.length - 1);
  const choice = model.choiceFor(parses[at], at, text);

  // **X8 / E20 — six cells is the ceiling, and it is refused here, not on the board.**
  const over = choice.letters.length > MAX_WORD_LETTERS;
  const bad = choice.letters.find((ch) => glyphLength(ch) !== 1) ?? null;
  return {
    text,
    parses,
    choice,
    problem: over
      ? problem('tooLong', { letters: choice.letters, limit: MAX_WORD_LETTERS })
      : (bad ? problem('noParse', { typed: text }) : null),
    needsConfirm: model.needsConfirm(choice),
  };
}
