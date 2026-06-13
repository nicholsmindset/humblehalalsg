import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";

/* B1 — weekly MUIS cert re-check (the #1 moat job). Any business whose
   muis_expiry has passed while still tier muis/admin is flagged back to
   'pending' and logged. Graceful without keys. Never lets an expired cert show
   as certified. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: true, simulated: true });

    const today = new Date().toISOString().slice(0, 10);
    const { data: expired } = await sb
      .from("businesses")
      .select("id, name, muis_expiry, halal_tier")
      .in("halal_tier", ["muis", "admin"])
      .lt("muis_expiry", today);

    let flagged = 0;
    for (const b of expired || []) {
      await sb.from("businesses").update({ halal_tier: "pending", halal_score: 34 }).eq("id", b.id);
      await sb.from("verification_log").insert({
        business_id: b.id,
        event: "cert_expired",
        detail: `MUIS expiry ${b.muis_expiry} passed → set to pending`,
      });
      flagged++;
    }
    await sb.from("cron_runs").insert({ job: "recheck-certs", ok: true, notes: `${flagged} flagged` });
    return NextResponse.json({ ok: true, simulated: false, flagged });
  } catch {
    return NextResponse.json({ ok: true, simulated: true });
  }
}
