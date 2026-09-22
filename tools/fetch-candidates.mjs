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
//
// THE VARIETY IMAGES COME FROM THE ARTICLE, NOT THE CATEGORY. This changed after four
// words were curated by eye and counted:
//
//     hổ  4/8      gà  4/8      cá  2/8      chó  1/8
//
// The lead image was good every time; everything under it came from the Commons category
// and the rejects were not near-misses. `cá` returned two 19th-century engravings and a
// sepia archival card reading "ALASKA TASK FORCE". `hổ` returned a museum diorama OF A
// MAMMOTH. `gà` returned a panel of histology microscopy slides and a photograph of
// butchered carcasses.
//
// **A Commons category is an archive, not a selection.** It holds everything anyone ever
// filed under the concept. What makes the lead image good is that a person chose it to
// show a reader what the thing is — and that same person chose the rest of the article's
// images for the same reason. So the article body is the variety source, and the category
// is only a fallback when the article is too thin.
//
// The article also supplies CAPTIONS, which the contact sheet prints under each picture.
// "Vị trí của các răng cắt thịt của chó" identifies a dental diagram before the reviewer
// has to squint at it.

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
// An image narrower than the 512 px master would be upscaled and look soft on a phone,
// where the picture fills most of the screen. Rejecting it is a mechanical quality test,
// not a judgement about what it shows.
let minPx = 512;
let useCategory = true;
// Below this many article pictures (including the lead), fall back to the Commons
// category. Above it, do not touch the category at all. 5 = a lead plus four to choose
// three from.
let minArticle = 5;
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
  else if (a === '--min-px') minPx = Number(argv[++i]);
  else if (a === '--no-category') useCategory = false;
  else if (a === '--min-article') minArticle = Number(argv[++i]);
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
 * THE LEAD IMAGE ARRIVES WITHOUT A LICENCE, and that was nearly a hole in the whole
 * pipeline. The REST `page/summary` endpoint returns the image URL and nothing about its
 * terms — so the source measured at ~77% usable, the one `image-sourcing.md` chose as
 * primary, is also the one source whose output could not be attributed. Three curated
 * photos of `phở` went into a pack and the validator rejected the first one for exactly
 * this, which is the check doing its job before ninety words had been curated instead of
 * one.
 *
 * Licences are now resolved for every candidate in ONE batched `imageinfo` call
 * (`batchImageInfo`), Commons first and the local wiki for anything Commons does not
 * have. A file whose terms cannot be found is still offered — the curator can still look
 * at it — but it carries `license: null` and the validator will refuse to let it ship.
 * Unattributable is not the same as unusable; it is the same as unshippable.
 */

/** The file name inside an upload.wikimedia.org URL. */
function fileNameFromUpload(url) {
  const segs = new URL(url).pathname.split('/').filter(Boolean);
  const i = segs.indexOf('thumb');
  const name = i >= 0 ? segs[segs.length - 2] : segs[segs.length - 1];
  try { return decodeURIComponent(name); } catch { return name; }
}

/** `Tập_tin:Foo.jpg` / `File:Foo.jpg` / `Foo.jpg` -> `Foo.jpg`. */
function bareFileName(title) {
  const t = (title ?? '').replace(/_/g, ' ').trim();
  const c = t.indexOf(':');
  return (c >= 0 ? t.slice(c + 1) : t).trim();
}

/**
 * THE VARIETY SOURCE. The images the vi.wikipedia article actually uses, in the order a
 * reader meets them, with their captions.
 *
 * This is the whole point of the change. A Commons category is everything anyone filed;
 * an article's images are what an editor chose to show a reader what the thing is. That
 * is the same property that makes the lead image good (~77% usable) applied to the rest
 * of the page, and it is measurably better than the category (1/8 for `chó`).
 *
 * `showInGallery: false` drops the icons, maps and audio players that MediaWiki counts as
 * page media but no reader thinks of as a picture of the thing.
 */
async function articleMedia(title) {
  const { data } = await http.json(`https://${WIKI}/api/rest_v1/page/media-list/${encodeURIComponent(title)}`);
  const items = data?.items ?? [];
  const out = [];
  for (const it of items) {
    if (it.type !== 'image') continue;          // excludes video and audio outright
    if (it.showInGallery === false) continue;   // icons, flags, edit chrome
    const name = bareFileName(it.title);
    if (!name || !isPhotoFile(name)) continue;  // SVG diagrams, PDFs
    out.push({ name, caption: strip(it.caption?.text ?? '') || null });
  }
  return out;
}

/**
 * Resolve URL, dimensions and licence for many files in ONE request. MediaWiki accepts
 * up to 50 titles per query, which makes a whole article's images one round trip instead
 * of one each — the difference between a polite run and a throttled one.
 */
