// The single door through which any file becomes pack media.
//
// THIS IS THE FILE THAT MAKES A RECORDING AND A GENERATED CLIP INTERCHANGEABLE. A
// photograph fetched from Wikimedia Commons, a photograph the mother took of their own
// cat, an mp3 from edge-tts and a recording of her voice all arrive here, are normalised
// the same way, are stored under a name derived from their own bytes, and produce a
// media object of exactly one shape. Nothing downstream — not the round generator, not
// the chant, not the picture card — can tell which is which, and that is the point: the
// pipeline treats TTS as the floor and her voice as the ceiling by making them the same
// kind of thing.
//
// `source` exists only so that ATTRIBUTION can be generated. It is the one field that
// differs, and only the attribution tool reads it.

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { blobName, packPaths, sniffType, writeFileAtomic } from './pack.mjs';

/** Normalisation targets. Priced in docs/design/content-pipeline.md §Budgets. */
export const IMAGE = { size: 512, quality: 82 };

/**
 * Square-crop, resize and re-encode an image, writing it into the pack under a
 * content-addressed name. Returns the media object to put on a word.
 *
 * Content addressing buys four things at once:
 *   - the same photo imported twice is stored once;
 *   - a word file can never see a media file's bytes change underneath it;
 *   - a half-written blob has the wrong name and is simply never referenced;
 *   - backup and restore are idempotent file copies.
 */
export function importImage(packDir, srcFile, meta = {}) {
  const p = packPaths(packDir);
  mkdirSync(p.img, { recursive: true });
  const tmp = path.join(p.img, `.norm-${process.pid}-${Math.random().toString(36).slice(2)}.jpg`);
  try {
    execFileSync('magick', [
      `${srcFile}[0]`, // [0] takes the first frame; a multi-page TIFF or animated GIF otherwise montages
      '-auto-orient', // a phone photo carries EXIF rotation; without this her portrait shots land sideways
      '-resize', `${IMAGE.size}x${IMAGE.size}^`,
      '-gravity', 'center',
      '-extent', `${IMAGE.size}x${IMAGE.size}`,
      '-strip', // drops EXIF — including the GPS tag on her camera roll photos
      '-interlace', 'Plane',
      '-sampling-factor', '4:2:0',
      '-quality', String(IMAGE.quality),
      tmp,
    ], { stdio: 'pipe' });
    const buf = readFileSync(tmp);
    if (sniffType(tmp) !== 'jpeg') throw new Error('ImageMagick did not produce a JPEG');
    const name = blobName(buf, '.jpg');
    const ref = `media/img/${name}`;
    const dst = path.join(packDir, ref);
    if (!existsSync(dst)) writeFileAtomic(dst, buf);
    return {
      src: ref,
      w: IMAGE.size,
      h: IMAGE.size,
      bytes: buf.length,
      source: meta.source ?? 'unstated',
      sourceUrl: meta.sourceUrl ?? null,
      license: meta.license ?? null,
      licenseUrl: meta.licenseUrl ?? null,
      creator: meta.creator ?? null,
      title: meta.title ?? null,
      // Provenance only. `rank` is which fetcher stream offered it (lead / article /
      // category) and `caption` is the source article's own words. Both exist so that a
      // change to the sourcing strategy can be MEASURED after curation rather than
      // argued about; neither is read at runtime.
      ...(meta.rank ? { rank: meta.rank } : {}),
      ...(meta.caption ? { caption: meta.caption } : {}),
      // CC BY and CC BY-SA both require that changes be indicated. We always change the
      // image, so the statement is always true and is recorded rather than remembered.
      modified: `cropped to square, resized to ${IMAGE.size}px, re-encoded JPEG q${IMAGE.quality}`,
      addedAt: new Date().toISOString(),
    };
  } finally {
    if (existsSync(tmp)) rmSync(tmp);
  }
}

/**
 * Put an audio file into the pack. Audio is NOT re-encoded: edge-tts and gTTS already
 * emit 24 kHz mp3, and a recording made on her phone is already compressed. Re-encoding
 * would cost quality for no size win, and this machine has no ffmpeg
 * (`spike-results.md` §Machine inventory).
 */
export function importAudio(packDir, srcFile, meta = {}) {
  const p = packPaths(packDir);
  mkdirSync(p.aud, { recursive: true });
  const kind = sniffType(srcFile);
  const extByKind = { mp3: '.mp3', wav: '.wav', ogg: '.ogg' };
  if (!extByKind[kind]) throw new Error(`${srcFile}: not an audio file this pipeline accepts (sniffed ${kind ?? 'nothing'})`);
  const buf = readFileSync(srcFile);
  const name = blobName(buf, extByKind[kind]);
  const ref = `media/aud/${name}`;
  const dst = path.join(packDir, ref);
  if (!existsSync(dst)) writeFileAtomic(dst, buf);
  return {
    src: ref,
    bytes: buf.length,
    ms: meta.ms ?? null,
    engine: meta.engine ?? 'unstated', // 'edge-tts:en-US-JennyNeural', 'gtts:vi', 'recording'
    voice: meta.voice ?? null,
    text: meta.text ?? null,
    by: meta.by ?? null, // who recorded it, when engine === 'recording'
    addedAt: new Date().toISOString(),
  };
}

/** Bytes a media object occupies, for budget reporting. */
export function mediaBytes(packDir, ref) {
  const abs = path.join(packDir, ref);
  return existsSync(abs) ? statSync(abs).size : 0;
}

export { writeFileSync };
