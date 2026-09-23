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

test('B2j / C21 — Vietnamese is 29 letters + 6 tones, in the owner\'s order, truncated nowhere', () => {
  const pack = viPack();
  const runs = langFor('vi').runsFor(pack);
  assert.deepEqual(runs.map((r) => r.ids.length), [29, 6],
    'the run lengths the layout law is swept against');
  // **B2j — the alphabet, exactly as he typed it**, and the tone run as the set phrase.
  // Neither is sorted by frequency, by word count, or by anything a build script produced
  // (`literacy-vi.md` §0.13 — the defect he actually reported).
  assert.deepEqual(runs[0].ids, [
    'a', 'ă', 'â', 'b', 'c', 'd', 'đ', 'e', 'ê', 'g', 'h', 'i', 'k', 'l', 'm',
    'n', 'o', 'ô', 'ơ', 'p', 'q', 'r', 's', 't', 'u', 'ư', 'v', 'x', 'y',
  ]);
  assert.deepEqual(runs[1].ids, ['ngang', 'huyen', 'sac', 'hoi', 'nga', 'nang']);
  // **B2k — and the retired runs are gone from the board**: nothing on it is an onset or
  // a rime, though both still exist in `tiles` as the model (`content-pipeline.md` §3.7).
  assert.deepEqual(Object.keys(pack.inventoryOrder).sort(), ['letter', 'tone']);
  assert.ok(pack.tiles.onset.length === 26 && pack.tiles.rime.length === 35,
    'the model lost its vocabulary along with the cells');
  for (const pages of [null, phonePages('vi'), [15, 14, 6]]) {
    const game = createGame(pack, { pages });
    assert.equal(game.inventory.symbols.length, 35, `pages=${pages}`);
    assert.deepEqual(game.inventory.pages.flat().map((x) => x.id), game.inventory.ids);
  }
});

test('B2l / C15 / D5 / S5 — a cell\'s kind is a permanent property of its glyph', () => {
  for (const [label, load] of PACKS) {
    const pack = load();
    const { game, state } = start(pack);
    const kinds = new Map(tableView(game, state).cells.map((c) => [c.id, c.kind]));
    // Every kind is one of the three, and a tone is only ever Vietnamese (D6).
    for (const [id, kind] of kinds) {
      assert.ok(['consonant', 'vowel', 'tone'].includes(kind), `${label}: ${id} is "${kind}"`);
      if (pack.language === 'en') assert.notEqual(kind, 'tone', 'English rendered a tone');
    }
    // **And it never changes, whatever he taps** — including at the five branching
    // onsets, where a consonant and a vowel are live at once meaning opposite things
    // (B2m, `literacy-vi.md` §0.6).
    const walk = (st, depth) => {
      if (st.status === 'announcing' || depth > 3) return;
      for (const cell of tableView(game, st).cells) {
        assert.equal(cell.kind, kinds.get(cell.id), `${label}: ${cell.id} changed kind`);
      }
      for (const symbol of live(game, st)) walk(tap(game, st, symbol), depth + 1);
    };
    walk(state, 0);
  }
});

