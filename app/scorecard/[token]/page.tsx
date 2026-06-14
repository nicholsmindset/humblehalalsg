"use client";
// Public, no-login vendor scorecard. The token resolves to ONE listing via the
// vendor_scorecard_by_token RPC; the vendor sees only their own aggregates.
// Adapted from dashboard.zip: uses our null-safe getSb().

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSb, resolveRange, fmt, pct, RANGE_LABELS, type RangeKey } from "@/lib/analytics-dashboard";

interface Card {
  vendor_name: string; category: string; enquiries: number; whatsapp_clicks: number;
  calls: number; website_clicks: number; directions: number; shortlists: number;
  listing_views: number; impressions: number;
}

export default function VendorScorecard() {
  const { token } = useParams<{ token: string }>();
  const [range, setRange] = useState<RangeKey>("30d");
  const [data, setData] = useState<Card | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      const sb = getSb();
      if (!sb) { setErr("This page isn't available yet."); setLoading(false); return; }
      const { from, to } = resolveRange(range);
      const { data, error } = await sb.rpc("vendor_scorecard_by_token", {
        p_token: token, p_from: from, p_to: to,
      });
      if (error) setErr("This link is invalid or has expired.");
      else setData(Array.isArray(data) ? data[0] : data);
      setLoading(false);
    })();
  }, [token, range]);

  if (err) return <div style={W.wrap}><div style={W.err}>{err}</div></div>;

  const leads = data ? data.enquiries + data.whatsapp_clicks + data.calls : 0;
  const ctr = data ? pct(data.listing_views, data.impressions) : "0";
  const viewToLead = data ? pct(leads, data.listing_views) : "0";

  return (
    <div style={W.wrap}>
      <div style={W.head}>
        <p style={W.brand}>Humble Halal</p>
        <p style={W.tag}>Your listing performance</p>
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16, justifyContent: "center" }}>
        {(["today", "7d", "30d", "90d"] as RangeKey[]).map((k) => (
          <button key={k} onClick={() => setRange(k)} style={range === k ? W.pillOn : W.pill}>
            {RANGE_LABELS[k]}
          </button>
        ))}
      </div>

      <div style={W.card}>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{loading ? "…" : data?.vendor_name}</p>
        <p style={{ margin: "2px 0 16px", fontSize: 13, color: "#888", textTransform: "capitalize" }}>
          {data?.category} · {RANGE_LABELS[range].toLowerCase()}
        </p>

        <div style={W.hero}>
          <p style={{ margin: 0, fontSize: 13, color: "#0F6E56" }}>Quote enquiries we sent you</p>
          <p style={{ margin: 0, fontSize: 40, fontWeight: 600, color: "#0F6E56" }}>{loading ? "—" : fmt(data?.enquiries)}</p>
        </div>

        <div style={W.grid}>
          <Stat label="WhatsApp clicks" val={fmt(data?.whatsapp_clicks)} />
          <Stat label="Phone calls" val={fmt(data?.calls)} />
          <Stat label="Website clicks" val={fmt(data?.website_clicks)} />
          <Stat label="Directions" val={fmt(data?.directions)} />
          <Stat label="Shortlisted" val={fmt(data?.shortlists)} />
          <Stat label="Listing views" val={fmt(data?.listing_views)} />
        </div>

        <div style={W.funnel}>
          <span>Shown <strong>{fmt(data?.impressions)}</strong> times</span>
          <span>→ <strong>{ctr}%</strong> opened your listing</span>
          <span>→ <strong>{viewToLead}%</strong> of those became a lead</span>
        </div>
      </div>

      <p style={W.foot}>Updated live · powered by Humble Halal directory analytics</p>
    </div>
  );
}

function Stat({ label, val }: { label: string; val: string }) {
  return (
    <div style={W.stat}>
      <p style={{ margin: 0, fontSize: 12, color: "#888" }}>{label}</p>
      <p style={{ margin: "2px 0 0", fontSize: 22, fontWeight: 500 }}>{val}</p>
    </div>
  );
}

const W: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 480, margin: "0 auto", padding: "2rem 1rem", fontFamily: "system-ui, sans-serif" },
  head: { textAlign: "center", marginBottom: 20 },
  brand: { margin: 0, fontSize: 14, fontWeight: 600, color: "#0F6E56", letterSpacing: ".02em" },
  tag: { margin: "2px 0 0", fontSize: 13, color: "#888" },
  pill: { fontSize: 12, padding: "6px 12px", borderRadius: 99, border: "1px solid #ddd", background: "#fff", color: "#888", cursor: "pointer" },
  pillOn: { fontSize: 12, padding: "6px 12px", borderRadius: 99, border: "1px solid #0F6E56", background: "#E1F5EE", color: "#0F6E56", cursor: "pointer" },
  card: { background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: "1.25rem" },
  hero: { background: "#E1F5EE", borderRadius: 12, padding: "1rem 1.25rem", textAlign: "center", marginBottom: 16 },
  grid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 16 },
  stat: { background: "#fafafa", borderRadius: 10, padding: "0.75rem 0.9rem" },
  funnel: { display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#555", borderTop: "1px solid #f0f0f0", paddingTop: 14 },
  foot: { textAlign: "center", fontSize: 11, color: "#bbb", marginTop: 16 },
  err: { background: "#FCEBEB", color: "#A32D2D", padding: "1rem", borderRadius: 12, fontSize: 14, textAlign: "center" },
};
