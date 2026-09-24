// Every string the Vietnamese build renders. `acceptance-criteria.md` R7: the parent
// surfaces are rendered entirely in the app's chosen language — there is no English on
// any screen of a Vietnamese session except the chooser (R3).

export default {
  modeTitle: 'Ghép Chữ',

  /**
   * `ui.md` §12 — the board exposes **one** accessibility element describing the state.
   * Individual tiles are hidden from the screen reader on purpose: letting it speak
   * letter *names* over a game whose entire thesis is letter *sounds* would teach the
   * opposite of the app.
   */
  boardA11y: (placed, live) => (placed.length === 0
    ? `Đang ghép một từ. Chưa có phần nào. ${live} ô đang chờ.`
    : `Đang ghép một từ. Đã đặt ${placed.join(', ')}. ${live} ô có thể theo sau.`),

  /**
   * `ui.md` §12 — **the page rail is a second accessibility element**, describing the
   * pages and which of them hold something live. The child never hears it; his mother
   * might, and a rail that a screen reader cannot describe is a control that does not
   * exist for her.
   */
  railA11y: (page, total, livePages) => (livePages.length === 0
    ? `Trang ${page} trên ${total}.`
    : `Trang ${page} trên ${total}. Có ô để bấm ở trang ${livePages.join(', ')}.`),

  languageName: 'Tiếng Việt',

  start: 'Bắt đầu',
  back: 'Quay lại',

  /**
   * **Revision 6, `ui.md` §9.4b.** The parent door's label. **A word, not an icon**: an
   * icon is a picture and pictures are the child's channel in this app — a gear is
   * interesting to a 4-year-old and a word is furniture. It is the one material the app
   * deliberately denies him, which is the same instrument the lock behind it uses.
   *
   * Its advance width is a layout constant (`DOOR_LABEL_PT`), and `test/topbar.test.mjs`
   * measures **this string** against the door's reserved 65 pt from the shipped font file.
   * Lengthening it is not free: F22 fails.
   */
  parentDoor: 'Cha mẹ',
  /** §9.4b / I2 — what the silent hold hint says when the door is *tapped*. */
  holdHint: 'Giữ',

  gateTitle: 'Nhập kết quả',
  gateTimes: 'nhân',
  gateWrong: 'Chưa đúng',
  gateCooldown: (seconds) => `Thử lại sau ${seconds} giây`,
  numberWords: { 3: 'ba', 4: 'bốn', 5: 'năm', 6: 'sáu', 7: 'bảy', 8: 'tám', 9: 'chín' },

  menuTitle: 'Cài đặt',
  /**
   * **Revision 6 folds `Thêm từ` into this row** (I8, I9, `gameplay.md` §7.3). Revision
   * 5's answer to *"where is the screen for me to add/edit/delete words?"* was two rows,
   * three apart, that both led to the editor — which makes neither of them the editor.
   * One row now, and the detail line names the three verbs he asked about.
   */
  menuWords: 'Từ vựng',
  menuWordsDetail: 'thêm, sửa, xoá',
  menuFinish: 'Kết thúc',
  menuLanguage: 'Ngôn ngữ',
  menuVoice: 'Giọng nói và tốc độ',
  menuMotion: 'Chuyển động và âm thanh',
  menuAbout: 'Giới thiệu',

  settingShowWord: 'Hiện từ',
  settingReduceMotion: 'Giảm chuyển động',
  settingMute: 'Tắt tiếng',
  settingSaySentence: 'Đọc câu sau từ',
  settingRate: 'Tốc độ đọc',
  settingTheme: 'Màu sắc',
  settingFollowSystem: 'Theo hệ thống',
  on: 'Bật',
  off: 'Tắt',

  languageSwitchWarning: 'Chạm một lần để đổi. Bàn chơi bắt đầu lại; bộ sưu tập được giữ nguyên.',

  tooSmallTitle: 'Màn hình quá nhỏ',
  tooSmallBody: 'Trò chơi cần màn hình rộng ít nhất 360 và cao 600. Hãy thử trên máy khác.',

  emptyTitle: 'Chưa có từ nào để chơi',
  emptyBody: 'Mỗi từ cần hình ảnh, âm thanh và các phần của nó.',

  /* ------------------------------------------------------------ Slice 4: the editor
     `ui.md` §13. Every string here is HERS. `acceptance-criteria.md` R7 keeps the
     parent surfaces entirely in the app's chosen language, and K6 keeps the word
     "invalid" — and its translation — off every one of these screens. */
  editorListTitle: 'Từ vựng',
  editorSearch: 'Tìm',
  editorSectionNotYet: (n) => `Chưa chơi được (${n})`,
  editorSectionDeleted: (n) => `Đã xoá (${n})`,
  editorUnreadable: (n) => `${n} từ không đọc được. Bạn có thể sửa hoặc xoá.`,
  editorEmptyList: 'Chưa có từ nào. Chạm dấu + để thêm.',
  editorAdd: 'Thêm từ',
  editorEdit: 'Sửa từ',
  editorNoPack: 'Bản này không lưu được từ mới.',

  editorStepPicture: 'Ảnh của từ',
  editorTakePhoto: 'Chụp ảnh',
  editorChoosePhoto: 'Chọn từ thư viện',
  editorAddPhoto: '+ thêm ảnh',
  editorRemovePhoto: 'Bỏ ảnh này',
  editorPhotoHint: 'Ảnh là phần thưởng, không phải gợi ý. Bé sẽ thấy ảnh sau khi ghép xong từ.',
  editorNeedPhoto: 'Cần ít nhất một ảnh.',
  editorDenied: 'Máy chưa cho phép. Hãy bật quyền trong Cài đặt của máy.',
  editorCaptureUnavailable: 'Bản chạy trên trình duyệt không ghi âm được.',

  editorStepWord: 'Viết từ',
  editorWordHint: 'Dùng bàn phím tiếng Việt của điện thoại.',
  editorWordPlaceholder: 'ví dụ: mèo',

  editorStepTiles: 'Các phần của từ',
  editorWillTap: 'Bé sẽ bấm:',
  editorTapCount: (n) => `${n} lần bấm`,
  editorOtherReading: 'Cách đọc khác',
  editorNext: 'Tiếp',
  editorDone: 'Xong',

  editorStepSound: 'Giọng nói',
  editorHoldToRecord: 'Giữ để ghi âm (3 giây)',
  editorPlayback: 'Nghe lại',
  editorReRecord: 'Ghi lại',
  editorUseShipped: 'Dùng giọng có sẵn',
  editorNeedSound: 'Cần một tiếng đọc từ này.',

  editorStepPreview: 'Thử chơi',
  editorPreviewHint: 'Đây là bàn chơi thật. Ảnh chỉ hiện ra sau khi ghép xong từ.',
  editorConfirm: 'Đúng rồi',
  editorFix: 'Sửa',
  editorSaveForLater: 'Lưu để sau',

  editorDeleteTitle: (w) => `Xoá “${w}”?`,
  editorDelete: 'Xoá',
  editorCancel: 'Bỏ qua',
  editorUndo: 'Hoàn tác',
  editorDeleted: (w) => `Đã xoá “${w}”`,
  editorRestore: 'Khôi phục',
  editorDaysLeft: (n) => `còn ${n} ngày`,

  editorCheerTitle: 'Tiếng reo mừng',
  editorCheerBody: 'Khi bé ghép được một từ, bé sẽ nghe tiếng nhạc — và giọng của mẹ, nếu mẹ muốn.',
  editorCheerHold: 'Giữ để ghi (2 giây)',
  editorCheerPreview: 'Nghe thử',
  editorCheerRemove: 'Bỏ',
  editorCheerLater: 'Để sau',

  editorAddRimeTitle: (r) => `vần “${r}” — sáu thanh`,
  editorAddRimeHint: 'Chạm để sửa cách viết.',
  editorAddRime: (r) => `Thêm vần “${r}”`,
  editorRimeSaved: (r) => `Đã thêm vần “${r}”.`,

  editorKnowOnset: (o) => `Tôi biết “${o}”.`,
  editorUnknownRime: (r) => `Chưa biết vần “${r}”.`,
  editorTwoSyllables: (w) => `“${w}” có hai tiếng. Trò chơi ghép một tiếng mỗi lần.`,
  editorTrySyllable: (s) => `Dùng “${s}”`,
  editorNotOnAlphabet: (cs) => `Bảng chữ của trò chơi không có ${cs.map((c) => `“${c}”`).join(', ')}.`,
  editorNotOnAlphabetBody: 'Bảng chữ là bảng chữ cái tiếng Việt. Từ này vẫn được lưu kèm ảnh và tiếng.',
  editorTooLongTitle: (w, n) => `“${w}” có ${n} chữ cái.`,
  editorTooLongBody: (max) => `Bảng chữ chứa được ${max}.`,
  editorTooLongKept: 'Từ vẫn được lưu kèm ảnh và tiếng, trong mục “Chưa chơi được”.',
  editorNoParse: 'Chưa nhận ra từ này. Vẫn lưu được kèm ảnh và tiếng.',
  editorIllegalSpelling: (d) => d,
  editorSaveAnyway: 'Lưu kèm ảnh và tiếng',

  /** One line per row of §13.1 — the reason, in her words. */
  editorReason: {
    empty: 'chưa viết từ',
    draft: 'đang thêm',
    twoSyllables: 'hai tiếng',
    notOnTheAlphabet: 'có chữ ngoài bảng chữ cái',
    unknownRime: 'chưa biết vần này',
    unknownOnset: 'chưa biết âm đầu này',
    noParse: 'chưa nhận ra các phần',
    illegalSpelling: 'cách viết chưa đúng',
    tooLong: 'dài hơn bảng chữ',
    noPicture: 'cần ảnh',
    noWordAudio: 'cần ghi âm',
    disabled: 'đang tắt',
    duplicateParts: 'trùng các phần với từ khác',
    duplicateId: 'trùng mã với từ khác',
    unknown: 'chưa chơi được',
  },

  aboutTitle: 'Giới thiệu',
  aboutVersion: (v) => `Phiên bản ${v}`,
  aboutAttributionTitle: 'Nguồn hình ảnh và âm thanh',
  /**
   * **N11a / E10a — dòng chẩn đoán âm thanh.** Không ai trong nhóm có iPhone, nên đây là
   * bằng chứng thay cho câu "vẫn im lặng": số bộ phát đang giữ, mức trần hiện tại, và số
   * lần máy không tạo được bộ phát. `lỗi 0` nghĩa là hệ thống âm thanh vẫn còn nguyên.
   */
  aboutAudioTitle: 'Âm thanh (dành cho người sửa lỗi)',
  aboutAudio: (s) => `Bộ phát: ${s.live}/${s.max} · đã tạo ${s.created} · lỗi ${s.failed} · câm ${s.silenced}`,
  aboutAudioHealthy: 'Không có lỗi bộ phát nào.',
  aboutAudioFailing: (s) => `Có ${s.failed} lần không tạo được bộ phát. Máy đã hạ mức trần xuống ${s.max}. Báo lại con số này.`,
};
