#!/usr/bin/env node
// Build the two bundled faces from the upstream `google/fonts` release.
//
// `ui.md` §6.0–6.0.1 and `acceptance-criteria.md` Q1–Q10. Two things this script exists
// to guarantee, neither of which a hand-downloaded .ttf gives you:
//
//   1. **The tile face is a subset**, Latin + the Vietnamese block, ≤ 150 KB (Q5c). The
//      upstream Baloo 2 is 683 KB because it carries Devanagari, which this app will
//      never render.
//   2. **The tile face is a static instance at wght 600** (`ui.md` §6.4). React Native
//      does not expose variable-font axes, so shipping the variable file would render
//      the default weight and quietly lose the "block letter" weight §6.0.1 chose it for.
//
// Network is used HERE, at build time, and nowhere in the app (`decisions.md`: runtime
// network — none). Output is committed; this script is how it is reproduced.
//
//   node scripts/build-fonts.mjs

import { mkdir, writeFile, readFile, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, '.fontcache');
const OUT = path.join(ROOT, 'assets', 'fonts');
const PY = path.join(ROOT, 'tools', '.venv', 'bin', 'python');
const PYFTSUBSET = path.join(ROOT, 'tools', '.venv', 'bin', 'pyftsubset');

const UPSTREAM = 'https://raw.githubusercontent.com/google/fonts/main/ofl';

// Latin, the combining marks an NFD string could arrive carrying, Latin Extended
// Additional (where `ạ`–`ỹ` live), punctuation, and `₫`.
const UNICODES = 'U+0000-024F,U+0300-036F,U+1E00-1EFF,U+2000-206F,U+20AB,U+2122';

const JOBS = [
  {
    upstream: 'baloo2/Baloo2%5Bwght%5D.ttf',
    cache: 'Baloo2-variable.ttf',
    instance: 'wght=600',
    out: 'Baloo2-SemiBold.ttf',
  },
  { upstream: 'bevietnampro/BeVietnamPro-Regular.ttf', cache: 'BeVietnamPro-Regular.ttf', out: 'BeVietnamPro-Regular.ttf' },
  { upstream: 'bevietnampro/BeVietnamPro-Medium.ttf', cache: 'BeVietnamPro-Medium.ttf', out: 'BeVietnamPro-Medium.ttf' },
  { upstream: 'bevietnampro/BeVietnamPro-SemiBold.ttf', cache: 'BeVietnamPro-SemiBold.ttf', out: 'BeVietnamPro-SemiBold.ttf' },
];

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function download(job) {
  const dest = path.join(CACHE, job.cache);
  if (await exists(dest)) return dest;
  const url = `${UPSTREAM}/${job.upstream}`;
  process.stdout.write(`  fetch ${url}\n`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}

async function main() {
  await mkdir(CACHE, { recursive: true });
  await mkdir(OUT, { recursive: true });

  const fixture = await readFile(path.join(OUT, 'FIXTURE.txt'), 'utf8');
  const wanted = [...new Set([...fixture.normalize('NFC')].filter((c) => c.trim()))].sort();

  for (const job of JOBS) {
    let src = await download(job);

    if (job.instance) {
      const instanced = path.join(CACHE, job.out);
      await run(PY, ['-m', 'fontTools.varLib.instancer', src, job.instance, '-o', instanced]);
      src = instanced;
    }

    const out = path.join(OUT, job.out);
    await run(PYFTSUBSET, [
      src,
      `--unicodes=${UNICODES}`,
      '--layout-features=*',         // ccmp/mark/mkmk compose `ộ` and `ẫ` — Q5
      '--notdef-outline',
      '--name-IDs=*',
      '--recalc-bounds',
      `--output-file=${out}`,
    ]);

    const { size } = await stat(out);
    const cmap = JSON.parse((await run(PY, ['-c', `
import sys, json
from fontTools.ttLib import TTFont
f = TTFont(sys.argv[1])
print(json.dumps(sorted(f.getBestCmap().keys())))
`, out])).stdout);
    const have = new Set(cmap);
    const missing = wanted.filter((c) => !have.has(c.codePointAt(0)));
    process.stdout.write(
      `  ${job.out.padEnd(28)} ${String(Math.round(size / 1024)).padStart(4)} KB  `
      + `fixture ${wanted.length - missing.length}/${wanted.length}`
      + `${missing.length ? `  MISSING ${missing.join('')}` : ''}\n`,
    );
    if (missing.length) process.exitCode = 1;
  }
}

main().catch((e) => { process.stderr.write(`${e.stack}\n`); process.exit(1); });
