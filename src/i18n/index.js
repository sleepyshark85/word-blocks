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

/** The chooser only. Ordered so Vietnamese leads, as `ui.md` §9.6 draws it. */
export function chooserPanels() {
  return [
    { language: 'vi', title: vi.modeTitle, subtitle: vi.languageName, sampleWord: vi.sampleWord, start: vi.start },
    { language: 'en', title: en.modeTitle, subtitle: en.languageName, sampleWord: en.sampleWord, start: en.start },
  ];
}
