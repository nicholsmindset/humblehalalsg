import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { normalizeOneMapResults } from "@/lib/onemap";

/* Address autocomplete via OneMap (Singapore's official government map service).
   The public search endpoint returns results without a token; if OneMap ever
   enforces auth, set ONEMAP_TOKEN in env. On any failure we return an empty
   list so the listing form falls back to manual entry — never blocks. */

export const runtime = "nodejs";

export async function GET(req: Request) {
  // Per-IP throttle so this stays a parity-limited proxy, not an open relay.
  const rl = await rateLimit(req, "geocode", 60, 60); if (!rl.ok) return tooMany(rl.retryAfter);
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 3) return NextResponse.json({ results: [] });

  const url =
    `https://www.onemap.gov.sg/api/common/elastic/search` +
    `?searchVal=${encodeURIComponent(q)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
  const token = process.env.ONEMAP_TOKEN;

  try {
    const res = await fetch(url, {
      headers: token ? { Authorization: token } : {},
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return NextResponse.json({ results: [] });
    const data = await res.json();
    const results = normalizeOneMapResults(data?.results);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
