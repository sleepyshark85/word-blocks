// The motion table of `ui.md` §10.3, as data.
//
// Every duration in the app comes from here, so a timing that an acceptance criterion
// names (§F, O7, O8) has exactly one place it can be wrong.
//
// **Nothing in this file imports React Native.** The state layer owns every timer and is
// tested in Node with a fake clock (`test/game-controller.test.mjs`), so the numbers it
// schedules against have to be loadable off-device
// (`development-process.md` §5). The easing curves, which are React Native objects, live
// next door in `easing.js` and are imported only by components.


export const M = {
  pressIn: 70,          // M1 — fires on touch-down, with the sound
  flight: 260,          // M3 — a child-initiated placement
  cellFill: 140,        // M4
  segmentLight: 220,    // M5 — the only "correct" signal
  bandMorph: 280,       // M6 — C3/C4's cross-fade
  bandRise: 8,          // M6 — the 8 pt rise that comes with it
  rockTotal: 520,       // M7 / O7 — a slow rock, never a fast shake
  rockAmplitude: 4,     // M7 — +-4 pt
  flyHome: 300,         // M8
  flyHomeStagger: 140,  // M8 / E8
  chantLift: 320,       // M9
  merge: 240,           // M10
  mergeFade: 180,       // M10
  toneDrop: 260,        // M11
  breatheOn: 1200,      // M15 / G3
  breatheOff: 1600,     // M15 / G3
  autoPlaceRise: 200,   // M16
  autoPlaceHold: 160,   // M16
  autoPlaceFly: 420,    // M16 / O8 — measurably slower than the 260 ms of his own tap
  albumCard: 320,       // M17
  albumStagger: 90,     // M17
  gateHold: 1200,       // M18 / I3
  roundOut: 380,        // M14
  roundIn: 320,         // M14
};

/** `ui.md` §10.4 — the reveal, frame by frame. `acceptance-criteria.md` F1–F6. */
export const REVEAL = {
  veilOut: 220,
  flash: 220,
  photoSwap: 180,
  fullBleed: 420,
  lightSprite: 520,
  confettiFrom: 300,
  confettiTo: 1200,
  speak: 600,
  motionEnds: 1400,
  sayItTogether: 2200,
  autoAdvance: 3000,
};

/** `ui.md` §2.2 — press and hold the picture frame for 800 ms for the parts hint. */
export const PARTS_HINT_HOLD = 800;

/** `ui.md` §11.2 — a placement is touch-down and touch-up within 600 ms and 24 pt. */
export const TAP = { maxMs: 600, maxSlopPt: 24 };

/** `ui.md` §11.2 — holding past 600 ms repeats the short clip every 700 ms, max 6 times. */
export const HOLD = { startMs: 600, repeatMs: 700, maxRepeats: 6 };

/** `ui.md` §11.2 — any tile touched in the previous 900 ms forces the short clip (D9). */
export const SHORT_CLIP_WINDOW = 900;

/** `gameplay.md` §6.5 — the idle ladder, and the 4 s every touch defers it by. */
export const LADDER = { step: 20000, deferMs: 4000, levels: 4 };

/** `gameplay.md` §6.7 — Finish session fades the audio over 800 ms. */
export const SESSION_FADE = 800;

/** `acceptance-criteria.md` I7 — three wrong answers disable the keypad for 30 s. */
export const GATE_COOLDOWN = 30000;
