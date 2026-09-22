#!/usr/bin/env node
// Fetch photo CANDIDATES for words and build numbered contact sheets for a human to
// curate. Wikipedia lead image first, then Commons category members.
//
//   node tools/fetch-candidates.mjs --pack packs/vi-seed            # every word needing pictures
//   node tools/fetch-candidates.mjs --lang vi --n 10 cat dog bird   # ad hoc
//   node tools/fetch-candidates.mjs --pack packs/vi-seed --resume   # carry on after a 429
//
// This tool deliberately does NOT choose the pictures. `image-sourcing.md` measured
// Openverse free-text at ~28% usable and 0/12 for "car" — an F1 car, a train, a
// dealership sign, a newspaper advertisement and a vintage pin-up ad captioned "BOMBS!".
// Relevance ranking is not judgement, and a picture dictionary for a 4-year-old cannot
// have "nobody looked at it" anywhere in its description. Wikipedia's lead image is
// different in kind — a person chose it to be the most representative picture of the
// concept, and it measured ~77% usable. So: this assembles, a human picks, and
// `pack-import-media.mjs` puts the chosen ones in the pack.
//
// It supersedes the Openverse prototype this file used to contain. That source is
// recorded as REJECTED in `image-sourcing.md` and is not worth keeping runnable.
//
// Two findings from the spike are built in rather than commented on:
//   - Wikipedia 429s after ~13 consecutive fetches, so every request is throttled and
//     every response is cached (lib/http.mjs).
//   - Wikipedia lead images are Anglo-centric ("bus" gives a London double-decker), so
//     `--lang vi` sources from vi.wikipedia.org. A Vietnamese child should see a
//     Vietnamese bus.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Fetcher, RunState } from './lib/http.mjs';
import { readWords, readManifest } from './lib/pack.mjs';

const argv = process.argv.slice(2);
let n = 10;
let out = 'samples/candidates';
let lang = 'en';
let packDir = null;
let gapMs = 1200;
let force = false;
const words = [];
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === '--n') n = Number(argv[++i]);
  else if (a === '--out') out = argv[++i];
  else if (a === '--lang') lang = argv[++i];
  else if (a === '--pack') packDir = argv[++i];
  else if (a === '--gap') gapMs = Number(argv[++i]);
  else if (a === '--force') force = true;
  else if (a === '--resume') force = false; // the default; accepted so the intent can be written down
  else if (a.startsWith('-')) { console.error(`unknown option ${a}`); process.exit(2); }
  else words.push(a);
}

/* Work list: either explicit concepts, or every word in a pack that has no pictures. */
const units = [];
if (packDir) {
  const man = readManifest(packDir)?.manifest;
  if (!man) { console.error(`cannot read ${packDir}/pack.json`); process.exit(2); }
  lang = man.language;
  out = out === 'samples/candidates' ? path.join(packDir, '.candidates') : out;
  for (const { word } of readWords(packDir).ok) {
    if ((word.images?.length ?? 0) > 0 && !force) continue;
    const concept = word.build?.assetConcept;
    if (!concept) { console.error(`${word.id}: no build.assetConcept — skipped`); continue; }
    units.push({ id: word.id, concept, text: word.text });
  }
} else {
  if (!words.length) { console.error('usage: fetch-candidates.mjs [--pack DIR | <concept>...] [--lang vi|en] [--n 10]'); process.exit(2); }
  for (const w of words) units.push({ id: w, concept: w, text: w });
}

mkdirSync(out, { recursive: true });
const http = new Fetcher({ cacheDir: path.join(out, '.cache'), gapMs });
const state = new RunState(path.join(out, 'state.json'));

const WIKI = lang === 'vi' ? 'vi.wikipedia.org' : 'en.wikipedia.org';
const WIKISITE = lang === 'vi' ? 'viwiki' : 'enwiki';

/**
 * `assetConcept` is a phrase chosen for a human ("chicken (hen)", "a bowl of phở").
 * Wikipedia wants a title. Strip the parenthetical and the leading article; if that
 * misses, the word is reported and a person supplies a title. We do not guess twice —
 * `spike-results.md` records what guessing folder names from English words cost.
 */
