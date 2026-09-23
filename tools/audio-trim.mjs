#!/usr/bin/env node
// Cut the padding off a clip, or off every tile clip in a pack. LOSSLESS, and proved so.
//
//   node tools/audio-trim.mjs --in a.mp3 --out b.mp3
//   node tools/audio-trim.mjs --pack packs/en-seed                   # dry run, prints a table
//   node tools/audio-trim.mjs --pack packs/en-seed --apply
//   node tools/audio-trim.mjs --pack packs/en-seed --apply --words   # word clips too
//
//   exit 0 — done (or nothing to do)
//   exit 1 — a clip could not be cut safely, or a cut clip failed verification
//   exit 2 — bad arguments
//
// WHY THIS EXISTS. The owner played the built app and said the English letter sounds were
// "not good enough, voices seem to be mixed up with each other". `ui.md` §11.0 measured
// the shipped clips at 1896–2832 ms against a spec that assumed 350 ms, and handed the
// asset half over as E15/N15: a tile's `short` clip must be ≤ 700 ms, with ≤ 40 ms of
// lead and ≤ 120 ms of tail.
//
// THE CAUSE, measured, not guessed. Microsoft's Edge read-aloud endpoint returns a FIXED
// pad around every utterance — ~285 ms before and ~1320 ms after — identical on every
// clip regardless of what was said. `"b"`, `"buh"` and `"buh, ball"` at +0% come back
// 11232, 11232 and 11520 bytes: the pad, not the speech, is most of the file, which is
// why byte count barely tracks text length. edge-tts adds none of it — the raw websocket
// stream is byte-for-byte the file it saves — so it cannot be configured away upstream
// and the generator has to remove it. `tools/tts.py` now does that at synthesis time;
// this tool is for the clips already in a pack, and it calls the same planner so there is
// one implementation of the cut.
//
// WHY LOSSLESS, AND WHY IT MATTERS HERE. The English clips came from round 3 of the
// owner's listening, after he rejected two earlier rounds (`content-pipeline.md` §9.3,
// CLAUDE.md "amplitude is not intelligibility"). Decoding and re-encoding them would
// throw that approval away and nobody on this team can hear whether it mattered. An MP3
// is a sequence of frames, so dropping whole frames off each end keeps the rest EXACTLY
// as he approved them. At 24 kHz MPEG-2 Layer III a frame is 576 samples = 24 ms, finer
// than the budget.
//
// THE ONE PLACE A FRAME CUT IS NOT FREE, AND WHY A "GUARD" DOES NOT FIX IT. Layer III
// stores a frame's data up to 255 bytes BEHIND it, in the bit reservoir. Cutting orphans
// the first retained frame from data that is no longer in the file.
//
// An earlier version of this tool kept two frames of pre-roll and argued that 255 bytes is
// under two 144-byte frames, so two frames must be enough. **That was the wrong question.**
// The guard protects LATER frames; it does nothing for the first retained frame, whose own
// `main_data_begin` still points back past the cut. Measured across all 140 clips in
// `packs/en-seed`: frame 0 has `main_data_begin == 0` in all 140, and **no later frame has
// it in any of them** — the encoder uses the reservoir continuously, so there is no
// interior frame at which a cut is free.
//
// The result shipped 29 of 70 clips that made libmpg123 report
// `part2_3_length too large for available bit count` on their first frame — at the very
// start of the letter sound. Sample comparison did not catch it because libmpg123
// CONCEALS an underrun: it decodes the frame with whatever bits it has and carries on, so
// the samples still matched. Another decoder may click, mute or drop instead. And the
// other 41 were no better in principle — they escaped the message only because their
// first frame's `part2_3_length` happened to fit in the 131 bytes it carried itself.
//
// THE FIX IS TO SUPPLY THE MISSING BYTES, not to guess a guard. Those bytes still exist in
// the file, in the dropped frames. `primingFrames()` in `lib/mp3.mjs` emits one or two
// frames carrying exactly them, with all-zero side info so they need no history themselves
// and decode to digital silence. The decoder's reservoir is then in the state the real
// frame expects. Cost: 24 ms of silent lead per priming frame, at most two.
//
// WHAT IT WILL NOT DO. It never cuts inside the sound, and it does not take its own word
// for anything. Every output must pass BOTH gates before it is accepted:
//
//   1. it decodes with ZERO decoder diagnostics (the gate that was missing);
//   2. it matches the original SAMPLE BY SAMPLE across the sound's extent.
//
// If a primed cut fails either, the tool falls back to cutting only the TAIL — which
// cannot underrun, because frame 0 is retained and is self-contained — and if even that
// fails the clip keeps its original bytes and is named in the output. An untrimmed clip is
// a known cost; a corrupt one is not.

