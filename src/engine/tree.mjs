// The prefix tree. `gameplay.md` §0.3, §3.3; `ui.md` §13.7 E13.
//
// The whole mechanic is one sentence: **the live set at any point is the set of next
// symbols with at least one completion.** Everything the child can and cannot do on the
// board falls out of that, so this file is where "garbage is structurally impossible"
// actually lives.
//
// Three properties it exists to hold:
//
//   1. **O(1) at tap time.** `ui.md` §11.1 budgets 60 ms from touch-down to sound, and
//      `E13` names the tree as the thing that must not spend it. So every node carries
//      its live set as a `Set` built once, and a tap is `node.children.get(symbol)` —
//      one map lookup, whatever the vocabulary grows to. Nothing is searched at a tap.
//   2. **Built atomically.** A tree is built whole and then swapped in (`createGame`
//      builds every table size the stage ladder can ask for, up front). A half-built
//      tree is never reachable, which is what `acceptance-criteria.md` J14 needs when
//      his mother saves a word while he is mid-build.
//   3. **Pure.** No RNG, no clock. The same pack and the same `cells` give the same tree,
//      byte for byte, which is half of B12's replay guarantee.
//
// **Eligibility** (`gameplay.md` §6.1): a word is eligible iff every one of its symbols
// is on the table at this table size. The tree is built over the eligible set, so the
// live/disabled computation and the table can never disagree (B2, B14, L7).

import { langFor } from './lang/index.mjs';
import { CELLS_BY_STAGE } from './stages.mjs';

function makeNode(depth) {
  return {
    depth,
    /** @type {Map<string, object>} */ children: new Map(),
    /** The word completed by exactly this prefix, or null. */ wordId: null,
    /** Every word id in this subtree, in pack order. The idle ladder reads it (G11). */
    words: [],
    /** The next symbols with at least one completion — the live set, precomputed (B3). */
    live: new Set(),
  };
}

/**
 * Build one tree.
 *
 * @param {object} pack     a resolved pack
 * @param {number} cells    how many cells the table has at this stage (8..24)
 * @returns {{cells:number, root:object, eligible:object[], withheld:object[], inventory:object}}
 */
export function buildTree(pack, cells) {
  const lang = langFor(pack.language);
  const inventory = lang.inventoryFor(pack, cells);

  const root = makeNode(0);
  const eligible = [];
  const withheld = [];

  for (const word of pack.words) {
    const path = lang.pathFor(word);
    if (!lang.pathIsOnTable(inventory, path, pack)) {
      withheld.push({ id: word.id, text: word.text, reason: 'notOnTheBoard' });
      continue;
    }
    eligible.push(word);
    let node = root;
    node.words.push(word.id);
    for (const symbol of path) {
      let next = node.children.get(symbol);
      if (!next) {
        next = makeNode(node.depth + 1);
        node.children.set(symbol, next);
      }
      node = next;
      node.words.push(word.id);
    }
    // Two words with the same path cannot both be "the word he built". `pack.mjs` already
    // withholds the second as `duplicateParts`, so this is defence rather than policy.
    if (node.wordId === null) node.wordId = word.id;
  }

  // The live sets. One pass, after the tree is whole, so a node's live set is never read
  // while it is still growing.
  const fill = (node) => {
    for (const [symbol, child] of node.children) {
      node.live.add(symbol);
      fill(child);
    }
  };
  fill(root);

  return { cells, root, eligible, withheld, inventory };
}

/**
 * Walk a prefix. Bounded by the longest word in the language — three symbols in
 * Vietnamese, four in English — so it is O(1) in the vocabulary, which is what E13 asks
 * for. Returns null if the prefix is not on the tree, which a live-only tap cannot
 * produce and an undo cannot reach.
 */
export function nodeAt(tree, prefix) {
  let node = tree.root;
  for (const symbol of prefix) {
    node = node.children.get(symbol);
    if (!node) return null;
  }
  return node;
}

/** `acceptance-criteria.md` B3 — is this symbol live after this prefix? */
export function isLive(tree, prefix, symbol) {
  const node = nodeAt(tree, prefix);
  return node ? node.live.has(symbol) : false;
}

/** The word this exact prefix spells, or null. */
export function wordIdAt(tree, prefix) {
  const node = nodeAt(tree, prefix);
  return node ? node.wordId : null;
}

/**
 * `gameplay.md` §5.5 — is this prefix a word that some longer word continues? In
 * Vietnamese it never is, because a word is exactly three symbols (`acceptance-criteria.md`
 * F17); the rule exists because his mother will add `he`, `be` and `at` in English.
 */
export function continues(tree, prefix) {
  const node = nodeAt(tree, prefix);
  return Boolean(node && node.children.size > 0);
}

/**
 * Every table size the stage ladder can produce on this viewport, smallest first.
 * Deduplicated, because a 20-cell viewport serves stages 4 and 5 with the same table.
 */
export function tableSizesFor(maxCells) {
  const out = [];
  for (const n of CELLS_BY_STAGE) {
    const c = Math.min(n, maxCells);
    if (c > 0 && !out.includes(c)) out.push(c);
  }
  return out;
}

/**
 * The game: one pack, and the trees for every table size it can be played at.
 *
 * Built eagerly, all of them, because there are at most five and the whole point is that
 * a stage advance must not cost a frame. `createGame` is the atomic unit E13 names: a new
 * pack, or a word saved, means a new game object built whole and swapped in — never a
 * tree mutated under a child's finger.
 */
export function createGame(pack, { maxCells = 24 } = {}) {
  const trees = new Map();
  for (const cells of tableSizesFor(maxCells)) trees.set(cells, buildTree(pack, cells));
  return {
    pack,
    language: pack.language,
    maxCells,
    trees,
    /** The tree for a table size, falling back to the largest one built at or below it. */
    treeFor(cells) {
      if (trees.has(cells)) return trees.get(cells);
      let best = null;
      for (const [n, t] of trees) if (n <= cells && (best === null || n > best)) best = n;
      return best === null ? null : trees.get(best);
    },
  };
}