function toTitle(concept) {
  const s = concept.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/^(a|an|the)\s+/i, '').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * The file name inside an upload.wikimedia.org URL.
 *   .../commons/a/ab/Pho.jpg            -> Pho.jpg
 *   .../commons/thumb/a/ab/Pho.jpg/800px-Pho.jpg -> Pho.jpg
 */
function fileNameFromUpload(url) {
  const segs = new URL(url).pathname.split('/').filter(Boolean);
  const i = segs.indexOf('thumb');
  const name = i >= 0 ? segs[segs.length - 2] : segs[segs.length - 1];
  try { return decodeURIComponent(name); } catch { return name; }
}

/**
 * THE LEAD IMAGE ARRIVES WITHOUT A LICENCE, and that was nearly a hole in the whole
 * pipeline. The REST `page/summary` endpoint returns the image URL and nothing about its
 * terms — so the source measured at ~77% usable, the one `image-sourcing.md` chose as
 * primary, is also the one source whose output could not be attributed. Three curated
 * photos of `phở` went into a pack and the validator rejected the first one for exactly
 * this, which is the check doing its job before ninety words had been curated instead of
 * one.
 *
 * The fix is one extra request per word: look the file up on Commons by name and read
 * its `extmetadata`. Files hosted locally on a wiki rather than on Commons fall back to
 * that wiki. If both come back empty the candidate is still offered — the curator can
 * still look at it — but it carries `license: null`, and the validator will refuse to
 * let it ship. Unattributable is not the same as unusable; it is the same as unshippable.
 */
async function fileLicence(fileUrl) {
  const name = fileNameFromUpload(fileUrl);
  for (const host of ['commons.wikimedia.org', WIKI]) {
    const p = new URLSearchParams({
      action: 'query', titles: `File:${name}`, prop: 'imageinfo',
      iiprop: 'extmetadata|url', format: 'json', origin: '*',
    });
    let data;
    try { ({ data } = await http.json(`https://${host}/w/api.php?${p}`)); } catch { continue; }
    const page = Object.values(data?.query?.pages ?? {})[0];
    if (!page || page.missing !== undefined) continue;
    const em = page.imageinfo?.[0]?.extmetadata ?? {};
    const lic = strip(em.LicenseShortName?.value);
    if (!lic && !em.Artist?.value) continue;
    return {
      license: lic || null,
      licenseUrl: strip(em.LicenseUrl?.value) || null,
      creator: strip(em.Artist?.value).slice(0, 80) || null,
      page: page.imageinfo?.[0]?.descriptionurl ?? `https://${host}/wiki/File:${encodeURIComponent(name)}`,
      fileTitle: name,
    };
  }
  return null;
}

