// Unicode normalisation, at the boundary, once.
//
// Vietnamese is the reason this file exists. `mèo` can be stored as one precomposed
// codepoint per letter (NFC) or as `e` + a combining grave (NFD); both render the same
// and neither `===` nor `.length` agrees about them. A word the mother types on iOS and
// a word the seed builder wrote are not guaranteed to arrive in the same form, and if
// they are compared raw the pack silently contains two different `mèo`s.
//
// The rule: normalise every string that comes out of the pack, at load, once
// (`pack.mjs`), and never compare un-normalised text anywhere else.

/** NFC, for anything; non-strings pass through so callers can normalise optional fields. */
export function nfc(value) {
  return typeof value === 'string' ? value.normalize('NFC') : value;
}

/** True when two strings are the same text once normalised. */
export function sameText(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  return a.normalize('NFC') === b.normalize('NFC');
}

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Codepoint count, not UTF-16 unit count. `ăng` is 3 characters to a reader and 3
 * codepoints in NFC; a decomposed form would measure 4 with `.length`, and tile-width
 * arithmetic that trusted `.length` would size the tile wrong.
 */
export function glyphLength(value) {
  return typeof value === 'string' ? [...value.normalize('NFC')].length : 0;
}

/**
 * **`ui.md` §8.2 / AC D17–D24 — the glyph casing, applied at render and nowhere else.**
 *
 * The owner answered `open-questions-ui.md` Q7: English glyphs are uppercase, `A B C D`.
 * It is one field per pack, read once at load (`pack.mjs`), and this is the single
 * function that acts on it — `ui.md` §8.2.2 item 3 is explicit that a `toUpperCase()` in
 * a component is a bug, in exactly the sense a colour literal in a component is one: it
 * would be right in one language and wrong in the other, and unreversible without a
 * developer.
 *
 * It reaches the **glyph** and nothing else: not the stored data (D20), not an audio key
 * (D19), not `inventoryOrder`'s order, and not one parent surface (D24). An unrecognised
 * value is lowercase, silently (D23).
 */
export function applyCasing(value, casing) {
  if (typeof value !== 'string' || casing !== 'upper') return value;
  return value.toUpperCase();
}
