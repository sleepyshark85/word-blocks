// The Vietnamese half of the editor's derivation. `literacy-vi.md` §0.5, §1.2, §5.4.
//
// It names **one** language, which is the point: `model.mjs` is the only file in the
// editor that sees both, exactly as `src/engine/lang/index.mjs` is the only one in the
// engine (`acceptance-criteria.md` R4).

import {
  VI_ALPHABET, MAX_WORD_LETTERS, VI_TONE_IDS, viLegalTones, viCheckSpellingRule,
} from '../engine/rules.mjs';
import { viApplyTone, viStripTone, viTonedForms } from './tone.mjs';
import { normaliseTyped, problem } from './shared.mjs';

/**
 * **The tone is taken off before the alphabet is consulted**, because a tone is a tap of
 * its own and not a letter (`literacy-vi.md` §0.8): the board has `o`, and `ố` is `o`
 * plus the sắc she will press afterwards. Reporting `ố` as "not on the board" sent every
 * toned word she types to the wrong screen — it is the first thing this rule did.
 */
export function bareOf(word) {
  return word.split(' ').map((s) => viStripTone(s).base).join(' ');
}

/**
 * Every `(onset, rime, tone)` in this pack whose **stored** spelling is exactly the word
 * she typed. Nothing is composed and no mark is placed: the candidate is an onset's
 * stored glyph followed by a rime's stored `toned[tone]` string.
 *
 * More than one is genuinely possible — `già` is `gi`+`a` or `g`+`ia`, and the two put
 * the onset/rime boundary in different places, which is the whole reason the boundary is
 * stored (`content-pipeline.md` §3.7). They are returned **longest onset first**, which
 * is the standard analysis, and §13.3a draws the boundary so she can see which one she
 * got and pick the other.
 */
export function parses(pack, typed) {
  const word = normaliseTyped(typed);
  if (word === '') return [];
  const out = [];
  const onsets = [{ id: null, glyph: '' }, ...pack.tiles.onset];
  for (const onset of onsets) {
    const head = onset.glyph;
    const plain = word.startsWith(head); // `head` is '' for the zero onset (`áo`, `ong`)
    // **The collapsed spelling** (`literacy-vi.md` §1.2, `content-pipeline.md` §3.7).
    // `gì` is the onset `gi` plus the rime `i` written with a **single** `i`, and
    // `giêng` is `gi` + `iêng` written `giêng`. Both are the same fact: an onset ending
    // in `i` in front of a rime beginning in `i` shares one character. The candidate is
    // still two stored strings laid beside each other — nothing is composed and no mark
    // is placed — it is only the overlap that differs.
    //
    // *`gì` is `high` confidence in §1.2; `giêng` is `check`. Both fall out of the same
    // rule here, and neither is in the seed list, so the first one his mother types is
    // the first time it is exercised — which is why the word is written with
    // `build.spellingException` and shown to her on the confirm screen (§13.3a).*
    const collapsible = head.endsWith('i');
    const collapsedHead = collapsible ? head.slice(0, -1) : '';
    const collapsed = collapsible && word.startsWith(collapsedHead);
    if (!plain && !collapsed) continue;
    for (const rime of pack.tiles.rime) {
      for (const tone of rime.legalTones) {
        const form = rime.toned[tone];
        const isPlain = plain && form === word.slice(head.length) && word.length > head.length;
        const isCollapsed = collapsed && rime.id.startsWith('i')
          && form === word.slice(collapsedHead.length)
          && word.length > collapsedHead.length;
        if (!isPlain && !isCollapsed) continue;
        if (onset.id !== null && viCheckSpellingRule(onset.id, rime.id)) continue;
        out.push({
          onset: onset.id,
          rime: rime.id,
          tone,
          onsetGlyph: head,
          rimeForm: form,
          // The letters cannot be read off the pieces when they overlap, so the shape
          // comes from the spelling instead and the pack records the waiver.
          spellingException: !isPlain,
        });
      }
    }
  }
  out.sort((a, b) => b.onsetGlyph.length - a.onsetGlyph.length
    || (a.rime < b.rime ? -1 : a.rime > b.rime ? 1 : 0));
  return out;
}

/**
 * The letters and the boundary for one Vietnamese parse.
 *
 * The onset half is the onset's own letters, always — that is the boundary the engine
 * will trust (`src/engine/pack.mjs` `resolveViLetters`, C4f). The rime half is the
 * **untoned** rime, because the tone is the separate terminal tap (`literacy-vi.md`
 * §0.8) and the strip wears the mark on the carrier vowel rather than in a cell of its
 * own (X28).
 */
function shapeOf(parse, typed) {
  const onset = (parse.onset ?? '').normalize('NFC');
  const onsetLetterCount = [...onset].length;
  if (parse.spellingException) {
    // The pieces overlap in the spelling, so the letter stream is the spelling with the
    // tone taken off — `gì` is `g` `i`, and the rime is simply not visible in it. The
    // onset half still recomposes exactly, which is the half `resolveViLetters` treats
    // as a hard error (C4f); the rime half is the one `build.spellingException` waives.
    return { letters: [...bareOf(normaliseTyped(typed))], onsetLetterCount, spellingException: true };
  }
  return {
    letters: [...`${onset}${parse.rime}`.normalize('NFC')],
    onsetLetterCount,
    spellingException: false,
  };
}

