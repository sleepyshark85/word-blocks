// Settings, and only settings.
//
// `ui.md` §5.7 and `acceptance-criteria.md` A7: "Persisted in AsyncStorage — settings
// only. Content goes to the filesystem, never here." The defence is that this module
// declares the complete set of keys and their shapes, refuses to persist anything else,
// and is the only importer of AsyncStorage in the app —
// `test/settings-shape.test.mjs` audits both.

import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_THEME, THEME_IDS } from '../theme';

const KEY = 'wordblocks.settings.v1';

/** Every setting there is. Adding a row here is the only way to persist anything. */
export const SETTINGS_SCHEMA = {
  // `gameplay.md` §7.1 — chosen once, deliberately, and it restarts everything.
  language: { type: 'enum', values: ['vi', 'en'], dflt: null },
  theme: { type: 'enum', values: THEME_IDS, dflt: DEFAULT_THEME },
  // `ui.md` §2.1 — `Show the word`, default on, because she is present by design.
  showWord: { type: 'boolean', dflt: true },
  // `ui.md` §10.5 — null means "follow the OS"; true/false is the parent's override (O6).
  reduceMotion: { type: 'tristate', dflt: null },
  mute: { type: 'boolean', dflt: false },
  saySentence: { type: 'boolean', dflt: true },
  // `gameplay.md` §7.3 — playback rate 0.8x / 1.0x.
  rate: { type: 'enum', values: [0.8, 1], dflt: 1 },
};

export const DEFAULT_SETTINGS = Object.fromEntries(
  Object.entries(SETTINGS_SCHEMA).map(([k, v]) => [k, v.dflt]),
);

/**
 * Coerce whatever came back off the device into the declared shape. Storage is untrusted
 * input too: an older build, a half-written value or a hand-edited backup must land the
 * app on the defaults rather than on `undefined` three screens later.
 */
export function coerceSettings(raw) {
  const out = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [key, spec] of Object.entries(SETTINGS_SCHEMA)) {
    const value = raw[key];
    if (spec.type === 'boolean') {
      if (typeof value === 'boolean') out[key] = value;
    } else if (spec.type === 'tristate') {
      if (typeof value === 'boolean' || value === null) out[key] = value;
    } else if (spec.type === 'enum') {
      if (spec.values.includes(value)) out[key] = value;
    }
  }
  return out;
}

export async function readSettings() {
  try {
    return coerceSettings(JSON.parse(await AsyncStorage.getItem(KEY)));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function writeSettings(settings) {
  const clean = coerceSettings(settings);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(clean));
  } catch {
    // A device that cannot write a preference is still a device that can play a round.
  }
  return clean;
}
