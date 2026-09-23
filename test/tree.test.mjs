// The prefix tree and the constant table — `gameplay.md` §3.2–§3.4, §3.7,
// `acceptance-criteria.md` B2–B7, B14, C1–C22, D1a–D13, E11, L7, V4–V8.
//
// This is the whole mechanic stated as properties. If any of these is false the app is
// revision 1 again: a child can build garbage, or reach a state he cannot leave — or,
// since revision 3, the board is not the board he was promised.

import test from 'node:test';
import assert from 'node:assert/strict';

import { viPack, enPack } from './helpers/load.mjs';
import {
  createGame, buildTree, buildInventory, nodeAt, isLive, wordIdAt, continues,
  createSession, reduce, tableView, pageView, langFor,
} from '../src/engine/index.mjs';
import { viCheckSpellingRule } from '../src/engine/rules.mjs';
import { start, live, tap } from './helpers/play.mjs';
import { phonePages } from './helpers/fixtures.mjs';

const PACKS = [['Vietnamese', viPack], ['English', enPack]];

const inventoryOf = (pack) => buildInventory(langFor(pack.language).runsFor(pack));

test('B2 / C21 — the table is EVERY character of every run, in order, and nothing else', () => {
  for (const [label, load] of PACKS) {
    const pack = load();
    const runs = langFor(pack.language).runsFor(pack);
    const { game, state } = start(pack);
    const ids = tableView(game, state).cells.map((c) => c.id);
    assert.deepEqual(ids, runs.flatMap((r) => r.ids),
      `${label}: the board is not the whole inventory in run order`);
    // Nothing is truncated: the revision-3 `zonesFor` split is gone (U21).
    assert.equal(ids.length, runs.reduce((n, r) => n + r.ids.length, 0));
  }
});

test('C21 — Vietnamese is 26 onsets + 35 rimes + 6 tones, and paging truncates none of it', () => {
  const pack = viPack();
  const runs = langFor('vi').runsFor(pack).map((r) => r.ids.length);
  assert.deepEqual(runs, [26, 35, 6], 'the run lengths the layout law is swept against');
  for (const pages of [null, phonePages('vi'), [9, 9, 8, 12, 12, 11, 6]]) {
    const game = createGame(pack, { pages });
    assert.equal(game.inventory.symbols.length, 67, `pages=${pages}`);
    assert.deepEqual(game.inventory.pages.flat().map((s) => s.id), game.inventory.ids);
  }
});

test('D1a / D1b — all 26 letters are on the English board, `q` included and always flat', () => {
  const pack = enPack();
  const { game, state } = start(pack);
  const letters = langFor('en').runsFor(pack)[0].ids;
  assert.deepEqual(letters, 'abcdefghijklmnopqrstuvwxyz'.split(''),
    'the first run must be the alphabet, a–z, in order');
  const q = tableView(game, state).cells.find((c) => c.id === 'q');
  assert.ok(q, '`q` is not on the board');
  assert.equal(q.live, false);
  assert.ok(q.audio.short, 'D1b — a permanently flat tile must still speak when pressed');
  // And it is flat at **every** reachable prefix, not just the first.
  const walk = (s, depth) => {
    if (s.status === 'announcing' || depth > 4) return;
    assert.equal(tableView(game, s).cells.find((c) => c.id === 'q').live, false,
      `q became live at ${s.prefix.join('+')}`);
    for (const symbol of live(game, s)) walk(tap(game, s, symbol), depth + 1);
  };
  walk(state, 0);
});

test('B2f — there is no `∅` tile, no socket and no placeholder anywhere in the table', () => {
  for (const [label, load] of PACKS) {
    const { game, state } = start(load());
    for (const cell of tableView(game, state).cells) {
      assert.notEqual(cell.id, '∅', `${label}: the socket is back`);
      assert.notEqual(cell.kind, 'socket', `${label}: a socket cell survives`);
      assert.ok(cell.glyph, `${label}: ${cell.id} has no glyph`);
    }
  }
});

test('B2a / B7 / V7 — page and slot are a pure function of the runs and the plan', () => {
  for (const [label, load] of PACKS) {
    const pack = load();
    for (const pages of [null, phonePages(pack.language)]) {
      const a = createGame(pack, { pages });
      const b = createGame(load(), { pages });
      const shape = (g) => g.inventory.symbols.map((s) => `${s.id}@${s.page}:${s.slot}`).join(' ');
      assert.equal(shape(a), shape(b), `${label}: two builds disagree about where a character lives`);
    }
  }
});

