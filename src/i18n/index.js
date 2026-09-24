// The one file in the UI that names both languages, mirroring `engine/lang/index.mjs`.
//
// `acceptance-criteria.md` R3 names the first-launch chooser as the single screen on
// which both appear; it reaches both string sets through `allStrings()`. Everything else
// calls `stringsFor(language)` once, at the top of the tree, and never branches again.
// An unknown language throws — there is no default onto the other one (R4).

import vi from './vi';
import en from './en';

const STRINGS = { vi, en };

export function stringsFor(language) {
  const s = STRINGS[language];
  if (!s) throw new Error(`no strings for language ${JSON.stringify(language)}`);
  return s;
}

/**
 * The chooser, and — **new in revision 6** — the board's language control, which is a
 * *picture* of the chooser (`ui.md` §9.4a). **Vietnamese leads, in both languages, always**
 * (Y2): the order never flips, so the shape is learnable and a tester can read which
 * language a screenshot is in from which bar is filled.
 *
 * The control gets its row order from **this same function**, so "top is Vietnamese" is
 * one fact in one place rather than two that can drift apart.
 */
export function chooserPanels() {
  return [
    { language: 'vi', title: vi.modeTitle, subtitle: vi.languageName, start: vi.start },
    { language: 'en', title: en.modeTitle, subtitle: en.languageName, start: en.start },
  ];
}
