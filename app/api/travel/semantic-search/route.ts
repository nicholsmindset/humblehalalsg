import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/flags";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { runSemanticDiscovery } from "@/lib/travel-data";

/* LiteAPI semantic ("describe your ideal stay") hotel discovery — beta, so gated by
   SEMANTIC_SEARCH_ENABLED. Returns the SAME enriched Hotel[] shape as /api/travel/
   search (overlay-joined + "from $X" + halal-ranked) so the UI renders identically.
   Graceful: no LiteAPI key → { simulated:true, hotels:[] }. */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!getServerFlags().semanticSearch) {
    return NextResponse.json({ ok: false, reason: "semantic_search_disabled" }, { status: 403 });
  }
  const rl = await rateLimit(req, "semantic-travel", 20, 60);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let query = "";
  try {
    query = String(((await req.json()) as { query?: unknown }).query || "").slice(0, 300).trim();
  } catch {
    /* noop */
  }
  if (query.length < 4) return NextResponse.json({ ok: false, error: "Describe the stay you're looking for." }, { status: 422 });

  const { simulated, hotels } = await runSemanticDiscovery(query, { limit: 12 });
  return NextResponse.json({ ok: true, simulated, hotels });
}
