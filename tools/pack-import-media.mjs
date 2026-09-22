#!/usr/bin/env node
// Put a picture or a sound into a pack and attach it to a word.
//
// After looking at a contact sheet and deciding that candidates 0, 3 and 5 are good:
//
//   node tools/pack-import-media.mjs --pack packs/vi-seed --word meo --pick 0,3,5
//
// Any file from anywhere — including her camera roll:
//
//   node tools/pack-import-media.mjs --pack packs/vi-seed --word meo \
//        --image ~/photos/our-cat.jpg --source camera
//
// Her voice, replacing a generated clip:
//
//   node tools/pack-import-media.mjs --pack packs/vi-seed --word meo \
//        --audio word=~/recordings/meo.m4a --by "mẹ"
//
// Other operations:
//
//   --order 2,0,1       reorder the existing images (images[0] is the prototype)
//   --remove-image 1    drop one
//   --replace           discard the word's current images instead of appending
//
// WHY ONE TOOL FOR BOTH. `spike-results.md`: "the pipeline must treat a recording and a
// generated file as interchangeable". The cheapest way to guarantee that is to have one
// import path, so a recording and a synthesised clip are not merely similar — they are
// produced by the same three lines of code and differ only in the `engine` string that
// the attribution generator reads and nothing else does.
//
// `--pick` is the ergonomic that matters. It reads the candidate's `candidates.json`
// and carries the licence, the author and the source URL across automatically. Typing
// those by hand for three images × 90 words is how attribution data goes missing, and
// the validator makes missing attribution an error precisely because it must not.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { readManifest, readWords, writeWord, packPaths } from './lib/pack.mjs';
import { importImage, importAudio } from './lib/media.mjs';

const argv = process.argv.slice(2);
let packDir = null;
let wordId = null;
let pick = null;
let candDir = null;
let source = null;
let by = null;
let replace = false;
let order = null;
const images = [];
const audios = [];
const removeImages = [];
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === '--pack') packDir = argv[++i];
  else if (a === '--word') wordId = argv[++i];
  else if (a === '--image') images.push(argv[++i]);
  else if (a === '--audio') audios.push(argv[++i]);
  else if (a === '--pick') pick = argv[++i];
  else if (a === '--candidates') candDir = argv[++i];
  else if (a === '--source') source = argv[++i];
  else if (a === '--by') by = argv[++i];
  else if (a === '--replace') replace = true;
  else if (a === '--order') order = argv[++i];
  else if (a === '--remove-image') removeImages.push(Number(argv[++i]));
  else { console.error(`unknown option ${a}`); process.exit(2); }
}
if (!packDir || !wordId) {
  console.error('usage: pack-import-media.mjs --pack DIR --word ID [--pick 0,3,5 | --image FILE... | --audio slot=FILE...]');
  process.exit(2);
}

const read = readManifest(packDir);
if (!read) { console.error(`cannot read ${packDir}/pack.json`); process.exit(2); }
const entry = readWords(packDir).ok.find(({ word }) => word.id === wordId);
if (!entry) { console.error(`no word "${wordId}" in ${packDir}`); process.exit(2); }
const word = entry.word;

/* -------------------------------------------------------------- pick from a sheet */

