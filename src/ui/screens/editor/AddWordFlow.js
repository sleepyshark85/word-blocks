// Screens S10–S13, S19, S20 — *Add a word*, and the four things she can hit on the way.
//
// `ui.md` §13.2: **one question per screen, autosaved every step**, forward-only with a
// persistent back chevron, and *"a draft is written after every screen, including before
// the word is valid, because she will be interrupted by a 4-year-old and losing her work
// once ends her willingness to maintain the list — and the app dies with it"* (J4).
//
// The order is deliberate and it is not the data model's order: **the picture first**,
// because it is the step she has an opinion about and the one she is standing in front
// of. The decomposition is step 3 and it is *shown, not asked* — she never types a rime
// or a tone id. `src/editor/model.mjs` derives them from the word she typed, and §13.3a's
// confirm screen shows her the result as the strip the child will see, which is the only
// way a non-technical adult can check a decomposition she did not author.
//
// **Nothing on any of these screens says "invalid" and nothing blocks the save** (K6, K7).

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../theme';
import { AppText } from '../../Text';
import { Picture } from '../../Picture';
import { ParentScreen } from '../ParentChrome';
import { createTimerBag } from '../../../state/timers.mjs';
import { analyse, spansOf, viRimeProposal, MAX_WORD_LETTERS } from '../../../editor/model.mjs';
import {
  CAPTURE_AVAILABLE, takePhoto, choosePhoto, useRecorder, beginRecording, endRecording,
} from '../../../content/capture';
import {
  PlainGlyph, PrimaryButton, TapStrip, UnitTile,
} from './EditorParts';
import { PreviewBoard } from './PreviewBoard';

/** J7 — the hard cap on a word recording, and §13.6's on the cheer. */
const RECORD_MS = 3000;

/** The height the preview's confirm bar takes off the board (J9). */
const PREVIEW_BAR = 148;

const STEPS = ['picture', 'word', 'tiles', 'sound', 'preview'];

/* ------------------------------------------------------------------ step 1: picture */

function PictureStep({ strings, draft, onPick, onRemove, sourceFor, onNext }) {
  const theme = useTheme();
  const [denied, setDenied] = useState(null);

  const pick = async (take) => {
    const result = await (take ? takePhoto() : choosePhoto());
    if (result.denied) { setDenied(result.denied); return; }
    if (result.asset) { setDenied(null); onPick(result.asset, take ? 'camera' : 'own-work'); }
  };

  return (
    <>
      <AppText role="secondary" colour={theme.inkSoft} style={styles.hint}>
        {strings.editorPhotoHint}
      </AppText>
      <View style={styles.photoRow}>
        {draft.images.map((image, i) => (
          <Pressable
            key={image.src}
            onPress={() => onRemove(i)}
            accessibilityRole="button"
            accessibilityLabel={strings.editorRemovePhoto}
            style={[styles.photo, { borderColor: theme.hairline }]}
          >
            <Picture source={sourceFor(image.src)} emoji={null} width={96} height={96} radius={12} />
          </Pressable>
        ))}
      </View>
      {/* J3 — Take a photo and Choose from library, and **no image-search option**. */}
      <PrimaryButton label={strings.editorTakePhoto} onPress={() => pick(true)} tone="plain" />
      <PrimaryButton label={strings.editorChoosePhoto} onPress={() => pick(false)} tone="plain" />
      {denied ? (
        <AppText role="secondary" colour={theme.rewardEdge} style={styles.hint}>
          {strings.editorDenied}
        </AppText>
      ) : null}
      {/* J12 — one image is enough to save and play; more is better. */}
      <PrimaryButton
        label={strings.editorNext}
        onPress={onNext}
        disabled={draft.images.length === 0}
      />
      {draft.images.length === 0 ? (
        <AppText role="secondary" colour={theme.inkSoft} style={styles.hint}>
          {strings.editorNeedPhoto}
        </AppText>
      ) : null}
    </>
  );
}

/* --------------------------------------------------------------------- step 2: word */