test('V8 / C22 — editing the word list moves no character', () => {
  const full = viPack();
  const pages = phonePages('vi');
  const before = createGame(full, { pages }).inventory.symbols.map((s) => `${s.id}@${s.page}:${s.slot}`);
  // Her deleting half the vocabulary, which is the most violent edit there is.
  const half = { ...full, words: full.words.filter((_, i) => i % 2 === 0) };
  const after = createGame(half, { pages }).inventory.symbols.map((s) => `${s.id}@${s.page}:${s.slot}`);
  assert.deepEqual(after, before, 'the board reshuffled when the word list changed');
});

test('V4 / V6 — runs never share a page, and every character is on exactly one', () => {
  for (const [label, load] of PACKS) {
    const pack = load();
    const lang = langFor(pack.language);
    const game = createGame(pack, { pages: phonePages(pack.language) });
    for (const page of game.inventory.pages) {
      const runs = new Set(page.map((s) => s.runIndex));
      assert.equal(runs.size, 1, `${label}: a page mixes runs ${[...runs].join(',')}`);
    }
    const seen = game.inventory.pages.flat().map((s) => s.id);
    assert.equal(new Set(seen).size, seen.length, `${label}: a character is on two pages`);
    assert.equal(seen.length, lang.runsFor(pack).reduce((n, r) => n + r.ids.length, 0));
  }
});

test('B3 — a symbol is live iff some eligible word continues the prefix, checked exhaustively', () => {
  for (const [label, load] of PACKS) {
    const pack = load();
    const lang = langFor(pack.language);
    const tree = buildTree(pack, inventoryOf(pack));
    const paths = tree.eligible.map((w) => lang.pathFor(w));

    // Walk every reachable prefix, breadth-first, and check the live set at each against
    // the word list directly rather than against the tree that produced it.
    const seen = new Set();
    const queue = [[]];
    let checked = 0;
    while (queue.length > 0) {
      const prefix = queue.shift();
      const key = prefix.join('\u0000');
      if (seen.has(key)) continue;
      seen.add(key);
      const symbols = lang.symbolsFor(pack, tree.inventory, prefix).map((s) => s.id);
      for (const symbol of symbols) {
        const wanted = [...prefix, symbol];
        const reachable = paths.some((p) => p.length >= wanted.length
          && wanted.every((s, i) => p[i] === s));
        assert.equal(isLive(tree, prefix, symbol), reachable,
          `${label}: ${wanted.join('+')} live=${isLive(tree, prefix, symbol)} reachable=${reachable}`);
        checked += 1;
        if (reachable) queue.push(wanted);
      }
    }
    assert.ok(checked > 200, `${label}: only ${checked} (prefix, symbol) pairs`);
  }
});

test('B5 / E11 — tapping only live symbols always ends in a word, from every prefix', () => {
  for (const [label, load] of PACKS) {
    const pack = load();
    const { game, state } = start(pack);
    const walk = (s, depth) => {
      const options = live(game, s);
      if (s.status === 'announcing') return 1;
      assert.ok(options.length > 0, `${label}: stuck at ${s.prefix.join('+')}`);
      assert.ok(depth < 8, `${label}: runaway at ${s.prefix.join('+')}`);
      let found = 0;
      for (const symbol of options) found += walk(tap(game, s, symbol), depth + 1);
      return found;
    };
    const words = walk(state, 0);
    assert.equal(words, game.tree.eligible.length,
      `${label}: every live path should end at exactly one eligible word`);
  }
});

test('B6 — either the prefix is a word, or something is live. There is no third case', () => {
  const tree = buildTree(viPack(), inventoryOf(viPack()));
  const visit = (node, prefix) => {
    assert.ok(node.wordId !== null || node.live.size > 0, `stuck at ${prefix.join('+')}`);
    for (const [symbol, child] of node.children) visit(child, [...prefix, symbol]);
  };
  visit(tree.root, []);
});

test('B14 / L7 — a withheld word leaves its character on the board, in its cell, flat', () => {
  const pack = viPack();
  const inventory = inventoryOf(pack);
  const full = buildTree(pack, inventory);
  const target = full.eligible[0];
  // The same pack with that word's media gone. `resolvePack` withholds it; the tree must
  // then hold no path to it, and the symbol it used stays on the table, simply flat.
  const gone = new Set([target.audio.word.src]);
  const trimmed = viPack({ hasMedia: (ref) => !gone.has(ref) });
  const tree = buildTree(trimmed, inventoryOf(trimmed));
  assert.ok(full.eligible.some((w) => w.id === target.id));
  assert.ok(!tree.eligible.some((w) => w.id === target.id), `${target.id} is still eligible`);
  assert.equal(wordIdAt(tree, langFor('vi').pathFor(target)), null);
  // **The board does not reshuffle in response to the word list** (`ui.md` §8.1).
  assert.deepEqual(tree.inventory.ids, full.inventory.ids);
});

