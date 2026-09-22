import test from 'node:test';
import assert from 'node:assert/strict';
import { seedFrom, nextUint32, nextInt, shuffled, deriveSeed } from '../src/engine/rng.mjs';

test('the same seed produces the same stream', () => {
  const run = () => {
    let s = seedFrom('ghep-chu');
    const out = [];
    for (let i = 0; i < 20; i += 1) { const [n, v] = nextUint32(s); s = n; out.push(v); }
    return out;
  };
  assert.deepEqual(run(), run());
});

test('different seeds diverge immediately', () => {
  const [, a] = nextUint32(seedFrom('a'));
  const [, b] = nextUint32(seedFrom('b'));
  assert.notEqual(a, b);
});

test('every value is a uint32', () => {
  let s = seedFrom(1);
  for (let i = 0; i < 5000; i += 1) {
    const [n, v] = nextUint32(s); s = n;
    assert.ok(Number.isInteger(v) && v >= 0 && v <= 0xffffffff, `${v} is not a uint32`);
  }
});

test('nextInt stays in range and covers it', () => {
  let s = seedFrom('range');
  const seen = new Set();
  for (let i = 0; i < 4000; i += 1) {
    const [n, v] = nextInt(s, 7); s = n;
    assert.ok(v >= 0 && v < 7, `${v} out of range`);
    seen.add(v);
  }
  assert.equal(seen.size, 7);
});

test('nextInt is close to uniform — a biased shuffle is a defect nobody would see', () => {
  let s = seedFrom('uniform');
  const counts = new Array(6).fill(0);
  const n = 60000;
  for (let i = 0; i < n; i += 1) { const [x, v] = nextInt(s, 6); s = x; counts[v] += 1; }
  const expected = n / 6;
  for (const c of counts) {
    assert.ok(Math.abs(c - expected) < expected * 0.05, `counts skewed: ${counts.join(',')}`);
  }
});

test('nextInt(1) is free and does not advance the state', () => {
  const s = seedFrom('one');
  assert.deepEqual(nextInt(s, 1), [s, 0]);
});

test('nextInt refuses a non-positive count rather than returning nonsense', () => {
  assert.throws(() => nextInt(1, 0));
  assert.throws(() => nextInt(1, -3));
  assert.throws(() => nextInt(1, 2.5));
});

test('shuffled does not mutate its input and keeps every element', () => {
  const input = ['a', 'b', 'c', 'd', 'e'];
  const copy = input.slice();
  const [, out] = shuffled(seedFrom('sh'), input);
  assert.deepEqual(input, copy);
  assert.deepEqual(out.slice().sort(), copy.slice().sort());
});

test('shuffled actually permutes', () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8];
  let s = seedFrom('perm');
  let moved = 0;
  for (let i = 0; i < 50; i += 1) {
    const [n, out] = shuffled(s, input); s = n;
    if (out.join() !== input.join()) moved += 1;
  }
  assert.ok(moved > 40, `only ${moved}/50 shuffles changed the order`);
});

test('deriveSeed is stable and does not advance the state', () => {
  const s = seedFrom('derive');
  assert.equal(deriveSeed(s, 'eo'), deriveSeed(s, 'eo'));
  assert.notEqual(deriveSeed(s, 'eo'), deriveSeed(s, 'ao'));
});

test('seedFrom is stable across calls and never zero', () => {
  assert.equal(seedFrom('mèo'), seedFrom('mèo'));
  assert.notEqual(seedFrom(''), 0);
  assert.equal(seedFrom(12345), 12345);
});
