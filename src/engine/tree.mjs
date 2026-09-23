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
//   2. **Built atomically.** A tree is built whole and then swapped in. A half-built tree
//      is never reachable, which is what `acceptance-criteria.md` J14 needs when his
//      mother saves a word while he is mid-build.
//   3. **Pure.** No RNG, no clock. The same pack gives the same tree, byte for byte,
//      which is half of B12's replay guarantee.
//
// **Revision 4: there is one tree, not five.** Revision 2 built a tree per stage, because
// the table grew; there are no stages (`gameplay.md` §3.6) and nothing is truncated
// (C21), so the inventory is the whole pack and the tree is built over it once.

import { langFor } from './lang/index.mjs';
import { buildInventory } from './table.mjs';

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
 * Build the tree over one inventory.
 *
 * @param {object} pack       a resolved pack
 * @param {object} inventory  from `table.buildInventory`
 */
export function buildTree(pack, inventory) {
  const lang = langFor(pack.language);
  const root = makeNode(0);
  const eligible = [];
  const withheld = [];

  for (const word of pack.words) {
    const path = lang.pathFor(word);
    if (!lang.pathIsOnTable(inventory, path, pack)) {
      // With paging nothing is truncated, so this is reachable only for a word whose
      // symbol the pack declares nowhere in `inventoryOrder` — the editor's K10 case.
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

  return { root, eligible, withheld, inventory };
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
 * Vietnamese it never is, because a word is exactly one syllable (`acceptance-criteria.md`
 * F17); the rule exists because his mother will add `he`, `be` and `at` in English.
 */
export function continues(tree, prefix) {
  const node = nodeAt(tree, prefix);
  return Boolean(node && node.children.size > 0);
}

/**
 * The game: one pack, its constant inventory, its page plan and its tree.
 *
 * `pages` is the page plan from `layout.planFor` — an array of page sizes, or null on a
 * viewport that shows the whole inventory at once (every tablet, V1). It is the **only**
 * thing the device contributes, and it can change nothing about which character sits in
 * which slot of which page beyond how many pages there are (V7).
 */
export function createGame(pack, { pages = null } = {}) {
  const lang = langFor(pack.language);
  const inventory = buildInventory(lang.runsFor(pack), pages);
  const tree = buildTree(pack, inventory);
  return {
    pack,
    language: pack.language,
    inventory,
    tree,
    /** V2 / V9 — one grid for every page, sized from the largest. */
    cells: inventory.cells,
    pageCount: inventory.pages.length,
  };
}
