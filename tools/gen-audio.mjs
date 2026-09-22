#!/usr/bin/env node
// Generate every audio clip a pack needs, and write them into it. Resumable.
//
//   node tools/gen-audio.mjs --pack packs/vi-seed
//   node tools/gen-audio.mjs --pack packs/en-seed --reuse samples/audio/en-final
//   node tools/gen-audio.mjs --pack packs/vi-seed --only tiles --dry-run
//
// The engines are settled (`decisions.md` §"Audio — closed") and this tool does not
// revisit them:
//
//   English letter sounds   edge-tts / en-US-JennyNeural, "sound + anchor word", -35%
//                           two clips each: `<letter>-long` first touch, `-short` repeats
//   English words           the same voice and rate
//   Vietnamese everything   gTTS lang='vi', natural speed (the owner picked 1.00x)
//
// GENERATION IS THE FLOOR. Every clip written here can be replaced by a recording
// through `pack-import-media.mjs --audio`, and nothing downstream can tell the
// difference: both become the same media object with the same shape, and `engine` is
// read only by the attribution generator. A parent's voice is better for this child than
// any synthesised voice, and the pipeline is built so that saying so costs nothing.
//
// It never regenerates a clip that is already on the word — re-running after a failure
// or after adding five words costs only the five words.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { readManifest, readWords, writeManifest, writeWord } from './lib/pack.mjs';
import { importAudio } from './lib/media.mjs';
import { RunState } from './lib/http.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PY = path.join(ROOT, 'tools', '.venv', 'bin', 'python');

const ENGINE = {
  vi: { engine: 'gtts', args: ['--lang', 'vi'], label: 'gtts:vi' },
  en: { engine: 'edge', args: ['--voice', 'en-US-JennyNeural', '--rate=-35%'], label: 'edge-tts:en-US-JennyNeural@-35%' },
};

const argv = process.argv.slice(2);
let packDir = null;
let only = 'all';
let dryRun = false;
let reuseDir = null;
let force = false;
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === '--pack') packDir = argv[++i];
  else if (a === '--only') only = argv[++i];
  else if (a === '--reuse') reuseDir = argv[++i];
  else if (a === '--dry-run') dryRun = true;
  else if (a === '--force') force = true;
  else { console.error(`unknown option ${a}`); process.exit(2); }
}
if (!packDir) { console.error('usage: gen-audio.mjs --pack DIR [--only tiles|words] [--reuse DIR] [--dry-run]'); process.exit(2); }
if (!existsSync(PY) && !dryRun) {
  console.error(`no venv python at ${PY}\nsee the setup block at the top of tools/tts.py`);
  process.exit(2);
}

const read = readManifest(packDir);
if (!read) { console.error(`cannot read ${packDir}/pack.json`); process.exit(2); }
const manifest = read.manifest;
const lang = manifest.language;
const eng = ENGINE[lang];
if (!eng) { console.error(`no engine configured for language ${lang}`); process.exit(2); }

/* ------------------------------------------------------------------- the work list */

/**
 * A "job" is one clip: what to say, where it hangs, and what the engine needs. Building
 * the whole list first means the run can be counted, dry-run, priced and resumed.
 */
const jobs = [];

if (only === 'all' || only === 'tiles') {
  if (lang === 'vi') {
    // literacy-vi.md §7.1 — an onset says its đánh vần name, a rime is read aloud, a
    // tone says its name. §5.3: the tone label is editable data, so it is read from the
    // tile rather than from a constant here.
    for (const t of manifest.tiles.onset) jobs.push({ kind: 'tile', group: 'onset', id: t.id, slot: 'name', text: t.label });
    for (const t of manifest.tiles.rime) jobs.push({ kind: 'tile', group: 'rime', id: t.id, slot: 'name', text: t.glyph });
    for (const t of manifest.tiles.tone) jobs.push({ kind: 'tile', group: 'tone', id: t.id, slot: 'name', text: t.label });
  } else {
    for (const t of manifest.tiles.letter) {
      if (t.sound == null || t.anchor == null) continue; // curriculum gap; the validator warns
      jobs.push({ kind: 'tile', group: 'letter', id: t.id, slot: 'long', text: `${t.sound}, ${t.anchor}` });
      jobs.push({ kind: 'tile', group: 'letter', id: t.id, slot: 'short', text: t.sound });
    }
  }
}

const { ok: words } = readWords(packDir);
if (only === 'all' || only === 'words') {
  for (const { word } of words) {
    jobs.push({ kind: 'word', id: word.id, slot: 'word', text: word.text });
    if (lang === 'vi') {
      const s = word.syllables?.[0];
      if (s && word.syllables.length === 1) {
        const blend = `${s.onset ?? ''}${s.rime}`;
        // literacy-vi.md §7.2 step 3: onset+rime joined, no mark yet. For a `ngang` word
        // step 3 IS the word, so there is nothing extra to say (§7.2, the `dê` table).
        if (blend !== word.text) {
          jobs.push({
            kind: 'word', id: word.id, slot: 'blend', text: blend,
            // §7.3: "the step-3 toneless blend is sometimes not a real word" (`sưa` for
            // `sữa`, `ngua` for `ngựa`). Every one of these needs a human listen. It is
            // the seed list's single largest QA item, so it is flagged per clip.
            needsListen: true,
          });
        }
      }
    }
  }
}

/* -------------------------------------------------------------------------- reuse */

/**
 * `samples/audio/en-final/` holds the 52 clips the owner chose in round 3 of listening.
 * Regenerating them would produce different bytes for no benefit and would throw away
 * an approval. Reuse is the default when the directory is there.
 */
