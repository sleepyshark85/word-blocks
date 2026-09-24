// The editor's state layer: it holds the filesystem port, it owns every timer, and it is
// the only thing in the editor that writes.
//
// `development-process.md` §3, the architectural rule this project inherits: the engine is
// pure, the React state layer *"holds engine state, dispatches actions, owns every timer
// with explicit cleanup on unmount and on reset"*, and presentation replays what is
// already resolved. Everything below this file — `src/editor/model.mjs`,
// `wordFile.mjs`, `packStore.mjs`, `list.mjs` — runs in Node with no renderer.
// Everything above it draws.
//
// **The reload is deliberately not automatic.** `acceptance-criteria.md` J14 wants a word
// she saved discoverable with no restart, and J11 wants the board she left to still be
// there with its strip assembled. Both hold because `onPackChanged` is called once, when
// she leaves the editor, and `App.js` restores the strip across the rebuild
// (`src/engine/session.mjs` `createSession({ build })`).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createTimerBag } from './timers.mjs';
import { packFs } from '../content/store';
import {
  listWords, putWord, getWord, deleteWord, restoreWord, listTrash, sweepTrash,
  importMedia, writeManifest, readManifest,
} from '../editor/packStore.mjs';
import { buildList } from '../editor/list.mjs';
import {
  buildWordRecord, mergeWordRecord, draftFromRecord, mintWordId, ownImage, ownClip,
} from '../editor/wordFile.mjs';
import { analyse } from '../editor/model.mjs';

/** L2 — the undo toast stands for six seconds and then the deletion is final enough. */
const UNDO_MS = 6000;

/**
 * @param {object} args
 * @param {object} args.pack        the resolved pack — the authority on *why* a word is
 *                                  not playable (`src/editor/list.mjs`)
 * @param {string} args.packId
 * @param {Function} args.onPackChanged  called once, on close, when anything was written
 */
