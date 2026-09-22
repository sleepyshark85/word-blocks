#!/usr/bin/env node
// Fetch photo candidates for a word from Wikipedia + Wikimedia Commons.
//
// WHY THIS EXISTS. Openverse free-text search was measured at roughly 28% usable for
// toddler vocabulary and 0/12 for "car" — it returned an F1 car, a train, a dealership
// sign, a newspaper advertisement and a vintage pin-up ad. Relevance ranking is not
// judgement, and for a 4-year-old's picture dictionary it is not close to good enough.
//
// Wikipedia's lead image is different in kind: a human chose it to be the single most
// representative picture of the concept. "Car" yields a Toyota Corolla. That is exactly
// the prototype a toddler needs. Commons categories then supply the variety.
//
//   node tools/fetch-wiki-candidates.mjs --n 10 cat bird car
//
// Licensing: Commons files are individually licensed (mostly CC BY-SA / CC0 / PD) and
// each candidate's licence and author are recorded in candidates.json. Attribution is
// per image and must be carried into the app if the owner publishes.

import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const UA = { 'User-Agent': 'toddler-word-app/0.1 (personal educational project)' };
const argv = process.argv.slice(2);
let n = 10, out = 'samples/wiki-candidates';
const words = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === '--n') { n = Number(argv[i + 1]); i += 1; }
  else if (argv[i] === '--out') { out = argv[i + 1]; i += 1; }
  else words.push(argv[i]);
}

const j = async (u) => (await fetch(u, { headers: UA })).json();

/** The Commons category for a concept, via Wikidata P373. */
async function commonsCategory(title) {
  const d = await j(`https://www.wikidata.org/w/api.php?action=wbgetentities&sites=enwiki&titles=${encodeURIComponent(title)}&props=claims&format=json&origin=*`);
  const ent = Object.values(d.entities ?? {})[0];
  const c = ent?.claims?.P373?.[0]?.mainsnak?.datavalue?.value;
  return c ? `Category:${c}` : null;
}

async function leadImage(title) {
  try {
    const d = await j(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    return d?.originalimage?.source ?? d?.thumbnail?.source ?? null;
  } catch { return null; }
}

async function categoryFiles(cat, limit) {
  const p = new URLSearchParams({
    action: 'query', generator: 'categorymembers', gcmtitle: cat, gcmtype: 'file',
    gcmlimit: String(limit), prop: 'imageinfo', iiprop: 'url|extmetadata',
    iiurlwidth: '1024', format: 'json', origin: '*',
  });
  const d = await j(`https://commons.wikimedia.org/w/api.php?${p}`);
  return Object.values(d?.query?.pages ?? {});
}

function normalise(src, dst) {
  execFileSync('magick', [`${src}[0]`, '-resize', '512x512^', '-gravity', 'center',
    '-extent', '512x512', '-quality', '82', dst], { stdio: 'pipe' });
}

for (const word of words) {
  const title = word[0].toUpperCase() + word.slice(1);
  const dir = path.join(out, word);
  mkdirSync(dir, { recursive: true });

  const picks = [];
  const lead = await leadImage(title);
  if (lead) picks.push({ url: lead, title: `${title} (Wikipedia lead image)`, license: 'see Commons', creator: '' });

  const cat = await commonsCategory(title);
  if (cat) {
    for (const p of await categoryFiles(cat, n * 3)) {
      const ii = p.imageinfo?.[0]; if (!ii?.thumburl) continue;
      const em = ii.extmetadata ?? {};
      picks.push({ url: ii.thumburl, title: p.title.replace(/^File:/, ''),
        license: em.LicenseShortName?.value ?? '?', creator: (em.Artist?.value ?? '').replace(/<[^>]+>/g, '').slice(0, 60) });
    }
  }

  const meta = []; let kept = 0;
  for (const p of picks) {
    if (kept >= n) break;
    const raw = path.join(dir, `_raw${kept}`);
    const jpg = path.join(dir, `${String(kept).padStart(2, '0')}.jpg`);
    try {
      const buf = Buffer.from(await (await fetch(p.url, { headers: UA })).arrayBuffer());
      if (buf.length < 3000) continue;
      writeFileSync(raw, buf);
      normalise(raw, jpg);
      meta.push({ idx: kept, ...p });
      kept += 1;
    } catch { /* skip */ }
  }
  writeFileSync(path.join(dir, 'candidates.json'), JSON.stringify(meta, null, 2));

  if (kept) {
    const labelled = meta.map((m, i) => {
      const o = path.join(dir, `_lab${i}.png`);
      execFileSync('magick', [path.join(dir, `${String(m.idx).padStart(2, '0')}.jpg`), '-resize', '256x256',
        '-background', 'white', '-splice', '0x28', '-gravity', 'northwest',
        '-pointsize', '22', '-fill', 'black', '-annotate', '+6+2', `${i}`, o], { stdio: 'pipe' });
      return o;
    });
    execFileSync('magick', ['montage', '-background', 'white', '-tile', '5x',
      '-geometry', '256x284+4+4', ...labelled, path.join(out, `SHEET-${word}.png`)], { stdio: 'pipe' });
  }
  console.log(`${word}: ${kept} candidates (cat=${cat ?? 'none'}) -> ${out}/SHEET-${word}.png`);
}
