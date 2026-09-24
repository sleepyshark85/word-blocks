// The app shell: fonts, settings, the language chooser, and which screen is on.
//
// **`gameplay.md` §7.1, revision 6 — the language is the CHILD's, and a switch is still a
// TEARDOWN.** The board's top-left control opens the chooser in one tap, with no gate, no
// hold and no multiplication (`ui.md` §9.4a); the parent menu's *Language* row survives as
// a second route to the same screen and the same code path.
//
// **R1–R5 are not weakened by the switch becoming cheap, and that is the ruling** (§0D.3).
// The pack is unloaded, every audio handle released, the engine thrown away and rebuilt;
// no screen, cache or in-memory object of the outgoing language survives. That is bought
// here with a React `key` on the game subtree, which is the cheapest correct way to say
// *unmount everything* (`acceptance-criteria.md` A9, A10, A15–A17, R4, R6, Y13, Y18).
//
// **Confirming the language he is already in is a free return** (Y12): the chooser is an
// overlay over a board that stays mounted, so the strip, the shelf and the session are
// untouched and no audio is stopped. A toggle would have charged a part-built word for
// every stray press, and he will press everything.
//
// The **album survives a switch** and nothing else does (A18): it is per-pack, and his
// Vietnamese album is exactly as he left it when he comes back to Vietnamese, including
// the encounter counts that choose which photograph he sees next (B9).

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo, ActivityIndicator, AppState, BackHandler, Platform, StyleSheet, View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

import { ThemeProvider, themeTokens, DEFAULT_THEME } from './theme';
import { CasingProvider } from './ui/Text';
import { FONT_ASSETS } from './ui/typography';
import { stringsFor, chooserPanels } from './i18n';
import { loadPack, emojiSource, languageNameSource } from './content/loadPack';
import { UI_AUDIO } from '../assets/audio';
import { readSettings, writeSettings } from './settings/settings';
import { createAudioEngine, configureAudioSession, audioStats } from './audio/engine';
import { useGame } from './state/useGame';
import { createGame, langFor } from './engine/index.mjs';
import { GATE_GRACE, M } from './motion/durations.mjs';
import { applyOrientationPolicy } from './layout/orientation';
import { useViewport, usePagePlan } from './ui/useBoardLayout';
import { boardFor } from './ui/screens/boardFor';
import { AlbumScreen } from './ui/screens/AlbumScreen';
import { ChooserScreen } from './ui/screens/ChooserScreen';
import { GateScreen } from './ui/screens/GateScreen';
import { ParentMenu } from './ui/screens/ParentMenu';
import { CardScreen } from './ui/screens/CardScreen';
import { Editor } from './ui/screens/editor';

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

/** One language's board, plus everything that can sit over it. */
function Game(props) {
  // **`ui.md` §8.2 / AC D17, D21, D22, E22 — the glyph casing, read once at pack load.**
  // One field, one provider, applied at one place in the glyph component. Changing it is
  // one field in `pack.json`: no code, no rebuild, no re-record (D22).
  return (
    <CasingProvider casing={props.pack.glyphCase}>
      <GameBoard {...props} />
    </CasingProvider>
  );
}

