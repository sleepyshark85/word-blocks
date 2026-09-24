// **Design revision 6 — the two doors.** `ui.md` §0D, §9.4a, §9.4b, §9.6, §10.6;
// `gameplay.md` §0D, §7.1–§7.3; `acceptance-criteria.md` §0F, §Y, §W6.
//
// The owner ran the app on a real iPhone and could not find the language switch or the
// editor. Both lived behind a 1.2 s hold on a 32 pt dot at 30 % opacity: **hiding the
// gate had also hidden the door.** This file is the part of the remedy that can be
// checked off a device — the wiring, the constants, the settings and the strings. What is
// left is Tier 3 and Tier 5, and U31 (*does `Cha mẹ` in the corner read to the owner's
// wife as a button, without being told?*) is the one that closes the finding.
//
// The geometry lives in `test/topbar.test.mjs` and `test/layout-parity.test.mjs`; the
// audio rule lives in `test/game-controller.test.mjs`, driven through the real controller.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { REPO } from './helpers/load.mjs';
import { M } from '../src/motion/durations.mjs';
import {
  planFor, LANG_W, DOOR_W, BAR_AIR, GAP_STRIP, shelfRowW,
} from '../src/layout/layout.mjs';
import vi from '../src/i18n/vi.js';
import en from '../src/i18n/en.js';

const read = (...parts) => readFileSync(path.join(REPO, ...parts), 'utf8');
const APP = read('src', 'App.js');
const MENU = read('src', 'ui', 'screens', 'ParentMenu.js');
const CHOOSER = read('src', 'ui', 'screens', 'ChooserScreen.js');
const LOAD_PACK = read('src', 'content', 'loadPack.js');
const I18N = read('src', 'i18n', 'index.js');
/**
 * `src/settings/settings.js` is read as **text**, not imported: it pulls in AsyncStorage
 * and `../theme`, neither of which resolves in Node. That is the same reason
 * `test/presentation-audit.test.mjs` audits it by reading it, and it is the price of the
 * module being the one door to storage.
 */
const SETTINGS = read('src', 'settings', 'settings.js');

/** The named devices of `ui.md` §4.4, both run lengths — the same set `topbar` uses. */
function* served() {
  for (const [W, H, top, bottom] of [
    [430, 932, 59, 34], [440, 956, 59, 34], [390, 844, 47, 34],
    [360, 640, 24, 0], [834, 1194, 24, 20], [412, 915, 24, 24],
  ]) {
    for (const runs of [[29, 6], [26]]) {
      const plan = planFor({
        Wv: W, Hv: H, insetT: top, insetB: bottom, insetL: 0, insetR: 0,
      }, runs);
      if (plan) yield { L: plan.L };
    }
  }
}

/* ------------------------------------------------- the child's language control (§Y) */

