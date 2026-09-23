// A structural audit of `src/engine/`.
//
// `development-process.md` §5: *some defects no tier below 5 can represent at all …
// when a property is like that, audit it structurally in Tier 1 rather than testing the
// behaviour anywhere.* The architectural rule is one of those. A `Date.now()` added to
// the engine next month would not fail a behaviour test — it would fail a replay, six
// weeks later, in front of the tester, with no clue why.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { REPO } from './helpers/load.mjs';

const ENGINE = path.join(REPO, 'src', 'engine');

function sources(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...sources(p));
    // Slice 3 added `.js` to `src/` — the React layer. The engine is still all `.mjs`,
    // so `FILES` below is unchanged, but the manifest audit has to see the React layer
    // or every dependency the app actually uses would read as unimported.
    else if (/\.(mjs|jsx?)$/.test(name)) out.push(p);
  }
  return out.sort();
}

/** Strip comments and strings so a banned token in prose is not a false positive. */
function code(file) {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1 ')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``');
}

const FILES = sources(ENGINE);

test('there is an engine to audit', () => {
  assert.ok(FILES.length >= 8, `only found ${FILES.length} engine files`);
});

test('the engine imports no React, no renderer and no on-device module', () => {
  const banned = [/\breact\b/i, /react-native/i, /expo[-/]/i, /@react/i];
  for (const f of FILES) {
    for (const m of code(f).matchAll(/\bfrom\s+(''|""|``)/g)) void m;
    const raw = readFileSync(f, 'utf8');
    for (const m of raw.matchAll(/^\s*(?:import|export)[^;]*?from\s+['"]([^'"]+)['"]/gm)) {
      const spec = m[1];
      for (const b of banned) {
        assert.ok(!b.test(spec), `${path.relative(REPO, f)} imports ${spec}`);
      }
      assert.ok(!spec.startsWith('node:'), `${path.relative(REPO, f)} imports the Node builtin ${spec}`);
      assert.ok(!spec.includes('tools/'), `${path.relative(REPO, f)} imports from tools/ — the app must not bundle the asset pipeline`);
      assert.ok(spec.startsWith('.'), `${path.relative(REPO, f)} imports the bare specifier ${spec}; the engine has no dependencies`);
    }
  }
});

test('no clock: no Date, no Date.now, no performance.now', () => {
  for (const f of FILES) {
    const c = code(f);
    assert.ok(!/\bDate\b/.test(c), `${path.relative(REPO, f)} mentions Date`);
    assert.ok(!/performance\s*\.\s*now/.test(c), `${path.relative(REPO, f)} uses performance.now`);
  }
});

test('no timers: no setTimeout, setInterval, requestAnimationFrame or queueMicrotask', () => {
  for (const f of FILES) {
    const c = code(f);
    for (const t of ['setTimeout', 'setInterval', 'setImmediate', 'requestAnimationFrame', 'queueMicrotask']) {
      assert.ok(!c.includes(t), `${path.relative(REPO, f)} uses ${t}`);
    }
  }
});

test('no unseeded randomness: Math.random appears nowhere', () => {
  for (const f of FILES) {
    assert.ok(!/Math\s*\.\s*random/.test(code(f)), `${path.relative(REPO, f)} uses Math.random`);
  }
});

test('no filesystem, no network, no storage', () => {
  for (const f of FILES) {
    const c = code(f);
    for (const t of ['readFileSync', 'writeFile', 'fetch(', 'XMLHttpRequest', 'AsyncStorage', 'localStorage', 'require(']) {
      assert.ok(!c.includes(t), `${path.relative(REPO, f)} uses ${t}`);
    }
  }
});

test('no console anywhere in the engine', () => {
  for (const f of FILES) {
    assert.ok(!/\bconsole\s*\./.test(code(f)), `${path.relative(REPO, f)} logs to the console`);
  }
});

test('no colour literals — the engine has no opinion about pixels (acceptance-criteria S3)', () => {
  for (const f of FILES) {
    assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(readFileSync(f, 'utf8').replace(/§/g, '')),
      `${path.relative(REPO, f)} contains what looks like a colour literal`);
  }
});