async function leadImage(title) {
  const { data } = await http.json(`https://${WIKI}/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
  if (!data || data.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') return null;
  const url = data.originalimage?.source ?? data.thumbnail?.source ?? null;
  if (!url) return null;
  const lic = await fileLicence(url);
  return {
    url,
    title: lic?.fileTitle ? `${lic.fileTitle} (${WIKI} lead image for "${data.title}")` : `${data.title} (${WIKI} lead image)`,
    page: lic?.page ?? data.content_urls?.desktop?.page ?? null,
    license: lic?.license ?? null,
    licenseUrl: lic?.licenseUrl ?? null,
    creator: lic?.creator ?? null,
  };
}

/**
 * Concept names in the packs are ENGLISH ("cat", "tiger") because that is what
 * `word-list.md` carries. Pointing those at vi.wikipedia.org 404s every time — "Cat" is
 * not a page there, "Mèo" is. So for Vietnamese, resolve the English title through
 * en.wikipedia's langlinks first.
 *
 * Measured before writing this: vi.wikipedia/Cat and /Dog both 404, while langlinks gives
 * Cat -> Mèo, Dog -> Chó, Tiger -> Hổ. Returns null when no Vietnamese article exists,
 * which is a real answer — a concept with no vi article is one a human must name.
 */
async function localiseTitle(enTitle) {
  if (lang !== 'vi') return enTitle;
  const u = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(enTitle)}`
    + `&prop=langlinks&lllang=vi&format=json&origin=*`;
  try {
    const { data } = await http.json(u);
    const pages = data?.query?.pages ?? {};
    for (const pg of Object.values(pages)) {
      const vi = pg?.langlinks?.[0]?.['*'];
      if (vi) return vi;
    }
  } catch { /* fall through - the caller reports the miss */ }
  return null;
}

/** The Commons category for a concept, via Wikidata P373. */
async function commonsCategory(title) {
  const u = `https://www.wikidata.org/w/api.php?action=wbgetentities&sites=${WIKISITE}&titles=${encodeURIComponent(title)}&props=claims&format=json&origin=*`;
  const { data } = await http.json(u);
  const ent = Object.values(data?.entities ?? {})[0];
  const c = ent?.claims?.P373?.[0]?.mainsnak?.datavalue?.value;
  return c ? `Category:${c}` : null;
}

async function categoryFiles(cat, limit) {
  const p = new URLSearchParams({
    action: 'query', generator: 'categorymembers', gcmtitle: cat, gcmtype: 'file',
    gcmlimit: String(limit), prop: 'imageinfo',
    iiprop: 'url|extmetadata|size', iiurlwidth: '1024', format: 'json', origin: '*',
  });
  const { data } = await http.json(`https://commons.wikimedia.org/w/api.php?${p}`);
  return Object.values(data?.query?.pages ?? {});
}

const strip = (s) => (s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/**
 * 64-bit average hash. Commons categories are full of near-duplicates: fetching four
 * candidates for `phở` returned the lead image plus THREE shots of the same stone pot
 * from slightly different angles. That is not four candidates, it is two, and a human
 * curating a contact sheet of duplicates gets less to choose from, not more.
 *
 * Dropping a near-identical frame is the one judgement safe to automate here: it never
 * decides which picture is good, it only stops the same picture being offered twice. The
 * reviewer still sees, and still rejects, everything else.
 */
function aHash(file) {
  const txt = execFileSync('magick', [`${file}[0]`, '-colorspace', 'Gray', '-resize', '8x8!', '-depth', '8', 'txt:-'], { encoding: 'utf8' });
  const vals = [...txt.matchAll(/gray\((\d+)/g)].map((m) => Number(m[1]));
  if (vals.length !== 64) return null;
  const mean = vals.reduce((a, b) => a + b, 0) / 64;
  return vals.map((v) => (v >= mean ? 1 : 0));
}
const hamming = (a, b) => a.reduce((n, v, i) => n + (v === b[i] ? 0 : 1), 0);
/** 6/64 bits apart is "the same photograph", tuned against the phở case (0–3 bits). */
const DUP_BITS = 6;

/**
 * `nc` and `nd` are excluded at fetch time. `nd` because the pipeline crops and resizes,
 * which NoDerivatives forbids; `nc` because publishing stays an option (decisions.md
 * "Still open" #5) and a non-commercial term would have to be unpicked later.
 */
function licenceAcceptable(short) {
  const s = (short ?? '').toLowerCase();
  if (!s) return true; // unknown — kept, and the validator warns that it cannot be attributed
  return !/\bnc\b|noncommercial|non-commercial|\bnd\b|noderiv/.test(s);
}

function contactSheet(dir, meta, label) {
  if (!meta.length) return null;
  const labelled = meta.map((m, i) => {
    const o = path.join(dir, `_lab${i}.png`);
    execFileSync('magick', [
      path.join(dir, m.file), '-resize', '256x256',
      '-background', 'white', '-splice', '0x28', '-gravity', 'northwest',
      '-pointsize', '22', '-fill', 'black', '-annotate', '+6+2', String(i), o,
    ], { stdio: 'pipe' });
    return o;
  });
  const sheet = path.join(out, `SHEET-${label}.png`);
  execFileSync('magick', ['montage', '-background', 'white', '-tile', '5x',
    '-geometry', '256x284+4+4', ...labelled, sheet], { stdio: 'pipe' });
  return sheet;
}

let done = 0;
let skipped = 0;
for (const unit of units) {
  if (state.done(unit.id) && !force) { skipped += 1; continue; }
  const dir = path.join(out, unit.id);
  mkdirSync(dir, { recursive: true });
  const enTitle = toTitle(unit.concept);
  const title = await localiseTitle(enTitle);
  if (!title) {
    state.set(unit.id, 'empty', `no vi.wikipedia article for "${enTitle}"`);
    console.log(`${unit.id} "${enTitle}": no Vietnamese article — needs a human-supplied title`);
    continue;
  }

  let picks = [];
  try {
    const lead = await leadImage(title);
    if (lead) picks.push({ url: lead.url, title: lead.title, license: lead.license, licenseUrl: lead.licenseUrl, creator: lead.creator, page: lead.page, rank: 'lead' });

    const cat = await commonsCategory(title);
    if (cat) {
      for (const pg of await categoryFiles(cat, n * 3)) {
        const ii = pg.imageinfo?.[0];
        if (!ii?.thumburl) continue;
        const em = ii.extmetadata ?? {};
        const lic = strip(em.LicenseShortName?.value);
        if (!licenceAcceptable(lic)) continue;
        picks.push({
          url: ii.thumburl,
          title: pg.title.replace(/^File:/, ''),
          license: lic || null,
          licenseUrl: strip(em.LicenseUrl?.value) || null,
          creator: strip(em.Artist?.value).slice(0, 80) || null,
          page: ii.descriptionurl ?? null,
          rank: 'category',
        });
      }
    }
  } catch (e) {
    state.set(unit.id, 'deferred', e.message);
    console.error(`${unit.id} (${title}): deferred — ${e.message}`);
    continue;
  }

  const meta = [];
  const hashes = [];
  let kept = 0;
  let dupes = 0;
  let failed = false;
  for (const p of picks) {
    if (kept >= n) break;
    try {
      const { buf } = await http.get(p.url, { ext: path.extname(new URL(p.url).pathname) || '.img' });
      if (!buf || buf.length < 3000) continue; // a 1 KB "file" is a placeholder or an error page
      const raw = path.join(dir, `_raw${kept}`);
      const jpg = `${String(kept).padStart(2, '0')}.jpg`;
      writeFileSync(raw, buf);
      execFileSync('magick', [`${raw}[0]`, '-auto-orient', '-resize', '512x512^', '-gravity', 'center',
        '-extent', '512x512', '-strip', '-quality', '82', path.join(dir, jpg)], { stdio: 'pipe' });
      const h = aHash(path.join(dir, jpg));
      if (h && hashes.some((prev) => hamming(prev, h) <= DUP_BITS)) { dupes += 1; continue; }
      if (h) hashes.push(h);
      meta.push({ idx: kept, file: jpg, raw: path.basename(raw), source: WIKI.includes('wikipedia') && p.rank === 'lead' ? WIKI : 'commons.wikimedia.org', ...p });
      kept += 1;
    } catch (e) {
      failed = true;
      console.error(`  ${unit.id}: ${e.message}`);
      break;
    }
  }

  writeFileSync(path.join(dir, 'candidates.json'), `${JSON.stringify(meta, null, 2)}\n`);
  const sheet = contactSheet(dir, meta, unit.id);
  if (failed && !kept) { state.set(unit.id, 'deferred', 'download failed'); continue; }
  state.set(unit.id, kept ? 'done' : 'empty', `${kept} candidates for "${title}"`);
  done += 1;
  console.log(`${unit.id} "${title}": ${kept} candidate(s)${sheet ? ` -> ${sheet}` : ' — NOTHING FOUND, needs a human-supplied title or a photograph'}${dupes ? ` (${dupes} near-duplicate(s) dropped)` : ''}`);
}

console.log(`\n${done} fetched, ${skipped} already done (re-run to resume; --force to redo).`);
console.log(http.report());
console.log('state:', JSON.stringify(state.counts()));
console.log(`\nNow LOOK at ${out}/SHEET-*.png, then:\n  node tools/pack-import-media.mjs --pack <pack> --word <id> --image ${out}/<id>/00.jpg ...`);
