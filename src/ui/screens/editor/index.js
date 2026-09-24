// The editor, as one component the parent menu can mount.
//
// It routes between S9 (the list), S10–S13/S19/S20 (add and edit) and S14 (the cheer),
// and it is the boundary at which `useEditor` — the state layer that owns every write and
// every timer — is created. Above it nothing writes; below it nothing draws.
//
// **The one thing this file decides that the criteria do not is *when* the pack is
// reloaded**, and both J11 and J14 depend on it. `useEditor` marks itself dirty on every
// write and calls `onPackChanged` **once, on close** — so the prefix tree is rebuilt
// atomically with the word she added in it (J14) and the board she came from is rebuilt
// exactly once, with its strip carried across (J11, `src/engine/session.mjs`
// `restoreBuild`).

import { useCallback, useState } from 'react';

import { useEditor } from '../../../state/useEditor';
import { SUPPORTS_LOCAL_PACKS } from '../../../content/store';
import { viRimeProposal } from '../../../editor/model.mjs';
import { WordListScreen } from './WordListScreen';
import { AddWordFlow } from './AddWordFlow';
import { CheerScreen } from './CheerScreen';

export function Editor({
  strings, pack, packId, sourceFor, audio, settings, onSetting,
  onBack, onPackChanged, startAt = 'list',
}) {
  const editor = useEditor({ pack, packId, onPackChanged });
  // `'list'` or `'cheer'`. **Revision 6 retired the third value.** The parent menu used to
  // carry an *Add a word* row that opened the flow directly, and folding it into row 1
  // (I8, I9) removed the only caller: the `+` on the word list is the way in now, and it
  // is one tap further, in the place she will look for it.
  const [screen, setScreen] = useState(startAt);
  const [draft, setDraft] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const close = useCallback(() => { editor.close(); onBack(); }, [editor, onBack]);

  const save = useCallback((current, options) => {
    editor.saveDraft(current, options);
    if (options && options.final) {
      // **J15 — offered exactly once, and never offered again automatically.** The flag
      // is a setting rather than component state, because *never again* has to outlive
      // the session she declined it in.
      if (!settings.cheerOffered) { onSetting({ cheerOffered: true }); setScreen('cheer'); } else setScreen('list');
      setDraft(null);
    }
  }, [editor, settings.cheerOffered, onSetting]);

  if (screen === 'cheer') {
    return (
      <CheerScreen
        strings={strings}
        cheer={editor.cheer}
        audio={audio}
        sourceFor={sourceFor}
        onSave={(clip) => { editor.setCheer(clip); setScreen('list'); }}
        onBack={() => setScreen('list')}
      />
    );
  }

  if (screen === 'add' && draft) {
    return (
      <AddWordFlow
        strings={strings}
        pack={pack}
        packId={packId}
        draft={draft}
        setDraft={setDraft}
        settings={settings}
        audio={audio}
        sourceFor={sourceFor}
        onSave={save}
        onAttachImage={editor.attachImage}
        onRemoveImage={editor.removeImage}
        onRecorded={editor.attachRecording}
        onUseShipped={editor.useShippedClip}
        onAddRime={(proposal) => {
          // K5 — her six forms are stored **composed**, exactly as she approved them.
          // `viRimeProposal` is re-read here so a screen that was open while she edited
          // cannot write a stale legality set.
          const checked = viRimeProposal(proposal.id);
          editor.addRime({ ...checked, toned: proposal.toned });
        }}
        onCancel={() => { setDraft(null); setScreen('list'); }}
        // §13.4 — Delete at the foot of the edit screen. It goes to the list first,
        // because **L1's confirmation is the row's photograph** and the list is where
        // the row is; confirming from inside the flow would ask her to recognise the
        // word she is deleting from its spelling alone.
        onDelete={draft.isNew ? null : () => { setConfirmDelete(draft.id); setScreen('list'); }}
      />
    );
  }

  return (
    <WordListScreen
      strings={strings}
      list={editor.list}
      sourceFor={sourceFor}
      canWrite={SUPPORTS_LOCAL_PACKS}
      toast={editor.toast}
      onUndo={editor.undoRemove}
      onBack={close}
      onAdd={() => { setDraft(editor.newDraft()); setScreen('add'); }}
      onOpen={(id) => {
        const opened = editor.openDraft(id);
        if (opened) { setDraft(opened); setScreen('add'); }
      }}
      onRestore={editor.restore}
      confirmDelete={confirmDelete}
      onConfirmDelete={(id) => {
        editor.remove(id);
        setConfirmDelete(null);
        setDraft(null);
        setScreen('list');
      }}
      onCancelDelete={() => setConfirmDelete(null)}
    />
  );
}
