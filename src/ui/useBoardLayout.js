// The viewport, turned into the board's stack and its page plan.
//
// Hooks rather than a screen, so `ui.md` §3.2's rule — *no screen component is shared
// between modes* — is untouched by them. Both boards ask the same question of the same
// law, and the law itself is `src/layout/layout.mjs`, which is swept against
// `tools/layout-sweep.mjs` in Node.
//
// `ui.md` §4.1: rotating mid-word changes only pixels. These recompute on a dimension
// change and nothing else; the engine state they draw is untouched, so seated symbols
// stay seated, the live set is unchanged and the chant continues (P9, P10, T14). On a
// tablet the page plan is `[67]` in **both** orientations, so rotating does not even
// change the plan's identity and the game object survives it.

import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { planFor, MIN_VIEWPORT } from '../layout/layout.mjs';

/** The screen metrics the layout law takes, rounded once. */
export function useViewport() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return useMemo(() => ({
    Wv: Math.round(width),
    Hv: Math.round(height),
    insetT: Math.round(insets.top),
    insetB: Math.round(insets.bottom),
    insetL: Math.round(insets.left),
    insetR: Math.round(insets.right),
    tooSmall: width < MIN_VIEWPORT.width || height < MIN_VIEWPORT.height,
  }), [width, height, insets.top, insets.bottom, insets.left, insets.right]);
}

/**
 * The page plan for one pack on this device (`ui.md` §4.2, AC V1–V3, V9).
 *
 * `runLengths` is the pack's inventory as run lengths — VI `[onsets, rimes, tones]`, EN
 * `[letters, digraphs]`. The result is `null` when this viewport cannot serve this pack
 * (F7), which is the screen-too-small card for **that language** (V35): the other mode
 * may still be served, and the language is switchable, so nobody is stuck.
 */
export function usePagePlan(runLengths) {
  const v = useViewport();
  const key = runLengths.join(',');
  return useMemo(() => {
    const plan = v.tooSmall ? null : planFor(v, key.split(',').map(Number));
    return { viewport: v, plan, insets: { top: v.insetT, bottom: v.insetB, left: v.insetL, right: v.insetR } };
  }, [v, key]);
}
