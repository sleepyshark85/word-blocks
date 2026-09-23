// The state layer (`development-process.md` §3, layer 2).
//
// It holds the engine's state, dispatches actions to it, and **owns every timer**. It
// contains no game rules: every question about what a tap means is answered by
// `reduce()`, and every question about what is on screen is answered by an engine
// selector. What lives here is *when* — the announcement's frame-by-frame, the chant's
// gaps, the reveal's 3 s hold, the idle ladder, the hold-to-repeat, the page slide —
// because those are wall-clock concerns and the engine has no clock.
//
// It is a plain object rather than a hook so it can be driven in Node with fake timers
// (`test/game-controller.test.mjs`). `useGame.js` is a short subscription on top. That
// split is deliberate: a state layer that can only be tested through a renderer is a
// state layer that will not be tested.
//
// **Revision 4 changes three things here**, all of them audio or paging:
//
//   1. **One speech channel, cutting hard** (`ui.md` §11.2). A tap always plays `short`;
//      `long` is the parts hint's alone; the motif **stops** speech rather than ducking
//      it; a flat tile's knock **precedes** its letter by 120 ms.
//   2. **The chant accumulates** (§10.4): every beat carries the strip as it must look at
//      that beat, so the presentation replays a resolved state rather than deriving one.
//   3. **The page** (§V): the page sound on every change, the slide's two durations, and
//      the idle ladder reaching the rail.

import {
  createSession, reduce, tableView, pageView, stripView, shelfView, chantSteps, motifNotes,
  partsHintSteps, symbolsFrom, hintSymbol, glyphLength, progressOf,
} from '../engine/index.mjs';
import { createTimerBag } from './timers.mjs';
import {
  M, REVEAL, LADDER, HOLD, TAP, PARTS_HINT_HOLD, SESSION_FADE,
} from '../motion/durations.mjs';

/** What a step costs when the pack does not say how long its clip is. */
const DEFAULT_CLIP_MS = 700;

/**
 * `ui.md` §11.1 / §10.4 — how long one chant beat occupies: **the clip, then its gap**.
 * "Every beat boundary is driven by the clip's completion, not by a timer." A beat with
 * no clip at all (a pack with no blend recording) costs only its gap, rather than a
 * second of silence pretending to be a sound.
 */
export function stepDurationMs(step) {
  const clip = step.audio && Number.isFinite(step.audio.ms) ? step.audio.ms
    : (step.audio ? DEFAULT_CLIP_MS : 0);
  const gap = Number.isFinite(step.gapAfterMs) ? step.gapAfterMs : 250;
  return clip + gap;
}

/**
 * Split the announcement into the part that is chanted and the part that is the reveal.
 * `gameplay.md` §5.3 and `ui.md` §10.4: the chant's beats 1–4 run on the board, then the
 * picture arrives, and **the word is spoken ~200 ms after the picture is full screen**
 * (AC F8). So the fifth beat's *clip* belongs to the reveal; its *visual* — the whole
 * word, merged and gold — is the state the strip is already in when the picture lifts
 * off it. The alternative, speaking the word twice 400 ms apart, is the thing §11.0 was
 * written to stop.
 */
export function planAnnouncement(steps) {
  const wordAt = steps.findIndex((s) => s.step === 'word');
  const parts = wordAt < 0 ? steps : steps.slice(0, wordAt);
  const word = wordAt < 0 ? null : steps[wordAt];
  const sentence = steps.find((s) => s.step === 'sentence') ?? null;
  let at = 0;
  const timeline = parts.map((step) => {
    const entry = { step, at };
    at += stepDurationMs(step);
    return entry;
  });
  return { timeline, chantMs: at, word, sentence };
}