/**
 * The diagnostic half — reached **only** when `parses` found nothing, and its job is to
 * write one sentence his mother can act on (`ui.md` §13.3, K1/K2/K7).
 *
 * This is the one place in the app that decomposes a character, and it decomposes exactly
 * one thing: the tone mark, so that `chuống` can be reported as the onset `ch` plus the
 * unknown rime `uông`. She then confirms or corrects every one of the six forms on the
 * add-a-rime screen before any of it is stored (K4).
 */
export function explain(pack, typed) {
  const word = normaliseTyped(typed);
  if (word === '') return problem('empty');
  if (word.includes(' ')) {
    return problem('twoSyllables', { syllables: word.split(' ').filter(Boolean) });
  }
  const off = offAlphabet(word);
  if (off.length > 0) return problem('notOnTheAlphabet', { characters: off });
  const bare = [...bareOf(word)];
  // Before naming a missing rime, say the thing she can act on: `nghiêng` is seven
  // letters, and adding the rime `iêng` would not make it fit the strip (X8, E20).
  if (bare.length > MAX_WORD_LETTERS) {
    return problem('tooLong', { letters: bare, limit: MAX_WORD_LETTERS });
  }

  const { base, tone } = viStripTone(word);
  // The longest onset that starts the bare form, and what is left after it.
  let best = { onset: null, glyph: '', rest: base };
  for (const onset of pack.tiles.onset) {
    if (!base.startsWith(onset.glyph)) continue;
    if (onset.glyph.length < best.glyph.length) continue;
    if (base.length === onset.glyph.length) continue; // an onset with no rime is not a word
    best = { onset: onset.id, glyph: onset.glyph, rest: base.slice(onset.glyph.length) };
  }
  if (best.onset === null && !/^[aăâeêioôơuưy]/.test(base)) {
    return problem('unknownOnset', { typed: word, tone });
  }
  if (best.rest === '') return problem('noParse', { typed: word });
  const known = pack.tiles.rime.some((r) => r.id === best.rest);
  if (known) {
    // The rime exists but this tone is not stored for it, or the pair is illegal.
    const rime = pack.tiles.rime.find((r) => r.id === best.rest);
    if (best.onset !== null) {
      const spelling = viCheckSpellingRule(best.onset, rime.id);
      if (spelling) return problem('illegalSpelling', { onset: best.onset, rime: rime.id, detail: spelling });
    }
    return problem('unknownRime', {
      onset: best.onset, rime: best.rest, tone, knownRime: true,
    });
  }
  return problem('unknownRime', { onset: best.onset, rime: best.rest, tone, knownRime: false });
}

/**
 * `ui.md` §13.3 add-a-rime / AC K3, K4, K5 — all six toned forms, generated here and
 * **stored**, with the illegal ones null per the checked-syllable rule. The screen shows
 * them, greys the nulls, and lets her correct any one of them before it is written.
 */
export function viRimeProposal(rime) {
  const id = normaliseTyped(rime);
  const legalTones = viLegalTones(id);
  return {
    id,
    legalTones,
    toned: viTonedForms(id, legalTones),
    /** Which of the six are greyed, in the child's tone order, for the six cells. */
    cells: VI_TONE_IDS.map((tone) => ({
      tone,
      legal: legalTones.includes(tone),
      form: legalTones.includes(tone) ? viApplyTone(id, tone) : null,
    })),
  };
}


/** The spans the strip draws for a Vietnamese parse: the onset, then the rime. */
export function spansOf(choice) {
  const spans = [];
  const n = choice.onsetLetterCount;
  if (n > 0) spans.push({ start: 0, end: n, kind: 'consonant', unit: choice.onset ?? '' });
  if (choice.letters.length > n) {
    spans.push({ start: n, end: choice.letters.length, kind: 'vowel', unit: choice.rime });
  }
  return spans;
}

/**
 * §13.3a / S19 — the confirm screen appears *"only when a digraph, `gi` or `qu` is
 * involved; `bò` skips it entirely"*. In Vietnamese that is a property of the **onset**
 * alone: a rime of two letters (`mèo`, `áo`) puts its boundary exactly where her own
 * spelling does, and showing her a screen for it would train her to dismiss the one
 * screen that matters.
 */
export function needsConfirm(choice) {
  return choice.onsetLetterCount > 1;
}

/** One reading, materialised into the shape the word file stores. */
export function choiceFor(parse, index, typed) {
  return { kind: 'vi', index, ...parse, ...shapeOf(parse, typed) };
}

/** The characters of `word` that are not letters of this board (K10, K14). */
export function offAlphabet(word) {
  const known = new Set(VI_ALPHABET);
  const out = [];
  for (const ch of bareOf(word)) {
    if (ch === ' ') continue;
    if (!known.has(ch) && !out.includes(ch)) out.push(ch);
  }
  return out;
}

/** The letters the word needs whatever its parse turns out to be (X8). */
export function bareLetters(word) {
  return [...bareOf(word)];
}
