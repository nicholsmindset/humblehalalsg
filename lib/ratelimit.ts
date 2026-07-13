import "server-only";

/* Lightweight per-IP rate limiter. Uses Upstash Redis (REST, no SDK dependency)
   when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set — durable and
   shared across serverless instances. Falls back to a best-effort in-memory
   fixed-window when Redis isn't configured (per-instance; protects against the
   common case without any infra). Fails OPEN on limiter errors so a limiter
   outage never blocks legitimate bookings. */

function clientIp(req: Request): string {
  // Prefer Vercel's injected client IP — it's set by the platform and can't be
  // spoofed by the caller. Raw `x-forwarded-for` is client-controllable, so a
  // caller could otherwise rotate the first value to evade per-IP limits (M7).
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Loud in prod if the durable limiter isn't configured: the in-memory fallback
// is per-instance (near-useless in serverless), so paid/LLM endpoints would be
// effectively unthrottled across the fleet (audit A2). Logged once at module load.
if (process.env.NODE_ENV === "production" && !(REST_URL && REST_TOKEN)) {
  console.warn("[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN not set in production — rate limiting is per-instance only; provision Upstash to throttle paid/LLM endpoints across the fleet.");
}

// in-memory fallback: key -> { count, resetAt }
const mem = new Map<string, { count: number; resetAt: number }>();
function memHit(key: string, limit: number, windowSec: number): boolean {
  const now = Date.now();
  const e = mem.get(key);
  if (!e || e.resetAt <= now) { mem.set(key, { count: 1, resetAt: now + windowSec * 1000 }); return true; }
  e.count += 1;
  if (mem.size > 5000) for (const [k, v] of mem) if (v.resetAt <= now) mem.delete(k); // opportunistic prune
  return e.count <= limit;
}

async function redisHit(key: string, limit: number, windowSec: number, failClosed: boolean): Promise<boolean> {
  try {
    const inc = await fetch(`${REST_URL}/incr/${encodeURIComponent(key)}`, { headers: { Authorization: `Bearer ${REST_TOKEN}` }, cache: "no-store" });
    const n = Number((await inc.json())?.result || 0);
    if (n === 1) await fetch(`${REST_URL}/expire/${encodeURIComponent(key)}/${windowSec}`, { headers: { Authorization: `Bearer ${REST_TOKEN}` }, cache: "no-store" });
    return n <= limit;
  } catch {
    // Default: fail OPEN so a limiter outage never blocks legitimate bookings.
    // Sensitive buckets (paid LLM) pass failClosed → deny on outage so a Redis
    // blip can't turn into unbounded LLM/Stripe cost.
    return !failClosed;
  }
}

export interface RateResult { ok: boolean; retryAfter: number }

/** Returns { ok:false, retryAfter } when the caller has exceeded `limit` hits in
 *  the rolling `windowSec` for the named bucket. Pass { failClosed:true } for
 *  paid/LLM buckets so a limiter outage denies rather than allows. */
export async function rateLimit(req: Request, bucket: string, limit: number, windowSec: number, opts?: { failClosed?: boolean }): Promise<RateResult> {
  const key = `rl:${bucket}:${clientIp(req)}`;
  const ok = REST_URL && REST_TOKEN ? await redisHit(key, limit, windowSec, !!opts?.failClosed) : memHit(key, limit, windowSec);
  return { ok, retryAfter: ok ? 0 : windowSec };
}

/** Standard 429 response. */
export function tooMany(retryAfter: number): Response {
  return new Response(JSON.stringify({ ok: false, error: "Too many requests — please slow down and try again." }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) },
  });
}
