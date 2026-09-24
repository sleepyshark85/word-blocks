// Which board a language gets — **one lookup, and it throws rather than defaulting.**
//
// `acceptance-criteria.md` R4: no code path reads the other language's pack, and there is
// no fallback, default or coalescing operator onto it. Two places need to make this
// choice — the app shell and the editor's preview (J9) — and two ternaries would be two
// chances to get it wrong, so it is one table with the same shape `content/packIds.js`
// and `engine/lang/index.mjs` use: an unknown language is a crash in development, never a
// leak in front of the child.

import { BoardVi } from './BoardVi';
import { BoardEn } from './BoardEn';

const BOARDS = { vi: BoardVi, en: BoardEn };

export function boardFor(language) {
  const board = BOARDS[language];
  if (!board) throw new Error(`no board for language ${JSON.stringify(language)}`);
  return board;
}