test('D12 — no final-only tile is live on an empty strip, and it is B4 doing it for free', () => {
  const { game, state } = start(enPack());
  const table = tableView(game, state);
  for (const id of ['ck', 'll', 'ss', 'ff', 'zz', 'ng', 'x', 'q']) {
    const cell = table.cells.find((c) => c.id === id);
    assert.ok(cell, `${id} is not on the board — every character of inventoryOrder is`);
    assert.equal(cell.live, false, `${id} begins a word`);
  }
});

test('D11 — `c` and `k` are never both live, at any reachable prefix', () => {
  const { game, state } = start(enPack());
  const walk = (s, depth) => {
    if (s.status === 'announcing' || depth > 6) return;
    const options = live(game, s);
    assert.ok(!(options.includes('c') && options.includes('k')),
      `both c and k are live at ${s.prefix.join('+')}`);
    for (const symbol of options) walk(tap(game, s, symbol), depth + 1);
  };
  walk(state, 0);
});

test('D13 — after `c` `a`, exactly the letters that complete a pack word are live', () => {
  const pack = enPack();
  const { game, state } = start(pack);
  const after = tap(game, tap(game, state, 'c'), 'a');
  const expected = pack.words
    .filter((w) => w.tiles[0] === 'c' && w.tiles[1] === 'a' && w.tiles.length > 2)
    .map((w) => w.tiles[2]);
  assert.deepEqual(live(game, after).sort(), [...new Set(expected)].sort());
  assert.ok(live(game, after).length > 0);
});

test('B2g / C19 — a zero-onset word is TWO taps: the rime, then the tone', () => {
  const pack = viPack();
  const { game, state } = start(pack);
  // `áo` = ao + sắc. On an empty strip the rime must be live, with no placeholder first.
  assert.ok(live(game, state).includes('ao'), '`ao` does not begin a word on an empty strip');
  const after = tap(game, state, 'ao');
  assert.deepEqual(after.prefix, ['ao']);
  const done = tap(game, after, 'sac');
  assert.equal(done.status, 'announcing');
  assert.equal(done.pending.text, 'áo');
  assert.equal(done.prefix.length, 2, 'it took more than two taps');
});

test('C7 — ALL SIX tone cells are always present; the illegal four are flat', () => {
  const pack = viPack();
  const { game, state } = start(pack);
  // `sách` = s + ach + sắc. `ach` ends in `ch`, so only sắc and nặng are legal — and the
  // other four are still on the board, lying down. Legality and completability are both
  // flatness now (`ui.md` §7.2, the restated C7).
  const after = tap(game, tap(game, state, 's'), 'ach');
  const tones = tableView(game, after).cells.filter((c) => c.role === 'tone');
  assert.deepEqual(tones.map((c) => c.id), pack.inventoryOrder.tone);
  assert.equal(tones.length, 6);
  assert.deepEqual(tones.filter((c) => c.live).map((c) => c.id), ['sac']);
  // The illegal cells fall back to the bare mark, because the orthography has no form.
  const ngang = tones.find((c) => c.id === 'ngang');
  assert.equal(ngang.carrier, 'mark');
  assert.ok(ngang.glyph.startsWith('◌'), `ngang shows "${ngang.glyph}"`);
});

test('B2d — with no rime placed, every tone cell is a bare mark and every one is disabled', () => {
  const pack = viPack();
  const { game, state } = start(pack);
  for (const prefix of [[], ['m']]) {
    let s = state;
    for (const symbol of prefix) s = tap(game, s, symbol);
    const tones = tableView(game, s).cells.filter((c) => c.role === 'tone');
    assert.equal(tones.length, 6);
    for (const cell of tones) {
      assert.equal(cell.live, false, `${cell.id} is live with no rime placed`);
      assert.equal(cell.carrier, 'mark');
      assert.ok(cell.glyph.startsWith('◌'), `${cell.id} shows "${cell.glyph}"`);
    }
    assert.equal(tones.find((c) => c.id === 'ngang').glyph, '◌', 'ngang is the empty circle');
  }
});

