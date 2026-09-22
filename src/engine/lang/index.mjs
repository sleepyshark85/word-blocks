// The one place the two languages are named together.
//
// `gameplay.md` §0.3: a leak must be structurally hard, not merely avoided. The defence
// here is that the choice happens **once** — `langFor(language)` is called at pack load
// and the resulting module is carried on the session — and nothing below this file ever
// branches on a language again. There is no `??`, no `||` and no default onto the other
// module: an unknown language throws.
//
// `acceptance-criteria.md` R4 is about exactly this file being the only one that can
// see both.

import * as vi from './vi.mjs';
import * as en from './en.mjs';

const MODULES = { vi, en };

export function langFor(language) {
  const mod = MODULES[language];
  if (!mod) throw new Error(`no language module for ${JSON.stringify(language)}`);
  return mod;
}
