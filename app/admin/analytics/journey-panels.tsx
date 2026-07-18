"use client";
// Search-to-lead journey panels (mock #3): device + acquisition-channel
// conversion, high-demand/low-conversion search terms, and a "why users drop
// off" diagnostic. Data comes from the extended fallback route + admin_search_terms;
// the ranking/derivation is pure (lib/analytics-overview).

import { fmt } from "@/lib/analytics-dashboard";
import { searchOpportunities, recommendExperiment, type Funnel, type Channel } from "@/lib/analytics-overview";
import type { SearchRow } from "./dashboard-sections";
import { S } from "./dashboard-sections";

export interface DeviceRow { device: string; sessions: number; leadActions: number; convRate: number }
export interface ChannelRow { channel: Channel; sessions: number; leadActions: number; convRate: number }

const GREEN = "#0F6E56";
const GOLD = "#8A5A0B";
const RED = "#A32D2D";

const CHANNEL_LABEL: Record<Channel, string> = { organic: "Organic search", direct: "Direct", social: "Social", referral: "Referral" };

// ── Conversion by device ─────────────────────────────────────────────────────
export function DevicePanel({ device }: { device: DeviceRow[] }) {
  const rows = [...device].filter((d) => d.sessions > 0).sort((a, b) => b.sessions - a.sessions);
  const max = Math.max(1, ...rows.map((d) => d.sessions));
  return (
    <div style={S.detailCard}>
      <p style={{ ...S.sectionLabel, margin: "0 0 6px" }}>Conversion by device</p>
      {rows.length === 0 ? <p style={{ fontSize: 13, color: "#888" }}>No device data yet.</p> : rows.map((d) => (
        <div key={d.device} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 3, padding: "9px 0", borderTop: "0.5px solid rgba(128,128,128,.14)" }}>
          <span style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{d.device}</span>
          <span style={{ fontSize: 12, color: "#586471" }}>{fmt(d.sessions)} sessions · {d.convRate}%</span>
          <div style={{ gridColumn: "1 / -1", height: 5, borderRadius: 999, background: "rgba(15,110,86,.1)", overflow: "hidden" }}>
            <div style={{ width: `${(100 * d.sessions) / max}%`, height: "100%", background: GREEN, borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Conversion by acquisition channel ────────────────────────────────────────
export function ChannelPanel({ channel }: { channel: ChannelRow[] }) {
  const rows = [...channel].filter((c) => c.sessions > 0).sort((a, b) => b.sessions - a.sessions);
  return (
    <div style={S.detailCard}>
      <p style={{ ...S.sectionLabel, margin: "0 0 6px" }}>Conversion by acquisition channel</p>
      <div style={{ overflowX: "auto" }}>
        <table style={S.table}>
          <thead><tr>{["Channel", "Sessions", "Leads", "Conv."].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.channel} style={{ borderTop: "0.5px solid rgba(128,128,128,.15)" }}>
                <td style={S.td}>{CHANNEL_LABEL[c.channel]}</td>
                <td style={{ ...S.td, textAlign: "right" }}>{fmt(c.sessions)}</td>
                <td style={{ ...S.td, textAlign: "right", color: GREEN, fontWeight: 500 }}>{fmt(c.leadActions)}</td>
                <td style={{ ...S.td, textAlign: "right", color: "#586471" }}>{c.convRate}%</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td style={{ ...S.td, color: "#888" }} colSpan={4}>No channel data yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Search terms: high demand, low conversion ────────────────────────────────
const OPP_STYLE: Record<string, { c: string; bg: string }> = {
  High: { c: RED, bg: "#FCEBEB" }, Medium: { c: GOLD, bg: "#FBF3E0" }, Low: { c: "#6C7682", bg: "rgba(128,128,128,.1)" },
};

export function SearchOpportunitiesPanel({ searches }: { searches: SearchRow[] }) {
  const ops = searchOpportunities(searches, { minSearches: 5, limit: 12 });
  return (
    <div style={S.detailCard}>
      <p style={{ ...S.sectionLabel, margin: "0 0 6px" }}>Search terms with high demand, low conversion</p>
      <div style={{ overflowX: "auto" }}>
        <table style={S.table}>
          <thead><tr>{["Search term", "Searches", "CTR", "Conv.", "Opportunity"].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>
            {ops.map((o) => {
              const st = OPP_STYLE[o.opportunity];
              return (
                <tr key={o.query} style={{ borderTop: "0.5px solid rgba(128,128,128,.15)" }}>
                  <td style={S.td}>&ldquo;{o.query}&rdquo;</td>
                  <td style={{ ...S.td, textAlign: "right" }}>{fmt(o.searches)}</td>
                  <td style={{ ...S.td, textAlign: "right", color: "#586471" }}>{o.ctr}%</td>
                  <td style={{ ...S.td, textAlign: "right", color: "#586471" }}>{o.convRate}%</td>
                  <td style={{ ...S.td, textAlign: "right" }}><span style={{ fontSize: 11, fontWeight: 700, color: st.c, background: st.bg, padding: "2px 8px", borderRadius: 999 }}>{o.opportunity}</span></td>
                </tr>
              );
            })}
            {ops.length === 0 && <tr><td style={{ ...S.td, color: "#888" }} colSpan={5}>Not enough search volume yet to surface opportunities.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Recommended experiment ───────────────────────────────────────────────────
const CONF_STYLE: Record<string, { c: string; bg: string }> = {
  High: { c: GREEN, bg: "#E1F5EE" }, Medium: { c: GOLD, bg: "#FBF3E0" }, Low: { c: "#6C7682", bg: "rgba(128,128,128,.1)" },
};

export function RecommendedExperimentPanel({ funnel, searches }: { funnel: Funnel | null; searches: SearchRow[] }) {
  const exp = recommendExperiment(funnel, searchOpportunities(searches, { minSearches: 5 }));
  if (!exp) return null;
  const conf = CONF_STYLE[exp.confidence];
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap", background: "linear-gradient(135deg,#FBF7EF,#FFFCF5)", border: "1px solid #E5DECE", borderRadius: 16, padding: "16px 20px" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, display: "grid", placeItems: "center", background: "#fff", color: GOLD, fontSize: 22, flexShrink: 0, border: "1px solid #E5DECE" }}>💡</div>
      <div style={{ minWidth: 260, flex: 1 }}>
        <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: GOLD }}>Recommended experiment</p>
        <p style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 800, color: "#1F2933" }}>{exp.title}</p>
        <p style={{ margin: 0, fontSize: 13, color: "#586471" }}>{exp.detail}</p>
      </div>
      <div style={{ textAlign: "center", minWidth: 120 }}>
        <p style={{ margin: 0, fontSize: 22, fontWeight: 850, color: GREEN, letterSpacing: "-.02em" }}>+{exp.upliftMin}–{exp.upliftMax}</p>
        <p style={{ margin: "0 0 6px", fontSize: 11, color: "#7A8490" }}>est. leads / month</p>
        <span style={{ fontSize: 11, fontWeight: 700, color: conf.c, background: conf.bg, padding: "2px 8px", borderRadius: 999 }}>{exp.confidence} confidence</span>
      </div>
    </div>
  );
}

// ── Why users drop off ───────────────────────────────────────────────────────
export function DropoffPanel({ funnel, searches }: { funnel: Funnel | null; searches: SearchRow[] }) {
  const ops = searchOpportunities(searches, { minSearches: 5, limit: 1 });
  const items: { level: "High" | "Medium"; text: string }[] = [];
  if (ops[0]) items.push({ level: "High", text: `Low result-card CTR on "${ops[0].query}" — ${ops[0].ctr}%` });
  if (funnel?.biggestDropoffStage === "listing_views") items.push({ level: "High", text: `Biggest drop is search → listing views (${funnel.viewRate}% view rate)` });
  if (funnel?.biggestDropoffStage === "actions") items.push({ level: "Medium", text: `Listing views aren't converting to actions (${funnel.actionRate}% action rate)` });
  if (funnel?.biggestDropoffStage === "qualified") items.push({ level: "Medium", text: `Actions aren't becoming qualified leads (${funnel.leadRate}% lead rate)` });
  return (
    <div style={S.detailCard}>
      <p style={{ ...S.sectionLabel, margin: "0 0 4px" }}>Why users drop off</p>
      {items.length === 0 ? <p style={{ fontSize: 13, color: "#888" }}>Not enough data to diagnose drop-off yet.</p> : items.map((it, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderTop: "0.5px solid rgba(128,128,128,.14)" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: it.level === "High" ? RED : GOLD, background: it.level === "High" ? "#FCEBEB" : "#FBF3E0", padding: "2px 8px", borderRadius: 999 }}>{it.level}</span>
          <span style={{ fontSize: 13, color: "#1F2933" }}>{it.text}</span>
        </div>
      ))}
    </div>
  );
}
