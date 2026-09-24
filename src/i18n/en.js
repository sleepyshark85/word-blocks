// Every string the English build renders. `acceptance-criteria.md` R2: no Vietnamese
// word, tile, diacritic, onset clip or tone name appears anywhere in an English session.

export default {
  modeTitle: 'Word Blocks',

  /** `ui.md` §12 — the board is one accessibility element. See the note in `vi.js`. */
  boardA11y: (placed, live) => (placed.length === 0
    ? `Building a word. Nothing placed yet. ${live} letters can start one.`
    : `Building a word. ${placed.join(', ')} placed. ${live} letters can follow.`),

  /**
   * `ui.md` §12 — **the page rail is a second accessibility element**, describing the
   * pages and which of them hold something live. The child never hears it; his mother
   * might, and a rail that a screen reader cannot describe is a control that does not
   * exist for her.
   */
  railA11y: (page, total, livePages) => (livePages.length === 0
    ? `Page ${page} of ${total}.`
    : `Page ${page} of ${total}. Something to press on page ${livePages.join(', ')}.`),

  languageName: 'English',

  start: 'Start',
  back: 'Back',

  /** **Revision 6, `ui.md` §9.4b.** The parent door's label. See the note in `vi.js`. */
  parentDoor: 'Parent',
  /** §9.4b / I2 — what the silent hold hint says when the door is *tapped*. */
  holdHint: 'Hold',

  gateTitle: 'Enter the answer',
  gateTimes: 'times',
  gateWrong: 'Not quite',
  gateCooldown: (seconds) => `Try again in ${seconds} seconds`,
  numberWords: { 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine' },

  menuTitle: 'Settings',
  /** **Revision 6 folds `Add a word` into this row** (I8, I9). See the note in `vi.js`. */
  menuWords: 'Words',
  menuWordsDetail: 'add, edit, delete',
  menuFinish: 'Finish session',
  menuLanguage: 'Language',
  menuVoice: 'Voice & pace',
  menuMotion: 'Motion & sound',
  menuAbout: 'About',

  settingShowWord: 'Show the word',
  settingReduceMotion: 'Reduce motion',
  settingMute: 'Mute',
  settingSaySentence: 'Say the sentence after the word',
  settingRate: 'Playback speed',
  settingTheme: 'Colours',
  settingFollowSystem: 'Follow the system',
  on: 'On',
  off: 'Off',

  languageSwitchWarning: 'One tap switches. The board starts again; the album is kept.',

  tooSmallTitle: 'This screen is too small',
  tooSmallBody: 'The game needs at least 360 wide and 600 tall. Please try another device.',

  emptyTitle: 'Nothing to play yet',
  emptyBody: 'Every word needs a picture, a sound and its parts.',

  /* ------------------------------------------------------------ Slice 4: the editor
     `ui.md` §13. Every string here is HERS, and the word "invalid" is not among them
     (`acceptance-criteria.md` K6). */
  editorListTitle: 'Words',
  editorSearch: 'Search',
  editorSectionNotYet: (n) => `Not playable yet (${n})`,
  editorSectionDeleted: (n) => `Recently deleted (${n})`,
  editorUnreadable: (n) => `${n} word file(s) could not be read. You can fix or delete them.`,
  editorEmptyList: 'No words yet. Tap + to add one.',
  editorAdd: 'Add a word',
  editorEdit: 'Edit word',
  editorNoPack: 'This build cannot save new words.',

  editorStepPicture: 'A picture of the word',
  editorTakePhoto: 'Take a photo',
  editorChoosePhoto: 'Choose from library',
  editorAddPhoto: '+ add another',
  editorRemovePhoto: 'Remove this picture',
  editorPhotoHint: 'The picture is the prize, not a clue. He sees it after he has built the word.',
  editorNeedPhoto: 'At least one picture is needed.',
  editorDenied: 'Permission has not been given. Turn it on in the phone settings.',
  editorCaptureUnavailable: 'Recording is not available in the browser build.',

  editorStepWord: 'Write the word',
  editorWordHint: 'Use the phone keyboard.',
  editorWordPlaceholder: 'for example: cat',

  editorStepTiles: 'The parts of the word',
  editorWillTap: 'He will tap:',
  editorTapCount: (n) => `${n} taps`,
  editorOtherReading: 'Another reading',
  editorNext: 'Next',
  editorDone: 'Done',

  editorStepSound: 'The voice',
  editorHoldToRecord: 'Hold to record (3 seconds)',
  editorPlayback: 'Play it back',
  editorReRecord: 'Record again',
  editorUseShipped: 'Use the built-in voice',
  editorNeedSound: 'A recording of the word is needed.',

  editorStepPreview: 'Try it',
  editorPreviewHint: 'This is the real board. The picture only arrives once the word is built.',
  editorConfirm: 'That is right',
  editorFix: 'Change it',
  editorSaveForLater: 'Save for later',

  editorDeleteTitle: (w) => `Delete “${w}”?`,
  editorDelete: 'Delete',
  editorCancel: 'Cancel',
  editorUndo: 'Undo',
  editorDeleted: (w) => `Deleted “${w}”`,
  editorRestore: 'Restore',
  editorDaysLeft: (n) => `${n} days left`,

  editorCheerTitle: 'The cheer',
  editorCheerBody: 'When he builds a word he hears the music — and your voice, if you want.',
  editorCheerHold: 'Hold to record (2 seconds)',
  editorCheerPreview: 'Hear it',
  editorCheerRemove: 'Remove',
  editorCheerLater: 'Not now',

  editorAddRimeTitle: (r) => `the rime “${r}” — six tones`,
  editorAddRimeHint: 'Tap one to correct its spelling.',
  editorAddRime: (r) => `Add the rime “${r}”`,
  editorRimeSaved: (r) => `Added the rime “${r}”.`,

  editorKnowOnset: (o) => `I know “${o}”.`,
  editorUnknownRime: (r) => `I do not know the part “${r}” yet.`,
  editorTwoSyllables: (w) => `“${w}” is two words. The game builds one at a time.`,
  editorTrySyllable: (s) => `Use “${s}”`,
  editorNotOnAlphabet: (cs) => `The board has no ${cs.map((c) => `“${c}”`).join(', ')}.`,
  editorNotOnAlphabetBody: 'The board is the alphabet. The word is still saved with its picture and voice.',
  editorTooLongTitle: (w, n) => `“${w}” has ${n} letters.`,
  editorTooLongBody: (max) => `The board holds ${max}.`,
  editorTooLongKept: 'The word is still saved with its picture and voice, under “Not playable yet”.',
  editorNoParse: 'I do not recognise this word yet. It can still be saved with its picture and voice.',
  editorIllegalSpelling: (d) => d,
  editorSaveAnyway: 'Save with the picture and voice',

  editorReason: {
    empty: 'no word written yet',
    draft: 'still being added',
    twoSyllables: 'two words',
    notOnTheAlphabet: 'uses a letter that is not on the board',
    unknownRime: 'an unknown part',
    unknownOnset: 'an unknown first sound',
    noParse: 'the parts are not recognised yet',
    illegalSpelling: 'the spelling is not one the game knows',
    tooLong: 'longer than the board',
    noPicture: 'needs a picture',
    noWordAudio: 'needs a recording',
    disabled: 'turned off',
    duplicateParts: 'same parts as another word',
    duplicateId: 'same id as another word',
    unknown: 'not playable yet',
  },

  aboutTitle: 'About',
  aboutVersion: (v) => `Version ${v}`,
  aboutAttributionTitle: 'Picture and sound credits',
  /**
   * **N11a / E10a — the audio diagnostic.** Nobody on this team has an iPhone, so this
   * line is what makes the next device report evidence rather than "still silent": how
   * many native players are held, what the ceiling is now, and how many failed to build.
   */
  aboutAudioTitle: 'Sound (for fixing problems)',
  aboutAudio: (s) => `Players: ${s.live}/${s.max} · built ${s.created} · failed ${s.failed} · silent ${s.silenced}`,
  aboutAudioHealthy: 'No player has failed to open.',
  aboutAudioFailing: (s) => `${s.failed} player(s) failed to open. The ceiling has been lowered to ${s.max}. Please report these numbers.`,
};
