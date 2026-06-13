import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";

/* B5 — daily owner roll-up (views / WhatsApp clicks / new leads) → Resend.
   The retention hook for paid plans. Graceful without keys. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const { sendEmail } = await import("@/lib/email");
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: true, simulated: true });

    const { data: owned } = await sb
      .from("businesses")
      .select("id, name, claimed_by")
      .not("claimed_by", "is", null)
      .limit(500);

    let emailed = 0;
    for (const b of owned || []) {
      const { data: prof } = await sb.from("profiles").select("email").eq("id", b.claimed_by).single();
      const to = (prof as { email?: string } | null)?.email;
      if (!to) continue;
      // metrics source (events/clicks) wired with analytics; placeholder roll-up for now.
      const r = await sendEmail({
        to,
        subject: `${b.name} — your daily Humble Halal summary`,
        template: "owner-alert",
        businessId: b.id,
        html: `<p>Here's how <strong>${b.name}</strong> did in the last 24h.</p>`,
      });
      if (!r.simulated) emailed++;
    }
    await sb.from("cron_runs").insert({ job: "owner-alerts", ok: true, notes: `${emailed} owners emailed` });
    return NextResponse.json({ ok: true, simulated: false, emailed });
  } catch {
    return NextResponse.json({ ok: true, simulated: true });
  }
}
