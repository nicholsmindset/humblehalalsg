"use client";

/* Humble Halal — Admin Dashboard (ported from screens-admin.jsx) */
import { Fragment, useEffect, useState, type FormEvent } from "react";
import { HHData } from "@/lib/data";
import type { BadgeKey, Listing } from "@/lib/types";
import { halalSgSearchUrl } from "@/lib/muis";
import { useApp } from "../app-context";
import { useDirectory } from "../directory-context";
import { useSupabaseBrowser } from "@/lib/supabase/client";
import { Badge, Empty, Icon, ImagePh } from "../ui";
import { NotificationBell } from "../notification-bell";
import { fmtSGD } from "@/lib/fees";
import { FLAG_COLUMN, type FlagKey } from "@/lib/flags";
import { BLOCKED_AD_CATEGORIES } from "@/lib/ad-safety";
import { useUser } from "@clerk/nextjs";
import { AdminVerdicts } from "./admin-verdicts";
import { AdminLeads } from "./admin-leads";

/* ── Live moderation-queue wiring ───────────────────────────────────────────
   Sections fetch from /api/admin/queue (admin-gated). When the backend isn't
   configured or the caller isn't an admin (dev/demo), the fetch returns null
   and the section keeps its mock rows so the console stays explorable. */
type QueueRow = Record<string, unknown> & { id: string };

async function queueGet(type: string): Promise<QueueRow[] | null> {
  try {
    const r = await fetch(`/api/admin/queue?type=${type}`);
    if (!r.ok) return null;
    const d = await r.json();
    return d.ok ? (d.items as QueueRow[]) : null;
  } catch {
    return null;
  }
}

async function queueAct(type: string, id: string, action: string): Promise<{ ok: boolean; error?: string; status?: string }> {
  try {
    const r = await fetch("/api/admin/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, action }),
    });
    const d = await r.json().catch(() => ({ ok: false, error: "bad_response" }));
    return { ok: !!d.ok, error: d.error, status: d.status };
  } catch {
    return { ok: false, error: "network_error" };
  }
}

/* Human-readable messages for the queue route's error codes, so a failed admin
   action says WHY (e.g. duplicate slug, not admin) instead of "Action failed". */
const QUEUE_ERR: Record<string, string> = {
  forbidden: "You're not signed in as an admin.",
  unauthenticated: "Please sign in again.",
  slug_exists: "A published listing with that name already exists.",
  publish_failed: "Couldn't publish — a database error occurred.",
  not_found: "That item no longer exists.",
  action_failed: "The action failed — please try again.",
  network_error: "Network error — please try again.",
};
function queueErr(e?: string): string { return (e && QUEUE_ERR[e]) || "Action failed — please try again."; }

/* /api/admin/revenue is consumed by BOTH the Revenue and Rollout sections —
   share one in-flight/settled promise (60s TTL) instead of refetching on every
   section switch. */
let revenueCache: { at: number; p: Promise<Record<string, unknown> | null> } | null = null;
function getRevenue(): Promise<Record<string, unknown> | null> {
  if (revenueCache && Date.now() - revenueCache.at < 60_000) return revenueCache.p;
  const p = fetch("/api/admin/revenue")
    .then(async (r) => { const j = await r.json(); return j.ok ? (j as Record<string, unknown>) : null; })
    .catch(() => null);
  revenueCache = { at: Date.now(), p };
  return p;
}