test('C6 / C10 — a tone cell carries the chosen rime, marked, and reverts on undo', () => {
  const pack = viPack();
  const { game, state } = start(pack);
  const after = tap(game, tap(game, state, 'm'), 'eo');
  const tones = tableView(game, after).cells.filter((c) => c.role === 'tone');
  for (const cell of tones) {
    assert.equal(cell.glyph, pack.tileById.rime.eo.toned[cell.id], `${cell.id}`);
    assert.equal(cell.carrier, 'rime');
    assert.ok(cell.glyph.includes('o'), `${cell.id} renders "${cell.glyph}"`);
  }
  assert.equal(tones.find((c) => c.id === 'huyen').glyph, 'èo');
  // C10 — returning the rime reverts the carriers to bare marks.
  const undone = reduce(game, after, { type: 'tapStripCell', index: 1 });
  const back = tableView(game, undone).cells.filter((c) => c.role === 'tone');
  assert.ok(back.every((c) => c.carrier === 'mark'), 'the carriers did not revert');
});

test('B2c — no tap changes any cell but the six tone carriers', () => {
  const pack = viPack();
  const { game, state } = start(pack);
  const shape = (s) => tableView(game, s).cells
    .map((c) => `${c.id}@${c.page}:${c.slot}:${c.role}${c.role === 'tone' ? '' : `:${c.glyph}`}`).join(' ');
  const base = shape(state);
  let s = state;
  for (const symbol of ['m', 'eo']) {
    s = tap(game, s, symbol);
    assert.equal(shape(s), base, `the board changed after tapping ${symbol}`);
  }
});

test('C9 — exactly one live tone, and the word is not auto-committed', () => {
  const pack = viPack();
  const { game, state } = start(pack);
  const after = tap(game, tap(game, state, 'm'), 'eo');
  assert.deepEqual(live(game, after), ['huyen']);
  assert.equal(after.status, 'building', 'the word committed itself without his tap');
  const done = tap(game, after, 'huyen');
  assert.equal(done.status, 'announcing');
});

test('F17 — in Vietnamese no word is a proper prefix of another, so §5.5 cannot arise', () => {
  const tree = buildTree(viPack(), inventoryOf(viPack()));
  const visit = (node, prefix) => {
    if (node.wordId !== null) {
      assert.equal(node.children.size, 0, `${prefix.join('+')} is a word and continues`);
      assert.equal(continues(tree, prefix), false);
    }
    for (const [symbol, child] of node.children) visit(child, [...prefix, symbol]);
  };
  visit(tree.root, []);
});

test('the tree walk is O(depth): nodeAt never scans the vocabulary', () => {
  const tree = buildTree(viPack(), inventoryOf(viPack()));
  // Structural rather than timed: a node's live set is a Set and its children a Map, so
  // both answer in constant time whatever the pack grows to. A timing assertion here
  // would measure this machine's load, not the property (`CLAUDE.md`: a number that
  // correlates with a property is not that property).
  const node = nodeAt(tree, ['m']);
  assert.ok(node.live instanceof Set);
  assert.ok(node.children instanceof Map);
  assert.equal(nodeAt(tree, ['m', 'zzz']), null);
});

test('V1 / V2 — createGame builds ONE tree, and the plan decides only the pages', () => {
  const pack = viPack();
  const tablet = createGame(pack, { pages: null });
  assert.equal(tablet.inventory.paged, false, 'a tablet must not page');
  assert.equal(tablet.pageCount, 1);
  assert.equal(tablet.cells, 67, 'one page holds the whole inventory');

  const phone = createGame(pack, { pages: phonePages('vi') });
  assert.equal(phone.inventory.paged, true);
  assert.equal(phone.pageCount, 4);
  assert.equal(phone.cells, 26, 'V9 — one grid, sized from the largest page');
  assert.ok(!('trees' in phone), 'there are no per-stage trees any more');
});

test('a page plan that does not cover the inventory degrades to one page, never drops a character', () => {
  // Content and the device are both hostile input. A plan that does not add up would
  // silently take characters off the board, which is the one failure `ui.md` §8.1 exists
  // to prevent, so it is refused in favour of a worse board rather than a broken one.
  const pack = viPack();
  for (const bad of [[26, 18], [0, 67], [26, 18, 17, 6, 1], ['x'], []]) {
    const game = createGame(pack, { pages: bad });
    assert.equal(game.inventory.symbols.length, 67, `pages=${JSON.stringify(bad)}`);
    assert.equal(game.inventory.pages.flat().length, 67);
  }
});