test('B2m — after `c`, a consonant and a vowel stand at the same time', () => {
  const pack = viPack();
  const { game, state } = start(pack);
  const after = tap(game, state, 'c');
  const standing = tableView(game, after).cells.filter((x) => x.live);
  const kinds = new Set(standing.map((x) => x.kind));
  assert.ok(kinds.has('consonant'), '`h` must stand: it makes the sound bigger');
  assert.ok(kinds.has('vowel'), 'a vowel must stand: it starts the next part of the word');
  assert.ok(standing.some((x) => x.id === 'h' && x.kind === 'consonant'));
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
      const symbols = tree.inventory.ids;
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

test('D12 / D1c / D1f — the live-at-position-1 set is 15 letters, and the flat 11 are named', () => {
  // **RESTATED in revision 5** (`literacy-en.md` §0.2): the board is the alphabet, so
  // there is no final-only *tile* to withhold. The position rules moved to liveness —
  // `ck` is dead at position 1 because no word starts `ck`, not because a tile was hidden.
  const { game, state } = start(enPack());
  const table = tableView(game, state);
  assert.deepEqual(table.cells.map((c) => c.id), 'abcdefghijklmnopqrstuvwxyz'.split(''));
  assert.deepEqual(table.cells.filter((c) => c.live).map((c) => c.id),
    'a b c d e f h l m n p r s v w'.split(' '));
  for (const id of 'g i j k o q t u x y z'.split(' ')) {
    const cell = table.cells.find((c) => c.id === id);
    assert.equal(cell.live, false, `${id} begins a word`);
    assert.ok(cell.audio.short, 'D1c — a permanently flat letter must still speak');
  }
  // D1f — after `c`, `k` is NOT live (no word starts `ck`) and the live set is `a r u`.
  const c = tap(game, state, 'c');
  assert.deepEqual(live(game, c), ['a', 'r', 'u']);
  // D1c — `j`, `q`, `y` and `z` appear in no `en-seed` word, so they are live nowhere.
  const walk = (st, depth) => {
    if (st.status === 'announcing' || depth > 4) return;
    for (const id of ['j', 'q', 'y', 'z']) {
      assert.equal(live(game, st).includes(id), false, `${id} became live at ${st.prefix.join('')}`);
    }
    for (const symbol of live(game, st)) walk(tap(game, st, symbol), depth + 1);
  };
  walk(state, 0);
});

test('C18a — every one of the 29 Vietnamese letters appears in some word', () => {
  // The contrast with D1c, and it is the literacy-designer's measured claim: the
  // Vietnamese board has **no permanently dead cell** where English has four
  // (`literacy-vi.md` §0.4). `p` is the one to watch: its only word, `phở`, is switched
  // off for want of a photograph, so it is measured over the catalogue rather than over
  // what is playable today.
  const pack = viPack();
  const used = new Set();
  for (const entry of pack.catalogue) {
    const word = pack.wordById[entry.id];
    if (word) for (const letter of word.letters) used.add(letter);
  }
  const missing = pack.inventoryOrder.letter.filter((l) => !used.has(l));
  assert.deepEqual(missing, ['p'],
    'the only letter with no playable word behind it should be `p` (phở has no picture yet)');
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

test('B2g / C19 / C4e — the empty-strip live set is letters, and `áo` is THREE taps', () => {
  const pack = viPack();
  const { game, state } = start(pack);
  // **B2g, restated**: the live set is the letters that begin a word. `áo` is started by
  // tapping the letter `a` — there is no rime tile to tap any more.
  const first = live(game, state);
  const expected = [...new Set(game.tree.eligible.map((w) => w.letters[0]))]
    .sort((a, b) => pack.inventoryOrder.letter.indexOf(a) - pack.inventoryOrder.letter.indexOf(b));
  assert.deepEqual(first, expected);
  assert.ok(first.includes('a'), '`a` does not begin a word on an empty strip');
  assert.ok(first.every((id) => !pack.tileById.tone[id]), 'a tone is live on an empty strip');

  const done = tap(game, tap(game, tap(game, state, 'a'), 'o'), 'sac');
  assert.equal(done.status, 'announcing');
  assert.equal(done.pending.text, 'áo');
  assert.deepEqual(done.prefix, ['a', 'o', 'sac'], 'C19 — three taps, no placeholder');

  // **C4e — every word in the pack is 3 to 6 taps**, and every intermediate prefix has
  // something live (`literacy-vi.md` §0.11).
  let sum = 0;
  for (const word of game.tree.eligible) {
    const path = [...word.letters, word.syllables[0].tone];
    assert.ok(path.length >= 3 && path.length <= 6, `"${word.text}" is ${path.length} taps`);
    sum += path.length;
    let st = state;
    for (const symbol of path) {
      assert.ok(live(game, st).includes(symbol), `"${word.text}": ${symbol} is not live`);
      st = tap(game, st, symbol);
    }
    assert.equal(st.status, 'announcing');
  }
  const mean = sum / game.tree.eligible.length;
  assert.ok(mean > 3.9 && mean < 4.3, `mean taps per word is ${mean.toFixed(2)}`);
});

test('C4f — the onset/rime boundary is STORED, and the letters alone cannot recover it', () => {
  // `literacy-vi.md` §0.5. The proof that this is not a distinction without a difference
  // is `gì`: onset `gi` + rime `i`, written with a single `i`. Its letters are `g` `i`
  // and no rule over them can say where the onset ends — so the engine reads the stored
  // triple, and a pack that says something different about the same letters is believed.
  const pack = viPack();
  for (const word of pack.words) {
    const n = word.onsetLetterCount;
    assert.equal(word.letters.slice(0, n).join(''), word.syllables[0].onset ?? '',
      `${word.id}: the stored letters do not spell the stored onset`);
    const onsetSpan = word.spans.find((sp) => sp.group === 'onset');
    assert.equal(onsetSpan ? onsetSpan.end : 0, n, `${word.id}: the span disagrees with the count`);
  }
  // Every reachable letter prefix agrees about the boundary — zero disagreements, which
  // is what makes a single stored parse enough to draw the strip.
  const { game, state } = start(pack);
  const walk = (st, depth) => {
    if (st.status === 'announcing' || depth > 6) return;
    const node = game.tree.root;
    const words = [];
    let cursor = node;
    for (const symbol of st.prefix) cursor = cursor.children.get(symbol);
    for (const id of cursor.words) words.push(pack.wordById[id]);
    const letters = st.prefix.filter((id) => !pack.tileById.tone[id]).length;
    const counts = new Set(words.map((w) => Math.min(w.onsetLetterCount, letters)));
    assert.ok(counts.size <= 1,
      `the completions of "${st.prefix.join('')}" disagree about the onset: ${[...counts].join(',')}`);
    for (const symbol of live(game, st)) walk(tap(game, st, symbol), depth + 1);
  };
  walk(state, 0);
});

test('C7 — ALL SIX tone cells are always present; the illegal four are flat', () => {
  const pack = viPack();
  const { game, state } = start(pack);
  // `sách` = s + ach + sắc. `ach` ends in `ch`, so only sắc and nặng are legal — and the
  // other four are still on the board, lying down. Legality and completability are both
  // flatness now (`ui.md` §7.2, the restated C7).
  let after = state;
  for (const letter of ['s', 'a', 'c', 'h']) after = tap(game, after, letter);
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

test('C5 / C6 / C10 — the carrier swaps on the letter that COMPLETES the rime', () => {
  const pack = viPack();
  const { game, state } = start(pack);
  // **C5, restated**: `eo` is two taps now, and the carriers stay bare through the first
  // of them. Anything else would flicker two carriers at him inside one rime.
  const half = tap(game, tap(game, state, 'm'), 'e');
  const halfway = tableView(game, half).cells.filter((c) => c.role === 'tone');
  assert.ok(halfway.every((c) => c.carrier === 'mark'), 'the carrier swapped mid-rime');
  const after = tap(game, half, 'o');
  const tones = tableView(game, after).cells.filter((c) => c.role === 'tone');
  for (const cell of tones) {
    assert.equal(cell.glyph, pack.tileById.rime.eo.toned[cell.id], `${cell.id}`);
    assert.equal(cell.carrier, 'rime');
    assert.ok(cell.glyph.includes('o'), `${cell.id} renders "${cell.glyph}"`);
  }
  assert.equal(tones.find((c) => c.id === 'huyen').glyph, 'èo');
  // C10 — one tap on the strip returns the letter that completed the rime, and the
  // carriers revert to bare marks the instant it is no longer complete.
  const undone = reduce(game, after, { type: 'tapStrip' });
  const back = tableView(game, undone).cells.filter((c) => c.role === 'tone');
  assert.ok(back.every((c) => c.carrier === 'mark'), 'the carriers did not revert');

  // **`ăng` is three letters, and the carriers hold bare marks through two of them.**
  let tran = state;
  for (const letter of ['t', 'r', 'ă']) tran = tap(game, tran, letter);
  const stages = [];
  for (const letter of ['n', 'g']) {
    tran = tap(game, tran, letter);
    stages.push(tableView(game, tran).cells.filter((c) => c.role === 'tone')[1].carrier);
  }
  assert.deepEqual(stages, ['mark', 'rime'], 'the swap is on the `g`, not before it');
});

test('B2c — no tap changes any cell but the six tone carriers', () => {
  const pack = viPack();
  const { game, state } = start(pack);
  const shape = (s) => tableView(game, s).cells
    .map((c) => `${c.id}@${c.page}:${c.slot}:${c.role}${c.role === 'tone' ? '' : `:${c.glyph}`}`).join(' ');
  const base = shape(state);
  let s = state;
  for (const symbol of ['m', 'e', 'o']) {
    s = tap(game, s, symbol);
    assert.equal(shape(s), base, `the board changed after tapping ${symbol}`);
  }
});

test('C9 — exactly one live tone, and the word is not auto-committed', () => {
  const pack = viPack();
  const { game, state } = start(pack);
  const after = tap(game, tap(game, tap(game, state, 'm'), 'e'), 'o');
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
  assert.equal(tablet.cells, 35, 'one page holds the whole inventory');

  const phone = createGame(pack, { pages: phonePages('vi') });
  assert.equal(phone.inventory.paged, true);
  assert.equal(phone.pageCount, 3);
  assert.equal(phone.cells, 15, 'V9 — one grid, sized from the largest page');
  assert.ok(!('trees' in phone), 'there are no per-stage trees any more');
});

test('a page plan that does not cover the inventory degrades to one page, never drops a character', () => {
  // Content and the device are both hostile input. A plan that does not add up would
  // silently take characters off the board, which is the one failure `ui.md` §8.1 exists
  // to prevent, so it is refused in favour of a worse board rather than a broken one.
  const pack = viPack();
  for (const bad of [[15, 14], [0, 35], [15, 14, 6, 1], ['x'], []]) {
    const game = createGame(pack, { pages: bad });
    assert.equal(game.inventory.symbols.length, 35, `pages=${JSON.stringify(bad)}`);
    assert.equal(game.inventory.pages.flat().length, 35);
  }
});

test('V16–V19 — the rail stands a button up for every page that holds something live', () => {
  const pack = viPack();
  const game = createGame(pack, { pages: phonePages('vi') });
  const state = createSession(game, { seed: 'rail' });
  const rail = pageView(game, state);
  assert.equal(rail.paged, true);
  assert.equal(rail.buttons.length, 3, 'one button per page (V2)');
  // V19 — the glyph is that page's FIRST character.
  assert.deepEqual(rail.buttons.map((b) => b.symbolId),
    game.inventory.pages.map((p) => p[0].id));
  assert.equal(rail.buttons[0].current, true);
  // **V22, restated**: with an empty strip, pages 1 and 2 both stand — the 19 letters
  // that begin a word are spread across `a`…`m` and `n`…`y` — and page 3, the tones, is
  // flat, because no tone can be placed before a rime.
  const standing = rail.buttons.filter((b) => b.live).map((b) => b.page);
  assert.deepEqual(standing, [0, 1]);
  assert.equal(rail.buttons[2].live, false);
  // V19 — a button is drawn with its character's own kind, not its run's.
  assert.deepEqual(rail.buttons.map((b) => b.kind), ['vowel', 'consonant', 'tone']);
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
  //
  // **Revision 5 asks it of the letters**, because there are no onset and rime cells any
  // more: every word a live path can reach is an (onset, rime) pair, so the property is
  // that every *reachable* pair is legal.
  const pack = viPack();
  const { game, state } = start(pack);
  let checked = 0;
  const walk = (st, depth) => {
    if (depth > 7) return;
    if (st.status === 'announcing') {
      const word = pack.wordById[st.pending.wordId];
      const { onset, rime } = word.syllables[0];
      assert.equal(viCheckSpellingRule(onset, rime), null,
        `"${onset}" + "${rime}" is reachable and is not a legal Vietnamese spelling`);
      checked += 1;
      return;
    }
    for (const symbol of live(game, st)) walk(tap(game, st, symbol), depth + 1);
  };
  walk(state, 0);
  assert.ok(checked > 20, `only ${checked} reachable (onset, rime) pairs were checked`);

  // And the pair C17 was written about is reachable in both spellings, which is the point
  // of withdrawing it: `c` and `k` are both live, and each leads to a real word.
  const live1 = tableView(game, state).cells.filter((c) => c.live).map((c) => c.id);
  assert.ok(live1.includes('c') && live1.includes('k'), 'c and k should both begin a word');
  for (const onset of ['c', 'k']) {
    const after = tap(game, state, onset);
    assert.ok(live(game, after).length > 0, `"${onset}" is live and leads nowhere`);
  }
});