test('no runtime code composes a Vietnamese spelling or places a tone mark (K5)', () => {
  // A combining diacritic in the engine source would mean somebody was building a
  // spelling out of parts. `literacy-vi.md` §5.4 puts that in the editor, in front of a
  // human, and the spellings are stored data.
  const COMBINING = /[̀-ͯ҃-҉᪰-᫿᷀-᷿]/;
  for (const f of FILES) {
    assert.ok(!COMBINING.test(readFileSync(f, 'utf8')),
      `${path.relative(REPO, f)} contains a combining diacritic`);
    assert.ok(!/normalize\(\s*['"]NF(?:D|KD|KC)['"]/.test(readFileSync(f, 'utf8')),
      `${path.relative(REPO, f)} normalises to something other than NFC`);
    assert.ok(!/viApplyTone|viTonedForms/.test(code(f)), `${path.relative(REPO, f)} calls the tone-mark placer`);
  }
});

test('the only file that names both languages is lang/index.mjs (acceptance-criteria R4)', () => {
  const offenders = [];
  for (const f of FILES) {
    const rel = path.relative(ENGINE, f);
    if (rel === path.join('lang', 'index.mjs')) continue;
    if (rel === 'pack.mjs') continue; // resolvePack must reject the wrong language at the door
    const c = code(f);
    const namesVi = /\bvi\b/.test(c) || /'vi'/.test(readFileSync(f, 'utf8'));
    const namesEn = /\ben\b/.test(c) || /'en'/.test(readFileSync(f, 'utf8'));
    if (namesVi && namesEn) offenders.push(rel);
  }
  // Revision 2 removed the last per-language constant table: `stages.mjs` is now five
  // numbers that are the same in both languages, so **no file below `lang/index.mjs`
  // sees both languages at all**. That is a stronger position than Slice 2 held, and it
  // is asserted as an empty list rather than as an allow-list, so a new offender is a
  // failure rather than an entry somebody adds.
  assert.deepEqual(offenders.sort(), []);
});

test('no fallback or coalescing onto the other language (acceptance-criteria R4)', () => {
  // The specific shape R4 forbids: reaching for the other pack when this one is short.
  for (const f of FILES) {
    const c = readFileSync(f, 'utf8');
    assert.ok(!/(\?\?|\|\|)\s*(packs?\.)?(vi|en)\b/.test(c),
      `${path.relative(REPO, f)} coalesces onto a language`);
  }
});

test('the manifest carries neither Reanimated nor gesture-handler (acceptance-criteria O2)', () => {
  const pkg = JSON.parse(readFileSync(path.join(REPO, 'package.json'), 'utf8'));
  const all = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  assert.equal(all['react-native-reanimated'], undefined);
  assert.equal(all['react-native-gesture-handler'], undefined);
});

test('every dependency in the manifest is imported by something (hygiene)', () => {
  const pkg = JSON.parse(readFileSync(path.join(REPO, 'package.json'), 'utf8'));
  const declared = Object.keys({ ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) });

  const all = [...sources(path.join(REPO, 'src')), ...sources(path.join(REPO, 'test'))];
  // The toolchain configs name packages as bare strings rather than importing them —
  // `babel.config.js` lists a preset, `metro.config.js` requires one — so they are read
  // with a looser extractor: any quoted token that resolves in `node_modules` counts.
  const configs = ['babel.config.js', 'metro.config.js', 'index.js']
    .map((f) => path.join(REPO, f))
    .filter((f) => { try { readFileSync(f); return true; } catch { return false; } });

  const imported = new Set();
  const note = (raw) => {
    if (!raw || raw.startsWith('.') || raw.startsWith('/')) return;
    imported.add(raw.startsWith('@') ? raw.split('/').slice(0, 2).join('/') : raw.split('/')[0]);
  };
  for (const f of all) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) note(m[1]);
    for (const m of src.matchAll(/(?:^|[^.\w])import\s+['"]([^'"]+)['"]/g)) note(m[1]);
    for (const m of src.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) note(m[1]);
  }
  for (const f of configs) {
    for (const m of readFileSync(f, 'utf8').matchAll(/['"]([@\w][^'"\n]*)['"]/g)) {
      const name = m[1].startsWith('@') ? m[1].split('/').slice(0, 2).join('/') : m[1].split('/')[0];
      try {
        statSync(path.join(REPO, 'node_modules', name, 'package.json'));
        imported.add(name);
      } catch { /* not a package name, just a string */ }
    }
  }

  // The other real exception: a **peer dependency of something we do import**, which the
  // bundler resolves by name and no source file names. `react-dom` is a peer of
  // `@expo/metro-runtime` and `react-native-web` a peer of `expo-system-ui`; dropping
  // either breaks `expo start --web` even though no `import` mentions them. The exemption
  // is derived from the installed manifests, so a package that stops being a peer stops
  // being exempt.
  const peers = new Set();
  for (const name of imported) {
    try {
      const meta = JSON.parse(readFileSync(path.join(REPO, 'node_modules', name, 'package.json'), 'utf8'));
      for (const p of Object.keys(meta.peerDependencies ?? {})) peers.add(p);
    } catch { /* not an installed package — a relative path or a node builtin */ }
  }

  for (const d of declared) {
    assert.ok(imported.has(d) || peers.has(d), `${d} is declared but nothing imports it`);
  }
});

