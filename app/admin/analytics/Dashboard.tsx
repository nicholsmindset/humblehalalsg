"use client";
// Admin business-analytics dashboard (v2). Orchestrator only — row types,
// section tables and shared styles live in ./dashboard-sections.tsx; data
// shapes mirror supabase/migrations/0045_analytics_v2.sql.
//  - every source is date-ranged (pre-0045 the vendor/search views were
//    all-time, so two tabs ignored the range buttons)
//  - admin_summary is fetched twice (current + equal-length previous window)
//    to power the Δ% chips on the KPI cards
//  - partial fetch failures keep last-loaded data, name the failed sections,
//    auto-retry once, and offer a manual Retry

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSession } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { resolveRange, RANGE_LABELS, fmt, pct, type RangeKey } from "@/lib/analytics-dashboard";
import { useSupabaseBrowser } from "@/lib/supabase/client";
import {
  type Summary, type VendorRow, type SearchRow, type AreaRow, type CategoryRow,
  type OpportunityRow, type Journey, type DailyRow, type LeadValueRow,
  S, sgd, badge, DeltaChip, PlanBadge, ListingsTable, SearchSection,
  AreasSection, CategoriesSection, OpportunitiesSection, JourneysSection,
} from "./dashboard-sections";

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

type Tab = "overview" | "listings" | "search" | "areas" | "categories" | "opportunities" | "journeys";
const TAB_LABEL: Record<Tab, string> = {
  overview: "Overview", listings: "Listings", search: "Search", areas: "Areas",
  categories: "Categories", opportunities: "Opportunities", journeys: "Journeys",
};

// Names shown in the error banner — index-aligned with the Promise.all below.
const SECTION_NAMES = [
  "Summary", "Comparison", "Listings", "Trend", "Search",
  "Areas", "Categories", "Opportunities", "Journeys", "Lead values",
] as const;

/** The equal-length window immediately before [from, to) — for Δ% chips. */
function prevWindow(fromIso: string, toIso: string) {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  return { from: new Date(from - (to - from)).toISOString(), to: new Date(from).toISOString() };
}

