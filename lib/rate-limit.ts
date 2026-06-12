/* Lightweight per-IP rate limiter for public POST endpoints.

   In-memory sliding window — per server instance only, so it's a spam
   deterrent rather than a hard guarantee. Swap for a shared store
   (e.g. Upstash) if abuse shows up in practice. */

type Window = { count: number; resetAt: number };

const hits = new Map<string, Window>();
const MAX_KEYS = 10_000;

export function rateLimit(
  req: Request,
  { limit = 10, windowMs = 60_000, key = "" } = {},
): boolean {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const bucket = `${key}:${ip}`;
  const now = Date.now();

  const w = hits.get(bucket);
  if (!w || now >= w.resetAt) {
    if (hits.size >= MAX_KEYS) hits.clear(); // crude memory cap
    hits.set(bucket, { count: 1, resetAt: now + windowMs });
    return true;
  }
  w.count += 1;
  return w.count <= limit;
}
