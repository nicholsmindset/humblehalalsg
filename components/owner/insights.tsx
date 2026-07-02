"use client";

/* Owner listing insights — real per-listing metrics from analytics_events via
   the owner_listing_analytics RPC (0013), summed across the owner's listings.
   Falls back to the published empty-state when there's no backend, no owned
   listings, or no events yet — so the dashboard never breaks in mock mode. */

import { useEffect, useState } from "react";
import { resolveRange, fmt } from "@/lib/analytics-dashboard";
import { useSupabaseBrowser } from "@/lib/supabase/client";
import { Icon } from "../ui";

type OwnerRow = {
  listing_views: number; enquiries: number; whatsapp_clicks: number;
  calls: number; directions: number; shortlists: number;
};

export function OwnerInsights() {
  const supabase = useSupabaseBrowser();
  const [rows, setRows] = useState<OwnerRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = supabase;
      if (!sb) { if (alive) setLoading(false); return; }
      const { from, to } = resolveRange("30d");
      const { data, error } = await sb.rpc("owner_listing_analytics", { p_from: from, p_to: to });
      if (alive) {
        if (!error && Array.isArray(data)) setRows(data as OwnerRow[]);
        else if (error) setLoadErr(true); // was silently swallowed → looked like "no activity"
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [supabase]);

  if (loading) {
    return <div className="card mt20" style={{ padding: 28, height: 120, opacity: 0.5 }} aria-busy="true" />;
  }
  if (loadErr) {
    return <div className="card mt20" style={{ padding: 20 }}><p className="faint" role="alert">Couldn&apos;t load your insights — refresh to try again.</p></div>;
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
  return (
    <div className="mt20">
      <p className="faint" style={{ fontSize: ".82rem", marginBottom: 10 }}>Last 30 days · across your listings</p>
      <div className="admin-statgrid">
        {cards.map(([l, v, c]) => (
          <div key={l} className="stat"><div className="v" style={c ? { color: c } : undefined}>{fmt(v)}</div><div className="l">{l}</div></div>
        ))}
      </div>
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
