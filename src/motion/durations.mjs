// The motion table of `ui.md` §10.3, as data — revision 5.
//
// Every duration in the app comes from here, so a timing that an acceptance criterion
// names (§F, O7, O8, O10) has exactly one place it can be wrong.
//
// **Nothing in this file imports React Native.** The state layer owns every timer and is
// tested in Node with a fake clock (`test/game-controller.test.mjs`), so the numbers it
// schedules against have to be loadable off-device (`development-process.md` §5). The
// easing curves, which are React Native objects, live next door in `easing.js` and are
// imported only by components.

export const M = {
  pressIn: 70, // M1 — fires on touch-down, with the sound
  flight: 260, // M3 — a live tile flies to the strip
  flightOvershoot: 1.06, // M3
  cellFill: 140, // M4
  disabledDip: 120, // M5 / O7 — the smallest motion in the app, on purpose
  flatClipAfter: 120, // E2 — the knock is the sound at 60 ms; the LETTER follows it
  disabledDipPt: 2, // M5 / O7
  standChange: 200, // M6 — stand up / lie down
  standStagger: 20, // M6 / O10 — by cell index, so the board reads as a wave
  standRisePt: 2, // M6
  toneSwap: 160, // M7 / O12 — a tone cell swaps its carrier. No movement, nothing else.
  pageSlide: 300, // M7a / V11 — HE changed the page
  pageSlideAuto: 420, // M7a / V11 — the APP changed it: measurably slower, so it reads
  railRise: 4, // §7.1b — the current page button sits 4 pt proud
  flyHome: 300, // M8 — undo
  flyHomeStagger: 90, // M8 / E8
  hop: 260, // M9 — the announcement hop, per symbol
  hopStagger: 90, // M9
  hopLiftPt: 14, // M9
  merge: 240, // M10 — the glyphs slide together
  mergeFade: 180, // M10 — the dividers dissolve
  // **M22 — the tie.** The span bar reveals by `scaleX` anchored LEFT, from the old
  // extent to the new one: *h joined c*. Without it a superseding sound looks like the
  // app changing its mind (`ui.md` §7.2.3, AC X12, X18).
  spanGrow: 220,
  // **M23 — the re-voice.** Both cells of the span pulse together, one scale on the span
  // container, started on the first audio frame of the replacing clip (X13).
  revoice: 260,
  // **M24 — the break.** The divider, and a new bar with the arriving cell (X15, X20).
  dividerFade: 180,
  // X33 — the dashed mark-slot above the carrier vowel, opacity only.
  markSlotFade: 180,
  chantLight: 320, // M11 — a gold face, never a gold glyph (U11)
  toneDrop: 260, // M12
  breatheOn: 1200, // M18 / G3
  breatheOff: 1600, // M18 / G3
  shimmer: 900, // M17 / G2
  autoPlaceRise: 200, // M19
  autoPlaceHold: 160, // M19
  autoPlaceFly: 420, // M19 / O8 — measurably slower than the 260 ms of his own tap
  albumCard: 320, // M16
  albumStagger: 90, // M16
  shelfFly: 520, // M15 — the picture flies into the shelf
  shelfTip: 380, // M16 — the shelf tips into the album
  gateHold: 1200, // M21 / I3
};

/** `ui.md` §10.4 — the announcement and the reveal, frame by frame. `§F`. */
export const REVEAL = {
  /** M9 begins at 0 with the motif. */
  hopAt: 0,
  mergeAt: 300,
  confettiAt: 350,
  /** The motif is 440 ms; the chant starts when it ends (`ui.md` §11.4). */
  chantAt: 440,
  /** M13 — the picture scales from the strip's rectangle to full screen. */
  fullBleed: 420,
  /** The word is spoken ~200 ms after the picture is full screen. */
  speak: 200,
  /** Motion ends; the word sits large on the picture, silent. */
  motionEnds: 1400,
  /** `ui.md` §2.3 — the say-it-together beat ends and the word is spoken again. */
  sayItTogether: 2200,
  /** `acceptance-criteria.md` F11 — 3000 ms after the last tap, it flies to the shelf. */
  autoAdvance: 3000,
  bounce: 120,
  bounceBack: 180,
};

/** `ui.md` §11.4 — the signature motif: three rising notes, 440 ms. */
export const MOTIF = {
  totalMs: 440,
  noteMs: 180,
  onsets: [0, 130, 260],
  /** A fourth note an octave above the root, when the word is new to him (F4). */
  fourthAt: 390,
};

/** `ui.md` §2.2 — press and hold the **word strip** for 800 ms for the parts hint. */
export const PARTS_HINT_HOLD = 800;

/** `ui.md` §11.2 — a placement is touch-down and touch-up within 600 ms and 24 pt. */
export const TAP = { maxMs: 600, maxSlopPt: 24 };

/** `ui.md` §11.2 — holding past 600 ms repeats the short clip every 700 ms, max 6 times. */
export const HOLD = { startMs: 600, repeatMs: 700, maxRepeats: 6 };

/**
 * `acceptance-criteria.md` A13 / `gameplay.md` §7.2 — after a correct gate answer the
 * gate does not re-ask for 180 s, so a parent switching language twice in one sitting
 * answers one multiplication rather than two. It ends the moment play resumes (A14).
 */
export const GATE_GRACE = 180000;

/**
 * `gameplay.md` §6.4 — the idle ladder. 20 s shimmer, 40 s breathe, 60 s rim, 80 s the
 * app takes a turn; **any touch anywhere defers the next escalation by 4 s** (G9).
 */
export const LADDER = { step: 20000, deferMs: 4000, levels: 4 };

/** `gameplay.md` §6.3 — Finish session fades the audio over 800 ms. */
export const SESSION_FADE = 800;

/** `acceptance-criteria.md` I7 — three wrong answers disable the keypad for 30 s. */
export const GATE_COOLDOWN = 30000;
