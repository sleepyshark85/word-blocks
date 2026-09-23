// The constant character table, and the pages that are windows onto it.
// `gameplay.md` §3.2, §3.7, §0B.1; `ui.md` §7.1; `acceptance-criteria.md` B2a, V4–V8.
//
// One rule holds this file together, and it is the rule the owner asked for:
//
//   > **A character's page, and its row and column on that page, never change.** They are
//   > a pure function of the pack's `inventoryOrder` run lengths and the device — not of
//   > the word list, not of the strip, not of the session, not of what he tapped.
//
// So everything here is a pure function of `(runs, pageSizes)`. Nothing reads a word,
// a prefix, a live set or a random source. `buildInventory` is called once when the game
// is created and the result is carried, immutable, for the life of the pack.
//
// Paging is **conditional**: `pageSizes === null` means the whole inventory fits one
// screen — every tablet — and then there is one page and no rail at all (V1).

/**
 * The flat, fixed sequence of every character in the pack, in run order, each carrying
 * the page and slot it will occupy for ever.
 *
 * **`kind` is the character's permanent role** — consonant, vowel or tone (`ui.md` §5.5,
 * AC B2l, C15, D5, S5). Revision 4 took it from the run, because a run *was* a role;
 * revision 5's letter run holds both kinds interleaved (`a ă â b c d`), so the run asks
 * the character instead. It is a pure function of the id and never of his progress.
 *
 * @param {{role:string, kind?:string, kindOf?:(id:string)=>string, ids:string[]}[]} runs
 * @param {number[]|null} pageSizes  the plan from `layout.planFor`, or null for one page
 */
export function buildInventory(runs, pageSizes = null) {
  const symbols = [];
  for (let runIndex = 0; runIndex < runs.length; runIndex += 1) {
    const run = runs[runIndex];
    for (const id of run.ids) {
      symbols.push({
        id,
        role: run.role,
        kind: run.kindOf ? run.kindOf(id) : (run.kind ?? run.role),
        runIndex,
        index: symbols.length,
      });
    }
  }

  const sizes = normalisePages(pageSizes, symbols.length);
  const pages = [];
  let at = 0;
  for (let p = 0; p < sizes.length; p += 1) {
    const page = [];
    for (let i = 0; i < sizes[p]; i += 1) {
      const symbol = symbols[at];
      symbol.page = p;
      symbol.slot = i;
      page.push(symbol);
      at += 1;
    }
    pages.push(page);
  }

  const byId = new Map();
  for (const s of symbols) byId.set(s.id, s);

  return {
    /** Every character, in the one fixed row-major sequence. */
    symbols,
    /** `pages[p]` is the characters on page `p`, in order. */
    pages,
    /** V2 / V9 — how many cells the one grid must hold: the largest page. */
    cells: pages.reduce((n, p) => Math.max(n, p.length), 0),
    /** V1 — a tablet is not paged, and then no rail is rendered at all. */
    paged: pages.length > 1,
    byId,
    has: (id) => byId.has(id),
    pageOf: (id) => (byId.has(id) ? byId.get(id).page : -1),
    ids: symbols.map((s) => s.id),
  };
}

/**
 * The page plan is untrusted like everything else: it arrives from the layout law, but a
 * plan that does not cover the inventory exactly would silently drop characters off the
 * board, which is the one failure §8.1 exists to prevent. A plan that does not add up is
 * replaced by one page holding everything — a worse board, never a broken one.
 */
function normalisePages(pageSizes, total) {
  if (!Array.isArray(pageSizes) || pageSizes.length === 0) return [total];
  let sum = 0;
  for (const n of pageSizes) {
    if (!Number.isInteger(n) || n <= 0) return [total];
    sum += n;
  }
  return sum === total ? pageSizes.slice() : [total];
}
