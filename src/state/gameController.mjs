// The state layer (`development-process.md` §3, layer 2).
//
// It holds the engine's state, dispatches actions to it, and **owns every timer**. It
// contains no game rules: every question about what a tap means is answered by
// `reduce()`, and every question about what is on screen is answered by an engine
// selector. What lives here is *when* — the announcement's frame-by-frame, the chant's
// gaps, the reveal's 3 s hold, the idle ladder, the hold-to-repeat — because those are
// wall-clock concerns and the engine has no clock.
//
// It is a plain object rather than a hook so it can be driven in Node with fake timers
// (`test/game-controller.test.mjs`). `useGame.js` is a short subscription on top. That
// split is deliberate: a state layer that can only be tested through a renderer is a
// state layer that will not be tested.

import {
  createSession, reduce, tableView, stripView, shelfView, chantSteps, motifNotes,
  partsHintSteps, symbolsFrom, hintSymbol, treeOf, effectiveCells, glyphLength,
} from '../engine/index.mjs';
import { createTimerBag } from './timers.mjs';
import {
  M, REVEAL, LADDER, HOLD, TAP, SHORT_CLIP_WINDOW, PARTS_HINT_HOLD, SESSION_FADE,
} from '../motion/durations.mjs';

/** What a step costs when the pack does not say how long its clip is. */
const DEFAULT_CLIP_MS = 700;

/**
 * `ui.md` §11.1 — how long one chant step occupies, clip plus its stated gap. Pure, and
 * exported because the timings in `acceptance-criteria.md` §F are asserted against it.
 */
export function stepDurationMs(step) {
  const clip = step.audio && Number.isFinite(step.audio.ms) ? step.audio.ms : DEFAULT_CLIP_MS;
  const gap = Number.isFinite(step.gapAfterMs) ? step.gapAfterMs : 250;
  return clip + gap;
}

/**
 * `ui.md` §11.2 / `acceptance-criteria.md` D7–D9 — which of a tile's two clips a touch
 * plays. Pure, and separate, because it is two booleans and one of them is a wall-clock
 * window: the rule is worth a test of its own.
 */
export function clipVariant(firstTouchThisSession, anotherTileWithin900ms) {
  return firstTouchThisSession && !anotherTileWithin900ms ? 'long' : 'short';
}

