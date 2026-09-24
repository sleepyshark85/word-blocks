// **Losing her work once ends the app.** This file is the proof.
//
// `CLAUDE.md`: *"Content is hostile input. It is JSON on a phone, edited by a
// non-technical adult. Validate every read; make every write atomic. Losing her work once
// ends the app."* `content-pipeline.md` §4.2 is the law and `src/editor/packStore.mjs` is
// the implementation; this is the only place either has ever been seen to hold under a
// kill, because the port it is written against can be made to die in the middle.
//
// Every case here was run **with the atomic write replaced by a direct one** first, and
// every one of them failed. A green check nobody has watched fail is not a check
// (`CLAUDE.md`).

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { REPO, viPack } from './helpers/load.mjs';
import { createMemoryFs, tearingFs, putExternal } from './helpers/memoryFs.mjs';
import {
  writeAtomic, writeJsonAtomic, readJson, listWords, putWord, getWord,
  deleteWord, listTrash, restoreWord, sweepTrash, importMedia,
  writeManifest, readManifest, TRASH_DAYS,
} from '../src/editor/packStore.mjs';
import { buildWordRecord, mergeWordRecord, mintWordId, draftFromRecord } from '../src/editor/wordFile.mjs';
import { buildList } from '../src/editor/list.mjs';

const DAY = 86400000;

/** A pack with three of her words already on it. */
function packWith(...ids) {
  const seed = { 'pack.json': JSON.stringify({ schema: 1, id: 'vi-seed', language: 'vi', revision: 3 }) };
  for (const id of ids) {
    seed[`words/${id}.json`] = JSON.stringify({ id, text: id, stage: 1, enabled: true, images: [] });
  }
  return createMemoryFs(seed);
}

/* ------------------------------------------------------ the write itself */

test('a write goes to a temporary sibling and is made visible by a rename', () => {
  const fs = packWith('meo');
  writeAtomic(fs, 'words/bo.json', '{"id":"bo"}');
  const ops = fs.log.map((e) => e[0]);
  assert.deepEqual(ops, ['writeText', 'rename']);
  // §4.2 item 1: the temporary name is a **sibling**, so the rename never crosses a
  // filesystem — which is the only condition under which it is atomic at all.
  const [, tmp] = fs.log[0];
  assert.equal(path.posix.dirname(tmp), 'words');
  assert.ok(path.posix.basename(tmp).startsWith('.tmp-'));
  assert.equal(fs.readText('words/bo.json'), '{"id":"bo"}');
  assert.equal(fs.exists(tmp), false);
});

test('KILLED HALFWAY THROUGH THE WRITE: her previous words survive, whole', () => {
  // The real shape of the failure: the OS kills the app while the bytes are going down.
  // The temporary file is torn; `words/meo.json` has not been touched.
  const base = packWith('meo', 'bo', 'ca');
  const fs = tearingFs(base, 'meo');
  const before = base.readText('words/meo.json');

  assert.throws(() => putWord(fs, { id: 'meo', text: 'mèo — edited', stage: 1 }),
    (e) => e.simulated === true);

  // 1. The word she had is byte-identical.
  assert.equal(base.readText('words/meo.json'), before);
  // 2. Nothing else moved.
  assert.equal(base.readText('words/bo.json'), JSON.stringify({ id: 'bo', text: 'bo', stage: 1, enabled: true, images: [] }));
  assert.equal(base.readText('words/ca.json'), JSON.stringify({ id: 'ca', text: 'ca', stage: 1, enabled: true, images: [] }));
  // 3. The torn bytes are on disk under a dot name and the loader does not see them: the
  //    editor's own listing skips anything starting with `.`, so a half-written file is
  //    not a word that will not parse — it is not a word at all.
  const torn = [...base.dump().keys()].filter((k) => k.includes('.tmp-'));
  assert.equal(torn.length, 1, 'the torn temporary file should still be there');
  assert.ok(base.readText(torn[0]).length > 0);
  assert.throws(() => JSON.parse(base.readText(torn[0])),
    'the torn file should not be valid JSON, or the tear proves nothing');
  const read = listWords(base);
  assert.deepEqual(read.words.map((w) => w.id).sort(), ['bo', 'ca', 'meo']);
  assert.deepEqual(read.unreadable, []);
});

