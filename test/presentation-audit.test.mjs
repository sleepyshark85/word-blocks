// A structural audit of the React layer, the way `purity.test.mjs` audits the engine.
//
// `development-process.md` §5: *when a property is like that, audit it structurally in
// Tier 1 rather than testing the behaviour anywhere.* Three properties here are like
// that, and all three are ones a passing screenshot would not catch:
//
//   - **O1/O3, the motion law.** An `Animated` value driving `backgroundColor` still
//     renders — it just drops to the JS thread and stutters under load, on a device, in
//     front of the child. `useNativeDriver: false` would not fail any behaviour test.
//   - **S3, no colour literal in a component.** A hex is right in one theme and wrong in
//     two, and the two wrong ones are the themes nobody screenshots.
//   - **R1/R2/R4, the language leak.** A leak is a *correctness* failure in this app, and
//     "we did not notice one" is not evidence.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { REPO } from './helpers/load.mjs';

const SRC = path.join(REPO, 'src');

function sources(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.(mjs|jsx?)$/.test(name)) out.push(p);
  }
  return out.sort();
}

/** Everything in `src/` that is not the engine — the two layers this file audits. */
const APP_FILES = sources(SRC).filter((f) => !f.includes(`${path.sep}engine${path.sep}`));
const rel = (f) => path.relative(REPO, f);

function code(file) {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1 ');
}

test('there is an app layer to audit', () => {
  assert.ok(APP_FILES.length >= 20, `only found ${APP_FILES.length} files`);
});

/* ------------------------------------------------------------------ §O motion */

test('O2 — neither Reanimated nor gesture-handler is imported anywhere', () => {
  for (const f of APP_FILES) {
    const c = code(f);
    assert.ok(!/react-native-reanimated/.test(c), `${rel(f)} imports Reanimated`);
    assert.ok(!/react-native-gesture-handler/.test(c), `${rel(f)} imports gesture-handler`);
    assert.ok(!/\buseSharedValue\b|\bworklet\b|\bGestureDetector\b/.test(c),
      `${rel(f)} uses a Reanimated / gesture-handler API`);
  }
});