export function createGameController(options) {
  const {
    game,
    seed = 'ghep-chu',
    mediaSource,
    ui = {},
    audio,
    settings,
    timers = createTimerBag(),
    now = () => Date.now(),
    onSessionEnd = null,
    /** A18 — this pack's album and encounter counts, from the last time it was played. */
    progress = null,
    onProgress = null,
  } = options;

  const pack = game.pack;
  let engine = createSession(game, { seed, progress });
  let opts = { ...settings };
  let destroyed = false;

  const listeners = new Set();
  let snapshot = null;

  /* ------------------------------------------------------------ presentation state */

  let view = {
    pressedId: null,
    /** M11 — the chant's current beat: what the strip shows and what is lit. */
    chant: null,
    /** M10 at 300 ms — the announcement's merge preview, before the chant rebuilds it. */
    merged: false,
    /** The full-screen reward. `phase`: running | held | flying. */
    reveal: null,
    /** M8 — symbols flying home after an undo, in flight order. */
    returning: [],
    /** M17 — the idle shimmer; a counter, because it is a one-shot wave. */
    shimmerSeq: 0,
    hintLevel: 0,
    hintSymbolId: null,
    /** V26 — when the breathing thing is a page BUTTON rather than a tile. */
    hintPage: null,
    autoPlacedId: null,
    confettiSeq: 0,
    hopSeq: 0,
    /** H10 — which photograph each album card is currently showing. */
    albumPhotos: {},
  };

  const touch = {
    ownerId: null,
    startedAt: 0,
    x: 0,
    y: 0,
    holdRepeats: 0,
    flatSeq: 0,
    stripHintFired: false,
  };

  const ladder = { level: 0, dueAt: Infinity };

  /* ------------------------------------------------------------------- plumbing */

  function clip(ref) {
    return ref ? mediaSource(ref.src ?? ref) : null;
  }

  function emit() {
    snapshot = null;
    for (const fn of listeners) fn();
  }

  function wordOf(id) {
    return pack.words.find((w) => w.id === id) ?? null;
  }

  /* -------------------------------------------------------------- the idle ladder */

  function scheduleLadder() {
    timers.clear('ladder');
    if (destroyed || engine.phase !== 'playing' || engine.status !== 'building') return;
    if (ladder.level >= LADDER.levels) return;
    timers.set('ladder', fireLadder, Math.max(0, ladder.dueAt - now()));
  }

  function fireLadder() {
    if (destroyed || engine.phase !== 'playing' || engine.status !== 'building') return;
    ladder.level += 1;
    ladder.dueAt = now() + LADDER.step;

    if (ladder.level === 4) {
      // 80 s: the app takes a turn (G5). The engine decides *which* symbol, and it is the
      // same one that has been breathing since 40 s (G11).
      const chosen = hintSymbol(game, engine);
      if (chosen === null) return;
      const page = game.inventory.pageOf(chosen);
      // V27 — if the tile it wants is on another page, the app **changes page first**,
      // then plays it. The slide is the app's, so it is the app's 420 ms.
      if (page >= 0 && page !== engine.page) {
        dispatch({ type: 'tapPage', index: page, by: 'auto' });
        timers.set('autoPlayAfterSlide', () => autoPlay(chosen), M.pageSlideAuto);
        return;
      }
      autoPlay(chosen);
      return;
    }

    view.hintLevel = ladder.level;
    // 20 s: the shimmer says *these ones*, without pointing at one (G2). On a paged board
    // it also pulses the standing button of every page he is not on (V26).
    if (ladder.level === 1) view.shimmerSeq += 1;
    // 40 s / 60 s: one live tile breathes, then takes a steady gold rim (G3, G4). If the
    // live set is entirely on another page, the breathing element is that page's BUTTON
    // rather than a tile he cannot see (V26).
    if (ladder.level >= 2) {
      const chosen = hintSymbol(game, engine);
      view.hintSymbolId = chosen;
      const page = chosen === null ? -1 : game.inventory.pageOf(chosen);
      view.hintPage = page >= 0 && page !== engine.page ? page : null;
    }
    emit();
    scheduleLadder();
  }

  function autoPlay(chosen) {
    if (destroyed || engine.phase !== 'playing' || engine.status !== 'building') return;
    // The descriptor is captured **before** the dispatch: seating it changes the live
    // set, and looking the symbol up afterwards to play its clip is how the app's turn
    // once happened in silence.
    const symbol = symbolOnTable(chosen);
    dispatch({ type: 'autoPlay' });
    view.autoPlacedId = chosen;
    if (symbol) playSymbol(symbol);
    timers.set('autoPlaceClear', () => { view.autoPlacedId = null; emit(); }, M.autoPlaceFly);
    // `acceptance-criteria.md` G6 — the ladder restarts at 20 s. The engine's `resetSeq`
    // bump does that through `syncToEngine`.
  }

  function resetLadder() {
    ladder.level = 0;
    ladder.dueAt = now() + LADDER.step;
    view.hintLevel = 0;
    view.hintSymbolId = null;
    view.hintPage = null;
    scheduleLadder();
  }

  /**
   * `acceptance-criteria.md` G9 — any touch anywhere defers the next escalation by 4 s,
   * so nothing ever flies out from under his finger. It is a deferral, not a reset: a
   * child mashing flat tiles is exactly the child who needs help (G8).
   */
  function deferLadder() {
    const earliest = now() + LADDER.deferMs;
    if (ladder.dueAt < earliest) {
      ladder.dueAt = earliest;
      scheduleLadder();
    }
  }

  /* ---------------------------------------------------------------- the symbols */

  function symbolOnTable(symbolId) {
    return tableView(game, engine).cells.find((c) => c.id === symbolId) ?? null;
  }

  /**
   * `ui.md` §11.2, §11.3 / AC D7, N14 — **a tap always plays `short`.** No first-touch
   * special case, no 900 ms window, and the `long` anchored clip is never fired by a tile
   * tap: "kuh, cat" is 3 seconds of two utterances, and a 4-year-old taps every 300–600
   * ms, so it was always cut mid-word. That is what "voices mixed up with each other"
   * was, and the fix is this line.
   */
  function playSymbol(symbol) {
    audio.playSpeech(clip(symbol.audio.short));
  }

  /* ------------------------------------------------------- the announcement */

  /**
   * `ui.md` §10.4 — the frame-by-frame. The motif fires at t = 0, on his tap; the chant
   * is the lesson that follows it. Revision 1 had this backwards and the payoff arrived
   * at the end of a five-step ritual.
   */
  function runAnnouncement() {
    const plan = planAnnouncement(chantSteps(game, engine));
    const notes = motifNotes(engine);

    // F19 (RESTATED) — **speech is stopped, not ducked.** `playMotif` cuts the speech
    // channel before it starts; ducking was the specification that guaranteed two voices
    // at the loudest moment in the app (`ui.md` §11.0 item 2).
    audio.playMotif(notes === 4 ? (ui.motif4 ?? null) : (ui.motif3 ?? null));
    // `gameplay.md` §5.2 — his mother's voice over the motif, if she recorded one. If she
    // did not, the motif plays alone and nothing is missing (`acceptance-criteria.md` F6).
    if (ui.cheer) audio.playCheer(ui.cheer);

    view.hopSeq += 1;
    view.chant = null;
    view.merged = false;
    view.reveal = null;

    // F3 / M10 — at 300 ms the hairlines dissolve and the symbols slide into one word:
    // *these are one word*, before the chant takes it apart again to teach it.
    timers.set('merge', () => { view.merged = true; emit(); }, REVEAL.mergeAt);
    timers.set('confetti', () => { view.confettiSeq += 1; emit(); }, REVEAL.confettiAt);

    plan.timeline.forEach((entry, i) => {
      timers.set(`chant${i}`, () => {
        // **The beat carries what the strip must show** (C12a): the engine resolved it,
        // and the presentation replays it. A dropped frame cannot leave the strip
        // showing a word that is not the word.
        view.chant = {
          stepKind: entry.step.step,
          caption: entry.step.caption,
          cells: entry.step.cells,
          lit: entry.step.lit,
          merged: entry.step.merged,
        };
        audio.playSpeech(clip(entry.step.audio));
        emit();
      }, REVEAL.chantAt + entry.at);
    });

    timers.set('revealStart', () => startReveal(plan), REVEAL.chantAt + plan.chantMs);
    emit();
  }

  function startReveal(plan) {
    const p = engine.pending;
    view.chant = plan.word
      ? {
        stepKind: 'word',
        caption: plan.word.caption,
        cells: plan.word.cells,
        lit: plan.word.lit,
        merged: true,
      }
      : null;
    view.reveal = {
      phase: 'running',
      image: p ? p.image : null,
      fallbackEmoji: p ? p.fallbackEmoji : null,
      imageIndex: p ? p.imageIndex : 0,
      text: p ? p.text : null,
      sentence: null,
      bounceSeq: 0,
    };

    timers.set('revealSpeak', () => {
      if (plan.word) audio.playSpeech(clip(plan.word.audio));
      emit();
    }, REVEAL.fullBleed + REVEAL.speak);

    timers.set('revealSettle', () => {
      view.reveal = { ...view.reveal, phase: 'held' };
      emit();
    }, REVEAL.motionEnds);

    // `ui.md` §2.3 — silence from 1400 ms to 2200 ms, then the word once more, so the
    // last thing heard is correct and she has a beat to say it with him.
    timers.set('revealRepeat', () => {
      if (plan.word) audio.playSpeech(clip(plan.word.audio));
      if (plan.sentence && opts.saySentence) {
        const after = (plan.word && plan.word.audio && Number.isFinite(plan.word.audio.ms)
          ? plan.word.audio.ms : DEFAULT_CLIP_MS) + 200;
        timers.set('revealSentence', () => {
          audio.playSpeech(clip(plan.sentence.audio));
          view.reveal = { ...view.reveal, sentence: plan.sentence.caption };
          emit();
        }, after);
      }
    }, REVEAL.sayItTogether);

    armAutoAdvance();
    emit();
  }

  /** `acceptance-criteria.md` F11, T13 — 3000 ms, restarted by every tap on the picture. */
  function armAutoAdvance() {
    timers.set('advance', () => {
      const wasNew = engine.pending ? engine.pending.isNew : false;
      dispatch({ type: 'advance' });
      if (engine.phase === 'album') {
        view.reveal = null;
        view.chant = null;
        view.merged = false;
        emit();
        return;
      }
      // M15 — the picture flies into the shelf and the strip clears. The slot has already
      // been filled by the engine; this is the flight, which is presentation. The merge is
      // a state of the announcement, not of the board: leaving it set left the cells fused
      // into one plate for the rest of the session, which was seen in a browser in Slice 3.
      view.chant = null;
      view.merged = false;
      if (wasNew) {
        audio.playUi(ui.shelfBell ?? null);
        view.reveal = { ...view.reveal, phase: 'flying' };
        timers.set('revealOut', () => { view.reveal = null; emit(); }, M.shelfFly);
      } else {
        view.reveal = null;
      }
      emit();
    }, REVEAL.autoAdvance);
  }

  /**
   * `acceptance-criteria.md` N11 (RESTATED) — **every clip the constant table can produce
   * is decoded and resident before the first tap is possible.** The table never changes,
   * so this is a one-time cost at pack load rather than a per-tap concern: at most 67
   * symbols × 2 variants. The word clips go with them, because the reveal speaks a word
   * about a second after the tap that makes it and a decode in that window is audible.
   */
  function preloadForTable() {
    const sources = [];
    const push = (s) => { if (s) sources.push(s); };
    for (const cell of tableView(game, engine).cells) {
      push(clip(cell.audio.long));
      push(clip(cell.audio.short));
    }
    for (const key of ['motif3', 'motif4', 'cheer', 'seat', 'knock', 'unclick', 'page', 'shelfBell', 'shelfTip']) {
      push(ui[key] ?? null);
    }
    for (const word of game.tree.eligible) {
      push(clip(word.audio.word));
      push(clip(word.audio.blend));
      if (opts.saySentence) push(clip(word.audio.sentence));
    }
    audio.prepare(sources);
  }

  /* ------------------------------------------------- reacting to the engine state */

  let lastStatus = engine.status;
  let lastPhase = engine.phase;
  let lastResetSeq = engine.idle.resetSeq;
  let lastTouchSeq = engine.idle.touchSeq;
  let lastPageSeq = engine.pageSeq;

  function syncToEngine() {
    // V24 — **a page change sounds**, whoever caused it, on the UI channel, and it does
    // not cut speech. It is the same sound both ways: the duration of the motion is what
    // distinguishes them visually, and a second sound would be one more thing to learn.
    if (engine.pageSeq !== lastPageSeq) {
      lastPageSeq = engine.pageSeq;
      audio.playUi(ui.page ?? null, -6);
    }

    if (engine.idle.resetSeq !== lastResetSeq) {
      lastResetSeq = engine.idle.resetSeq;
      lastTouchSeq = engine.idle.touchSeq;
      resetLadder();
    } else if (engine.idle.touchSeq !== lastTouchSeq) {
      lastTouchSeq = engine.idle.touchSeq;
      deferLadder();
    }

    if (engine.status !== lastStatus) {
      lastStatus = engine.status;
      if (engine.status === 'announcing') { timers.clear('ladder'); runAnnouncement(); }
      else scheduleLadder();
    }

    if (engine.phase !== lastPhase) {
      lastPhase = engine.phase;
      if (engine.phase !== 'playing') {
        timers.clear('ladder');
        view.chant = null;
        view.merged = false;
      }
      if (engine.phase === 'album') audio.playUi(ui.shelfTip ?? null);
    }
  }

  function dispatch(action) {
    if (destroyed) return;
    const next = reduce(game, engine, action);
    if (next === engine) { emit(); return; }
    const wasAlbum = engine.album;
    engine = next;
    // A18 — the album and the encounter counts go up to the shell, which holds them per
    // pack across a language switch. Only when they change, so a tap does not write.
    if (onProgress && (engine.album !== wasAlbum || action.type === 'advance')) {
      onProgress(progressOf(engine));
    }
    syncToEngine();
    emit();
  }

  /* -------------------------------------------------------------- the public API */

  const controller = {
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    getSnapshot() {
      if (snapshot) return snapshot;
      const table = tableView(game, engine);
      const rail = pageView(game, engine);
      snapshot = {
        language: game.language,
        phase: engine.phase,
        status: engine.status,
        engine,
        table,
        rail,
        /** V9 — one grid for every page, sized from the largest page, once. */
        cells: game.cells,
        page: engine.page,
        pageBy: engine.pageBy,
        pageSeq: engine.pageSeq,
        /** V11 — his page change is 300 ms; the app's is 420 ms. */
        pageSlideMs: engine.pageBy === 'auto' ? M.pageSlideAuto : M.pageSlide,
        // During the chant the strip is the beat's, because the chant re-shows earlier
        // states of a word that is already complete (C12a).
        strip: view.chant && view.chant.cells ? view.chant.cells : stripView(game, engine),
        chant: view.chant,
        merged: view.chant ? Boolean(view.chant.merged) : view.merged,
        shelf: shelfView(engine),
        album: engine.album,
        albumPhotos: view.albumPhotos,
        pending: engine.pending,
        hopSeq: view.hopSeq,
        confettiSeq: view.confettiSeq,
        reveal: view.reveal,
        returning: view.returning,
        pressedId: view.pressedId,
        autoPlacedId: view.autoPlacedId,
        shimmerSeq: view.shimmerSeq,
        hintLevel: view.hintLevel,
        hintSymbolId: view.hintLevel >= 2 ? view.hintSymbolId : null,
        hintPage: view.hintLevel >= 2 ? view.hintPage : null,
        // B8 — the tile size is a function of the table, not of the live set, so a tile
        // never resizes under his finger.
        maxGlyphLen: table.cells.reduce((n, c) => Math.max(n, glyphLength(c.glyph ?? '')), 1),
      };
      return snapshot;
    },

    /* ---- touch, the part that is all timing --------------------------------- */

    /**
     * `ui.md` §11.1 — the sound fires on touch-**down**, not touch-up, and nothing waits
     * on an animation. `acceptance-criteria.md` T5: the first touch owns the gesture and
     * further simultaneous touches are ignored until it ends.
     */
    symbolDown(symbolId, x = 0, y = 0) {
      if (destroyed || engine.phase !== 'playing' || engine.status !== 'building') return;
      if (touch.ownerId !== null) return;
      const symbol = symbolOnTable(symbolId);
      if (!symbol) return;

      touch.ownerId = symbolId;
      touch.startedAt = now();
      touch.x = x;
      touch.y = y;
      touch.holdRepeats = 0;

      if (symbol.live) {
        playSymbol(symbol);
      } else {
        // **E2 — the knock PRECEDES its letter.** A 40 ms muted knock at −9 dB within
        // 60 ms, then the tile's own `short` clip in full at +120 ms, and the two do not
        // overlap. Knock-then-letter is a clearer signature of "this one is lying down"
        // than knock-over-letter was, and it removes the last simultaneous pairing in
        // the app (`ui.md` §11.0 item 3).
        audio.playUi(ui.knock ?? null, -9);
        touch.flatSeq += 1;
        // A per-tap name, so twenty taps play twenty clips (E13) instead of each one
        // cancelling the last. Two taps closer together than 120 ms still cut, because
        // the cut rule is the cut rule.
        timers.set(`flat${touch.flatSeq}`, () => playSymbol(symbol), M.flatClipAfter);
      }

      view.pressedId = symbolId;
      deferLadder();

      // `ui.md` §11.2 — holding past 600 ms replays the **short** clip every 700 ms, up
      // to 6 times, then stops (N5). On release nothing is placed (N6, N7).
      timers.set('hold', function repeat() {
        if (touch.ownerId !== symbolId) return;
        touch.holdRepeats += 1;
        if (touch.holdRepeats > HOLD.maxRepeats) return;
        playSymbol(symbol);
        timers.set('hold', repeat, HOLD.repeatMs);
      }, HOLD.startMs);

      emit();
    },

    symbolUp(symbolId, x = 0, y = 0) {
      if (destroyed || touch.ownerId !== symbolId) return;
      timers.clear('hold');
      const elapsed = now() - touch.startedAt;
      const moved = Math.hypot(x - touch.x, y - touch.y);
      touch.ownerId = null;
      view.pressedId = null;
      // `ui.md` §11.2 — a placement is touch-down and touch-up within 600 ms and within
      // 24 pt. A hold is not a tap, and a drag across the table seats nothing (T6).
      if (elapsed > TAP.maxMs || moved > TAP.maxSlopPt) { emit(); return; }

      const symbol = symbolOnTable(symbolId);
      const wasLive = Boolean(symbol && symbol.live);
      dispatch({ type: 'tapSymbol', symbolId });
      // The seat click is on the UI channel, over the clip's tail, and it never cuts it
      // (N3b). A flat tap has already had its knock, on touch-down.
      if (wasLive) audio.playUi(ui.seat ?? null);
    },

    symbolCancel() {
      if (destroyed) return;
      timers.clear('hold');
      touch.ownerId = null;
      view.pressedId = null;
      emit();
    },

    /* ---- the page rail ------------------------------------------------------ */

    /**
     * `ui.md` §7.1b / AC V19 — pressing a page button plays **the page sound only, never
     * speech**: the glyph on a button is a label, not a character he is choosing, and
     * speaking it would teach that pressing a character and pressing a page are the same
     * act. V15: he may land on a page with nothing live and stay there.
     */
    tapPage(index) {
      if (destroyed) return;
      // V31 — a touch in flight does not survive a page change: nothing on the new page
      // is seated by the same finger.
      touch.ownerId = null;
      view.pressedId = null;
      timers.clear('hold');
      dispatch({ type: 'tapPage', index });
    },

    /* ---- the word strip: tap is undo, hold is the parts hint ---------------- */

    stripDown() {
      if (destroyed) return;
      touch.stripHintFired = false;
      timers.set('stripHint', () => {
        touch.stripHintFired = true;
        // `acceptance-criteria.md` M2, M3, D9 — the parts of what is assembled, in
        // English the **`long` anchored clips**, which is the only place in the app they
        // are ever heard. The ladder is untouched and no assist is recorded; the engine
        // says so by returning the identical state.
        dispatch({ type: 'partsHint' });
        playSteps(partsHintSteps(game, engine), 'parts');
      }, PARTS_HINT_HOLD);
    },

    stripUp(index) {
      if (destroyed) return;
      timers.clear('stripHint');
      if (touch.stripHintFired) return;
      if (engine.phase !== 'playing' || engine.status !== 'building') return;
      if (!Number.isInteger(index) || index >= engine.prefix.length) {
        dispatch({ type: 'tapStripCell', index });
        return;
      }
      // `gameplay.md` §4.4 — the removed symbols fly home one at a time, 90 ms apart,
      // each playing its own clip, under one descending two-note unclick. It is the only
      // descending motif in the app, so it can never be confused with the announcement.
      const leaving = symbolsFrom(game, engine, index);
      view.returning = leaving.map((s) => s.id);
      audio.playUi(ui.unclick ?? null);
      leaving.forEach((symbol, i) => {
        timers.set(`unseat${i}`, () => playSymbol(symbol), i * M.flyHomeStagger);
      });
      timers.set('returningClear', () => {
        view.returning = [];
        emit();
      }, M.flyHome + M.flyHomeStagger * Math.max(0, leaving.length - 1));
      // V23 — the board slides to that symbol's page as it returns it, so undo is also
      // the way back to where a character lives. The engine decides the page.
      dispatch({ type: 'tapStripCell', index });
    },

    /** `acceptance-criteria.md` F10, T13 — each tap replays the word and advances the photo. */
    tapReveal() {
      if (destroyed || !view.reveal || view.reveal.phase === 'flying') return;
      const p = engine.pending;
      const word = p ? wordOf(p.wordId) : null;
      if (word) audio.playSpeech(clip(word.audio.word));
      if (word && word.images.length > 0) {
        const next = (view.reveal.imageIndex + 1) % word.images.length;
        view.reveal = { ...view.reveal, imageIndex: next, image: word.images[next] };
      }
      view.reveal = { ...view.reveal, bounceSeq: view.reveal.bounceSeq + 1 };
      armAutoAdvance();
      emit();
    },

    /** `acceptance-criteria.md` H13 — a filled shelf slot replays its word. No picture. */
    tapShelf(entry) {
      if (destroyed || !entry) return;
      const word = wordOf(entry.wordId);
      if (word) audio.playSpeech(clip(word.audio.word));
    },

    /** `acceptance-criteria.md` H10 — an album card replays its word and turns the photo. */
    tapAlbum(entry) {
      if (destroyed || !entry) return;
      const word = wordOf(entry.wordId);
      if (!word) return;
      audio.playSpeech(clip(word.audio.word));
      if (word.images.length > 1) {
        const shown = view.albumPhotos[entry.wordId] ?? entry.image;
        const at = word.images.findIndex((im) => im.src === (shown && shown.src));
        const next = word.images[(Math.max(0, at) + 1) % word.images.length];
        view.albumPhotos = { ...view.albumPhotos, [entry.wordId]: next };
      }
      emit();
    },

    leaveAlbum() {
      dispatch({ type: 'leaveAlbum' });
    },

    /** `gameplay.md` §6.3 — audio fades over 800 ms, the board is abandoned, end screen. */
    finishSession() {
      if (destroyed) return;
      timers.clearAll();
      audio.fadeOut(SESSION_FADE, () => { if (onSessionEnd) onSessionEnd(); });
      dispatch({ type: 'finishSession' });
    },

    /**
     * `gameplay.md` §7.1 / AC A15, A17, R6 — **a language switch is a teardown, not a
     * fade.** Every channel stops **hard**, synchronously, and every timer is cleared, so
     * no clip of the outgoing language can be heard over the incoming board. The 800 ms
     * fade *Finish session* uses would play exactly that.
     */
    stopForLanguageSwitch() {
      if (destroyed) return;
      timers.clearAll();
      audio.cancelFade();
      audio.stopAll();
      view.chant = null;
      view.reveal = null;
      view.returning = [];
      emit();
    },

    /* ---- settings, and the lifecycle ---------------------------------------- */

    updateSettings(next) {
      opts = { ...opts, ...next };
      audio.setMuted(opts.mute);
      audio.setRate(opts.rate);
      emit();
    },

    /**
     * `acceptance-criteria.md` T8 — backgrounded mid-chant: audio stops, the chant does
     * not resume mid-word, and the board is either pre-chant or fully revealed, never
     * half-merged.
     */
    onBackground() {
      if (destroyed) return;
      audio.stopAll();
      timers.clearAll();
      if (engine.status === 'announcing') {
        view.chant = null;
        view.merged = true;
        const p = engine.pending;
        view.reveal = {
          phase: 'held',
          image: p ? p.image : null,
          fallbackEmoji: p ? p.fallbackEmoji : null,
          imageIndex: p ? p.imageIndex : 0,
          text: p ? p.text : null,
          sentence: null,
          bounceSeq: 0,
        };
        emit();
      }
    },

    onForeground() {
      if (destroyed) return;
      if (view.reveal && view.reveal.phase === 'held') armAutoAdvance();
      else if (engine.status === 'building') scheduleLadder();
    },

    /** Everything this object ever allocated, released. Called on unmount (A10, R6). */
    destroy() {
      destroyed = true;
      timers.clearAll();
      audio.stopAll();
      audio.dispose();
      listeners.clear();
    },

    /* ---- for tests --------------------------------------------------------- */
    _timers: timers,
    _engine: () => engine,
    _ladder: () => ({ ...ladder }),
  };

  function playSteps(steps, name) {
    let at = 0;
    steps.forEach((step, i) => {
      timers.set(`${name}${i}`, () => {
        audio.playSpeech(clip(step.audio));
        view.chant = {
          stepKind: step.step, caption: step.caption, cells: step.cells, lit: step.lit, merged: false,
        };
        emit();
      }, at);
      at += stepDurationMs(step);
    });
    timers.set(`${name}End`, () => { view.chant = null; emit(); }, at);
  }

  // Prime the audio and the ladder. The table is constant, so this is the only preload.
  audio.setMuted(opts.mute);
  audio.setRate(opts.rate);
  preloadForTable();
  resetLadder();

  return controller;
}
