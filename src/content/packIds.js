// The one place a language is turned into a pack directory.
//
// `acceptance-criteria.md` R4: no code path reads the other language's pack, and there is
// no fallback, default or coalescing operator onto it. The defence is the same shape the
// engine uses in `lang/index.mjs` — a lookup that **throws** on an unknown language
// rather than one that defaults, so a typo is a crash in development and never a leak in
// front of the child.

const SEED_PACK_ID = { vi: 'vi-seed', en: 'en-seed' };

export function seedPackIdFor(language) {
  const id = SEED_PACK_ID[language];
  if (!id) throw new Error(`no pack for language ${JSON.stringify(language)}`);
  return id;
}