function WordStep({ strings, draft, onChange, onNext }) {
  const theme = useTheme();
  return (
    <>
      <View style={[styles.field, { borderColor: theme.hairline, backgroundColor: theme.ground }]}>
        {/* D24 — no casing is applied to a parent surface. `autoCapitalize="none"` is the
            keyboard's half of the same rule: she should not have to undo a capital the
            phone added, and `normaliseTyped` folds one anyway. */}
        <TextInput
          value={draft.text}
          onChangeText={onChange}
          placeholder={strings.editorWordPlaceholder}
          placeholderTextColor={theme.inkSoft}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.fieldInput, { color: theme.ink }]}
          accessibilityLabel={strings.editorStepWord}
        />
      </View>
      <AppText role="secondary" colour={theme.inkSoft} style={styles.hint}>
        {strings.editorWordHint}
      </AppText>
      <PrimaryButton
        label={strings.editorNext}
        onPress={onNext}
        disabled={draft.text.trim() === ''}
      />
    </>
  );
}

/* ---------------------------------------------- step 3: the parts, shown not asked */

/**
 * §13.3 and §13.3a in one screen, because they are one question — *did I read your word
 * the way you meant it?* — and which of the five answers she gets is decided by
 * `analyse()`, not here.
 */
function TilesStep({
  strings, pack, looked, draft, onPickReading, onAddRime, onNext, onSaveForLater,
}) {
  const theme = useTheme();
  const problem = looked.problem;

  if (problem && problem.code === 'tooLong') {
    // **S20 — Too long for the board** (`ui.md` §13.3a, X8). Drawing the strip to scale
    // with the extra letter falling off the end is the whole explanation: it needs no
    // number and no vocabulary, and the number is there anyway for the adult who wants it.
    return (
      <>
        <AppText role="body">{strings.editorTooLongTitle(looked.text, problem.letters.length)}</AppText>
        <AppText role="body">{strings.editorTooLongBody(MAX_WORD_LETTERS)}</AppText>
        <TapStrip letters={problem.letters} spans={[]} cells={MAX_WORD_LETTERS} />
        <AppText role="secondary" colour={theme.inkSoft} style={styles.hint}>
          {strings.editorTooLongKept}
        </AppText>
        <PrimaryButton label={strings.editorSaveForLater} onPress={onSaveForLater} />
      </>
    );
  }

  if (problem && problem.code === 'twoSyllables') {
    // K1 — one sentence, and each syllable offered as a one-tap correction.
    return (
      <>
        <AppText role="body">{strings.editorTwoSyllables(looked.text)}</AppText>
        <View style={styles.tileRow}>
          {problem.syllables.map((s) => (
            <UnitTile key={s} glyph={s} role="role2" onPress={() => onPickReading({ text: s })} />
          ))}
        </View>
        <PrimaryButton label={strings.editorSaveAnyway} onPress={onSaveForLater} tone="plain" />
      </>
    );
  }

  if (problem && problem.code === 'notOnTheAlphabet') {
    // **S13 — not on the board yet** (`ui.md` §13.5). Revision 5 makes this rare: the
    // board is the whole alphabet, so only a character outside it can arrive here.
    return (
      <>
        <AppText role="body">{strings.editorNotOnAlphabet(problem.characters)}</AppText>
        <View style={styles.tileRow}>
          {problem.characters.map((c) => <UnitTile key={c} glyph={c} flat />)}
        </View>
        <AppText role="secondary" colour={theme.inkSoft} style={styles.hint}>
          {strings.editorNotOnAlphabetBody}
        </AppText>
        <PrimaryButton label={strings.editorSaveAnyway} onPress={onSaveForLater} tone="plain" />
      </>
    );
  }

  if (problem && problem.code === 'unknownRime') {
    // K2 — name what was recognised and what was not, and offer **Add this rime**.
    return (
      <>
        {problem.onset ? <AppText role="body">{strings.editorKnowOnset(problem.onset)}</AppText> : null}
        <AppText role="body">{strings.editorUnknownRime(problem.rime)}</AppText>
        <View style={styles.tileRow}>
          {problem.onset ? <UnitTile glyph={problem.onset} role="role1" /> : null}
          <UnitTile glyph={problem.rime} role="role2" flat />
        </View>
        {pack.language === 'vi' ? (
          <PrimaryButton
            label={strings.editorAddRime(problem.rime)}
            onPress={() => onAddRime(problem.rime)}
          />
        ) : null}
        <PrimaryButton label={strings.editorSaveAnyway} onPress={onSaveForLater} tone="plain" />
      </>
    );
  }

  if (problem && (problem.code === 'noParse' || problem.code === 'unknownOnset' || problem.code === 'empty')) {
    // K7 — nothing recognised at all: she still saves picture + sound.
    return (
      <>
        <AppText role="body">{strings.editorNoParse}</AppText>
        <PrimaryButton label={strings.editorSaveAnyway} onPress={onSaveForLater} tone="plain" />
      </>
    );
  }

  if (problem && problem.code === 'illegalSpelling') {
    return (
      <>
        <AppText role="body">{strings.editorIllegalSpelling(problem.detail)}</AppText>
        <PrimaryButton label={strings.editorSaveAnyway} onPress={onSaveForLater} tone="plain" />
      </>
    );
  }

  const choice = looked.choice;
  const tone = pack.language === 'vi'
    ? pack.tiles.tone.find((t) => t.id === choice.tone) ?? null
    : null;
  const taps = choice.letters.length + (tone ? 1 : 0);

  return (
    <>
      {/* J5 — the decomposition **as real game tiles with their role bars**, plus the
          composed spelling. Revision 5 moved these off the board: `pack.tiles` is the
          model and the editor's vocabulary now (`content-pipeline.md` §3.7), so they are
          the parts she reads rather than the cells he presses. */}
      <View style={styles.tileRow}>
        {pack.language === 'vi' ? (
          <>
            {choice.onset ? <UnitTile glyph={choice.onset} role="role1" /> : null}
            <UnitTile glyph={choice.rime} role="role2" />
            <UnitTile glyph={tone ? tone.label : choice.tone} role="role3" />
          </>
        ) : choice.units.map((u, i) => (
          // eslint-disable-next-line react/no-array-index-key -- a word may repeat a sound
          <UnitTile key={`${u.id}-${i}`} glyph={u.id} role={u.isVowel ? 'role2' : 'role1'} />
        ))}
      </View>
      <PlainGlyph text={looked.text} size={32} style={styles.spelling} />

      {/* **S19 — the confirm screen** (§13.3a). It appears only when one sound is written
          with more than one letter, because that is the only case where the number of
          taps is not the number of letters she can see. `bò` skips it entirely. */}
      {looked.needsConfirm ? (
        <>
          <AppText role="body" style={styles.hint}>{strings.editorWillTap}</AppText>
          <TapStrip letters={choice.letters} spans={spansOf(choice)} tone={tone} />
          <AppText role="secondary" colour={theme.inkSoft}>{strings.editorTapCount(taps)}</AppText>
        </>
      ) : null}

      {/* More than one reading is real — `già` is `gi`+`a` or `g`+`ia`, and they put the
          boundary in different places. The best one is chosen; the others are offered,
          drawn as the boundary she would get. */}
      {looked.parses.length > 1 ? (
        <Pressable
          onPress={() => onPickReading({ parseIndex: (draft.parseIndex + 1) % looked.parses.length })}
          accessibilityRole="button"
          style={styles.altRow}
        >
          <AppText role="secondary" colour={theme.accentFace}>{strings.editorOtherReading}</AppText>
        </Pressable>
      ) : null}

      <PrimaryButton label={strings.editorNext} onPress={onNext} />
    </>
  );
}