function timeAgo(iso?: unknown): string {
  const t = typeof iso === "string" ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return "—";
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function AdminScreen({ halalVerdictsEnabled = false, leadRoutingEnabled = false }: { halalVerdictsEnabled?: boolean; leadRoutingEnabled?: boolean }) {
  const { navigate, toast, state } = useApp();
  const [section, setSection] = useState<string>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const pick = (id: string) => {
    setSection(id);
    setNavOpen(false);
  };

  const nav: [string, string, string][] = [
    ["overview", "Overview", "chart"],
    ["revenue", "Revenue (P&L)", "trend"],
    ["rollout", "Rollout plan", "megaphone"],
    ["approvals", "Listing approvals", "doc"],
    ...(leadRoutingEnabled ? [["leads", "Lead pipeline", "briefcase"] as [string, string, string]] : []),
    ["claims", "Ownership claims", "building"],
    ["businesses", "Businesses", "store"],
    ["suggestions", "Suggestions", "sparkles"],
    ["events", "Event approvals", "calendar"],
    ["verification", "Halal verification", "shield-check"],
    ...(halalVerdictsEnabled ? [["verdicts", "Halal verdicts", "shield-check"] as [string, string, string]] : []),
    ["hotels", "Hotel verification", "bed"],
    ["reviews", "Review moderation", "star"],
    ["reports", "Reports & corrections", "flag"],
    ["users", "Users & owners", "user"],
    ["catalog", "Categories & areas", "tag"],
    ["featured", "Featured & ads", "trophy"],
    ["monetization", "Monetization", "settings"],
    ["payments", "Payments", "dollar"],
    ["travel-rev", "Travel revenue", "plane"],
    ["audit", "Audit log", "list"],
  ];

  return (
    <div className="admin">
      {navOpen && <div className="admin-side-veil" onClick={()=>setNavOpen(false)} />}
      <aside className={`admin-side ${navOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <div className="hh-logo"><div className="mark"><Icon name="crescent" size={18}/></div><div className="name" style={{fontSize:'1rem'}}>Humble Halal<small>Admin</small></div></div>
          <button className="admin-side-close" onClick={()=>setNavOpen(false)} aria-label="Close menu"><Icon name="x" size={20}/></button>
        </div>
        <nav className="admin-nav">
          {nav.map(([id,label,icon])=>(
            <button key={id} className={section===id?'on':''} onClick={()=>pick(id)}><Icon name={icon} size={18}/> {label}</button>
          ))}
        </nav>
        <button className="btn btn-ghost btn-sm" style={{margin:16}} onClick={()=>navigate('home')}><Icon name="logout" size={16}/> Exit admin</button>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <div className="flex g10 center"><button className="map-iconbtn admin-menu" onClick={()=>setNavOpen(true)} aria-label="Open menu" style={{width:40,height:40}}><Icon name="menu" size={18}/></button>
            <h1 style={{fontSize:'1.3rem'}}>{nav.find(n=>n[0]===section)?.[1]}</h1></div>
          <div className="flex g10 center">
            <button className="btn btn-soft btn-sm" onClick={()=>navigate(state.user.role==='owner'?'owner-dashboard':'user-dashboard')} title="Back to my dashboard"><Icon name="back" size={15}/> My dashboard</button>
            <NotificationBell />
            <span className="avatar" style={{background:'var(--emerald)',color:'#fff'}}>A</span>
          </div>
        </div>

        <div className="admin-body">
          {section==='overview' && <AdminOverview setSection={setSection} />}
          {section==='revenue' && <AdminRevenue />}
          {section==='rollout' && <AdminRollout />}
          {section==='approvals' && <AdminApprovals toast={toast} navigate={navigate} />}
          {section==='leads' && leadRoutingEnabled && <AdminLeads toast={toast} />}
          {section==='claims' && <AdminClaims toast={toast} navigate={navigate} />}
          {section==='businesses' && <AdminBusinesses toast={toast} />}
          {section==='suggestions' && <AdminSuggestions toast={toast} />}
          {section==='events' && <AdminEvents toast={toast} navigate={navigate} />}
          {section==='verification' && <><AdminCertQueue toast={toast} /><AdminVerification toast={toast} /></>}
          {section==='verdicts' && halalVerdictsEnabled && <AdminVerdicts toast={toast} />}
          {section==='hotels' && <AdminHotelVerify toast={toast} />}
          {section==='reviews' && <AdminReviews toast={toast} />}
          {section==='reports' && <AdminReports toast={toast} navigate={navigate} />}
          {section==='users' && <AdminUsers toast={toast} />}
          {section==='catalog' && <AdminCatalog toast={toast} />}
          {section==='featured' && <AdminFeatured toast={toast} />}
          {section==='monetization' && <AdminMonetization />}
          {section==='payments' && <AdminPayments />}
          {section==='travel-rev' && <AdminTravelRevenue />}
          {section==='audit' && <AdminAudit />}
        </div>
      </div>
    </div>
  );
}

/* Global flag → readable copy for the Monetization toggles. Order within each
   group below is the display order. */
const FLAG_COPY: Record<FlagKey, { title: string; desc: string }> = {
  paidTickets: { title: "Paid event tickets", desc: "Let businesses sell paid tickets (Stripe Connect). When OFF, every event is free RSVP only and the paid checkout API is blocked server-side." },
  paidAds: { title: "Paid advertising", desc: "Enable purchasable ad placements on the Advertise page. When OFF, ad CTAs invite enquiries instead of charging." },
  paidPlans: { title: "Paid listing plans", desc: "Enable Verified / Featured / Premium subscriptions on the Pricing page and billing." },
  paidHotels: { title: "Paid hotel bookings", desc: "Enable live hotel payments via LiteAPI. When OFF, hotel search stays browse-only (no checkout)." },
  paidFlights: { title: "Paid flight bookings", desc: "Enable live flight payments via LiteAPI. Requires Vercel Pro for the 10-minute retry cron before going live." },
  payNow: { title: "PayNow", desc: "Accept PayNow as a checkout method alongside cards, where supported." },
  paidLeads: { title: "Paid lead marketplace", desc: "Businesses pay to receive routed customer leads instead of receiving them for free." },
  certVault: { title: "Cert Vault", desc: "Certificate upload & verification vault for businesses claiming halal certification." },
  semanticSearch: { title: "Semantic search", desc: "AI-powered semantic search across listings and travel results." },
  aiConcierge: { title: "AI concierge", desc: "The AI concierge / Ask-Hotel assistant surfaced to visitors." },
  halalVerdicts: { title: "Halal verdicts", desc: "Admin halal-verdict workflow surfaced on listing pages." },
  leadRouting: { title: "Lead routing", desc: "Automatically route customer enquiries to matching businesses." },
  passport: { title: "Halal Passport", desc: "The gamified Halal Passport check-in feature." },
};
const PAYMENT_FLAG_KEYS: FlagKey[] = ["paidTickets", "paidAds", "paidPlans", "paidHotels", "paidFlights", "payNow", "paidLeads"];
const FEATURE_FLAG_KEYS: FlagKey[] = (Object.keys(FLAG_COLUMN) as FlagKey[]).filter((k) => !PAYMENT_FLAG_KEYS.includes(k));

/* Single flag row — reuses the cert-toggle/cert-switch/cert-knob switch markup
   used elsewhere in this file (Ramadan mode, Cert Vault, etc). `value` is the
   platform_settings column value: true/false = explicit override, null = no
   override (falls back to the env var server-side). */
function GlobalFlagRow({ flagKey, value, onToggle }: { flagKey: FlagKey; value: boolean | null; onToggle: (next: boolean) => void }) {
  const { title, desc } = FLAG_COPY[flagKey];
  const on = value === true;
  return (
    <div className="card" style={{ padding: 18, display: "flex", gap: 14, alignItems: "flex-start", justifyContent: "space-between" }}>
      <div style={{ flex: 1 }}>
        <div className="flex g8 center" style={{ marginBottom: 4 }}>
          <h3 style={{ fontSize: "1.05rem" }}>{title}</h3>
          <span className="tag" style={{ background: on ? "var(--emerald-50)" : "var(--cream-200)", color: on ? "var(--emerald)" : "var(--ink-soft)" }}>
            {on ? "Live" : "Off"}
          </span>
          {value === null && <span className="faint" style={{ fontSize: ".72rem", fontStyle: "italic" }}>using env default</span>}
        </div>
        <p className="muted" style={{ fontSize: ".9rem", lineHeight: 1.5 }}>{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={`${on ? "Disable" : "Enable"} ${title}`}
        className={`cert-toggle ${on ? "on" : ""}`}
        style={{ flex: "none" }}
        onClick={() => onToggle(!on)}
      >
        <span className="cert-switch"><span className="cert-knob" /></span>
      </button>
    </div>
  );
}

export function AdminMonetization() {
  const { toast, ramadanModeEnabled, setRamadanModeEnabled } = useApp();
  // Global flag overrides — hydrated from platform_settings on mount so every
  // toggle reflects the persisted (server) state, not client-only demo state.
  const [values, setValues] = useState<Record<string, boolean | null>>({});
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/settings");
        const d = (await r.json().catch(() => ({}))) as Record<string, unknown>;
        const next: Record<string, boolean | null> = {};
        for (const col of Object.values(FLAG_COLUMN)) next[col] = col in d ? (d[col] === null ? null : !!d[col]) : null;
        setValues(next);
      } catch { /* keep defaults — rows show "using env default" */ }
    })();
  }, []);

  // Ramadan mode persists to platform_settings so EVERY visitor sees it (server-
  // hydrated), same pattern the flags above now follow.
  const toggleRamadan = async () => {
    const next = !ramadanModeEnabled;
    setRamadanModeEnabled(next);
    toast(`Ramadan mode ${next ? "enabled — visitors will see it on next load" : "disabled"}`);
    try {
      await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ramadan_mode_enabled: next }) });
    } catch { /* optimistic; admin can retry */ }
  };

  // Persist a global flag override. Payment flags require an explicit confirm
  // before flipping ON, since they gate LIVE charging flows.
  async function setGlobalFlag(flagKey: FlagKey, next: boolean, isPayment: boolean) {
    if (isPayment && next && !confirm("This enables a LIVE payment/charging flow. Continue?")) return;
    const column = FLAG_COLUMN[flagKey];
    const prev = values[column] ?? null;
    setValues((v) => ({ ...v, [column]: next })); // optimistic
    try {
      const r = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [column]: next }) });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean };
      if (!d.ok) {
        setValues((v) => ({ ...v, [column]: prev }));
        toast("Couldn't save — try again.");
      } else {
        toast(`${FLAG_COPY[flagKey].title} ${next ? "enabled" : "disabled"}`);
      }
    } catch {
      setValues((v) => ({ ...v, [column]: prev }));
      toast("Couldn't save — try again.");
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="notice notice-warn" style={{ marginBottom: 18 }}>
        <Icon name="info" size={18} />
        <span>
          Monetization launches <strong>OFF</strong> — the site runs on free tickets. Flip a switch to go live with a revenue stream.
          Paid flows also require Stripe keys + each business to complete payout onboarding.
        </span>
      </div>

      <div className="faint" style={{ fontSize: ".78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>Payments</div>
      <div className="stack g12" style={{ marginBottom: 24 }}>
        {PAYMENT_FLAG_KEYS.map((k) => (
          <GlobalFlagRow key={k} flagKey={k} value={values[FLAG_COLUMN[k]] ?? null} onToggle={(next) => setGlobalFlag(k, next, true)} />
        ))}
      </div>

      <div className="faint" style={{ fontSize: ".78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>Features</div>
      <div className="stack g12" style={{ marginBottom: 24 }}>
        {FEATURE_FLAG_KEYS.map((k) => (
          <GlobalFlagRow key={k} flagKey={k} value={values[FLAG_COLUMN[k]] ?? null} onToggle={(next) => setGlobalFlag(k, next, false)} />
        ))}
      </div>

      <div className="stack g12">
        {/* Ramadan mode — seasonal, persisted globally */}
        <div className="card" style={{ padding: 18, display: "flex", gap: 14, alignItems: "flex-start", justifyContent: "space-between", borderColor: "var(--emerald-200)" }}>
          <div style={{ flex: 1 }}>
            <div className="flex g8 center" style={{ marginBottom: 4 }}>
              <h3 style={{ fontSize: "1.05rem", display: "flex", alignItems: "center", gap: 6 }}><Icon name="crescent" size={17} /> Ramadan mode</h3>
              <span className="tag" style={{ background: ramadanModeEnabled ? "var(--emerald-50)" : "var(--cream-200)", color: ramadanModeEnabled ? "var(--emerald)" : "var(--ink-soft)" }}>
                {ramadanModeEnabled ? "Live" : "Off"}
              </span>
            </div>
            <p className="muted" style={{ fontSize: ".9rem", lineHeight: 1.5 }}>Surface the Ramadan affordance for the season — iftar deals, bazaars &amp; open-late spots. Persisted platform-wide; every visitor sees it.</p>
          </div>
          <button
            role="switch"
            aria-checked={ramadanModeEnabled}
            aria-label={`${ramadanModeEnabled ? "Disable" : "Enable"} Ramadan mode`}
            className={`cert-toggle ${ramadanModeEnabled ? "on" : ""}`}
            style={{ flex: "none" }}
            onClick={toggleRamadan}
          >
            <span className="cert-switch"><span className="cert-knob" /></span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Per-business feature overrides ─────────────────────────────────────────
   The five owner-scoped flags (paidPlans, paidAds, certVault, leadRouting,
   paidLeads) can be forced on/off for a single business — e.g. beta-test a
   feature with select businesses while it's globally off, or comp/restrict one
   business without touching the site-wide switch. A "Default" state clears the
   override so the business falls back to the global/env value. */
const BUSINESS_FEATURE_KEYS: FlagKey[] = ["paidPlans", "paidAds", "certVault", "leadRouting", "paidLeads"];

/* One feature's 3-state control: Default (defer to global) / On (forced) /
   Off (forced). Uses the same `chip`/`chip.active` styling as the role/status
   filters elsewhere in this file — no new visual pattern. */
function BusinessFeatureRow({ flagKey, value, onSet }: { flagKey: FlagKey; value: boolean | null; onSet: (next: boolean | null) => void }) {
  const { title, desc } = FLAG_COPY[flagKey];
  return (
    <div className="card" style={{ padding: 16, display: "flex", gap: 14, alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <h4 style={{ fontSize: ".96rem", marginBottom: 2 }}>{title}</h4>
        <p className="faint" style={{ fontSize: ".82rem", lineHeight: 1.4 }}>{desc}</p>
      </div>
      <div className="flex g6" role="group" aria-label={`${title} override`}>
        <button type="button" className={`chip ${value === null ? "active" : ""}`} aria-pressed={value === null} onClick={() => onSet(null)}>Default</button>
        <button type="button" className={`chip ${value === true ? "active" : ""}`} aria-pressed={value === true} onClick={() => onSet(true)}>On</button>
        <button type="button" className={`chip ${value === false ? "active" : ""}`} aria-pressed={value === false} onClick={() => onSet(false)}>Off</button>
      </div>
    </div>
  );
}

/* Loads + persists the per-business overrides for one business.
   Read path: a direct client read of business_feature_overrides, scoped by the
   admin-only RLS policy from migration 0049 ("bfo admin read" — for select to
   authenticated using is_admin()) via the Clerk-authed useSupabaseBrowser()
   client (same hook/pattern this file already uses for admin dashboard reads,
   e.g. AdminUsers' admin_list_users rpc). This gives REAL current state rather
   than starting every business at "Default" on every visit. Fails soft to
   all-Default when Supabase isn't configured, the migration hasn't been applied
   yet, or the read errors for any reason — the panel stays usable either way,
   and a successful write always reflects immediately (optimistic + real POST). */
function BusinessFeaturesPanel({ businessId, toast }: { businessId: string; toast: (msg: string) => void }) {
  const supabase = useSupabaseBrowser();
  const [values, setValues] = useState<Record<string, boolean | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      const base: Record<string, boolean | null> = {};
      for (const k of BUSINESS_FEATURE_KEYS) base[k] = null;
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("business_feature_overrides")
            .select("feature_key, enabled")
            .eq("business_id", businessId);
          if (!error && Array.isArray(data)) {
            for (const row of data as { feature_key: string; enabled: boolean }[]) {
              if ((BUSINESS_FEATURE_KEYS as string[]).includes(row.feature_key)) base[row.feature_key] = row.enabled;
            }
          }
        } catch { /* fail soft → all Default */ }
      }
      if (alive) { setValues(base); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [businessId, supabase]);

  const setFeature = async (feature: FlagKey, next: boolean | null) => {
    const prev = values[feature] ?? null;
    setValues((v) => ({ ...v, [feature]: next })); // optimistic
    try {
      const r = await fetch("/api/admin/business-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, feature, enabled: next }),
      });
      const d = (await r.json().catch(() => ({}))) as { ok?: boolean };
      if (!d.ok) {
        setValues((v) => ({ ...v, [feature]: prev }));
        toast("Couldn't save — try again.");
      } else {
        toast(`${FLAG_COPY[feature].title} → ${next === null ? "Default" : next ? "On" : "Off"}`);
      }
    } catch {
      setValues((v) => ({ ...v, [feature]: prev }));
      toast("Couldn't save — try again.");
    }
  };

  return (
    <div className="stack g10">
      <div className="faint" style={{ fontSize: ".78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>
        Features{loading ? " · loading…" : ""}
      </div>
      <div className="stack g10">
        {BUSINESS_FEATURE_KEYS.map((k) => (
          <BusinessFeatureRow key={k} flagKey={k} value={values[k] ?? null} onSet={(next) => setFeature(k, next)} />
        ))}
      </div>
    </div>
  );
}

/* ── Businesses — admin business detail (list → select → Features panel) ────
   Reuses the live directory (same data browse-facing pages read via
   useDirectory()) so the list is real, not mock. Selecting a row opens its
   detail card with the per-business Features panel above. */
export function AdminBusinesses({ toast }: { toast: (msg: string) => void }) {
  const dir = useDirectory();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const rows = q
    ? dir.listings.filter((l) => `${l.name} ${l.cat} ${l.area}`.toLowerCase().includes(q.toLowerCase()))
    : dir.listings;
  const biz = selected ? dir.get(selected) : undefined;

  return (
    <div className="stack g16">
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="admin-tablehead">
          <div className="flex g8 center"><span className="tag">{dir.listings.length} businesses</span></div>
          <div className="searchbar" style={{ maxWidth: 260, padding: "4px 4px 4px 12px" }}>
            <Icon name="search" className="lead" size={16} />
            <input placeholder="Search businesses…" value={q} onChange={(e) => setQ(e.target.value)} style={{ fontSize: ".86rem" }} aria-label="Search businesses" />
          </div>
        </div>
        {rows.length === 0 ? (
          <div style={{ padding: 24 }}><Empty icon="building" title="No businesses" body={q ? `Nothing matches "${q}".` : "No businesses in the directory yet."} /></div>
        ) : (
          <div className="tbl-scroll"><table className="tbl">
            <thead><tr><th>Business</th><th>Category</th><th>Area</th><th>Plan</th><th>Manage</th></tr></thead>
            <tbody>{rows.slice(0, 200).map((l) => (
              <tr key={l.id} className="rowhover" style={{ background: selected === l.id ? "var(--cream-100)" : undefined }}>
                <td style={{ fontWeight: 700 }}>{l.name}</td>
                <td className="muted">{l.cat}</td>
                <td className="muted">{l.area}</td>
                <td><span className="pill-tag">{l.plan || "free"}</span></td>
                <td><button className="btn btn-soft btn-sm" onClick={() => setSelected(selected === l.id ? null : l.id)}>{selected === l.id ? "Close" : "Manage"}</button></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      {biz && (
        <div className="card" style={{ padding: 20 }}>
          <div className="flex between center wrap g8" style={{ marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: "1.1rem" }}>{biz.name}</h3>
              <p className="faint" style={{ fontSize: ".84rem" }}>{biz.cat} · {biz.area}</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}><Icon name="x" size={15} /> Close</button>
          </div>
          <BusinessFeaturesPanel businessId={biz.id} toast={toast} />
        </div>
      )}
    </div>
  );
}

/* ── Unified revenue P&L ─────────────────────────────────────────────────────
   One view across every stream — subscriptions (MRR), event fees, ad orders and
   travel commission — from our own ledger. Stripe/LiteAPI dashboards stay the
   source of truth for payouts; this is the at-a-glance platform P&L. Graceful
   (zeroed) when the backend isn't configured. Data: /api/admin/revenue. */
interface RevenueData {
  simulated?: boolean;
  flags: Record<string, boolean>;
  windowDays: number;
  mrrCents: number; activePlans: number; plansByTier: Record<string, number>;
  windowSgdCents: { events: number; ads: number; travelApprox: number; total: number };
  eventGmvCents: number;
  travelByCurrency: { currency: string; commission: number; count: number }[];
  trend: { month: string; events: number; ads: number; travel: number; total: number }[];
}
const STREAM_FLAG: [string, string, string][] = [
  ["paidPlans", "Directory plans", "Subscriptions"],
  ["paidAds", "Sponsored ads", "Ad orders"],
  ["paidTickets", "Event tickets", "Booking fees"],
  ["paidHotels", "Travel — hotels", "Commission"],
];

export function AdminRevenue() {
  const [d, setD] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => {
    const j = await getRevenue();
    if (j) setD(j as unknown as RevenueData);
    setLoading(false);
  })(); }, []);

  if (loading) return <div className="route-loading" role="status"><span className="spinner" /> <span className="faint">Loading…</span></div>;
  if (!d) return <Empty icon="dollar" title="Revenue P&L" body="Sign in as an admin (with the backend configured) to see the unified revenue view." />;

  const w = d.windowSgdCents;
  const runRateCents = d.mrrCents * 12 + Math.round((w.total * 365) / d.windowDays);
  const cards: { l: string; v: string; hint?: string }[] = [
    { l: "Est. MRR", v: fmtSGD(d.mrrCents), hint: `${d.activePlans} active plan${d.activePlans === 1 ? "" : "s"}` },
    { l: `Event fees · ${d.windowDays}d`, v: fmtSGD(w.events), hint: `GMV ${fmtSGD(d.eventGmvCents)}` },
    { l: `Ad revenue · ${d.windowDays}d`, v: fmtSGD(w.ads) },
    { l: `Travel · ${d.windowDays}d`, v: `≈ ${fmtSGD(w.travelApprox)}`, hint: "approx SGD" },
    { l: `Total · ${d.windowDays}d`, v: fmtSGD(w.total) },
    { l: "Annual run-rate", v: fmtSGD(runRateCents), hint: "est. MRR×12 + annualised" },
  ];
  const maxTrend = Math.max(...d.trend.map((t) => t.total), 1);

  return (
    <div className="stack g16" style={{ maxWidth: 920 }}>
      <div className="notice notice-warn">
        <Icon name="info" size={18} />
        <span>Unified view from <strong>our</strong> ledger. Stripe holds authoritative MRR &amp; payouts; LiteAPI holds travel payouts. Travel commission is converted to an approximate SGD figure. {d.simulated && <em>Backend not configured — showing zeros.</em>}</span>
      </div>

      <div className="admin-statgrid">
        {cards.map((c) => (
          <div key={c.l} className="stat"><div className="v">{c.v}</div><div className="l">{c.l}</div>{c.hint && <div className="faint" style={{ fontSize: ".72rem", marginTop: 2 }}>{c.hint}</div>}</div>
        ))}
      </div>

      {/* Per-stream live/off status (server flags). */}
      <div className="card" style={{ padding: 18 }}>
        <h3 style={{ fontSize: "1.05rem", marginBottom: 12 }}>Streams</h3>
        <div className="stack g8">
          {STREAM_FLAG.map(([key, title, sub]) => {
            const on = !!d.flags?.[key];
            return (
              <div key={key} className="flex between center" style={{ borderTop: "0.5px solid var(--line)", paddingTop: 8 }}>
                <span><strong>{title}</strong> <span className="faint" style={{ fontSize: ".82rem" }}>· {sub}</span></span>
                <span className="pill-tag" style={{ background: on ? "var(--emerald-50)" : "var(--cream-200)", color: on ? "var(--emerald)" : "var(--ink-soft)" }}>{on ? "Live" : "Off"}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transactional revenue by month (events + ads + travel, realized). */}
      <div className="card" style={{ padding: 18 }}>
        <h3 style={{ fontSize: "1.05rem", marginBottom: 4 }}>Transactional revenue by month</h3>
        <p className="faint" style={{ fontSize: ".82rem", marginBottom: 14 }}>Events + ads + travel (approx SGD). Subscriptions are point-in-time MRR, shown above.</p>
        {d.trend.length === 0 ? (
          <p className="muted" style={{ fontSize: ".88rem" }}>No transactions yet — figures populate once revenue streams go live.</p>
        ) : (
          <div className="stack g10">
            {d.trend.map((t) => (
              <div key={t.month}>
                <div className="flex between" style={{ fontSize: ".82rem", marginBottom: 4 }}><span className="muted">{t.month}</span><span style={{ fontWeight: 700 }}>{fmtSGD(t.total)}</span></div>
                <div style={{ height: 8, background: "var(--cream-200)", borderRadius: 99 }}>
                  <div style={{ width: `${Math.round((100 * t.total) / maxTrend)}%`, height: "100%", background: "var(--emerald)", borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Travel commission by currency (native — LiteAPI is authoritative). */}
      {d.travelByCurrency.length > 0 && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="admin-tablehead"><h3 style={{ fontSize: "1.05rem" }}>Travel commission by currency</h3><span className="faint" style={{ fontSize: ".82rem" }}>Native currency · last {d.windowDays}d</span></div>
          <div className="tbl-scroll"><table className="tbl">
            <thead><tr><th>Currency</th><th>Bookings</th><th>Commission</th></tr></thead>
            <tbody>{d.travelByCurrency.map((c) => (
              <tr key={c.currency} className="rowhover"><td style={{ fontWeight: 700 }}>{c.currency}</td><td>{c.count}</td><td style={{ fontWeight: 700 }}>{c.currency} {c.commission.toLocaleString()}</td></tr>
            ))}</tbody>
          </table></div>
        </div>
      )}

      <div className="flex g8 wrap">
        <a className="btn btn-soft btn-sm" href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer"><Icon name="external" size={14} /> Stripe (MRR &amp; payouts)</a>
      </div>
    </div>
  );
}

/* ── Staged paid-flag rollout ────────────────────────────────────────────────
   The recommended go-live order (easiest→hardest operational risk) with each
   stage's prerequisites and current live/off state (server flags). Real
   enablement is via Vercel env vars (PAID_*_ENABLED) — see the runbook at
   docs/runbooks/paid-flag-rollout.md. This panel is operator guidance. */
const ROLLOUT_STAGES: { n: number; title: string; env: string; flags: string[]; why: string; prereqs: string[] }[] = [
  { n: 1, title: "Directory plans", env: "PAID_PLANS_ENABLED", flags: ["paidPlans"],
    why: "Pure Stripe subscriptions — no payouts to third parties, lowest risk, and it’s the trust layer (Verified badge + Cert Vault).",
    prereqs: ["Stripe keys live", "STRIPE_PRICE_* IDs set", "Migrations applied"] },
  { n: 2, title: "Sponsored ads", env: "PAID_ADS_ENABLED", flags: ["paidAds"],
    why: "Direct-sold, you keep 100%, no payout logic — but only worth selling once there’s traffic, so it follows Directory.",
    prereqs: ["Audience / traffic", "ad_placements seeded"] },
  { n: 3, title: "Event tickets", env: "PAID_TICKETS_ENABLED", flags: ["paidTickets"],
    why: "Now holding buyers’ money and paying organisers via Stripe Connect 24h post-event — more moving parts.",
    prereqs: ["Stripe Connect enabled", "Organiser onboarding", "event-payouts cron live"] },
  { n: 4, title: "Travel — hotels → flights", env: "PAID_HOTELS_ENABLED → PAID_FLIGHTS_ENABLED", flags: ["paidHotels", "paidFlights"],
    why: "Highest ceiling, most dependencies. Enable hotels first; flights need Vercel Pro (10-min retry cron).",
    prereqs: ["LiteAPI key + volume", "Hotels before flights", "Vercel Pro for live flights"] },
];

export function AdminRollout() {
  const [flags, setFlags] = useState<Record<string, boolean> | null>(null);
  useEffect(() => { (async () => {
    const j = await getRevenue();
    setFlags(((j?.flags as Record<string, boolean>) || {}));
  })(); }, []);

  return (
    <div className="stack g16" style={{ maxWidth: 820 }}>
      <div className="notice notice-warn">
        <Icon name="info" size={18} />
        <span>Recommended go-live order, easiest→hardest. Each flag is enabled in <strong>Vercel env</strong> (<code>PAID_*_ENABLED</code>); the toggles on the Monetization tab are client-side demo only. Full steps &amp; rollback: <code>docs/runbooks/paid-flag-rollout.md</code>.</span>
      </div>

      <div className="stack g12">
        {ROLLOUT_STAGES.map((s) => {
          const live = s.flags.some((f) => flags?.[f]);
          const allLive = s.flags.every((f) => flags?.[f]);
          return (
            <div key={s.n} className="card" style={{ padding: 18 }}>
              <div className="flex between center wrap g10" style={{ marginBottom: 6 }}>
                <h3 style={{ fontSize: "1.08rem", display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="attn-ico" style={{ fontWeight: 700 }}>{s.n}</span>{s.title}
                </h3>
                <span className="pill-tag" style={{ background: live ? "var(--emerald-50)" : "var(--cream-200)", color: live ? "var(--emerald)" : "var(--ink-soft)" }}>
                  {allLive ? "Live" : live ? "Partly live" : "Off"}
                </span>
              </div>
              <p className="muted" style={{ fontSize: ".9rem", lineHeight: 1.5, marginBottom: 10 }}>{s.why}</p>
              <div className="flex g8 wrap" style={{ marginBottom: 8 }}>
                {s.prereqs.map((p) => <span key={p} className="tag"><Icon name="check" size={13} /> {p}</span>)}
              </div>
              <code className="faint" style={{ fontSize: ".8rem" }}>{s.env}</code>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AdminOverview({ setSection }: { setSection: (s: string) => void }) {
  // Live pending counts so "Needs your attention" is actionable, not a static
  // list of labels. null = backend not configured / not loaded (no badge).
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  useEffect(() => {
    let alive = true;
    (async () => {
      const types: [string, string][] = [["approvals", "listings"], ["reports", "reports"], ["claims", "claims"], ["verification", "cert"]];
      const loaded = await Promise.all(types.map(async ([sec, t]) => {
        if (t === "cert") {
          try {
            const r = await fetch("/api/admin/cert");
            const d = r.ok ? await r.json() : null;
            return [sec, d?.ok && Array.isArray(d.items) ? d.items.length : null] as const;
          } catch { return [sec, null] as const; }
        }
        const items = await queueGet(t);
        return [sec, items ? items.length : null] as const;
      }));
      if (alive) setCounts(Object.fromEntries(loaded));
    })();
    return () => { alive = false; };
  }, []);
  return (
    <div>
      <a href="/admin/analytics" className="card" style={{ padding: 20, display: "block", textDecoration: "none", color: "inherit" }}>
        <div className="flex between center wrap g12">
          <div><h3 style={{ fontSize: "1.1rem" }}>Live analytics</h3><p className="faint" style={{ fontSize: ".88rem", marginTop: 4 }}>Real-time traffic, leads and conversion from your first-party analytics.</p></div>
          <span className="tag"><Icon name="chart" size={14} /> Open dashboard</span>
        </div>
      </a>
      <div className="card mt20" style={{padding:20}}>
        <h3 style={{fontSize:'1.1rem', marginBottom:14}}>Needs your attention</h3>
        <div className="stack g10">
          {([['Listings awaiting approval','approvals','doc'],['Reports to review','reports','flag'],['Ownership claims','claims','building'],['Verification requests','verification','shield-check']] as [string, string, string][]).map(([t,sec,icon])=>(
            <button key={t} className="attn-row" onClick={()=>setSection(sec)}>
              <span className="flex g10 center"><span className="attn-ico"><Icon name={icon} size={17}/></span>{t}</span>
              <span className="flex g8 center">
                {counts[sec] != null && <span className="tag" style={counts[sec] ? { background: "var(--gold)", color: "#3a2c08", fontWeight: 800 } : undefined}>{counts[sec]}</span>}
                <Icon name="chevron" size={17}/>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ApprovalRow { id: string; name: string; cat: string; area: string; badges: BadgeKey[]; tone?: string; image?: string; status: string; submitted: string }
export function AdminApprovals({ toast, navigate }: { toast: (msg: string) => void; navigate: (screen: string, params?: Record<string, unknown>) => void }) {
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [live, setLive] = useState(false);
  useEffect(() => {
    queueGet("listings").then((items) => {
      if (!items) return;
      setLive(true);
      setRows(items.map((s) => {
        const raw = (s.raw && typeof s.raw === "object" ? s.raw : {}) as Record<string, unknown>;
        return { id: s.id, name: String(s.name ?? "—"), cat: String(s.category_suggested ?? raw.cat ?? "—"), area: String(raw.area ?? "—"), badges: ["pending"], tone: "gold", status: "new", submitted: timeAgo(s.created_at) } as ApprovalRow;
      }));
    });
  }, []);
  const [q, setQ] = useState("");
  const act = async (id: string, action: string) => {
    if (live) { const res = await queueAct("listings", id, action === "approve" ? "approve" : "reject"); if (!res.ok) { toast(queueErr(res.error)); return; } }
    setRows(r=>r.filter(x=>x.id!==id)); toast(action==='approve'?'Listing published':'Listing rejected');
  };
  const shown = q ? rows.filter(r=>`${r.name} ${r.cat} ${r.area}`.toLowerCase().includes(q.toLowerCase())) : rows;
  return (
    <div className="card" style={{overflow:'hidden'}}>
      <div className="admin-tablehead"><div className="flex g8 center"><span className="tag">{rows.length} pending</span></div>
        <div className="searchbar" style={{maxWidth:240, padding:'4px 4px 4px 12px'}}><Icon name="search" className="lead" size={16}/><input placeholder="Search…" style={{fontSize:'.86rem'}} value={q} onChange={(e)=>setQ(e.target.value)} aria-label="Search pending listings"/></div></div>
      <div className="tbl-scroll">
        <table className="tbl">
          <thead><tr><th>Business</th><th>Type</th><th>Area</th><th>Halal claim</th><th>Submitted</th><th>Action</th></tr></thead>
          <tbody>
            {shown.map(r=>(
              <tr key={r.id} className="rowhover">
                <td><div className="flex g10 center"><ImagePh label="" tone={r.tone} src={r.image} style={{width:38,height:38,borderRadius:8,flex:'none'}}/><div><div style={{fontWeight:700}}>{r.name}</div><div className="faint" style={{fontSize:'.78rem'}}>{r.cat}</div></div></div></td>
                <td><span className={`pill-tag ${r.status==='claim'?'amber':'blue'}`}>{r.status==='claim'?'Claim':'New listing'}</span></td>
                <td className="muted">{r.area}</td>
                <td><Badge type={r.badges[0]}/></td>
                <td className="muted">{r.submitted}</td>
                <td><div className="flex g6">
                  <button className="btn btn-soft btn-sm" onClick={()=>navigate('detail',{id:r.id})}><Icon name="eye" size={15}/></button>
                  <button className="btn btn-primary btn-sm" onClick={()=>act(r.id,'approve')}>Approve</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>act(r.id,'reject')}>Reject</button>
                </div></td>
              </tr>
            ))}
            {shown.length===0 && <tr><td colSpan={6}><Empty icon="check" title={q ? "No matches" : "All caught up"} body={q ? `Nothing pending matches "${q}".` : "No listings awaiting approval."} /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface EventQueueRow { id: string; title: string; cat: string; dateLabel: string; free: boolean; priceFrom: number; organiser: string; img: string; tone: string; submitted: string }
export function AdminEvents({ toast, navigate }: { toast: (msg: string) => void; navigate: (screen: string, params?: Record<string, unknown>) => void }) {
  const [rows, setRows] = useState<EventQueueRow[]>([]);
  const [live, setLive] = useState(false);
  useEffect(() => {
    queueGet("events").then((items) => {
      if (!items) return;
      setLive(true);
      setRows(items.map((e) => {
        const d = (e.display && typeof e.display === "object" ? e.display : {}) as Record<string, unknown>;
        return {
          id: e.id,
          title: String(e.title ?? "Event"),
          cat: String(d.cat ?? "Community"),
          dateLabel: String(d.dateLabel ?? e.date_iso ?? "—"),
          free: e.is_free !== false,
          priceFrom: Number(d.priceFrom) || 0,
          organiser: String(d.organiser ?? "—"),
          img: typeof d.img === "string" ? d.img : "",
          tone: typeof d.tone === "string" ? d.tone : "emerald",
          submitted: timeAgo(e.created_at),
        } as EventQueueRow;
      }));
    });
  }, []);
  const [q, setQ] = useState("");
  const act = async (id: string, action: string) => {
    if (live) { const res = await queueAct("events", id, action === "approve" ? "approve" : "reject"); if (!res.ok) { toast(queueErr(res.error)); return; } }
    setRows(r=>r.filter(x=>x.id!==id)); toast(action==='approve'?'Event approved & published':'Event rejected');
  };
  const shown = q ? rows.filter(r=>`${r.title} ${r.cat} ${r.organiser}`.toLowerCase().includes(q.toLowerCase())) : rows;
  return (
    <div className="card" style={{overflow:'hidden'}}>
      <div className="admin-tablehead">
        <div className="flex g8 center"><span className="tag">{rows.length} pending</span><span className="faint" style={{fontSize:'.82rem'}}>Review before events go live</span></div>
        <div className="searchbar" style={{maxWidth:240, padding:'4px 4px 4px 12px'}}><Icon name="search" className="lead" size={16}/><input placeholder="Search events…" style={{fontSize:'.86rem'}} value={q} onChange={(e)=>setQ(e.target.value)} aria-label="Search pending events"/></div>
      </div>
      <div className="tbl-scroll">
        <table className="tbl">
          <thead><tr><th>Event</th><th>Category</th><th>Date</th><th>Pricing</th><th>Host</th><th>Submitted</th><th>Action</th></tr></thead>
          <tbody>
            {shown.map(r=>(
              <tr key={r.id} className="rowhover">
                <td><div className="flex g10 center"><ImagePh label="" tone={r.tone} src={r.img} style={{width:40,height:32,borderRadius:7,flex:'none'}}/><div style={{fontWeight:700, maxWidth:200}}>{r.title}</div></div></td>
                <td className="muted">{r.cat}</td>
                <td className="muted">{r.dateLabel}</td>
                <td>{r.free ? <span className="pill-tag green">Free</span> : <span className="pill-tag amber">${r.priceFrom}</span>}</td>
                <td className="muted">{r.organiser}</td>
                <td className="muted">{r.submitted}</td>
                <td><div className="flex g6">
                  <button className="btn btn-soft btn-sm" onClick={()=>navigate('event-detail',{id:r.id})}><Icon name="eye" size={15}/></button>
                  <button className="btn btn-primary btn-sm" onClick={()=>act(r.id,'approve')}>Approve</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>act(r.id,'reject')}>Reject</button>
                </div></td>
              </tr>
            ))}
            {shown.length===0 && <tr><td colSpan={7}><Empty icon="check" title={q ? "No matches" : "All caught up"} body={q ? `Nothing pending matches "${q}".` : "No events awaiting approval."} /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Halal Certificate Vault — admin review queue. Lists pending (and recent) certs
   uploaded by owners, with a short-TTL signed-URL preview and approve/reject
   actions. Approve re-runs the same score path as /api/admin/verify. When the
   backend isn't live / caller isn't admin, the list is simply empty. */
type AdminCert = {
  id: string;
  business_id: string;
  business_name: string | null;
  issuer: string | null;
  scheme: string | null;
  cert_no: string | null;
  issued_on: string | null;
  expires_on: string | null;
  status: string;
  review_note: string | null;
  created_at: string;
  url: string | null;
};
const CERT_PILL: Record<string, [string, string]> = {
  pending: ["Pending", "amber"],
  approved: ["Approved", "green"],
  rejected: ["Rejected", "red"],
  expired: ["Expired", "amber"],
};
export function AdminCertQueue({ toast }: { toast: (msg: string) => void }) {
  const [certs, setCerts] = useState<AdminCert[] | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await fetch("/api/admin/cert");
      const d = await r.json().catch(() => ({ ok: false }));
      setCerts(d.ok && Array.isArray(d.certs) ? (d.certs as AdminCert[]) : []);
    } catch {
      setCerts([]);
    }
  };
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/admin/cert");
        const d = await r.json().catch(() => ({ ok: false }));
        if (alive) setCerts(d.ok && Array.isArray(d.certs) ? (d.certs as AdminCert[]) : []);
      } catch {
        if (alive) setCerts([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const act = async (id: string, action: "approve" | "reject", review_note?: string) => {
    setBusy(id);
    try {
      const r = await fetch("/api/admin/cert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certId: id, action, review_note }),
      });
      const d = await r.json().catch(() => ({ ok: false }));
      if (!d.ok) { toast(d.error || "Action failed"); return; }
      toast(action === "approve" ? `Approved${d.score ? ` — score ${d.score}` : ""}` : "Certificate rejected");
      setNoteFor(null); setNote("");
      load();
    } catch {
      toast("Action failed");
    } finally {
      setBusy(null);
    }
  };

  const pending = (certs || []).filter((c) => c.status === "pending");
  return (
    <div className="card" style={{ overflow: "hidden", marginBottom: 18 }}>
      <div className="admin-tablehead">
        <h3 style={{ fontSize: "1.05rem" }}>Halal certificate vault</h3>
        <span className="faint" style={{ fontSize: ".82rem" }}>{pending.length} pending · open each file to verify before approving</span>
      </div>
      <div className="tbl-scroll">
        <table className="tbl">
          <thead><tr><th>Business</th><th>Certificate</th><th>Status</th><th>File</th><th>Decision</th></tr></thead>
          <tbody>
            {certs === null ? (
              <tr><td colSpan={5} className="faint" style={{ padding: 16 }}>Loading…</td></tr>
            ) : certs.length === 0 ? (
              <tr><td colSpan={5} className="faint" style={{ padding: 16 }}>No certificates uploaded yet.</td></tr>
            ) : (
              certs.map((c) => {
                const [label, tone] = CERT_PILL[c.status] || [c.status, "amber"];
                return (
                  <Fragment key={c.id}>
                    <tr className="rowhover">
                      <td><div style={{ fontWeight: 700 }}>{c.business_name || c.business_id.slice(0, 8)}</div></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{[c.issuer, c.scheme].filter(Boolean).join(" · ") || "—"}</div>
                        <div className="faint" style={{ fontSize: ".78rem" }}>{[c.cert_no && `No. ${c.cert_no}`, c.expires_on && `exp ${c.expires_on}`].filter(Boolean).join(" · ") || "—"}</div>
                      </td>
                      <td><span className={`pill-tag ${tone}`}>{label}</span></td>
                      <td>
                        {c.url ? (
                          <a className="btn btn-soft btn-sm" href={c.url} target="_blank" rel="noopener noreferrer"><Icon name="external" size={14} /> Preview</a>
                        ) : <span className="faint">—</span>}
                      </td>
                      <td>
                        {c.status === "pending" ? (
                          <div className="flex g6 wrap">
                            <button className="btn btn-primary btn-sm" disabled={busy === c.id} onClick={() => act(c.id, "approve")}><Icon name="check" size={14} /> Approve</button>
                            <button className="btn btn-ghost btn-sm" disabled={busy === c.id} onClick={() => { setNoteFor(noteFor === c.id ? null : c.id); setNote(""); }}><Icon name="x" size={14} /> Reject</button>
                          </div>
                        ) : (
                          <span className="faint" style={{ fontWeight: 600 }}>Reviewed</span>
                        )}
                      </td>
                    </tr>
                    {noteFor === c.id && (
                      <tr>
                        <td colSpan={5} style={{ background: "var(--cream)" }}>
                          <div className="flex g8 wrap" style={{ alignItems: "flex-end" }}>
                            <div className="field" style={{ flex: 1, minWidth: 220 }}><label>Reason (shown to the owner)</label><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Certificate expired / unreadable" /></div>
                            <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} disabled={busy === c.id} onClick={() => act(c.id, "reject", note.trim() || undefined)}>Confirm reject</button>
                            <button className="btn btn-soft btn-sm" onClick={() => setNoteFor(null)}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface VerifyRow { id: string; name: string; area: string; badges: BadgeKey[]; verify?: { expiringSoon?: boolean } }
const tierToBadge = (t: unknown): BadgeKey => (t === "muis" ? "muis" : t === "admin" ? "admin" : "pending");
export function AdminVerification({ toast }: { toast: (msg: string) => void }) {
  const [rows, setRows] = useState<VerifyRow[]>([]);
  const [live, setLive] = useState(false);
  useEffect(() => {
    queueGet("verification").then((items) => {
      if (!items) return;
      setLive(true);
      setRows(items.map((b) => ({ id: String(b.id), name: String(b.name ?? "—"), area: String(b.area ?? "—"), badges: [tierToBadge(b.halal_tier)], verify: undefined })));
    });
  }, []);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, "muis" | "admin">>({});
  const [certNo, setCertNo] = useState("");
  const [scheme, setScheme] = useState("");
  const [expiry, setExpiry] = useState("");

  const openCertForm = (id: string) => { setVerifyingId(id); setCertNo(""); setScheme(""); setExpiry(""); };

  const submit = async (id: string, action: "muis" | "admin") => {
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_id: id, action, certNo: action === "muis" ? certNo : undefined, scheme, expiry }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!data.ok) { toast(data.error || "Could not save"); return; }
    } catch { /* graceful — confirm to the admin anyway */ }
    setDone((d) => ({ ...d, [id]: action }));
    setVerifyingId(null);
    toast(`Recorded ${action === "muis" ? "MUIS Certified" : "Admin Verified"}`);
  };

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="admin-tablehead">
        <h3 style={{ fontSize: "1.05rem" }}>Halal verification management</h3>
        <span className="faint" style={{ fontSize: ".82rem" }}>Verify on the official HalalSG register, then record the certificate here</span>
      </div>
      <div className="tbl-scroll">
        <table className="tbl">
          <thead><tr><th>Business</th><th>Current status</th><th>Verify at source</th><th>Record verification</th></tr></thead>
          <tbody>
            {rows.map((r) => {
              const granted = done[r.id];
              const expiringSoon = r.verify?.expiringSoon;
              return (
                <Fragment key={r.id}>
                  <tr className="rowhover">
                    <td><div style={{ fontWeight: 700 }}>{r.name}</div><div className="faint" style={{ fontSize: ".78rem" }}>{r.area}</div></td>
                    <td>
                      <Badge type={granted || (r.badges[0] as BadgeKey)} />
                      {expiringSoon && !granted && <span className="verif-expiring" style={{ marginLeft: 8 }}><Icon name="clock" size={12} /> Re-verify</span>}
                    </td>
                    <td>
                      <a className="btn btn-soft btn-sm" href={halalSgSearchUrl(r.name)} target="_blank" rel="noopener noreferrer">
                        <Icon name="external" size={14} /> Look up on HalalSG
                      </a>
                    </td>
                    <td>
                      {granted ? (
                        <span className="faint" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}><Icon name="check" size={15} /> Recorded</span>
                      ) : (
                        <div className="flex g6 wrap">
                          <button className="btn btn-primary btn-sm" onClick={() => openCertForm(r.id)}><Icon name="shield-check" size={14} /> MUIS</button>
                          <button className="btn btn-gold btn-sm" onClick={() => submit(r.id, "admin")}><Icon name="check" size={14} /> Verify</button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {verifyingId === r.id && (
                    <tr>
                      <td colSpan={4} style={{ background: "var(--cream)" }}>
                        <div className="verify-certform">
                          <div className="field"><label>Certificate no.</label><input className="input" value={certNo} onChange={(e) => setCertNo(e.target.value)} placeholder="From the HalalSG register" /></div>
                          <div className="field"><label>Scheme</label><input className="input" value={scheme} onChange={(e) => setScheme(e.target.value)} placeholder="e.g. Eating Establishment" /></div>
                          <div className="field"><label>Expiry</label><input type="date" className="input" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></div>
                          <div className="flex g8">
                            <button className="btn btn-primary btn-sm" disabled={!certNo.trim()} onClick={() => submit(r.id, "muis")}>Record MUIS cert</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setVerifyingId(null)}>Cancel</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={4}><Empty icon="shield-check" title="No businesses to verify" body="Published businesses appear here once your directory is seeded — then record MUIS / admin verification." /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminHotelVerify({ toast }: { toast: (m: string) => void }) {
  const [hotelId, setHotelId] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState("");
  const [saving, setSaving] = useState(false);
  const FLAGS: [string, string][] = [
    ["has_prayer_room", "Prayer room"], ["halal_food_onsite", "Halal food on-site"], ["halal_food_nearby", "Halal food nearby"],
    ["alcohol_free", "Alcohol-free"], ["women_only_facilities", "Women-only"], ["qibla_direction", "Qibla direction"], ["prayer_mat_available", "Prayer mats"],
  ];
  const toggle = (k: string) => setFlags((f) => ({ ...f, [k]: !f[k] }));
  const save = async () => {
    if (!hotelId.trim()) { toast("Enter a LiteAPI hotel ID"); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/admin/verify-hotel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ liteapi_hotel_id: hotelId.trim(), city, country, flags, halal_score: score ? Number(score) : undefined }) });
      const d = await r.json();
      toast(d.ok ? `Verified — score ${d.halal_score}` : d.error || "Save failed");
    } catch { toast("Save failed"); }
    setSaving(false);
  };
  return (
    <div style={{ maxWidth: 640 }}>
      <div className="notice notice-warn" style={{ marginBottom: 16 }}>
        <Icon name="info" size={18} />
        <span>Mark a hotel&apos;s Muslim-friendly facilities (verified by you / an ustaz). This powers the &quot;Verified Muslim-friendly&quot; badge and the halal filters on /travel. Facilities only — not MUIS certification.</span>
      </div>
      <div className="card" style={{ padding: 20 }}>
        <div className="field" style={{ marginBottom: 12 }}><label>LiteAPI hotel ID</label><input className="input" value={hotelId} onChange={(e) => setHotelId(e.target.value)} placeholder="e.g. lp52e1e" /></div>
        <div className="flex g10" style={{ marginBottom: 12 }}>
          <div className="field" style={{ flex: 1 }}><label>City</label><input className="input" value={city} onChange={(e) => setCity(e.target.value)} /></div>
          <div className="field" style={{ flex: 1 }}><label>Country</label><input className="input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. AE" /></div>
        </div>
        <label style={{ fontWeight: 700, fontSize: ".85rem" }}>Facilities</label>
        <div className="flex g8 wrap" style={{ margin: "8px 0 14px" }}>
          {FLAGS.map(([k, l]) => <button key={k} type="button" className={`chip ${flags[k] ? "active" : ""}`} onClick={() => toggle(k)}>{l}</button>)}
        </div>
        <div className="field" style={{ marginBottom: 14 }}><label>Halal score (optional — auto-computed if blank)</label><input className="input" type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} style={{ maxWidth: 150 }} /></div>
        <button className="btn btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save verification"}</button>
      </div>
    </div>
  );
}

interface ReportRow { id: string; bizId: string; reason: string; time: string; sev: string }
const REPORT_LABEL: Record<string, string> = { halal: "Wrong halal status", closed: "Permanently closed", hours: "Wrong opening hours", address: "Wrong address", owner: "Ownership dispute", menu: "Menu issue", other: "Other" };
export function AdminReports({ toast, navigate }: { toast: (msg: string) => void; navigate: (screen: string, params?: Record<string, unknown>) => void }) {
  const dir = useDirectory();
  const [rows,setRows]=useState<ReportRow[]>([]);
  useEffect(() => {
    queueGet("reports").then((items) => {
      if (!items) return;
      setRows(items.map((r) => {
        const code = String(r.reason ?? "other");
        return { id: r.id, bizId: String(r.business_ref ?? r.business_id ?? ""), reason: `${REPORT_LABEL[code] ?? code}${r.details ? ` — ${String(r.details).slice(0, 80)}` : ""}`, time: timeAgo(r.created_at), sev: code === "halal" || code === "closed" ? "high" : "low" };
      }));
    });
  }, []);
  const resolve=async (id: string)=>{
    const res = await queueAct("reports", id, "resolve"); if (!res.ok) { toast(queueErr(res.error)); return; }
    setRows(r=>r.filter(x=>x.id!==id)); toast('Report resolved');
  };
  return (
    <div className="stack g12">
      {rows.map(r=>{
        const biz = dir.get(r.bizId);
        return (
        <div key={r.id} className="card" style={{padding:18}}>
          <div className="flex between center wrap g10">
            <div className="flex g12 center"><span className={`sev-dot ${r.sev}`}/><div><div style={{fontWeight:700}}>{r.reason}</div><div className="faint" style={{fontSize:'.82rem'}}>{biz?.name || r.bizId.slice(0,8) || "—"} · reported by community · {r.time}</div></div></div>
            <div className="flex g8">{biz && <button className="btn btn-outline btn-sm" onClick={()=>navigate("detail",{id: biz.slug || r.bizId})}>View listing</button>}<button className="btn btn-primary btn-sm" onClick={()=>resolve(r.id)}>Resolve</button></div>
          </div>
        </div>
        );
      })}
      {rows.length===0 && <Empty icon="flag" title="No open reports" body="Community reports about listings appear here." />}
    </div>
  );
}

interface ReviewRow { id: string; avatar: string; name: string; biz: string; rating: number; text: string; flagged: boolean }
export function AdminReviews({ toast }: { toast: (msg: string) => void }) {
  const [rows,setRows]=useState<ReviewRow[]>([]);
  const [live, setLive] = useState(false);
  useEffect(() => {
    queueGet("reviews").then((items) => {
      if (!items) return;
      setLive(true);
      setRows(items.map((r) => ({ id: r.id, avatar: "★", name: "Reviewer", biz: String(r.business_id ?? "—").slice(0, 8), rating: Number(r.rating) || 0, text: String(r.text ?? ""), flagged: r.status === "flagged" })));
    });
  }, []);
  const act=async (id: string,a: string)=>{
    if (live) { const res = await queueAct("reviews", id, a === "keep" ? "approve" : "reject"); if (!res.ok) { toast(queueErr(res.error)); return; } }
    setRows(r=>r.filter(x=>x.id!==id)); toast(a==='keep'?'Review approved':'Review removed');
  };
  return (
    <div className="stack g12">
      {rows.map(r=>(
        <div key={r.id} className="card" style={{padding:18}}>
          <div className="flex between center wrap g8"><div className="flex g10 center"><span className="avatar">{r.avatar}</span><div><div style={{fontWeight:700}}>{r.name} <span className="faint" style={{fontWeight:500}}>on {r.biz}</span></div><span className="rs-stars">{[1,2,3,4,5].map(i=><Icon key={i} name="starf" size={12} style={{color:i<=r.rating?'var(--gold)':'var(--line-strong)'}}/>)}</span></div></div>
            {r.flagged && <span className="pill-tag red">Flagged</span>}</div>
          <p className="muted" style={{marginTop:10, fontSize:'.92rem'}}>{r.text}</p>
          <div className="flex g8 mt12"><button className="btn btn-primary btn-sm" onClick={()=>act(r.id,'keep')}>Keep</button><button className="btn btn-ghost btn-sm" onClick={()=>act(r.id,'remove')}>Remove</button></div>
        </div>
      ))}
      {rows.length===0 && <Empty icon="check" title="Inbox zero" body="No reviews to moderate." />}
    </div>
  );
}

/* Ownership claims — owners who submitted "this is my business". Approving links
   them (owner_id + role='owner') via actClaim in /api/admin/queue. This is the
   payoff for cold-outreach claim links. */
interface ClaimRow { id: string; businessId: string; role: string; message: string; created: string }
export function AdminClaims({ toast, navigate }: { toast: (msg: string) => void; navigate: (screen: string, params?: Record<string, unknown>) => void }) {
  const dir = useDirectory();
  const [rows, setRows] = useState<ClaimRow[]>([]);
  useEffect(() => {
    queueGet("claims").then((items) => {
      if (!items) return;
      setRows(items.map((r) => ({ id: r.id, businessId: String(r.business_id ?? ""), role: String(r.role ?? "Owner"), message: String(r.message ?? ""), created: String(r.created_at ?? "") })));
    });
  }, []);
  const act = async (id: string, a: string) => {
    const res = await queueAct("claims", id, a);
    if (!res.ok) { toast(queueErr(res.error)); return; }
    setRows((r) => r.filter((x) => x.id !== id));
    toast(a === "approve" ? "Claim approved — owner linked" : "Claim rejected");
  };
  return (
    <div className="stack g12">
      {rows.map((r) => {
        const biz = dir.get(r.businessId);
        return (
          <div key={r.id} className="card" style={{ padding: 18 }}>
            <div className="flex between center wrap g8">
              <div><div style={{ fontWeight: 700 }}>{biz?.name || r.businessId.slice(0, 8) || "Unknown business"}</div><div className="lc-meta">{[r.role, biz?.area].filter(Boolean).join(" · ")} · {timeAgo(r.created)}</div></div>
              {biz?.certified && <span className="pill-tag green">{biz.certBody} verified</span>}
            </div>
            {r.message && <p className="muted" style={{ marginTop: 10, fontSize: ".92rem" }}>“{r.message}”</p>}
            <div className="flex g8 mt12">
              <button className="btn btn-primary btn-sm" onClick={() => act(r.id, "approve")}>Approve &amp; link owner</button>
              <button className="btn btn-ghost btn-sm" onClick={() => act(r.id, "reject")}>Reject</button>
              {biz && <button className="btn btn-soft btn-sm" onClick={() => navigate("detail", { id: biz.slug || r.businessId })}><Icon name="eye" size={15} /> View listing</button>}
            </div>
          </div>
        );
      })}
      {rows.length === 0 && <Empty icon="building" title="No ownership claims" body="When a business owner claims their listing, it appears here to approve." />}
    </div>
  );
}

/* Community suggestions — "you're missing this place". Approving marks the
   suggestion accepted so it can be added to the directory. */
interface SuggestRow { id: string; name: string; area: string; category: string; note: string; created: string }
export function AdminSuggestions({ toast }: { toast: (msg: string) => void }) {
  const [rows, setRows] = useState<SuggestRow[]>([]);
  useEffect(() => {
    queueGet("suggestions").then((items) => {
      if (!items) return;
      setRows(items.map((r) => ({ id: r.id, name: String(r.name ?? "—"), area: String(r.area ?? ""), category: String(r.category ?? ""), note: String(r.note ?? ""), created: String(r.created_at ?? "") })));
    });
  }, []);
  const act = async (id: string, a: string) => {
    const res = await queueAct("suggestions", id, a);
    if (!res.ok) { toast(queueErr(res.error)); return; }
    setRows((r) => r.filter((x) => x.id !== id));
    toast(a === "approve" ? "Suggestion accepted" : "Suggestion dismissed");
  };
  return (
    <div className="stack g12">
      {rows.map((r) => (
        <div key={r.id} className="card" style={{ padding: 18 }}>
          <div className="flex between center wrap g8"><div><div style={{ fontWeight: 700 }}>{r.name}</div><div className="lc-meta">{[r.category, r.area].filter(Boolean).join(" · ")} · {timeAgo(r.created)}</div></div></div>
          {r.note && <p className="muted" style={{ marginTop: 10, fontSize: ".92rem" }}>{r.note}</p>}
          <div className="flex g8 mt12"><button className="btn btn-primary btn-sm" onClick={() => act(r.id, "approve")}>Accept</button><button className="btn btn-ghost btn-sm" onClick={() => act(r.id, "reject")}>Dismiss</button></div>
        </div>
      ))}
      {rows.length === 0 && <Empty icon="sparkles" title="No suggestions" body="Community place suggestions appear here to review." />}
    </div>
  );
}

type AdminUserRow = { id: string; email: string; name: string | null; role: string; created_at: string };
type UserRole = "user" | "owner" | "admin";
export function AdminUsers({ toast }: { toast: (msg: string) => void }) {
  const supabase = useSupabaseBrowser();
  const { user: clerkUser } = useUser();
  const meId = clerkUser?.id ?? null;
  const [rows, setRows] = useState<AdminUserRow[] | null>(null);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "owner">("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  // Broadcast composer.
  const [bTitle, setBTitle] = useState("");
  const [bMsg, setBMsg] = useState("");
  const [bAudience, setBAudience] = useState<"all" | "owner">("all");
  const [sending, setSending] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = supabase;
      if (!sb) { if (alive) setRows([]); return; }
      const { data, error } = await sb.rpc("admin_list_users", { p_limit: 200 });
      if (alive) setRows(!error && Array.isArray(data) ? (data as AdminUserRow[]) : []);
    })();
    return () => { alive = false; };
  }, [supabase]);

  const USER_ERR: Record<string, string> = {
    cannot_demote_self: "You can't remove your own admin access.",
    invalid_role: "That role isn't allowed.",
    forbidden: "You're not signed in as an admin.",
    unauthenticated: "Please sign in again.",
    update_failed: "Couldn't update — a database error occurred.",
    service_unavailable: "Backend not configured.",
  };

  const changeRole = async (id: string, role: UserRole) => {
    setSavingId(id);
    try {
      const r = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });
      const d = await r.json().catch(() => ({ ok: false, error: "network_error" }));
      if (!d.ok) { toast(USER_ERR[d.error as string] || "Couldn't change role — please try again."); return; }
      setRows((rs) => (rs || []).map((u) => (u.id === id ? { ...u, role } : u)));
      toast(`Role updated → ${role}`);
    } catch {
      toast("Network error — please try again.");
    } finally {
      setSavingId(null);
    }
  };

  const sendBroadcast = async () => {
    if (!bTitle.trim()) { toast("Add a title first."); return; }
    setSending(true);
    try {
      const r = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: bTitle.trim(), message: bMsg.trim(), audience: bAudience }),
      });
      const d = await r.json().catch(() => ({ ok: false }));
      if (!d.ok) { toast(USER_ERR[d.error as string] || "Couldn't send — please try again."); return; }
      toast(`Sent to ${d.count} ${d.count === 1 ? "person" : "people"}`);
      setBTitle(""); setBMsg("");
    } catch {
      toast("Network error — please try again.");
    } finally {
      setSending(false);
    }
  };

  const filtered = (rows || []).filter((u) =>
    (roleFilter === "all" || u.role === roleFilter) &&
    (!q || (u.name || "").toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="stack g16">
      {/* Broadcast composer */}
      <div className="card" style={{ padding: 20 }}>
        <div className="flex between center wrap g8"><h3 style={{ fontSize: "1.1rem" }}>Broadcast notification</h3></div>
        <p className="muted" style={{ marginTop: 4, fontSize: ".88rem" }}>Sends an in-app notification (bell) to every targeted user.</p>
        <div className="stack g10 mt14">
          <input placeholder="Title" value={bTitle} maxLength={200} onChange={(e) => setBTitle(e.target.value)} />
          <textarea placeholder="Message (optional)" value={bMsg} maxLength={2000} rows={3} onChange={(e) => setBMsg(e.target.value)} />
          <div className="flex between center wrap g8">
            <div className="flex g8 center">
              <label className="lc-meta" htmlFor="bcast-aud">Audience</label>
              <select id="bcast-aud" value={bAudience} onChange={(e) => setBAudience(e.target.value as "all" | "owner")}>
                <option value="all">All users</option>
                <option value="owner">Owners only</option>
              </select>
            </div>
            <button className="btn btn-primary btn-sm" onClick={sendBroadcast} disabled={sending || !bTitle.trim()}>
              <Icon name="bell" size={15} /> {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="admin-tablehead"><div className="flex g8">
          <button className={`chip ${roleFilter === "all" ? "active" : ""}`} onClick={() => setRoleFilter("all")}>All</button>
          <button className={`chip ${roleFilter === "user" ? "active" : ""}`} onClick={() => setRoleFilter("user")}>Users</button>
          <button className={`chip ${roleFilter === "owner" ? "active" : ""}`} onClick={() => setRoleFilter("owner")}>Owners</button>
        </div>
          <div className="searchbar" style={{ maxWidth: 240, padding: "4px 4px 4px 12px" }}><Icon name="search" className="lead" size={16} /><input placeholder="Search users…" value={q} onChange={(e) => setQ(e.target.value)} style={{ fontSize: ".86rem" }} /></div></div>
        {rows === null ? (
          <div style={{ padding: 24, opacity: 0.5 }} aria-busy="true">Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 24 }}><Empty icon="users" title="No users yet" body="Signed-up users appear here. (Requires migration 0018 + admin access.)" /></div>
        ) : (
          <div className="tbl-scroll"><table className="tbl">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Manage</th></tr></thead>
            <tbody>{filtered.map((u) => {
              const isSelf = !!meId && u.id === meId;
              return (
              <tr key={u.id} className="rowhover">
                <td><div className="flex g8 center"><span className="avatar" style={{ width: 32, height: 32, fontSize: ".78rem" }}>{(u.name || u.email || "?")[0].toUpperCase()}</span><span style={{ fontWeight: 600 }}>{u.name || "—"}</span></div></td>
                <td className="muted">{u.email}</td>
                <td><span className={`pill-tag ${u.role === "owner" ? "blue" : u.role === "admin" ? "green" : "gray"}`}>{u.role}</span></td>
                <td className="muted">{u.created_at ? new Date(u.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                <td>
                  <select
                    aria-label={`Role for ${u.name || u.email}`}
                    value={(["user", "owner", "admin"].includes(u.role) ? u.role : "user") as UserRole}
                    disabled={savingId === u.id || isSelf}
                    title={isSelf ? "You can't change your own admin role" : undefined}
                    onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
                    style={{ fontSize: ".82rem", padding: "4px 6px" }}
                  >
                    <option value="user">User</option>
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
              );
            })}</tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}

/* ── Categories & Areas (persisted) ─────────────────────────────────────────
   Reads the DB overlay rows from GET /api/admin/catalog and MERGES them with the
   static seed (HHData.categories / HHData.areas) — the same merge lib/catalog.ts
   does server-side — so the admin sees exactly the browse-facing list. Add =
   POST, edit = PATCH, delete = soft (active=false). When the backend isn't wired
   (dev/demo) GET fails and we fall back to the static seed read-only, surfacing
   the reason via a toast on write. */
type CatRow = { id: string; label?: string; icon?: string; name?: string; tone?: string; sort?: number; active?: boolean };
type MergedCat = { id: string; label: string; icon: string; fromDb: boolean };
type MergedArea = { id: string; name: string; tone: string; fromDb: boolean };

const CAT_ICON_OPTIONS = ["utensils", "coffee", "store", "basket", "sparkles", "shield", "wrench", "heart", "family", "building", "globe", "mosque"];
const AREA_TONE_OPTIONS = ["emerald", "gold", "cream"];

function mergeCats(rows: CatRow[]): MergedCat[] {
  const overrides = new Map(rows.map((r) => [r.id, r]));
  const inactive = new Set(rows.filter((r) => r.active === false).map((r) => r.id));
  const out: MergedCat[] = [];
  for (const c of HHData.categories) {
    if (inactive.has(c.id)) continue;
    const o = overrides.get(c.id);
    out.push({ id: c.id, label: o?.label || c.label, icon: o?.icon || c.icon, fromDb: !!o });
    overrides.delete(c.id);
  }
  for (const o of overrides.values()) {
    if (o.active === false) continue;
    out.push({ id: o.id, label: o.label || o.id, icon: o.icon || "store", fromDb: true });
  }
  return out;
}
function mergeAreas(rows: CatRow[]): MergedArea[] {
  const overrides = new Map(rows.map((r) => [r.id, r]));
  const inactive = new Set(rows.filter((r) => r.active === false).map((r) => r.id));
  const out: MergedArea[] = [];
  for (const a of HHData.areas) {
    if (inactive.has(a.id)) continue;
    const o = overrides.get(a.id);
    out.push({ id: a.id, name: o?.name || a.name, tone: o?.tone || a.tone, fromDb: !!o });
    overrides.delete(a.id);
  }
  for (const o of overrides.values()) {
    if (o.active === false) continue;
    out.push({ id: o.id, name: o.name || o.id, tone: o.tone || "emerald", fromDb: true });
  }
  return out;
}

export function AdminCatalog({ toast }: { toast: (msg: string) => void }) {
  const [cats, setCats] = useState<MergedCat[]>(() => mergeCats([]));
  const [areas, setAreas] = useState<MergedArea[]>(() => mergeAreas([]));
  const [live, setLive] = useState(false); // backend reachable + admin
  const [busy, setBusy] = useState(false);

  const [addCat, setAddCat] = useState<{ label: string; icon: string } | null>(null);
  const [addArea, setAddArea] = useState<{ name: string; tone: string } | null>(null);
  const [editCat, setEditCat] = useState<{ id: string; label: string; icon: string } | null>(null);
  const [editArea, setEditArea] = useState<{ id: string; name: string; tone: string } | null>(null);

  const load = async () => {
    try {
      const r = await fetch("/api/admin/catalog");
      const d = await r.json();
      if (d.ok) {
        setCats(mergeCats(d.categories || []));
        setAreas(mergeAreas(d.areas || []));
        setLive(true);
      } else {
        setLive(false);
      }
    } catch {
      setLive(false);
    }
  };
  useEffect(() => { load(); }, []);

  const write = async (method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/catalog", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.ok) { await load(); return true; }
      toast(d.error === "service_unavailable" || d.error === "service_not_configured"
        ? "Connect Supabase to save catalog changes"
        : d.error === "forbidden" || d.error === "unauthenticated"
          ? "Sign in as an admin to edit the catalog"
          : d.error === "duplicate_id" ? "That id already exists"
          : `Couldn’t save (${d.error || "error"})`);
      return false;
    } catch {
      toast("Network error — change not saved");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const saveAddCat = async () => {
    if (!addCat?.label.trim()) return toast("Enter a category name");
    if (await write("POST", { kind: "category", label: addCat.label, icon: addCat.icon })) { setAddCat(null); toast("Category added"); }
  };
  const saveAddArea = async () => {
    if (!addArea?.name.trim()) return toast("Enter an area name");
    if (await write("POST", { kind: "area", name: addArea.name, tone: addArea.tone })) { setAddArea(null); toast("Area added"); }
  };
  const saveEditCat = async () => {
    if (!editCat?.label.trim()) return toast("Enter a category name");
    if (await write("PATCH", { kind: "category", id: editCat.id, label: editCat.label, icon: editCat.icon })) { setEditCat(null); toast("Category updated"); }
  };
  const saveEditArea = async () => {
    if (!editArea?.name.trim()) return toast("Enter an area name");
    if (await write("PATCH", { kind: "area", id: editArea.id, name: editArea.name, tone: editArea.tone })) { setEditArea(null); toast("Area updated"); }
  };
  const hideCat = async (id: string) => { if (await write("DELETE", { kind: "category", id })) toast("Category hidden"); };
  const hideArea = async (id: string) => { if (await write("DELETE", { kind: "area", id })) toast("Area hidden"); };

  return (
    <div className="stack g12">
      {!live && (
        <div className="card" style={{ padding: "10px 14px" }}>
          <span className="faint" style={{ fontSize: ".84rem" }}>
            <Icon name="info" size={14} /> Showing the built-in catalog. Sign in as an admin with Supabase connected to add or edit — changes then persist and appear in the directory.
          </span>
        </div>
      )}
      <div className="admin-twocol">
        {/* CATEGORIES */}
        <div className="card" style={{ padding: 20 }}>
          <div className="flex between center">
            <h3 style={{ fontSize: "1.1rem" }}>Categories</h3>
            <button className="btn btn-soft btn-sm" disabled={busy} onClick={() => { setAddCat({ label: "", icon: "store" }); setEditCat(null); }}><Icon name="plus" size={15} /> Add</button>
          </div>
          {addCat && (
            <div className="card mt12" style={{ padding: 12 }}>
              <div className="field"><label>Name</label><input className="input" autoFocus value={addCat.label} onChange={(e) => setAddCat({ ...addCat, label: e.target.value })} placeholder="e.g. Bakeries" /></div>
              <div className="field"><label>Icon</label><select className="select" value={addCat.icon} onChange={(e) => setAddCat({ ...addCat, icon: e.target.value })}>{CAT_ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}</select></div>
              <div className="flex g8 mt8"><button className="btn btn-primary btn-sm" disabled={busy} onClick={saveAddCat}>Save</button><button className="btn btn-ghost btn-sm" onClick={() => setAddCat(null)}>Cancel</button></div>
            </div>
          )}
          <div className="stack g8 mt14">{cats.map((c) => (
            <div key={c.id} className="catalog-row">
              {editCat?.id === c.id ? (
                <div className="stack g8" style={{ width: "100%" }}>
                  <div className="field"><label>Name</label><input className="input" value={editCat.label} onChange={(e) => setEditCat({ ...editCat, label: e.target.value })} /></div>
                  <div className="field"><label>Icon</label><select className="select" value={editCat.icon} onChange={(e) => setEditCat({ ...editCat, icon: e.target.value })}>{CAT_ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}</select></div>
                  <div className="flex g8"><button className="btn btn-primary btn-sm" disabled={busy} onClick={saveEditCat}>Save</button><button className="btn btn-ghost btn-sm" onClick={() => setEditCat(null)}>Cancel</button></div>
                </div>
              ) : (
                <>
                  <span className="flex g10 center"><span className="attn-ico"><Icon name={c.icon} size={16} /></span>{c.label}{c.fromDb && <span className="pill-tag green" style={{ fontSize: ".68rem" }}>edited</span>}</span>
                  <div className="flex g6">
                    <button className="btn btn-ghost btn-sm" disabled={busy} aria-label={`Edit ${c.label}`} onClick={() => { setEditCat({ id: c.id, label: c.label, icon: c.icon }); setAddCat(null); }}><Icon name="edit" size={15} /></button>
                    <button className="btn btn-ghost btn-sm" disabled={busy} aria-label={`Hide ${c.label}`} onClick={() => hideCat(c.id)}><Icon name="x" size={15} /></button>
                  </div>
                </>
              )}
            </div>
          ))}</div>
        </div>

        {/* AREAS */}
        <div className="card" style={{ padding: 20 }}>
          <div className="flex between center">
            <h3 style={{ fontSize: "1.1rem" }}>Locations / areas</h3>
            <button className="btn btn-soft btn-sm" disabled={busy} onClick={() => { setAddArea({ name: "", tone: "emerald" }); setEditArea(null); }}><Icon name="plus" size={15} /> Add</button>
          </div>
          {addArea && (
            <div className="card mt12" style={{ padding: 12 }}>
              <div className="field"><label>Name</label><input className="input" autoFocus value={addArea.name} onChange={(e) => setAddArea({ ...addArea, name: e.target.value })} placeholder="e.g. Woodlands" /></div>
              <div className="field"><label>Tone</label><select className="select" value={addArea.tone} onChange={(e) => setAddArea({ ...addArea, tone: e.target.value })}>{AREA_TONE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="flex g8 mt8"><button className="btn btn-primary btn-sm" disabled={busy} onClick={saveAddArea}>Save</button><button className="btn btn-ghost btn-sm" onClick={() => setAddArea(null)}>Cancel</button></div>
            </div>
          )}
          <div className="stack g8 mt14">{areas.map((a) => (
            <div key={a.id} className="catalog-row">
              {editArea?.id === a.id ? (
                <div className="stack g8" style={{ width: "100%" }}>
                  <div className="field"><label>Name</label><input className="input" value={editArea.name} onChange={(e) => setEditArea({ ...editArea, name: e.target.value })} /></div>
                  <div className="field"><label>Tone</label><select className="select" value={editArea.tone} onChange={(e) => setEditArea({ ...editArea, tone: e.target.value })}>{AREA_TONE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                  <div className="flex g8"><button className="btn btn-primary btn-sm" disabled={busy} onClick={saveEditArea}>Save</button><button className="btn btn-ghost btn-sm" onClick={() => setEditArea(null)}>Cancel</button></div>
                </div>
              ) : (
                <>
                  <span className="flex g10 center"><Icon name="pin" size={16} style={{ color: "var(--emerald)" }} />{a.name}{a.fromDb && <span className="pill-tag green" style={{ fontSize: ".68rem" }}>edited</span>}</span>
                  <div className="flex g6">
                    <button className="btn btn-ghost btn-sm" disabled={busy} aria-label={`Edit ${a.name}`} onClick={() => { setEditArea({ id: a.id, name: a.name, tone: a.tone }); setAddArea(null); }}><Icon name="edit" size={15} /></button>
                    <button className="btn btn-ghost btn-sm" disabled={busy} aria-label={`Hide ${a.name}`} onClick={() => hideArea(a.id)}><Icon name="x" size={15} /></button>
                  </div>
                </>
              )}
            </div>
          ))}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Sponsored-ad campaign manager (Phase 2) ────────────────────────────────
   Real schema-backed: sales team books campaigns on placements, tracks live
   impressions/clicks/CTR + booked revenue. Degrades to a sign-in prompt when
   the backend isn't configured / caller isn't an admin. */
type AdPlacement = {
  key: string; label: string; monthly_rate_cents: number; inventory_cap: number;
  active?: boolean; fill_mode?: string; size_format?: string; adsense_slot?: string | null;
  position_label?: string | null; page_type?: string | null; booked?: number;
};
type AdCampaign = {
  campaign_id: string; title: string; placement_key: string; status: string;
  advertiser_name: string | null; rate_cents: number; starts_on: string | null; ends_on: string | null;
  impressions: number; clicks: number; ctr: number;
  review_status?: string; image_url?: string | null; created_via?: string;
};
const STATUS_TAG: Record<string, string> = { active: "green", paused: "amber", scheduled: "blue", draft: "", ended: "" };
const REVIEW_TAG: Record<string, string> = { approved: "green", pending: "amber", rejected: "" };
const FILL_LABEL: Record<string, string> = {
  off: "Off", direct_only: "Direct only", adsense_only: "AdSense fill", direct_then_adsense: "Direct → AdSense",
};
const FILL_MODES = ["off", "direct_only", "adsense_only", "direct_then_adsense"] as const;

/* ── Placements panel — the owner's on/off + fill-mode control surface (0040).
   Toggle any slot live/off with one switch; pick whether it serves a direct
   sponsor, AdSense fill, both (direct wins), or is off. Non-developer friendly. */
function AdminPlacements({ toast }: { toast: (msg: string) => void }) {
  const [rows, setRows] = useState<AdPlacement[] | null>(null);
  const [err, setErr] = useState(false);
  const load = async () => {
    try {
      const r = await fetch("/api/admin/placements");
      const d = await r.json();
      if (d.ok) { setRows(d.placements); setErr(false); } else setErr(true);
    } catch { setErr(true); }
  };
  useEffect(() => { load(); }, []);

  const patch = async (key: string, body: Record<string, unknown>) => {
    // Optimistic update for a snappy toggle.
    setRows((rs) => rs?.map((p) => (p.key === key ? { ...p, ...body } : p)) ?? rs);
    const r = await fetch("/api/admin/placements", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, ...body }),
    });
    const d = await r.json();
    if (!d.ok) { toast(d.error || "Couldn’t update placement"); load(); }
  };

  if (err) return null;
  const list = rows || [];

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="admin-tablehead">
        <h3 style={{ fontSize: "1.05rem" }}>Placements</h3>
        <span className="faint" style={{ fontSize: ".82rem" }}>Toggle a slot live/off · choose direct sponsor or AdSense fill</span>
      </div>
      <div className="tbl-scroll"><table className="tbl">
        <thead><tr><th>Slot</th><th>Where</th><th>Size</th><th>Live</th><th>Fill mode</th><th>AdSense slot</th><th>Booked</th></tr></thead>
        <tbody>{list.map((p) => (
          <tr key={p.key} className="rowhover">
            <td><div style={{ fontWeight: 700 }}>{p.label}</div><div className="faint" style={{ fontSize: ".72rem" }}>{p.page_type}</div></td>
            <td className="muted" style={{ fontSize: ".82rem" }}>{p.position_label || "—"}</td>
            <td className="muted" style={{ fontSize: ".82rem" }}>{(p.size_format || "").replace(/_/g, " ")}</td>
            <td>
              <button
                role="switch"
                aria-checked={p.active !== false}
                aria-label={`${p.active !== false ? "Turn off" : "Turn on"} ${p.label}`}
                className={`cert-toggle ${p.active !== false ? "on" : ""}`}
                style={{ flex: "none" }}
                onClick={() => { const next = !(p.active !== false); patch(p.key, { active: next }); toast(next ? "Slot live" : "Slot off"); }}
              >
                <span className="cert-switch"><span className="cert-knob" /></span>
              </button>
            </td>
            <td>
              <select className="select" style={{ minWidth: 150 }} value={p.fill_mode || "direct_then_adsense"} onChange={(e) => patch(p.key, { fillMode: e.target.value })}>
                {FILL_MODES.map((m) => <option key={m} value={m}>{FILL_LABEL[m]}</option>)}
              </select>
            </td>
            <td>
              {(p.fill_mode === "adsense_only" || p.fill_mode === "direct_then_adsense") ? (
                <input className="input" style={{ width: 120 }} defaultValue={p.adsense_slot || ""} placeholder="1234567890"
                  onBlur={(e) => { const v = e.target.value.trim(); if (v !== (p.adsense_slot || "")) patch(p.key, { adsenseSlot: v }); }} />
              ) : <span className="faint">—</span>}
            </td>
            <td className="muted">{p.booked || 0}/{p.inventory_cap}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

export function AdminFeatured({ toast }: { toast: (msg: string) => void }) {
  const [data, setData] = useState<{ placements: AdPlacement[]; campaigns: AdCampaign[]; revenueCents: number } | null>(null);
  const [err, setErr] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const empty = { title: "", placementKey: "", advertiserName: "", rate: "", startsOn: "", endsOn: "", targetUrl: "", body: "", imageUrl: "" };
  const [form, setForm] = useState(empty);

  const load = async () => {
    try {
      const r = await fetch("/api/admin/campaigns");
      const d = await r.json();
      if (d.ok) { setData(d); setErr(false); } else setErr(true);
    } catch { setErr(true); }
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    await fetch("/api/admin/campaigns", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    toast(`Campaign ${status}`);
    load();
  };
  const setReview = async (id: string, reviewStatus: string) => {
    await fetch("/api/admin/campaigns", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, reviewStatus }) });
    toast(reviewStatus === "approved" ? "Creative approved — now serving" : "Creative rejected");
    load();
  };
  const uploadCreative = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const r = await fetch("/api/admin/ads/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (d.ok && d.url) { setForm((f) => ({ ...f, imageUrl: d.url })); toast("Image uploaded"); }
      else if (d.simulated) { setForm((f) => ({ ...f, imageUrl: URL.createObjectURL(file) })); toast("Preview only (storage not configured)"); }
      else toast(d.error || "Upload failed");
    } catch { toast("Upload failed"); }
    finally { setUploading(false); }
  };
  const create = async () => {
    if (!form.title.trim() || !form.placementKey) return toast("Add a title and pick a placement");
    const res = await fetch("/api/admin/campaigns", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title, placementKey: form.placementKey, advertiserName: form.advertiserName || undefined,
        rateCents: Math.round((Number(form.rate) || 0) * 100), startsOn: form.startsOn || undefined,
        endsOn: form.endsOn || undefined, targetUrl: form.targetUrl || undefined, body: form.body || undefined,
        imageUrl: form.imageUrl || undefined, status: "active",
      }),
    });
    const d = await res.json();
    if (d.ok) { toast("Campaign created — pending review before it serves"); setForm(empty); setCreating(false); load(); }
    else toast(d.error || "Couldn’t create campaign");
  };

  if (err) {
    return <Empty icon="trophy" title="Sponsored ads" body="Sign in as an admin (and apply the ads migration) to create campaigns and track impressions, clicks and revenue." />;
  }
  const placements = data?.placements || [];
  const campaigns = data?.campaigns || [];

  return (
    <div className="stack g16" style={{ maxWidth: 980 }}>
      <div className="flex between center wrap g10">
        <div>
          <h3 style={{ fontSize: "1.15rem" }}>Sponsored ads &amp; placements</h3>
          <p className="faint" style={{ fontSize: ".86rem" }}>
            {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"} · <strong>{fmtSGD(data?.revenueCents || 0)}</strong> booked
          </p>
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => setCreating((c) => !c)}><Icon name="plus" size={16} /> New campaign</button>
      </div>

      {/* Placements — on/off + fill-mode control */}
      <AdminPlacements toast={toast} />

      {/* Rate card */}
      <div className="flex g8 wrap">
        {placements.map((p) => (
          <span key={p.key} className="tag" title={`${p.inventory_cap} slot${p.inventory_cap === 1 ? "" : "s"}`}>
            {p.label} · {fmtSGD(p.monthly_rate_cents)}/mo
          </span>
        ))}
      </div>

      {creating && (
        <div className="card" style={{ padding: 16 }}>
          <div className="grid2">
            <div className="field"><label>Campaign title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Qahwa & Co. — Ramadan brunch" /></div>
            <div className="field"><label>Placement</label>
              <select className="select" value={form.placementKey} onChange={(e) => setForm({ ...form, placementKey: e.target.value })}>
                <option value="">Select placement</option>
                {placements.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
            <div className="field"><label>Advertiser</label><input className="input" value={form.advertiserName} onChange={(e) => setForm({ ...form, advertiserName: e.target.value })} placeholder="Business name" /></div>
            <div className="field"><label>Agreed rate (SGD)</label><input className="input" type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="0.00" /></div>
            <div className="field"><label>Starts</label><input className="input" type="date" value={form.startsOn} onChange={(e) => setForm({ ...form, startsOn: e.target.value })} /></div>
            <div className="field"><label>Ends</label><input className="input" type="date" value={form.endsOn} onChange={(e) => setForm({ ...form, endsOn: e.target.value })} /></div>
            <div className="field"><label>Click-through URL</label><input className="input" value={form.targetUrl} onChange={(e) => setForm({ ...form, targetUrl: e.target.value })} placeholder="/business/… or https://…" /></div>
            <div className="field"><label>Tagline</label><input className="input" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Short creative line" /></div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Creative image {uploading && <span className="faint">· uploading…</span>}</label>
              <div className="flex g10 center wrap">
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCreative(f); }} />
                {form.imageUrl && <img src={form.imageUrl} alt="creative preview" style={{ height: 44, borderRadius: 8, border: "1px solid var(--line)" }} />}
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-sm mt12" onClick={create} disabled={uploading}>Create — submit for review</button>
        </div>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="admin-tablehead"><h3 style={{ fontSize: "1.05rem" }}>Campaigns</h3><span className="faint" style={{ fontSize: ".82rem" }}>Review → live impressions, clicks &amp; CTR</span></div>
        {campaigns.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center" }} className="faint">No campaigns yet — book one to start tracking.</div>
        ) : (
          <div className="tbl-scroll"><table className="tbl">
            <thead><tr><th>Campaign</th><th>Placement</th><th>Status</th><th>Review</th><th>Impr.</th><th>Clicks</th><th>CTR</th><th>Rate</th><th>Actions</th></tr></thead>
            <tbody>{campaigns.map((c) => (
              <tr key={c.campaign_id} className="rowhover">
                <td>
                  <div className="flex g6 center wrap" style={{ fontWeight: 700 }}>
                    {c.title}
                    {c.created_via === "self_serve" && <span className="pill-tag blue" style={{ fontSize: ".68rem" }}>Self-serve</span>}
                  </div>
                  <div className="faint" style={{ fontSize: ".78rem" }}>{c.advertiser_name || "—"}{c.starts_on ? ` · ${c.starts_on} → ${c.ends_on || "—"}` : ""}</div>
                </td>
                <td className="muted">{placements.find((p) => p.key === c.placement_key)?.label || c.placement_key}</td>
                <td><span className={`pill-tag ${STATUS_TAG[c.status] || ""}`}>{c.status}</span></td>
                <td><span className={`pill-tag ${REVIEW_TAG[c.review_status || "approved"] || ""}`}>{c.review_status || "approved"}</span></td>
                <td>{c.impressions.toLocaleString()}</td>
                <td>{c.clicks.toLocaleString()}</td>
                <td>{c.ctr}%</td>
                <td className="muted">{fmtSGD(c.rate_cents)}</td>
                <td>
                  <div className="flex g6 wrap">
                    {c.review_status !== "approved" && <button className="btn btn-soft btn-sm" onClick={() => setReview(c.campaign_id, "approved")}>Approve</button>}
                    {c.review_status !== "rejected" && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setReview(c.campaign_id, "rejected")}>Reject</button>}
                    {c.status !== "active" && <button className="btn btn-ghost btn-sm" onClick={() => setStatus(c.campaign_id, "active")}>Activate</button>}
                    {c.status === "active" && <button className="btn btn-ghost btn-sm" onClick={() => setStatus(c.campaign_id, "paused")}>Pause</button>}
                    {c.status !== "ended" && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setStatus(c.campaign_id, "ended")}>End</button>}
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      {/* Brand-safety policy — the AdSense block list + direct-review rubric */}
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: "1rem", marginBottom: 6 }}>Brand-safety — blocked advertiser categories</h3>
        <p className="faint" style={{ fontSize: ".82rem", marginBottom: 10 }}>
          Applied to AdSense (mirror in the AdSense dashboard → Blocking controls) and used as the review rubric for direct creatives.
        </p>
        <div className="flex g8 wrap">
          {BLOCKED_AD_CATEGORIES.map((cat) => (
            <span key={cat.key} className="tag" title={cat.why} style={{ color: "var(--danger)" }}>{cat.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminPayments() {
  return (
    <div>
      <Empty icon="dollar" title="Subscription & payment data lives in Stripe" body="Humble Halal uses Stripe for plan subscriptions and event payouts. Your Stripe Dashboard holds the authoritative MRR, invoices, payouts and failed-payment ledger." />
      <div className="flex center" style={{ marginTop: 16 }}>
        <a className="btn btn-gold" href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer"><Icon name="settings" size={16} /> Open Stripe Dashboard</a>
      </div>
    </div>
  );
}

interface RevData { totals: { count: number; confirmed: number; cancelled: number; refunded: number }; byCurrency: { currency: string; gross: number; commission: number }[]; recent: { hotel?: string; city?: string; checkin?: string; checkout?: string; currency?: string; total?: number | null; commission?: number | null; status: string }[] }
export function AdminTravelRevenue() {
  const [data, setData] = useState<RevData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { const r = await fetch("/api/admin/travel-revenue"); const d = await r.json(); if (d.ok) setData(d); } catch { /* ignore */ } setLoading(false); })(); }, []);
  return (
    <div>
      {/* Our ledger (reconciliation view). */}
      {loading ? (
        <div className="route-loading" role="status"><span className="spinner" /> <span className="faint">Loading…</span></div>
      ) : !data || data.totals.count === 0 ? (
        <Empty icon="plane" title="No travel bookings yet" body="Hotel bookings (and their commissions) appear here once you have them. LiteAPI's dashboard holds the authoritative payout ledger." />
      ) : (
        <>
          <div className="notice notice-warn" style={{ marginBottom: 16 }}><Icon name="info" size={18} /><span>Reconciliation view from our records. LiteAPI&apos;s dashboard remains the source of truth for actual payouts and refunds.</span></div>
          <div className="admin-statgrid">
            <div className="stat"><div className="v">{data.totals.confirmed}</div><div className="l">Confirmed</div></div>
            <div className="stat"><div className="v">{data.totals.cancelled}</div><div className="l">Cancelled</div></div>
            <div className="stat"><div className="v">{data.totals.refunded}</div><div className="l">Refunded</div></div>
            {data.byCurrency.map((c) => <div key={c.currency} className="stat"><div className="v">{c.currency} {c.commission.toLocaleString()}</div><div className="l">Commission ({c.currency})</div></div>)}
          </div>
          <div className="card mt20" style={{ overflow: "hidden" }}>
            <div className="admin-tablehead"><h3 style={{ fontSize: "1.05rem" }}>Recent hotel bookings</h3></div>
            <div className="tbl-scroll"><table className="tbl">
              <thead><tr><th>Hotel</th><th>City</th><th>Dates</th><th>Total</th><th>Commission</th><th>Status</th></tr></thead>
              <tbody>{data.recent.map((b, i) => (
                <tr key={i} className="rowhover"><td style={{ fontWeight: 600 }}>{b.hotel || "—"}</td><td className="muted">{b.city || "—"}</td><td className="muted">{b.checkin && b.checkout ? `${b.checkin} → ${b.checkout}` : "—"}</td><td style={{ fontWeight: 700 }}>{b.total != null ? `${b.currency || ""} ${b.total}` : "—"}</td><td>{b.commission != null ? `${b.currency || ""} ${b.commission}` : "—"}</td><td><span className={`pill-tag ${b.status === "confirmed" ? "green" : "gray"}`}>{b.status}</span></td></tr>
              ))}</tbody>
            </table></div>
          </div>
        </>
      )}

      {/* LiteAPI's own weekly sales (payout source of truth) + promo voucher creation. */}
      <LiteApiWeeklyAnalytics />
      <VoucherCreator />
    </div>
  );
}

/* LiteAPI weekly sales analytics (da.liteapi.travel) — the authoritative payout view. */
function LiteApiWeeklyAnalytics() {
  const [weeks, setWeeks] = useState<{ week: string; bookings: number; revenue: number; currency: string }[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulated, setSimulated] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { (async () => {
    try {
      const r = await fetch("/api/admin/travel-analytics");
      const d = await r.json();
      if (d.ok) { setWeeks(d.weeks || []); setSimulated(!!d.simulated); }
      // Distinguish a real upstream failure from "no data yet" so the da.liteapi.travel
      // host / account-enablement question is diagnosable rather than silent.
      else setErr(d.status === 404 ? "Couldn't load — endpoint not found (verify the da.liteapi.travel host)." : d.status === 401 || d.status === 403 ? "Couldn't load — not authorised (is the analytics API enabled on your LiteAPI account?)." : "Couldn't load LiteAPI analytics right now.");
    } catch { setErr("Couldn't reach LiteAPI analytics."); }
    setLoading(false);
  })(); }, []);
  return (
    <div className="card mt20" style={{ padding: 20 }}>
      <h3 style={{ fontSize: "1.05rem", marginBottom: 4 }}>LiteAPI weekly sales</h3>
      <p className="muted" style={{ fontSize: ".84rem", marginBottom: 14 }}>From LiteAPI&apos;s analytics — the authoritative payout view (last 12 weeks).</p>
      {loading ? <div className="route-loading" role="status"><span className="spinner" /></div>
        : err ? <p style={{ color: "var(--danger)", fontSize: ".88rem" }}>{err}</p>
        : simulated ? <p className="muted">Connect a LiteAPI key to see weekly sales here.</p>
        : !weeks || !weeks.length ? <p className="muted">No weekly data yet.</p>
        : <div className="tbl-scroll"><table className="tbl"><thead><tr><th>Week</th><th>Bookings</th><th>Revenue</th></tr></thead><tbody>{weeks.map((w, i) => (<tr key={i} className="rowhover"><td className="muted">{w.week}</td><td>{w.bookings}</td><td style={{ fontWeight: 700 }}>{w.currency} {Math.round(w.revenue).toLocaleString()}</td></tr>))}</tbody></table></div>}
    </div>
  );
}

/* Create a promo voucher (LiteAPI da.liteapi.travel). Travellers redeem at checkout. */
function VoucherCreator() {
  const [form, setForm] = useState({ code: "", discountType: "percentage", discountValue: "", currency: "USD", validityEnd: "", usagesLimit: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const r = await fetch("/api/admin/travel-vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, discountValue: Number(form.discountValue), usagesLimit: form.usagesLimit ? Number(form.usagesLimit) : undefined }),
      });
      const d = await r.json();
      setMsg(d.ok ? { ok: true, text: `Created promo ${d.code}.` } : { ok: false, text: d.error || (d.reason === "liteapi_not_configured" ? "Connect a LiteAPI key first." : "Couldn't create voucher.") });
      if (d.ok) setForm((f) => ({ ...f, code: "", discountValue: "" }));
    } catch { setMsg({ ok: false, text: "Couldn't create voucher." }); }
    setBusy(false);
  };
  return (
    <div className="card mt20" style={{ padding: 20 }}>
      <h3 style={{ fontSize: "1.05rem", marginBottom: 4 }}>Create a promo voucher</h3>
      <p className="muted" style={{ fontSize: ".84rem", marginBottom: 14 }}>Travellers redeem the code at checkout (hotels &amp; flights). Discounts come off LiteAPI&apos;s side.</p>
      <form className="flex g10" style={{ flexWrap: "wrap", alignItems: "flex-end" }} onSubmit={submit}>
        <div className="field"><label>Code</label><input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="RAMADAN10" required /></div>
        <div className="field"><label>Type</label><select value={form.discountType} onChange={(e) => set("discountType", e.target.value)}><option value="percentage">Percentage</option><option value="fixed">Fixed</option></select></div>
        <div className="field"><label>Value</label><input type="number" min="1" value={form.discountValue} onChange={(e) => set("discountValue", e.target.value)} placeholder={form.discountType === "percentage" ? "10" : "25"} required /></div>
        <div className="field"><label>Currency</label><input value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} style={{ width: 80 }} /></div>
        <div className="field"><label>Expires</label><input type="date" value={form.validityEnd} onChange={(e) => set("validityEnd", e.target.value)} /></div>
        <div className="field"><label>Usage limit</label><input type="number" min="1" value={form.usagesLimit} onChange={(e) => set("usagesLimit", e.target.value)} placeholder="∞" style={{ width: 100 }} /></div>
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Creating…" : "Create voucher"}</button>
      </form>
      {msg && <p style={{ marginTop: 10, fontSize: ".88rem", color: msg.ok ? "var(--emerald)" : "var(--danger)" }}>{msg.text}</p>}
    </div>
  );
}

export function AdminAudit() {
  // Real data only — this used to seed six MOCK rows as initial state, so a
  // failed/absent API rendered a fabricated audit trail as if it were real.
  const [logs, setLogs] = useState<[string, string, string, string][] | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/audit");
        if (!r.ok) { setLogs([]); return; }
        const d = await r.json();
        setLogs(d.ok && Array.isArray(d.items)
          ? d.items.map((l: Record<string, unknown>) => [String(l.action ?? "—"), String(l.target ?? "").slice(0, 12) || "—", "admin", timeAgo(l.created_at)] as [string, string, string, string])
          : []);
      } catch { setLogs([]); }
    })();
  }, []);
  return (
    <div className="card" style={{padding:20}}>
      <h3 style={{fontSize:'1.1rem', marginBottom:14}}>Audit log</h3>
      {logs === null ? (
        <p className="faint" style={{fontSize:'.88rem'}}>Loading audit log…</p>
      ) : logs.length === 0 ? (
        <Empty icon="doc" title="No audit entries yet" body="Admin actions (approvals, verifications, removals) appear here as they happen." />
      ) : (
        <div className="audit-list">
          {logs.map(([action,target,who,time],i)=>(
            <div key={i} className="audit-row"><span className="audit-dot"/><div className="f1"><div><strong>{action}</strong> · <span className="muted">{target}</span></div><div className="faint" style={{fontSize:'.8rem'}}>{who} · {time}</div></div></div>
          ))}
        </div>
      )}
    </div>
  );
}
