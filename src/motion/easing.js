// The easing curves of `ui.md` §10.2.
//
// Separate from `durations.mjs` because these are React Native objects: a Node test of
// the state layer must be able to read a duration without pulling in a renderer.

import { Easing } from 'react-native';

export const EASING = {
  enter: Easing.bezier(0.22, 1, 0.36, 1),
  exit: Easing.bezier(0.55, 0, 1, 0.45),
  calm: Easing.inOut(Easing.ease),
  /**
   * `ui.md` §10.6 M25 — the parent door's hold fill, and the hold hint's ring. **Linear,
   * because a progress indicator that eases is lying about the time left.** It is the
   * only linear curve in the app, and it is the only one that is a measurement rather
   * than a feeling.
   */
  linear: Easing.linear,
};

export const SPRING = {
  settle: { tension: 180, friction: 14 },
  pop: { tension: 300, friction: 11 },
};
