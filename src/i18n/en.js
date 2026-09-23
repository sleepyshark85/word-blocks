// Every string the English build renders. `acceptance-criteria.md` R2: no Vietnamese
// word, tile, diacritic, onset clip or tone name appears anywhere in an English session.

export default {
  modeTitle: 'Word Blocks',

  /** `ui.md` §12 — the board is one accessibility element. See the note in `vi.js`. */
  boardA11y: (placed, live) => (placed.length === 0
    ? `Building a word. Nothing placed yet. ${live} letters can start one.`
    : `Building a word. ${placed.join(', ')} placed. ${live} letters can follow.`),

  languageName: 'English',
  sampleWord: 'cat',

  start: 'Start',
  back: 'Back',

  gateTitle: 'Enter the answer',
  gateTimes: 'times',
  gateWrong: 'Not quite',
  gateCooldown: (seconds) => `Try again in ${seconds} seconds`,
  numberWords: { 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine' },

  menuTitle: 'Settings',
  menuAddWord: 'Add a word',
  menuWords: 'Words',
  menuFinish: 'Finish session',
  menuLanguage: 'Language',
  menuVoice: 'Voice & pace',
  menuMotion: 'Motion & sound',
  menuAbout: 'About',
  comingInLaterSlice: 'This part is not in this build yet.',

  settingShowWord: 'Show the word',
  settingReduceMotion: 'Reduce motion',
  settingMute: 'Mute',
  settingSaySentence: 'Say the sentence after the word',
  settingRate: 'Playback speed',
  settingTheme: 'Colours',
  settingFollowSystem: 'Follow the system',
  on: 'On',
  off: 'Off',

  languageSwitchWarning: 'Changing the language restarts the game.',

  tooSmallTitle: 'This screen is too small',
  tooSmallBody: 'The game needs at least 360 wide and 600 tall. Please try another device.',

  emptyTitle: 'Nothing to play yet',
  emptyBody: 'Every word needs a picture, a sound and its parts.',

  aboutTitle: 'About',
  aboutVersion: (v) => `Version ${v}`,
  aboutAttributionTitle: 'Picture and sound credits',
};