function GameBoard({
  pack, packId, mediaSource, audio, settings, setSettings, themeId, setThemeId,
  onSwitchLanguage, onReloadPack, onSpeakLanguageName, seed, progress, onProgress, graceUntil,
}) {
  const strings = stringsFor(pack.language);
  // 'chooser' | 'gate' | 'menu' | 'words' | 'cheer' | null
  const [overlay, setOverlay] = useState(null);
  const [systemReduceMotion, setSystemReduceMotion] = useState(false);
  /**
   * **The parent door's hold hint** (`ui.md` §9.4b, AC I2, Y21, Y22). `seq` is a counter
   * rather than a boolean so a second tap after the hint has faded shows it again, while
   * a second tap *during* it does not restart it — the component ignores a new `seq`
   * while it is running.
   */
  const [hint, setHint] = useState({ seq: 0, ms: M.hintHold });

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

  // **The page plan** (`ui.md` §4.2): the pack's runs, this device's budget. It is the
  // only thing the device contributes to the board, and a character's page and slot are a
  // pure function of it (V7).
  const runLengths = useMemo(
    () => langFor(pack.language).runsFor(pack).map((run) => run.ids.length),
    [pack],
  );
  const { plan, insets } = usePagePlan(runLengths);
  // Keyed by the plan's *shape*, not its identity: rotating a tablet produces an equal
  // plan and must not rebuild the game under a child's finger (P9, P10).
  const pagesKey = plan ? plan.pages.join(',') : '';

  // `ui.md` §13.7 E13 — the prefix tree is **rebuilt atomically** whenever the pack or the
  // plan changes: a whole new game object, built and then swapped in. Never a tree mutated
  // under a child's finger.
  const game = useMemo(
    () => (plan ? createGame(pack, { pages: plan.pages }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the SHAPE is the dependency
    [pack, pagesKey],
  );

  /**
   * `gameplay.md` §5.2 / AC **F6, E14** — his mother's voice over the announcement motif,
   * if she recorded one. It is one clip per pack, resolved at pack load like every other
   * media reference, and its absence is the app's complete state rather than a gap.
   */
  const ui = useMemo(
    () => (pack.cheer ? { ...UI_AUDIO, cheer: mediaSource(pack.cheer.src) } : UI_AUDIO),
    [pack, mediaSource],
  );

  /**
   * **J11 — the strip survives the tree being rebuilt under it.** A word she saves makes a
   * new pack, a new tree and a new session (J14, E13); this ref is where the strip she
   * left behind is held across that, and `createSession` walks it through the new tree
   * before trusting a symbol of it.
   */
  const buildRef = useRef([]);

  const { controller, snapshot } = useGame({
    game, seed, mediaSource, ui, audio, settings, progress, onProgress, build: buildRef.current,
  });
  if (snapshot && snapshot.engine) buildRef.current = snapshot.engine.prefix;

  // **A14 — the grace ends the moment play resumes**, and on backgrounding. `touchSeq`
  // is the engine's own count of *he touched the board*, so this needs no plumbing
  // through four components and cannot be forgotten by one of them.
  //
  // The first run is skipped deliberately: this component is **remounted by a language
  // switch** (the `key` is the teardown), and clearing the grace on mount would mean a
  // parent who switches language must answer a second multiplication to do anything
  // else — which is the tax A13's grace exists to remove.
  const touchSeq = snapshot ? snapshot.engine.idle.touchSeq : 0;
  const lastTouch = useRef(touchSeq);
  useEffect(() => {
    if (touchSeq === lastTouch.current) return;
    lastTouch.current = touchSeq;
    graceUntil.current = 0;
  }, [touchSeq, graceUntil]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') graceUntil.current = 0;
    });
    return () => sub.remove();
  }, []);

  /**
   * **Y21 — the hint is shown once, unprompted, to someone who is provably an adult.**
   * This component mounts exactly when a language has just been committed on a two-touch
   * screen, so at this instant the person holding the phone is an adult. `holdHintShown`
   * is a persisted **setting**, not component state: *once per install* has to outlive a
   * mount, and a language switch unmounts this whole subtree.
   */
  useEffect(() => {
    if (settings.holdHintShown) return;
    setHint({ seq: 1, ms: M.hintHoldFirst });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the first board, once
  }, []);

  const openGate = useCallback(() => {
    // A13 — within 180 s of a correct answer the hold goes straight to the menu, so a
    // parent switching language twice in one sitting does one multiplication, not two.
    setOverlay(Date.now() < graceUntil.current ? 'menu' : 'gate');
  }, [graceUntil]);

  /**
   * **Y15 — the Android back gesture closes the chooser and commits nothing.** Only for
   * the chooser: the gate and the parent menu have their own visible way back, and
   * `react-native-web`'s `BackHandler` logs an error rather than doing nothing, so the
   * subscription is native-only.
   */
  useEffect(() => {
    if (overlay !== 'chooser' || Platform.OS === 'web') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setOverlay(null);
      return true;
    });
    return () => sub.remove();
  }, [overlay]);

  const sourceFor = useMemo(() => {
    const fn = (ref) => (ref ? mediaSource(ref.src ?? ref) : null);
    fn.emoji = emojiSource;
    return fn;
  }, [mediaSource]);

  /**
   * **The two doors of the top bar** (`ui.md` §9.4a, §9.4b), assembled here because both
   * of them are the *shell's* business: one opens the chooser and one opens the gate, and
   * neither board screen may know anything about either.
   *
   *   * **Y4 / Y28** — one tap opens the chooser, no gate is asked, nothing is committed,
   *     and a second tap while it is open does nothing: the guard is `overlay !== null`,
   *     so eight taps in a second show it once.
   *   * **Y5** — exactly one UI tap sound, and **no speech**. The language names are
   *     spoken on the chooser, where both are present and he can compare them; a name
   *     spoken on the board would be the outgoing language announcing the incoming one.
   *   * **Y20** — the door is the only control in the app that never makes a sound, so
   *     `onTapDoor` plays nothing at all. It asks for the hint (I2) and that is all.
   */
  const doors = {
    language: pack.language,
    doorLabel: strings.parentDoor,
    hintLabel: strings.holdHint,
    hintSeq: hint.seq,
    hintHoldMs: hint.ms,
    onHintShown: () => {
      if (!settings.holdHintShown) setSettings((st) => ({ ...st, holdHintShown: true }));
    },
    onTapDoor: () => setHint((h) => ({ seq: h.seq + 1, ms: M.hintHold })),
    onOpenGate: openGate,
  };

  // **V35** — this viewport can build a page plan for the other language but not for this
  // one. The card names the language, and the gate is on it, so the parent can switch
  // rather than being stuck.
  if (!plan) {
    return (
      <CardScreen
        title={strings.tooSmallTitle}
        body={strings.tooSmallBody}
        modeTitle={strings.modeTitle}
        onOpenGate={openGate}
      />
    );
  }

  if (!controller || !snapshot) {
    return <View style={styles.centre}><ActivityIndicator /></View>;
  }

  if (overlay === 'chooser') {
    /**
     * **The chooser, opened from the board** (`ui.md` §9.4a, §9.6, AC Y11–Y13).
     * The same screen, the same component and the same code path as first launch — the
     * only difference is that the current language's panel carries a *you are here* mark
     * and confirming it is a **free return**.
     */
    return (
      <ChooserScreen
        current={pack.language}
        themeId={themeId}
        onSelectTheme={setThemeId}
        onSample={onSpeakLanguageName}
        onConfirm={(lang) => {
          if (lang === pack.language) { setOverlay(null); return; } // Y12 — free
          // Y13 / A15 — **a hard stop, not the 800 ms fade.** A fade would play the
          // outgoing language's voice over the incoming language's board: a leak.
          controller.stopForLanguageSwitch();
          setOverlay(null);
          onSwitchLanguage(lang);
        }}
      />
    );
  }

  if (overlay === 'gate') {
    return (
      <GateScreen
        strings={strings}
        onBack={() => setOverlay(null)}
        onPass={() => { graceUntil.current = Date.now() + GATE_GRACE; setOverlay('menu'); }}
      />
    );
  }

  if (overlay === 'words' || overlay === 'cheer') {
    // **Slice 4.** The editor is mounted *beside* the board rather than instead of it:
    // `useGame` above is still holding the session, so J11's *"the app returns to that
    // same board with the strip still assembled"* costs nothing but the tree rebuild,
    // which is J14's.
    return (
      <Editor
        strings={strings}
        pack={pack}
        packId={packId}
        sourceFor={sourceFor}
        audio={audio}
        settings={settings}
        onSetting={(patch) => setSettings((s) => ({ ...s, ...patch }))}
        startAt={overlay === 'cheer' ? 'cheer' : 'list'}
        onPackChanged={onReloadPack}
        onBack={() => setOverlay('menu')}
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
        // N11a — the audio diagnostic on the About screen. It is the process-wide budget,
        // so it counts the chooser's player as well as the board's.
        audioStats={audioStats}
        onOpenWords={() => setOverlay('words')}
        onOpenCheer={() => setOverlay('cheer')}
        onBack={() => setOverlay(null)}
        onFinishSession={() => { controller.finishSession(); setOverlay(null); }}
        onSwitchLanguage={(lang) => {
          // A15 — **a hard stop, not the 800 ms fade.** A fade would play the outgoing
          // language's voice over the incoming language's board, which is a leak.
          controller.stopForLanguageSwitch();
          setOverlay(null);
          onSwitchLanguage(lang);
        }}
      />
    );
  }

  if (snapshot.phase === 'empty') {
    // `acceptance-criteria.md` L6, K9 — a parent-facing card, not a crash, not a blank
    // board. The child never meets this screen; the adult who can fix it does.
    return (
      <CardScreen
        title={strings.emptyTitle}
        body={strings.emptyBody}
        modeTitle={strings.modeTitle}
        onOpenGate={openGate}
      />
    );
  }

  if (snapshot.phase === 'album' || snapshot.phase === 'ended') {
    const ended = snapshot.phase === 'ended';
    return (
      <AlbumScreen
        entries={snapshot.album}
        photos={snapshot.albumPhotos}
        strings={strings}
        themeId={themeId}
        onSelectTheme={ended ? null : setThemeId}
        onPlay={ended ? null : () => controller.leaveAlbum()}
        onTapEntry={ended ? null : (entry) => controller.tapAlbum(entry)}
        // The album is not a board, so it carries the parent door and **not** the
        // language control (Y1 is about the board). The 72 pt lane stays reserved, so
        // the shelf column does not move between the two screens.
        doors={doors}
        reduced={reduced}
        sourceFor={sourceFor}
      />
    );
  }

  const Board = boardFor(pack.language);
  return (
    <Board
      snapshot={snapshot}
      controller={controller}
      strings={strings}
      settings={settings}
      reduced={reduced}
      sourceFor={sourceFor}
      layout={plan.L}
      insets={insets}
      doors={{
        ...doors,
        // Y4 — one tap, no gate. Y30 — a tap is ignored while anything is over the board,
        // so a switch can never be re-entered.
        onOpenChooser: overlay === null ? () => {
          controller.languageTap();
          setOverlay('chooser');
        } : null,
        // **Y8** — the control is not drawn during the announcement or the reveal.
        // Switching language in the middle of a reveal is the messiest teardown in the
        // app and the reveal is over in about three seconds. The door stays, because a
        // parent may need out.
        hideLanguage: snapshot.status === 'announcing' || Boolean(snapshot.reveal),
      }}
    />
  );
}