test('no engine export is dead — each is re-exported by index.mjs or used by a sibling', async () => {
  const index = await import('../src/engine/index.mjs');
  const published = new Set(Object.keys(index));
  // A test is a consumer: `rules.mjs` publishes constants whose only job is to be
  // compared against `tools/lib/rules.mjs`, and that comparison is the guarantee.
  const usedBySibling = new Set();
  const whole = new Set();
  for (const f of [...FILES, ...sources(path.join(REPO, 'test'))]) {
    const raw = readFileSync(f, 'utf8');
    for (const m of raw.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"][^'"]*['"]/gs)) {
      for (const name of m[1].split(',')) {
        const n = name.trim().split(/\s+as\s+/)[0].trim();
        if (n) usedBySibling.add(n);
      }
    }
    for (const m of raw.matchAll(/import\s*\*\s*as\s*(\w+)\s*from\s*['"]([^'"]+)['"]/g)) {
      usedBySibling.add(`*${m[1]}`);
      // A namespace import consumes the whole module surface. `test/rules-parity.test.mjs`
      // does exactly that on purpose: every rule the runtime publishes is compared
      // against `tools/lib/rules.mjs`.
      whole.add(path.basename(m[2]));
    }
  }
  // `lang/vi.mjs` and `lang/en.mjs` are consumed through `langFor`, so their exports are
  // reached by namespace import rather than by name.
  const namespaced = usedBySibling.has('*vi') && usedBySibling.has('*en');
  assert.ok(namespaced, 'the language modules must be imported as namespaces');

  // **The language modules need their own rule.** They are reached through `langFor`, so
  // a namespace import exempts every one of their exports from the check below — and four
  // dead ones survived revision 4's rewrite that way (`bareMark`, `rolesOf`, `rimeOf`,
  // `blendOf`, plus an unreferenced `id`). What consumes them is a `lang.NAME` call in the
  // engine or a test, so that is what is required.
  const langCorpus = [...FILES, ...sources(path.join(REPO, 'test'))]
    .map((f) => readFileSync(f, 'utf8')).join('\n');
  for (const name of ['vi', 'en']) {
    const mod = await import(`file://${path.join(ENGINE, 'lang', `${name}.mjs`)}`);
    for (const key of Object.keys(mod)) {
      const used = new RegExp(`(?:lang|langFor\\([^)]*\\)|${name})\\.${key}\\b`).test(langCorpus);
      assert.ok(used, `lang/${name}.mjs exports ${key}, which nothing calls through langFor`);
    }
  }

  const dead = [];
  for (const f of FILES) {
    const rel = path.relative(ENGINE, f);
    if (rel === 'index.mjs' || rel.startsWith(`lang${path.sep}`)) continue;
    if (whole.has(path.basename(f))) continue;
    const mod = await import(`file://${f}`);
    for (const name of Object.keys(mod)) {
      if (!published.has(name) && !usedBySibling.has(name)) dead.push(`${rel}:${name}`);
    }
  }
  assert.deepEqual(dead, [], 'dead exports');
});