import { readFileSync, existsSync, statSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrames, sideInfo, primingFrames } from './lib/mp3.mjs';
import {
  readManifest, writeManifest, readWords, writeWord, writeFileAtomic, blobName,
} from './lib/pack.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PY = path.join(HERE, '.venv', 'bin', 'python');
const MEASURE = path.join(HERE, 'audio-measure.py');

// E15 asks for ≤ 40 ms of lead and ≤ 120 ms of tail. The tail target sits inside its
// allowance rather than on it; the lead target is what the reservoir guard will allow.
export const LEAD_MS = 24;
export const TAIL_MS = 96;
// −60 dBFS. Above this the cut damaged the audio and the plan is wrong.
const DIFF_EPS = 1e-3;

function py(args, input) {
  if (!existsSync(PY)) throw new Error(`no venv python at ${PY} — see content-pipeline.md §12 Setup`);
  return execFileSync(PY, [MEASURE, ...args], {
    encoding: 'utf8', maxBuffer: 256 << 20, input,
    // libmpg123 writes reservoir complaints to stderr; they are the symptom this tool
    // exists to avoid and the sample comparison is what actually decides.
    stdio: ['pipe', 'pipe', 'ignore'],
  });
}

/** Measure files by decoding them. Batched — starting python costs more than the work. */
export function measureFiles(files) {
  const out = [];
  for (let i = 0; i < files.length; i += 60) {
    const raw = py(['--jsonl', ...files.slice(i, i + 60)]);
    for (const line of raw.trim().split('\n')) if (line) out.push(JSON.parse(line));
  }
  return out;
}

