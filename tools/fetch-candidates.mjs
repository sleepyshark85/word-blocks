#!/usr/bin/env node
// Fetch photo CANDIDATES for a word from Openverse, normalise them, and build a
// numbered contact sheet for a human (or the orchestrator) to curate.
//
// This tool deliberately does NOT choose the pictures. Openverse's top result for
// "cat" is a photo titled "Cat Fish 2"; ranking is not judgement. The tool's job is
// to put N plausible candidates in front of an eye that can reject the catfish.
//
//   node tools/fetch-candidates.mjs cat bird car
//   node tools/fetch-candidates.mjs --n 12 --out samples/candidates cat
//
// Licences are restricted to cc0/pdm/by/by-sa. `nc` is excluded because the owner
// may publish; `nd` is excluded because we resize and crop, which a NoDerivatives
// term does not permit.

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ALLOWED = 'cc0,pdm,by,by-sa';
const UA = 'toddler-word-app/0.1 (personal educational project)';

const argv = process.argv.slice(2);
let n = 12, out = 'samples/candidates';
const words = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === '--n') { n = Number(argv[i + 1]); i += 1; }
  else if (argv[i] === '--out') { out = argv[i + 1]; i += 1; }
  else words.push(argv[i]);
}
if (!words.length) { console.error('usage: fetch-candidates.mjs [--n 12] [--out dir] <word>...'); process.exit(2); }

/**
 * Anonymous Openverse requests are capped at `page_size=20` and answer a larger one
 * with 401, not 400 — which reads as an auth problem and is not one. Paginate instead.
 */
const PAGE_MAX = 20;

async function search(word) {
  const want = n * 2; // over-fetch: dead links and duplicates are normal
  const out = [];
  for (let page = 1; out.length < want && page <= 4; page += 1) {
    const p = new URLSearchParams({
      q: word, category: 'photograph', license: ALLOWED,
      page_size: String(Math.min(want - out.length, PAGE_MAX)), page: String(page),
    });
    const res = await fetch(`https://api.openverse.org/v1/images/?${p}`, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`openverse ${res.status} (page ${page})`);
    const batch = (await res.json()).results ?? [];
    if (!batch.length) break;
    out.push(...batch);
  }
  return out;
}

/** 512x512 centre-cropped JPEG. Uniform geometry is what makes a contact sheet readable. */
function normalise(src, dst) {
  execFileSync('magick', [src, '-resize', '512x512^', '-gravity', 'center',
    '-extent', '512x512', '-quality', '82', dst], { stdio: 'pipe' });
}

for (const word of words) {
  const dir = path.join(out, word);
  mkdirSync(dir, { recursive: true });
  let results;
  try { results = await search(word); }
  catch (e) { console.error(`${word}: search failed — ${e.message}`); continue; }

  const meta = [];
  let kept = 0;
  for (const r of results) {
    if (kept >= n) break;
    if (!r.url) continue;
    const raw = path.join(dir, `_raw${kept}`);
    const jpg = path.join(dir, `${String(kept).padStart(2, '0')}.jpg`);
    try {
      const buf = Buffer.from(await (await fetch(r.url, { headers: { 'User-Agent': UA } })).arrayBuffer());
      if (buf.length < 2000) continue;
      writeFileSync(raw, buf);
      normalise(raw, jpg);
      meta.push({ idx: kept, title: r.title ?? '', license: r.license, license_url: r.license_url,
                  creator: r.creator ?? '', source: r.source, foreign_landing_url: r.foreign_landing_url });
      kept += 1;
    } catch { /* a dead link is not a failure of the run */ }
  }
  writeFileSync(path.join(dir, 'candidates.json'), JSON.stringify(meta, null, 2));

  // numbered contact sheet
  if (kept) {
    const tiles = meta.map((m) => path.join(dir, `${String(m.idx).padStart(2, '0')}.jpg`));
    const labelled = tiles.map((t, i) => {
      const o = path.join(dir, `_lab${i}.png`);
      execFileSync('magick', [t, '-resize', '256x256', '-background', 'white', '-splice', '0x28',
        '-gravity', 'northwest', '-pointsize', '22', '-fill', 'black', '-annotate', `+6+2`, `${i}`, o], { stdio: 'pipe' });
      return o;
    });
    execFileSync('magick', ['montage', '-background', 'white', '-tile', '4x',
      '-geometry', '256x284+4+4', ...labelled, path.join(out, `SHEET-${word}.png`)], { stdio: 'pipe' });
  }
  console.log(`${word}: ${kept} candidates -> ${out}/SHEET-${word}.png`);
}
