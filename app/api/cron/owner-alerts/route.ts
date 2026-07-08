import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { ownerDigestEmail } from "@/lib/emails/templates";

/* B5 — owner roll-up (views / WhatsApp clicks / new leads) → Resend.
   WEEKLY (Mon 00:00 UTC = 8am SG) — it was scheduled daily while re-sending
   the same 7-day window, which became real spam once RESEND went live. Quiet
   listings are skipped; the monthly report (owner-monthly-report) carries the
   comparison/upsell angle. Graceful without keys. */
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
      .select("id, name, slug, claimed_by")
      .not("claimed_by", "is", null)
      .limit(500);

    // Real last-7-days metrics from analytics_events, aggregated per listing slug.
    type M = { views: number; whatsapp: number; calls: number; enquiries: number };
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const slugs = (owned || []).map((b) => b.slug as string).filter(Boolean);
    const bySlug = new Map<string, M>();
    if (slugs.length) {
      const { data: ev } = await sb
        .from("analytics_events")
        .select("listing_slug, event_type, lead_action_type")
        .gte("created_at", since)
        .in("listing_slug", slugs);
      for (const e of (ev || []) as { listing_slug: string; event_type: string; lead_action_type: string | null }[]) {
        const m = bySlug.get(e.listing_slug) || { views: 0, whatsapp: 0, calls: 0, enquiries: 0 };
        if (e.event_type === "listing_view") m.views++;
        else if (e.lead_action_type === "whatsapp") m.whatsapp++;
        else if (e.lead_action_type === "call") m.calls++;
        else if (e.lead_action_type === "enquiry_form") m.enquiries++;
        bySlug.set(e.listing_slug, m);
      }
    }

    let emailed = 0;
    for (const b of owned || []) {
      const { data: prof } = await sb.from("profiles").select("email").eq("id", b.claimed_by).single();
      const to = (prof as { email?: string } | null)?.email;
      if (!to) continue;
      const m = bySlug.get(b.slug as string) || { views: 0, whatsapp: 0, calls: 0, enquiries: 0 };
      // A week of zeros isn't a digest, it's a nag — skip quiet listings.
      if (m.views + m.whatsapp + m.calls + m.enquiries === 0) continue;
      const { subject, html } = ownerDigestEmail({
        businessName: b.name,
        views: m.views,
        enquiries: m.enquiries,
        whatsapp: m.whatsapp,
        calls: m.calls,
      });
      const r = await sendEmail({
        to,
        subject,
        template: "owner-alert",
        businessId: b.id,
        html,
      });
      if (!r.simulated) emailed++;
    }
    await sb.from("cron_runs").insert({ job: "owner-alerts", ok: true, notes: `${emailed} owners emailed` });
    return NextResponse.json({ ok: true, simulated: false, emailed });
  } catch {
    return NextResponse.json({ ok: true, simulated: true });
  }
}
