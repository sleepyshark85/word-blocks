// Every string the Vietnamese build renders. `acceptance-criteria.md` R7: the parent
// surfaces are rendered entirely in the app's chosen language — there is no English on
// any screen of a Vietnamese session except the chooser (R3).

export default {
  modeTitle: 'Ghép Chữ',
  languageName: 'Tiếng Việt',
  sampleWord: 'mèo',

  start: 'Bắt đầu',
  back: 'Quay lại',

  gateTitle: 'Nhập kết quả',
  gateTimes: 'nhân',
  gateWrong: 'Chưa đúng',
  gateCooldown: (seconds) => `Thử lại sau ${seconds} giây`,
  numberWords: { 3: 'ba', 4: 'bốn', 5: 'năm', 6: 'sáu', 7: 'bảy', 8: 'tám', 9: 'chín' },

  menuTitle: 'Cài đặt',
  menuAddWord: 'Thêm từ',
  menuWords: 'Từ vựng',
  menuFinish: 'Kết thúc',
  menuLanguage: 'Ngôn ngữ',
  menuVoice: 'Giọng nói và tốc độ',
  menuMotion: 'Chuyển động và âm thanh',
  menuAbout: 'Giới thiệu',
  comingInLaterSlice: 'Phần này chưa có trong bản này.',

  settingShowWord: 'Hiện từ',
  settingReduceMotion: 'Giảm chuyển động',
  settingMute: 'Tắt tiếng',
  settingSaySentence: 'Đọc câu sau từ',
  settingRate: 'Tốc độ đọc',
  settingTheme: 'Màu sắc',
  settingFollowSystem: 'Theo hệ thống',
  on: 'Bật',
  off: 'Tắt',

  languageSwitchWarning: 'Đổi ngôn ngữ sẽ bắt đầu lại trò chơi.',

  tooSmallTitle: 'Màn hình quá nhỏ',
  tooSmallBody: 'Trò chơi cần màn hình rộng ít nhất 360 và cao 600. Hãy thử trên máy khác.',

  emptyTitle: 'Chưa có từ nào để chơi',
  emptyBody: 'Mỗi từ cần hình ảnh, âm thanh và các phần của nó.',

  aboutTitle: 'Giới thiệu',
  aboutVersion: (v) => `Phiên bản ${v}`,
  aboutAttributionTitle: 'Nguồn hình ảnh và âm thanh',
};
