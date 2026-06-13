import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";

/* B2 — weekly freshness decay monitor. Listings not verified in 180+ days are
   queued and (if claimed) the owner is emailed a one-click re-stamp link.
   Graceful without keys. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const { sendEmail } = await import("@/lib/email");
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: true, simulated: true });

    const cutoff = new Date(Date.now() - 180 * 86400_000).toISOString();
    const { data: stale } = await sb
      .from("businesses")
      .select("id, name, slug, claimed_by, last_verified_at")
      .lt("last_verified_at", cutoff)
      .limit(200);

    let emailed = 0;
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://humblehalal.com";
    for (const b of stale || []) {
      if (!b.claimed_by) continue;
      const { data: prof } = await sb.from("profiles").select("email").eq("id", b.claimed_by).single();
      const to = (prof as { email?: string } | null)?.email;
      if (!to) continue;
      const link = `${base}/api/owner/restamp?business=${b.id}`;
      const r = await sendEmail({
        to,
        subject: `Confirm ${b.name}'s details are current`,
        template: "freshness",
        businessId: b.id,
        html: `<p>It's been a while since <strong>${b.name}</strong> was confirmed on Humble Halal.</p><p><a href="${link}">Confirm details are current →</a></p>`,
      });
      if (!r.simulated) emailed++;
    }
    await sb.from("cron_runs").insert({ job: "freshness-audit", ok: true, notes: `${stale?.length || 0} stale, ${emailed} emailed` });
    return NextResponse.json({ ok: true, simulated: false, stale: stale?.length || 0, emailed });
  } catch {
    return NextResponse.json({ ok: true, simulated: true });
  }
}