test('V16–V19 — the rail stands a button up for every page that holds something live', () => {
  const pack = viPack();
  const game = createGame(pack, { pages: phonePages('vi') });
  const state = createSession(game, { seed: 'rail' });
  const rail = pageView(game, state);
  assert.equal(rail.paged, true);
  assert.equal(rail.buttons.length, 4, 'one button per page (V2)');
  // V19 — the glyph is that page's FIRST character.
  assert.deepEqual(rail.buttons.map((b) => b.symbolId),
    game.inventory.pages.map((p) => p[0].id));
  assert.equal(rail.buttons[0].current, true);
  // V22 — with an empty strip, the onset page AND the page holding the zero-onset rimes
  // stand, because `ao` and `ong` begin words. That rail button is the only way `áo` is
  // ever discoverable on a phone.
  const standing = rail.buttons.filter((b) => b.live).map((b) => b.page);
  const aoPage = game.inventory.pageOf('ao');
  assert.ok(standing.includes(0), 'the onset page is flat on an empty strip');
  assert.ok(standing.includes(aoPage), `page ${aoPage} holds "ao" and is flat`);
  // The tone page can never be live before a rime.
  assert.equal(rail.buttons[rail.buttons.length - 1].live, false);
});

test('L6 — a pack with nothing playable opens on the empty card, never a dead table', () => {
  const pack = viPack({ words: [] });
  const game = createGame(pack);
  const state = createSession(game, { seed: 'x' });
  assert.equal(state.phase, 'empty');
  // And no action can move it off that phase into a board with nothing live.
  const after = reduce(game, state, { type: 'tapSymbol', symbolId: 'm' });
  assert.equal(after.phase, 'empty');
});

/* ------------------------------------------------- what the flat state is for */

test('the disabled state is reachable on the way to every word', () => {
  // **The question this answers.** The live set changing under his finger is the whole
  // lesson (`gameplay.md` §4.2: *the table's response is the teaching*), and a board on
  // which everything is always live would teach nothing. On a 67-cell constant table this
  // is structurally certain — 1–6 of 67 stand up — but it is asserted rather than assumed,
  // at the positions where the choice is actually real, so that a pack twenty times denser
  // than this one would say so instead of nobody noticing.
  for (const [label, load] of PACKS) {
    const pack = load();
    const { game, state } = start(pack);
    const lang = langFor(pack.language);
    let metAFlatTile = 0;
    for (const word of game.tree.eligible) {
      const path = lang.pathFor(word);
      if (path.length < 2) continue;
      let s = state;
      let met = false;
      for (const symbol of path) {
        const table = tableView(game, s);
        if (table.cells.some((c) => !c.live)) met = true;
        if (s.status !== 'building') break;
        s = tap(game, s, symbol);
      }
      assert.ok(met,
        `${label}: nothing was ever flat on the way to "${word.text}" — the live set never told him what could follow, which is the lesson`);
      metAFlatTile += 1;
    }
    assert.ok(metAFlatTile > 10, `${label}: only ${metAFlatTile} words were walked`);
  }
});

test('C17 replacement — no live path can spell an illegal onset + rime', () => {
  // `acceptance-criteria.md` C17 asked for `{c,k}`, `{g,gh}` and `{ng,ngh}` never to be
  // live together. Under discovery that contradicts B3 and would make `kem` and `ghế`
  // permanently unreachable, so it is withdrawn for position 1 (`docs/slices.md`).
  //
  // **This is what replaces it, and it is stronger.** `literacy-vi.md` §4.1 rule 3 says a
  // palette must never let him build an orthographically impossible spelling. Liveness
  // delivers that without a filter: after `k` only the rimes that make a real `k` word
  // stand up, and every real word already cleared the spelling rule at pack load. So the
  // child cannot reach an illegal pair — not because one was filtered out, but because
  // there is nothing behind it.
  const pack = viPack();
  const { game, state } = start(pack);
  let checked = 0;
  for (const onsetCell of tableView(game, state).cells) {
    if (!onsetCell.live || onsetCell.role !== 'onset') continue;
    for (const rimeCell of tableView(game, tap(game, state, onsetCell.id)).cells) {
      if (!rimeCell.live || rimeCell.role !== 'rime') continue;
      assert.equal(viCheckSpellingRule(onsetCell.id, rimeCell.id), null,
        `"${onsetCell.id}" + "${rimeCell.id}" is live and is not a legal Vietnamese spelling`);
      checked += 1;
    }
  }
  assert.ok(checked > 20, `only ${checked} live (onset, rime) pairs were checked`);

  // And the pair C17 was written about is reachable in both spellings, which is the point
  // of withdrawing it: `c` and `k` are both live, and each leads to a real word.
  const live1 = tableView(game, state).cells.filter((c) => c.live).map((c) => c.id);
  if (live1.includes('c') && live1.includes('k')) {
    for (const onset of ['c', 'k']) {
      const after = tap(game, state, onset);
      assert.ok(live(game, after).length > 0, `"${onset}" is live and leads nowhere`);
    }
  }
});
