import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Listing report (wrong halal status, closed, hours, etc.). Graceful-degradation:
   validates + accepts now; persistence point for a Supabase `reports` moderation
   queue once the backend is wired. */

export async function POST(req: Request) {
  const rl = await rateLimit(req, "reports", 10, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  if (body?.website) return NextResponse.json({ ok: true, simulated: true }); // honeypot

  const businessId = String(body?.businessId || "").trim();
  const reason = String(body?.reason || "").trim();
  const details = String(body?.details || "").trim().slice(0, 1500);

  if (!reason) {
    return NextResponse.json({ ok: false, error: "Pick what's wrong." }, { status: 422 });
  }

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (sb) {
      const { error } = await sb
        .from("reports")
        .insert({ business_ref: businessId || null, reason, details, status: "open" });
      if (!error) return NextResponse.json({ ok: true, simulated: false });
    }
  } catch {
    /* fall through to simulated */
  }

  return NextResponse.json({ ok: true, simulated: true });
}