async function batchImageInfo(names) {
  const found = new Map();
  let todo = [...new Set(names)];
  for (const host of ['commons.wikimedia.org', WIKI]) {
    if (!todo.length) break;
    for (let i = 0; i < todo.length; i += 50) {
      const chunk = todo.slice(i, i + 50);
      const p = new URLSearchParams({
        action: 'query', titles: chunk.map((f) => `File:${f}`).join('|'),
        prop: 'imageinfo', iiprop: 'url|extmetadata|size', iiurlwidth: '1024',
        format: 'json', origin: '*',
      });
      let data;
      try { ({ data } = await http.json(`https://${host}/w/api.php?${p}`)); } catch { continue; }
      for (const pg of Object.values(data?.query?.pages ?? {})) {
        if (pg.missing !== undefined) continue;
        const ii = pg.imageinfo?.[0];
        if (!ii?.thumburl) continue;
        const em = ii.extmetadata ?? {};
        found.set(bareFileName(pg.title), {
          url: ii.thumburl,
          width: ii.width ?? 0,
          height: ii.height ?? 0,
          license: strip(em.LicenseShortName?.value) || null,
          licenseUrl: strip(em.LicenseUrl?.value) || null,
          creator: strip(em.Artist?.value).slice(0, 80) || null,
          page: ii.descriptionurl ?? `https://${host}/wiki/File:${encodeURIComponent(pg.title.replace(/^[^:]*:/, ''))}`,
        });
      }
    }
    todo = todo.filter((f) => !found.has(f));
  }
  return found;
}

