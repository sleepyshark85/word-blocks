// The state layer (`development-process.md` §3, layer 2).
//
// It holds the engine's state, dispatches actions to it, and **owns every timer**. It
// contains no game rules: every question about what a tap means is answered by
// `reduce()`, and every question about what is on screen is answered by an engine
// selector. What lives here is *when* — the chant's gaps, the reveal's 3 s hold, the idle
// ladder, the hold-to-repeat — because those are wall-clock concerns and the engine has
// no clock.
//
// It is a plain object rather than a hook so it can be driven in Node with fake timers
// (`test/game-controller.test.mjs`). `useGame.js` is a fifteen-line subscription on top.
// That split is deliberate: a state layer that can only be tested through a renderer is a
// state layer that will not be tested.

import {
  createSession, reduce, bandInstances, pageRail, resolutionSteps, partsHintSteps,
  litCells, veilOpacity, hintInstance, langFor, glyphLength,
} from '../engine/index.mjs';
import { createTimerBag } from './timers.mjs';
import {
  M, REVEAL, LADDER, HOLD, TAP, SHORT_CLIP_WINDOW, PARTS_HINT_HOLD, SESSION_FADE,
} from '../motion/durations.mjs';

/** What a step costs when the pack does not say how long its clip is. */
const DEFAULT_CLIP_MS = 700;
/** The gap between parts in the not-a-word read-back (`gameplay.md` §4.4 C). */
const READBACK_GAP_MS = 250;

/**
 * `ui.md` §11.1 — how long one chant step occupies, clip plus its stated gap. Pure, and
 * exported because the timings in `acceptance-criteria.md` §F are asserted against it.
 */
export function stepDurationMs(step) {
  const clip = step.audio && Number.isFinite(step.audio.ms) ? step.audio.ms : DEFAULT_CLIP_MS;
  const gap = Number.isFinite(step.gapAfterMs) ? step.gapAfterMs : READBACK_GAP_MS;
  return clip + gap;
}

/**
 * `ui.md` §11.2 / `acceptance-criteria.md` D7–D9 — which of a tile's two clips a touch
 * plays. Pure, and separate, because it is three booleans and one of them is a
 * wall-clock window: the rule is worth a test of its own.
 */
export function clipVariant(firstTouchThisRound, anotherTileWithin900ms) {
  return firstTouchThisRound && !anotherTileWithin900ms ? 'long' : 'short';
}

/**
 * Split the resolution into the part that is chanted and the part that is the reveal.
 * `gameplay.md` §5.1 step 5 *is* the reveal: the whole word is spoken over the top of it,
 * not before it.
 */
export function planResolution(steps) {
  const wordAt = steps.findIndex((s) => s.step === 'word');
  const chant = wordAt < 0 ? steps : steps.slice(0, wordAt);
  const word = wordAt < 0 ? null : steps[wordAt];
  const sentence = steps.find((s) => s.step === 'sentence') ?? null;
  let at = 0;
  const timeline = chant.map((step) => {
    const entry = { step, at };
    at += stepDurationMs(step);
    return entry;
  });
  return { timeline, totalMs: at, word, sentence };
}

