import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Community freshness one-tap: "Still here" bumps last_verified_at; "Report
   closed" files a report and, once enough closed-reports accumulate, flips the
   listing to 'pending' (hidden + surfaced in the admin reports queue). Anonymous,
   rate-limited, honeypot-guarded, graceful in mock mode. Service-role writes. */

const CLOSED_PENDING_THRESHOLD = 3;

export async function POST(req: Request) {
  const rl = await rateLimit(req, "freshness", 20, 3600);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 }); }
  if (body?.website) return NextResponse.json({ ok: true, simulated: true }); // honeypot

  const businessId = String(body?.businessId || "").trim();
  const state = String(body?.state || "").trim();
  if (!businessId) return NextResponse.json({ ok: false, error: "Missing business" }, { status: 422 });
  if (state !== "here" && state !== "closed") return NextResponse.json({ ok: false, error: "Bad state" }, { status: 422 });

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ ok: true, simulated: true });

    if (state === "here") {
      await admin.from("businesses").update({ last_verified_at: new Date().toISOString() }).eq("id", businessId);
      return NextResponse.json({ ok: true });
    }

    // state === "closed"
    await admin.from("reports").insert({ business_ref: businessId, reason: "Reported closed", details: "Community freshness signal", email: null, status: "open" });
    const { count } = await admin.from("reports").select("*", { count: "exact", head: true }).eq("business_ref", businessId).eq("reason", "Reported closed").eq("status", "open");
    if (typeof count === "number" && count >= CLOSED_PENDING_THRESHOLD) {
      // Enough independent closed-reports → hide pending admin review.
      await admin.from("businesses").update({ status: "pending" }).eq("id", businessId).eq("status", "published");
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true, simulated: true });
  }
}