test('KILLED BETWEEN THE WRITE AND THE RENAME: the target still holds the old version', () => {
  const fs = packWith('meo');
  const before = fs.readText('words/meo.json');
  fs.kill({ op: 'rename', match: 'meo' });
  assert.throws(() => putWord(fs, { id: 'meo', text: 'changed', stage: 1 }),
    (e) => e.simulated === true);
  fs.kill(null);
  assert.equal(fs.readText('words/meo.json'), before);
  assert.deepEqual(listWords(fs).words.map((w) => w.text), ['meo']);
});

test('the SECOND save is killed and the FIRST is still on disk', () => {
  // The case that matters to her: she added `mèo` last week and `bò` today, and today's
  // save died. `after: 1` survives the first write and kills the second.
  const fs = packWith();
  putWord(fs, { id: 'meo', text: 'mèo', stage: 1, enabled: true });
  fs.kill({ op: 'rename', match: 'bo' });
  assert.throws(() => putWord(fs, { id: 'bo', text: 'bò', stage: 1, enabled: true }));
  fs.kill(null);
  assert.deepEqual(listWords(fs).words.map((w) => w.text), ['mèo']);
});

test('ONE user action touches ONE word file (§4.2)', () => {
  const fs = packWith('meo', 'bo', 'ca');
  fs.log.length = 0;
  putWord(fs, { id: 'meo', text: 'mèo', stage: 1 });
  const touched = new Set(fs.log.map((e) => e[1].replace(/\.tmp-\d+-/, '')));
  assert.deepEqual([...touched].sort(), ['words/meo.json']);
});

/* --------------------------------------------------------- reading is hostile */

test('a word file that will not parse costs that one word and never the pack (K9)', () => {
  const fs = packWith('meo', 'bo');
  fs.writeText('words/broken.json', '{"id": "broken", "text": "mèo",,}');
  const read = listWords(fs);
  assert.deepEqual(read.words.map((w) => w.id).sort(), ['bo', 'meo']);
  assert.deepEqual(read.unreadable, ['broken.json']);
  // And the editor renders it as a line she can act on rather than dropping it.
  const list = buildList({ words: read.words, unreadable: read.unreadable, pack: viPack() });
  assert.equal(list.unreadable.length, 1);
});

test('readJson never throws, whatever is in the file', () => {
  const fs = createMemoryFs({
    'a.json': '[1,2,3]', 'b.json': 'null', 'c.json': '"just a string"',
    'd.json': '', 'e.json': '{"ok":1}',
  });
  assert.equal(readJson(fs, 'a.json'), null, 'an array is not a word');
  assert.equal(readJson(fs, 'b.json'), null);
  assert.equal(readJson(fs, 'c.json'), null);
  assert.equal(readJson(fs, 'd.json'), null);
  assert.deepEqual(readJson(fs, 'e.json'), { ok: 1 });
  assert.equal(readJson(fs, 'missing.json'), null);
});

/* ----------------------------------------------------- delete, undo, recover */

test('L1/L2/L3 — delete moves to .trash, restore brings the word back exactly', () => {
  const fs = packWith('meo');
  const before = getWord(fs, 'meo');
  const now = Date.UTC(2026, 8, 24);
  assert.equal(deleteWord(fs, 'meo', now), true);
  assert.equal(fs.exists('words/meo.json'), false);

  const trash = listTrash(fs, now + DAY);
  assert.equal(trash.length, 1);
  assert.equal(trash[0].expiresInDays, TRASH_DAYS - 1);

  assert.equal(restoreWord(fs, 'meo'), true);
  assert.deepEqual(getWord(fs, 'meo'), before, 'the restored word is not the word she had');
  assert.deepEqual(listTrash(fs, now), []);
});