test('O1 — every animation sets useNativeDriver: true', () => {
  let animations = 0;
  for (const f of APP_FILES) {
    const c = code(f);
    // Every `Animated.timing|spring|decay(` call must carry the flag, set to true.
    for (const m of c.matchAll(/Animated\.(timing|spring|decay)\s*\(/g)) {
      const start = m.index;
      // Read to the matching close paren so a nested call cannot confuse the window.
      let depth = 0;
      let end = start;
      for (let i = c.indexOf('(', start); i < c.length; i += 1) {
        if (c[i] === '(') depth += 1;
        else if (c[i] === ')') { depth -= 1; if (depth === 0) { end = i; break; } }
      }
      const call = c.slice(start, end + 1);
      animations += 1;
      assert.ok(/useNativeDriver\s*:\s*true/.test(call),
        `${rel(f)}: an ${m[1]} without useNativeDriver: true — ${call.slice(0, 120)}`);
      assert.ok(!/useNativeDriver\s*:\s*false/.test(call),
        `${rel(f)}: an ${m[1]} with useNativeDriver: false`);
    }
  }
  assert.ok(animations >= 10, `only found ${animations} animations to audit`);
});

test('O1/O3 — an Animated value drives only transform or opacity', () => {
  // The forbidden targets, named by `acceptance-criteria.md` O3. The audit is on the
  // style key an `Animated.Value` or an `.interpolate(...)` is assigned to.
  const FORBIDDEN = [
    'backgroundColor', 'borderColor', 'color', 'width', 'height',
    'top', 'left', 'right', 'bottom', 'margin', 'padding',
    'shadowOpacity', 'shadowRadius', 'shadowOffset', 'elevation', 'borderWidth',
    'borderRadius', 'fontSize', 'lineHeight',
  ];
  // A name that holds an Animated value in this codebase. Collected per file so the
  // audit follows the code rather than a naming convention.
  for (const f of APP_FILES) {
    const c = code(f);
    const animated = new Set();
    for (const m of c.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(?:useRef\(\s*)?new Animated\.Value\(/g)) animated.add(m[1]);
    for (const m of c.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(\w+)\.interpolate\(/g)) {
      if (animated.has(m[2])) animated.add(m[1]);
    }
    for (const m of c.matchAll(/(?:const|let)\s+(\w+)\s*=\s*Animated\.(?:add|multiply|subtract|divide|modulo|diffClamp)\(/g)) animated.add(m[1]);
    if (animated.size === 0) continue;

    const names = [...animated].join('|');
    for (const key of FORBIDDEN) {
      const re = new RegExp(`\\b${key}\\s*:\\s*(?:${names})\\b`);
      assert.ok(!re.test(c), `${rel(f)} animates ${key}`);
      const reInterp = new RegExp(`\\b${key}\\s*:\\s*(?:${names})\\.interpolate`);
      assert.ok(!reInterp.test(c), `${rel(f)} animates ${key} through an interpolation`);
    }
  }
});

/* ------------------------------------------------------------------- §S colour */

test('S3 — no component contains a colour literal', () => {
  for (const f of APP_FILES) {
    if (f.endsWith(path.join('theme', 'index.js'))) continue; // reads tokens.json, holds none
    const raw = readFileSync(f, 'utf8').replace(/§/g, '');
    const stripped = raw
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:])\/\/.*$/gm, '$1 ');
    assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(stripped), `${rel(f)} contains a colour literal`);
    for (const fn of ['rgb(', 'rgba(', 'hsl(', 'hsla(']) {
      assert.ok(!stripped.includes(fn), `${rel(f)} contains a ${fn} colour`);
    }
    // The named colours React Native accepts are the same bug wearing a word.
    assert.ok(!/['"](?:red|green|blue|black|white|grey|gray|orange|yellow|purple|pink)['"]/i.test(stripped),
      `${rel(f)} contains a named colour literal`);
  }
});

test('S7 — nothing in the app renders a failure state', () => {
  for (const f of APP_FILES) {
    const c = code(f).toLowerCase();
    for (const banned of ['errorcolour', 'errorcolor', 'dangercolor', 'failurecolor']) {
      assert.ok(!c.includes(banned), `${rel(f)} names a failure colour`);
    }
  }
});

test('M22 / M23 / M24 / X12–X18 — the strip\'s new motion is transform and opacity only', () => {
  // The three animations revision 5 adds are the ones that explain a superseding sound,
  // and each has a shape a screenshot cannot check: **M22** must be `scaleX` anchored at
  // the LEFT edge (a bar that grew from its centre would say *both letters changed*),
  // **M23** must be one scale on the **span container** rather than on the new cell, and
  // **M24** must be opacity so the divider fades rather than pops.
  const strip = code(path.join(SRC, 'ui', 'WordStrip.js'));
  assert.ok(/scaleX:\s*grow/.test(strip), 'M22 does not animate scaleX');
  assert.ok(/translateX:\s*anchored/.test(strip),
    'M22 is not anchored: `transformOrigin` is not portable, so the anchor is a half-width translate');
  assert.ok(!/\bwidth:\s*(?:grow|pulse|slide)\b/.test(strip), 'the bar animates a layout property (O3)');
  // M23 — the pulse is on the group, and it is scale, never the reward gold (X14).
  const group = strip.slice(strip.indexOf('function SpanGroup'), strip.indexOf('export function WordStrip'));
  assert.ok(group.length > 200, 'the span-group component could not be found to audit');
  assert.ok(/1\.08/.test(group), 'M23 is not a 1.08 pulse');
  assert.ok(!/reward/.test(group), 'X14 — the re-voice takes the reward gold');
  // X40 — under reduce-motion M23 is an opacity pulse of the SAME duration, so audio
  // sync and every criterion above still hold.
  assert.ok(/0\.75/.test(group), 'X40 — reduce-motion has no opacity pulse');

  // Every duration comes from the motion table, never a literal in the component.
  for (const name of ['spanGrow', 'revoice', 'dividerFade', 'markSlotFade']) {
    assert.ok(new RegExp(`M\\.${name}`).test(strip), `${name} is not read from the motion table`);
  }
  const durations = JSON.parse(readFileSync(path.join(SRC, 'motion', 'durations.mjs'), 'utf8')
    .match(/export const M = \{([\s\S]*?)\n\};/)[1]
    .split('\n')
    .filter((l) => /^\s{2}\w+:/.test(l))
    .reduce((acc, l) => {
      const [, k, v] = l.match(/^\s{2}(\w+):\s*([\d.]+)/) ?? [];
      return k ? `${acc}${acc === '{' ? '' : ','}"${k}":${v}` : acc;
    }, '{') + '}');
  assert.equal(durations.spanGrow, 220, 'M22 is not 220 ms');
  assert.equal(durations.revoice, 260, 'M23 is not 260 ms');
  assert.equal(durations.dividerFade, 180, 'M24 is not 180 ms');
  assert.equal(durations.markSlotFade, 180, 'X33 — the mark-slot is not 180 ms');
  assert.equal(durations.merge, 240);
  assert.equal(durations.mergeFade, 180);
});