export function createGameController(options) {
  const {
    pack,
    seed = 'ghep-chu',
    mediaSource,
    audio,
    settings,
    timers = createTimerBag(),
    now = () => Date.now(),
    onSessionEnd = null,
  } = options;

  const lang = langFor(pack.language);
  let engine = createSession(pack, { seed });
  let opts = { ...settings };
  let destroyed = false;

  const listeners = new Set();
  let snapshot = null;

  /* ------------------------------------------------------------ presentation state */

  let view = {
    bandSeq: 0,
    bandRole: null,
    pressedId: null,
    chant: null,          // { caption, stepKind, index }
    reveal: null,         // { phase: 'running'|'held', art, wordText, sentence }
    rockSeq: 0,
    returning: [],        // instance ids flying home after a not-a-word settle
    hintLevel: 0,
    autoPlacedId: null,
  };

  const touch = {
    ownerId: null,
    startedAt: 0,
    x: 0,
    y: 0,
    holdRepeats: 0,
    lastTileAt: -Infinity,
    touchedThisRound: new Set(),
    framePartsFired: false,
  };

  const ladder = { level: 0, dueAt: Infinity };

  /* ------------------------------------------------------------------- plumbing */

  function clip(ref) {
    return ref ? mediaSource(ref.src) : null;
  }

  function targetWord() {
    return engine.round ? pack.words.find((w) => w.id === engine.round.targetId) ?? null : null;
  }

  function emit() {
    snapshot = null;
    for (const fn of listeners) fn();
  }

  /* -------------------------------------------------------------- the idle ladder */

  function scheduleLadder() {
    timers.clear('ladder');
    if (destroyed || engine.phase !== 'playing' || !engine.round) return;
    if (engine.round.status !== 'building') return;
    if (ladder.level >= LADDER.levels) return;
    const delay = Math.max(0, ladder.dueAt - now());
    timers.set('ladder', fireLadder, delay);
  }

  function fireLadder() {
    if (destroyed || engine.phase !== 'playing' || !engine.round) return;
    if (engine.round.status !== 'building') return;
    ladder.level += 1;
    ladder.dueAt = now() + LADDER.step;

    if (ladder.level === 1) {
      // 20 s: the target word is spoken again, unprompted (G2).
      const word = targetWord();
      if (word) audio.playSpeech(clip(word.audio.word));
    } else if (ladder.level === 4) {
      // 80 s: the app places it (G5). The engine decides *which* tile; the flight is
      // 420 ms rather than 260 because the placement carries `assist` (O8).
      dispatch({ type: 'autoPlace' });
      const placed = engine.round && engine.round.placements.length
        ? engine.round.placements[engine.round.placements.length - 1]
        : null;
      if (placed) {
        view.autoPlacedId = placed.instanceId;
        const tile = instanceById(placed.instanceId);
        audio.playTile(tile ? clip(tileAudio(tile, 'short')) : null);
        timers.set('autoPlaceClear', () => { view.autoPlacedId = null; emit(); }, M.autoPlaceFly);
      }
      // `acceptance-criteria.md` G6 — the ladder restarts at 20 s for the next cell. The
      // engine's `resetSeq` bump does that through `syncRound`.
      return;
    }
    view.hintLevel = ladder.level;
    emit();
    scheduleLadder();
  }

  function resetLadder() {
    ladder.level = 0;
    ladder.dueAt = now() + LADDER.step;
    view.hintLevel = 0;
    scheduleLadder();
  }

  /**
   * `acceptance-criteria.md` G9 — any touch anywhere defers the next escalation by 4 s,
   * so nothing ever flies out from under his finger. It is a deferral, not a reset: a
   * child mashing tiles is exactly the child who needs help (G8).
   */
  function deferLadder() {
    const earliest = now() + LADDER.deferMs;
    if (ladder.dueAt < earliest) {
      ladder.dueAt = earliest;
      scheduleLadder();
    }
  }

  /* ---------------------------------------------------------------- tile lookups */

  function instanceById(instanceId) {
    if (!engine.round) return null;
    return lang.paletteInstances(engine.round.palette).find((i) => i.id === instanceId) ?? null;
  }

  function tileAudio(inst, which) {
    const group = pack.tileById[inst.role];
    const tile = group ? group[inst.tileId] : null;
    if (!tile) return null;
    return which === 'long' ? tile.audio.long : tile.audio.short;
  }

  /**
   * `ui.md` §11.2 — the `long` anchored clip on the **first** touch of that tile in the
   * round, the `short` clip on every touch after, **and always short if any tile was
   * touched in the previous 900 ms** (`acceptance-criteria.md` D7, D8, D9). A burst of six
   * taps is therefore six short clips, each audible.
   */
  function clipForTouch(inst) {
    return clipVariant(!touch.touchedThisRound.has(inst.id),
      now() - touch.lastTileAt < SHORT_CLIP_WINDOW);
  }

  /* ------------------------------------------------------------------- the chant */

  function runChant() {
    const steps = resolutionSteps(pack, engine);
    const plan = planResolution(steps);
    view.chant = { caption: null, stepKind: null, index: -1 };

    plan.timeline.forEach((entry, i) => {
      timers.set(`chant${i}`, () => {
        view.chant = { caption: entry.step.caption, stepKind: entry.step.step, index: i };
        audio.playSpeech(clip(entry.step.audio));
        emit();
      }, entry.at);
    });

    timers.set('revealStart', () => startReveal(plan), plan.totalMs);
    emit();
  }

  /* ------------------------------------------------------------------ the reveal */

  function startReveal(plan) {
    const outcome = engine.round ? engine.round.outcome : null;
    const word = outcome ? pack.words.find((w) => w.id === outcome.wordId) : null;
    view.chant = null;
    view.reveal = {
      phase: 'running',
      art: outcome ? outcome.art : null,
      wordText: word ? word.text : null,
      sentence: null,
      photoSwapped: false,
      bounceSeq: 0,
    };

    // The engine is pure, so the next round is knowable before it is committed. That is
    // what pays for `acceptance-criteria.md` N11: every clip of the next round's palette
    // is decoded during this celebration, which is 1.4 s of dead time already paid for.
    timers.set('preloadNext', preloadNextRound, 0);

    timers.set('revealSwap', () => {
      view.reveal = { ...view.reveal, photoSwapped: true };
      emit();
    }, REVEAL.photoSwap);

    timers.set('revealSpeak', () => {
      if (plan.word) audio.playSpeech(clip(plan.word.audio));
      emit();
    }, REVEAL.speak);

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

  /** `acceptance-criteria.md` F6, F5, T12 — 3000 ms, restarted by every tap on the picture. */
  function armAutoAdvance() {
    timers.set('advance', () => dispatch({ type: 'advance' }), REVEAL.autoAdvance);
  }

  function preloadNextRound() {
    if (!engine.round || engine.round.status !== 'resolving') return;
    const next = reduce(pack, engine, { type: 'advance' });
    audio.prepare(clipsForRound(next));
  }

  /** Every clip a round can need: its palette, its chant, and the word itself. */
  function clipsForRound(state) {
    const out = [];
    const push = (ref) => { const s = clip(ref); if (s) out.push(s); };
    if (!state.round) return out;
    for (const inst of lang.paletteInstances(state.round.palette)) {
      push(tileAudio(inst, 'long'));
      push(tileAudio(inst, 'short'));
    }
    const word = pack.words.find((w) => w.id === state.round.targetId);
    if (word) {
      push(word.audio.word);
      push(word.audio.blend);
      if (opts.saySentence) push(word.audio.sentence);
    }
    return out;
  }

  /* ------------------------------------------------------------------ the settle */

  function runSettle() {
    view.rockSeq += 1;
    const steps = resolutionSteps(pack, engine);
    let at = M.rockTotal;
    steps.forEach((step, i) => {
      timers.set(`settle${i}`, () => {
        view.chant = { caption: step.caption, stepKind: step.step, index: i };
        audio.playSpeech(clip(step.audio));
        emit();
      }, at);
      at += stepDurationMs(step);
    });

    timers.set('settleDone', () => {
      // Which tiles are about to walk home, captured before the engine clears them, so
      // the stagger of `acceptance-criteria.md` E8 has something to stagger.
      const before = engine.round;
      const leaving = before
        ? before.cells.filter((c, i) => c.tileId !== null && !lang.cellCorrect(before, i))
          .map((c) => c.instanceId)
        : [];
      view.chant = null;
      view.returning = leaving;
      dispatch({ type: 'settle' });
      timers.set('returningClear', () => {
        view.returning = [];
        emit();
      }, M.flyHome + M.flyHomeStagger * Math.max(0, leaving.length - 1));
    }, at);
    emit();
  }

  /* ------------------------------------------------- reacting to the engine state */

  let lastRoundId = null;
  let lastStatus = null;
  let lastResetSeq = engine.idle.resetSeq;
  let lastTouchSeq = engine.idle.touchSeq;
  let lastBandRole = null;

  function syncToEngine() {
    const round = engine.round;
    const roundId = round ? round.id : null;
    const status = round ? round.status : null;

    if (roundId !== lastRoundId) {
      // A new round: every timer belonging to the old one dies here. This is the
      // "explicit cleanup on reset" half of `development-process.md` §3.
      timers.clearAll();
      lastRoundId = roundId;
      lastStatus = null;
      view.chant = null;
      view.reveal = null;
      view.returning = [];
      view.autoPlacedId = null;
      view.hintLevel = 0;
      touch.touchedThisRound = new Set();
      touch.ownerId = null;
      if (round) audio.prepare(clipsForRound(engine));
    }

    const role = round ? lang.activeRow(round).role : null;
    if (role !== lastBandRole) {
      // `acceptance-criteria.md` C3/C4 — the band cross-fades to the next row. The seq
      // is what the presentation keys the cross-fade on; it never decides *which* row.
      lastBandRole = role;
      view.bandRole = role;
      view.bandSeq += 1;
    }

    if (engine.idle.resetSeq !== lastResetSeq) {
      lastResetSeq = engine.idle.resetSeq;
      lastTouchSeq = engine.idle.touchSeq;
      resetLadder();
    } else if (engine.idle.touchSeq !== lastTouchSeq) {
      lastTouchSeq = engine.idle.touchSeq;
      deferLadder();
    }

    if (status !== lastStatus) {
      lastStatus = status;
      if (status === 'resolving') { timers.clear('ladder'); runChant(); }
      else if (status === 'settling') { timers.clear('ladder'); runSettle(); }
      else if (status === 'building') scheduleLadder();
    }

    if (engine.phase === 'album' || engine.phase === 'ended' || engine.phase === 'empty') {
      timers.clear('ladder');
    }
  }

  function dispatch(action) {
    if (destroyed) return;
    const next = reduce(pack, engine, action);
    if (next === engine) { emit(); return; }
    engine = next;
    syncToEngine();
    emit();
  }

  /* ------------------------------------------------------------------ the caption */

  function captionText() {
    if (view.reveal) {
      const parts = [view.reveal.wordText];
      if (view.reveal.sentence) parts.push(view.reveal.sentence);
      return parts.filter(Boolean).join('  ');
    }
    if (view.chant) return view.chant.caption;
    const word = targetWord();
    if (!word) return null;
    // `ui.md` §2.1 — `Show the word` off replaces the word with one dot per cell, so the
    // strip still says how long the answer is and no letter is shown (M2).
    if (!opts.showWord) return engine.round ? '·'.repeat(engine.round.cells.length) : null;
    return word.text;
  }

  /* -------------------------------------------------------------- the public API */

  const controller = {
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    getSnapshot() {
      if (snapshot) return snapshot;
      const round = engine.round;
      snapshot = {
        language: pack.language,
        phase: engine.phase,
        status: round ? round.status : null,
        round,
        engine,
        rail: pageRail(engine),
        album: engine.album,
        page: engine.page.entries,
        band: round ? bandInstances(pack, engine) : [],
        bandRole: view.bandRole,
        bandSeq: view.bandSeq,
        plate: round ? lang.plateCells(pack, round) : [],
        lit: round ? litCells(pack, round) : [],
        veil: round ? veilOpacity(pack, round) : 0,
        art: round ? round.art : null,
        caption: captionText(),
        chant: view.chant,
        reveal: view.reveal,
        rockSeq: view.rockSeq,
        returning: view.returning,
        pressedId: view.pressedId,
        autoPlacedId: view.autoPlacedId,
        hintLevel: view.hintLevel,
        hintInstanceId: view.hintLevel >= 2 && round && round.status === 'building'
          ? (hintInstance(pack, round) || {}).id ?? null
          : null,
        lastPlacement: round && round.placements.length
          ? round.placements[round.placements.length - 1]
          : null,
        maxGlyphLen: round ? maxGlyphLen(round) : 1,
        // `acceptance-criteria.md` C15 — tile size is computed once at round start from
        // the widest row the round will ever show, and does not change when the band
        // morphs. A tile that resized under his finger would be a motor failure.
        maxRow: round ? widestRow(round) : 1,
      };
      return snapshot;
    },

    /* ---- touch, the part that is all timing --------------------------------- */

    /**
     * `ui.md` §11.1 — the sound fires on touch-**down**, not touch-up, and nothing waits
     * on an animation. `acceptance-criteria.md` T4: the first touch owns the gesture and
     * further simultaneous touches are ignored until it ends.
     */
    tileDown(instanceId, x = 0, y = 0) {
      if (destroyed || engine.phase !== 'playing' || !engine.round) return;
      if (engine.round.status !== 'building') return;  // N8
      if (touch.ownerId !== null) return;              // T4
      const inst = instanceById(instanceId);
      if (!inst) return;

      touch.ownerId = instanceId;
      touch.startedAt = now();
      touch.x = x;
      touch.y = y;
      touch.holdRepeats = 0;

      const which = clipForTouch(inst);
      audio.playTile(clip(tileAudio(inst, which)));
      touch.touchedThisRound.add(instanceId);
      touch.lastTileAt = now();

      view.pressedId = instanceId;
      deferLadder();

      // `ui.md` §11.2 — holding past 600 ms replays the **short** clip every 700 ms, up
      // to 6 times, then stops (N5). On release nothing is placed (N6, N7).
      timers.set('hold', function repeat() {
        if (touch.ownerId !== instanceId) return;
        touch.holdRepeats += 1;
        if (touch.holdRepeats > HOLD.maxRepeats) return;
        audio.playTile(clip(tileAudio(inst, 'short')));
        touch.lastTileAt = now();
        timers.set('hold', repeat, HOLD.repeatMs);
      }, HOLD.startMs);

      emit();
    },

    tileUp(instanceId, x = 0, y = 0) {
      if (destroyed || touch.ownerId !== instanceId) return;
      timers.clear('hold');
      const elapsed = now() - touch.startedAt;
      const moved = Math.hypot(x - touch.x, y - touch.y);
      touch.ownerId = null;
      view.pressedId = null;
      // `ui.md` §11.2 — a placement is touch-down and touch-up within 600 ms and within
      // 24 pt. A hold is not a tap, and a drag across the band seats nothing (T5).
      if (elapsed <= TAP.maxMs && moved <= TAP.maxSlopPt) dispatch({ type: 'tapTile', instanceId });
      else emit();
    },

    tileCancel() {
      if (destroyed) return;
      timers.clear('hold');
      touch.ownerId = null;
      view.pressedId = null;
      emit();
    },

    /** `acceptance-criteria.md` C9, C10, D4 — tapping a seated cell lifts it home. */
    tapCell(cellIndex) {
      if (destroyed || engine.phase !== 'playing' || !engine.round) return;
      if (engine.round.status !== 'building') return;
      const cell = engine.round.cells[cellIndex];
      if (cell && cell.tileId !== null) {
        const inst = instanceById(cell.instanceId);
        if (inst) audio.playTile(clip(tileAudio(inst, 'short')));
      }
      dispatch({ type: 'tapCell', cellIndex });
    },

    /* ---- the picture frame: tap replays the word, hold speaks the parts ------ */

    frameDown() {
      if (destroyed) return;
      touch.framePartsFired = false;
      timers.set('framePartsHint', () => {
        touch.framePartsFired = true;
        // `acceptance-criteria.md` B6, B7 — the parts, not the word; the ladder is
        // untouched and no assist is recorded. The engine says so by returning the
        // identical state.
        dispatch({ type: 'partsHint' });
        playSteps(partsHintSteps(pack, engine), 'parts');
      }, PARTS_HINT_HOLD);
    },

    frameUp() {
      if (destroyed) return;
      timers.clear('framePartsHint');
      if (touch.framePartsFired) return;
      if (engine.phase === 'playing' && engine.round && engine.round.status === 'building') {
        const word = targetWord();
        if (word) audio.playSpeech(clip(word.audio.word));
        dispatch({ type: 'tapFrame' });
      }
    },

    /** `acceptance-criteria.md` F5, T12 — each tap replays the word and resets the hold. */
    tapReveal() {
      if (destroyed || !view.reveal) return;
      const outcome = engine.round ? engine.round.outcome : null;
      const word = outcome ? pack.words.find((w) => w.id === outcome.wordId) : null;
      if (word) audio.playSpeech(clip(word.audio.word));
      view.reveal = { ...view.reveal, bounceSeq: view.reveal.bounceSeq + 1 };
      armAutoAdvance();
      emit();
    },

    /** `acceptance-criteria.md` H5 — an album picture replays its word and bounces. */
    tapAlbum(entry) {
      if (destroyed || !entry) return;
      const word = pack.words.find((w) => w.id === entry.wordId);
      if (word) audio.playSpeech(clip(word.audio.word));
    },

    nextPage() {
      dispatch({ type: 'nextPage' });
    },

    /** `gameplay.md` §6.7 — audio fades over 800 ms, the round is abandoned, end screen. */
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
     * `acceptance-criteria.md` T7 — backgrounded mid-chant: audio stops, the chant does
     * not resume mid-word, and the board is either pre-chant or resolved, never
     * half-merged.
     */
    onBackground() {
      if (destroyed) return;
      audio.stopAll();
      const status = engine.round ? engine.round.status : null;
      timers.clearAll();
      if (status === 'settling') {
        // Back to a valid partial board — the pre-chant state.
        view.chant = null;
        dispatch({ type: 'settle' });
      } else if (status === 'resolving') {
        // Jump to the end of the reveal: resolved, held, waiting for a tap or 3 s.
        view.chant = null;
        const outcome = engine.round.outcome;
        const word = pack.words.find((w) => w.id === outcome.wordId);
        view.reveal = {
          phase: 'held',
          art: outcome.art,
          wordText: word ? word.text : null,
          sentence: null,
          photoSwapped: true,
          bounceSeq: 0,
        };
        emit();
      }
    },

    onForeground() {
      if (destroyed) return;
      if (view.reveal && view.reveal.phase === 'held') armAutoAdvance();
      else if (engine.round && engine.round.status === 'building') scheduleLadder();
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
        view.chant = { caption: step.caption, stepKind: step.step, index: i };
        emit();
      }, at);
      at += stepDurationMs(step);
    });
    timers.set(`${name}End`, () => { view.chant = null; emit(); }, at);
  }

  /** The widest row this round can show, which is what the layout law is given as `n`. */
  function widestRow(round) {
    const p = round.palette;
    if (p.kind === 'en') return p.tiles.length;
    return Math.max(
      p.onsets.length,
      p.rimes.length,
      ...Object.values(p.tonesByRime).map((row) => row.length),
      1,
    );
  }

  function maxGlyphLen(round) {
    let max = 1;
    for (const inst of lang.paletteInstances(round.palette)) {
      max = Math.max(max, glyphLength(inst.glyph ?? ''));
    }
    return max;
  }

  // First round: prime the audio, the ladder and the band role.
  audio.setMuted(opts.mute);
  audio.setRate(opts.rate);
  syncToEngine();
  resetLadder();

  return controller;
}
