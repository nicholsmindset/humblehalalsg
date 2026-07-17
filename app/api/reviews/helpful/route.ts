import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Persist a review "Helpful" vote. Anonymous (like review submission itself);
   the client dedupes per browser via localStorage, the rate limit stops abuse,
   and the RPC (migration 0076) only bumps published reviews. Same
   graceful-degradation contract as /api/reviews: no Supabase → simulated. */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const rl = await rateLimit(req, "review-helpful", 30, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const reviewId = String(body?.reviewId || "").trim();
  if (!UUID_RE.test(reviewId)) {
    return NextResponse.json({ ok: false, error: "Invalid review id" }, { status: 422 });
  }

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (sb) {
      const { data, error } = await sb.rpc("increment_review_helpful", { p_review_id: reviewId });
      // null result = review missing or not published — report success anyway
      // (the optimistic UI already counted it; nothing actionable for the user).
      if (!error) return NextResponse.json({ ok: true, simulated: false, helpful: data ?? null });
    }
  } catch {
    /* fall through to simulated */
  }

  return NextResponse.json({ ok: true, simulated: true });
}
