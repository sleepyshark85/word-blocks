// The audio session, and the one platform import in the app's sound path.
//
// **The channels and the cut rule are in `channels.mjs`**, which imports nothing that
// only runs on a device: `ui.md` §11.2's rule is the single most specified audio
// behaviour in this app, and it has to be checkable in Node rather than only through a
// test double that implements it itself.
//
// Latency (§11.1, `acceptance-criteria.md` N1): a tile's sound must begin within 60 ms of
// touch-**down**. That is bought by holding a decoded player for every clip the **current
// board state** can ask for (**N11 (BOUNDED)**), so a tap is a `seekTo(0)` and a
// `play()` rather than a decode. Holding one for every clip the whole *table* can ask
// for — N11 as it read before the 2026-09-24 correction — is what made the app silent on
// the owner's iPhone: 100 native players for `vi-seed`, 121 for `en-seed`, and every
// construction past the device's ceiling failed, silently. The bound is `MAX_PLAYERS`.

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import { createChannels, createPlayerBudget } from './channels.mjs';

/**
 * **One budget for the process, because that is the shape of the resource.** iOS runs out
 * of AVFoundation playback pipelines per *process*, not per object, and this app builds
 * two engines: the chooser's (one sample word) and the game's. Counting them apart would
 * let the pair exceed the ceiling that neither one does.
 */
const BUDGET = createPlayerBudget();

/**
 * `acceptance-criteria.md` **N11a / E10a** — what the About screen shows the owner: the
 * bound, how many players are live, and **how many failed**. Nobody on this team has an
 * iPhone; this is how the next device report is evidence rather than "still silent".
 */
export function audioStats() {
  return BUDGET.stats();
}

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
  return createChannels({ createPlayer: (source) => createAudioPlayer(source), budget: BUDGET });
}
