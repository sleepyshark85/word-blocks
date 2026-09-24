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
// tablet the page plan is `[35]` in **both** orientations, so rotating does not even
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
 * `runLengths` is the pack's inventory as run lengths — VI `[29 letters, 6 tones]`, EN
 * `[26 letters]` (revision 5). The result is `null` when this viewport cannot serve this
 * pack — **which now includes laying out the six-cell word strip**, F4/F15/F16 as well as
 * F7 (`ui.md` §4.3, AC A11) — and that is the screen-too-small card for **that language**
 * (V35): the other mode may still be served, and the language is switchable, so nobody is
 * stuck.
 */
export function usePagePlan(runLengths, reserveBottom = 0) {
  const v = useViewport();
  const key = runLengths.join(',');
  return useMemo(() => {
    // `reserveBottom` is the editor's preview (J9): a strip of the screen that belongs to
    // the *Đúng rồi* / *Sửa* bar rather than to the board. It is charged as a **safe-area
    // inset**, which is exactly what it is — space the board may not draw in — so the
    // board is laid out by the same law against a slightly shorter screen rather than
    // being squeezed into a container it does not know about. Measured in a browser: a
    // bar that took height from a board already sized for the full viewport clipped the
    // table's first and last rows.
    const viewport = reserveBottom > 0 ? { ...v, insetB: v.insetB + reserveBottom } : v;
    const plan = viewport.tooSmall ? null : planFor(viewport, key.split(',').map(Number));
    return {
      viewport,
      plan,
      insets: {
        top: viewport.insetT, bottom: viewport.insetB, left: viewport.insetL, right: viewport.insetR,
      },
    };
  }, [v, key, reserveBottom]);
}