/* --------------------------------------------------------- step 3b: add a rime (S12) */

/**
 * K3, K4, K5 — **all six toned forms are generated and shown**, the illegal ones greyed
 * per the checked-syllable rule, and tapping one makes it editable. Composition happens
 * **once, here, in front of a human**, and what is written to the pack is the string she
 * approved (`literacy-vi.md` §5.4).
 */
function AddRimeScreen({ strings, rime, onSave, onBack, modeTitle }) {
  const theme = useTheme();
  const [proposal] = useState(() => viRimeProposal(rime));
  const [forms, setForms] = useState(() => proposal.toned);
  const [editing, setEditing] = useState(null);

  return (
    <ParentScreen title={strings.editorAddRimeTitle(proposal.id)} modeTitle={modeTitle} onBack={onBack}>
      <AppText role="secondary" colour={theme.inkSoft} style={styles.hint}>
        {strings.editorAddRimeHint}
      </AppText>
      <View style={styles.tileRow}>
        {proposal.cells.map((cell) => (
          <Pressable
            key={cell.tone}
            disabled={!cell.legal}
            onPress={() => setEditing(cell.tone)}
            accessibilityRole="button"
            style={[styles.rimeCell, {
              borderColor: editing === cell.tone ? theme.accentFace : theme.hairline,
              backgroundColor: cell.legal ? theme.tileFace : 'transparent',
              opacity: cell.legal ? 1 : 0.45,
            }]}
          >
            {editing === cell.tone ? (
              <TextInput
                value={forms[cell.tone] ?? ''}
                onChangeText={(v) => setForms((f) => ({ ...f, [cell.tone]: v }))}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.rimeInput, { color: theme.ink }]}
              />
            ) : (
              <PlainGlyph
                text={forms[cell.tone] ?? proposal.id}
                size={22}
                colour={cell.legal ? theme.ink : theme.inkSoft}
              />
            )}
          </Pressable>
        ))}
      </View>
      <PrimaryButton
        label={strings.editorAddRime(proposal.id)}
        onPress={() => onSave({ ...proposal, toned: forms })}
      />
    </ParentScreen>
  );
}

