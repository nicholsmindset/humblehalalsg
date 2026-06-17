import "server-only";

/* Read-through cache for NON-binding LiteAPI content — static hotel data, places
   autocomplete, and "from $X" min-rates. Uses Upstash Redis (REST, no SDK) when
   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set — durable and shared
   across serverless instances — and falls back to a best-effort per-instance
   in-memory store otherwise (mirrors lib/ratelimit.ts).

   FAILS OPEN: any cache read/write error, parse failure, or Redis outage is
   swallowed and the source fn is called, so caching can never break a live
   request — it only ever saves an upstream (paid) call.

   NEVER wrap price-binding calls (/hotels/rates search, /rates/prebook,
   /rates/book, or any flight pricing) with this — the price a guest pays must be
   the price LiteAPI confirms live, so those must always hit the API fresh. */

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// in-memory fallback: key -> { value, expiresAt }
const mem = new Map<string, { value: string; expiresAt: number }>();

function memGet(key: string): string | null {
  const e = mem.get(key);
  if (!e) return null;
  if (e.expiresAt <= Date.now()) { mem.delete(key); return null; }
  return e.value;
}

function memSet(key: string, value: string, ttlSec: number): void {
  if (mem.size > 5000) { const now = Date.now(); for (const [k, v] of mem) if (v.expiresAt <= now) mem.delete(k); } // opportunistic prune
  mem.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
}

/* Upstash REST command form: POST the command as a JSON array to the base URL.
   Passing the value in the body (not the URL path) keeps large hotel JSON blobs
   off the URL, avoiding length limits. Returns null on any error (→ cache miss). */
async function redisCmd(cmd: (string | number)[]): Promise<unknown> {
  try {
    const r = await fetch(REST_URL as string, {
      method: "POST",
      headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(cmd),
      cache: "no-store",
    });
    const j = (await r.json()) as { result?: unknown };
    return j?.result ?? null;
  } catch {
    return null; // fail open → treated as a miss
  }
}

async function cacheGet(key: string): Promise<string | null> {
  if (REST_URL && REST_TOKEN) {
    const r = await redisCmd(["GET", key]);
    return typeof r === "string" ? r : null;
  }
  return memGet(key);
}

async function cacheSet(key: string, value: string, ttlSec: number): Promise<void> {
  if (REST_URL && REST_TOKEN) { await redisCmd(["SET", key, value, "EX", ttlSec]); return; }
  memSet(key, value, ttlSec);
}

/** Read-through cache. Returns the cached value when present, else calls `fn`,
 *  stores its (non-null) result for `ttlSec`, and returns it. Errors thrown by
 *  `fn` propagate (and are never cached); cache-layer errors fail open. */
export async function withCache<T>(key: string, ttlSec: number, fn: () => Promise<T>): Promise<T> {
  const k = `cache:${key}`;
  const hit = await cacheGet(k);
  if (hit != null) {
    try { return JSON.parse(hit) as T; } catch { /* corrupt entry → fall through and refetch */ }
  }
  const value = await fn();
  if (value != null) {
    try { await cacheSet(k, JSON.stringify(value), ttlSec); } catch { /* best-effort */ }
  }
  return value;
}

/** Stable, bounded hash (FNV-1a → base36) for composing cache keys from large or
 *  variable inputs (e.g. a list of hotel IDs). */
export function hashKey(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}
