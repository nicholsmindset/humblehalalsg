"use client";

/* Owner listing insights — real per-listing metrics from analytics_events via
   the owner_listing_analytics RPC (0013), summed across the owner's listings.
   Falls back to the published empty-state when there's no backend, no owned
   listings, or no events yet — so the dashboard never breaks in mock mode. */

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { resolveRange, fmt, pct } from "@/lib/analytics-dashboard";
import { useSupabaseBrowser } from "@/lib/supabase/client";
import { canUse } from "@/lib/plans";
import { Icon } from "../ui";

type SummaryRow = {
  impressions: number; listing_views: number; lead_actions: number;
  enquiries: number; whatsapp_clicks: number; calls: number; website_clicks: number;
  directions: number; shortlists: number; offer_views: number;
  est_value_cents: number; last_event_at: string | null;
};
type DailyRow = { day: string; impressions: number; listing_views: number; lead_actions: number; est_value_cents: number };
type QueryRow = { query: string; searches: number };
type PlacementRow = { placement: string; impressions: number };

const PLACEMENT_LABELS: Record<string, string> = {
  homepage_featured: "Homepage Featured rotation",
  category_priority: "Top of category",
  area_priority: "Top of area",
  search_featured: "Featured search results",
  directory_featured: "Featured directory",
  search_results: "Organic search results",
  directory: "Organic directory",
  legacy_unattributed: "Legacy / unattributed",
};

const sgd = (cents: number) => new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 }).format((cents || 0) / 100);

