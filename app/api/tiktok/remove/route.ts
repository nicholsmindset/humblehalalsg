import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { parseTikTokUrl } from "@/lib/tiktok";

/* Creator opt-out. A creator asks us to stop featuring their TikTok — we ALWAYS
   honour a removal request (removing content is low-risk and respects creator
   control), immediately flipping any live rows for that URL to 'removed' so the
   embed disappears. Rate-limited + honeypot. Graceful when Supabase is absent. */
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rl = await rateLimit(req, "tiktok-remove", 10, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 }); }
  if (body?.website) return NextResponse.json({ ok: true, simulated: true }); // honeypot

  const parsed = parseTikTokUrl(String(body?.url || ""));
  if (!parsed.valid) return NextResponse.json({ ok: false, error: "Enter the TikTok link you'd like removed." }, { status: 422 });
  const reason = String(body?.reason || "").trim().slice(0, 300) || "Creator opt-out";

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (sb) {
      const { data, error } = await sb.from("tiktok_submissions")
        .update({ status: "removed", review_note: reason, updated_at: new Date().toISOString() })
        .eq("url", parsed.canonical).in("status", ["pending", "approved"]).select("id, matched_business_id");
      if (!error) {
        // Revalidate any listing the video was showing on.
        try {
          const bids = Array.from(new Set((data || []).map((r) => r.matched_business_id).filter(Boolean)));
          if (bids.length) {
            const { data: biz } = await sb.from("businesses").select("slug").in("id", bids as string[]);
            const { revalidatePublic } = await import("@/lib/revalidate");
            revalidatePublic((biz || []).map((x) => `/business/${x.slug}`));
          }
        } catch { /* revalidate best-effort */ }
        return NextResponse.json({ ok: true, removed: (data || []).length });
      }
    }
  } catch { /* fall through */ }

  return NextResponse.json({ ok: true, simulated: true, removed: 0 });
}