test('L5 — killed mid-delete, the word is FULLY PRESENT, never half-written', () => {
  // The order is what buys this: the trash entry is written **first**, the live word is
  // removed **second**. Kill the removal and the word is still there.
  const fs = packWith('meo', 'bo');
  const before = fs.readText('words/meo.json');
  fs.kill({ op: 'remove', match: 'words/meo' });
  assert.throws(() => deleteWord(fs, 'meo', Date.now()));
  fs.kill(null);

  assert.equal(fs.readText('words/meo.json'), before, 'the word was lost mid-delete');
  // And the stale trash entry is not offered, so she is never shown the same word twice.
  assert.deepEqual(listTrash(fs, Date.now()), []);
  // The sweep at editor-open removes it, and it can only ever touch `.trash/`.
  assert.equal(sweepTrash(fs, Date.now()), 1);
  assert.equal(fs.exists('words/meo.json'), true);
  assert.equal(fs.exists('.trash/meo.json'), false);
});

test('L5 — killed the other way round, the word is FULLY in Recently deleted', () => {
  const fs = packWith('meo');
  deleteWord(fs, 'meo', Date.UTC(2026, 8, 1));
  assert.equal(fs.exists('words/meo.json'), false);
  assert.equal(listTrash(fs, Date.UTC(2026, 8, 2)).length, 1);
});

test('L3 — a deletion older than 30 days is swept, a newer one is not', () => {
  const fs = packWith('old', 'new');
  const now = Date.UTC(2026, 8, 24);
  deleteWord(fs, 'old', now - (TRASH_DAYS + 1) * DAY);
  deleteWord(fs, 'new', now - 2 * DAY);
  assert.equal(sweepTrash(fs, now), 1);
  assert.deepEqual(listTrash(fs, now).map((t) => t.id), ['new']);
});

test('a trash entry that will not parse is not offered and is swept', () => {
  const fs = packWith();
  fs.writeText('.trash/junk.json', 'not json at all');
  assert.deepEqual(listTrash(fs, Date.now()), []);
  assert.equal(sweepTrash(fs, Date.now()), 1);
});

/* ----------------------------------------------------------------- the media */

test('§4.2 — media is content addressed, and a second import of the same file is free', () => {
  const fs = packWith();
  putExternal('file:///tmp/cat.jpg', 'JPEGBYTES', 'ABCDEF0123456789deadbeef');
  const first = importMedia(fs, 'file:///tmp/cat.jpg', 'img', 'jpg');
  assert.equal(first.src, 'media/img/abcdef0123456789.jpg');
  // D20 — nothing stored is uppercase, media file names included.
  assert.equal(first.src, first.src.toLowerCase());
  fs.log.length = 0;
  const again = importMedia(fs, 'file:///tmp/cat.jpg', 'img', 'jpg');
  assert.equal(again.src, first.src);
  assert.deepEqual(fs.log, [], 'the same photograph was copied twice');
});

test('a blob copied halfway has the WRONG NAME and is inert', () => {
  const fs = packWith();
  putExternal('file:///tmp/dog.jpg', 'JPEGBYTES', '1111222233334444');
  fs.kill({ op: 'rename', match: 'media/img' });
  assert.throws(() => importMedia(fs, 'file:///tmp/dog.jpg', 'img', 'jpg'));
  fs.kill(null);
  // Nothing is at the content-addressed name, so no word can ever point at it, and the
  // temporary is garbage swept by `pack-validate --delete-orphans`.
  assert.equal(fs.exists('media/img/1111222233334444.jpg'), false);
  assert.equal([...fs.dump().keys()].some((k) => k.includes('.tmp-')), true);
});

test('a source the OS has already cleaned up returns null rather than throwing', () => {
  const fs = packWith();
  assert.equal(importMedia(fs, 'file:///tmp/gone.jpg', 'img', 'jpg'), null);
});

test('MEDIA FIRST, THE WORD FILE LAST — a crash between them leaves a blob, not a gap', () => {
  const fs = packWith();
  putExternal('file:///tmp/bird.jpg', 'JPEG', 'aaaabbbbccccdddd');
  const blob = importMedia(fs, 'file:///tmp/bird.jpg', 'img', 'jpg');
  fs.kill({ op: 'rename', match: 'words/' });
  assert.throws(() => putWord(fs, {
    id: 'chim', text: 'chim', stage: 1, images: [{ src: blob.src }],
  }));
  fs.kill(null);
  // The blob is an orphan — garbage. There is **no** word pointing at a file that is not
  // there, which is the failure this ordering exists to make impossible.
  assert.equal(fs.exists(blob.src), true);
  assert.deepEqual(listWords(fs).words, []);
});

