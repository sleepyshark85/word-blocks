// Her camera, her photo library, her voice — and nothing else.
//
// `ui.md` §13: *"The app makes no network call, ever, including here. No image search, no
// runtime TTS. Her sources are the camera, her photo library, and her voice."*
// `acceptance-criteria.md` **J3** makes the absence of an image-search option a criterion
// rather than an omission, and **I11** makes zero outbound requests one too.
//
// This module is the whole of the app's contact with the device's media hardware. It is
// deliberately small and deliberately asynchronous at its edge: everything it returns is
// a plain `{ uri, width, height }` or `{ uri, ms }`, so the screens above it and
// `src/editor/packStore.mjs` below it stay testable in Node.

import * as ImagePicker from 'expo-image-picker';
import {
  AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState,
} from 'expo-audio';

export const CAPTURE_AVAILABLE = true;

/**
 * `ui.md` §13.2 step 1 — **the picture is the first question**, because it is the one she
 * has an opinion about and the one she is standing in front of.
 *
 * `allowsEditing` gives her the square crop the pack wants (`content-pipeline.md` §3.4:
 * a square-normalised source, so a `cover` crop into a full-screen frame never cuts the
 * subject). `quality: 0.82` is the pipeline's own JPEG quality.
 */
const PICK = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.82,
  exif: false,
};

async function pickResult(promise) {
  const result = await promise;
  if (!result || result.canceled || !Array.isArray(result.assets) || result.assets.length === 0) {
    return null;
  }
  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width || null,
    height: asset.height || null,
    // The extension the blob will be stored under. The picker hands back a temporary
    // file; `importMedia` content-addresses it and copies it into the pack.
    ext: (asset.mimeType ?? '').includes('png') ? 'png' : 'jpg',
  };
}

export async function takePhoto() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return { denied: 'camera' };
  return { asset: await pickResult(ImagePicker.launchCameraAsync(PICK)) };
}

export async function choosePhoto() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { denied: 'library' };
  return { asset: await pickResult(ImagePicker.launchImageLibraryAsync(PICK)) };
}

/**
 * `ui.md` §13.2 step 4 / AC **J7, J8** — hold to record, a live waveform, a hard cap, and
 * unlimited re-records. *"Her voice is the best audio this app can have."*
 *
 * The cap is the caller's (3 s for a word, 2 s for the cheer) and is enforced by a timer
 * in the state layer with explicit cleanup, not here — this hook owns the recorder and
 * nothing else, which is what keeps the Rules of Hooks satisfiable on a screen that also
 * has a conditional render.
 */
export function useRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  // 100 ms is fast enough for the waveform to look alive and slow enough not to re-render
  // a screen sixty times a second while a parent holds a button.
  const state = useAudioRecorderState(recorder, 100);
  return { recorder, state };
}

export async function beginRecording(recorder) {
  const permission = await AudioModule.requestRecordingPermissionsAsync();
  if (!permission.granted) return { denied: 'microphone' };
  await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
  await recorder.prepareToRecordAsync();
  recorder.record();
  return { started: true };
}

export async function endRecording(recorder) {
  try {
    await recorder.stop();
  } catch {
    return null;
  }
  // The recording session has to be handed back, or every clip the app plays afterwards
  // comes out of the earpiece on iOS instead of the speaker.
  await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
  const uri = recorder.uri;
  return uri ? { uri, ms: null, ext: 'm4a' } : null;
}
