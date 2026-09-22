// The easing curves of `ui.md` §10.2.
//
// Separate from `durations.mjs` because these are React Native objects: a Node test of
// the state layer must be able to read a duration without pulling in a renderer.

import { Easing } from 'react-native';

export const EASING = {
  enter: Easing.bezier(0.22, 1, 0.36, 1),
  exit: Easing.bezier(0.55, 0, 1, 0.45),
  calm: Easing.inOut(Easing.ease),
};

export const SPRING = {
  settle: { tension: 180, friction: 14 },
  pop: { tension: 300, friction: 11 },
};