/* ------------------------------------------------------------- the manifest */

test('§6 — pack.json.bak is written before the manifest, and only from one that parses', () => {
  const fs = packWith();
  const original = readManifest(fs);
  const next = writeManifest(fs, { ...original, cheer: { src: 'media/aud/x.m4a' } });
  assert.equal(next.revision, original.revision + 1, 'the revision must be bumped on every write');
  assert.deepEqual(readJson(fs, 'pack.json.bak'), original);

  // A manifest destroyed afterwards falls back to the backup rather than to nothing.
  fs.writeText('pack.json', '{ broken');
  const recovered = readManifest(fs);
  assert.equal(recovered.id, 'vi-seed');
  assert.equal(recovered.cheer, undefined, 'the backup is the PREVIOUS manifest');
});

test('a manifest that will not parse cannot overwrite a good backup', () => {
  // §6: *"`pack.json.bak` is written before every manifest change, and **only from a
  // manifest that parses** — so a broken current manifest can never overwrite a good
  // backup."* The backup is the last **good** manifest, not the last bytes on disk.
  const fs = packWith();
  writeManifest(fs, { ...readManifest(fs), name: 'first' });
  assert.equal(readJson(fs, 'pack.json').name, 'first');
  fs.writeText('pack.json', 'not json');

  const good = readJson(fs, 'pack.json.bak');
  assert.notEqual(good, null, 'there must be a good backup to protect');
  // Writing again from the damaged state must not take the backup down with it.
  writeManifest(fs, { ...readManifest(fs), name: 'second' });
  assert.deepEqual(readJson(fs, 'pack.json.bak'), good, 'the backup was overwritten from a broken manifest');
  assert.equal(readManifest(fs).name, 'second');
});

/* ------------------------------------------------------------ the word record */

test('J4 — the draft on disk carries everything entered so far and is withheld from him', () => {
  const pack = viPack();
  const fs = packWith();
  const id = mintWordId(1758700000000, 1, []);
  assert.match(id, /^[a-z0-9][a-z0-9.\-_]{0,63}$/, 'the id must be a legal pack id');

  // Step 1: a picture and nothing else.
  putWord(fs, buildWordRecord({ id, text: '', images: [{ src: 'media/img/a.jpg' }], draft: true },
    { language: 'vi' }));
  let stored = getWord(fs, id);
  assert.equal(stored.draft, true);
  assert.equal(stored.enabled, false, 'a draft must never be enabled (content-pipeline §4.3)');
  assert.deepEqual(stored.images, [{ src: 'media/img/a.jpg' }]);

  // Step 2: the word. The picture is still there.
  putWord(fs, mergeWordRecord(stored, buildWordRecord(
    { id, text: 'mèo', images: stored.images, draft: true }, { language: 'vi' },
  )));
  stored = getWord(fs, id);
  assert.equal(stored.text, 'mèo');
  assert.deepEqual(stored.images, [{ src: 'media/img/a.jpg' }]);

  // And reopening it gives back what she entered.
  const reopened = draftFromRecord(stored);
  assert.equal(reopened.text, 'mèo');
  assert.equal(reopened.images.length, 1);

  // The child never meets it: the resolved pack lists it as not playable.
  const row = buildList({ words: [stored], pack }).notYet[0];
  assert.equal(row.playable, false);
});

test('mergeWordRecord keeps the provenance the editor never asks about', () => {
  const existing = {
    id: 'cho', text: 'chó', stage: 3, fallbackEmoji: 'Dog',
    images: [], audio: { word: { src: 'a' }, sentence: { src: 's' } },
    build: { assetConcept: 'a dog', fetched: { lead: 1 } },
  };
  const next = buildWordRecord({ id: 'cho', text: 'chó', images: [], draft: false, choice: null },
    { language: 'vi' });
  const merged = mergeWordRecord(existing, next);
  assert.equal(merged.fallbackEmoji, 'Dog');
  assert.equal(merged.audio.sentence.src, 's');
  assert.equal(merged.build.assetConcept, 'a dog');
  assert.deepEqual(merged.build.fetched, { lead: 1 });
});

