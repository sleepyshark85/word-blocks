// The viewport, turned into the board's stack.
//
// A hook rather than a screen, so `ui.md` §3.2's rule — *no screen component is shared
// between modes* — is untouched by it. Both boards ask the same question of the same law.
//
// `gameplay.md` §1.1: rotating mid-round changes only pixels. This recomputes on a
// dimension change and nothing else; the engine state it draws is untouched, so seated
// tiles stay seated, lit segments stay lit and the chant continues
// (`acceptance-criteria.md` P9, P10, T13).

import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { boardLayout, orientationOK, MIN_VIEWPORT } from '../layout/layout.mjs';

export function useBoardLayout(maxRow) {
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
    return {
      ...boardLayout({ ...v, n: Math.max(1, Math.min(8, maxRow)) }),
      insets: { top: v.insetT, bottom: v.insetB, left: v.insetL, right: v.insetR },
      served: orientationOK(v),
      tooSmall: width < MIN_VIEWPORT.width || height < MIN_VIEWPORT.height,
    };
  }, [width, height, insets.top, insets.bottom, insets.left, insets.right, maxRow]);
}
