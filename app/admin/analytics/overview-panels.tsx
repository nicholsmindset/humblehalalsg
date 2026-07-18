"use client";
// Overview-tab panels (mock #2): executive insight, conversion funnel, platform
// health and recent alerts. Presentational — data is derived server-side
// (lib/analytics-overview) and passed in. Shares the S style vocabulary + sgd.

import { fmt, pct } from "@/lib/analytics-dashboard";
import type { Funnel, Insight, Alert } from "@/lib/analytics-overview";
import type { CategoryRow } from "./dashboard-sections";
import { S } from "./dashboard-sections";

export interface Health {
  activeListings: number;
  verifiedProfiles: number;
  expiringCerts: number;
  moderationPending: number;
  listingsCompletePct: number;
}

const GREEN = "#0F6E56";
const GOLD = "#8A5A0B";
const RED = "#A32D2D";

// ── Executive insight banner ─────────────────────────────────────────────────
export function InsightBanner({ insight }: { insight: Insight }) {
  const bg = insight.tone === "positive" ? "#E1F5EE" : insight.tone === "watch" ? "#FBF3E0" : "#F1EBDD";
  const fg = insight.tone === "positive" ? GREEN : insight.tone === "watch" ? GOLD : "#6C7682";
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", background: bg, border: `1px solid ${fg}33`, borderRadius: 16, padding: "14px 18px", marginBottom: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center", background: "#fff", color: fg, fontSize: 20, flexShrink: 0 }}>★</div>
      <div style={{ minWidth: 240, flex: 1 }}>
        <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: fg }}>Executive insight</p>
        <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 800, color: "#1F2933" }}>{insight.headline}</p>
        <p style={{ margin: 0, fontSize: 13, color: "#586471" }}>{insight.detail}</p>
      </div>
    </div>
  );
}

// ── Conversion funnel ────────────────────────────────────────────────────────
export function FunnelPanel({ funnel }: { funnel: Funnel | null }) {
  const stages = funnel?.stages ?? [];
  const empty = !funnel || stages.every((s) => s.value === 0);
  return (
    <div style={S.chartCard}>
      <div style={S.chartHead}>
        <p style={{ ...S.sectionLabel, margin: 0 }}>Conversion funnel</p>
        <span style={S.chartHint}>Sessions → listing views → actions → qualified leads</span>
      </div>
      {empty ? (
        <p style={{ fontSize: 13, color: "#888", padding: "24px 0", textAlign: "center" }}>No funnel activity in this window yet.</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 6, alignItems: "stretch", overflowX: "auto", paddingBottom: 4 }}>
            {stages.map((st, i) => {
              const isDrop = funnel!.biggestDropoffStage === st.key;
              return (
                <div key={st.key} style={{ display: "flex", alignItems: "stretch", gap: 6, minWidth: 0 }}>
                  {i > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minWidth: 44 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: isDrop ? RED : "#9AA4AF" }}>−{(100 - st.pctOfPrev).toFixed(0)}%</span>
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 116, borderRadius: 14, padding: "14px 14px", color: "#fff", background: isDrop ? "linear-gradient(160deg,#B24A38,#8F3A2B)" : "linear-gradient(160deg,#12525B,#0D3A41)" }}>
                    <p style={{ margin: 0, fontSize: 24, fontWeight: 850, letterSpacing: "-.02em" }}>{fmt(st.value)}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,.82)" }}>{st.label}</p>
                    {i > 0 && <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,.66)" }}>{st.pctOfTop}% of sessions</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 12, fontSize: 12, color: "#586471" }}>
            <span><b style={{ color: GREEN }}>{funnel!.viewRate}%</b> view rate</span>
            <span><b style={{ color: GREEN }}>{funnel!.actionRate}%</b> action rate</span>
            <span><b style={{ color: GREEN }}>{funnel!.leadRate}%</b> lead rate</span>
          </div>
        </>
      )}
    </div>
  );
}

