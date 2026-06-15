import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Record a sponsored-ad impression or click. Fire-and-forget; degrades silently
   so a tracking blip never affects the page. */
export async function POST(req: Request) {
  const rl = await rateLimit(req, "ad-track", 600, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  let b: { campaignId?: string; placementKey?: string; kind?: string; session?: string };
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const kind = b.kind === "click" ? "click" : b.kind === "impression" ? "impression" : null;
  const campaignId = String(b.campaignId || "");
  if (!kind || !campaignId) return NextResponse.json({ ok: false }, { status: 422 });

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: true, simulated: true });
  try {
    await sb.rpc("track_ad_event", {
      p_campaign: campaignId,
      p_placement: b.placementKey ? String(b.placementKey).slice(0, 60) : null,
      p_kind: kind,
      p_session: b.session ? String(b.session).slice(0, 64) : null,
    });
  } catch { /* best-effort */ }
  return NextResponse.json({ ok: true });
}
