// A markdown table reader, so that the seed pack is BUILT FROM the literacy-designer's
// documents rather than transcribed from them.
//
// Transcription is where a word list silently diverges from the document that owns it.
// Parsing means `docs/design/word-list.md` stays the single source of truth for what the
// words are, and re-running the builder is how a change to that document reaches the app.

import { readFileSync } from 'node:fs';

/** Split a markdown table row, honouring `\|` escapes (used inside decomposition cells). */
export function splitRow(line) {
  const cells = [];
  let cur = '';
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '\\' && line[i + 1] === '|') { cur += '|'; i += 1; continue; }
    if (c === '|') { cells.push(cur); cur = ''; continue; }
    cur += c;
  }
  cells.push(cur);
  // A markdown row starts and ends with a pipe, producing an empty first and last cell.
  if (cells.length >= 2 && cells[0].trim() === '') cells.shift();
  if (cells.length >= 1 && cells[cells.length - 1].trim() === '') cells.pop();
  return cells.map((c) => c.trim());
}

const isSeparator = (cells) => cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));

/**
 * Every table in a markdown file, each tagged with the `##`/`###` headings in force
 * where it appears. Returns `{ h2, h3, header, rows }`, rows being objects keyed by
 * header cell.
 */
export function readTables(file) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const tables = [];
  let h2 = '';
  let h3 = '';
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('## ')) { h2 = line.slice(3).trim(); h3 = ''; i += 1; continue; }
    if (line.startsWith('### ')) { h3 = line.slice(4).trim(); i += 1; continue; }
    if (line.trim().startsWith('|') && isSeparator(splitRow(lines[i + 1] ?? ''))) {
      const header = splitRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = splitRow(lines[i]);
        if (!isSeparator(cells)) {
          const row = {};
          header.forEach((h, k) => { row[h] = cells[k] ?? ''; });
          row._cells = cells;
          rows.push(row);
        }
        i += 1;
      }
      tables.push({ h2, h3, header, rows });
      continue;
    }
    i += 1;
  }
  return tables;
}

/** `` `m` `` -> `m`; strips bold/italics too. Returns '' for an empty or dash cell. */
export function plain(cell) {
  const s = (cell ?? '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '').trim();
  return s === '—' || s === '-' || s === '*(none)*' || s === '(none)' ? '' : s;
}

/** All backtick-quoted tokens in a cell, in order: "`ll` `ss`" -> ["ll","ss"]. */
export function ticked(cell) {
  return [...(cell ?? '').matchAll(/`([^`]+)`/g)].map((m) => m[1].trim()).filter(Boolean);
}