test('X9 / X11 — the strip is ONE target and no cell is pressable', () => {
  const strip = code(path.join(SRC, 'ui', 'WordStrip.js'));
  // One `Pressable`, and it is the band: five 72 pt cells need 392 pt and the 360 dp
  // floor has 328, so a per-cell target is not a thing this app can draw (`ui.md` §7.2.6).
  assert.equal((strip.match(/<Pressable\b/g) ?? []).length, 1,
    'the strip has more than one touch target');
  // The boards hand it whole-strip handlers, with no index.
  for (const board of ['BoardVi.js', 'BoardEn.js']) {
    const c = code(path.join(SRC, 'ui', 'screens', board));
    assert.ok(/onStripDown=\{controller\.stripDown\}/.test(c), `${board}: no strip press`);
    assert.ok(/onStripUp=\{controller\.stripUp\}/.test(c), `${board}: no strip release`);
    assert.ok(!/onCellUp|undoTo|stripUp\(\d/.test(c), `${board}: a per-cell undo survives`);
  }
});

/* ---------------------------------------------------------------- §R language */

test('R4 — only `i18n/index.js` and `content/packIds.js` name both languages', () => {
  // Comments are stripped: a doc comment saying `@param {'vi'|'en'}` is documentation,
  // not a code path, and an audit that cannot tell the difference gets turned off.
  const offenders = [];
  for (const f of APP_FILES) {
    const c = code(f);
    const namesVi = /['"]vi['"]|vi-seed|BoardVi/.test(c);
    const namesEn = /['"]en['"]|en-seed|BoardEn/.test(c);
    if (namesVi && namesEn) offenders.push(path.relative(SRC, f));
  }
  assert.deepEqual(offenders.sort(), [
    // The app shell picks the board, which is the moment the choice is made — once.
    'App.js',
    // The two lookup tables, each of which throws rather than defaulting.
    path.join('content', 'packIds.js'),
    path.join('i18n', 'index.js'),
    // The settings schema, whose whole job is to declare the two values a parent may
    // choose between and to reject anything else.
    path.join('settings', 'settings.js'),
  ].sort(), `unexpected files see both languages: ${offenders.join(', ')}`);
});

test('R1/R2 — neither board screen can reach the other language', () => {
  // **RESTATED in revision 5.** `letter`, `vowel` and `consonant` used to be English-only
  // words, and a Vietnamese board naming one was a leak. They are now the **shared**
  // vocabulary of both boards: the Vietnamese table is 29 letters, and a role is
  // consonant / vowel / tone in both languages (`ui.md` §5.5, AC B2l, C15, D5, S5). What
  // is still one language's alone is the **tone** — and the digraph, which lost its cell
  // in English and never had one in Vietnamese.
  const viFile = path.join(SRC, 'ui', 'screens', 'BoardVi.js');
  const enFile = path.join(SRC, 'ui', 'screens', 'BoardEn.js');
  assert.ok(!/BoardEn|\bdigraph\b|Word Blocks/.test(code(viFile)),
    'the Vietnamese board names an English concept');
  assert.ok(!/BoardVi|\bonset\b|\brime\b|\btone\b|role3|Ghép/.test(code(enFile)),
    'the English board names a Vietnamese concept');
  // D6 — `role3` is never rendered in English mode.
  assert.ok(!/role3/.test(code(enFile)));
  // And the shared words really are in both, so the assertion above is not vacuous.
  for (const f of [viFile, enFile]) {
    assert.ok(/consonant/.test(code(f)) && /vowel/.test(code(f)),
      `${rel(f)} stopped naming the shared roles — this check now proves nothing`);
  }
});

test('D21 — no component calls `toUpperCase()` or hard-codes a case', () => {
  // `ui.md` §8.2.2 item 3: **a `toUpperCase()` in a component is a bug**, in exactly the
  // sense §5.1 means for a colour literal — right in one language, wrong in the other,
  // and unreversible without a developer. The casing is one pack field, read once at load
  // and applied at one place in the glyph component.
  const applied = [];
  for (const f of APP_FILES) {
    const c = code(f);
    assert.ok(!/\.toUpperCase\(|\.toLocaleUpperCase\(/.test(c),
      `${rel(f)} upper-cases a glyph in a component`);
    assert.ok(!/textTransform/.test(c), `${rel(f)} hard-codes a case in a style`);
    if (/applyCasing/.test(c)) applied.push(path.relative(SRC, f));
  }
  // Exactly one place applies it, and it is the glyph component (D17, D18, D22).
  assert.deepEqual(applied, [path.join('ui', 'Text.js')]);
  const text = code(path.join(SRC, 'ui', 'Text.js'));
  assert.equal((text.match(/applyCasing\(/g) ?? []).length, 1,
    'the casing is applied in more than one place in the glyph component');
  // D24 — the parent surfaces show her exactly what she typed, so neither parent text
  // component may consume it.
  const parentText = text.slice(text.indexOf('export function AppText'), text.indexOf('export function Glyph'));
  assert.ok(!/applyCasing/.test(parentText), 'a parent surface upper-cases her words');
});

test('R4 — no coalescing onto the other language anywhere in the app layer', () => {
  for (const f of APP_FILES) {
    const c = code(f);
    assert.ok(!/(\?\?|\|\|)\s*['"](?:vi|en)['"]/.test(c), `${rel(f)} coalesces onto a language`);
    assert.ok(!/(\?\?|\|\|)\s*(?:vi|en)Pack\b/.test(c), `${rel(f)} coalesces onto a pack`);
  }
});

/* ------------------------------------------------------- §N touch latency */

test('N1 — every press that must fire on touch-down sets `delayPressIn={0}`', () => {
  // **A Tier-3 find, promoted to a Tier-1 gate.** `react-native-web`'s press responder
  // defaults `delayPressIn` to **50 ms** (`PressResponder.js`, `DEFAULT_PRESS_DELAY_MS`).
  // Measured in a browser: a tap held for 0, 10 or 40 ms fired **nothing at all**, and an
  // 80 ms hold delivered `onPressIn` 49 ms late. `ui.md` §11.1 budgets 60 ms from
  // touch-down to sound, and a 4-year-old's tap is well under 50 ms — so the default
  // silently drops his taps. No behaviour test below Tier 3 can see this, and Tier 3 saw
  // it once; this is what stops it coming back.
  for (const f of APP_FILES) {
    const c = code(f);
    for (const m of c.matchAll(/<Pressable\b([\s\S]*?)>/g)) {
      const attrs = m[1];
      if (!/onPressIn\s*=/.test(attrs)) continue;
      assert.ok(/delayPressIn\s*=\s*\{\s*0\s*\}/.test(attrs),
        `${rel(f)}: a Pressable with onPressIn and no delayPressIn={0} — its touch-down is 50 ms late and a fast tap is dropped entirely`);
    }
  }
});

test('an overlay is made inert by the style key, never by the deprecated prop', () => {
  // `pointerEvents` as a **prop** is deprecated in React Native 0.81 and is not applied
  // by react-native-web 0.21 — measured: an overlay declaring it kept a computed
  // `pointer-events: auto`, so it was still swallowing pointers. The style key works on
  // both (native since RN 0.73).
  for (const f of APP_FILES) {
    const c = code(f);
    assert.ok(!/\bpointerEvents\s*=\s*["{]/.test(c),
      `${rel(f)} sets pointerEvents as a prop; use \`style={{ pointerEvents: 'none' }}\``);
  }
});

/* -------------------------------------------------------------------- hygiene */

test('no console.log in a render path', () => {
  for (const f of APP_FILES) {
    assert.ok(!/\bconsole\s*\.\s*(log|warn|error|info|debug)\s*\(/.test(code(f)),
      `${rel(f)} logs to the console`);
  }
});

test('the state layer owns the timers — no component schedules one directly', () => {
  // `development-process.md` §3: the React state layer owns **every** timer, with
  // explicit cleanup. A `setTimeout` in a component is a timer with no owner.
  const allowed = new Set([
    path.join('src', 'state', 'timers.mjs'),      // the bag itself
    path.join('src', 'audio', 'channels.mjs'),    // the 800 ms fade's stepper, cleared on dispose
  ]);
  for (const f of APP_FILES) {
    if (allowed.has(rel(f))) continue;
    const c = code(f);
    for (const t of ['setTimeout(', 'setInterval(', 'requestAnimationFrame(']) {
      assert.ok(!c.includes(t), `${rel(f)} schedules a ${t.slice(0, -1)} outside the timer bag`);
    }
  }
});

test('AsyncStorage is reachable from exactly one module, and holds settings only (A7)', () => {
  const importers = APP_FILES.filter((f) => /async-storage/.test(code(f)));
  assert.deepEqual(importers.map(rel), [path.join('src', 'settings', 'settings.js')]);

  const settingsFile = path.join(SRC, 'settings', 'settings.js');
  const src = readFileSync(settingsFile, 'utf8');
  // Only scalars may be declared, so there is no shape into which a pack could be put.
  for (const m of src.matchAll(/type:\s*'(\w+)'/g)) {
    assert.ok(['boolean', 'tristate', 'enum'].includes(m[1]), `settings declare a ${m[1]}`);
  }
  assert.ok(!/\bpack\b|\bimage\b|\bmedia\b/i.test(code(settingsFile)),
    'the settings module names content');
});

test('the web build cannot reach expo-file-system (it warns and stubs on web)', () => {
  const webFiles = APP_FILES.filter((f) => f.endsWith('.web.js'));
  assert.ok(webFiles.length >= 1, 'there is no web variant at all');
  for (const f of webFiles) {
    assert.ok(!/expo-file-system/.test(code(f)), `${rel(f)} imports expo-file-system`);
  }
  // And the native module that does import it has a web twin, so Metro has something to
  // resolve to. A missing twin would only show up as a warning in a browser console.
  for (const f of APP_FILES) {
    if (!/from\s+'expo-file-system'/.test(code(f))) continue;
    const twin = f.replace(/\.js$/, '.web.js');
    assert.doesNotThrow(() => statSync(twin), `${rel(f)} imports expo-file-system with no ${path.basename(twin)}`);
  }
});

test('the audio test double has exactly the real engine’s surface', () => {
  // A double with extra methods is a double that can drift from the thing it stands in
  // for, and a headless suite that passes against a drifted double is worse than none.
  // The channels, not the platform wrapper: `engine.js` is four lines that hand
  // `expo-audio`'s player to `createChannels`, and the surface the controller uses is
  // the channels' (`src/audio/channels.mjs`).
  const real = readFileSync(path.join(SRC, 'audio', 'channels.mjs'), 'utf8');
  const fake = readFileSync(path.join(REPO, 'test', 'helpers', 'harness.mjs'), 'utf8');
  const methods = (src, from) => {
    const body = src.slice(src.indexOf(from));
    return [...new Set([...body.matchAll(/^\s{4}(\w+)\s*[(:]/gm)].map((m) => m[1]))].sort();
  };
  // The four the double adds are observation only — a test has to be able to read what
  // was played. Everything else must exist on both sides.
  const OBSERVERS = ['log', 'prepared', 'isDisposed', 'drain'];
  const realMethods = methods(real, '  return {');
  const fakeMethods = methods(fake, 'export function createFakeAudio').filter((m) => !OBSERVERS.includes(m));
  assert.deepEqual(fakeMethods, realMethods);
});

test('V29 — no swipe, drag or pan gesture exists anywhere; a page change is a TAP', () => {
  // `gameplay.md` §4.1 and `ui.md` §4.4a: paging is a tap on a 72 pt button or an
  // auto-advance, and **adding a swipe would put `react-native-gesture-handler` back in
  // the manifest**. O2 covers the dependency; this covers the hand-rolled version.
  for (const f of APP_FILES) {
    const c = code(f);
    for (const token of ['PanResponder', 'onSwipe', 'ScrollView', 'FlatList', 'onPanResponder']) {
      if (rel(f).includes('AlbumScreen') && token === 'ScrollView') continue; // H9 — the album scrolls
      if (rel(f).includes('ParentChrome') && token === 'ScrollView') continue; // parent surfaces
      assert.ok(!c.includes(token), `${rel(f)} uses ${token}`);
    }
  }
});

test('V10 — the page change is a translateX on one sheet, never a cross-fade in place', () => {
  const c = code(path.join(SRC, 'ui', 'CharacterTable.js'));
  assert.ok(/translateX/.test(c), 'the table does not slide');
  assert.ok(/reduced \?/.test(c), 'reduce-motion has no separate path (§10.5 — it cross-fades)');
  // And the pages are laid out side by side, so the window moves rather than the cells.
  assert.ok(/flexDirection: 'row'/.test(c));
});

test('every UI sound the state layer reads is actually bundled', () => {
  // The `socket` key outlived the ∅ tile by exactly one revision, and a key the bundle
  // does not have is a silent failure: `ui.page ?? null` plays nothing and says nothing.
  const controller = readFileSync(path.join(SRC, 'state', 'gameController.mjs'), 'utf8');
  const bundle = readFileSync(path.join(REPO, 'assets', 'audio', 'index.js'), 'utf8');
  const bundled = new Set([...bundle.matchAll(/^\s{2}(\w+):\s*require/gm)].map((m) => m[1]));
  const read = new Set([...controller.matchAll(/ui\.(\w+)\s*\?\?/g)].map((m) => m[1]));
  assert.ok(read.size >= 5, `only ${read.size} UI sounds are read — is the audit looking at the right file?`);
  for (const key of read) {
    if (key === 'cheer') continue; // one optional recording per pack, never bundled (E14)
    assert.ok(bundled.has(key), `the controller plays ui.${key}, which the bundle does not have`);
  }
  for (const key of bundled) {
    assert.ok(read.has(key) || key.startsWith('motif'),
      `${key}.wav is bundled and nothing plays it`);
  }
});

test('no dead export in the app layer', () => {
  const corpus = [...APP_FILES, ...sources(path.join(REPO, 'test'))]
    .map((f) => readFileSync(f, 'utf8')).join('\n');
  for (const f of APP_FILES) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)/g)) {
      const uses = [...corpus.matchAll(new RegExp(`\\b${m[1]}\\b`, 'g'))].length;
      assert.ok(uses > 1, `${rel(f)} exports ${m[1]}, which nothing imports`);
    }
  }
});
