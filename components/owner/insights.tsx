"use client";

/* Owner listing insights — real per-listing metrics from analytics_events via
   the owner_listing_analytics RPC (0013), summed across the owner's listings.
   Falls back to the published empty-state when there's no backend, no owned
   listings, or no events yet — so the dashboard never breaks in mock mode. */

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { resolveRange, fmt } from "@/lib/analytics-dashboard";
import { useSupabaseBrowser } from "@/lib/supabase/client";
import { canUse } from "@/lib/plans";
import { Icon } from "../ui";

type OwnerRow = {
  listing_views: number; enquiries: number; whatsapp_clicks: number;
  calls: number; directions: number; shortlists: number;
};
type DailyRow = { day: string; listing_views: number; lead_actions: number };
type QueryRow = { query: string; searches: number };

export function OwnerInsights({ plan = "free", onUpgrade }: { plan?: string; onUpgrade?: () => void }) {
  const supabase = useSupabaseBrowser();
  const { isLoaded, isSignedIn } = useUser();
  // Basic totals stay free; the trend + search-insights blocks are the Premium
  // "advanced analytics" differentiator (they were silently free-to-all).
  const advanced = canUse(plan, "analytics");
  const [rows, setRows] = useState<OwnerRow[] | null>(null);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [queries, setQueries] = useState<QueryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isLoaded) return;
      const sb = supabase;
      if (!sb || !isSignedIn) {
        if (alive) {
          setRows(null);
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
      const { from, to } = resolveRange("30d");
      // Trend + top-queries are additive (0045) — their failure never blocks the cards.
      const [main, trend, q] = await Promise.all([
        sb.rpc("owner_listing_analytics", { p_from: from, p_to: to }),
        advanced ? sb.rpc("owner_listing_daily", { p_from: from, p_to: to }) : Promise.resolve({ data: [], error: null }),
        advanced ? sb.rpc("owner_top_queries", { p_from: from, p_to: to, p_limit: 6 }) : Promise.resolve({ data: [], error: null }),
      ]);
      if (alive) {
        if (!main.error && Array.isArray(main.data)) setRows(main.data as OwnerRow[]);
        else if (main.error) setLoadErr(true); // was silently swallowed → looked like "no activity"
        if (!trend.error && Array.isArray(trend.data)) setDaily(trend.data as DailyRow[]);
        if (!q.error && Array.isArray(q.data)) setQueries(q.data as QueryRow[]);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [supabase, isLoaded, isSignedIn, advanced]);

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

  const total = (rows || []).reduce(
    (a, r) => ({
      views: a.views + (r.listing_views || 0),
      enquiries: a.enquiries + (r.enquiries || 0),
      whatsapp: a.whatsapp + (r.whatsapp_clicks || 0),
      calls: a.calls + (r.calls || 0),
      directions: a.directions + (r.directions || 0),
      saves: a.saves + (r.shortlists || 0),
    }),
    { views: 0, enquiries: 0, whatsapp: 0, calls: 0, directions: 0, saves: 0 },
  );
  const anyActivity = rows && rows.length > 0 && Object.values(total).some((v) => v > 0);

  // Empty-state (no backend / no owned listings / no events yet).
  if (!anyActivity) {
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
  return (
    <div className="mt20">
      <p className="faint" style={{ fontSize: ".82rem", marginBottom: 10 }}>Last 30 days · across your listings</p>
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
        Profile views are people opening your listing. Enquiries, WhatsApp taps, calls and directions are high-intent actions —
        each one is a potential customer Humble Halal sent your way.
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