function Shell() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const [settings, setSettings] = useState(null);
  const [loaded, setLoaded] = useState(null); // { pack, mediaSource, audio } | { error }
  const [generation, setGeneration] = useState(0);
  /**
   * **J14 — a word she saved is discoverable without an app restart.** Bumping this
   * re-reads the pack directory and resolves it again, which rebuilds the prefix tree
   * atomically (E13). It is deliberately **not** `generation`: that one is the language
   * switch's key and tears the whole subtree down, which would lose the strip J11 asks
   * to keep.
   */
  const [packRev, setPackRev] = useState(0);
  const viewport = useViewport();

  /**
   * **A18 — the album is per pack and survives a switch.** It is held here, above the
   * teardown, keyed by pack id: his Vietnamese album is exactly as he left it when he
   * comes back to Vietnamese, including each word's encounter count, so B9 resumes where
   * it left off rather than starting the photographs again.
   *
   * It is deliberately **not** written to AsyncStorage: A7 keeps that for settings only.
   * The cost is that the album does not survive a force-kill, which is the album half of
   * T15 and is unchanged from revision 2.
   */
  const progressByPack = useRef(new Map());

  /**
   * **A13 — the 180 s gate grace**, and it lives here rather than in `Game` for the same
   * reason the album does: a language switch unmounts `Game`, and the switch is exactly
   * the thing the grace exists to make cheap (`gameplay.md` §7.3 — *switch the language,
   * then add a word: one multiplication, not two*). A timestamp rather than a timer, so
   * nothing has to fire for it to expire (A14).
   */
  const graceUntil = useRef(0);

  useEffect(() => {
    let alive = true;
    readSettings().then((s) => { if (alive) setSettings(s); });
    configureAudioSession();
    return () => { alive = false; };
  }, []);

  // `gameplay.md` §2.1 / AC P7, P8 — decided once at startup from the screen metrics,
  // never per frame, so the device cannot flip-flop.
  const orientationDecided = useRef(false);
  useEffect(() => {
    if (orientationDecided.current || !viewport.Wv || !viewport.Hv) return;
    orientationDecided.current = true;
    applyOrientationPolicy(
      { width: viewport.Wv, height: viewport.Hv },
      { top: viewport.insetT, bottom: viewport.insetB, left: viewport.insetL, right: viewport.insetR },
    );
  }, [viewport]);

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
  }, [language, generation, packRev]);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  /**
   * **A2, restated in revision 6** — a tap on a chooser panel speaks **the language's own
   * name**, `Tiếng Việt` or `English` (E23, Y31–Y34). It used to speak a sample word; a
   * sample word identifies a language only to someone who already knows that word *and*
   * has connected it to a language, and the child now chooses for himself.
   *
   * One clip, one player, released as soon as the chooser is gone. **Y33 — neither clip
   * exists yet, and the degradation is silence, not a failure**: `languageNameSource`
   * returns `null`, `playSpeech(null)` plays nothing, the panel expands and the chooser
   * still works.
   */
  const chooserAudio = useMemo(() => createAudioEngine(), []);
  useEffect(() => () => chooserAudio.dispose(), [chooserAudio]);
  const speakLanguageName = useCallback((lang) => {
    chooserAudio.playSpeech(languageNameSource(lang));
  }, [chooserAudio]);

  const switchLanguage = useCallback((next) => {
    // A20 — the new language is persisted immediately, so a crash or a relaunch opens
    // where he was.
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
    // A8 — below 360 × 600 the screen-too-small card is shown and no board is mounted.
    // The per-language case (a viewport that serves English and not Vietnamese) is A11 /
    // V35 and lives in `Game`, because it needs the pack to know the run lengths.
    if (viewport.tooSmall) {
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
          // **Y11** — at first launch neither panel carries the *you are here* mark,
          // because there is no here yet.
          current={null}
          themeId={themeId}
          onSelectTheme={(id) => setSettings((s) => ({ ...s, theme: id }))}
          onSample={speakLanguageName}
          onConfirm={(lang) => setSettings((s) => ({ ...s, language: lang }))}
        />
      );
    }
    if (!loaded) return <View style={styles.centre}><ActivityIndicator /></View>;
    if (loaded.error) {
      const s = stringsFor(language);
      return <CardScreen title={s.emptyTitle} body={loaded.error} modeTitle={s.modeTitle} />;
    }
    const packId = loaded.pack.id ?? language;
    return (
      <Game
        // The key is the teardown: a language switch unmounts the whole subtree.
        key={`${language}:${generation}`}
        pack={loaded.pack}
        packId={packId}
        onReloadPack={() => setPackRev((r) => r + 1)}
        mediaSource={loaded.mediaSource}
        audio={loaded.audio}
        settings={settings}
        setSettings={setSettings}
        themeId={themeId}
        setThemeId={(id) => setSettings((s) => ({ ...s, theme: id }))}
        onSwitchLanguage={switchLanguage}
        onSpeakLanguageName={speakLanguageName}
        seed={`${language}-${settings.theme}`}
        progress={progressByPack.current.get(packId) ?? null}
        onProgress={(p) => progressByPack.current.set(packId, p)}
        graceUntil={graceUntil}
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
