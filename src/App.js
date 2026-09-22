// The app shell: fonts, settings, the language gate, and which screen is on.
//
// `gameplay.md` §7.1 — the language is chosen once and **changing it tears the game down
// and rebuilds it**: the pack is unloaded, the engine re-seeded, the queue rebuilt, and
// no screen, cache or in-memory object survives. That is bought here with a React `key`
// on the game subtree, which is the cheapest correct way to say *unmount everything*
// (`acceptance-criteria.md` A9, A10, R6).

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo, ActivityIndicator, Platform, StyleSheet, View, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

import { ThemeProvider, themeTokens, DEFAULT_THEME } from './theme';
import { FONT_ASSETS } from './ui/typography';
import { stringsFor, chooserPanels } from './i18n';
import { loadPack, emojiSource, sampleWordSource } from './content/loadPack';
import { readSettings, writeSettings } from './settings/settings';
import { createAudioEngine, configureAudioSession } from './audio/engine';
import { useGame } from './state/useGame';
import { MIN_VIEWPORT } from './layout/layout.mjs';
import { applyOrientationPolicy } from './layout/orientation';
import { BoardVi } from './ui/screens/BoardVi';
import { BoardEn } from './ui/screens/BoardEn';
import { AlbumScreen } from './ui/screens/AlbumScreen';
import { ChooserScreen } from './ui/screens/ChooserScreen';
import { GateScreen } from './ui/screens/GateScreen';
import { ParentMenu } from './ui/screens/ParentMenu';
import { CardScreen } from './ui/screens/CardScreen';

const VERSION = '0.1.0';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** `ui.md` §13.5 E10 — the About screen's credits, computed from the live pack. */
function attributionsOf(pack) {
  const lines = new Set();
  for (const word of pack.words) {
    if (word.images.length === 0 && word.fallbackEmoji) {
      lines.add('Fluent Emoji 3D — Microsoft, MIT licence');
    }
    if (word.audio.word) lines.add('Speech generated for this app');
  }
  return [...lines].sort();
}

/** One round of one language, plus everything that can sit over it. */
function Game({
  pack, mediaSource, audio, settings, setSettings, themeId, setThemeId,
  onSwitchLanguage, seed,
}) {
  const strings = stringsFor(pack.language);
  const [overlay, setOverlay] = useState(null); // 'gate' | 'menu' | null
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => { if (alive) setSystemReduceMotion(Boolean(v)); })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReduceMotion);
    return () => { alive = false; sub.remove(); };
  }, []);

  // `ui.md` §10.5 — follows the OS setting, overridable in the parent menu (O4, O6).
  const reduced = settings.reduceMotion === null ? systemReduceMotion : settings.reduceMotion;

  const { controller, snapshot } = useGame({ pack, seed, mediaSource, audio, settings });

  const sourceFor = useMemo(() => {
    const fn = (ref) => (ref ? mediaSource(ref.src ?? ref) : null);
    fn.emoji = emojiSource;
    return fn;
  }, [mediaSource]);

  if (!controller || !snapshot) {
    return <View style={styles.centre}><ActivityIndicator /></View>;
  }

  if (overlay === 'gate') {
    return (
      <GateScreen
        strings={strings}
        onBack={() => setOverlay(null)}
        onPass={() => setOverlay('menu')}
      />
    );
  }

  if (overlay === 'menu') {
    return (
      <ParentMenu
        strings={strings}
        language={pack.language}
        settings={settings}
        onSetting={(patch) => setSettings((s) => ({ ...s, ...patch }))}
        themeId={themeId}
        onSelectTheme={setThemeId}
        attributions={attributionsOf(pack)}
        version={VERSION}
        onBack={() => setOverlay(null)}
        onFinishSession={() => { controller.finishSession(); setOverlay(null); }}
        onSwitchLanguage={(lang) => { setOverlay(null); onSwitchLanguage(lang); }}
      />
    );
  }

  if (snapshot.phase === 'empty') {
    // `acceptance-criteria.md` L6, K9 — a parent-facing card, not a crash, not a blank
    // board. The child never meets this screen; the adult who can fix it does.
    return <CardScreen title={strings.emptyTitle} body={strings.emptyBody} modeTitle={strings.modeTitle} />;
  }

  if (snapshot.phase === 'album' || snapshot.phase === 'ended') {
    const ended = snapshot.phase === 'ended';
    return (
      <AlbumScreen
        entries={ended ? snapshot.album : snapshot.page}
        strings={strings}
        themeId={themeId}
        onSelectTheme={ended ? null : setThemeId}
        onPlay={ended ? null : () => controller.nextPage()}
        onTapEntry={ended ? null : (entry) => controller.tapAlbum(entry)}
        onOpenGate={() => setOverlay('gate')}
        reduced={reduced}
        sourceFor={sourceFor}
      />
    );
  }

  const Board = pack.language === 'vi' ? BoardVi : BoardEn;
  return (
    <Board
      snapshot={snapshot}
      controller={controller}
      strings={strings}
      reduced={reduced}
      sourceFor={sourceFor}
      onOpenGate={() => setOverlay('gate')}
    />
  );
}

