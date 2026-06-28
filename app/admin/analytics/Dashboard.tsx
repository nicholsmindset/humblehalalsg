"use client";
// Admin lead-analytics dashboard. Adapted from dashboard.zip/Dashboard.tsx:
//  - data client comes from our null-safe getSb() (empty state in mock mode)
//  - listing_id in views/RPCs is the LISTING SLUG (see 0010_analytics.sql)

import { useEffect, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  resolveRange, RANGE_LABELS, LEAD_LABELS, fmt, pct, type RangeKey,
} from "@/lib/analytics-dashboard";
import { useSupabaseBrowser } from "@/lib/supabase/client";

// Recharts is code-split into its own chunk (loaded only after the dashboard
// shell paints, and only on this auth-gated route — never on public pages).
const chartLoading = () => (
  <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "rgba(128,128,128,.6)", fontSize: 13 }}>Loading chart…</div>
);
const LeadsOverTimeChart = dynamic(
  () => import("./analytics-charts").then((m) => m.LeadsOverTimeChart),
  { ssr: false, loading: chartLoading },
);
const EnquiriesByVendorChart = dynamic(
  () => import("./analytics-charts").then((m) => m.EnquiriesByVendorChart),
  { ssr: false, loading: chartLoading },
);

type Tab = "overview" | "vendors" | "search" | "journeys";

interface Summary {
  total_sessions: number; total_page_views: number; total_lead_actions: number;
  enquiries: number; whatsapp_clicks: number; calls: number; website_clicks: number;
  directions: number; shortlists: number; searches: number; search_conv_rate: number;
}
interface VendorRow {
  listing_id: string; category: string; enquiries: number; whatsapp_clicks: number;
  calls: number; website_clicks: number; directions: number; shortlists: number;
  listing_views: number; impressions: number; last_event_at: string; vendor_name?: string;
}
interface SearchRow { query: string; searches: number; searches_that_converted: number }
interface Journey {
  session_id: string; session_start: string; entry_path: string; pages_viewed: number;
  listings_viewed: number; used_search: boolean; final_action: string;
  final_category: string; final_action_at: string;
}
interface DailyRow { day: string; lead_action_type: string; category: string; actions: number }

