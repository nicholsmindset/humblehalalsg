import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { ownerMonthlyReportEmail } from "@/lib/emails/templates";
import { PLANS, planKey } from "@/lib/plans";

/* Monthly owner performance report — the free-tier retention/upsell hook
   (docs/roadmap/halal-ecosystem-growth.md, Part 1). Last-30-day metrics per
   owned listing + a same-category comparison + a plan-aware upsell line.
   Scheduled for the 1st of the month (vercel.json, UTC). Idempotent per
   business per calendar month via email_log, so a manual re-run is safe.
   Quiet listings (fewer than MIN_VIEWS views) are skipped — a zeros email
   demotivates instead of retaining. */
export const dynamic = "force-dynamic";

const PAGE = 1000; // PostgREST page cap — page until a short page
const MAX_PAGES = 40;
const MIN_VIEWS = 3;

type Metrics = { views: number; enquiries: number; whatsapp: number; calls: number; directions: number };
const zero = (): Metrics => ({ views: 0, enquiries: 0, whatsapp: 0, calls: 0, directions: 0 });

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const { sendEmail } = await import("@/lib/email");
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: true, simulated: true });

    // Every published business (category averages need the whole directory);
    // owned ones (owner_id OR claimed_by) are the recipients.
    const { data: bizRows } = await sb
      .from("businesses")
      .select("id, name, slug, cat_id, plan, featured, owner_id, claimed_by")
      .eq("status", "published")
      .limit(1000);
    const businesses = bizRows || [];
    const owned = businesses.filter((b) => b.owner_id || b.claimed_by);
    if (!owned.length) return NextResponse.json({ ok: true, emailed: 0, reason: "no_owned_businesses" });

    // Last-30-day listing views + lead actions, paged past the PostgREST cap.
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const bySlug = new Map<string, Metrics>();
    for (let page = 0; page < MAX_PAGES; page++) {
      const { data: ev } = await sb
        .from("analytics_events")
        .select("listing_slug, event_type, lead_action_type")
        .gte("created_at", since)
        .or("event_type.eq.listing_view,lead_action_type.not.is.null")
        .not("listing_slug", "is", null)
        .range(page * PAGE, page * PAGE + PAGE - 1);
      if (!ev?.length) break;
      for (const e of ev as { listing_slug: string; event_type: string; lead_action_type: string | null }[]) {
        const m = bySlug.get(e.listing_slug) || zero();
        if (e.event_type === "listing_view") m.views++;
        else if (e.lead_action_type === "enquiry_form") m.enquiries++;
        else if (e.lead_action_type === "whatsapp") m.whatsapp++;
        else if (e.lead_action_type === "call") m.calls++;
        else if (e.lead_action_type === "directions") m.directions++;
        bySlug.set(e.listing_slug, m);
      }
      if (ev.length < PAGE) break;
    }

    // Category view averages (listings with ≥1 view only — a mean dragged to
    // zero by dormant rows would make every owner look above-average).
    const catViews = new Map<string, number[]>();
    const catFeaturedViews = new Map<string, number[]>();
    for (const b of businesses) {
      const v = bySlug.get(String(b.slug))?.views ?? 0;
      if (v < 1 || !b.cat_id) continue;
      const key = String(b.cat_id);
      (catViews.get(key) ?? catViews.set(key, []).get(key)!).push(v);
      if (b.featured) (catFeaturedViews.get(key) ?? catFeaturedViews.set(key, []).get(key)!).push(v);
    }
    const avg = (xs?: number[]) => (xs && xs.length ? Math.round(xs.reduce((a, x) => a + x, 0) / xs.length) : null);

    // Idempotency: one report per business per calendar month (UTC).
    const monthStart = new Date();
    monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
    const { data: already } = await sb
      .from("email_log")
      .select("business_id")
      .eq("template", "owner-monthly-report")
      .gte("sent_at", monthStart.toISOString());
    const done = new Set((already || []).map((r) => String(r.business_id)));

    // Owner emails in one batch.
    const subs = [...new Set(owned.map((b) => String(b.owner_id || b.claimed_by)))];
    const { data: profs } = await sb.from("profiles").select("id, email, name").in("id", subs);
    const profBySub = new Map((profs || []).map((pr) => [String(pr.id), pr as { email: string | null; name: string | null }]));

    // The report covers LAST month (we run on the 1st).
    const monthLabel = new Date(Date.now() - 5 * 864e5).toLocaleDateString("en-SG", { month: "long", year: "numeric", timeZone: "Asia/Singapore" });

    let emailed = 0, skippedQuiet = 0;
    for (const b of owned) {
      if (done.has(String(b.id))) continue;
      const prof = profBySub.get(String(b.owner_id || b.claimed_by));
      if (!prof?.email) continue;
      const m = bySlug.get(String(b.slug)) || zero();
      if (m.views < MIN_VIEWS) { skippedQuiet++; continue; }

      const catKey = String(b.cat_id || "");
      const catAvg = avg(catViews.get(catKey));
      const featAvg = avg(catFeaturedViews.get(catKey));
      const compareLine = catAvg != null && catViews.get(catKey)!.length >= 3
        ? `Businesses in your category averaged <strong>${catAvg}</strong> profile views — you had <strong>${m.views}</strong>.`
        : null;

      // Plan-aware upsell: only claim a Featured multiple when it's real (≥2
      // featured listings in the category and a genuinely higher average).
      const plan = planKey(b.plan as string | null);
      let upsellLine: string | null = null;
      if ((plan === "free" || plan === "verified") && featAvg != null && (catFeaturedViews.get(catKey)?.length ?? 0) >= 2 && featAvg > m.views) {
        upsellLine = `Featured businesses in your category averaged <strong>${featAvg}</strong> views this month — the ${PLANS.featured.name} plan (S$${PLANS.featured.monthly}/mo) puts you top of your category and in the homepage rotation.`;
      } else if (plan === "free") {
        upsellLine = `You're on the Free plan — verified businesses get the trust badge, WhatsApp buttons and the halal certificate vault.`;
      } else if (plan === "featured") {
        upsellLine = `Tip: ${PLANS.premium.name} adds a live offers block and search insights — see exactly what people searched before finding you.`;
      }

      const { subject, html } = ownerMonthlyReportEmail({
        name: prof.name, businessName: String(b.name), monthLabel,
        views: m.views, enquiries: m.enquiries, whatsapp: m.whatsapp, calls: m.calls, directions: m.directions,
        compareLine, upsellLine,
      });
      const r = await sendEmail({ to: prof.email, subject, html, template: "owner-monthly-report", businessId: String(b.id) });
      if (!r.simulated) emailed++;
    }

    try { await sb.from("cron_runs").insert({ job: "owner-monthly-report", ok: true, notes: `${emailed} emailed, ${skippedQuiet} quiet-skipped` }); } catch { /* best-effort */ }
    return NextResponse.json({ ok: true, emailed, skippedQuiet });
  } catch {
    return NextResponse.json({ ok: true, simulated: true });
  }
}
