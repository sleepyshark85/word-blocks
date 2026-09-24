// The English half of the editor's derivation. `literacy-en.md` §0.5, §3.3.

import { EN_ALPHABET, MAX_WORD_LETTERS, enSlotIsLegal } from '../engine/rules.mjs';
import { normaliseTyped, problem } from './shared.mjs';

/** English has no tone, so the bare form is the word. */
export function bareOf(word) {
  return word;
}

export function offAlphabet(word) {
  const known = new Set(EN_ALPHABET);
  const out = [];
  for (const ch of word) {
    if (ch === ' ') continue;
    if (!known.has(ch) && !out.includes(ch)) out.push(ch);
  }
  return out;
}

export function bareLetters(word) {
  return [...word];
}

/**
 * The sounds of an English word, from the **tiles the pack declares**. `duck` is `d` `u`
 * `ck` — three sounds — and four taps (`literacy-en.md` §0.5).
 *
 * A full search rather than a greedy one, because greedy dead-ends: it is at most six
 * letters and the branching factor is the tile inventory, so the whole tree is a few
 * hundred nodes. Among the tilings that satisfy the position rules, the one with the
 * **fewest tiles** wins — `egg` is `e`+`gg`, not `e`+`g`+`g` — which is the same
 * preference the seed pack was built with, and `test/editor-model.test.mjs` asserts it
 * reproduces all 40 `en-seed` decompositions exactly.
 */
export function parses(pack, typed) {
  const word = normaliseTyped(typed);
  if (word === '') return [];
  const byLength = [...pack.tiles.letter].sort((a, b) => b.id.length - a.id.length);
  const found = [];
  const walk = (at, chosen) => {
    if (found.length >= 64) return; // a hostile 6-letter input cannot make this unbounded
    if (at === word.length) { found.push(chosen.slice()); return; }
    for (const tile of byLength) {
      if (!word.startsWith(tile.id, at)) continue;
      chosen.push(tile);
      walk(at + tile.id.length, chosen);
      chosen.pop();
    }
  };
  walk(0, []);
  const legal = found.filter((tiles) => tiles.every(
    (tile, i) => enSlotIsLegal(tile.position, i, tiles.length),
  ));
  legal.sort((a, b) => a.length - b.length
    || b[0].id.length - a[0].id.length);
  return legal.map((tiles) => ({
    tiles: tiles.map((t) => t.id),
    // The role each sound wears on the strip, taken from the tile the pack declares
    // rather than from a vowel list of our own (`ui.md` §5.6, D5).
    units: tiles.map((t) => ({ id: t.id, isVowel: Boolean(t.isVowel) })),
    letters: [...word],
  }));
}

export function explain(pack, typed) {
  const word = normaliseTyped(typed);
  if (word === '') return problem('empty');
  if (word.includes(' ')) return problem('twoSyllables', { syllables: word.split(' ').filter(Boolean) });
  const off = offAlphabet(word);
  if (off.length > 0) return problem('notOnTheAlphabet', { characters: off });
  const bare = [...word];
  if (bare.length > MAX_WORD_LETTERS) {
    return problem('tooLong', { letters: bare, limit: MAX_WORD_LETTERS });
  }
  // Every letter is on the board and still nothing tiled: some letter has no tile, or the
  // position rules refuse every arrangement (`y` can only start, `ck` can only end).
  const noTile = [...word].filter((ch) => !pack.tiles.letter.some((t) => t.id === ch));
  if (noTile.length > 0) return problem('unknownOnset', { typed: word, characters: noTile });
  return problem('noParse', { typed: word });
}


/** The spans the strip draws: the tiles, measured in letters. */
export function spansOf(choice) {
  const spans = [];
  let at = 0;
  for (const unit of choice.units) {
    const len = [...unit.id].length;
    spans.push({
      start: at, end: at + len, kind: unit.isVowel ? 'vowel' : 'consonant', unit: unit.id,
    });
    at += len;
  }
  return spans;
}

/** Any tile longer than one letter is a digraph, and a digraph is what S19 exists for. */
export function needsConfirm(choice) {
  return choice.units.some((u) => [...u.id].length > 1);
}

/** One reading, materialised into the shape the word file stores. */
export function choiceFor(parse, index) {
  return { kind: 'en', index, ...parse };
}
