"use client";
// Section components, row types, and shared styles for the admin business
// dashboard (Dashboard.tsx). Split out to keep the orchestrator readable —
// everything here is presentational + small local state (lead-value drafts).
// Data shapes mirror supabase/migrations/0045_analytics_v2.sql.

import { useState } from "react";
import { fmt, pct, LEAD_LABELS } from "@/lib/analytics-dashboard";

// ---- row types (RPC return shapes from 0045_analytics_v2.sql) --------------

export interface Summary {
  total_sessions: number; total_page_views: number; total_lead_actions: number;
  enquiries: number; whatsapp_clicks: number; calls: number; website_clicks: number;
  directions: number; shortlists: number; searches: number; search_conv_rate: number | null;
}
export interface VendorRow {
  listing_id: string; vendor_name: string; category: string | null; area: string | null;
  plan: string; enquiries: number; whatsapp_clicks: number; calls: number;
  website_clicks: number; directions: number; shortlists: number; shares: number;
  claims: number; bookings: number; lead_actions: number; listing_views: number;
  impressions: number; est_value_cents: number; last_event_at: string;
}
export interface SearchRow {
  query: string; searches: number; zero_result_searches: number;
  result_clicks: number; searches_that_converted: number;
}
export interface AreaRow {
  area: string; listing_views: number; lead_actions: number; impressions: number;
  vendors_active: number; paid_vendors: number; top_category: string | null;
  top_listing: string | null; top_listing_name: string | null;
}
export interface CategoryRow {
  category: string; listing_views: number; lead_actions: number; impressions: number;
  vendors_active: number; paid_vendors: number; top_listing: string | null;
  top_listing_name: string | null;
}
export interface OpportunityRow {
  listing_id: string; vendor_name: string; category: string | null; area: string | null;
  plan: string; lead_actions: number; claims: number; shortlists: number;
  listing_views: number; est_value_cents: number; suggested_offer: string;
}
export interface Journey {
  session_id: string; session_start: string; entry_path: string; pages_viewed: number;
  listings_viewed: number; used_search: boolean; final_action: string;
  final_category: string; final_action_at: string;
}
export interface DailyRow { day: string; lead_action_type: string; category: string; actions: number }
export interface LeadValueRow { action: string; value_cents: number }

// ---- labels & money ---------------------------------------------------------

export const OFFER_LABELS: Record<string, string> = {
  claim_followup: "Follow up claim",
  featured: "Pitch Featured",
  verified: "Pitch Verified",
  premium: "Pitch Premium",
  nurture: "Nurture",
};

// LEAD_LABELS covers the classic six; 0045 added five more lead actions.
const ACTION_LABELS: Record<string, string> = {
  ...LEAD_LABELS,
  share: "Share", claim: "Claim", booking: "Booking",
  menu: "Menu view", cert_view: "Cert view",
};
const ACTION_ORDER = [
  "enquiry_form", "whatsapp", "call", "booking", "claim", "website",
  "directions", "shortlist", "share", "menu", "cert_view",
];

