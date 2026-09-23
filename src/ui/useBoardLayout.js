// The viewport, turned into the board's stack.
//
// A hook rather than a screen, so `ui.md` §3.2's rule — *no screen component is shared
// between modes* — is untouched by it. Both boards ask the same question of the same law.
//
// `ui.md` §4.1: rotating mid-word changes only pixels. This recomputes on a dimension
// change and nothing else; the engine state it draws is untouched, so seated symbols stay
// seated, the live set is unchanged and the chant continues (P9, P10, T14).

import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, maxCells, orientationOK, MIN_VIEWPORT, MAX_TABLE } from '../layout/layout.mjs';

export function useBoardLayout(cells) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return useMemo(() => {
    const v = {
      Wv: Math.round(width),
      Hv: Math.round(height),
      insetT: Math.round(insets.top),
      insetB: Math.round(insets.bottom),
      insetL: Math.round(insets.left),
      insetR: Math.round(insets.right),
    };
    const want = Math.max(1, Math.min(MAX_TABLE, cells || 1));
    // If this viewport cannot serve the table the stage asked for, it is served the
    // largest one it can hold. `App.js` refuses to mount a board below 20 cells (A11), so
    // this only ever trims the last stage on the two shortest supported phones.
    const served = maxCells(v);
    const n = Math.max(1, Math.min(want, served || want));
    const L = layout({ ...v, cells: n });
    return {
      ...(L ?? {}),
      unservable: L === null,
      insets: { top: v.insetT, bottom: v.insetB, left: v.insetL, right: v.insetR },
      maxCells: served,
      served: orientationOK(v),
      tooSmall: width < MIN_VIEWPORT.width || height < MIN_VIEWPORT.height,
    };
  }, [width, height, insets.top, insets.bottom, insets.left, insets.right, cells]);
}
