// A seeded PRNG carried in state.
//
// `development-process.md` §3: no `Math.random()` except through a seeded source carried
// in state. Every function here is pure — it takes a state and returns a new one, so a
// replay of the same seed and the same actions produces the same rounds
// (`acceptance-criteria.md` B12).
//
// The generator is splitmix32: one 32-bit word of state, and every arithmetic step is
// forced back into uint32 with `Math.imul` and `>>> 0` so that it produces identical
// output on every JavaScript engine. A generator that relied on float arithmetic would
// be reproducible on this machine and not necessarily on an Android device, which would
// make "replay the tester's seed" a lie.

/** Derive a uint32 seed from a string or a number. FNV-1a, 32-bit. */
export function seedFrom(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value >>> 0;
  const s = String(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // A zero state is legal for splitmix32, but seeding everything from the empty string
  // would give every unseeded session the same bag order, so nudge it off zero.
  return h === 0 ? 0x9e3779b9 : h >>> 0;
}

/** One step. Returns `[nextState, uint32]`. */
export function nextUint32(state) {
  const s = (state + 0x9e3779b9) >>> 0;
  let z = s;
  z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
  z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
  z = (z ^ (z >>> 15)) >>> 0;
  return [s, z];
}

/**
 * A uniform integer in [0, n). Rejection sampling, not `% n`: modulo bias is small at
 * these sizes but it is free to avoid, and "the shuffle was slightly biased" is not a
 * defect anybody would find by looking at a round.
 */
export function nextInt(state, n) {
  if (!Number.isInteger(n) || n <= 0) throw new Error(`nextInt needs a positive integer, got ${n}`);
  if (n === 1) return [state, 0];
  const limit = Math.floor(0x100000000 / n) * n;
  let s = state;
  for (;;) {
    const [s2, v] = nextUint32(s);
    s = s2;
    if (v < limit) return [s, v % n];
  }
}

/** Fisher-Yates, without mutating the input. Returns `[nextState, newArray]`. */
export function shuffled(state, array) {
  const out = array.slice();
  let s = state;
  for (let i = out.length - 1; i > 0; i -= 1) {
    const [s2, j] = nextInt(s, i + 1);
    s = s2;
    const t = out[i];
    out[i] = out[j];
    out[j] = t;
  }
  return [s, out];
}

/**
 * A sub-seed derived from a state and a label, *without* advancing the state. Used where
 * a value must be stable for the whole round no matter what order the child does things
 * in — the tone row of a rime he may or may not ever seat, for instance.
 */
export function deriveSeed(state, label) {
  const [, v] = nextUint32((state ^ seedFrom(label)) >>> 0);
  return v >>> 0;
}