export function OwnerInsights({ businessId, plan = "free", onUpgrade }: { businessId?: string; plan?: string; onUpgrade?: () => void }) {
  const supabase = useSupabaseBrowser();
  const { isLoaded, isSignedIn } = useUser();
  // Basic totals stay free; the trend + search-insights blocks are the Premium
  // "advanced analytics" differentiator (they were silently free-to-all).
  const advanced = canUse(plan, "analytics");
  const [summary, setSummary] = useState<SummaryRow | null>(null);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isLoaded) return;
      const sb = supabase;
      if (!sb || !isSignedIn || !businessId) {
        if (alive) {
          setSummary(null);
          setDaily([]);
          setQueries([]);
          setLoadErr(false);
          setLoading(false);
        }
        return;
      }
      if (alive) {
        setLoading(true);
        setLoadErr(false);
      }
      const { from, to } = resolveRange(range);
      const scoped = { p_business_id: businessId, p_from: from, p_to: to };
      const [main, trend, q, placement] = await Promise.all([
        sb.rpc("owner_roi_summary", scoped),
        advanced ? sb.rpc("owner_roi_daily", scoped) : Promise.resolve({ data: [], error: null }),
        advanced ? sb.rpc("owner_roi_queries", { ...scoped, p_limit: 6 }) : Promise.resolve({ data: [], error: null }),
        advanced ? sb.rpc("owner_roi_placements", scoped) : Promise.resolve({ data: [], error: null }),
      ]);
      if (alive) {
        if (!main.error && Array.isArray(main.data)) setSummary((main.data[0] as SummaryRow | undefined) ?? null);
        else if (main.error) setLoadErr(true); // was silently swallowed → looked like "no activity"
        if (!trend.error && Array.isArray(trend.data)) setDaily(trend.data as DailyRow[]);
        if (!q.error && Array.isArray(q.data)) setQueries(q.data as QueryRow[]);
        if (!placement.error && Array.isArray(placement.data)) setPlacements(placement.data as PlacementRow[]);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [supabase, isLoaded, isSignedIn, advanced, businessId, range]);

  if (loading) {
    return <div className="card mt20" style={{ padding: 28, height: 120, opacity: 0.5 }} aria-busy="true" />;
  }
  if (loadErr) {
    return (
      <div className="dash-soft-alert mt20" role="alert">
        <span><Icon name="warning" size={18} /></span>
        <div>
          <strong>Insights could not refresh</strong>
          <p>We could not load your latest analytics. Refresh in a moment; your listing data is still safe.</p>
        </div>
      </div>
    );
  }

  const total = {
    impressions: summary?.impressions || 0,
    views: summary?.listing_views || 0,
    leads: summary?.lead_actions || 0,
    enquiries: summary?.enquiries || 0,
    whatsapp: summary?.whatsapp_clicks || 0,
    calls: summary?.calls || 0,
    directions: summary?.directions || 0,
    saves: summary?.shortlists || 0,
    offerViews: summary?.offer_views || 0,
    value: summary?.est_value_cents || 0,
  };
  const anyActivity = Object.values(total).some((v) => v > 0);

  // Empty-state (no backend / no owned listings / no events yet).
  if (!anyActivity && !advanced) {
    return (
      <div className="card mt20" style={{ padding: 28, textAlign: "center" }}>
        <div className="empty-ico" style={{ width: 48, height: 48, borderRadius: 14, background: "var(--emerald-50)", margin: "0 auto 12px" }}><Icon name="chart" size={24} /></div>
        <h3 style={{ fontSize: "1.15rem", marginBottom: 6 }}>Your listing insights will appear here</h3>
        <p className="faint" style={{ fontSize: ".9rem", maxWidth: 420, margin: "0 auto" }}>Once your listing is published and getting views, you’ll see profile views, WhatsApp clicks, calls and directions — updated daily.</p>
      </div>
    );
  }

  const cards: [string, number, string?][] = [
    ["Profile views", total.views],
    ["Quote enquiries", total.enquiries, "var(--emerald)"],
    ["WhatsApp taps", total.whatsapp],
    ["Calls", total.calls],
    ["Directions", total.directions],
    ["Shortlisted", total.saves],
  ];
  const trend = daily.map((d) => d.listing_views + d.lead_actions);
  const maxQ = Math.max(...queries.map((q) => q.searches), 1);
  const maxPlacement = Math.max(...placements.map((p) => p.impressions), 1);
  return (
    <div className="mt20">
      <div className="flex between center wrap g10" style={{ marginBottom: 10 }}>
        <p className="faint" style={{ fontSize: ".82rem" }}>Source: first-party Humble Halal interactions · refreshed on load</p>
        <div className="flex g6" role="group" aria-label="Analytics date range">
          {(["7d", "30d", "90d"] as const).map((value) => <button key={value} className={`btn btn-sm ${range === value ? "btn-soft" : "btn-ghost"}`} onClick={() => setRange(value)}>{value === "7d" ? "7 days" : value === "30d" ? "30 days" : "90 days"}</button>)}
        </div>
      </div>
      <div className="admin-statgrid">
        {cards.map(([l, v, c]) => (
          <div key={l} className="stat"><div className="v" style={c ? { color: c } : undefined}>{fmt(v)}</div><div className="l">{l}</div></div>
        ))}
      </div>
      {!advanced && (
        <div className="card" style={{ padding: "14px 18px", marginTop: 14, display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ fontSize: ".9rem", fontWeight: 700, margin: 0 }}>Daily trend &amp; “what people searched” — Premium</p>
            <p className="faint" style={{ fontSize: ".82rem", marginTop: 4 }}>See your views day-by-day and the exact searches that led people to you.</p>
          </div>
          {onUpgrade && <button className="btn btn-gold btn-sm" onClick={onUpgrade}>Upgrade</button>}
        </div>
      )}
      {advanced && trend.length >= 2 && (
        <div className="card" style={{ padding: "14px 18px", marginTop: 14 }}>
          <p className="faint" style={{ fontSize: ".82rem", margin: 0 }}>Views &amp; lead actions per day</p>
          <Sparkline data={trend} />
        </div>
      )}
      {advanced && (
        <div className="card" style={{ padding: 18, marginTop: 14 }}>
          <div className="flex between center wrap g8"><div><p style={{ fontWeight: 800 }}>Business impact</p><p className="faint" style={{ fontSize: ".78rem" }}>Visibility → profile interest → customer action</p></div><span className="pill-tag">Premium</span></div>
          <div className="admin-statgrid" style={{ marginTop: 12 }}>
            <div className="stat"><div className="v">{fmt(total.impressions)}</div><div className="l">Times shown</div></div>
            <div className="stat"><div className="v">{pct(total.views, total.impressions)}%</div><div className="l">View rate</div></div>
            <div className="stat"><div className="v">{fmt(total.leads)}</div><div className="l">Customer actions</div></div>
            <div className="stat"><div className="v">{pct(total.leads, total.views)}%</div><div className="l">View → action</div></div>
            <div className="stat"><div className="v">{sgd(total.value)}</div><div className="l">Est. lead value</div></div>
            <div className="stat"><div className="v">{fmt(total.offerViews)}</div><div className="l">Offer views</div></div>
          </div>
          <p className="faint" style={{ fontSize: ".75rem", marginTop: 10 }}>Estimated lead value is a configurable proxy based on action type. It is not booked revenue or a guaranteed sale.</p>
        </div>
      )}
      {advanced && placements.length > 0 && (
        <div className="card" style={{ padding: "14px 18px", marginTop: 14 }}>
          <p style={{ fontWeight: 800, marginBottom: 10 }}>Where your visibility came from</p>
          <div className="stack g8">{placements.map((p) => <div key={p.placement} className="flex center g10"><span style={{ fontSize: ".84rem", width: 180 }}>{PLACEMENT_LABELS[p.placement] || p.placement}</span><div style={{ flex: 1, height: 8, background: "var(--emerald-50)", borderRadius: 99 }}><div style={{ width: `${Math.round((100 * p.impressions) / maxPlacement)}%`, height: "100%", background: "var(--emerald)", borderRadius: 99 }} /></div><strong style={{ fontSize: ".8rem", width: 36, textAlign: "right" }}>{fmt(p.impressions)}</strong></div>)}</div>
        </div>
      )}
      {advanced && queries.length > 0 && (
        <div className="card" style={{ padding: "14px 18px", marginTop: 14 }}>
          <p className="faint" style={{ fontSize: ".82rem", marginBottom: 10 }}>What people searched before finding you</p>
          <div className="stack g8">
            {queries.map((q) => (
              <div key={q.query} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: ".88rem", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>&ldquo;{q.query}&rdquo;</span>
                <div style={{ flex: 2, height: 8, background: "var(--emerald-50)", borderRadius: 99 }}>
                  <div style={{ width: `${Math.round((100 * q.searches) / maxQ)}%`, height: "100%", background: "var(--emerald)", borderRadius: 99 }} />
                </div>
                <span className="faint" style={{ fontSize: ".8rem", width: 24, textAlign: "right" }}>{fmt(q.searches)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="faint" style={{ fontSize: ".78rem", marginTop: 12 }}>
        Profile views are people opening your listing. Customer actions include enquiries, WhatsApp, calls, website visits, directions and saves. Placement reporting begins when Phase 1 tracking is deployed; older impressions are labeled legacy/unattributed.
      </p>
    </div>
  );
}

export function Sparkline({ data }: { data: number[] }) {
  const w = 600, h = 120, max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - ((v - min) / (max - min)) * (h - 16) - 8]);
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = path + ` L${w} ${h} L0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 130, marginTop: 14 }} preserveAspectRatio="none">
      <defs><linearGradient id="spark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--emerald)" stopOpacity=".22" /><stop offset="1" stopColor="var(--emerald)" stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill="url(#spark)" />
      <path d={path} fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
