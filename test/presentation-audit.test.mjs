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
  const viFile = path.join(SRC, 'ui', 'screens', 'BoardVi.js');
  const enFile = path.join(SRC, 'ui', 'screens', 'BoardEn.js');
  assert.ok(!/BoardEn|\bletter\b|\bvowel\b|consonant/.test(code(viFile)),
    'the Vietnamese board names an English concept');
  assert.ok(!/BoardVi|\bonset\b|\brime\b|\btone\b|role3/.test(code(enFile)),
    'the English board names a Vietnamese concept');
  // D6 — `role3` is never rendered in English mode.
  assert.ok(!/role3/.test(code(enFile)));
});

test('R4 — no coalescing onto the other language anywhere in the app layer', () => {
  for (const f of APP_FILES) {
    const c = code(f);
    assert.ok(!/(\?\?|\|\|)\s*['"](?:vi|en)['"]/.test(c), `${rel(f)} coalesces onto a language`);
    assert.ok(!/(\?\?|\|\|)\s*(?:vi|en)Pack\b/.test(c), `${rel(f)} coalesces onto a pack`);
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
    path.join('src', 'audio', 'engine.js'),       // the 800 ms fade's stepper
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
  const real = readFileSync(path.join(SRC, 'audio', 'engine.js'), 'utf8');
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
