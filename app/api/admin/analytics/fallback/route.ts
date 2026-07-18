import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { classifyChannel, buildFunnel, type Channel } from "@/lib/analytics-overview";

type EventRow = {
  created_at: string;
  event_type: string;
  lead_action_type: string | null;
  listing_slug: string | null;
  category: string | null;
  area: string | null;
  session_id: string | null;
  path: string | null;
  device: string | null;
  referrer: string | null;
};

const SG_OFFSET_MS = 8 * 60 * 60 * 1000;
/** SG-local YYYY-MM-DD for a UTC timestamp (day boundaries match the range bar). */
const sgDay = (iso: string) => new Date(new Date(iso).getTime() + SG_OFFSET_MS).toISOString().slice(0, 10);
const convRate = (leads: number, sessions: number) =>
  sessions > 0 ? Number(((100 * leads) / sessions).toFixed(1)) : 0;

type BizRow = {
  slug: string;
  name: string | null;
  cat_id: string | null;
  area: string | null;
  plan: string | null;
};

const zeroVendor = (slug: string) => ({
  listing_id: slug,
  vendor_name: slug,
  category: null as string | null,
  area: null as string | null,
  plan: "free",
  enquiries: 0,
  whatsapp_clicks: 0,
  calls: 0,
  website_clicks: 0,
  directions: 0,
  shortlists: 0,
  shares: 0,
  claims: 0,
  bookings: 0,
  lead_actions: 0,
  listing_views: 0,
  impressions: 0,
  est_value_cents: 0,
  last_event_at: "",
});

function suggestedOffer(plan: string, leads: number, claims: number, views: number) {
  if (plan === "free" && claims > 0) return "claim_followup";
  if (plan === "free" && leads >= 10) return "featured";
  if (plan === "free" && leads >= 3) return "verified";
  if (plan === "verified" && leads >= 10) return "featured";
  if (plan === "featured" && leads >= 20) return "premium";
  if (plan === "free" && views >= 25) return "verified";
  return "nurture";
}