export default function Dashboard() {
  const supabase = useSupabaseBrowser();
  // Don't fire the first fetch before Clerk hydrates — an anon RPC against the
  // authenticated-only admin_summary would paint a spurious error banner.
  const { isLoaded: authLoaded } = useSession();
  const [range, setRange] = useState<RangeKey>("30d");
  const [cFrom, setCFrom] = useState("");
  const [cTo, setCTo] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [prevSummary, setPrevSummary] = useState<Summary | null>(null);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [searches, setSearches] = useState<SearchRow[]>([]);
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [opps, setOpps] = useState<OpportunityRow[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [leadValues, setLeadValues] = useState<LeadValueRow[]>([]);
  const [openVendor, setOpenVendor] = useState<VendorRow | null>(null);

  // Custom range only takes effect once BOTH dates are chosen — a half-filled
  // range used to refetch (and fail) on every date-input change.
  const win = useMemo(
    () => resolveRange(range, cFrom && cTo ? cFrom : undefined, cFrom && cTo ? cTo : undefined),
    [range, cFrom, cTo],
  );

  // True once any dataset loaded — failed REFRESHES then keep the data on
  // screen with a soft notice instead of a red banner over stale tiles.
  const hasLoaded = useRef(false);
  // One silent retry per window before the banner sticks around.
  const autoRetried = useRef(false);
  const loadRef = useRef<() => Promise<void>>(async () => {});

  const load = useCallback(async () => {
    const sb = supabase;
    if (!sb) {
      // Mock mode: no backend configured → show a zeroed, non-crashing dashboard.
      setSummary(null); setPrevSummary(null); setVendors([]); setDaily([]);
      setSearches([]); setAreas([]); setCats([]); setOpps([]); setJourneys([]);
      setLeadValues([]); setLoading(false); setErr(null);
      return;
    }
    setLoading(true); setErr(null);
    try {
      const { from, to } = win;
      const prev = prevWindow(from, to);
      const results = await Promise.all([
        sb.rpc("admin_summary", { p_from: from, p_to: to }),
        sb.rpc("admin_summary", { p_from: prev.from, p_to: prev.to }),
        sb.rpc("admin_vendor_leads", { p_from: from, p_to: to }),
        sb.from("v_daily_lead_actions").select("*").gte("day", from.slice(0, 10)).lte("day", to.slice(0, 10)),
        sb.rpc("admin_search_terms", { p_from: from, p_to: to, p_limit: 50 }),
        sb.rpc("admin_area_demand", { p_from: from, p_to: to }),
        sb.rpc("admin_category_demand", { p_from: from, p_to: to }),
        sb.rpc("admin_opportunities", { p_from: from, p_to: to, p_limit: 25 }),
        sb.rpc("admin_recent_journeys", { p_from: from, p_to: to, p_limit: 50 }),
        sb.from("analytics_lead_values").select("*"),
      ] as const);
      const [sumRes, prevRes, vendRes, dailyRes, searchRes, areaRes, catRes, oppRes, journeyRes, lvRes] = results;
      // Apply each successful dataset; failures never clobber loaded data.
      if (!sumRes.error) setSummary(Array.isArray(sumRes.data) ? sumRes.data[0] : sumRes.data);
      if (!prevRes.error) setPrevSummary(Array.isArray(prevRes.data) ? prevRes.data[0] : prevRes.data);
      if (!vendRes.error) setVendors((vendRes.data as VendorRow[]) ?? []);
      if (!dailyRes.error) setDaily((dailyRes.data as DailyRow[]) ?? []);
      if (!searchRes.error) setSearches((searchRes.data as SearchRow[]) ?? []);
      if (!areaRes.error) setAreas((areaRes.data as AreaRow[]) ?? []);
      if (!catRes.error) setCats((catRes.data as CategoryRow[]) ?? []);
      if (!oppRes.error) setOpps((oppRes.data as OpportunityRow[]) ?? []);
      if (!journeyRes.error) setJourneys((journeyRes.data as Journey[]) ?? []);
      if (!lvRes.error) setLeadValues((lvRes.data as LeadValueRow[]) ?? []);

      const failedNames = results.flatMap((r, i) => (r.error ? [SECTION_NAMES[i]] : []));
      if (failedNames.length === 0) {
        hasLoaded.current = true;
        setErr(null);
      } else if (!autoRetried.current) {
        // Transient token hiccups clear on a single retry — do it silently.
        autoRetried.current = true;
        setTimeout(() => { void loadRef.current(); }, 1500);
      } else if (failedNames.length < results.length || hasLoaded.current) {
        setErr(`Couldn't refresh: ${failedNames.join(", ")} — showing the last loaded numbers.`);
      } else {
        setErr(sumRes.error?.message || "Failed to load analytics");
      }
    } catch (e) {
      // Network-level failure: keep whatever is on screen.
      setErr(hasLoaded.current
        ? "Couldn't refresh — showing the last loaded numbers."
        : e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [win, supabase]);
  useEffect(() => { loadRef.current = load; }, [load]);

  // Reload whenever the resolved window changes (fresh auto-retry budget).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { autoRetried.current = false; if (authLoaded) load(); }, [load, authLoaded]);

  const saveLeadValue = useCallback(async (action: string, valueCents: number) => {
    const sb = supabase;
    if (!sb) return false;
    const { error } = await sb.rpc("admin_set_lead_value", { p_action: action, p_value_cents: valueCents });
    if (!error) {
      setLeadValues((cur) => cur.map((lv) => (lv.action === action ? { ...lv, value_cents: valueCents } : lv)));
    }
    return !error;
  }, [supabase]);

  // Window-scoped estimated lead value = Σ per-vendor estimates (covers every
  // lead-action type, priced from analytics_lead_values inside the RPC).
  const estValueCents = useMemo(() => vendors.reduce((a, v) => a + (v.est_value_cents || 0), 0), [vendors]);

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={S.logo}>HH</div>
          <div>
            <p style={S.kicker}>Admin analytics</p>
            <p style={S.title}>Business growth dashboard</p>
            <p style={S.sub}>Listings, search demand, leads, and upgrade opportunities in one view.</p>
          </div>
        </div>
        <RangeBar
          range={range} setRange={setRange}
          cFrom={cFrom} cTo={cTo} setCFrom={setCFrom} setCTo={setCTo}
        />
      </header>

      {err && (
        <div style={S.error}>
          <span>⚠ {err}</span>
          <button style={S.retryBtn} onClick={() => { autoRetried.current = true; void load(); }}>Retry</button>
        </div>
      )}

      <Cards summary={summary} prev={prevSummary} estValueCents={estValueCents} loading={loading && summary === null} />

      <nav style={S.tabs}>
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button key={t}
            onClick={() => { setTab(t); setOpenVendor(null); }}
            style={tab === t ? S.tabOn : S.tab}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </nav>

      <section style={S.panel}>
        {loading && summary === null ? <Skeleton /> : (
          <>
            {tab === "overview" && <Overview daily={daily} vendors={vendors} />}
            {tab === "listings" && (openVendor
              ? <VendorDetail v={openVendor} onBack={() => setOpenVendor(null)} />
              : <ListingsTable vendors={vendors} onOpen={setOpenVendor} />)}
            {tab === "search" && <SearchSection searches={searches} />}
            {tab === "areas" && <AreasSection areas={areas} />}
            {tab === "categories" && <CategoriesSection cats={cats} />}
            {tab === "opportunities" && <OpportunitiesSection opps={opps} leadValues={leadValues} onSaveValue={saveLeadValue} />}
            {tab === "journeys" && <JourneysSection journeys={journeys} />}
          </>
        )}
      </section>
    </div>
  );
}

function RangeBar(props: {
  range: RangeKey; setRange: (r: RangeKey) => void;
  cFrom: string; cTo: string; setCFrom: (s: string) => void; setCTo: (s: string) => void;
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

function Cards({ summary, prev, estValueCents, loading }: {
  summary: Summary | null; prev: Summary | null; estValueCents: number; loading: boolean;
}) {
  const s = summary;
  const leads = (x: Summary | null) =>
    x ? x.enquiries + x.whatsapp_clicks + x.calls + x.website_clicks + x.directions : 0;
  const items: { label: string; val: string; cur: number; prev: number | null; hint?: string; accent?: string }[] = [
    { label: "Enquiries", val: fmt(s?.enquiries), cur: s?.enquiries ?? 0, prev: prev?.enquiries ?? null, hint: "the metric you sell", accent: "#0F6E56" },
    { label: "WhatsApp", val: fmt(s?.whatsapp_clicks), cur: s?.whatsapp_clicks ?? 0, prev: prev?.whatsapp_clicks ?? null },
    { label: "Calls", val: fmt(s?.calls), cur: s?.calls ?? 0, prev: prev?.calls ?? null },
    { label: "Total leads", val: fmt(leads(s)), cur: leads(s), prev: prev ? leads(prev) : null, hint: "all lead actions" },
    { label: "Sessions", val: fmt(s?.total_sessions), cur: s?.total_sessions ?? 0, prev: prev?.total_sessions ?? null },
    { label: "Search → lead", val: `${s?.search_conv_rate ?? 0}%`, cur: Number(s?.search_conv_rate ?? 0), prev: prev ? Number(prev.search_conv_rate ?? 0) : null, hint: "of searches convert", accent: "#185FA5" },
    { label: "Est. lead value", val: sgd(estValueCents), cur: estValueCents, prev: null, hint: "configurable per action", accent: "#8A5A0B" },
  ];
  return (
    <div style={S.cards}>
      {items.map((it, i) => (
        <div key={i} style={S.card}>
          <p style={S.cardLabel}>{it.label}</p>
          <p style={{ ...S.cardVal, color: it.accent ?? "inherit" }}>{loading ? "—" : it.val}</p>
          <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
            {!loading && it.prev !== null && <DeltaChip cur={it.cur} prev={it.prev} />}
            {it.hint && <p style={S.cardHint}>{it.hint}</p>}
          </div>
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
      <div style={S.chartGrid}>
        <div style={S.chartCard}>
          <div style={S.chartHead}>
            <p style={S.sectionLabel}>Lead actions over time</p>
            <span style={S.chartHint}>Calls, directions, quotes, saves, and website clicks</span>
          </div>
          <div style={S.chartBody}>
            <LeadsOverTimeChart byDay={byDay} />
          </div>
        </div>

        <div style={S.chartCard}>
          <div style={S.chartHead}>
            <p style={S.sectionLabel}>Enquiries by vendor</p>
            <span style={S.chartHint}>Top listings by quote enquiries</span>
          </div>
          <div style={{ ...S.chartBody, height: Math.max(topVendors.length * 38 + 40, 180) }}>
            <EnquiriesByVendorChart topVendors={topVendors} />
          </div>
        </div>
      </div>
    </>
  );
}

function VendorDetail({ v, onBack }: { v: VendorRow; onBack: () => void }) {
  const supabase = useSupabaseBrowser();
  const [link, setLink] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const ctr = pct(v.listing_views, v.impressions);
  const viewToLead = pct(v.lead_actions, v.listing_views);

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
    ["Saved by users", fmt(v.shortlists)],
    ["Shares", fmt(v.shares)],
    ["Claim clicks", fmt(v.claims)],
    ["Booking clicks", fmt(v.bookings)],
    ["Listing views", fmt(v.listing_views)],
    ["Impression → view (CTR)", `${ctr}%`],
    ["View → lead rate", `${viewToLead}%`],
    ["Est. lead value (window)", sgd(v.est_value_cents)],
  ];

  return (
    <>
      <button onClick={onBack} style={S.backBtn}>‹ All listings</button>
      <div style={S.detailCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>{v.vendor_name ?? v.listing_id}</p>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {v.category && <span style={badge(v.category)}>{v.category}</span>}
            <PlanBadge plan={v.plan} />
          </div>
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#888" }}>What we sent this business</p>
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

function Skeleton() {
  return <div style={{ height: 300, borderRadius: 18, background: "rgba(15,92,74,.08)" }} />;
}
