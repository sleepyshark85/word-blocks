// Screen S14 — record the cheer (`ui.md` §13.6, `ui.md` §13.7 **E14**).
//
// *"When he makes a word, he hears the music — and your voice, if you want."*
//
// **One optional clip per pack, not per word** — it lives in `pack.json`, which is the
// only thing the editor writes outside `words/`, and `pack.json.bak` is written first
// (`content-pipeline.md` §6). Offered once, after her first save (J15), and thereafter
// only from *Voice & pace* (**I12**). Never required, removable in one tap, and the app
// is complete without it (`acceptance-criteria.md` F6).
//
// **J16 — preview plays the motif and her recording together**, because that is what the
// child will hear. Playing her voice alone would tell her nothing about whether it lands
// on top of the music or fights it.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../../../theme';
import { AppText } from '../../Text';
import { ParentScreen } from '../ParentChrome';
import { createTimerBag } from '../../../state/timers.mjs';
import { UI_AUDIO } from '../../../../assets/audio';
import {
  CAPTURE_AVAILABLE, useRecorder, beginRecording, endRecording,
} from '../../../content/capture';
import { PrimaryButton } from './EditorParts';

/** §13.6 — two seconds. A cheer is a cheer, not a sentence. */
const CHEER_MS = 2000;

export function CheerScreen({ strings, cheer, onSave, onBack, audio, sourceFor }) {
  const theme = useTheme();
  const { recorder } = useRecorder();
  const timers = useRef(null);
  if (timers.current === null) timers.current = createTimerBag();
  const [recording, setRecording] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const bag = timers.current;
    return () => {
      bag.clearAll();
      endRecording(recorder).catch(() => {});
    };
  }, [recorder]);

  const stop = useCallback(async () => {
    timers.current.clear('cap');
    setRecording(false);
    const clip = await endRecording(recorder);
    if (clip) onSave(clip);
  }, [recorder, onSave]);

  const start = useCallback(async () => {
    if (!CAPTURE_AVAILABLE) { setDenied(true); return; }
    const begun = await beginRecording(recorder);
    if (begun.denied) { setDenied(true); return; }
    setDenied(false);
    setRecording(true);
    timers.current.set('cap', () => { stop(); }, CHEER_MS);
  }, [recorder, stop]);

  /** J16 — the motif and her voice together, which is what he will hear. */
  const preview = () => {
    audio.playMotif(UI_AUDIO.motif3);
    if (cheer) audio.playCheer(sourceFor(cheer.src));
  };

  return (
    <ParentScreen title={strings.editorCheerTitle} modeTitle={strings.modeTitle} onBack={onBack}>
      <AppText role="body">{strings.editorCheerBody}</AppText>
      <Pressable
        onPressIn={start}
        onPressOut={recording ? stop : null}
        delayPressIn={0}
        accessibilityRole="button"
        accessibilityLabel={strings.editorCheerHold}
        style={[styles.record, {
          backgroundColor: recording ? theme.role1Edge : theme.accentFace,
          borderColor: theme.groundAlt,
        }]}
      >
        <View style={[styles.dot, { backgroundColor: theme.groundAlt }]} />
      </Pressable>
      <AppText role="secondary" colour={theme.inkSoft} style={styles.centred}>
        {strings.editorCheerHold}
      </AppText>
      {denied ? (
        <AppText role="secondary" colour={theme.rewardEdge} style={styles.centred}>
          {CAPTURE_AVAILABLE ? strings.editorDenied : strings.editorCaptureUnavailable}
        </AppText>
      ) : null}
      {cheer ? (
        <View style={styles.row}>
          <Pressable onPress={preview} accessibilityRole="button" style={styles.link}>
            <AppText role="button" colour={theme.accentFace}>{strings.editorCheerPreview}</AppText>
          </Pressable>
          <Pressable onPress={() => onSave(null)} accessibilityRole="button" style={styles.link}>
            <AppText role="button" colour={theme.role1Edge}>{strings.editorCheerRemove}</AppText>
          </Pressable>
        </View>
      ) : null}
      {/* J15 — declining is one tap, and it is never offered automatically again. */}
      <PrimaryButton label={strings.editorCheerLater} onPress={onBack} tone="plain" />
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  record: {
    width: 96, height: 96, borderRadius: 48, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 24,
  },
  dot: { width: 28, height: 28, borderRadius: 14 },
  centred: { textAlign: 'center', marginTop: 8 },
  row: { flexDirection: 'row', marginTop: 16, justifyContent: 'center' },
  link: { minHeight: 44, justifyContent: 'center', marginHorizontal: 16 },
});