/** The article's lead image, as a bare file name. */
async function leadFileName(title) {
  const { data } = await http.json(`https://${WIKI}/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
  if (!data || data.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') return null;
  const url = data.originalimage?.source ?? data.thumbnail?.source ?? null;
  return url ? bareFileName(fileNameFromUpload(url)) : null;
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

/**
 * Commons categories hold sound and video files alongside photographs, and the API hands
 * back a `thumburl` for all of them — an .ogg's thumbnail is a generic speaker icon, which
 * sailed through as a candidate and wasted a slot on the "chó" sheet. Scientific .tif
 * scans are the same story with a different picture.
 *
 * So the filter is on the FILE, not on the thumbnail. Raster photographic formats only.
 * SVG is excluded deliberately: on Commons it is overwhelmingly diagrams, maps and coats
 * of arms, none of which is a picture of a thing a 4-year-old can name.
 */
const PHOTO_EXT = new Set(['jpg', 'jpeg', 'png', 'gif']);
function isPhotoFile(title) {
  const m = /\.([a-z0-9]+)$/i.exec((title ?? '').trim());
  return m ? PHOTO_EXT.has(m[1].toLowerCase()) : false;
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

/**
 * DejaVu Sans, because the default ImageMagick font silently drops Vietnamese
 * diacritics — "Vị trí của các răng cắt thịt" renders as "V  trí c a các r ng c t th t",
 * which is worse than no caption at all. Checked by rendering it and looking.
 */
const SHEET_FONT = existsSync('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
  ? '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf' : null;

/**
 * A numbered contact sheet: index, source rank, and the article's own caption under each
 * picture. The caption is the cheapest curation aid there is — the reviewer rejects a
 * dental diagram by reading three words instead of studying a thumbnail, and the first
 * sheet built this way had "Vị trí của các răng cắt thịt của chó" sitting under exactly
 * that diagram.
 *
 * The caption band is rendered as its own image and appended, rather than spliced and
 * annotated. The first attempt used `-splice` plus `-annotate` and the text landed ON the
 * photograph, because an annotate offset under `southwest` gravity positions a baseline
 * and not a text block. `caption:` wraps to a given width and clips to a given height,
 * which is the behaviour actually wanted.
 */
function labelTile(dir, m, i) {
  const o = path.join(dir, `_lab${i}.png`);
  const top = path.join(dir, `_top${i}.png`);
  const cap = path.join(dir, `_cap${i}.png`);
  const head = `${i}  [${m.rank}]`;

  const headArgs = [path.join(dir, m.file), '-resize', '256x256',
    '-background', 'white', '-splice', '0x26', '-gravity', 'northwest'];
  if (SHEET_FONT) headArgs.push('-font', SHEET_FONT);
  headArgs.push('-pointsize', '20', '-fill', 'black', '-annotate', '+6+2', head, top);
  execFileSync('magick', headArgs, { stdio: 'pipe' });

  const capArgs = ['-background', '#f2f2f2', '-fill', '#333333',
    '-size', '250x40', '-gravity', 'northwest'];
  if (SHEET_FONT) capArgs.push('-font', SHEET_FONT);
  capArgs.push('-pointsize', '13', `caption:${m.caption ?? ''}`,
    '-bordercolor', '#f2f2f2', '-border', '3x2', cap);
  execFileSync('magick', capArgs, { stdio: 'pipe' });

  execFileSync('magick', [top, cap, '-background', 'white', '-append', o], { stdio: 'pipe' });
  return o;
}

function contactSheet(dir, meta, label) {
  if (!meta.length) return null;
  const labelled = meta.map((m, i) => labelTile(dir, m, i));
  const sheet = path.join(out, `SHEET-${label}.png`);
  execFileSync('magick', ['montage', '-background', 'white', '-tile', '5x',
    '-geometry', '256x326+4+4', ...labelled, sheet], { stdio: 'pipe' });
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
  let skippedNonPhoto = 0;
  let skippedSmall = 0;
  let skippedLicence = 0;
  try {
    // 1. The lead image — a person chose it to be the single most representative
    //    picture of the concept. ~77% usable, measured, and good in all four words the
    //    curator has reviewed by eye.
    const leadName = await leadFileName(title);

    // 2. The rest of the article, in reading order. Same property as the lead, applied
    //    to the whole page: an editor chose each one to show a reader what the thing is.
    const media = await articleMedia(title);

    const names = [];
    const captions = new Map();
    if (leadName) names.push(leadName);
    for (const m of media) {
      if (!names.includes(m.name)) names.push(m.name);
      if (m.caption && !captions.has(m.name)) captions.set(m.name, m.caption);
    }

    // One batched request for every file's URL, size and licence.
    const info = await batchImageInfo(names);
    for (const name of names) {
      const i = info.get(name);
      if (!i) continue;
      if (!licenceAcceptable(i.license)) { skippedLicence += 1; continue; }
      if (Math.min(i.width, i.height) < minPx) { skippedSmall += 1; continue; }
      picks.push({
        url: i.url, title: name, caption: captions.get(name) ?? null,
        license: i.license, licenseUrl: i.licenseUrl, creator: i.creator, page: i.page,
        width: i.width, height: i.height,
        rank: name === leadName ? 'lead' : 'article',
      });
    }

    // 3. The Commons category — a FALLBACK, not a top-up, and the distinction is the
    //    whole fix. The first version of this change still filled the sheet up to `--n`
    //    from the category once the article ran out, and the three category images it
    //    added for `chó` were a distant landscape, a police dog with a handler and an oil
    //    painting; the two it added for `cá` were the two 19th-century engravings the
    //    curator had already named. Topping up with an archive is how the archive's
    //    failure rate gets back in.
    //
    //    So the category is consulted only when the article is genuinely thin — fewer
    //    than `minArticle` pictures, i.e. not enough for a curator to choose three from.
    //    A short sheet of good candidates beats a full sheet padded with rejects.
    if (useCategory && picks.length < minArticle) {
      const cat = await commonsCategory(title);
      if (cat) {
        const have = new Set(picks.map((p) => p.title));
        for (const pg of await categoryFiles(cat, n * 3)) {
          const ii = pg.imageinfo?.[0];
          if (!ii?.thumburl) continue;
          if (!isPhotoFile(pg.title)) { skippedNonPhoto += 1; continue; }
          const name = bareFileName(pg.title);
          if (have.has(name)) continue;
          const em = ii.extmetadata ?? {};
          const lic = strip(em.LicenseShortName?.value);
          if (!licenceAcceptable(lic)) { skippedLicence += 1; continue; }
          if (Math.min(ii.width ?? 0, ii.height ?? 0) < minPx) { skippedSmall += 1; continue; }
          picks.push({
            url: ii.thumburl, title: name, caption: null,
            license: lic || null,
            licenseUrl: strip(em.LicenseUrl?.value) || null,
            creator: strip(em.Artist?.value).slice(0, 80) || null,
            page: ii.descriptionurl ?? null,
            width: ii.width ?? 0, height: ii.height ?? 0,
            rank: 'category',
          });
        }
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
      meta.push({ idx: kept, file: jpg, raw: path.basename(raw),
        source: p.rank === 'category' ? 'commons.wikimedia.org' : WIKI, ...p });
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
  const byRank = meta.reduce((a, m) => { a[m.rank] = (a[m.rank] ?? 0) + 1; return a; }, {});
  const dropped = [
    dupes ? `${dupes} duplicate` : null,
    skippedSmall ? `${skippedSmall} under ${minPx}px` : null,
    skippedNonPhoto ? `${skippedNonPhoto} not a photo` : null,
    skippedLicence ? `${skippedLicence} nc/nd` : null,
  ].filter(Boolean).join(', ');
  console.log(`${unit.id} "${title}": ${kept} candidate(s) [${Object.entries(byRank).map(([r, c]) => `${c} ${r}`).join(', ') || 'none'}]`
    + `${dropped ? ` — dropped ${dropped}` : ''}`
    + `${sheet ? '' : ' — NOTHING FOUND, needs a human-supplied title or a photograph'}`);
  for (const m of meta) if (m.caption) console.log(`    ${m.idx}  ${m.caption}`);
}

console.log(`\n${done} fetched, ${skipped} already done (re-run to resume; --force to redo).`);
console.log(http.report());
console.log('state:', JSON.stringify(state.counts()));
console.log(`\nNow LOOK at ${out}/SHEET-*.png, then:\n  node tools/pack-import-media.mjs --pack <pack> --word <id> --image ${out}/<id>/00.jpg ...`);
