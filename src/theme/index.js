// The three themes, as token sets.
//
// `decisions.md`: "Token sets, nothing hardcoded. A colour literal in a component is a
// bug — right in one theme, wrong in two." `acceptance-criteria.md` S3 audits exactly
// that, and `test/no-colour-literals.test.mjs` is the audit.
//
// `tokens.json` is the verbatim output of `node tools/theme-contrast.mjs --tokens`. It is
// generated rather than transcribed, and `test/theme-tokens.test.mjs` re-runs the tool
// and fails if the committed file has drifted — which is what makes S1/S4/S6 mean
// something here rather than only in the tool.

import React, { createContext, useContext, useMemo } from 'react';

import TOKENS from './tokens.json';

/** The order the three theme buttons are drawn in (`ui.md` §5.7). */
export const THEME_IDS = ['popsicle', 'sunshine', 'playground'];

export const DEFAULT_THEME = 'popsicle';

export function themeTokens(id) {
  return TOKENS[id] ?? TOKENS[DEFAULT_THEME];
}

const ThemeContext = createContext(themeTokens(DEFAULT_THEME));

export function ThemeProvider({ themeId, children }) {
  const value = useMemo(() => themeTokens(themeId), [themeId]);
  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * `ui.md` §5.5 — the slot→meaning mapping is identical in all three themes, and role is
 * carried by the **bar pattern** as much as by the hue (S5, S8). One place decides which
 * tokens a role reads, so a component never indexes into the token set by string
 * concatenation and never sees a hex.
 */
export function roleTokens(theme, role) {
  const n = role === 'role3' ? 3 : role === 'role2' ? 2 : 1;
  return {
    slot: `role${n}`,
    face: theme[`role${n}`],
    edge: theme[`role${n}Edge`],
    deep: theme[`role${n}Deep`],
    soft: theme[`role${n}Soft`],
    pattern: theme[`role${n}Pattern`],
  };
}