const picked = [];
let offered = null;
if (pick !== null) {
  const dir = candDir ?? path.join(packDir, '.candidates', wordId);
  const meta = path.join(dir, 'candidates.json');
  if (!existsSync(meta)) {
    console.error(`no ${meta}\nfetch candidates first:  node tools/fetch-candidates.mjs --pack ${packDir}`);
    process.exit(2);
  }
  const cands = JSON.parse(readFileSync(meta, 'utf8'));

  // Record how many candidates were OFFERED, by stream, at the moment a human chose from
  // them. The yield report used to read this back out of `.candidates/`, which is scratch
  // — and scratch gets cleared between fetch runs, which took the denominator with it and
  // made five curated words uncountable. Curation is the only moment both numbers are
  // known, so it is the moment to write them down. Lives under `build`, so it is
  // build-time data the runtime never sees (word-list.md §1).
  offered = cands.reduce((a, c) => { const r = c?.rank ?? 'unrecorded'; a[r] = (a[r] ?? 0) + 1; return a; }, {});

  for (const raw of pick.split(',').map((s) => s.trim()).filter(Boolean)) {
    const idx = Number(raw);
    const c = cands.find((x) => x.idx === idx);
    if (!c) { console.error(`candidate ${idx} is not in ${meta} (it has ${cands.length})`); process.exit(2); }
    picked.push({
      file: path.join(dir, c.file),
      meta: {
        source: c.source ?? 'commons.wikimedia.org',
        sourceUrl: c.page ?? c.url ?? null,
        license: c.license ?? null,
        licenseUrl: c.licenseUrl ?? null,
        creator: c.creator ?? null,
        title: c.title ?? null,
        // Which stream of the fetcher offered this picture: lead / article / category.
        // Carried so the validator can report YIELD PER SOURCE — how many of each kind
        // were offered against how many a human kept. Without it, changing where the
        // variety images come from can only be judged by looking at sheets and guessing.
        rank: c.rank ?? null,
        caption: c.caption ?? null,
      },
    });
  }
}

/* --------------------------------------------------------------------- do the work */

if (replace) word.images = [];
word.images ??= [];

for (const p of picked) {
  const m = importImage(packDir, p.file, p.meta);
  word.images.push(m);
  console.log(`image  ${path.basename(p.file)} -> ${m.src}  ${m.bytes.toLocaleString()} B  [${m.license ?? 'no licence recorded'}]`);
}
for (const f of images) {
  // A file given by hand has no candidates.json behind it. `--source` is required rather
  // than defaulted, because guessing it wrong is how an unattributed CC BY image ships.
  if (!source) { console.error(`--image requires --source (camera | own-work | generated | <a domain>)`); process.exit(2); }
  const m = importImage(packDir, f, { source, creator: by });
  word.images.push(m);
  console.log(`image  ${path.basename(f)} -> ${m.src}  ${m.bytes.toLocaleString()} B  [source: ${source}]`);
}
for (const spec of audios) {
  const eq = spec.indexOf('=');
  if (eq < 0) { console.error(`--audio wants slot=FILE, got ${spec}`); process.exit(2); }
  const slot = spec.slice(0, eq);
  const file = spec.slice(eq + 1);
  const m = importAudio(packDir, file, { engine: 'recording', by: by ?? null, text: word.text });
  word.audio = { ...word.audio, [slot]: m };
  console.log(`audio  ${slot}: ${path.basename(file)} -> ${m.src}  ${m.bytes.toLocaleString()} B  [recording${by ? ` by ${by}` : ''}]`);
}

for (const i of removeImages.sort((a, b) => b - a)) {
  const gone = word.images.splice(i, 1);
  // The blob is left behind deliberately: it becomes an orphan, and orphans are swept
  // explicitly with `pack-validate --delete-orphans`. Removing it here would delete a
  // picture that another word may also reference, since blobs are content-addressed.
  if (gone.length) console.log(`removed images[${i}] (${gone[0].src} is now an orphan until swept)`);
}
if (order !== null) {
  const idx = order.split(',').map((s) => Number(s.trim()));
  if (idx.length !== word.images.length || new Set(idx).size !== idx.length || idx.some((i) => !(i >= 0 && i < word.images.length))) {
    console.error(`--order must be a permutation of 0..${word.images.length - 1}`);
    process.exit(2);
  }
  word.images = idx.map((i) => word.images[i]);
  console.log(`reordered; images[0] (the prototype) is now ${word.images[0].src}`);
}

if (offered) {
  word.build = { ...word.build, fetched: { ...offered, at: new Date().toISOString() } };
}

// The word file is written LAST and atomically. Every blob above is already durable and
// content-addressed, so a crash before this line leaves orphans — never a word pointing
// at a file that is not there.
writeWord(packDir, word);

console.log(`\n${word.id} "${word.text}": ${word.images.length} image(s), audio slots [${Object.entries(word.audio ?? {}).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none'}]`);
console.log(`now run:  node tools/pack-validate.mjs ${packDir}`);
