// Polite, resumable HTTP for the asset pipeline.
//
// WHY THIS EXISTS. `image-sourcing.md` records the measurement: Wikipedia returned
// `429 Too many requests` after 13 consecutive fetches. A 45-word run makes roughly
// 45 lead-image calls, 45 Wikidata calls, 45 category calls and several hundred file
// downloads. Run as a plain loop it will be throttled, and — worse — it will be
// throttled *somewhere in the middle*, leaving a half-populated output directory and no
// way to tell which words were done.
//
// Three properties, each of which the spike showed is needed:
//
//  1. THROTTLE, per host. One request at a time, with a minimum gap. Nothing here is
//     urgent; a 45-word run taking six minutes instead of forty seconds costs nothing.
//  2. BACKOFF that honours `Retry-After`. A 429 is an instruction, not an error.
//  3. A DISK CACHE keyed by URL. Re-running after a failure must not re-ask for what it
//     already has. This is what makes the run resumable rather than restartable, and it
//     also makes the pipeline reproducible offline once the cache is warm.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';

export const UA = 'ghep-chu/0.1 (personal educational project; offline word game for one child)';

/** Minimum gap between requests to the same host, in ms. */
const DEFAULT_GAP_MS = 1200;
const MAX_TRIES = 5;

const lastAt = new Map(); // host -> timestamp
const queue = new Map(); // host -> promise chain

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function hostOf(url) { return new URL(url).host; }

/** Serialise per host and enforce the minimum gap. */
function throttled(url, gapMs, fn) {
  const host = hostOf(url);
  const prev = queue.get(host) ?? Promise.resolve();
  const next = prev.then(async () => {
    const wait = (lastAt.get(host) ?? 0) + gapMs - Date.now();
    if (wait > 0) await sleep(wait);
    try { return await fn(); } finally { lastAt.set(host, Date.now()); }
  });
  queue.set(host, next.catch(() => {}));
  return next;
}

export class Fetcher {
  /**
   * @param {object} opts
   * @param {string} opts.cacheDir  where responses are cached; omit to disable
   * @param {number} opts.gapMs     minimum gap per host
   * @param {boolean} opts.verbose
   */
  constructor({ cacheDir = null, gapMs = DEFAULT_GAP_MS, verbose = true } = {}) {
    this.cacheDir = cacheDir;
    this.gapMs = gapMs;
    this.verbose = verbose;
    this.stats = { hits: 0, misses: 0, retries: 0, throttled: 0, failed: 0 };
    if (cacheDir) mkdirSync(cacheDir, { recursive: true });
  }

  cachePath(url, ext) {
    if (!this.cacheDir) return null;
    return path.join(this.cacheDir, `${createHash('sha256').update(url).digest('hex').slice(0, 24)}${ext}`);
  }

  /**
   * Fetch a URL as a Buffer, through the cache. Returns `{ buf, cached }`, or throws
   * after MAX_TRIES. A 404 is returned as `{ buf: null, status }` rather than thrown:
   * a word having no Wikipedia article is a normal outcome, not a failure of the run.
   */
  async get(url, { ext = '.bin', accept = null } = {}) {
    const cp = this.cachePath(url, ext);
    if (cp && existsSync(cp) && statSync(cp).size > 0) {
      this.stats.hits += 1;
      return { buf: readFileSync(cp), cached: true, status: 200 };
    }
    this.stats.misses += 1;

    let delay = 2000;
    for (let attempt = 1; attempt <= MAX_TRIES; attempt += 1) {
      const res = await throttled(url, this.gapMs, () => fetch(url, {
        headers: { 'User-Agent': UA, ...(accept ? { Accept: accept } : {}) },
        redirect: 'follow',
      }));
      if (res.status === 404 || res.status === 410) return { buf: null, cached: false, status: res.status };
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        if (cp) writeFileSync(cp, buf);
        return { buf, cached: false, status: res.status };
      }
      // 429 and 5xx are worth waiting out. 4xx otherwise is not.
      const retryable = res.status === 429 || res.status === 503 || (res.status >= 500 && res.status < 600);
      if (!retryable) { this.stats.failed += 1; throw new Error(`${res.status} ${res.statusText} for ${url}`); }
      if (res.status === 429) this.stats.throttled += 1;
      this.stats.retries += 1;
      const hinted = Number(res.headers.get('retry-after'));
      const waitMs = Number.isFinite(hinted) && hinted > 0 ? hinted * 1000 : delay;
      if (this.verbose) console.error(`  ${res.status} on ${hostOf(url)} — waiting ${Math.round(waitMs / 1000)}s (attempt ${attempt}/${MAX_TRIES})`);
      if (attempt === MAX_TRIES) { this.stats.failed += 1; throw new Error(`${res.status} after ${MAX_TRIES} attempts: ${url}`); }
      await sleep(waitMs);
      delay = Math.min(delay * 2, 60000);
    }
    throw new Error('unreachable');
  }

  async json(url) {
    const { buf, status } = await this.get(url, { ext: '.json', accept: 'application/json' });
    if (!buf) return { data: null, status };
    try { return { data: JSON.parse(buf.toString('utf8')), status }; }
    catch (e) { throw new Error(`not JSON from ${url}: ${e.message}`); }
  }

  report() {
    const s = this.stats;
    return `cache ${s.hits} hit / ${s.misses} miss · ${s.retries} retr${s.retries === 1 ? 'y' : 'ies'} (${s.throttled} × 429) · ${s.failed} failed`;
  }
}

/**
 * A per-run state file: which units of work are done. This is the other half of
 * resumability — the cache stops a re-run re-asking, and this stops it re-doing.
 */
export class RunState {
  constructor(file) {
    this.file = file;
    mkdirSync(path.dirname(file), { recursive: true });
    this.data = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { units: {} };
  }
  status(id) { return this.data.units[id]?.status ?? null; }
  done(id) { return this.status(id) === 'done'; }
  set(id, status, detail) {
    this.data.units[id] = { status, detail: detail ?? null, at: new Date().toISOString() };
    writeFileSync(this.file, `${JSON.stringify(this.data, null, 2)}\n`);
  }
  counts() {
    const c = {};
    for (const u of Object.values(this.data.units)) c[u.status] = (c[u.status] ?? 0) + 1;
    return c;
  }
}
