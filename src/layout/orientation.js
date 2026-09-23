// Which orientations this device is locked to. `gameplay.md` §2.1, AC P7/P8.
//
// The decision itself is pure and lives in the layout law as `orientationPolicy`, so it
// is swept in Node by `test/layout-parity.test.mjs` (`development-process.md` §5).
// **This file is only the platform call**, which is the part that cannot run off-device.
//
// Evaluated once at startup, deliberately, so the device cannot flip-flop as it is turned.

import * as ScreenOrientation from 'expo-screen-orientation';

import { orientationPolicy } from './layout.mjs';

/**
 * @param {{width:number, height:number}} window  the screen metrics as booted
 * @param {{top:number,bottom:number,left:number,right:number}} insets
 * @returns {Promise<'both'|'portrait'>} what was applied
 */
export async function applyOrientationPolicy(window, insets) {
  const decision = orientationPolicy(window, insets);
  try {
    await ScreenOrientation.lockAsync(decision === 'both'
      ? ScreenOrientation.OrientationLock.DEFAULT
      : ScreenOrientation.OrientationLock.PORTRAIT_UP);
  } catch {
    // A platform that will not lock (web) still renders; the fit rule is what decides
    // whether a layout is drawn, and it is checked on every render anyway.
  }
  return decision;
}
