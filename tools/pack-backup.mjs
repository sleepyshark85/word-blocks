#!/usr/bin/env node
// Back a pack up, and restore it — including onto a new phone.
//
//   node tools/pack-backup.mjs export packs/vi-seed backups/ghepchu-vi-2026-09-23.zip
//   node tools/pack-backup.mjs restore backups/ghepchu-vi-2026-09-23.zip packs/vi-restored
//
// THE BACKUP IS THE PACK. A zip of the directory, with no transformation: same
// `pack.json`, same `words/*.json`, same `media/`. Two consequences worth having:
//
//   - restoring is unzip + validate, so there is no importer to get wrong and no second
//     format to keep in step with the first;
//   - she is not locked in. Anyone with a laptop can open the zip and read her words,
//     and if this app disappears her work does not.
//
// Zip rather than tar.gz because every phone share sheet and every desktop opens a zip
// without being asked twice, and the media inside is already compressed so the container
// is only holding files together.
//
// Restore is IDEMPOTENT: media is content-addressed, so re-restoring writes the same
// bytes to the same names, and restoring twice is the same as restoring once.
//
// Restore is NOT partial. That was the design intent and it was measured and abandoned:
// truncating a 1.06 MB pack archive to 400 KB and restoring it recovered ZERO words,
// because a zip's index lives at the END of the file and `zip -FF` could not rebuild it
// non-interactively. Per-word files protect a LIVE pack from a bad write; they do not
// make a damaged archive partly readable.
//
// So the guarantee is the other one, which is the one that matters: a backup either
// restores completely or is refused, and a refused restore never touches the pack she
// already has. Export therefore TESTS the archive it just wrote (`unzip -t`) — a backup
// that cannot be read must not be reported as a backup — and restore unpacks into
// staging, validates, and only then becomes a pack.

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { readManifest, packPaths } from './lib/pack.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [cmd, a1, a2] = process.argv.slice(2);
if (!['export', 'restore'].includes(cmd) || !a1 || !a2) {
  console.error('usage: pack-backup.mjs export <pack-dir> <file.zip>\n       pack-backup.mjs restore <file.zip> <pack-dir>');
  process.exit(2);
}

const validate = (dir, ...flags) => spawnSync(process.execPath, [path.join(ROOT, 'tools', 'pack-validate.mjs'), dir, ...flags], { stdio: 'inherit' }).status;

if (cmd === 'export') {
  const packDir = path.resolve(a1);
  const zip = path.resolve(a2);
  const read = readManifest(packDir);
  if (!read) { console.error(`cannot read ${packDir}/pack.json`); process.exit(2); }

  // Validate BEFORE writing a backup. A backup of a broken pack is a way to make the
  // breakage permanent, and the moment she notices something is wrong is exactly the
  // moment she will reach for "back up".
  const code = validate(packDir);
  if (code !== 0) {
    console.error(`\n${packDir} does not validate. Backing it up would preserve the fault.\nFix it, or force a backup by copying the directory by hand — deliberately, not through this tool.`);
    process.exit(1);
  }

  mkdirSync(path.dirname(zip), { recursive: true });
  rmSync(zip, { force: true });
  // -X drops extra file attributes so two exports of the same pack differ only by
  // timestamp; -r recurses; the working directory is the pack's PARENT so the archive
  // contains one top-level folder and cannot explode over the restore target.
  execFileSync('zip', ['-q', '-r', '-X', zip, path.basename(packDir),
    // Caches and scratch are big, regenerable and nobody's work.
    '-x', `${path.basename(packDir)}/.candidates/*`,
    '-x', `${path.basename(packDir)}/.cache/*`,
    '-x', `${path.basename(packDir)}/.tmp-audio/*`,
    '-x', `${path.basename(packDir)}/.gen-audio.json`,
  ], { cwd: path.dirname(packDir), stdio: 'pipe' });

  // Test the archive we just wrote. An untested backup is a promise, and this is the
  // one file whose whole job is to still work on a day when nothing else does.
  try {
    execFileSync('unzip', ['-t', '-q', zip], { stdio: 'pipe' });
  } catch (e) {
    rmSync(zip, { force: true });
    console.error(`the archive did not verify and has been deleted rather than left looking like a backup:\n  ${String(e.message).split('\n')[0]}`);
    process.exit(1);
  }

  const bytes = statSync(zip).size;
  console.log(`\n${zip}\n  ${bytes.toLocaleString()} B  (${(bytes / 1024 / 1024).toFixed(2)} MiB)`);
  console.log('  This file IS the pack. Unzip it anywhere to read her words.');
  process.exit(0);
}

/* ------------------------------------------------------------------------ restore */

const zip = path.resolve(a1);
const dest = path.resolve(a2);
if (!existsSync(zip)) { console.error(`no such file: ${zip}`); process.exit(2); }
if (existsSync(dest) && readdirSync(dest).length) {
  console.error(`${dest} already exists and is not empty.\nRestore into a new directory; swapping it into place is a rename, and a rename is the only atomic way to replace a pack.`);
  process.exit(2);
}

const staging = `${dest}.restoring`;
rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });
// Test before unpacking, so a damaged archive is refused while the pack she already has
// is still on the phone, untouched.
try {
  execFileSync('unzip', ['-t', '-q', zip], { stdio: 'pipe' });
} catch (e) {
  rmSync(staging, { recursive: true, force: true });
  console.error(`${zip} is damaged and cannot be restored:\n  ${String(e.message).split('\n')[0]}\n`);
  console.error('Nothing has been changed. Use another backup, or keep the pack you have.');
  process.exit(1);
}
execFileSync('unzip', ['-q', zip, '-d', staging], { stdio: 'pipe' });

const inner = readdirSync(staging).filter((f) => existsSync(path.join(staging, f, 'pack.json')) || existsSync(path.join(staging, f, 'words')));
const src = inner.length === 1 ? path.join(staging, inner[0]) : staging;

mkdirSync(path.dirname(dest), { recursive: true });
execFileSync('cp', ['-r', src, dest]);
rmSync(staging, { recursive: true, force: true });

console.log(`\nrestored to ${dest}; validating what actually arrived:\n`);
const code = validate(dest);
if (code !== 0) {
  console.error(`\nThe restored pack has problems. It has NOT been discarded — the words that\nsurvived are in ${dest} and the report above names what did not.`);
}
process.exit(code ?? 1);