// ── Platform health ──────────────────────────────────────────────────────────
function HealthRow({ label, value, status }: { label: string; value: string; status: { text: string; color: string; bg: string } }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "11px 0", borderTop: "0.5px solid rgba(128,128,128,.14)" }}>
      <span style={{ fontSize: 13, color: "#1F2933" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <b style={{ fontSize: 14 }}>{value}</b>
        <span style={{ fontSize: 11, fontWeight: 700, color: status.color, background: status.bg, padding: "2px 8px", borderRadius: 999 }}>{status.text}</span>
      </span>
    </div>
  );
}

const HEALTHY = { text: "Healthy", color: GREEN, bg: "#E1F5EE" };
const ATTENTION = { text: "Attention", color: GOLD, bg: "#FBF3E0" };
const CRITICAL = { text: "Critical", color: RED, bg: "#FCEBEB" };

export function PlatformHealthPanel({ health }: { health: Health | null }) {
  const h = health;
  return (
    <div style={S.detailCard}>
      <p style={{ ...S.sectionLabel, margin: "0 0 2px" }}>Platform health</p>
      <HealthRow label="Active listings" value={fmt(h?.activeListings)} status={HEALTHY} />
      <HealthRow label="Verified profiles" value={fmt(h?.verifiedProfiles)} status={HEALTHY} />
      <HealthRow label="Listings complete" value={`${h?.listingsCompletePct ?? 0}%`} status={(h?.listingsCompletePct ?? 0) >= 70 ? HEALTHY : ATTENTION} />
      <HealthRow label="Pending moderation" value={fmt(h?.moderationPending)} status={(h?.moderationPending ?? 0) > 0 ? ATTENTION : HEALTHY} />
      <HealthRow label="Expiring certificates" value={fmt(h?.expiringCerts)} status={(h?.expiringCerts ?? 0) > 0 ? CRITICAL : HEALTHY} />
    </div>
  );
}

// ── Recent alerts ────────────────────────────────────────────────────────────
const ALERT_DOT: Record<Alert["level"], string> = { critical: RED, attention: GOLD, info: GREEN };

export function RecentAlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <div style={S.detailCard}>
      <p style={{ ...S.sectionLabel, margin: "0 0 2px" }}>Recent alerts</p>
      {alerts.length === 0 ? (
        <p style={{ fontSize: 13, color: "#888", padding: "12px 0 4px" }}>All clear — no alerts right now.</p>
      ) : alerts.map((a, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 0", borderTop: "0.5px solid rgba(128,128,128,.14)" }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: ALERT_DOT[a.level], marginTop: 5, flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1F2933" }}>{a.title}</p>
            {a.detail && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#7A8490" }}>{a.detail}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Top-performing categories ────────────────────────────────────────────────
export function TopCategoriesPanel({ cats, trends, spark }: {
  cats: CategoryRow[];
  trends?: Record<string, number[]>;
  spark?: (data: number[]) => React.ReactNode;
}) {
  const rows = [...cats].sort((a, b) => b.lead_actions - a.lead_actions).slice(0, 6);
  const maxLeads = Math.max(1, ...rows.map((c) => c.lead_actions));
  return (
    <div style={S.detailCard}>
      <p style={{ ...S.sectionLabel, margin: "0 0 6px" }}>Top-performing categories</p>
      {rows.length === 0 ? (
        <p style={{ fontSize: 13, color: "#888", padding: "8px 0" }}>No category activity in this window yet.</p>
      ) : rows.map((c) => {
        const trend = trends?.[c.category];
        return (
          <div key={c.category} style={{ display: "grid", gridTemplateColumns: "1fr 64px auto", gap: 8, alignItems: "center", padding: "9px 0", borderTop: "0.5px solid rgba(128,128,128,.14)" }}>
            <span style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{c.category}</span>
            <span style={{ height: 22 }}>{spark && trend && trend.some((n) => n > 0) ? spark(trend) : null}</span>
            <span style={{ fontSize: 12, color: "#586471", textAlign: "right" }}>{fmt(c.lead_actions)} leads · {pct(c.lead_actions, c.listing_views)}%</span>
            <div style={{ gridColumn: "1 / -1", height: 5, borderRadius: 999, background: "rgba(15,110,86,.1)", overflow: "hidden" }}>
              <div style={{ width: `${(100 * c.lead_actions) / maxLeads}%`, height: "100%", background: GREEN, borderRadius: 999 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
