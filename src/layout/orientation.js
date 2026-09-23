// Which orientations this device is served in. `gameplay.md` §2.1.
//
// "The app supports an orientation **iff the layout fit rule passes for the 20-cell
// table**" (`ui.md` §4.3, rule F7). Evaluated once at startup from the screen metrics,
// not per frame. In practice phones lock to portrait — a landscape phone serves a 12-cell
// table and is rejected, which is arithmetic rather than taste — and tablets rotate freely
// (`acceptance-criteria.md` P7, P8).
//
// Evaluated once, deliberately, so the device cannot flip-flop as the user turns it.

import * as ScreenOrientation from 'expo-screen-orientation';

import { orientationOK } from './layout.mjs';

/**
 * @param {{width:number, height:number}} window  the screen metrics as booted
 * @param {{top:number,bottom:number,left:number,right:number}} insets
 * @returns {'both'|'portrait'} what was applied
 */
export async function applyOrientationPolicy(window, insets) {
  const portrait = {
    Wv: Math.round(Math.min(window.width, window.height)),
    Hv: Math.round(Math.max(window.width, window.height)),
    insetT: Math.round(insets.top),
    insetB: Math.round(insets.bottom),
    insetL: 0,
    insetR: 0,
  };
  // The landscape counterpart of the same screen. The side insets swap in for the
  // top/bottom ones, which is what a notch actually does when a phone is turned.
  const landscape = {
    Wv: portrait.Hv,
    Hv: portrait.Wv,
    insetT: 0,
    insetB: Math.round(insets.bottom),
    insetL: Math.round(insets.top),
    insetR: Math.round(insets.top),
  };

  const both = orientationOK(portrait) && orientationOK(landscape);
  try {
    await ScreenOrientation.lockAsync(both
      ? ScreenOrientation.OrientationLock.DEFAULT
      : ScreenOrientation.OrientationLock.PORTRAIT_UP);
  } catch {
    // A platform that will not lock (web) still renders; the fit rule is what decides
    // whether a layout is drawn, and it is checked on every render anyway.
  }
  return both ? 'both' : 'portrait';
}