export default function Dashboard() {
  const supabase = useSupabaseBrowser();
  const [range, setRange] = useState<RangeKey>("30d");
  const [cFrom, setCFrom] = useState("");
  const [cTo, setCTo] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [searches, setSearches] = useState<SearchRow[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [openVendor, setOpenVendor] = useState<VendorRow | null>(null);

  const win = useMemo(
    () => resolveRange(range, cFrom || undefined, cTo || undefined),
    [range, cFrom, cTo],
  );

  const load = useCallback(async () => {
    const sb = supabase;
    if (!sb) {
      // Mock mode: no backend configured → show a zeroed, non-crashing dashboard.
      setSummary(null); setVendors([]); setDaily([]); setSearches([]); setJourneys([]);
      setLoading(false); setErr(null);
      return;
    }
    setLoading(true); setErr(null);
    try {
      const { from, to } = win;
      const [sumRes, vendRes, dailyRes, searchRes, journeyRes] = await Promise.all([
        sb.rpc("admin_summary", { p_from: from, p_to: to }),
        sb.from("v_vendor_leads").select("*"),
        sb.from("v_daily_lead_actions").select("*").gte("day", from.slice(0, 10)).lte("day", to.slice(0, 10)),
        sb.from("v_search_intelligence").select("*").limit(25),
        sb.rpc("admin_recent_journeys", { p_from: from, p_to: to, p_limit: 50 }),
      ]);
      if (sumRes.error) throw sumRes.error;
      setSummary(Array.isArray(sumRes.data) ? sumRes.data[0] : sumRes.data);
      setVendors((vendRes.data as VendorRow[]) ?? []);
      setDaily((dailyRes.data as DailyRow[]) ?? []);
      setSearches((searchRes.data as SearchRow[]) ?? []);
      setJourneys((journeyRes.data as Journey[]) ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [win, supabase]);

  // Reload whenever the resolved window changes. load() drives its own loading
  // state; this is an external-fetch effect, not derived state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={S.logo}>HH</div>
          <div>
            <p style={S.title}>Humble Halal · lead analytics</p>
            <p style={S.sub}>admin</p>
          </div>
        </div>
        <RangeBar
          range={range} setRange={setRange}
          cFrom={cFrom} cTo={cTo} setCFrom={setCFrom} setCTo={setCTo}
          onReload={load}
        />
      </header>

      {err && <div style={S.error}>⚠ {err}</div>}

      <Cards summary={summary} loading={loading} />

      <nav style={S.tabs}>
        {(["overview", "vendors", "search", "journeys"] as Tab[]).map((t) => (
          <button key={t}
            onClick={() => { setTab(t); setOpenVendor(null); }}
            style={tab === t ? S.tabOn : S.tab}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </nav>

      <section>
        {loading ? <Skeleton /> : (
          <>
            {tab === "overview" && <Overview daily={daily} vendors={vendors} />}
            {tab === "vendors" && (openVendor
              ? <VendorDetail v={openVendor} onBack={() => setOpenVendor(null)} />
              : <Vendors vendors={vendors} onOpen={setOpenVendor} />)}
            {tab === "search" && <Search searches={searches} />}
            {tab === "journeys" && <Journeys journeys={journeys} />}
          </>
        )}
      </section>
    </div>
  );
}

const TAB_LABEL: Record<Tab, string> = {
  overview: "Overview", vendors: "Vendors", search: "Search", journeys: "Journeys",
};

function RangeBar(props: {
  range: RangeKey; setRange: (r: RangeKey) => void;
  cFrom: string; cTo: string; setCFrom: (s: string) => void; setCTo: (s: string) => void;
  onReload: () => void;
}) {
  const { range, setRange, cFrom, cTo, setCFrom, setCTo } = props;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {(Object.keys(RANGE_LABELS) as RangeKey[]).map((k) => (
          <button key={k} onClick={() => setRange(k)}
            style={range === k ? S.pillOn : S.pill}>{RANGE_LABELS[k]}</button>
        ))}
      </div>
      {range === "custom" && (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="date" value={cFrom} onChange={(e) => setCFrom(e.target.value)} style={S.date} />
          <span style={{ fontSize: 12, color: "#888" }}>to</span>
          <input type="date" value={cTo} onChange={(e) => setCTo(e.target.value)} style={S.date} />
        </div>
      )}
    </div>
  );
}

function Cards({ summary, loading }: { summary: Summary | null; loading: boolean }) {
  const s = summary;
  const leads = s ? s.enquiries + s.whatsapp_clicks + s.calls + s.website_clicks + s.directions : 0;
  const items = [
    { label: "Enquiries", val: fmt(s?.enquiries), hint: "the metric you sell", accent: "#0F6E56" },
    { label: "WhatsApp", val: fmt(s?.whatsapp_clicks) },
    { label: "Calls", val: fmt(s?.calls) },
    { label: "Total leads", val: fmt(leads), hint: "all lead actions" },
    { label: "Sessions", val: fmt(s?.total_sessions) },
    { label: "Search → lead", val: `${s?.search_conv_rate ?? 0}%`, hint: "of searches convert", accent: "#185FA5" },
  ];
  return (
    <div style={S.cards}>
      {items.map((it, i) => (
        <div key={i} style={S.card}>
          <p style={S.cardLabel}>{it.label}</p>
          <p style={{ ...S.cardVal, color: it.accent ?? "inherit" }}>{loading ? "—" : it.val}</p>
          {it.hint && <p style={S.cardHint}>{it.hint}</p>}
        </div>
      ))}
    </div>
  );
}

function Overview({ daily, vendors }: { daily: DailyRow[]; vendors: VendorRow[] }) {
  // pivot daily rows -> [{day, enquiry_form, whatsapp, ...}]
  const byDay = useMemo(() => {
    const map: Record<string, Record<string, number | string>> = {};
    daily.forEach((r) => {
      const d = (map[r.day] ??= { day: r.day });
      d[r.lead_action_type] = ((d[r.lead_action_type] as number) ?? 0) + r.actions;
    });
    return Object.values(map).sort((a, b) => String(a.day).localeCompare(String(b.day)));
  }, [daily]);

  const topVendors = useMemo(
    () => [...vendors].sort((a, b) => b.enquiries - a.enquiries).slice(0, 8)
      .map((v) => ({ name: v.vendor_name ?? v.listing_id.slice(0, 8), enquiries: v.enquiries })),
    [vendors],
  );

  return (
    <>
      <p style={S.sectionLabel}>Lead actions over time</p>
      <div style={{ height: 260, marginBottom: 24 }}>
        <LeadsOverTimeChart byDay={byDay} />
      </div>

      <p style={S.sectionLabel}>Enquiries by vendor</p>
      <div style={{ height: Math.max(topVendors.length * 38 + 40, 160) }}>
        <EnquiriesByVendorChart topVendors={topVendors} />
      </div>
    </>
  );
}

function Vendors({ vendors, onOpen }: { vendors: VendorRow[]; onOpen: (v: VendorRow) => void }) {
  const rows = [...vendors].sort((a, b) => b.enquiries - a.enquiries);
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={S.table}>
        <thead><tr>
          {["Vendor", "Category", "Enquiries", "WhatsApp", "Calls", "Impressions", ""].map((h) => (
            <th key={h} style={S.th}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.listing_id} style={S.tr} onClick={() => onOpen(v)}>
              <td style={S.td}>{v.vendor_name ?? v.listing_id.slice(0, 8)}</td>
              <td style={S.td}><span style={badge(v.category)}>{v.category}</span></td>
              <td style={{ ...S.td, textAlign: "right", fontWeight: 500, color: "#0F6E56" }}>{fmt(v.enquiries)}</td>
              <td style={{ ...S.td, textAlign: "right" }}>{fmt(v.whatsapp_clicks)}</td>
              <td style={{ ...S.td, textAlign: "right" }}>{fmt(v.calls)}</td>
              <td style={{ ...S.td, textAlign: "right", color: "#888" }}>{fmt(v.impressions)}</td>
              <td style={{ ...S.td, textAlign: "right", color: "#888" }}>›</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td style={{ ...S.td, color: "#888" }} colSpan={7}>No vendor activity yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function VendorDetail({ v, onBack }: { v: VendorRow; onBack: () => void }) {
  const supabase = useSupabaseBrowser();
  const [link, setLink] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const ctr = pct(v.listing_views, v.impressions);
  const viewToLead = pct(v.enquiries + v.whatsapp_clicks + v.calls, v.listing_views);

  const mintLink = async () => {
    const sb = supabase;
    if (!sb) { setLink("Error: backend not configured"); return; }
    setMinting(true);
    try {
      const { data, error } = await sb.rpc("admin_create_share_token", {
        p_listing_slug: v.listing_id,
        p_vendor_name: v.vendor_name ?? "Vendor",
        p_category: v.category,
        p_expires_at: null,
      });
      if (error) throw error;
      setLink(`${location.origin}/scorecard/${data}`);
    } catch (e) {
      setLink(`Error: ${e instanceof Error ? e.message : "could not create link"}`);
    } finally { setMinting(false); }
  };

  const stats: [string, string | number][] = [
    ["WhatsApp clicks", fmt(v.whatsapp_clicks)],
    ["Phone calls", fmt(v.calls)],
    ["Website clicks", fmt(v.website_clicks)],
    ["Directions", fmt(v.directions)],
    ["Shortlisted by users", fmt(v.shortlists)],
    ["Listing views", fmt(v.listing_views)],
    ["Impression → view (CTR)", `${ctr}%`],
    ["View → lead rate", `${viewToLead}%`],
  ];

  return (
    <>
      <button onClick={onBack} style={S.backBtn}>‹ All vendors</button>
      <div style={S.detailCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>{v.vendor_name ?? v.listing_id}</p>
          <span style={{ ...badge(v.category), background: "#E1F5EE", color: "#0F6E56" }}>★ Featured</span>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#888" }}>What we sent you</p>
        <div style={S.heroStat}>
          <p style={{ margin: 0, fontSize: 12, color: "#0F6E56" }}>Quote enquiries</p>
          <p style={{ margin: 0, fontSize: 30, fontWeight: 500, color: "#0F6E56" }}>{fmt(v.enquiries)}</p>
        </div>
        {stats.map(([label, val], i) => (
          <div key={i} style={S.statRow}>
            <span style={{ fontSize: 13, color: "#888" }}>{label}</span>
            <span style={{ fontSize: 15, fontWeight: 500 }}>{val}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        {!link ? (
          <button onClick={mintLink} disabled={minting} style={S.shareBtn}>
            {minting ? "Creating…" : "🔗 Create shareable link for this vendor"}
          </button>
        ) : (
          <div style={S.linkBox}>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "#888" }}>
              Send this to the vendor — they see only their own numbers, no login:
            </p>
            <code style={S.linkCode}>{link}</code>
            <button style={S.copyBtn} onClick={() => navigator.clipboard.writeText(link)}>Copy</button>
          </div>
        )}
      </div>
    </>
  );
}

function Search({ searches }: { searches: SearchRow[] }) {
  const rows = [...searches].sort((a, b) => b.searches - a.searches);
  const max = Math.max(...rows.map((r) => r.searches), 1);
  return (
    <>
      <p style={S.sectionLabel}>What users type, and what converts</p>
      <div style={S.detailCard}>
        {rows.map((s, i) => {
          const rate = +pct(s.searches_that_converted, s.searches, 0);
          return (
            <div key={i} style={{ padding: "8px 0", borderTop: i ? "0.5px solid rgba(128,128,128,.15)" : "none" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 13, flex: 1 }}>&ldquo;{s.query}&rdquo;</span>
                <span style={{ fontSize: 12, color: "#888" }}>{fmt(s.searches)} searches</span>
                <span style={{ fontSize: 12, fontWeight: 500, width: 84, textAlign: "right", color: rate >= 35 ? "#0F6E56" : "#888" }}>
                  {rate}% → lead
                </span>
              </div>
              <div style={{ height: 8, background: "rgba(128,128,128,.12)", borderRadius: 99 }}>
                <div style={{ width: `${Math.round((100 * s.searches) / max)}%`, height: "100%", background: "#0F6E56", borderRadius: 99 }} />
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p style={{ fontSize: 13, color: "#888" }}>No searches in this window yet.</p>}
      </div>
    </>
  );
}

function Journeys({ journeys }: { journeys: Journey[] }) {
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

function Skeleton() {
  return <div style={{ height: 240, borderRadius: 12, background: "rgba(128,128,128,.08)" }} />;
}

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

const badge = (cat: string): React.CSSProperties => ({
  background: "#E6F1FB",
  color: "#0C447C",
  padding: "2px 8px", borderRadius: 8, fontSize: 11,
  textTransform: "capitalize",
  ...(cat ? {} : { visibility: "hidden" }),
});

// ---- styles ---------------------------------------------------------------
const S: Record<string, React.CSSProperties> = {
  page: { maxWidth: 920, margin: "0 auto", padding: "1.5rem 1rem", fontFamily: "system-ui, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  logo: { width: 32, height: 32, borderRadius: 8, background: "#E1F5EE", color: "#0F6E56", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, fontSize: 13 },
  title: { margin: 0, fontSize: 15, fontWeight: 500 },
  sub: { margin: 0, fontSize: 12, color: "#999" },
  error: { background: "#FCEBEB", color: "#A32D2D", padding: "8px 12px", borderRadius: 8, fontSize: 13, marginBottom: 12 },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 20 },
  card: { background: "rgba(128,128,128,.06)", borderRadius: 8, padding: "0.85rem 1rem" },
  cardLabel: { margin: "0 0 4px", fontSize: 12, color: "#888" },
  cardVal: { margin: 0, fontSize: 24, fontWeight: 500 },
  cardHint: { margin: "3px 0 0", fontSize: 11, color: "#aaa" },
  tabs: { display: "flex", gap: 4, borderBottom: "0.5px solid rgba(128,128,128,.2)", marginBottom: 16 },
  tab: { fontSize: 13, padding: "8px 14px", border: "none", borderBottom: "2px solid transparent", background: "transparent", color: "#888", cursor: "pointer" },
  tabOn: { fontSize: 13, padding: "8px 14px", border: "none", borderBottom: "2px solid #0F6E56", background: "transparent", color: "#111", fontWeight: 500, cursor: "pointer" },
  pill: { fontSize: 12, padding: "5px 10px", borderRadius: 8, border: "0.5px solid rgba(128,128,128,.3)", background: "transparent", color: "#888", cursor: "pointer" },
  pillOn: { fontSize: 12, padding: "5px 10px", borderRadius: 8, border: "0.5px solid #185FA5", background: "#E6F1FB", color: "#0C447C", cursor: "pointer" },
  date: { fontSize: 12, padding: "5px 8px", borderRadius: 8, border: "0.5px solid rgba(128,128,128,.3)" },
  sectionLabel: { margin: "0 0 6px", fontSize: 13, color: "#888" },
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
};