test('Y2 — the control\'s row order IS the chooser\'s, so Vietnamese is on top in both languages', () => {
  // The control is *a picture of the destination*: two stacked panels, Vietnamese first.
  // Both read the order from `chooserPanels()`, so "top is Vietnamese" is one fact in one
  // place. If the chooser is ever reordered the control follows it, and the leak detector
  // a tester reads off a screenshot — *on a Vietnamese board the top bar is filled* —
  // cannot come apart from the screen it is a picture of.
  const order = [...I18N.matchAll(/\{ language: '(\w+)'/g)].map((m) => m[1]);
  assert.deepEqual(order, ['vi', 'en'], 'the chooser no longer leads with Vietnamese');
  assert.match(read('src', 'ui', 'TopBar.js'), /const rows = chooserPanels\(\);/);
});

test('Y4 / A9 — the board\'s control opens the CHOOSER, asks no gate and commits nothing', () => {
  // W6 restates A9: *the board's language control, one tap, **no gate at all***. The
  // route must not touch `openGate`, the grace or the multiplication.
  const opener = APP.slice(APP.indexOf('onOpenChooser:'), APP.indexOf('hideLanguage:'));
  assert.ok(opener.length > 20, 'App.js no longer wires the language control');
  assert.match(opener, /setOverlay\('chooser'\)/);
  assert.ok(!/gate|grace|Gate/.test(opener), 'the language control touches the gate');
  // Y30 / Y28 — a tap is ignored while anything is already over the board, so a switch
  // can never be re-entered and eight taps in a second show the chooser once.
  assert.match(opener, /overlay === null \?/);
});

test('Y8 — the control is not drawn during the announcement or the reveal; the door is', () => {
  const hide = APP.match(/hideLanguage: ([^,]+),/);
  assert.ok(hide, 'App.js no longer decides when to hide the language control');
  assert.match(hide[1], /snapshot\.status === 'announcing'/);
  assert.match(hide[1], /snapshot\.reveal/);
  // And the door is never hidden: `hideLanguage` is the only such flag in the bar.
  const bar = read('src', 'ui', 'TopBar.js');
  assert.ok(!/hideDoor|hideParent/.test(bar), 'the parent door can be hidden; a parent may need out');
});

test('Y12 — confirming the language he is already in is a FREE RETURN', () => {
  // *An accidental press costs nothing*, which is the whole reason this is a chooser and
  // not a toggle: a toggle charges a part-built word for every stray press, and he will
  // press everything. The same-language branch must return before the teardown.
  const branch = APP.slice(APP.indexOf('onConfirm={(lang) => {'));
  const free = branch.slice(0, branch.indexOf('controller.stopForLanguageSwitch()'));
  assert.match(free, /if \(lang === pack\.language\) \{ setOverlay\(null\); return; \}/);
  // Y13 — and confirming the OTHER one is the full teardown, with the hard stop.
  assert.match(branch, /controller\.stopForLanguageSwitch\(\);[\s\S]{0,120}onSwitchLanguage\(lang\)/);
});

test('Y15 — the Android back gesture closes the chooser and commits nothing', () => {
  const block = APP.slice(APP.indexOf("if (overlay !== 'chooser'"), APP.indexOf('const sourceFor'));
  assert.match(block, /BackHandler\.addEventListener\('hardwareBackPress'/);
  assert.match(block, /setOverlay\(null\);\s*\n\s*return true;/);
  assert.match(block, /return \(\) => sub\.remove\(\);/, 'the subscription is never removed');
  // `react-native-web`'s BackHandler logs an error rather than doing nothing, and an
  // error in every browser run is noise in the only evidence Tier 3 produces.
  assert.match(block, /Platform\.OS === 'web'/);
});

test('Y11 — the "you are here" mark is drawn only when the chooser came from the board', () => {
  assert.match(CHOOSER, /here=\{panel\.language === current\}/);
  assert.match(CHOOSER, /current = null/, 'the mark must default to absent (first launch)');
  assert.match(APP, /current=\{null\}/, 'first launch still marks a panel');
  assert.match(APP, /current=\{pack\.language\}/, 'the board route does not mark the current one');
});

test('Y14 — the chooser\'s confirm is a 72 pt play control, not a labelled button', () => {
  // A3/W6: two touches on **every** route now, because the first touch is the preview —
  // he taps, he hears `English`, and then he decides. `▶` is the album's play control,
  // so it is a symbol he has met.
  assert.match(CHOOSER, /const CONFIRM = 72;/);
  assert.match(CHOOSER, /width: CONFIRM,\s*height: CONFIRM,/);
  assert.match(CHOOSER, /▶/);
  // The theme buttons stay at 56 pt of ink, as `ui.md` §9.6 draws them, and meet Y14's
  // 72 pt through `hitSlop={8}` on the shared component. **Reported, not absorbed:** Y14
  // says *72 pt in its smallest dimension* and §9.6's figure says *three 56pt theme
  // buttons*; this builds the figure's ink with the criterion's target.
  assert.match(CHOOSER, /<ThemeButtons size=\{56\}/);
  assert.match(read('src', 'ui', 'ThemeButtons.js'), /hitSlop=\{8\}/);
});

test('Y6 / Y7 — the control is far from the nearest tile, and the bar\'s three children keep apart', () => {
  // **Y6, measured.** *The shortest distance from the language control's bottom edge to
  // the nearest tile's hit rect is ≥ 72 pt.* It is `GAP_STRIP + stripH` by construction —
  // the whole word strip lies between them — and the design quotes 89 / 116 / 134. A
  // finger reaching for a tile does not arrive here.
  //
  // **Y7 does not hold as written, and this is the report rather than a silent pass.**
  // Y7 asks that *no other control's hit rect comes within 12 pt of either*. The nearest
  // is a shelf slot, and `space-between` splits what the law leaves over: at the 360 dp
  // floor that is `328 − 72 − 169 − 65 = 22` pt, **11 pt a side**. The law never promised
  // 12 a side — `BAR_AIR` is 12 pt **total**, which F18 spends as two 6 pt separations —
  // so **F18 and Y7 disagree at the floor by 1 pt**. Recommendation: restate Y7 as
  // ≥ `BAR_AIR / 2` per side (measured worst 11.0, which beats it by 5), or raise
  // `BAR_PAD` 32 → 36 in `tools/layout-sweep.mjs`, which buys the 12th point out of the
  // shelf slot. The second is a change to the Tier-4 artefact and is the designer's.
  let worstY6 = Infinity;
  let worstGap = Infinity;
  let checked = 0;
  for (const { L } of served()) {
    worstY6 = Math.min(worstY6, GAP_STRIP + L.stripH);
    worstGap = Math.min(worstGap, (L.CW - LANG_W - shelfRowW(L.shelf) - DOOR_W) / 2);
    checked += 1;
  }
  assert.ok(checked >= 10, `only ${checked} viewport/language combinations were measured`);
  assert.ok(worstY6 >= 72, `Y6: the nearest tile is ${worstY6} pt below the control`);
  assert.equal(worstY6, 89, 'the floor\'s figure is the one `ui.md` §9.4a quotes');
  assert.ok(worstGap >= BAR_AIR / 2, `the bar's children are ${worstGap} pt apart`);
  assert.equal(worstGap, 11, 'the measured worst, recorded so a regression is visible');
});

/* -------------------------------------------------------------- the parent door (§Y) */

test('I2 / M27 — a tap on the door shows the hold hint, and the hint is silent', () => {
  // Revision 5's I2 said *a tap does nothing*. **"Nothing happens" is a failure for an
  // adult exactly as it is for a child** — it is what the owner did, and it is why he
  // concluded there was no button.
  assert.equal(M.hintIn, 160);
  assert.equal(M.hintHold, 1600);
  assert.equal(M.hintOut, 160);
  assert.equal(M.hintHoldFirst, 3000);
  assert.equal(M.gateHold, 1200, 'the lock is byte-identical; only the door changed');
  assert.equal(M.doorFillBack, 160);
  assert.equal(M.langSwap, 260);
  // M25 — the fill is **linear**, because a progress indicator that eases is lying about
  // the time left. It is the only linear curve in the app.
  assert.match(read('src', 'motion', 'easing.js'), /linear: Easing\.linear,/);
  const bar = read('src', 'ui', 'TopBar.js');
  assert.match(bar, /duration: M\.gateHold,\s*\n\s*easing: EASING\.linear,/);
  // Y22 — repeated taps inside the window show the hint once; a new `seq` is ignored
  // while it is running.
  assert.match(bar, /if \(seq === 0 \|\| running\.current\) return undefined;/);
});

test('Y21 — "shown once per install" is a persisted SETTING, not component state', () => {
  // It is a setting for the same reason `cheerOffered` is: *once per install* has to
  // outlive the mount it was shown in, and a language switch unmounts the whole board.
  // The schema is the only way anything is persisted, and `coerceSettings` refuses
  // anything that is not the declared shape — storage is untrusted input too.
  assert.match(SETTINGS, /holdHintShown: \{ type: 'boolean', dflt: false \},/);
  assert.match(SETTINGS, /if \(spec\.type === 'boolean'\) \{\s*\n\s*if \(typeof value === 'boolean'\) out\[key\] = value;/);
  // The first board after a language is committed shows it, once, and writes the flag.
  assert.match(APP, /if \(settings\.holdHintShown\) return;\s*\n\s*setHint\(\{ seq: 1, ms: M\.hintHoldFirst \}\);/);
  assert.match(APP, /if \(!settings\.holdHintShown\) setSettings\(\(st\) => \(\{ \.\.\.st, holdHintShown: true \}\)\);/);
});

/* ------------------------------------------------------------- the parent menu (§I) */

test('I8 / I9 — six rows, and row 1 names add, edit and delete', () => {
  // The owner's second finding was *"where is the screen for me to add/edit/delete
  // words/images/audio?"*, and revision 5's answer was **two rows, three apart, that both
  // led to the editor** — which makes neither of them the editor.
  const menu = MENU.slice(MENU.lastIndexOf('<ParentScreen title={strings.menuTitle}'));
  const rows = [...menu.matchAll(/<Row\b[^>]*label=\{strings\.(\w+)\}/g)].map((m) => m[1]);
  assert.deepEqual(rows, [
    'menuWords', 'menuLanguage', 'menuFinish', 'menuVoice', 'menuMotion', 'menuAbout',
  ]);
  assert.match(menu, /label=\{strings\.menuWords\} detail=\{strings\.menuWordsDetail\}/);
  // W6/I9: *Add a word* is gone from the menu, from the shell's routes and from both
  // string tables — a row that no longer exists must not survive as a translated string.
  for (const [name, strings] of [['vi', vi], ['en', en]]) {
    assert.equal(strings.menuAddWord, undefined, `${name}.js still declares menuAddWord`);
    assert.ok(strings.menuWordsDetail.length > 0);
    assert.ok(strings.parentDoor.length > 0);
    assert.ok(strings.holdHint.length > 0);
  }
  assert.ok(!/addWord/.test(APP), 'the shell still routes to a standalone add-a-word screen');
});

/* ------------------------------------- the chooser's language-name clips (E23, §Y31+) */

test('A2 / E23 / Y33 — the chooser speaks the language\'s NAME, and a missing clip is silence', () => {
  // The clips do not exist yet: they are the content-engineer's (E23, Y31–Y34), they are
  // **speech**, and the owner has to hear them before they ship. What the app owes today
  // is the **degradation** — Y33: *a missing clip is a warning and not an error, the pack
  // stays valid, and the chooser degrades silently.*
  assert.match(LOAD_PACK, /export function languageNameSource\(language\)/);
  assert.ok(!/sampleWordSource/.test(LOAD_PACK + APP), 'the sample word is still played');
  assert.match(APP, /chooserAudio\.playSpeech\(languageNameSource\(lang\)\)/);
  // Every branch of the lookup returns `null` rather than throwing, so an absent field, a
  // malformed field and a dangling reference are all *the panel expands silently*.
  const fn = LOAD_PACK.slice(LOAD_PACK.indexOf('export function languageNameSource'));
  assert.match(fn, /if \(!bundle\) return null;/);
  assert.match(fn, /typeof clip\.src === 'string' \? clip\.src : null/);
  assert.match(fn, /bundle\.media\[ref\] \?\? null/);
  // And the degradation is the LIVE path today, not a branch nobody takes: neither
  // shipped manifest carries the clip. When one does, this assertion is what says so.
  for (const id of ['vi-seed', 'en-seed']) {
    const manifest = JSON.parse(read('packs', id, 'pack.json'));
    assert.equal(manifest.languageName, undefined,
      `${id} now carries a language-name clip — E23 has landed; tell the tester to listen (Y34)`);
  }
});

/* ------------------------------------------------------------------- R1–R5, unmoved */

test('R1–R5 are not weakened: a switch is still a teardown and the key is still the unmount', () => {
  // `acceptance-criteria.md` §0F: *"Not weakened — R1–R5. A switch is still a full
  // teardown; no instant has two packs loaded. The switch being cheap and frequent is
  // exactly why they stay as they are."*
  assert.match(APP, /key=\{`\$\{language\}:\$\{generation\}`\}/);
  assert.match(APP, /setGeneration\(\(g\) => g \+ 1\)/);
  // A20 — the new language is persisted immediately, so a relaunch opens where he was.
  assert.match(APP, /setSettings\(\(s\) => \(\{ \.\.\.s, language: next \}\)\)/);
});
