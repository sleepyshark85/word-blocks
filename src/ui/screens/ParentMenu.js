// Screen: the parent menu, and the settings screens behind it. `gameplay.md` §7.3.
//
// Exactly seven rows: Add a word · Words · Finish session · Language · Voice & pace ·
// Motion & sound · About. **No analytics, no account, no sync, no rating prompt**
// (`acceptance-criteria.md` I9), and no network call anywhere in the app including here.
//
// **Slice 4 filled in the two rows this menu used to apologise for.** *Add a word* and
// *Words* open `src/ui/screens/editor/`; *Voice & pace* gained the cheer (**I12**).

import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { useTheme } from '../../theme';
import { AppText } from '../Text';
import { ThemeButtons } from '../ThemeButtons';
import { ParentScreen, Row } from './ParentChrome';
import { chooserPanels } from '../../i18n';

function Toggle({ label, value, onChange }) {
  const theme = useTheme();
  return (
    <View style={[styles.toggleRow, { borderColor: theme.hairline }]}>
      <AppText role="body" style={styles.toggleLabel}>{label}</AppText>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.accentFace, false: theme.neutralFace }}
        thumbColor={theme.groundAlt}
      />
    </View>
  );
}

function AboutScreen({ strings, attributions, version, onBack }) {
  const theme = useTheme();
  return (
    <ParentScreen title={strings.aboutTitle} modeTitle={strings.modeTitle} onBack={onBack}>
      <AppText role="body">{strings.aboutVersion(version)}</AppText>
      <AppText role="screenTitle" style={styles.section}>{strings.aboutAttributionTitle}</AppText>
      {attributions.map((line) => (
        <AppText key={line} role="secondary" colour={theme.inkSoft} style={styles.attr}>{line}</AppText>
      ))}
    </ParentScreen>
  );
}

/**
 * `gameplay.md` §7.1 (revision 3) / AC **A9, A12, R3** — **one tap on the other language
 * switches**, with no second confirm.
 *
 * Revision 2 asked for a two-touch confirm here and framed language as "the setting with
 * the worst blast radius". The owner: *"I want to be able to change between
 * English/Vietnamese whenever I want."* The gate has already proved an adult is holding
 * the phone; asking twice is theatre. The first-launch chooser's two touches stay,
 * because there no adult has been proved.
 *
 * It is **the same chooser screen** the first launch shows (R3) — the single documented
 * screen on which both languages appear.
 */
function LanguageScreen({ strings, current, onBack, onConfirm }) {
  const theme = useTheme();
  return (
    <ParentScreen title={strings.menuLanguage} modeTitle={strings.modeTitle} onBack={onBack}>
      <AppText role="secondary" colour={theme.inkSoft}>{strings.languageSwitchWarning}</AppText>
      {chooserPanels().map((panel, i) => (
        <Row
          key={panel.language}
          first={i === 0}
          label={panel.title}
          detail={panel.subtitle}
          onPress={panel.language === current ? onBack : () => onConfirm(panel.language)}
        />
      ))}
    </ParentScreen>
  );
}

export function ParentMenu({
  strings, settings, onSetting, themeId, onSelectTheme, attributions, version,
  onBack, onFinishSession, onSwitchLanguage, language,
  onOpenWords, onOpenAddWord, onOpenCheer,
}) {
  const [screen, setScreen] = useState('menu');
  const theme = useTheme();

  if (screen === 'about') {
    return (
      <AboutScreen
        strings={strings}
        attributions={attributions}
        version={version}
        onBack={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'language') {
    return (
      <LanguageScreen
        strings={strings}
        current={language}
        onBack={() => setScreen('menu')}
        onConfirm={onSwitchLanguage}
      />
    );
  }

  if (screen === 'voice') {
    return (
      <ParentScreen title={strings.menuVoice} modeTitle={strings.modeTitle} onBack={() => setScreen('menu')}>
        {/* **I12** — the cheer lives here after the one time it is offered on its own
            (J15). Recording, replacing and removing it are all on the screen behind. */}
        <Row first label={strings.editorCheerTitle} onPress={onOpenCheer} />
        <Toggle
          label={strings.settingShowWord}
          value={settings.showWord}
          onChange={(v) => onSetting({ showWord: v })}
        />
        <Toggle
          label={strings.settingSaySentence}
          value={settings.saySentence}
          onChange={(v) => onSetting({ saySentence: v })}
        />
        <Toggle
          label={`${strings.settingRate} 0.8×`}
          value={settings.rate === 0.8}
          onChange={(v) => onSetting({ rate: v ? 0.8 : 1 })}
        />
      </ParentScreen>
    );
  }

  if (screen === 'motion') {
    return (
      <ParentScreen title={strings.menuMotion} modeTitle={strings.modeTitle} onBack={() => setScreen('menu')}>
        {/* O6 — reduce motion can be turned on or off independently of the OS setting. */}
        <Toggle
          label={strings.settingReduceMotion}
          value={settings.reduceMotion === true}
          onChange={(v) => onSetting({ reduceMotion: v ? true : null })}
        />
        <AppText role="secondary" colour={theme.inkSoft}>
          {settings.reduceMotion === null ? strings.settingFollowSystem : ''}
        </AppText>
        <Toggle
          label={strings.settingMute}
          value={settings.mute}
          onChange={(v) => onSetting({ mute: v })}
        />
        <AppText role="body" style={styles.section}>{strings.settingTheme}</AppText>
        <ThemeButtons size={56} selected={themeId} onSelect={onSelectTheme} />
      </ParentScreen>
    );
  }

  return (
    <ParentScreen title={strings.menuTitle} modeTitle={strings.modeTitle} onBack={onBack}>
      {/* `gameplay.md` §7.3 — seven rows, and **Language is row 2**, directly under
          *Add a word* (A12). It was row 4 in revision 2; the owner asked to switch
          whenever he likes, and the row he reaches for should be where he looks first. */}
      <Row first label={strings.menuAddWord} onPress={onOpenAddWord} />
      <Row label={strings.menuLanguage} onPress={() => setScreen('language')} />
      <Row label={strings.menuWords} onPress={onOpenWords} />
      <Row label={strings.menuFinish} onPress={onFinishSession} />
      <Row label={strings.menuVoice} onPress={() => setScreen('voice')} />
      <Row label={strings.menuMotion} onPress={() => setScreen('motion')} />
      <Row label={strings.menuAbout} onPress={() => setScreen('about')} />
    </ParentScreen>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
  toggleLabel: { flex: 1, paddingRight: 16 },
  section: { marginTop: 24, marginBottom: 8 },
  attr: { marginBottom: 6 },
});