export function useEditor({ pack, packId, onPackChanged }) {
  const fs = useMemo(() => packFs(packId), [packId]);
  const timers = useRef(null);
  if (timers.current === null) timers.current = createTimerBag();
  const [generation, setGeneration] = useState(0);
  const [toast, setToast] = useState(null);
  const dirty = useRef(false);
  const idSeq = useRef(0);

  // **Explicit cleanup, on unmount and on reset.** The undo toast is the one timer this
  // screen has, and a toast that fires into an unmounted tree is the exact shape
  // `development-process.md` §3 exists to prevent.
  useEffect(() => {
    const bag = timers.current;
    return () => bag.clearAll();
  }, []);

  // Housekeeping at open: drop trash entries whose delete was interrupted (the word is
  // still live) and the ones past 30 days. It can only ever remove files under `.trash/`.
  useEffect(() => {
    sweepTrash(fs, Date.now());
  }, [fs]);

  const list = useMemo(() => {
    void generation; // the list is rebuilt after every write, by design
    const read = listWords(fs);
    return buildList({
      words: read.words,
      unreadable: read.unreadable,
      trash: listTrash(fs, Date.now()),
      pack,
    });
  }, [fs, pack, generation]);

  const touched = useCallback(() => {
    dirty.current = true;
    setGeneration((g) => g + 1);
  }, []);

  /** Called once when she leaves the editor: J14's atomic tree rebuild happens here. */
  const close = useCallback(() => {
    timers.current.clearAll();
    setToast(null);
    if (dirty.current && onPackChanged) {
      dirty.current = false;
      onPackChanged();
    }
  }, [onPackChanged]);

  /* ------------------------------------------------------------------- the draft */

  /**
   * J4 — **a draft is written after every screen**, including before the word is valid.
   * The id is minted at the picture step, before she has typed anything, which is what
   * makes a kill at step 1 recoverable.
   */
  const newDraft = useCallback(() => {
    idSeq.current += 1;
    const taken = listWords(fs).words.map((w) => w.id);
    return {
      id: mintWordId(Date.now(), idSeq.current, taken),
      text: '',
      images: [],
      audio: { word: null, blend: null, sentence: null },
      draft: true,
      parseIndex: 0,
      isNew: true,
    };
  }, [fs]);

  const openDraft = useCallback((id) => {
    const record = getWord(fs, id);
    return record ? { ...draftFromRecord(record), isNew: false } : null;
  }, [fs]);

  /**
   * Write the draft. One word file, one atomic write (J10), and it is called after every
   * step rather than at the end.
   *
   * `final` is her *Đúng rồi* on the preview: until then the record carries `draft: true`
   * and `resolvePack` withholds it, so a half-entered word is never dealt to the child.
   */
  const saveDraft = useCallback((draft, { final = false } = {}) => {
    const looked = analyse(pack, draft.text, draft.parseIndex ?? 0);
    const next = buildWordRecord(
      {
        ...draft,
        choice: looked.choice,
        draft: final ? false : true,
        // X8 — *the word is still saved*, with its picture and her recording, and the
        // reason is the sentence the list will render.
        disabledReason: looked.problem ? looked.problem.code : null,
      },
      { language: pack.language, addedAt: new Date().toISOString() },
    );
    const existing = getWord(fs, draft.id);
    putWord(fs, mergeWordRecord(existing, next));
    touched();
    return { record: next, looked };
  }, [fs, pack, touched]);

  /* -------------------------------------------------------------------- the media */

  /**
   * J12 — more than one image may be attached and **one is enough to save and play**.
   * Media first, the word file last (`content-pipeline.md` §4.2): a crash between them
   * leaves an unreferenced blob, never a word pointing at a file that is not there.
   */
  const attachImage = useCallback((draft, asset, source) => {
    const blob = importMedia(fs, asset.uri, 'img', asset.ext);
    if (!blob) return draft;
    const image = ownImage(
      { ...blob, w: asset.width ?? null, h: asset.height ?? null },
      new Date().toISOString(),
      source,
    );
    return { ...draft, images: [...draft.images, image] };
  }, [fs]);

  const removeImage = useCallback((draft, index) => ({
    ...draft,
    images: draft.images.filter((_, i) => i !== index),
  }), []);

  /** J8 — re-recording replaces the previous recording, with no limit on retries. */
  const attachRecording = useCallback((draft, clip) => {
    const blob = importMedia(fs, clip.uri, 'aud', clip.ext);
    if (!blob) return draft;
    return {
      ...draft,
      audio: {
        ...draft.audio,
        word: ownClip({ ...blob, ms: clip.ms }, draft.text, new Date().toISOString()),
      },
    };
  }, [fs]);

  /**
   * J6 — *"use the built-in voice" is offered only if a shipped clip exists for that exact
   * word*. Exact means the spelling, normalised the same way hers is; there is no fuzzy
   * match, because a clip of a different word in her child's ear is worse than silence.
   */
  const shippedClipFor = useCallback((text) => {
    const found = pack.words.find((w) => w.text === analyse(pack, text).text);
    return found && found.audio.word ? found.audio.word : null;
  }, [pack]);

  const useShippedClip = useCallback((draft) => {
    const clip = shippedClipFor(draft.text);
    return clip ? { ...draft, audio: { ...draft.audio, word: { ...clip, by: null } } } : draft;
  }, [shippedClipFor]);

  /* ------------------------------------------------------------ delete and recover */

  /**
   * L1, L2, L5 — the trash entry is written before the live word is removed, so a kill in
   * the middle leaves the word fully present. The 6-second toast is a timer in this
   * layer, cancelled on unmount and replaced rather than stacked.
   */
  const remove = useCallback((id) => {
    const record = getWord(fs, id);
    if (!deleteWord(fs, id, Date.now())) return;
    touched();
    setToast({ id, text: record && record.text ? record.text : '' });
    timers.current.set('undo', () => setToast(null), UNDO_MS);
  }, [fs, touched]);

  /**
   * **Caught in a browser, and it is the defect this project's architectural rule names.**
   * The first version restored the word *inside* a `setToast` updater and called
   * `setGeneration` from in there. `development-process.md` §3 / `CLAUDE.md`: *"resolving
   * turns inside `setState` updaters produced most of v1's defects and double-executed
   * every turn under StrictMode"*. It did exactly that here — the tap cleared the toast
   * and the word did not come back. **Updaters stay pure.**
   */
  const undoRemove = useCallback(() => {
    timers.current.clear('undo');
    if (!toast) return;
    restoreWord(fs, toast.id);
    setToast(null);
    touched();
  }, [fs, toast, touched]);

  const restore = useCallback((id) => {
    restoreWord(fs, id);
    touched();
  }, [fs, touched]);

  /* --------------------------------------------------------------- the vocabulary */

  /**
   * K3, K4, K5 — **the rime she added, with its six toned forms stored composed.** It
   * goes into `pack.json`'s `tiles.rime`, which is *"the model and the editor's
   * vocabulary"* in revision 5 (`content-pipeline.md` §3.7) and no longer the board — the
   * board is the alphabet, so adding a rime adds **no cell** and moves nothing.
   *
   * **Two limits, recorded rather than smuggled.** A rime she adds has no đánh vần clip,
   * so the state it creates is silent until one exists; that is `content-pipeline.md`
   * §5's documented degradation (*"a tile's clip missing → the tile is silent; tap, lift
   * and placement all work"*) and the validator says so. And if the new rime introduces a
   * pass-through **prefix state** the pack has no clip for — `iê` inside `iêng` — the
   * validator names it. Neither costs her the word; both cost a sound, and `ui.md` §13
   * does not ask the editor to record tile audio.
   *
   * It is applied immediately rather than on close, because the next thing she will do is
   * look at the word that needed it.
   */
  const addRime = useCallback((proposal) => {
    const manifest = readManifest(fs);
    if (!manifest) return;
    const tiles = manifest.tiles && typeof manifest.tiles === 'object' ? manifest.tiles : {};
    const rimes = Array.isArray(tiles.rime) ? tiles.rime : [];
    if (rimes.some((r) => r && r.id === proposal.id)) return;
    const entry = {
      id: proposal.id,
      glyph: proposal.id,
      legalTones: proposal.legalTones.filter((t) => typeof proposal.toned[t] === 'string'
        && proposal.toned[t] !== ''),
      toned: Object.fromEntries(Object.entries(proposal.toned)
        .map(([tone, form]) => [tone, typeof form === 'string' && form !== '' ? form : null])),
      audio: null,
      source: 'editor',
    };
    writeManifest(fs, { ...manifest, tiles: { ...tiles, rime: [...rimes, entry] } });
    dirty.current = false;
    setGeneration((g) => g + 1);
    if (onPackChanged) onPackChanged();
  }, [fs, onPackChanged]);

  /* ------------------------------------------------------------------- the cheer */

  /**
   * §13.6 / E14 / I12, J15, J16 — **one optional clip per pack**, not per word. It lives
   * in the manifest, which is the only thing in the editor that writes `pack.json`, and
   * `pack.json.bak` is written first (`content-pipeline.md` §6).
   */
  const cheer = useMemo(() => {
    void generation;
    const manifest = readManifest(fs);
    return manifest && manifest.cheer && typeof manifest.cheer === 'object' ? manifest.cheer : null;
  }, [fs, generation]);

  const setCheer = useCallback((clip) => {
    const manifest = readManifest(fs);
    if (!manifest) return;
    if (clip === null) {
      const { cheer: _drop, ...rest } = manifest;
      writeManifest(fs, rest);
    } else {
      const blob = importMedia(fs, clip.uri, 'aud', clip.ext);
      if (!blob) return;
      writeManifest(fs, {
        ...manifest,
        cheer: ownClip({ ...blob, ms: clip.ms }, null, new Date().toISOString()),
      });
    }
    touched();
  }, [fs, touched]);

  return {
    list,
    toast,
    cheer,
    close,
    newDraft,
    openDraft,
    saveDraft,
    attachImage,
    removeImage,
    attachRecording,
    shippedClipFor,
    useShippedClip,
    remove,
    undoRemove,
    restore,
    addRime,
    setCheer,
  };
}
