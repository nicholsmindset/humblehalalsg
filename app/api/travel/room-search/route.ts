import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/feature-flags";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { liteapiConfigured, roomSearch } from "@/lib/liteapi";

/* LiteAPI room-level visual/text search (beta) — "find a room like this". Secondary
   discovery surface; gated by SEMANTIC_SEARCH_ENABLED. Returns rooms grouped by hotel.
   Graceful without a key. */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await getServerFlags()).semanticSearch) {
    return NextResponse.json({ ok: false, reason: "semantic_search_disabled" }, { status: 403 });
  }
  const rl = await rateLimit(req, "room-search", 20, 60);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    /* noop */
  }
  const query = String(body.query || "").slice(0, 300).trim();
  if (query.length < 4) return NextResponse.json({ ok: false, error: "Describe the room you're looking for." }, { status: 422 });
  if (!liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true, hotels: [] });

  try {
    const hotels = await roomSearch(
      query,
      {
        placeId: body.placeId ? String(body.placeId) : undefined,
        city: body.city ? String(body.city) : undefined,
        country: body.country ? String(body.country).toUpperCase().slice(0, 2) : undefined,
      },
      12,
    );
    return NextResponse.json({ ok: true, hotels });
  } catch {
    return NextResponse.json({ ok: true, hotels: [] });
  }
}