/** Cents → "S$1,234" (whole dollars) or "S$12.50" when there are cents. */
export const sgd = (cents: number | null | undefined) => {
  const c = cents ?? 0;
  const dp = c % 100 === 0 ? 0 : 2;
  return `S$${(c / 100).toLocaleString("en-SG", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
};

// ---- CSV export -------------------------------------------------------------

const csvCell = (v: unknown): string => {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Client-side CSV download. Headers come from the first row's keys. */
export function downloadCsv(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(csvCell).join(","),
    ...rows.map((r) => headers.map((h) => csvCell(r[h])).join(",")),
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---- small shared pieces ----------------------------------------------------

export const badge = (cat: string): React.CSSProperties => ({
  background: "#E6F1FB",
  color: "#0C447C",
  padding: "2px 8px", borderRadius: 8, fontSize: 11,
  textTransform: "capitalize",
  ...(cat ? {} : { visibility: "hidden" }),
});

const PLAN_STYLE: Record<string, { bg: string; fg: string }> = {
  free: { bg: "rgba(128,128,128,.12)", fg: "#666" },
  verified: { bg: "#E6F1FB", fg: "#0C447C" },
  featured: { bg: "#FBF3E0", fg: "#8A5A0B" },
  premium: { bg: "#E1F5EE", fg: "#0F6E56" },
};

export function PlanBadge({ plan }: { plan: string | null | undefined }) {
  const p = plan || "free";
  const c = PLAN_STYLE[p] ?? PLAN_STYLE.free;
  return (
    <span style={{ background: c.bg, color: c.fg, padding: "2px 8px", borderRadius: 8, fontSize: 11, textTransform: "capitalize", whiteSpace: "nowrap" }}>
      {p}
    </span>
  );
}

/** Δ% vs previous window. "—" when there's no previous baseline. */
export function DeltaChip({ cur, prev }: { cur: number; prev: number | null }) {
  if (prev == null || prev === 0) return <span style={S.deltaFlat}>—</span>;
  const d = ((cur - prev) / prev) * 100;
  if (Math.abs(d) < 0.05) return <span style={S.deltaFlat}>0%</span>;
  const up = d > 0;
  return (
    <span style={up ? S.deltaUp : S.deltaDown}>
      {up ? "▲" : "▼"} {Math.abs(d).toFixed(Math.abs(d) >= 10 ? 0 : 1)}%
    </span>
  );
}

/** Section label with an optional "Export CSV" button beside it. */
export function SectionHead({ label, csvRows, csvName }: {
  label: string; csvRows?: Record<string, unknown>[]; csvName?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, margin: "0 0 6px" }}>
      <p style={{ ...S.sectionLabel, margin: 0 }}>{label}</p>
      {csvRows && csvName && (
        <button style={S.csvBtn} disabled={!csvRows.length} onClick={() => downloadCsv(csvRows, csvName)}>
          Export CSV
        </button>
      )}
    </div>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return <tr><td style={{ ...S.td, color: "#888" }} colSpan={colSpan}>{text}</td></tr>;
}

// ---- Listings ----------------------------------------------------------------

export function ListingsTable({ vendors, onOpen }: { vendors: VendorRow[]; onOpen: (v: VendorRow) => void }) {
  const rows = [...vendors].sort((a, b) => b.lead_actions - a.lead_actions);
  const csvRows = rows.map((v) => ({
    vendor: v.vendor_name, slug: v.listing_id, category: v.category ?? "", area: v.area ?? "",
    plan: v.plan, views: v.listing_views, leads: v.lead_actions,
    view_to_lead_pct: pct(v.lead_actions, v.listing_views),
    enquiries: v.enquiries, whatsapp: v.whatsapp_clicks, calls: v.calls,
    website: v.website_clicks, directions: v.directions, shortlists: v.shortlists,
    shares: v.shares, claims: v.claims, bookings: v.bookings, impressions: v.impressions,
    est_value_sgd: ((v.est_value_cents ?? 0) / 100).toFixed(2), last_event_at: v.last_event_at,
  }));
  return (
    <>
      <SectionHead label="Listing performance — leads, plan, and estimated value" csvRows={csvRows} csvName="listing-performance.csv" />
      <div style={{ overflowX: "auto" }}>
        <table style={S.table}>
          <thead><tr>
            {["Vendor", "Category", "Area", "Plan", "Views", "Leads", "View→lead", "Est. value", ""].map((h) => (
              <th key={h} style={S.th}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.listing_id} style={S.tr} onClick={() => onOpen(v)}>
                <td style={S.td}>{v.vendor_name}</td>
                <td style={S.td}><span style={badge(v.category ?? "")}>{v.category}</span></td>
                <td style={{ ...S.td, color: "#888" }}>{v.area ?? "—"}</td>
                <td style={S.td}><PlanBadge plan={v.plan} /></td>
                <td style={{ ...S.td, textAlign: "right" }}>{fmt(v.listing_views)}</td>
                <td style={{ ...S.td, textAlign: "right", fontWeight: 500, color: "#0F6E56" }}>{fmt(v.lead_actions)}</td>
                <td style={{ ...S.td, textAlign: "right", color: "#888" }}>{pct(v.lead_actions, v.listing_views)}%</td>
                <td style={{ ...S.td, textAlign: "right", fontWeight: 500 }}>{sgd(v.est_value_cents)}</td>
                <td style={{ ...S.td, textAlign: "right", color: "#888" }}>›</td>
              </tr>
            ))}
            {rows.length === 0 && <EmptyRow colSpan={9} text="No listing activity yet." />}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---- Search ------------------------------------------------------------------

export function SearchSection({ searches }: { searches: SearchRow[] }) {
  const rows = [...searches].sort((a, b) => b.searches - a.searches);
  const gaps = rows.filter((r) => r.zero_result_searches > 0);
  const csvRows = rows.map((r) => ({
    query: r.query, searches: r.searches, zero_result_searches: r.zero_result_searches,
    result_clicks: r.result_clicks, searches_that_converted: r.searches_that_converted,
    pct_converted: pct(r.searches_that_converted, r.searches),
  }));
  return (
    <>
      {gaps.length > 0 && (
        <div style={S.callout}>
          <p style={S.calloutTitle}>Demand gaps — searches that returned nothing</p>
          <p style={S.calloutBody}>
            {gaps.slice(0, 10).map((g) => `“${g.query}” (${fmt(g.searches)})`).join("  ·  ")}
          </p>
          <p style={S.calloutHint}>People wanted these and found no results — recruit vendors for them or fix search synonyms.</p>
        </div>
      )}
      <SectionHead label="What users type, and what converts" csvRows={csvRows} csvName="search-terms.csv" />
      <div style={{ overflowX: "auto" }}>
        <table style={S.table}>
          <thead><tr>
            {["Query", "Searches", "Zero results", "Result clicks", "% → lead"].map((h) => (
              <th key={h} style={S.th}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.map((r) => {
              const rate = +pct(r.searches_that_converted, r.searches, 0);
              return (
                <tr key={r.query} style={{ borderTop: "0.5px solid rgba(128,128,128,.15)" }}>
                  <td style={S.td}>&ldquo;{r.query}&rdquo;</td>
                  <td style={{ ...S.td, textAlign: "right" }}>{fmt(r.searches)}</td>
                  <td style={{ ...S.td, textAlign: "right" }}>
                    {r.zero_result_searches > 0
                      ? <span style={S.zeroBadge}>{fmt(r.zero_result_searches)}</span>
                      : <span style={{ color: "#bbb" }}>0</span>}
                  </td>
                  <td style={{ ...S.td, textAlign: "right", color: "#888" }}>{fmt(r.result_clicks)}</td>
                  <td style={{ ...S.td, textAlign: "right", fontWeight: 500, color: rate >= 35 ? "#0F6E56" : "#888" }}>{rate}%</td>
                </tr>
              );
            })}
            {rows.length === 0 && <EmptyRow colSpan={5} text="No searches in this window yet." />}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---- Areas & Categories --------------------------------------------------------

export function AreasSection({ areas }: { areas: AreaRow[] }) {
  const csvRows = areas.map((a) => ({
    area: a.area, views: a.listing_views, leads: a.lead_actions, impressions: a.impressions,
    active_vendors: a.vendors_active, paid_vendors: a.paid_vendors,
    top_category: a.top_category ?? "", top_listing: a.top_listing_name ?? "",
  }));
  return (
    <>
      <SectionHead label="Demand by area" csvRows={csvRows} csvName="area-demand.csv" />
      <div style={{ overflowX: "auto" }}>
        <table style={S.table}>
          <thead><tr>
            {["Area", "Views", "Leads", "Impressions", "Active vendors", "Paid vendors", "Top category", "Top listing"].map((h) => (
              <th key={h} style={S.th}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {areas.map((a) => (
              <tr key={a.area} style={{ borderTop: "0.5px solid rgba(128,128,128,.15)" }}>
                <td style={{ ...S.td, fontWeight: 500 }}>{a.area}</td>
                <td style={{ ...S.td, textAlign: "right" }}>{fmt(a.listing_views)}</td>
                <td style={{ ...S.td, textAlign: "right", fontWeight: 500, color: "#0F6E56" }}>{fmt(a.lead_actions)}</td>
                <td style={{ ...S.td, textAlign: "right", color: "#888" }}>{fmt(a.impressions)}</td>
                <td style={{ ...S.td, textAlign: "right" }}>{fmt(a.vendors_active)}</td>
                <td style={{ ...S.td, textAlign: "right", color: a.paid_vendors > 0 ? "#0F6E56" : "#888" }}>{fmt(a.paid_vendors)}</td>
                <td style={S.td}><span style={badge(a.top_category ?? "")}>{a.top_category}</span></td>
                <td style={{ ...S.td, color: "#888" }}>{a.top_listing_name ?? "—"}</td>
              </tr>
            ))}
            {areas.length === 0 && <EmptyRow colSpan={8} text="No area activity in this window yet." />}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function CategoriesSection({ cats }: { cats: CategoryRow[] }) {
  const csvRows = cats.map((c) => ({
    category: c.category, views: c.listing_views, leads: c.lead_actions, impressions: c.impressions,
    active_vendors: c.vendors_active, paid_vendors: c.paid_vendors, top_listing: c.top_listing_name ?? "",
  }));
  return (
    <>
      <SectionHead label="Demand by category" csvRows={csvRows} csvName="category-demand.csv" />
      <div style={{ overflowX: "auto" }}>
        <table style={S.table}>
          <thead><tr>
            {["Category", "Views", "Leads", "Impressions", "Active vendors", "Paid vendors", "Top listing"].map((h) => (
              <th key={h} style={S.th}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.category} style={{ borderTop: "0.5px solid rgba(128,128,128,.15)" }}>
                <td style={S.td}><span style={badge(c.category)}>{c.category}</span></td>
                <td style={{ ...S.td, textAlign: "right" }}>{fmt(c.listing_views)}</td>
                <td style={{ ...S.td, textAlign: "right", fontWeight: 500, color: "#0F6E56" }}>{fmt(c.lead_actions)}</td>
                <td style={{ ...S.td, textAlign: "right", color: "#888" }}>{fmt(c.impressions)}</td>
                <td style={{ ...S.td, textAlign: "right" }}>{fmt(c.vendors_active)}</td>
                <td style={{ ...S.td, textAlign: "right", color: c.paid_vendors > 0 ? "#0F6E56" : "#888" }}>{fmt(c.paid_vendors)}</td>
                <td style={{ ...S.td, color: "#888" }}>{c.top_listing_name ?? "—"}</td>
              </tr>
            ))}
            {cats.length === 0 && <EmptyRow colSpan={7} text="No category activity in this window yet." />}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---- Opportunities + lead-value settings ---------------------------------------

export function OpportunitiesSection({ opps, leadValues, onSaveValue }: {
  opps: OpportunityRow[];
  leadValues: LeadValueRow[];
  onSaveValue: (action: string, valueCents: number) => Promise<boolean>;
}) {
  const csvRows = opps.map((o) => ({
    vendor: o.vendor_name, slug: o.listing_id, category: o.category ?? "", area: o.area ?? "",
    plan: o.plan, leads: o.lead_actions, claims: o.claims, saves: o.shortlists,
    views: o.listing_views, est_value_sgd: ((o.est_value_cents ?? 0) / 100).toFixed(2),
    suggested_offer: OFFER_LABELS[o.suggested_offer] ?? o.suggested_offer,
  }));
  return (
    <>
      <SectionHead label="Who to pitch first — free/underpriced listings by value delivered" csvRows={csvRows} csvName="opportunities.csv" />
      <div style={{ overflowX: "auto" }}>
        <table style={S.table}>
          <thead><tr>
            {["Vendor", "Category / Area", "Plan", "Leads", "Claims", "Saves", "Views", "Est. value", "Suggested offer"].map((h) => (
              <th key={h} style={S.th}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {opps.map((o) => (
              <tr key={o.listing_id} style={{ borderTop: "0.5px solid rgba(128,128,128,.15)" }}>
                <td style={{ ...S.td, fontWeight: 500 }}>{o.vendor_name}</td>
                <td style={{ ...S.td, color: "#888", textTransform: "capitalize" }}>
                  {o.category ?? "—"}{o.area ? ` · ${o.area}` : ""}
                </td>
                <td style={S.td}><PlanBadge plan={o.plan} /></td>
                <td style={{ ...S.td, textAlign: "right", fontWeight: 500, color: "#0F6E56" }}>{fmt(o.lead_actions)}</td>
                <td style={{ ...S.td, textAlign: "right", color: o.claims > 0 ? "#8A5A0B" : "#888" }}>{fmt(o.claims)}</td>
                <td style={{ ...S.td, textAlign: "right", color: "#888" }}>{fmt(o.shortlists)}</td>
                <td style={{ ...S.td, textAlign: "right", color: "#888" }}>{fmt(o.listing_views)}</td>
                <td style={{ ...S.td, textAlign: "right", fontWeight: 500 }}>{sgd(o.est_value_cents)}</td>
                <td style={S.td}><span style={S.offerBadge}>{OFFER_LABELS[o.suggested_offer] ?? o.suggested_offer}</span></td>
              </tr>
            ))}
            {opps.length === 0 && <EmptyRow colSpan={9} text="No open opportunities in this window — every active listing is on a paid plan already." />}
          </tbody>
        </table>
      </div>
      <LeadValueSettings values={leadValues} onSave={onSaveValue} />
    </>
  );
}

function LeadValueSettings({ values, onSave }: {
  values: LeadValueRow[];
  onSave: (action: string, valueCents: number) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [failedAction, setFailedAction] = useState<string | null>(null);

  const sorted = [...values].sort((a, b) => {
    const ia = ACTION_ORDER.indexOf(a.action); const ib = ACTION_ORDER.indexOf(b.action);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const clearDraft = (action: string) =>
    setDrafts((d) => { const next = { ...d }; delete next[action]; return next; });

  const commit = async (action: string, currentCents: number) => {
    const raw = drafts[action];
    if (raw == null) return; // untouched
    const dollars = parseFloat(raw);
    if (!isFinite(dollars) || dollars < 0) { clearDraft(action); return; } // reject garbage, restore
    const cents = Math.round(dollars * 100);
    clearDraft(action);
    if (cents === currentCents) return;
    setFailedAction(null);
    const ok = await onSave(action, cents); // parent applies the optimistic update
    if (!ok) setFailedAction(action);
  };

  return (
    <div style={{ marginTop: 20 }}>
      <button style={S.collapseBtn} onClick={() => setOpen((o) => !o)}>
        {open ? "▾" : "▸"} Lead value settings
        <span style={{ color: "#aaa", fontWeight: 400 }}> — what each action is worth (drives every Est. value)</span>
      </button>
      {open && (
        <div style={{ ...S.detailCard, marginTop: 8 }}>
          {sorted.map((v, i) => (
            <div key={v.action} style={{ ...S.statRow, ...(i === 0 ? { borderTop: "none" } : {}) }}>
              <span style={{ fontSize: 13 }}>
                {ACTION_LABELS[v.action] ?? v.action}
                {failedAction === v.action && <span style={{ color: "#A32D2D", fontSize: 12 }}> — couldn&apos;t save, try again</span>}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "#888" }}>S$</span>
                <input
                  type="number" min={0} step={0.5} style={S.valInput}
                  value={drafts[v.action] ?? String(v.value_cents / 100)}
                  onChange={(e) => setDrafts((d) => ({ ...d, [v.action]: e.target.value }))}
                  onBlur={() => { void commit(v.action, v.value_cents); }}
                  onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                />
              </span>
            </div>
          ))}
          {sorted.length === 0 && <p style={{ fontSize: 13, color: "#888" }}>Lead values haven&apos;t loaded (run migration 0045).</p>}
        </div>
      )}
    </div>
  );
}

// ---- Journeys -------------------------------------------------------------------

export function JourneysSection({ journeys }: { journeys: Journey[] }) {
  return (
    <>
      <p style={S.sectionLabel}>Recent converting sessions</p>
      <div style={S.detailCard}>
        {journeys.map((j, i) => (
          <div key={j.session_id} style={{
            display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
            padding: "10px 0", fontSize: 12.5,
            borderTop: i ? "0.5px solid rgba(128,128,128,.15)" : "none",
          }}>
            <span style={{ color: "#888" }}>⚑ {j.entry_path || "direct"}</span>
            <span style={{ color: "#bbb" }}>→</span>
            <span style={{ color: "#888" }}>{j.listings_viewed} listings</span>
            <span style={{ color: "#bbb" }}>→</span>
            <span style={{ ...badge(j.final_category || ""), background: "#E1F5EE", color: "#0F6E56" }}>
              {LEAD_LABELS[j.final_action] ?? j.final_action}
            </span>
            <span style={{ marginLeft: "auto", color: "#bbb" }}>{timeAgo(j.final_action_at)}</span>
          </div>
        ))}
        {journeys.length === 0 && <p style={{ fontSize: 13, color: "#888" }}>No converting sessions in this window yet.</p>}
      </div>
    </>
  );
}

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

// ---- styles (shared with Dashboard.tsx) -------------------------------------------
export const S: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1080, margin: "0 auto", padding: "1.5rem 1rem", fontFamily: "system-ui, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  logo: { width: 32, height: 32, borderRadius: 8, background: "#E1F5EE", color: "#0F6E56", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 13 },
  title: { margin: 0, fontSize: 15, fontWeight: 500 },
  sub: { margin: 0, fontSize: 12, color: "#999" },
  error: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#FCEBEB", color: "#A32D2D", padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 12 },
  retryBtn: { fontSize: 12, padding: "4px 12px", borderRadius: 8, border: "0.5px solid #A32D2D", background: "transparent", color: "#A32D2D", cursor: "pointer", whiteSpace: "nowrap" },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 20 },
  card: { background: "rgba(128,128,128,.06)", borderRadius: 8, padding: "0.85rem 1rem" },
  cardLabel: { margin: "0 0 4px", fontSize: 12, color: "#888" },
  cardVal: { margin: 0, fontSize: 24, fontWeight: 500 },
  cardHint: { margin: "3px 0 0", fontSize: 11, color: "#aaa" },
  deltaUp: { fontSize: 11, fontWeight: 600, color: "#0F6E56", background: "#E1F5EE", padding: "2px 6px", borderRadius: 6, whiteSpace: "nowrap" },
  deltaDown: { fontSize: 11, fontWeight: 600, color: "#A32D2D", background: "#FCEBEB", padding: "2px 6px", borderRadius: 6, whiteSpace: "nowrap" },
  deltaFlat: { fontSize: 11, color: "#999", background: "rgba(128,128,128,.1)", padding: "2px 6px", borderRadius: 6, whiteSpace: "nowrap" },
  tabs: { display: "flex", gap: 4, flexWrap: "wrap", borderBottom: "0.5px solid rgba(128,128,128,.2)", marginBottom: 16 },
  tab: { fontSize: 13, padding: "8px 14px", border: "none", borderBottom: "2px solid transparent", background: "transparent", color: "#888", cursor: "pointer" },
  tabOn: { fontSize: 13, padding: "8px 14px", border: "none", borderBottom: "2px solid #0F6E56", background: "transparent", color: "#111", fontWeight: 500, cursor: "pointer" },
  pill: { fontSize: 12, padding: "5px 10px", borderRadius: 8, border: "0.5px solid rgba(128,128,128,.3)", background: "transparent", color: "#888", cursor: "pointer" },
  pillOn: { fontSize: 12, padding: "5px 10px", borderRadius: 8, border: "0.5px solid #185FA5", background: "#E6F1FB", color: "#0C447C", cursor: "pointer" },
  date: { fontSize: 12, padding: "5px 8px", borderRadius: 8, border: "0.5px solid rgba(128,128,128,.3)" },
  sectionLabel: { margin: "0 0 6px", fontSize: 13, color: "#888" },
  csvBtn: { fontSize: 11, padding: "4px 10px", borderRadius: 8, border: "0.5px solid rgba(128,128,128,.3)", background: "transparent", color: "#666", cursor: "pointer", whiteSpace: "nowrap" },
  detailCard: { background: "#fff", border: "0.5px solid rgba(128,128,128,.2)", borderRadius: 12, padding: "0.85rem 1.25rem" },
  heroStat: { background: "#E1F5EE", borderRadius: 8, padding: "0.85rem 1rem", marginBottom: 8 },
  statRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "0.5px solid rgba(128,128,128,.15)" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: 6, fontSize: 11, color: "#aaa", fontWeight: 500, textAlign: "left" },
  tr: { cursor: "pointer", borderTop: "0.5px solid rgba(128,128,128,.15)" },
  td: { padding: "9px 6px", fontSize: 13 },
  backBtn: { fontSize: 12, padding: "5px 10px", marginBottom: 10, borderRadius: 8, border: "0.5px solid rgba(128,128,128,.3)", background: "transparent", color: "#888", cursor: "pointer" },
  shareBtn: { fontSize: 13, padding: "9px 14px", borderRadius: 8, border: "0.5px solid #0F6E56", background: "#E1F5EE", color: "#0F6E56", cursor: "pointer" },
  linkBox: { background: "rgba(128,128,128,.06)", borderRadius: 8, padding: "10px 12px" },
  linkCode: { display: "block", fontSize: 12, wordBreak: "break-all", margin: "4px 0 8px", fontFamily: "monospace" },
  copyBtn: { fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "0.5px solid rgba(128,128,128,.3)", background: "transparent", cursor: "pointer" },
  callout: { background: "#FBF3E0", border: "0.5px solid rgba(138,90,11,.25)", borderRadius: 12, padding: "10px 14px", marginBottom: 14 },
  calloutTitle: { margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "#8A5A0B" },
  calloutBody: { margin: 0, fontSize: 13, color: "#6B4A10", lineHeight: 1.6 },
  calloutHint: { margin: "4px 0 0", fontSize: 11, color: "#A08040" },
  zeroBadge: { background: "#FCEBEB", color: "#A32D2D", padding: "1px 7px", borderRadius: 8, fontSize: 11, fontWeight: 600 },
  offerBadge: { background: "#E1F5EE", color: "#0F6E56", padding: "2px 8px", borderRadius: 8, fontSize: 11, whiteSpace: "nowrap" },
  collapseBtn: { fontSize: 13, fontWeight: 500, padding: "8px 12px", borderRadius: 8, border: "0.5px solid rgba(128,128,128,.25)", background: "rgba(128,128,128,.05)", color: "#333", cursor: "pointer", textAlign: "left", width: "100%" },
  valInput: { width: 90, fontSize: 13, padding: "5px 8px", borderRadius: 8, border: "0.5px solid rgba(128,128,128,.3)", textAlign: "right" },
};