const reuse = new Map(); // "tile:letter:c:long" -> file
if (reuseDir === null && lang === 'en' && existsSync(path.join(ROOT, 'samples/audio/en-final/manifest.json'))) {
  reuseDir = path.join(ROOT, 'samples/audio/en-final');
}
if (reuseDir && existsSync(path.join(reuseDir, 'manifest.json'))) {
  const m = JSON.parse(readFileSync(path.join(reuseDir, 'manifest.json'), 'utf8'));
  for (const [letter, e] of Object.entries(m.letters ?? {})) {
    for (const slot of ['long', 'short']) {
      const f = path.join(reuseDir, e[slot] ?? '');
      if (e[slot] && existsSync(f)) reuse.set(`tile:letter:${letter}:${slot}`, f);
    }
  }
  console.log(`reusing ${reuse.size} approved clip(s) from ${path.relative(ROOT, reuseDir)} (decisions.md §"Audio — closed")`);
}

/* --------------------------------------------------------------------------- run */

const state = new RunState(path.join(packDir, '.gen-audio.json'));
const tmpDir = path.join(packDir, '.tmp-audio');
mkdirSync(tmpDir, { recursive: true });

const wordById = new Map(words.map(({ word }) => [word.id, word]));
const tileOf = (group, id) => manifest.tiles[group].find((t) => t.id === id);
const hasClip = (job) => {
  const host = job.kind === 'word' ? wordById.get(job.id) : tileOf(job.group, job.id);
  const cur = host?.audio?.[job.slot];
  return !!(cur && cur.src && existsSync(path.join(packDir, cur.src)));
};

let made = 0;
let reused = 0;
let skipped = 0;
let failed = 0;
let bytes = 0;
let ms = 0;
const listen = [];
const dirtyWords = new Set();

for (const job of jobs) {
  const key = `${job.kind}:${job.group ?? ''}:${job.id}:${job.slot}`;
  if (!force && hasClip(job)) { skipped += 1; continue; }
  if (!job.text || !job.text.trim()) { console.error(`${key}: no text to say — skipped`); continue; }

  if (dryRun) { console.log(`would generate ${key.padEnd(28)} "${job.text}"`); made += 1; continue; }

  let srcFile = reuse.get(key) ?? null;
  let info = null;
  if (srcFile) {
    reused += 1;
  } else {
    const tmp = path.join(tmpDir, `${key.replace(/[^a-zA-Z0-9]+/g, '_')}.mp3`);
    try {
      const out = execFileSync(PY, [path.join(ROOT, 'tools', 'tts.py'),
        '--engine', eng.engine, ...eng.args, '--text', job.text, '--out', tmp], { encoding: 'utf8' });
      info = JSON.parse(out.trim().split('\n').pop());
      if (!info.ok) throw new Error(info.error);
      // Never trust a clip you have not opened. tts.py decodes what it wrote; a silent
      // mp3 is a valid mp3 and would otherwise ship as a tile that does nothing.
      if (info.silent) throw new Error(`clip decodes to silence (peak ${info.peak})`);
      srcFile = tmp;
      made += 1;
    } catch (e) {
      failed += 1;
      state.set(key, 'failed', e.message.slice(0, 300));
      console.error(`${key}: FAILED — ${e.message.split('\n')[0]}`);
      continue;
    }
  }

  const media = importAudio(packDir, srcFile, {
    engine: eng.label,
    text: job.text,
    ms: info?.ms ?? null,
  });
  bytes += media.bytes;
  ms += media.ms ?? 0;
  if (job.needsListen) listen.push(`${job.id} step-3 blend "${job.text}" -> ${media.src}`);

  if (job.kind === 'word') {
    const w = wordById.get(job.id);
    w.audio = { ...w.audio, [job.slot]: media };
    dirtyWords.add(job.id);
  } else {
    const t = tileOf(job.group, job.id);
    t.audio = { ...t.audio, [job.slot]: media };
  }
  state.set(key, 'done', media.src);
  if (srcFile.startsWith(tmpDir)) rmSync(srcFile);
}

if (!dryRun) {
  // The manifest carries the tile clips, so it is rewritten once at the end; the words
  // are rewritten one file at a time. A crash between the two leaves unreferenced blobs
  // and clips that will simply be regenerated, never a word pointing at nothing.
  for (const id of dirtyWords) writeWord(packDir, wordById.get(id));
  manifest.generator = {
    ...manifest.generator,
    audio: { engine: eng.label, generatedAt: new Date().toISOString() },
  };
  writeManifest(packDir, manifest);
  if (existsSync(tmpDir) && readdirSync(tmpDir).length === 0) rmSync(tmpDir, { recursive: true });
}

const kb = (n) => `${(n / 1024).toFixed(1)} KiB`;
console.log(`
${jobs.length} clip(s) needed: ${made} generated, ${reused} reused, ${skipped} already present, ${failed} failed
${kb(bytes)} written, ${(ms / 1000).toFixed(1)} s of audio`);
if (listen.length) {
  console.log(`
${listen.length} toneless step-3 blend(s) NEED A HUMAN LISTEN before this pack ships.
literacy-vi.md §7.3: the blend is sometimes not a real word, and Vietnamese orthography
being transparent means the engine *should* read it correctly — "should" is not "does".`);
  for (const l of listen.slice(0, 8)) console.log(`  ${l}`);
  if (listen.length > 8) console.log(`  ... and ${listen.length - 8} more`);
}
process.exit(failed ? 1 : 0);