function Shell() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const [settings, setSettings] = useState(null);
  const [loaded, setLoaded] = useState(null); // { pack, mediaSource, audio } | { error }
  const [generation, setGeneration] = useState(0);
  const { width, height } = useWindowDimensions();

  const insets = useSafeAreaInsets();

  useEffect(() => {
    let alive = true;
    readSettings().then((s) => { if (alive) setSettings(s); });
    configureAudioSession();
    return () => { alive = false; };
  }, []);

  // `gameplay.md` §1.1 — decided once at startup from the screen metrics, never per
  // frame, so the device cannot flip-flop (P7, P8).
  const orientationDecided = useRef(false);
  useEffect(() => {
    if (orientationDecided.current || !width || !height) return;
    orientationDecided.current = true;
    applyOrientationPolicy({ width, height }, insets);
  }, [width, height, insets]);

  useEffect(() => {
    if (!settings) return;
    writeSettings(settings);
  }, [settings]);

  const themeId = settings ? settings.theme : DEFAULT_THEME;
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(themeTokens(themeId).ground).catch(() => {});
  }, [themeId]);

  const language = settings ? settings.language : null;

  useEffect(() => {
    if (!language) { setLoaded(null); return undefined; }
    let alive = true;
    let engine = null;
    try {
      const { pack, mediaSource } = loadPack(language);
      engine = createAudioEngine();
      if (alive) setLoaded({ pack, mediaSource, audio: engine });
    } catch (error) {
      if (alive) setLoaded({ error: String(error && error.message) });
    }
    return () => {
      alive = false;
      // R6 — every audio handle from the previous language is released before any new
      // one is opened. The controller disposes it too; doing it here as well is what
      // makes that true even if the controller never mounted.
      if (engine) engine.dispose();
      setLoaded(null);
    };
  }, [language, generation]);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  // A2 — a tap on a chooser panel speaks a sample word in that language. One clip, one
  // player, released as soon as the chooser is gone.
  const chooserAudio = useMemo(() => createAudioEngine(), []);
  useEffect(() => () => chooserAudio.dispose(), [chooserAudio]);
  const speakSample = useCallback((lang) => {
    const strings = stringsFor(lang);
    const source = sampleWordSource(lang, strings.sampleWord === 'cat' ? 'cat' : 'meo');
    chooserAudio.playSpeech(source);
  }, [chooserAudio]);

  const switchLanguage = useCallback((next) => {
    setSettings((s) => ({ ...s, language: next }));
    setGeneration((g) => g + 1);
  }, []);

  const body = () => {
    // `acceptance-criteria.md` Q9 — if the bundled font is not there the app does not
    // silently fall back to the system font for Vietnamese. It says so, in a language
    // that is guaranteed to render in any face.
    if (fontError) {
      return <CardScreen title="Font missing" body="The bundled Baloo 2 / Be Vietnam Pro files did not load, so Vietnamese cannot be rendered correctly. Reinstall the app." />;
    }
    if (!fontsLoaded || !settings) {
      return <View style={styles.centre}><ActivityIndicator /></View>;
    }
    // A8 — below 360 x 600 the screen-too-small card is shown and no game board mounts.
    if (width < MIN_VIEWPORT.width || height < MIN_VIEWPORT.height) {
      // Before a language is chosen this card stands in for the chooser, which is the
      // one screen `acceptance-criteria.md` R3 allows to show both languages. After one
      // is chosen it is in that language, like every other parent surface (R7). There is
      // no default onto a language, because a default *is* the leak (R4).
      const panels = chooserPanels().map((p) => stringsFor(p.language));
      const shown = language ? [stringsFor(language)] : panels;
      return (
        <CardScreen
          title={shown.map((s) => s.tooSmallTitle).join(' · ')}
          body={shown.map((s) => s.tooSmallBody).join('\n\n')}
        />
      );
    }
    if (!language) {
      return (
        <ChooserScreen
          themeId={themeId}
          onSelectTheme={(id) => setSettings((s) => ({ ...s, theme: id }))}
          onSample={speakSample}
          onConfirm={(lang) => setSettings((s) => ({ ...s, language: lang }))}
        />
      );
    }
    if (!loaded) return <View style={styles.centre}><ActivityIndicator /></View>;
    if (loaded.error) {
      const s = stringsFor(language);
      return <CardScreen title={s.emptyTitle} body={loaded.error} modeTitle={s.modeTitle} />;
    }
    return (
      <Game
        // The key is the teardown: a language switch unmounts the whole subtree.
        key={`${language}:${generation}`}
        pack={loaded.pack}
        mediaSource={loaded.mediaSource}
        audio={loaded.audio}
        settings={settings}
        setSettings={setSettings}
        themeId={themeId}
        setThemeId={(id) => setSettings((s) => ({ ...s, theme: id }))}
        onSwitchLanguage={switchLanguage}
        seed={`${language}-${settings.theme}`}
      />
    );
  };

  return (
    <ThemeProvider themeId={themeId}>
      <View style={[styles.root, { backgroundColor: themeTokens(themeId).ground }]}>
        <StatusBar style="dark" />
        {body()}
      </View>
    </ThemeProvider>
  );
}

/**
 * The provider has to sit above the shell rather than inside it, because the shell asks
 * for the safe-area insets to decide the orientation policy.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, ...(Platform.OS === 'web' ? { overflow: 'hidden' } : null) },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
