// The audio session, and the one platform import in the app's sound path.
//
// **The channels and the cut rule are in `channels.mjs`**, which imports nothing that
// only runs on a device: `ui.md` §11.2's rule is the single most specified audio
// behaviour in this app, and it has to be checkable in Node rather than only through a
// test double that implements it itself.
//
// Latency (§11.1, `acceptance-criteria.md` N1): a tile's sound must begin within 60 ms of
// touch-**down**. That is bought by holding a decoded player per clip for the whole
// constant table (N11), so a tap is a `seekTo(0)` and a `play()` rather than a decode.

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { createChannels } from './channels.mjs';

/**
 * `ui.md` §11.3, "Silent switch": the game speaks even when the ringer switch is
 * silenced, because a parent's phone lives on silent and a silent word game is a broken
 * word game (`acceptance-criteria.md` N9).
 */
export async function configureAudioSession() {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
    });
  } catch {
    // An audio session that will not configure is not a reason to refuse to draw a
    // round. `acceptance-criteria.md` T15 and N10 both require the game to be completable
    // with no sound at all.
  }
}

/**
 * The platform half: `expo-audio`'s player, and nothing else. Every rule about *when* a
 * clip starts or stops lives in `channels.mjs`, which imports nothing that only runs on a
 * device and is therefore swept in Node (`development-process.md` §5).
 *
 * This is a plain object rather than a hook because it owns native handles, and
 * `acceptance-criteria.md` R6 says every handle from the previous language is released
 * before a new one is opened. `dispose()` is the whole of that promise, and `useGame.js`
 * is what guarantees it is called.
 */
export function createAudioEngine() {
  return createChannels({ createPlayer: (source) => createAudioPlayer(source) });
}