/**
 * Split the announcement into the part that is chanted and the part that is the reveal.
 * `gameplay.md` §5.3: the whole word is spoken **over** the picture, not before it, so
 * the `word` step is the reveal's rather than the chant's last beat.
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
  } = options;

  const pack = game.pack;
  let engine = createSession(game, { seed });
  let opts = { ...settings };
  let destroyed = false;

  const listeners = new Set();
  let snapshot = null;

  /* ------------------------------------------------------------ presentation state */

  let view = {
    tableSeq: 0,
    tableRole: null,
    pressedId: null,
    /** M9/M10/M11 — which chant step is lighting which strip cell. */
    chant: null,
    /** The full-screen reward. `phase`: running | held | flying. */
    reveal: null,
    /** M8 — symbols flying home after an undo, in flight order. */
    returning: [],
    /** M17 — the idle shimmer; a counter, because it is a one-shot wave. */
    shimmerSeq: 0,
    hintLevel: 0,
    hintSymbolId: null,
    autoPlacedId: null,
    confettiSeq: 0,
    merged: false,
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
    lastTileAt: -Infinity,
    /** `acceptance-criteria.md` D7 — the long clip on the first touch **this session**. */
    touchedThisSession: new Set(),
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
      //
      // The descriptor is captured **before** the dispatch: seating it changes the table
      // (in Vietnamese it morphs to the next role entirely), so looking the symbol up
      // afterwards finds nothing and the app's turn happens in silence — which is
      // exactly the "nothing happened" failure `gameplay.md` §4.3 forbids.
      const chosen = hintSymbol(game, engine);
      const symbol = chosen === null ? null : symbolOnTable(chosen);
      dispatch({ type: 'autoPlay' });
      if (chosen !== null) {
        view.autoPlacedId = chosen;
        if (symbol) playSymbol(symbol, 'short');
        timers.set('autoPlaceClear', () => { view.autoPlacedId = null; emit(); }, M.autoPlaceFly);
      }
      // `acceptance-criteria.md` G6 — the ladder restarts at 20 s. The engine's `resetSeq`
      // bump does that through `syncToEngine`.
      return;
    }

    view.hintLevel = ladder.level;
    // 20 s: the shimmer says *these ones*, without pointing at one (G2).
    if (ladder.level === 1) view.shimmerSeq += 1;
    // 40 s / 60 s: one live tile breathes, then takes a steady gold rim (G3, G4).
    if (ladder.level >= 2) view.hintSymbolId = hintSymbol(game, engine);
    emit();
    scheduleLadder();
  }

  function resetLadder() {
    ladder.level = 0;
    ladder.dueAt = now() + LADDER.step;
    view.hintLevel = 0;
    view.hintSymbolId = null;
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
   * `ui.md` §11.3 — every letter in the app is a sound toy. A **flat** tile plays its own
   * clip in full at the same latency, then a soft muted knock: *tap on wood, not on a
   * drum* (`acceptance-criteria.md` E2). The ∅ socket has no đánh vần name, so it plays a
   * wooden *open* instead of speech (C3, N13).
   */
  function playSymbol(symbol, which) {
    if (symbol.kind === 'socket') {
      audio.playTile(ui.socket ?? null);
      return;
    }
    const ref = which === 'long' ? symbol.audio.long : symbol.audio.short;
    audio.playTile(clip(ref));
  }

  function clipForTouch(symbolId) {
    return clipVariant(!touch.touchedThisSession.has(symbolId),
      now() - touch.lastTileAt < SHORT_CLIP_WINDOW);
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

    audio.playMotif(notes === 4 ? (ui.motif4 ?? null) : (ui.motif3 ?? null));
    // `gameplay.md` §5.2 — his mother's voice over the motif, if she recorded one. If she
    // did not, the motif plays alone and nothing is missing (`acceptance-criteria.md` F6).
    if (ui.cheer) audio.playCheer(ui.cheer);

    view.hopSeq += 1;
    view.merged = false;
    view.chant = null;
    view.reveal = null;

    timers.set('merge', () => { view.merged = true; emit(); }, REVEAL.mergeAt);
    timers.set('confetti', () => { view.confettiSeq += 1; emit(); }, REVEAL.confettiAt);

    plan.timeline.forEach((entry, i) => {
      timers.set(`chant${i}`, () => {
        view.chant = { caption: entry.step.caption, stepKind: entry.step.step, cell: entry.step.cell };
        audio.playSpeech(clip(entry.step.audio));
        emit();
      }, REVEAL.chantAt + entry.at);
    });

    timers.set('revealStart', () => startReveal(plan), REVEAL.chantAt + plan.chantMs);
    emit();
  }

  function startReveal(plan) {
    const p = engine.pending;
    view.chant = null;
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
        view.merged = false;
        view.chant = null;
        emit();
        return;
      }
      // M15 — the picture flies into the shelf and the strip clears. The slot has already
      // been filled by the engine; this is the flight, which is presentation.
      // The strip is a strip again: M10's merge is a state of the announcement, not of
      // the board, and leaving it set left the three cells fused into one plate for the
      // rest of the session — seen in a browser after the first word.
      view.merged = false;
      view.chant = null;
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
   * `acceptance-criteria.md` N11 — every clip the new table can produce is decoded before
   * the morph completes. The word clips of everything still reachable from here go with
   * them, because the reveal speaks a word roughly a second after the tap that makes it
   * and a decode in that window would be audible.
   */
  function preloadForTable() {
    const sources = [];
    const push = (s) => { if (s) sources.push(s); };
    for (const cell of tableView(game, engine).cells) {
      if (cell.kind === 'socket') continue;
      push(clip(cell.audio.long));
      push(clip(cell.audio.short));
    }
    for (const key of ['motif3', 'motif4', 'cheer', 'seat', 'knock', 'unclick', 'socket', 'shelfBell', 'shelfTip']) {
      push(ui[key] ?? null);
    }
    const tree = treeOf(game, engine);
    const reachable = tree ? tree.eligible : pack.words;
    for (const word of reachable) {
      push(clip(word.audio.word));
      push(clip(word.audio.blend));
      if (opts.saySentence) push(clip(word.audio.sentence));
    }
    audio.prepare(sources);
  }

  /* ------------------------------------------------- reacting to the engine state */

  let lastStatus = null;
  let lastPhase = null;
  let lastResetSeq = engine.idle.resetSeq;
  let lastTouchSeq = engine.idle.touchSeq;
  let lastTableRole = null;
  let lastPrefixLen = engine.prefix.length;

  function syncToEngine() {
    const role = tableView(game, engine).role;
    if (role !== lastTableRole || engine.prefix.length !== lastPrefixLen) {
      // M7 — the table morphs. The sequence is what the presentation keys the cross-fade
      // on; it never decides *which* table.
      if (role !== lastTableRole) {
        lastTableRole = role;
        view.tableRole = role;
        view.tableSeq += 1;
      }
      lastPrefixLen = engine.prefix.length;
      preloadForTable();
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
    engine = next;
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
      snapshot = {
        language: game.language,
        phase: engine.phase,
        status: engine.status,
        engine,
        table,
        // **The layout is sized from the stage's table, never from the table on screen.**
        // `ui.md` §4.2: "tile size is computed once per stage and does not change as the
        // table morphs from onsets to rimes to tones, so a tile never resizes under his
        // finger" (`acceptance-criteria.md` B8). The Vietnamese tone table is 2–6 cells
        // and the onset table is 24; sizing from the visible one made every tile jump
        // between the second tap and the third.
        cells: effectiveCells(game, engine.stage),
        tableRole: view.tableRole,
        tableSeq: view.tableSeq,
        strip: stripView(game, engine),
        shelf: shelfView(engine),
        album: engine.album,
        albumPhotos: view.albumPhotos,
        stage: engine.stage,
        pending: engine.pending,
        chant: view.chant,
        merged: view.merged,
        hopSeq: view.hopSeq,
        confettiSeq: view.confettiSeq,
        reveal: view.reveal,
        returning: view.returning,
        pressedId: view.pressedId,
        autoPlacedId: view.autoPlacedId,
        shimmerSeq: view.shimmerSeq,
        hintLevel: view.hintLevel,
        hintSymbolId: view.hintLevel >= 2 ? view.hintSymbolId : null,
        // `acceptance-criteria.md` B8 — tile size is a function of the table, not of the
        // live set, so a tile never resizes under his finger.
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

      playSymbol(symbol, clipForTouch(symbolId));
      touch.touchedThisSession.add(symbolId);
      touch.lastTileAt = now();

      view.pressedId = symbolId;
      deferLadder();

      // `ui.md` §11.2 — holding past 600 ms replays the **short** clip every 700 ms, up
      // to 6 times, then stops (N5). On release nothing is placed (N6, N7).
      timers.set('hold', function repeat() {
        if (touch.ownerId !== symbolId) return;
        touch.holdRepeats += 1;
        if (touch.holdRepeats > HOLD.maxRepeats) return;
        playSymbol(symbol, 'short');
        touch.lastTileAt = now();
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
      if (wasLive) audio.playUi(ui.seat ?? null);
      // `gameplay.md` §4.3 — a flat tile talks but does not move: its clip, then a soft
      // muted knock. Never red, never a buzzer, never a shake (E2, E3).
      else if (symbol) audio.playUi(ui.knock ?? null, -9);
    },

    symbolCancel() {
      if (destroyed) return;
      timers.clear('hold');
      touch.ownerId = null;
      view.pressedId = null;
      emit();
    },

    /* ---- the word strip: tap is undo, hold is the parts hint ---------------- */

    stripDown() {
      if (destroyed) return;
      touch.stripHintFired = false;
      timers.set('stripHint', () => {
        touch.stripHintFired = true;
        // `acceptance-criteria.md` M2, M3 — the parts of what is assembled, never a
        // completion; the ladder is untouched and no assist is recorded. The engine says
        // so by returning the identical state.
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
        timers.set(`unseat${i}`, () => playSymbol(symbol, 'short'), i * M.flyHomeStagger);
      });
      timers.set('returningClear', () => {
        view.returning = [];
        emit();
      }, M.flyHome + M.flyHomeStagger * Math.max(0, leaving.length - 1));
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
        view.chant = { caption: step.caption, stepKind: step.step, cell: step.cell };
        emit();
      }, at);
      at += stepDurationMs(step);
    });
    timers.set(`${name}End`, () => { view.chant = null; emit(); }, at);
  }

  // First table: prime the audio, the ladder and the table role.
  audio.setMuted(opts.mute);
  audio.setRate(opts.rate);
  lastPhase = engine.phase;
  lastStatus = engine.status;
  lastTableRole = tableView(game, engine).role;
  view.tableRole = lastTableRole;
  preloadForTable();
  resetLadder();

  return controller;
}