/** Compare cut clips against their originals, sample by sample. */
export function diffFiles(specs) {
  if (!specs.length) return [];
  const raw = py(['--jsonl', '--diff'], `${specs.map((s) => JSON.stringify(s)).join('\n')}\n`);
  return raw.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

/**
 * Work out the frame-aligned cut for one clip.
 *
 * `buf === null` means leave it alone, with `reason` saying why.
 */
export function planTrim(file, m, { leadMs = LEAD_MS, tailMs = TAIL_MS, headCut = true } = {}) {
  const buf = readFileSync(file);
  let t;
  try { t = parseFrames(buf); } catch (e) { return { buf: null, beforeMs: null, reason: e.message }; }
  const beforeMs = t.durationMs;
  if (!m.ok) return { buf: null, beforeMs, reason: `could not decode: ${m.error}` };
  if (m.silent) return { buf: null, beforeMs, reason: 'decodes to silence — that is a broken asset, not a long one' };
  if (t.id3Bytes || t.resyncBytes || t.trailingBytes) {
    return { buf: null, beforeMs, reason: `not a bare frame stream (id3 ${t.id3Bytes} B, resync ${t.resyncBytes} B, trailing ${t.trailingBytes} B) — refusing to cut it blind` };
  }
  if (!t.cbr) return { buf: null, beforeMs, reason: 'variable bitrate — this pipeline has never produced one; refusing' };

  const fMs = t.frameMs;
  const n = t.frames.length;
  // floor/ceil, never round: the clamp may only ever keep MORE than asked for.
  let from = headCut ? Math.floor(Math.max(0, m.soundStartMs - leadMs) / fMs) : 0;
  let to = Math.ceil(Math.min(beforeMs, m.soundEndMs + tailMs) / fMs);          // exclusive
  from = Math.max(0, Math.min(from, Math.floor(m.soundStartMs / fMs)));
  to = Math.min(n, Math.max(to, Math.ceil(m.soundEndMs / fMs), from + 1));
  if (from === 0 && to === n) return { buf: null, beforeMs, reason: 'already tight' };

  // The reservoir the first retained frame is about to be missing.
  const prime = from > 0 ? primingFrames(buf, t, from) : null;
  if (from > 0 && prime === null && sideInfo(buf, t.frames[from]).mainDataBegin !== 0) {
    return { buf: null, beforeMs, reason: `frame ${from} needs reservoir history that is not in the file` };
  }
  const primeFrames = prime ? prime.frames : 0;

  const start = t.frames[from].offset;
  const end = t.frames[to - 1].offset + t.frames[to - 1].bytes;
  const body = buf.subarray(start, end);
  return {
    buf: prime ? Buffer.concat([prime.buf, body]) : body,
    fromFrame: from, toFrame: to, frames: n, frameMs: fMs,
    primeFrames, primeBytes: prime ? prime.need : 0,
    headCut: from > 0,
    // Where the output's timeline begins inside the original. The priming frames are
    // silence that the original does not have, so they shift it back by their own length.
    offsetMs: (from - primeFrames) * fMs,
    beforeMs, afterMs: (to - from + primeFrames) * fMs,
    leadMs: m.soundStartMs - from * fMs + primeFrames * fMs,
    tailMs: to * fMs - m.soundEndMs,
  };
}

/* ------------------------------------------------------------------------- CLI */

function parseArgs(argv) {
  const a = { apply: false, words: false, lead: LEAD_MS, tail: TAIL_MS, slots: null };
  for (let i = 0; i < argv.length; i += 1) {
    const v = argv[i];
    if (v === '--apply') a.apply = true;
    else if (v === '--words') a.words = true;
    else if (v === '--in') a.in = argv[++i];
    else if (v === '--out') a.out = argv[++i];
    else if (v === '--pack') a.pack = argv[++i];
    else if (v === '--lead') a.lead = Number(argv[++i]);
    else if (v === '--tail') a.tail = Number(argv[++i]);
    else if (v === '--slots') a.slots = argv[++i].split(',');
    else { console.error(`unknown option ${v}`); process.exit(2); }
  }
  return a;
}

/**
 * Cut one clip and prove the cut. Escalates the reservoir guard rather than shipping a
 * damaged attack, and gives up rather than guessing.
 */
export function cutVerified(file, m, opts = {}) {
  // Most to least aggressive. A primed head cut is what we want; cutting only the tail
  // cannot underrun because frame 0 is retained and is always self-contained; keeping the
  // original bytes is the floor.
  const attempts = [
    { headCut: true, label: 'primed head + tail' },
    { headCut: false, label: 'tail only' },
  ];
  const tried = [];
  for (const a of attempts) {
    const plan = planTrim(file, m, { ...opts, headCut: a.headCut });
    if (!plan.buf) { tried.push(`${a.label}: ${plan.reason}`); continue; }
    const tmp = `${file}.trimcheck-${process.pid}.mp3`;
    let after;
    let d;
    try {
      writeFileAtomic(tmp, plan.buf);
      [after] = measureFiles([tmp]);
      [d] = diffFiles([{ orig: file, trimmed: tmp, offsetMs: plan.offsetMs, fromMs: m.soundStartMs, toMs: m.soundEndMs }]);
    } finally {
      rmSync(tmp, { force: true });
    }
    // GATE 1 — the decoder must not complain. This is the check that was missing, and it
    // is the only thing that sees a reservoir underrun: the samples compare equal anyway.
    if (!after || !after.cleanDecode) {
      tried.push(`${a.label}: decoder diagnostics — ${(after?.diagnostics ?? ['(no measurement)']).join(' | ')}`);
      continue;
    }
    // GATE 2 — and the audio must be the audio.
    if (!d || !d.ok || d.maxDiffInSound > DIFF_EPS) {
      tried.push(`${a.label}: sound changed (error ${d ? d.maxDiffInSound : 'n/a'})`);
      continue;
    }
    return { plan, after, diff: d, strategy: a.label, tried };
  }
  return { plan: { buf: null, beforeMs: null, reason: `no safe cut — ${tried.join('; ')}` }, tried };
}

/** Every tile audio object in a manifest, with a setter. */
function* tileClips(manifest, slots) {
  for (const group of Object.keys(manifest.tiles ?? {})) {
    const tiles = manifest.tiles[group];
    if (!Array.isArray(tiles)) continue;
    for (const tile of tiles) {
      const audio = tile.audio;
      if (!audio || typeof audio !== 'object') continue;
      for (const slot of Object.keys(audio)) {
        if (slots && !slots.includes(slot)) continue;
        const a = audio[slot];
        if (a && typeof a === 'object' && typeof a.src === 'string') {
          yield { label: `${group}[${tile.id}].${slot}`, obj: a, set: (v) => { audio[slot] = v; } };
        }
      }
    }
  }
}

function* wordClips(words, slots) {
  for (const { word } of words) {
    const audio = word && word.audio;
    if (!audio || typeof audio !== 'object') continue;
    for (const slot of Object.keys(audio)) {
      if (slots && !slots.includes(slot)) continue;
      const a = audio[slot];
      if (a && typeof a === 'object' && typeof a.src === 'string') {
        yield { label: `word:${word.id}.${slot}`, obj: a, word, set: (v) => { audio[slot] = v; } };
      }
    }
  }
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  const opts = { leadMs: a.lead, tailMs: a.tail };

  if (a.in) {
    if (!a.out) { console.error('--in needs --out'); return 2; }
    const [m] = measureFiles([a.in]);
    const r = cutVerified(a.in, m, opts);
    const { plan, after, diff: d } = r;
    if (!plan.buf) { console.log(`${a.in}: not cut — ${plan.reason}`); return plan.reason === 'already tight' ? 0 : 1; }
    writeFileAtomic(a.out, plan.buf);
    console.log(`${a.in} -> ${a.out}`);
    console.log(`  ${Math.round(plan.beforeMs)} ms -> ${after.ms} ms   lead ${m.leadMs} -> ${after.leadMs} ms   tail ${m.tailMs} -> ${after.tailMs} ms   sound ${m.soundMs} -> ${after.soundMs} ms`);
    console.log(`  strategy: ${r.strategy}; ${plan.primeFrames} priming frame(s) carrying ${plan.primeBytes} B of reservoir`);
    console.log(`  decoder diagnostics: ${after.diagnostics.length ? after.diagnostics.join(' | ') : 'NONE'}; sample error inside the sound: ${d.maxDiffInSound}`);
    return 0;
  }

  if (!a.pack) { console.error('usage: audio-trim.mjs (--in F --out F | --pack DIR [--apply] [--words] [--slots short,long])'); return 2; }
  const packDir = path.resolve(a.pack);
  const read = readManifest(packDir);
  if (!read) { console.error(`${packDir}: no readable manifest`); return 2; }
  const { manifest } = read;
  const words = a.words ? readWords(packDir).ok : [];
  const items = [...tileClips(manifest, a.slots), ...(a.words ? wordClips(words, a.slots) : [])];
  if (!items.length) { console.log('no clips to look at'); return 0; }

  const files = items.map((it) => path.join(packDir, it.obj.src));
  const gone = files.filter((f) => !existsSync(f));
  if (gone.length) { console.error(`${gone.length} clip(s) referenced but not on disk — run pack-validate first`); return 1; }

  console.error(`${items.length} clip(s) in ${path.basename(packDir)}; decoding to find where the sound is…`);
  const measured = measureFiles(files);

  const rows = [];
  for (let i = 0; i < items.length; i += 1) {
    const r = cutVerified(files[i], measured[i], opts);
    rows.push({ item: items[i], file: files[i], m: measured[i], ...r });
  }

  const w = Math.max(...rows.map((r) => r.item.label.length), 8);
  console.log(`${'clip'.padEnd(w)} ${'text'.padEnd(12)} ${'before'.padStart(7)} ${'after'.padStart(6)} ${'lead'.padStart(5)} ${'tail'.padStart(5)} ${'sound'.padStart(6)}  err`);
  let bytesBefore = 0;
  let bytesAfter = 0;
  for (const r of rows) {
    bytesBefore += statSync(r.file).size;
    bytesAfter += r.plan.buf ? r.plan.buf.length : statSync(r.file).size;
    const txt = String(r.item.obj.text ?? '').slice(0, 12);
    if (!r.plan.buf) {
      console.log(`${r.item.label.padEnd(w)} ${txt.padEnd(12)} ${String(Math.round(r.plan.beforeMs ?? 0)).padStart(7)} ${'—'.padStart(6)} ${''.padStart(5)} ${''.padStart(5)} ${''.padStart(6)}  (${r.plan.reason})`);
    } else {
      console.log(`${r.item.label.padEnd(w)} ${txt.padEnd(12)} ${String(Math.round(r.plan.beforeMs)).padStart(7)} ${String(r.after.ms).padStart(6)} ${String(r.after.leadMs).padStart(5)} ${String(r.after.tailMs).padStart(5)} ${String(r.after.soundMs).padStart(6)}  ${r.diff.maxDiffInSound}`);
    }
  }
  const cutting = rows.filter((r) => r.plan.buf);
  const failed = rows.filter((r) => !r.plan.buf && r.plan.reason !== 'already tight');
  console.log(`\n${cutting.length} of ${rows.length} clip(s) cut; ${(bytesBefore / 1024).toFixed(0)} KiB -> ${(bytesAfter / 1024).toFixed(0)} KiB (−${(100 - (100 * bytesAfter) / bytesBefore).toFixed(0)}%)`);
  if (cutting.length) {
    const ms = cutting.map((r) => r.after.ms).sort((x, y) => x - y);
    console.log(`after: ${ms[0]}–${ms[ms.length - 1]} ms, median ${ms[Math.floor(ms.length / 2)]} ms`);
  }
  if (failed.length) { console.error(`${failed.length} clip(s) could not be cut safely`); return 1; }
  if (!a.apply) { console.log('dry run — pass --apply to write'); return 0; }

  // Blobs first, the things that point at them last (content-pipeline.md §4.2), so a
  // crash leaves an orphan and never a tile pointing at a file that is not there.
  const written = [];
  for (const r of cutting) {
    const ref = `media/aud/${blobName(r.plan.buf, '.mp3')}`;
    const dst = path.join(packDir, ref);
    if (!existsSync(dst)) writeFileAtomic(dst, r.plan.buf);
    written.push({ r, ref, dst });
  }
  // Re-open what was actually written, from its final path, before anything points at it.
  const check = measureFiles(written.map((x) => x.dst));
  let bad = 0;
  for (let i = 0; i < written.length; i += 1) {
    const { r } = written[i];
    const v = check[i];
    if (!v.ok || v.silent) { console.error(`  ${r.item.label}: the written clip does not decode`); bad += 1; continue; }
    if (v.ms !== r.after.ms || v.soundMs !== r.after.soundMs) {
      console.error(`  ${r.item.label}: written clip is ${v.ms}/${v.soundMs} ms, planned ${r.after.ms}/${r.after.soundMs}`); bad += 1; continue;
    }
    written[i].measured = v;
  }
  if (bad) { console.error(`\n${bad} clip(s) failed verification — nothing was repointed; the old blobs are untouched.`); return 1; }

  const touched = new Set();
  for (const { r, ref, measured: v } of written) {
    r.item.set({
      ...r.item.obj,
      src: ref,
      bytes: r.plan.buf.length,
      ms: v.ms,
      leadMs: v.leadMs,
      tailMs: v.tailMs,
      trimmedFrom: r.item.obj.src,
      trimmedAt: new Date().toISOString(),
    });
    if (r.item.word) touched.add(r.item.word);
  }
  for (const word of touched) writeWord(packDir, word);
  manifest.revision = (manifest.revision ?? 0) + 1;
  writeManifest(packDir, manifest);
  console.log(`\nwrote ${written.length} clip(s); manifest revision ${manifest.revision}${touched.size ? `, ${touched.size} word file(s)` : ''}`);
  console.log(`the old blobs are now orphans: node tools/pack-validate.mjs ${a.pack} --delete-orphans`);
  return 0;
}

// Importable: `gen-audio.mjs` calls `cutVerified` so the generator and this tool share
// one implementation of the cut. Only run the CLI when this file IS the command.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
