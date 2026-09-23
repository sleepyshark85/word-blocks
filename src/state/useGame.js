// The subscription. Everything below it is in `gameController.mjs` and testable in Node.
//
// `useSyncExternalStore` rather than `useState`, for one concrete reason: under
// StrictMode React mounts, unmounts and remounts every effect. A controller built inside
// `useState`'s initialiser would be built twice and the first one's timers would run
// against a store nobody reads — which is precisely the class of defect
// `development-process.md` §3 was written after. Here the controller is created in an
// effect, destroyed in its cleanup, and the render path only ever reads a snapshot.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { createGameController } from './gameController.mjs';

/**
 * @param {object}  args
 * @param {object}  args.game          a pack plus its prefix trees; identity change tears
 *                                     the game down and rebuilds it (`ui.md` §13.7 E13)
 * @param {string}  args.seed
 * @param {Function} args.mediaSource
 * @param {object}  args.ui            the bundled non-speech sounds
 * @param {object}  args.audio         an engine from `audio/engine.js`
 * @param {object}  args.settings
 * @param {Function} [args.onSessionEnd]
 */
export function useGame({
  game, seed, mediaSource, ui, audio, settings, onSessionEnd, progress, onProgress,
}) {
  const [controller, setController] = useState(null);
  const endRef = useRef(onSessionEnd);
  endRef.current = onSessionEnd;
  // `progress` is read **once**, when the controller is built: it is where this pack's
  // album was when he last played it (A18), not a live input. `onProgress` is called on
  // every discovery, so the ref keeps it fresh without rebuilding the session.
  const progressRef = useRef(progress);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    // A viewport that cannot build a page plan for this pack has no board to drive
    // (V35); `App.js` shows the card, and there is nothing to construct here.
    if (!game) { setController(null); return undefined; }
    const ctl = createGameController({
      game,
      seed,
      mediaSource,
      ui,
      audio,
      settings,
      progress: progressRef.current,
      onProgress: (p) => { if (onProgressRef.current) onProgressRef.current(p); },
      onSessionEnd: (...a) => { if (endRef.current) endRef.current(...a); },
    });
    setController(ctl);
    return () => {
      // `acceptance-criteria.md` A10 and R6: on a language switch no board, tile, clip
      // handle or queue entry from the previous language is retained.
      ctl.destroy();
      setController(null);
    };
    // `settings` is applied through `updateSettings` below; rebuilding the session
    // because the parent toggled `mute` would restart the board under the child.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, seed, mediaSource, ui, audio]);

  useEffect(() => {
    if (controller) controller.updateSettings(settings);
  }, [controller, settings]);

  useEffect(() => {
    if (!controller) return undefined;
    // `acceptance-criteria.md` T7, T8, T9 — backgrounding, a call, a locked screen.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') controller.onForeground();
      else controller.onBackground();
    });
    return () => sub.remove();
  }, [controller]);

  const subscribe = useCallback(
    (fn) => (controller ? controller.subscribe(fn) : () => {}),
    [controller],
  );
  const getSnapshot = useCallback(
    () => (controller ? controller.getSnapshot() : null),
    [controller],
  );
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return { controller, snapshot };
}