async function fetchAllEvents(admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>, from: string, to: string) {
  const rows: EventRow[] = [];
  const pageSize = 1000;
  for (let fromIdx = 0; ; fromIdx += pageSize) {
    const { data, error } = await admin
      .from("analytics_events")
      .select("created_at,event_type,lead_action_type,listing_slug,category,area,session_id,path,device,referrer")
      .gte("created_at", from)
      .lt("created_at", to)
      .order("created_at", { ascending: true })
      .range(fromIdx, fromIdx + pageSize - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data || []) as EventRow[]));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  if (!from || !to || Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) {
    return NextResponse.json({ ok: false, error: "invalid_range" }, { status: 400 });
  }

  try {
    const [events, bizRes, valueRes] = await Promise.all([
      fetchAllEvents(admin, from, to),
      admin.from("businesses").select("slug,name,cat_id,area,plan"),
      admin.from("analytics_lead_values").select("action,value_cents"),
    ]);
    if (bizRes.error) throw new Error(bizRes.error.message);
    if (valueRes.error) throw new Error(valueRes.error.message);

    const businesses = new Map((bizRes.data as BizRow[] | null || []).map((b) => [b.slug, b]));
    const values = new Map((valueRes.data || []).map((v) => [String(v.action), Number(v.value_cents) || 0]));
    const vendors = new Map<string, ReturnType<typeof zeroVendor>>();

    for (const e of events) {
      if (!e.listing_slug) continue;
      const v = vendors.get(e.listing_slug) || zeroVendor(e.listing_slug);
      vendors.set(e.listing_slug, v);
      const b = businesses.get(e.listing_slug);
      v.vendor_name = b?.name || v.vendor_name;
      v.category = b?.cat_id || v.category || e.category;
      v.area = b?.area || v.area || e.area;
      v.plan = b?.plan || v.plan || "free";
      v.last_event_at = !v.last_event_at || e.created_at > v.last_event_at ? e.created_at : v.last_event_at;

      if (e.event_type === "lead_action") {
        v.lead_actions++;
        v.est_value_cents += values.get(e.lead_action_type || "") || 0;
      }
      if (e.event_type === "listing_view") v.listing_views++;
      if (e.event_type === "impression") v.impressions++;
      if (e.lead_action_type === "enquiry_form") v.enquiries++;
      if (e.lead_action_type === "whatsapp") v.whatsapp_clicks++;
      if (e.lead_action_type === "call") v.calls++;
      if (e.lead_action_type === "website") v.website_clicks++;
      if (e.lead_action_type === "directions") v.directions++;
      if (e.lead_action_type === "shortlist") v.shortlists++;
      if (e.lead_action_type === "share") v.shares++;
      if (e.lead_action_type === "claim") v.claims++;
      if (e.lead_action_type === "booking") v.bookings++;
    }

    const listingRows = [...vendors.values()].sort(
      (a, b) => b.lead_actions - a.lead_actions || b.listing_views - a.listing_views,
    );

    const opportunities = listingRows
      .filter((v) => ["free", "verified", "featured"].includes(v.plan || "free") && (v.lead_actions > 0 || v.listing_views > 0))
      .map((v) => ({
        listing_id: v.listing_id,
        vendor_name: v.vendor_name,
        category: v.category,
        area: v.area,
        plan: v.plan,
        lead_actions: v.lead_actions,
        claims: v.claims,
        shortlists: v.shortlists,
        listing_views: v.listing_views,
        est_value_cents: v.est_value_cents,
        suggested_offer: suggestedOffer(v.plan || "free", v.lead_actions, v.claims, v.listing_views),
      }))
      .sort((a, b) => b.est_value_cents - a.est_value_cents || b.lead_actions - a.lead_actions)
      .slice(0, 25);

    const bySession = new Map<string, EventRow[]>();
    for (const e of events) {
      if (!e.session_id) continue;
      const rows = bySession.get(e.session_id) || [];
      rows.push(e);
      bySession.set(e.session_id, rows);
    }

    const journeys = [...bySession.entries()]
      .map(([sessionId, rows]) => {
        const final = [...rows].reverse().find((e) => e.event_type === "lead_action");
        if (!final) return null;
        return {
          session_id: sessionId,
          session_start: rows[0]?.created_at || final.created_at,
          entry_path: rows.find((e) => e.path)?.path || "",
          pages_viewed: rows.filter((e) => e.event_type === "page_view").length,
          listings_viewed: new Set(rows.filter((e) => e.event_type === "listing_view" && e.listing_slug).map((e) => e.listing_slug)).size,
          used_search: rows.some((e) => e.event_type === "search"),
          final_action: final.lead_action_type || "",
          final_category: final.category || "",
          final_action_at: final.created_at,
        };
      })
      .filter((row): row is NonNullable<typeof row> => !!row)
      .sort((a, b) => b.final_action_at.localeCompare(a.final_action_at))
      .slice(0, limit);

    // ── Overview aggregates (single pass over ALL events) — funnel stage counts,
    //    daily series, device + acquisition-channel breakdowns. Sessions are
    //    distinct session_ids; conversion is lead-actions ÷ sessions.
    const sessions = new Set<string>();
    let totalListingViews = 0, totalLeadActions = 0, totalQualified = 0;
    const daily = new Map<string, { day: string; s: Set<string>; searches: number; listingViews: number; leadActions: number }>();
    const device = new Map<string, { device: string; s: Set<string>; leadActions: number }>();
    const channel = new Map<Channel, { channel: Channel; s: Set<string>; leadActions: number }>();
    const catDayLeads = new Map<string, Map<string, number>>(); // category → day → lead actions (sparkline trend)

    for (const e of events) {
      const sid = e.session_id || "";
      const isView = e.event_type === "listing_view";
      const isLead = e.event_type === "lead_action";
      const isSearch = e.event_type === "search";
      if (sid) sessions.add(sid);
      if (isView) totalListingViews++;
      if (isLead) totalLeadActions++;
      if (e.lead_action_type === "enquiry_form") totalQualified++;

      const day = sgDay(e.created_at);
      const d = daily.get(day) || { day, s: new Set<string>(), searches: 0, listingViews: 0, leadActions: 0 };
      daily.set(day, d);
      if (sid) d.s.add(sid);
      if (isSearch) d.searches++;
      if (isView) d.listingViews++;
      if (isLead) d.leadActions++;

      if (isLead && e.category) {
        const byDay = catDayLeads.get(e.category) || new Map<string, number>();
        catDayLeads.set(e.category, byDay);
        byDay.set(day, (byDay.get(day) || 0) + 1);
      }

      const dev = (e.device || "unknown").toLowerCase();
      const dv = device.get(dev) || { device: dev, s: new Set<string>(), leadActions: 0 };
      device.set(dev, dv);
      if (sid) dv.s.add(sid);
      if (isLead) dv.leadActions++;

      const ch = classifyChannel(e.referrer);
      const cv = channel.get(ch) || { channel: ch, s: new Set<string>(), leadActions: 0 };
      channel.set(ch, cv);
      if (sid) cv.s.add(sid);
      if (isLead) cv.leadActions++;
    }

    const funnel = buildFunnel({
      sessions: sessions.size, listingViews: totalListingViews,
      actions: totalLeadActions, qualified: totalQualified,
    });
    const dailySeries = [...daily.values()]
      .map((d) => ({ day: d.day, sessions: d.s.size, searches: d.searches, listingViews: d.listingViews, leadActions: d.leadActions }))
      .sort((a, b) => a.day.localeCompare(b.day));
    const deviceRows = [...device.values()]
      .map((d) => ({ device: d.device, sessions: d.s.size, leadActions: d.leadActions, convRate: convRate(d.leadActions, d.s.size) }))
      .sort((a, b) => b.sessions - a.sessions);
    const channelRows = [...channel.values()]
      .map((c) => ({ channel: c.channel, sessions: c.s.size, leadActions: c.leadActions, convRate: convRate(c.leadActions, c.s.size) }))
      .sort((a, b) => b.sessions - a.sessions);
    // Per-category lead trend aligned to the daily day-axis (for KPI sparklines).
    const dayAxis = dailySeries.map((d) => d.day);
    const categoryTrends: Record<string, number[]> = {};
    for (const [cat, byDay] of catDayLeads) categoryTrends[cat] = dayAxis.map((day) => byDay.get(day) || 0);

    return NextResponse.json({
      ok: true,
      listings: listingRows, opportunities, journeys,
      funnel, daily: dailySeries, device: deviceRows, channel: channelRows, categoryTrends,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "analytics_fallback_failed" },
      { status: 500 },
    );
  }
}