test('mintWordId never collides with a word already on disk', () => {
  const taken = [mintWordId(5, 1, [])];
  const second = mintWordId(5, 1, taken);
  assert.notEqual(second, taken[0]);
  assert.match(second, /^[a-z0-9][a-z0-9.\-_]*$/);
});

/* --------------------------------------------------- the architectural rule */

test('nothing in the editor writes a file except through the atomic path', () => {
  // The whole guarantee above is one function deep. A second `writeText` call site — a
  // convenience added in six months — would be a torn word file, and no behaviour test
  // would see it because the happy path is identical.
  const dir = path.join(REPO, 'src', 'editor');
  const offenders = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.mjs')) continue;
    const src = readFileSync(path.join(dir, name), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:])\/\/.*$/gm, '$1 ');
    for (const m of src.matchAll(/fs\.writeText\(/g)) {
      void m;
      if (name !== 'packStore.mjs') offenders.push(name);
    }
  }
  assert.deepEqual(offenders, []);
  const store = readFileSync(path.join(dir, 'packStore.mjs'), 'utf8');
  assert.equal((store.match(/fs\.writeText\(/g) ?? []).length, 1,
    'packStore.mjs writes in more than one place; only writeAtomic may');
});

test('the editor imports nothing that only runs on a device', () => {
  // `development-process.md` §5: *anything checkable off-device imports nothing that only
  // runs on-device*. It is what lets every case above run under `node --test`.
  const dir = path.join(REPO, 'src', 'editor');
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (!statSync(p).isFile() || !name.endsWith('.mjs')) continue;
    const src = readFileSync(p, 'utf8');
    for (const m of src.matchAll(/^\s*(?:import|export)[^;]*?from\s+['"]([^'"]+)['"]/gm)) {
      const spec = m[1];
      assert.ok(spec.startsWith('.'), `src/editor/${name} imports the bare specifier ${spec}`);
      assert.ok(!/react|expo|node:/i.test(spec), `src/editor/${name} imports ${spec}`);
      assert.ok(!spec.includes('tools/'), `src/editor/${name} imports the asset pipeline`);
    }
    const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1 ');
    assert.ok(!/setTimeout|setInterval|requestAnimationFrame/.test(code),
      `src/editor/${name} owns a timer; every timer in this app is the state layer's`);
    assert.ok(!/\bconsole\s*\./.test(code), `src/editor/${name} logs to the console`);
    assert.ok(!/Math\s*\.\s*random/.test(code), `src/editor/${name} uses Math.random`);
    // `packStore` takes a clock as an argument; nothing in `src/editor/` reads one.
    assert.ok(!/Date\s*\.\s*now|new\s+Date\b/.test(code), `src/editor/${name} reads a clock`);
  }
});

test('writeJsonAtomic writes JSON a human can open and a parser can read', () => {
  const fs = packWith();
  writeJsonAtomic(fs, 'words/x.json', { id: 'x', text: 'mèo' });
  const raw = fs.readText('words/x.json');
  assert.equal(raw.endsWith('\n'), true);
  assert.deepEqual(JSON.parse(raw), { id: 'x', text: 'mèo' });
  // NFC, so a word she typed and a word the pipeline generated compare equal on disk.
  assert.equal(raw.includes('̀'), false, 'the file must be NFC, not decomposed');
});

test('the three durations §13 names are the three durations the code holds', () => {
  // L2's six seconds, J7's three and §13.6's two. They are read as text because the
  // files that hold them are React components; what matters is that a change to the
  // criterion and a change to the code cannot pass each other in the dark.
  const read = (file, name) => {
    const m = readFileSync(path.join(REPO, file), 'utf8').match(new RegExp(`const ${name} = (\\d+);`));
    assert.ok(m, `${file} no longer declares ${name}`);
    return Number(m[1]);
  };
  assert.equal(read('src/state/useEditor.js', 'UNDO_MS'), 6000, 'L2 — a 6-second Undo toast');
  assert.equal(read('src/ui/screens/editor/AddWordFlow.js', 'RECORD_MS'), 3000, 'J7 — recording stops at 3 s');
  assert.equal(read('src/ui/screens/editor/CheerScreen.js', 'CHEER_MS'), 2000, '§13.6 — the cheer is 2 s');
  assert.equal(TRASH_DAYS, 30, 'L3 — Recently deleted holds a word for 30 days');
});