/* -------------------------------------------------------------------- step 4: sound */

function SoundStep({ strings, draft, onRecorded, onUseShipped, shipped, onNext, audio, sourceFor }) {
  const theme = useTheme();
  const { recorder, state } = useRecorder();
  const timers = useRef(null);
  if (timers.current === null) timers.current = createTimerBag();
  const [recording, setRecording] = useState(false);
  const [denied, setDenied] = useState(false);

  // **Every timer, with explicit cleanup.** The 3 s cap is a timer, and a recorder left
  // running when she backs out of the screen is a microphone left on.
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
    if (clip) onRecorded(clip);
  }, [recorder, onRecorded]);

  const start = useCallback(async () => {
    if (!CAPTURE_AVAILABLE) { setDenied(true); return; }
    const begun = await beginRecording(recorder);
    if (begun.denied) { setDenied(true); return; }
    setDenied(false);
    setRecording(true);
    // J7 — recording stops at 3 s whether or not she lets go.
    timers.current.set('cap', () => { stop(); }, RECORD_MS);
  }, [recorder, stop]);

  const level = Math.max(0, Math.min(1, ((state.metering ?? -60) + 60) / 60));

  return (
    <>
      <Pressable
        onPressIn={start}
        onPressOut={recording ? stop : null}
        // N1 — `react-native-web` defaults `delayPressIn` to 50 ms, which drops a short
        // press entirely. A hold-to-record button that ignores a quick press looks broken.
        delayPressIn={0}
        accessibilityRole="button"
        accessibilityLabel={strings.editorHoldToRecord}
        style={[styles.record, {
          backgroundColor: recording ? theme.role1Edge : theme.accentFace,
          borderColor: theme.groundAlt,
        }]}
      >
        <View style={[styles.recordDot, { backgroundColor: theme.groundAlt }]} />
      </Pressable>
      <AppText role="secondary" colour={theme.inkSoft} style={styles.centred}>
        {strings.editorHoldToRecord}
      </AppText>

      {/* J7 — a live waveform while recording. Bars, from the recorder's own metering. */}
      {recording ? (
        <View style={styles.wave}>
          {Array.from({ length: 16 }, (_, i) => (
            <View
              // eslint-disable-next-line react/no-array-index-key -- a fixed bar count
              key={i}
              style={{
                width: 4,
                marginHorizontal: 2,
                borderRadius: 2,
                height: 4 + Math.round(level * 36 * (0.4 + 0.6 * Math.abs(Math.sin(i + level * 6)))),
                backgroundColor: theme.role1Edge,
              }}
            />
          ))}
        </View>
      ) : null}

      {denied ? (
        <AppText role="secondary" colour={theme.rewardEdge} style={styles.hint}>
          {CAPTURE_AVAILABLE ? strings.editorDenied : strings.editorCaptureUnavailable}
        </AppText>
      ) : null}

      {draft.audio.word ? (
        <View style={styles.row}>
          <Pressable
            onPress={() => audio.playSpeech(sourceFor(draft.audio.word.src))}
            accessibilityRole="button"
            style={styles.link}
          >
            <AppText role="button" colour={theme.accentFace}>{strings.editorPlayback}</AppText>
          </Pressable>
          {/* J8 — re-recording replaces the previous one, with no limit on retries. */}
          <Pressable onPress={start} accessibilityRole="button" style={styles.link}>
            <AppText role="button" colour={theme.accentFace}>{strings.editorReRecord}</AppText>
          </Pressable>
        </View>
      ) : null}

      {/* J6 — offered **only** if a shipped clip exists for that exact word. Recording is
          pre-selected: this is the alternative, not the default. */}
      {shipped ? (
        <Pressable onPress={onUseShipped} accessibilityRole="button" style={styles.link}>
          <AppText role="body" colour={theme.accentFace}>{strings.editorUseShipped}</AppText>
        </Pressable>
      ) : null}

      <PrimaryButton
        label={strings.editorNext}
        onPress={onNext}
        disabled={!draft.audio.word}
      />
      {!draft.audio.word ? (
        <AppText role="secondary" colour={theme.inkSoft} style={styles.hint}>
          {strings.editorNeedSound}
        </AppText>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ the flow itself */

export function AddWordFlow({
  strings, pack, packId, draft, setDraft, onSave, onCancel, onDelete, sourceFor, audio,
  settings, onAddRime, onAttachImage, onRemoveImage, onRecorded, onUseShipped,
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [rimeToAdd, setRimeToAdd] = useState(null);

  const looked = analyse(pack, draft.text, draft.parseIndex ?? 0);
  const shipped = pack.words.find((w) => w.text === looked.text) ?? null;

  const advance = (next) => {
    // **J4 — the draft is written after every screen**, before it is valid.
    onSave(draft, { final: false });
    setStep(next);
  };

  if (rimeToAdd !== null) {
    return (
      <AddRimeScreen
        strings={strings}
        rime={rimeToAdd}
        modeTitle={strings.modeTitle}
        onBack={() => setRimeToAdd(null)}
        onSave={(proposal) => { onAddRime(proposal); setRimeToAdd(null); }}
      />
    );
  }

  const title = [
    strings.editorStepPicture, strings.editorStepWord, strings.editorStepTiles,
    strings.editorStepSound, strings.editorStepPreview,
  ][step];

  // **J9 is a board, so it gets a screen.** The preview is the one editor step that is
  // not a form: it is the real `BoardVi` / `BoardEn` at the real size, outside the parent
  // chrome, because a board squeezed into a 520 pt column with a scroll view around it
  // would be a picture of the game rather than the game. Two buttons sit under it.
  if (STEPS[step] === 'preview') {
    return (
      <View style={styles.previewRoot}>
        <PreviewBoard
          language={pack.language}
          packId={packId}
          draft={draft}
          looked={looked}
          strings={strings}
          settings={settings}
          audio={audio}
          reserveBottom={PREVIEW_BAR}
        />
        {/* **The bar is charged to the board as a safe-area inset**, not taken off a board
            already laid out for the whole screen: the second is what clipped the table's
            first and last rows at 430 × 932 in a browser. `PreviewBoard` passes it to
            `usePagePlan`, so the board is the real board, by the real law, on a screen
            this much shorter. */}
        <View style={[styles.previewBar, {
          height: PREVIEW_BAR + insets.bottom,
          backgroundColor: theme.groundAlt,
          borderColor: theme.hairline,
          paddingBottom: insets.bottom,
        }]}
        >
          <AppText role="secondary" colour={theme.inkSoft} numberOfLines={2} style={styles.previewHint}>
            {strings.editorPreviewHint}
          </AppText>
          <View style={styles.previewButtons}>
            <View style={styles.previewButton}>
              <PrimaryButton label={strings.editorConfirm} onPress={() => onSave(draft, { final: true })} />
            </View>
            <View style={styles.previewButton}>
              <PrimaryButton label={strings.editorFix} onPress={() => setStep(0)} tone="plain" />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ParentScreen
      title={title}
      modeTitle={strings.modeTitle}
      onBack={() => (step === 0 ? onCancel() : setStep(step - 1))}
    >
      {STEPS[step] === 'picture' ? (
        <PictureStep
          strings={strings}
          draft={draft}
          sourceFor={sourceFor}
          onPick={(asset, source) => setDraft((d) => onAttachImage(d, asset, source))}
          onRemove={(i) => setDraft((d) => onRemoveImage(d, i))}
          onNext={() => advance(1)}
        />
      ) : null}

      {STEPS[step] === 'word' ? (
        <WordStep
          strings={strings}
          draft={draft}
          onChange={(text) => setDraft((d) => ({ ...d, text, parseIndex: 0 }))}
          onNext={() => advance(2)}
        />
      ) : null}

      {STEPS[step] === 'tiles' ? (
        <TilesStep
          strings={strings}
          pack={pack}
          looked={looked}
          draft={draft}
          onPickReading={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          onAddRime={setRimeToAdd}
          onNext={() => advance(3)}
          onSaveForLater={() => { onSave(draft, { final: false }); onCancel(); }}
        />
      ) : null}

      {STEPS[step] === 'sound' ? (
        <SoundStep
          strings={strings}
          draft={draft}
          audio={audio}
          sourceFor={sourceFor}
          shipped={shipped && shipped.audio.word ? shipped.audio.word : null}
          onRecorded={(clip) => setDraft((d) => onRecorded(d, clip))}
          onUseShipped={() => setDraft((d) => onUseShipped(d))}
          onNext={() => advance(4)}
        />
      ) : null}

      {/* §13.4 — Delete at the foot of the edit screen, for a word that already exists. */}
      {onDelete && step === 0 ? (
        <Pressable onPress={onDelete} accessibilityRole="button" style={styles.delete}>
          <AppText role="button" colour={theme.role1Edge}>{strings.editorDelete}</AppText>
        </Pressable>
      ) : null}
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  hint: { marginTop: 8, marginBottom: 8 },
  centred: { textAlign: 'center', marginTop: 8 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap' },
  photo: {
    width: 96, height: 96, borderRadius: 12, borderWidth: 1, overflow: 'hidden',
    marginRight: 8, marginBottom: 8,
  },
  field: {
    minHeight: 56, borderRadius: 12, borderWidth: 1, justifyContent: 'center',
    paddingHorizontal: 12,
  },
  fieldInput: { fontSize: 24, minHeight: 48 },
  tileRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  spelling: { alignItems: 'flex-start', marginTop: 4 },
  altRow: { minHeight: 44, justifyContent: 'center' },
  rimeCell: {
    minWidth: 72, minHeight: 56, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 8,
  },
  rimeInput: { fontSize: 20, textAlign: 'center', minWidth: 60, minHeight: 44 },
  record: {
    width: 96, height: 96, borderRadius: 48, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 16,
  },
  recordDot: { width: 28, height: 28, borderRadius: 14 },
  wave: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 48, marginTop: 8,
  },
  row: { flexDirection: 'row', marginTop: 8 },
  link: { minHeight: 44, justifyContent: 'center', marginRight: 24 },
  delete: { minHeight: 56, justifyContent: 'center', marginTop: 32 },
  previewRoot: { flex: 1 },
  previewBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    borderTopWidth: 1, paddingHorizontal: 16,
  },
  previewHint: { marginTop: 8 },
  previewButtons: { flexDirection: 'row' },
  previewButton: { flex: 1, marginRight: 8 },
});
