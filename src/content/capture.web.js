// Capture, in a browser.
//
// Tier 3 drives the editor in Chromium (`development-process.md` §5), so the picture step
// has to be reachable there or the flow cannot be walked end to end. A browser has a file
// input and no camera roll, so **Take a photo and Choose from library are the same
// control here** and both open the file dialogue. That is a browser-only shim; the device
// build is `capture.js` and uses `expo-image-picker`.
//
// Recording is **not** shimmed. A browser recording would be a different container, a
// different permission model and a different failure mode from the device's, and a proof
// that walked cleanly here would say nothing true about a phone. The screens ask
// `CAPTURE_AVAILABLE` and say so plainly instead of offering a control that misleads.

export const CAPTURE_AVAILABLE = false;

function pickFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files && input.files[0];
      resolve(file ? { uri: URL.createObjectURL(file), width: null, height: null, ext: 'jpg' } : null);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export async function takePhoto() {
  return { asset: await pickFile() };
}

export async function choosePhoto() {
  return { asset: await pickFile() };
}

export function useRecorder() {
  return { recorder: null, state: { isRecording: false, metering: null, durationMillis: 0 } };
}

export async function beginRecording() {
  return { denied: 'microphone' };
}

export async function endRecording() {
  return null;
}
