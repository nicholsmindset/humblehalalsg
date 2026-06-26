"use client";

/* Humble Halal — Admin Dashboard (ported from screens-admin.jsx) */
import { Fragment, useEffect, useState, type FormEvent } from "react";
import { HHData } from "@/lib/data";
import type { BadgeKey, Listing } from "@/lib/types";
import { halalSgSearchUrl } from "@/lib/muis";
import { useApp } from "../app-context";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Badge, Empty, Icon, ImagePh } from "../ui";
import { fmtSGD } from "@/lib/fees";

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

async function queueAct(type: string, id: string, action: string): Promise<boolean> {
  try {
    const r = await fetch("/api/admin/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, action }),
    });
    const d = await r.json().catch(() => ({ ok: false }));
    return !!d.ok;
  } catch {
    return false;
  }
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

export function AdminScreen() {
  const { navigate, toast } = useApp();
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
    ["events", "Event approvals", "calendar"],
    ["verification", "Halal verification", "shield-check"],
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
          <div className="flex g10 center"><button className="map-iconbtn" style={{width:40,height:40,borderRadius:11}}><Icon name="bell" size={18}/></button><span className="avatar" style={{background:'var(--emerald)',color:'#fff'}}>A</span></div>
        </div>

        <div className="admin-body">
          {section==='overview' && <AdminOverview setSection={setSection} />}
          {section==='revenue' && <AdminRevenue />}
          {section==='rollout' && <AdminRollout />}
          {section==='approvals' && <AdminApprovals toast={toast} navigate={navigate} />}
          {section==='events' && <AdminEvents toast={toast} navigate={navigate} />}
          {section==='verification' && <><AdminCertQueue toast={toast} /><AdminVerification toast={toast} /></>}
          {section==='hotels' && <AdminHotelVerify toast={toast} />}
          {section==='reviews' && <AdminReviews toast={toast} />}
          {section==='reports' && <AdminReports toast={toast} />}
          {section==='users' && <AdminUsers />}
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

export function AdminMonetization() {
  const { flags, setFlag, toast, ramadanModeEnabled, setRamadanModeEnabled } = useApp();
  // Ramadan mode persists to platform_settings so EVERY visitor sees it (server-
  // hydrated), unlike the demo paid-flag toggles which are client-side only.
  const toggleRamadan = async () => {
    const next = !ramadanModeEnabled;
    setRamadanModeEnabled(next);
    toast(`Ramadan mode ${next ? "enabled — visitors will see it on next load" : "disabled"}`);
    try {
      await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ramadan_mode_enabled: next }) });
    } catch { /* optimistic; admin can retry */ }
  };
  const rows: { key: "paidTickets" | "paidAds" | "paidPlans"; title: string; desc: string }[] = [
    { key: "paidTickets", title: "Paid event tickets", desc: "Let businesses sell paid tickets (Stripe Connect). When OFF, every event is free RSVP only and the paid checkout API is blocked server-side." },
    { key: "paidAds", title: "Paid advertising", desc: "Enable purchasable ad placements on the Advertise page. When OFF, ad CTAs invite enquiries instead of charging." },
    { key: "paidPlans", title: "Paid listing plans", desc: "Enable Verified / Featured / Premium subscriptions on the Pricing page and billing." },
  ];
  return (
    <div style={{ maxWidth: 720 }}>
      <div className="notice notice-warn" style={{ marginBottom: 18 }}>
        <Icon name="info" size={18} />
        <span>
          Monetization launches <strong>OFF</strong> — the site runs on free tickets. Flip a switch to go live with a revenue stream.
          Paid flows also require Stripe keys + each business to complete payout onboarding.
        </span>
      </div>
      <div className="stack g12">
        {rows.map((r) => {
          const on = flags[r.key];
          return (
            <div key={r.key} className="card" style={{ padding: 18, display: "flex", gap: 14, alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <div className="flex g8 center" style={{ marginBottom: 4 }}>
                  <h3 style={{ fontSize: "1.05rem" }}>{r.title}</h3>
                  <span className={`tag ${on ? "" : ""}`} style={{ background: on ? "var(--emerald-50)" : "var(--cream-200)", color: on ? "var(--emerald)" : "var(--ink-soft)" }}>
                    {on ? "Live" : "Off"}
                  </span>
                </div>
                <p className="muted" style={{ fontSize: ".9rem", lineHeight: 1.5 }}>{r.desc}</p>
              </div>
              <button
                role="switch"
                aria-checked={on}
                aria-label={`${on ? "Disable" : "Enable"} ${r.title}`}
                className={`cert-toggle ${on ? "on" : ""}`}
                style={{ flex: "none" }}
                onClick={() => {
                  setFlag(r.key, !on);
                  toast(`${r.title} ${!on ? "enabled" : "disabled"}`);
                }}
              >
                <span className="cert-switch"><span className="cert-knob" /></span>
              </button>
            </div>
          );
        })}

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
    try { const r = await fetch("/api/admin/revenue"); const j = await r.json(); if (j.ok) setD(j); }
    catch { /* ignore */ }
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
    try { const r = await fetch("/api/admin/revenue"); const j = await r.json(); if (j.ok) setFlags(j.flags || {}); else setFlags({}); }
    catch { setFlags({}); }
  })(); }, []);

  const liveCount = ROLLOUT_STAGES.filter((s) => s.flags.every((f) => flags?.[f])).length;

  return (
    <div className="stack g16" style={{ maxWidth: 740 }}>
      <div>
        <div className="flex between center wrap g10" style={{ marginBottom: 6 }}>
          <h2 style={{ fontSize: "1.25rem" }}>Monetisation roadmap</h2>
          <span className="pill-tag" style={{ background: "var(--cream-200)", color: "var(--ink-soft)" }}>{liveCount} of {ROLLOUT_STAGES.length} live</span>
        </div>
        <p className="muted" style={{ fontSize: ".88rem", lineHeight: 1.55 }}>
          Switch on revenue streams in order of operational risk — easiest first. Each goes live with a <strong>Vercel env</strong> flag (<code>PAID_*_ENABLED</code>); the Monetization toggles are demo-only. Full steps &amp; rollback: <code>docs/runbooks/paid-flag-rollout.md</code>.
        </p>
      </div>

      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {ROLLOUT_STAGES.map((s, i) => {
          const allLive = s.flags.every((f) => flags?.[f]);
          const partLive = !allLive && s.flags.some((f) => flags?.[f]);
          const accent = allLive ? "var(--emerald)" : partLive ? "#b8860b" : "var(--cream-300, #e4ddcd)";
          const last = i === ROLLOUT_STAGES.length - 1;
          return (
            <li key={s.n} style={{ display: "flex", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
                <span aria-hidden style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 700, fontSize: ".95rem", flex: "none", background: allLive || partLive ? accent : "var(--cream-100, #f6f1e7)", color: allLive || partLive ? "#fff" : "var(--ink-soft)", border: `2px solid ${accent}` }}>
                  {allLive ? <Icon name="check" size={16} /> : s.n}
                </span>
                {!last && <span aria-hidden style={{ flex: 1, width: 2, background: "var(--cream-300, #e4ddcd)", minHeight: 18, margin: "4px 0" }} />}
              </div>

              <div className="card" style={{ padding: 16, marginBottom: 14, flex: 1, borderLeft: `3px solid ${accent}` }}>
                <div className="flex between center wrap g10" style={{ marginBottom: 6 }}>
                  <h3 style={{ fontSize: "1.05rem" }}>{s.title}</h3>
                  <span className="pill-tag" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: allLive ? "var(--emerald-50)" : partLive ? "rgba(184,134,11,.13)" : "var(--cream-200)", color: allLive ? "var(--emerald)" : partLive ? "#8a6610" : "var(--ink-soft)" }}>
                    <span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: accent }} />
                    {allLive ? "Live" : partLive ? "Partly live" : "Off"}
                  </span>
                </div>
                <p className="muted" style={{ fontSize: ".88rem", lineHeight: 1.5, marginBottom: 12 }}>{s.why}</p>
                <div className="flex g8 wrap" style={{ marginBottom: 12 }}>
                  {s.prereqs.map((p) => <span key={p} className="tag" style={{ fontSize: ".78rem" }}><Icon name="check" size={12} /> {p}</span>)}
                </div>
                <code className="faint" style={{ fontSize: ".76rem", background: "var(--cream-100, #f6f1e7)", padding: "3px 8px", borderRadius: 6 }}>{s.env}</code>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function AdminOverview({ setSection }: { setSection: (s: string) => void }) {
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
          {([['Listings awaiting approval','approvals','doc'],['Reports to review','reports','flag'],['Ownership claims','approvals','building'],['Verification requests','verification','shield-check']] as [string, string, string][]).map(([t,sec,icon])=>(
            <button key={t} className="attn-row" onClick={()=>setSection(sec)}><span className="flex g10 center"><span className="attn-ico"><Icon name={icon} size={17}/></span>{t}</span><Icon name="chevron" size={17}/></button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ApprovalRow { id: string; name: string; cat: string; area: string; badges: BadgeKey[]; tone?: string; image?: string; status: string; submitted: string }
export function AdminApprovals({ toast, navigate }: { toast: (msg: string) => void; navigate: (screen: string, params?: Record<string, unknown>) => void }) {
  const mock: ApprovalRow[] = HHData.listings.slice(0,7).map((l,i)=>({ id: l.id, name: l.name, cat: l.cat, area: l.area, badges: l.badges, tone: l.tone, image: l.image, status: i<2?'claim':'new', submitted: `${i+1}d ago` }));
  const [rows, setRows] = useState<ApprovalRow[]>(mock);
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
  const act = async (id: string, action: string) => {
    if (live && !(await queueAct("listings", id, action === "approve" ? "approve" : "reject"))) { toast("Action failed"); return; }
    setRows(r=>r.filter(x=>x.id!==id)); toast(action==='approve'?'Listing published':'Listing rejected');
  };
  return (
    <div className="card" style={{overflow:'hidden'}}>
      <div className="admin-tablehead"><div className="flex g8 center"><span className="tag">{rows.length} pending</span></div>
        <div className="searchbar" style={{maxWidth:240, padding:'4px 4px 4px 12px'}}><Icon name="search" className="lead" size={16}/><input placeholder="Search…" style={{fontSize:'.86rem'}}/></div></div>
      <div className="tbl-scroll">
        <table className="tbl">
          <thead><tr><th>Business</th><th>Type</th><th>Area</th><th>Halal claim</th><th>Submitted</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map(r=>(
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
            {rows.length===0 && <tr><td colSpan={6}><Empty icon="check" title="All caught up" body="No listings awaiting approval." /></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminEvents({ toast, navigate }: { toast: (msg: string) => void; navigate: (screen: string, params?: Record<string, unknown>) => void }) {
  const [rows, setRows] = useState(
    [HHData.events.find(e=>e.id==='e1'), HHData.events.find(e=>e.id==='e6'), HHData.events.find(e=>e.id==='e8')]
      .filter(Boolean).map((e,i)=>({ ...e!, submitted:`${i+1}d ago` }))
  );
  const act = (id: string, action: string) => { setRows(r=>r.filter(x=>x.id!==id)); toast(action==='approve'?'Event approved & published':'Event rejected'); };
  return (
    <div className="card" style={{overflow:'hidden'}}>
      <div className="admin-tablehead">
        <div className="flex g8 center"><span className="tag">{rows.length} pending</span><span className="faint" style={{fontSize:'.82rem'}}>Review before events go live</span></div>
        <div className="searchbar" style={{maxWidth:240, padding:'4px 4px 4px 12px'}}><Icon name="search" className="lead" size={16}/><input placeholder="Search events…" style={{fontSize:'.86rem'}}/></div>
      </div>
      <div className="tbl-scroll">
        <table className="tbl">
          <thead><tr><th>Event</th><th>Category</th><th>Date</th><th>Pricing</th><th>Host</th><th>Submitted</th><th>Action</th></tr></thead>
          <tbody>
            {rows.map(r=>(
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
            {rows.length===0 && <tr><td colSpan={7}><Empty icon="check" title="All caught up" body="No events awaiting approval." /></td></tr>}
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

export function AdminVerification({ toast }: { toast: (msg: string) => void }) {
  const [rows] = useState<Listing[]>(HHData.listings.slice(0, 5).map((l) => ({ ...l })));
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

interface ReportRow { id: string; biz: string; reason: string; by: string; time: string; sev: string }
const REPORT_LABEL: Record<string, string> = { halal: "Wrong halal status", closed: "Permanently closed", hours: "Wrong opening hours", address: "Wrong address", owner: "Ownership dispute", menu: "Menu issue", other: "Other" };
export function AdminReports({ toast }: { toast: (msg: string) => void }) {
  const mock: ReportRow[] = [
    {id:'rp1', biz:'Tok Tok Mee Pok House', reason:'Wrong halal status', by:'Nadia K.', time:'2h ago', sev:'high'},
    {id:'rp2', biz:'Kopi & Kueh Corner', reason:'Permanently closed', by:'Faizal M.', time:'5h ago', sev:'high'},
    {id:'rp3', biz:'Qahwa & Co.', reason:'Wrong opening hours', by:'Imran S.', time:'1d ago', sev:'low'},
    {id:'rp4', biz:'Barakah Mart', reason:'Wrong address', by:'Sara L.', time:'2d ago', sev:'low'},
  ];
  const [rows,setRows]=useState<ReportRow[]>(mock);
  const [live, setLive] = useState(false);
  useEffect(() => {
    queueGet("reports").then((items) => {
      if (!items) return;
      setLive(true);
      setRows(items.map((r) => {
        const code = String(r.reason ?? "other");
        return { id: r.id, biz: String(r.business_ref ?? r.business_id ?? "—"), reason: `${REPORT_LABEL[code] ?? code}${r.details ? ` — ${String(r.details).slice(0, 80)}` : ""}`, by: "community", time: timeAgo(r.created_at), sev: code === "halal" || code === "closed" ? "high" : "low" };
      }));
    });
  }, []);
  const resolve=async (id: string)=>{
    if (live && !(await queueAct("reports", id, "resolve"))) { toast("Action failed"); return; }
    setRows(r=>r.filter(x=>x.id!==id)); toast('Report resolved');
  };
  return (
    <div className="stack g12">
      {rows.map(r=>(
        <div key={r.id} className="card" style={{padding:18}}>
          <div className="flex between center wrap g10">
            <div className="flex g12 center"><span className={`sev-dot ${r.sev}`}/><div><div style={{fontWeight:700}}>{r.reason}</div><div className="faint" style={{fontSize:'.82rem'}}>{r.biz} · reported by {r.by} · {r.time}</div></div></div>
            <div className="flex g8"><button className="btn btn-outline btn-sm">View listing</button><button className="btn btn-soft btn-sm">Contact owner</button><button className="btn btn-primary btn-sm" onClick={()=>resolve(r.id)}>Resolve</button></div>
          </div>
        </div>
      ))}
      {rows.length===0 && <Empty icon="check" title="Inbox zero" body="No open reports or corrections." />}
    </div>
  );
}

interface ReviewRow { id: string; avatar: string; name: string; biz: string; rating: number; text: string; flagged: boolean }
export function AdminReviews({ toast }: { toast: (msg: string) => void }) {
  const mock: ReviewRow[] = HHData.reviews.map((r,i)=>({ id: r.id, avatar: r.avatar, name: r.name, biz: HHData.listings[i].name, rating: r.rating, text: r.text, flagged: i===0 }));
  const [rows,setRows]=useState<ReviewRow[]>(mock);
  const [live, setLive] = useState(false);
  useEffect(() => {
    queueGet("reviews").then((items) => {
      if (!items) return;
      setLive(true);
      setRows(items.map((r) => ({ id: r.id, avatar: "★", name: "Reviewer", biz: String(r.business_id ?? "—").slice(0, 8), rating: Number(r.rating) || 0, text: String(r.text ?? ""), flagged: r.status === "flagged" })));
    });
  }, []);
  const act=async (id: string,a: string)=>{
    if (live && !(await queueAct("reviews", id, a === "keep" ? "approve" : "reject"))) { toast("Action failed"); return; }
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
    </div>
  );
}

type AdminUserRow = { id: string; email: string; name: string | null; role: string; created_at: string };
export function AdminUsers() {
  const [rows, setRows] = useState<AdminUserRow[] | null>(null);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "owner">("all");
  useEffect(() => {
    let alive = true;
    (async () => {
      const sb = getSupabaseBrowser();
      if (!sb) { if (alive) setRows([]); return; }
      const { data, error } = await sb.rpc("admin_list_users", { p_limit: 200 });
      if (alive) setRows(!error && Array.isArray(data) ? (data as AdminUserRow[]) : []);
    })();
    return () => { alive = false; };
  }, []);
  const filtered = (rows || []).filter((u) =>
    (roleFilter === "all" || u.role === roleFilter) &&
    (!q || (u.name || "").toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="card" style={{overflow:'hidden'}}>
      <div className="admin-tablehead"><div className="flex g8">
        <button className={`chip ${roleFilter==="all"?"active":""}`} onClick={()=>setRoleFilter("all")}>All</button>
        <button className={`chip ${roleFilter==="user"?"active":""}`} onClick={()=>setRoleFilter("user")}>Users</button>
        <button className={`chip ${roleFilter==="owner"?"active":""}`} onClick={()=>setRoleFilter("owner")}>Owners</button>
      </div>
        <div className="searchbar" style={{maxWidth:240, padding:'4px 4px 4px 12px'}}><Icon name="search" className="lead" size={16}/><input placeholder="Search users…" value={q} onChange={(e)=>setQ(e.target.value)} style={{fontSize:'.86rem'}}/></div></div>
      {rows === null ? (
        <div style={{ padding: 24, opacity: 0.5 }} aria-busy="true">Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 24 }}><Empty icon="users" title="No users yet" body="Signed-up users appear here. (Requires migration 0018 + admin access.)" /></div>
      ) : (
        <div className="tbl-scroll"><table className="tbl">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
          <tbody>{filtered.map((u)=>(
            <tr key={u.id} className="rowhover">
              <td><div className="flex g8 center"><span className="avatar" style={{width:32,height:32,fontSize:'.78rem'}}>{(u.name||u.email||'?')[0].toUpperCase()}</span><span style={{fontWeight:600}}>{u.name||'—'}</span></div></td>
              <td className="muted">{u.email}</td>
              <td><span className={`pill-tag ${u.role==='owner'?'blue':u.role==='admin'?'green':'gray'}`}>{u.role}</span></td>
              <td className="muted">{u.created_at ? new Date(u.created_at).toLocaleDateString("en-SG",{day:"numeric",month:"short",year:"numeric"}) : "—"}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}

export function AdminCatalog({ toast }: { toast: (msg: string) => void }) {
  return (
    <div className="admin-twocol">
      <div className="card" style={{padding:20}}>
        <div className="flex between center"><h3 style={{fontSize:'1.1rem'}}>Categories</h3><button className="btn btn-soft btn-sm" onClick={()=>toast('Add category')}><Icon name="plus" size={15}/> Add</button></div>
        <div className="stack g8 mt14">{HHData.categories.map(c=>(<div key={c.id} className="catalog-row"><span className="flex g10 center"><span className="attn-ico"><Icon name={c.icon} size={16}/></span>{c.label}</span><div className="flex g6"><button className="btn btn-ghost btn-sm"><Icon name="edit" size={15}/></button></div></div>))}</div>
      </div>
      <div className="card" style={{padding:20}}>
        <div className="flex between center"><h3 style={{fontSize:'1.1rem'}}>Locations / areas</h3><button className="btn btn-soft btn-sm" onClick={()=>toast('Add area')}><Icon name="plus" size={15}/> Add</button></div>
        <div className="stack g8 mt14">{HHData.areas.map(a=>(<div key={a.id} className="catalog-row"><span className="flex g10 center"><Icon name="pin" size={16} style={{color:'var(--emerald)'}}/>{a.name}</span><span className="faint" style={{fontSize:'.82rem'}}>{a.count} listings</span></div>))}</div>
      </div>
    </div>
  );
}

/* ── Sponsored-ad campaign manager (Phase 2) ────────────────────────────────
   Real schema-backed: sales team books campaigns on placements, tracks live
   impressions/clicks/CTR + booked revenue. Degrades to a sign-in prompt when
   the backend isn't configured / caller isn't an admin. */
type AdPlacement = { key: string; label: string; monthly_rate_cents: number; inventory_cap: number };
type AdCampaign = {
  campaign_id: string; title: string; placement_key: string; status: string;
  advertiser_name: string | null; rate_cents: number; starts_on: string | null; ends_on: string | null;
  impressions: number; clicks: number; ctr: number;
};
const STATUS_TAG: Record<string, string> = { active: "green", paused: "amber", scheduled: "blue", draft: "", ended: "" };

export function AdminFeatured({ toast }: { toast: (msg: string) => void }) {
  const [data, setData] = useState<{ placements: AdPlacement[]; campaigns: AdCampaign[]; revenueCents: number } | null>(null);
  const [err, setErr] = useState(false);
  const [creating, setCreating] = useState(false);
  const empty = { title: "", placementKey: "", advertiserName: "", rate: "", startsOn: "", endsOn: "", targetUrl: "", body: "" };
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
  const create = async () => {
    if (!form.title.trim() || !form.placementKey) return toast("Add a title and pick a placement");
    const res = await fetch("/api/admin/campaigns", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title, placementKey: form.placementKey, advertiserName: form.advertiserName || undefined,
        rateCents: Math.round((Number(form.rate) || 0) * 100), startsOn: form.startsOn || undefined,
        endsOn: form.endsOn || undefined, targetUrl: form.targetUrl || undefined, body: form.body || undefined,
        status: "active",
      }),
    });
    const d = await res.json();
    if (d.ok) { toast("Campaign created — now live"); setForm(empty); setCreating(false); load(); }
    else toast(d.error || "Couldn’t create campaign");
  };

  if (err) {
    return <Empty icon="trophy" title="Sponsored ads" body="Sign in as an admin (and apply the ads migration) to create campaigns and track impressions, clicks and revenue." />;
  }
  const placements = data?.placements || [];
  const campaigns = data?.campaigns || [];

  return (
    <div className="stack g16" style={{ maxWidth: 920 }}>
      <div className="flex between center wrap g10">
        <div>
          <h3 style={{ fontSize: "1.15rem" }}>Sponsored ads</h3>
          <p className="faint" style={{ fontSize: ".86rem" }}>
            {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"} · <strong>{fmtSGD(data?.revenueCents || 0)}</strong> booked
          </p>
        </div>
        <button className="btn btn-gold btn-sm" onClick={() => setCreating((c) => !c)}><Icon name="plus" size={16} /> New campaign</button>
      </div>

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
          </div>
          <button className="btn btn-primary btn-sm mt12" onClick={create}>Create &amp; activate</button>
        </div>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="admin-tablehead"><h3 style={{ fontSize: "1.05rem" }}>Campaigns</h3><span className="faint" style={{ fontSize: ".82rem" }}>Live impressions, clicks &amp; CTR</span></div>
        {campaigns.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center" }} className="faint">No campaigns yet — book one to start tracking.</div>
        ) : (
          <div className="tbl-scroll"><table className="tbl">
            <thead><tr><th>Campaign</th><th>Placement</th><th>Status</th><th>Impr.</th><th>Clicks</th><th>CTR</th><th>Rate</th><th>Actions</th></tr></thead>
            <tbody>{campaigns.map((c) => (
              <tr key={c.campaign_id} className="rowhover">
                <td><div style={{ fontWeight: 700 }}>{c.title}</div><div className="faint" style={{ fontSize: ".78rem" }}>{c.advertiser_name || "—"}</div></td>
                <td className="muted">{placements.find((p) => p.key === c.placement_key)?.label || c.placement_key}</td>
                <td><span className={`pill-tag ${STATUS_TAG[c.status] || ""}`}>{c.status}</span></td>
                <td>{c.impressions.toLocaleString()}</td>
                <td>{c.clicks.toLocaleString()}</td>
                <td>{c.ctr}%</td>
                <td className="muted">{fmtSGD(c.rate_cents)}</td>
                <td>
                  <div className="flex g6">
                    {c.status !== "active" && <button className="btn btn-soft btn-sm" onClick={() => setStatus(c.campaign_id, "active")}>Activate</button>}
                    {c.status === "active" && <button className="btn btn-ghost btn-sm" onClick={() => setStatus(c.campaign_id, "paused")}>Pause</button>}
                    {c.status !== "ended" && <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => setStatus(c.campaign_id, "ended")}>End</button>}
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
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
  const mock: [string, string, string, string][]=[['Approved listing','Madinah Spice Kitchen','admin@hh.sg','2 min ago'],['Granted MUIS Certified','Warung Bumbu Rempah','admin@hh.sg','18 min ago'],['Resolved report','Tok Tok Mee Pok','mod@hh.sg','1h ago'],['Removed review','Kopi & Kueh','mod@hh.sg','3h ago'],['Suspended user','imran@email.com','admin@hh.sg','5h ago'],['Featured listing','Qahwa & Co.','admin@hh.sg','1d ago']];
  const [logs, setLogs] = useState<[string, string, string, string][]>(mock);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/audit");
        if (!r.ok) return;
        const d = await r.json();
        if (d.ok && Array.isArray(d.items)) {
          setLogs(d.items.map((l: Record<string, unknown>) => [String(l.action ?? "—"), String(l.target ?? "").slice(0, 12) || "—", "admin", timeAgo(l.created_at)] as [string, string, string, string]));
        }
      } catch { /* keep mock */ }
    })();
  }, []);
  return (
    <div className="card" style={{padding:20}}>
      <h3 style={{fontSize:'1.1rem', marginBottom:14}}>Audit log</h3>
      <div className="audit-list">
        {logs.map(([action,target,who,time],i)=>(
          <div key={i} className="audit-row"><span className="audit-dot"/><div className="f1"><div><strong>{action}</strong> · <span className="muted">{target}</span></div><div className="faint" style={{fontSize:'.8rem'}}>{who} · {time}</div></div></div>
        ))}
      </div>
    </div>
  );
}
