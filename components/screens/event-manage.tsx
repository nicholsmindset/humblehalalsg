"use client";

/* Event command center — the organiser's per-event hub: live stats, attendee
   list + check-in status, requests, and settings. Reached from the owner
   dashboard "Manage". Auth is enforced by the APIs (organiser/admin), not this
   screen. Charts (Recharts) are dynamically imported so they never ship to the
   public bundle. */
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import dynamic from "next/dynamic";
import { useApp } from "../app-context";
import { Empty, Icon, ImagePh, MobileHeader } from "../ui";

const ChartSkeleton = () => <div className="muted" style={{ display: "grid", placeItems: "center", height: "100%" }}>Loading chart…</div>;
const BookingsChart = dynamic(() => import("./event-manage-charts").then((m) => m.BookingsChart), { ssr: false, loading: ChartSkeleton });
const TierChart = dynamic(() => import("./event-manage-charts").then((m) => m.TierChart), { ssr: false, loading: ChartSkeleton });

type Stats = {
  event: { id: string; title: string; slug: string; status: string; capacity: number; is_free: boolean; date_iso: string | null; requiresApproval: boolean; display: Record<string, unknown>; ticketTiers: Array<{ id: string; name: string; price_cents: number; qty: number; sold: number }> };
  tickets: { issued: number; checkedIn: number; noShows: number; valid: number; refunded: number; cancelled: number };
  attendance: { booked: number; capacity: number; pctCapacity: number };
  sales: { grossCents: number; feeCents: number; netCents: number; refundedCents: number; payout: { status: string; dueDate: string | null } };
  requests: { pending: number };
  tiers: { tier: string; issued: number; checkedIn: number }[];
  series: { day: string; bookings: number }[];
};
type Attendee = { name: string; email: string; qty: number; tier: string; orderStatus: string; checkedIn: string; checkedInAt: string | null; amount: string; bookedAt: string };

const moneyExact = (c: number) => "$" + (c / 100).toFixed(2);
const PAYOUT_CLS: Record<string, string> = { paid: "green", pending: "amber", failed: "red", none: "gray", skipped: "gray" };
const STATUS_CLS: Record<string, string> = { confirmed: "green", pending: "amber", refunded: "gray", cancelled: "red" };

type Nav = ReturnType<typeof useApp>["navigate"];
type Toast = ReturnType<typeof useApp>["toast"];

function Shell({ navigate, children }: { navigate: Nav; children: ReactNode }) {
  return (
    <div className="screen-in hh-page">
      <MobileHeader title="Manage event" onBack={() => navigate("owner-dashboard")} />
      <div className="hh-wrap" style={{ maxWidth: 860, paddingTop: 12, paddingBottom: 44 }}>{children}</div>
    </div>
  );
}

export function EventManageScreen({ slug }: { slug: string }) {
  const { navigate, toast } = useApp();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("overview");

  const loadStats = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const r = await fetch(`/api/events/${encodeURIComponent(slug)}/stats`);
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) {
        setErr(j?.reason === "forbidden" ? "You’re not the organiser of this event." : j?.reason === "unauthenticated" ? "Please sign in as the organiser." : "Couldn’t load this event.");
        setStats(null);
      } else setStats(j as Stats);
    } catch { setErr("Couldn’t load this event."); }
    finally { setLoading(false); }
  }, [slug]);
  useEffect(() => { loadStats(); }, [loadStats]);

  if (loading) return <Shell navigate={navigate}><p className="muted" style={{ textAlign: "center", padding: "48px 0" }}>Loading event…</p></Shell>;
  if (err || !stats) return <Shell navigate={navigate}><Empty icon="shield" title="Can’t open this event" body={err || "Event not found."} action="Back to dashboard" onAction={() => navigate("owner-dashboard")} /></Shell>;

  const s = stats;
  const st: [string, string] = s.event.status === "published" ? ["Live", "green"] : s.event.status === "cancelled" ? ["Cancelled", "red"] : s.event.status === "pending" ? ["Under review", "amber"] : [s.event.status, "gray"];
  const tabs: [string, string, string][] = [
    ["overview", "Overview", "chart"],
    ["attendees", "Attendees", "users"],
    ["checkin", "Check-in", "check"],
    ["marketing", "Marketing", "megaphone"],
    ...((s.event.requiresApproval || s.requests.pending > 0) ? ([["requests", "Requests", "shield-check"]] as [string, string, string][]) : []),
    ["settings", "Settings", "settings"],
  ];

  return (
    <div className="screen-in hh-page">
      <MobileHeader title="Manage event" onBack={() => navigate("owner-dashboard")} />
      <div className="hh-wrap" style={{ maxWidth: 860, paddingTop: 12, paddingBottom: 44 }}>
        <div className="flex g8 center wrap" style={{ marginBottom: 2 }}>
          <span className={`pill-tag ${st[1]}`}>{st[0]}</span>
          {s.event.date_iso && <span className="evt-meta"><Icon name="calendar" size={13} /> {s.event.date_iso}</span>}
        </div>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: "1.55rem", margin: "2px 0 14px" }}>{s.event.title}</h1>

        <div className="dash-tabs" role="tablist" style={{ position: "static", top: "auto", marginBottom: 18 }}>
          {tabs.map(([id, label, icon]) => (
            <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
              <Icon name={icon} size={16} /> <span>{label}</span>
              {id === "requests" && s.requests.pending > 0 && <span className="pill-tag amber" style={{ marginLeft: 5, padding: "1px 7px" }}>{s.requests.pending}</span>}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewTab s={s} go={setTab} />}
        {tab === "attendees" && <AttendeesTab eventId={s.event.id} slug={slug} />}
        {tab === "checkin" && <CheckinTab s={s} slug={slug} />}
        {tab === "marketing" && <MarketingTab eventId={s.event.id} slug={s.event.slug} isFree={s.event.is_free} toast={toast} />}
        {tab === "requests" && <RequestsTab s={s} slug={slug} />}
        {tab === "settings" && <SettingsTab eventId={s.event.id} s={s} toast={toast} navigate={navigate} onSaved={loadStats} />}
      </div>
    </div>
  );
}

function OverviewTab({ s, go }: { s: Stats; go: (t: string) => void }) {
  const cards: [string, string][] = [
    ["Booked", String(s.attendance.booked)],
    ["Checked in", String(s.tickets.checkedIn)],
    ["Awaiting", String(s.tickets.noShows)],
    ["Capacity", s.attendance.capacity ? `${s.attendance.pctCapacity}%` : "∞"],
  ];
  if (!s.event.is_free) {
    cards.push(["Gross sales", moneyExact(s.sales.grossCents)]);
    cards.push(["Your net", moneyExact(s.sales.netCents)]);
  }
  const pct = s.attendance.booked ? Math.round((s.tickets.checkedIn / s.attendance.booked) * 100) : 0;
  return (
    <div className="stack g20">
      <div className="admin-statgrid">
        {cards.map(([l, v]) => (<div key={l} className="stat"><div className="v">{v}</div><div className="l">{l}</div></div>))}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div className="flex between center" style={{ marginBottom: 8 }}>
          <strong>Check-in progress</strong>
          <span className="muted">{s.tickets.checkedIn} / {s.attendance.booked} arrived</span>
        </div>
        <div style={{ height: 10, borderRadius: 999, background: "var(--cream-200, #efe7d6)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "var(--emerald)", borderRadius: 999, transition: "width .3s" }} />
        </div>
      </div>

      <div className="flex g12 wrap">
        {!s.event.is_free && (
          <div className="card f1" style={{ padding: 16, minWidth: 220 }}>
            <div style={{ fontSize: ".8rem", color: "var(--ink-faint)", fontWeight: 600 }}>Payout</div>
            <div className="flex g8 center" style={{ marginTop: 6 }}>
              <span className={`pill-tag ${PAYOUT_CLS[s.sales.payout.status] || "gray"}`}>{s.sales.payout.status}</span>
              {s.sales.payout.dueDate && <span className="muted" style={{ fontSize: ".82rem" }}>due {s.sales.payout.dueDate}</span>}
            </div>
            <div className="muted" style={{ fontSize: ".82rem", marginTop: 8 }}>Net {moneyExact(s.sales.netCents)} after {moneyExact(s.sales.feeCents)} fees{s.sales.refundedCents ? ` · ${moneyExact(s.sales.refundedCents)} refunded` : ""}.</div>
          </div>
        )}
        {s.requests.pending > 0 && (
          <button className="card f1" style={{ padding: 16, minWidth: 220, textAlign: "left", cursor: "pointer" }} onClick={() => go("requests")}>
            <div style={{ fontSize: ".8rem", color: "var(--ink-faint)", fontWeight: 600 }}>Pending requests</div>
            <div style={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: "1.6rem", marginTop: 4 }}>{s.requests.pending}</div>
            <div className="link-inline" style={{ fontSize: ".82rem", marginTop: 4 }}>Review requests →</div>
          </button>
        )}
      </div>

      {s.series.length > 1 && (
        <div className="card" style={{ padding: 16 }}>
          <strong style={{ display: "block", marginBottom: 10 }}>Bookings over time</strong>
          <div style={{ height: 220 }}><BookingsChart series={s.series} /></div>
        </div>
      )}
      {s.tiers.length > 0 && (
        <div className="card" style={{ padding: 16 }}>
          <strong style={{ display: "block", marginBottom: 10 }}>Tickets by tier</strong>
          <div style={{ height: 220 }}><TierChart tiers={s.tiers} /></div>
        </div>
      )}
    </div>
  );
}

function AttendeesTab({ eventId, slug }: { eventId: string; slug: string }) {
  const [list, setList] = useState<Attendee[] | null>(null);
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fTier, setFTier] = useState("");

  useEffect(() => {
    if (!eventId) return;
    let alive = true;
    fetch(`/api/events/${eventId}/attendees`).then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive) setList(j?.ok ? (j.attendees as Attendee[]) : []); })
      .catch(() => { if (alive) setList([]); });
    return () => { alive = false; };
  }, [eventId]);

  const tiers = useMemo(() => [...new Set((list || []).map((a) => a.tier))], [list]);
  const filtered = (list || []).filter((a) =>
    (!q || a.name.toLowerCase().includes(q.toLowerCase()) || a.email.toLowerCase().includes(q.toLowerCase()))
    && (!fStatus || a.orderStatus === fStatus) && (!fTier || a.tier === fTier));

  if (list === null) return <p className="muted" style={{ textAlign: "center", padding: "32px 0" }}>Loading attendees…</p>;
  if (!list.length) return <Empty icon="users" title="No attendees yet" body="When people RSVP or buy tickets, they’ll appear here with their check-in status." />;

  return (
    <div className="stack g14">
      <div className="flex g8 wrap center">
        <input className="input" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1, minWidth: 180 }} />
        <select className="sort-select" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="">All statuses</option><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="refunded">Refunded</option><option value="cancelled">Cancelled</option>
        </select>
        {tiers.length > 1 && <select className="sort-select" value={fTier} onChange={(e) => setFTier(e.target.value)}><option value="">All tiers</option>{tiers.map((t) => <option key={t} value={t}>{t}</option>)}</select>}
      </div>
      <div className="flex g8 wrap center">
        <a className="btn btn-outline btn-sm" href={`/api/events/${eventId}/attendees?format=csv`}><Icon name="upload" size={15} /> Export CSV</a>
        <a className="btn btn-soft btn-sm" href={`/events/${slug}/checkin`}><Icon name="check" size={15} /> Door scanner</a>
        <span className="muted" style={{ fontSize: ".84rem" }}>{filtered.length} of {list.length}</span>
      </div>
      <div className="tbl-scroll">
        <table className="tbl">
          <thead><tr><th>Attendee</th><th>Tier</th><th>Status</th><th>Checked in</th></tr></thead>
          <tbody>
            {filtered.map((a, i) => (
              <tr key={i}>
                <td><div style={{ fontWeight: 600 }}>{a.name}</div>{a.email && <div className="faint" style={{ fontSize: ".8rem" }}>{a.email}</div>}</td>
                <td>{a.tier}{a.qty > 1 ? ` ×${a.qty}` : ""}</td>
                <td><span className={`pill-tag ${STATUS_CLS[a.orderStatus] || "gray"}`}>{a.orderStatus}</span></td>
                <td>{a.checkedInAt ? <span className="pill-tag green">{new Date(a.checkedInAt).toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" })}</span> : <span className="muted">{a.checkedIn}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Marketing: tracking links, channels, funnel, promo codes ---------- */
type MarketingData = {
  channels: { channel: string; kind: string; orders: number; tickets: number; grossCents: number }[];
  funnel: { views: number; checkoutStarts: number; orders: number; viewToCheckoutPct: number | null; viewToOrderPct: number | null };
  repeatAttendees: { returning: number; total: number; pct: number };
};
type RefCode = { id: string; code: string; label: string | null; clicks: number };
type PromoCode = {
  id: string; code: string; kind: "percent" | "fixed"; percent_off: number | null; amount_off_cents: number | null;
  max_redemptions: number | null; redeemed: number; min_qty: number; expires_at: string | null; active: boolean; event_id: string | null;
};

function MarketingTab({ eventId, slug, isFree, toast }: { eventId: string; slug: string; isFree: boolean; toast: Toast }) {
  const [mkt, setMkt] = useState<MarketingData | null>(null);
  const [refs, setRefs] = useState<RefCode[] | null>(null);
  const [promos, setPromos] = useState<PromoCode[] | null>(null);
  const [newRef, setNewRef] = useState({ code: "", label: "" });
  const [newPromo, setNewPromo] = useState({ code: "", kind: "percent", value: "", max: "", orgWide: false });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/events/${eventId}/marketing`).then((r) => (r.ok ? r.json() : null)).then((j) => setMkt(j?.ok ? j : null)).catch(() => setMkt(null));
    fetch(`/api/events/${eventId}/ref-codes`).then((r) => (r.ok ? r.json() : null)).then((j) => setRefs(j?.ok ? j.refCodes : [])).catch(() => setRefs([]));
    fetch(`/api/events/${eventId}/promo-codes`).then((r) => (r.ok ? r.json() : null)).then((j) => setPromos(j?.ok ? j.codes : [])).catch(() => setPromos([]));
  }, [eventId]);
  useEffect(() => { load(); }, [load]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const linkFor = (code: string) => `${origin}/e/${slug}?ref=${code}`;
  const copy = (text: string) => { navigator.clipboard?.writeText(text).then(() => toast?.("Link copied ✓")).catch(() => toast?.(text)); };
  const shareText = "Assalamu alaikum! Thought you'd like this event on Humble Halal:";

  const addRef = async () => {
    const code = newRef.code.trim().toLowerCase().replace(/\s+/g, "-");
    if (!code) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/events/${eventId}/ref-codes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, label: newRef.label }) });
      const j = await r.json().catch(() => null);
      if (j?.ok) { setNewRef({ code: "", label: "" }); load(); }
      else toast?.(j?.reason === "duplicate_code" ? "That link name is taken" : j?.reason === "bad_code" ? "Use 2–32 letters, numbers or dashes" : "Couldn't create the link");
    } catch { toast?.("Couldn't create the link"); }
    finally { setBusy(false); }
  };

  const addPromo = async () => {
    const value = Number(newPromo.value);
    if (!newPromo.code.trim() || !value) return;
    setBusy(true);
    try {
      const body = {
        code: newPromo.code.trim().toUpperCase(),
        kind: newPromo.kind,
        percentOff: newPromo.kind === "percent" ? value : undefined,
        amountOffCents: newPromo.kind === "fixed" ? Math.round(value * 100) : undefined,
        maxRedemptions: newPromo.max ? Number(newPromo.max) : undefined,
        orgWide: newPromo.orgWide,
      };
      const r = await fetch(`/api/events/${eventId}/promo-codes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => null);
      if (j?.ok) { setNewPromo({ code: "", kind: "percent", value: "", max: "", orgWide: false }); load(); }
      else toast?.(j?.reason === "duplicate_code" ? "That code already exists" : j?.reason === "no_business" ? "Link a business to your account to create codes" : "Couldn't create the code — check the values");
    } catch { toast?.("Couldn't create the code"); }
    finally { setBusy(false); }
  };

  const delRef = async (id: string) => {
    await fetch(`/api/events/${eventId}/ref-codes?refId=${id}`, { method: "DELETE" }).catch(() => null);
    load();
  };
  const delPromo = async (id: string) => {
    await fetch(`/api/events/${eventId}/promo-codes?promoId=${id}`, { method: "DELETE" }).catch(() => null);
    load();
  };

  const promoValue = (p: PromoCode) => (p.kind === "percent" ? `${p.percent_off}% off` : `${moneyExact(p.amount_off_cents || 0)} off`);

  return (
    <div className="stack g20">
      {/* Funnel + repeat attendees — computed from first-party analytics + orders. */}
      {mkt && (
        <div className="admin-statgrid">
          <div className="stat"><div className="v">{mkt.funnel.views}</div><div className="l">Page views</div></div>
          <div className="stat"><div className="v">{mkt.funnel.checkoutStarts}</div><div className="l">Checkouts started</div></div>
          <div className="stat"><div className="v">{mkt.funnel.orders}</div><div className="l">Orders</div></div>
          <div className="stat"><div className="v">{mkt.funnel.viewToOrderPct != null ? `${mkt.funnel.viewToOrderPct}%` : "—"}</div><div className="l">View → order</div></div>
          <div className="stat"><div className="v">{mkt.repeatAttendees.total ? `${mkt.repeatAttendees.pct}%` : "—"}</div><div className="l">Repeat attendees</div></div>
        </div>
      )}

      {/* Tracking links — each share channel gets its own /e/ link so sales credit it. */}
      <div className="card" style={{ padding: 16 }}>
        <strong style={{ display: "block" }}>Tracking links</strong>
        <p className="muted" style={{ fontSize: ".84rem", margin: "4px 0 12px" }}>
          Make a link per channel (WhatsApp blast, Instagram bio, posters) — clicks and ticket sales are credited to it below.
        </p>
        <div className="flex g8 wrap" style={{ marginBottom: 12 }}>
          <input className="input" placeholder="link name, e.g. wa-blast" value={newRef.code} onChange={(e) => setNewRef((s) => ({ ...s, code: e.target.value }))} style={{ flex: 1, minWidth: 140 }} />
          <input className="input" placeholder="label (optional)" value={newRef.label} onChange={(e) => setNewRef((s) => ({ ...s, label: e.target.value }))} style={{ flex: 1, minWidth: 140 }} />
          <button className="btn btn-primary btn-sm" onClick={addRef} disabled={busy || !newRef.code.trim()}>Create link</button>
        </div>
        {refs === null ? (
          <p className="muted">Loading…</p>
        ) : refs.length === 0 ? (
          <p className="muted" style={{ fontSize: ".84rem" }}>No links yet — create your first above.</p>
        ) : (
          <div className="stack g8">
            {refs.map((rc) => (
              <div key={rc.id} className="flex g8 center wrap" style={{ padding: "8px 0", borderTop: "1px solid var(--line)" }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontWeight: 600 }}>{rc.code}{rc.label ? <span className="faint"> — {rc.label}</span> : null}</div>
                  <div className="faint" style={{ fontSize: ".78rem", wordBreak: "break-all" }}>{linkFor(rc.code)}</div>
                </div>
                <span className="pill-tag gray">{rc.clicks} click{rc.clicks === 1 ? "" : "s"}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => copy(linkFor(rc.code))}><Icon name="share" size={14} /> Copy</button>
                <a className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${linkFor(rc.code)}`)}`}>WhatsApp</a>
                <a className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer" href={`https://t.me/share/url?url=${encodeURIComponent(linkFor(rc.code))}&text=${encodeURIComponent(shareText)}`}>Telegram</a>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => delRef(rc.id)} aria-label={`Delete ${rc.code}`}><Icon name="x" size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sales by channel */}
      {mkt && mkt.channels.length > 0 && (
        <div className="card" style={{ padding: 16 }}>
          <strong style={{ display: "block", marginBottom: 10 }}>Sales by channel</strong>
          <div className="tbl-scroll">
            <table className="tbl">
              <thead><tr><th>Channel</th><th>Orders</th><th>Tickets</th><th>Gross</th></tr></thead>
              <tbody>
                {mkt.channels.map((c) => (
                  <tr key={`${c.kind}:${c.channel}`}>
                    <td><span className={`pill-tag ${c.kind === "direct" ? "gray" : "green"}`}>{c.channel}</span></td>
                    <td>{c.orders}</td>
                    <td>{c.tickets}</td>
                    <td>{moneyExact(c.grossCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Promo codes — paid events only (a free event has nothing to discount). */}
      {!isFree && (
        <div className="card" style={{ padding: 16 }}>
          <strong style={{ display: "block" }}>Promo codes</strong>
          <p className="muted" style={{ fontSize: ".84rem", margin: "4px 0 12px" }}>
            Percentage or fixed-amount discounts, validated at checkout. “All my events” codes work across everything you host.
          </p>
          <div className="flex g8 wrap" style={{ marginBottom: 12 }}>
            <input className="input" placeholder="CODE" value={newPromo.code} onChange={(e) => setNewPromo((s) => ({ ...s, code: e.target.value.toUpperCase() }))} style={{ width: 130, textTransform: "uppercase" }} />
            <select className="sort-select" value={newPromo.kind} onChange={(e) => setNewPromo((s) => ({ ...s, kind: e.target.value }))}>
              <option value="percent">% off</option>
              <option value="fixed">$ off</option>
            </select>
            <input className="input" type="number" placeholder={newPromo.kind === "percent" ? "10" : "5.00"} value={newPromo.value} onChange={(e) => setNewPromo((s) => ({ ...s, value: e.target.value }))} style={{ width: 90 }} />
            <input className="input" type="number" placeholder="max uses" value={newPromo.max} onChange={(e) => setNewPromo((s) => ({ ...s, max: e.target.value }))} style={{ width: 100 }} />
            <label className="evt-check" style={{ fontSize: ".84rem" }}>
              <input type="checkbox" checked={newPromo.orgWide} onChange={(e) => setNewPromo((s) => ({ ...s, orgWide: e.target.checked }))} /> <span>All my events</span>
            </label>
            <button className="btn btn-primary btn-sm" onClick={addPromo} disabled={busy || !newPromo.code.trim() || !Number(newPromo.value)}>Create code</button>
          </div>
          {promos === null ? (
            <p className="muted">Loading…</p>
          ) : promos.length === 0 ? (
            <p className="muted" style={{ fontSize: ".84rem" }}>No codes yet.</p>
          ) : (
            <div className="tbl-scroll">
              <table className="tbl">
                <thead><tr><th>Code</th><th>Discount</th><th>Used</th><th>Scope</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {promos.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700 }}>{p.code}</td>
                      <td>{promoValue(p)}</td>
                      <td>{p.redeemed}{p.max_redemptions ? ` / ${p.max_redemptions}` : ""}</td>
                      <td className="muted">{p.event_id ? "This event" : "All events"}</td>
                      <td><span className={`pill-tag ${p.active ? "green" : "gray"}`}>{p.active ? "Active" : "Off"}</span></td>
                      <td><button className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={() => delPromo(p.id)} aria-label={`Remove ${p.code}`}><Icon name="x" size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CheckinTab({ s, slug }: { s: Stats; slug: string }) {
  const pct = s.attendance.booked ? Math.round((s.tickets.checkedIn / s.attendance.booked) * 100) : 0;
  return (
    <div className="stack g16">
      <div className="admin-statgrid">
        <div className="stat"><div className="v">{s.tickets.checkedIn}</div><div className="l">Checked in</div></div>
        <div className="stat"><div className="v">{s.tickets.noShows}</div><div className="l">Awaiting</div></div>
        <div className="stat"><div className="v">{pct}%</div><div className="l">Arrived</div></div>
      </div>
      <div className="card" style={{ padding: 22, textAlign: "center" }}>
        <div className="empty-ico" style={{ margin: "0 auto 10px" }}><Icon name="check" size={26} /></div>
        <h3 style={{ marginBottom: 6 }}>Door check-in</h3>
        <p className="muted" style={{ marginBottom: 14 }}>Scan tickets at the entrance with your phone camera — or look up an attendee by code.</p>
        <a className="btn btn-primary btn-lg btn-block" href={`/events/${slug}/checkin`}><Icon name="check" size={18} /> Open door scanner</a>
      </div>
    </div>
  );
}

function RequestsTab({ s, slug }: { s: Stats; slug: string }) {
  return (
    <div className="card" style={{ padding: 22, textAlign: "center" }}>
      <div className="empty-ico" style={{ margin: "0 auto 10px" }}><Icon name="shield-check" size={26} /></div>
      <h3 style={{ marginBottom: 6 }}>{s.requests.pending} pending request{s.requests.pending === 1 ? "" : "s"}</h3>
      <p className="muted" style={{ marginBottom: 14 }}>People who asked to join. Approve to issue their ticket + QR, or decline.</p>
      <a className="btn btn-primary btn-lg btn-block" href={`/events/${slug}/requests`}><Icon name="shield-check" size={18} /> Review requests</a>
    </div>
  );
}

function SettingsTab({ eventId, s, toast, navigate, onSaved }: { eventId: string; s: Stats; toast: Toast; navigate: Nav; onSaved: () => void }) {
  const d = s.event.display || {};
  const [form, setForm] = useState({
    title: s.event.title, capacity: String(s.event.capacity || ""), date_iso: s.event.date_iso || "", is_free: s.event.is_free,
    cat: String(d.cat || "Community"), blurb: String(d.blurb || ""), venue: String(d.venue || ""), area: String(d.area || ""),
    dateLabel: String(d.dateLabel || ""), timeLabel: String(d.timeLabel || ""), endTime: String(d.endTime || ""),
    priceFrom: String(Number(d.priceFrom) || ""), img: String(d.img || ""), prayerNearby: d.prayerNearby === true,
    halalCatering: d.halalCatering === true, prayerSlotNote: String(d.prayerSlotNote || ""),
    genderArrangement: String(d.genderArrangement || "mixed"), seatingNote: String(d.seatingNote || ""),
    refundPolicy: String(d.refundPolicy || ""), requiresApproval: d.requiresApproval === true,
  });
  const [busy, setBusy] = useState(false);
  const [ticketTiers, setTicketTiers] = useState(() => s.event.ticketTiers.length ? s.event.ticketTiers.map((tier) => ({ name: tier.name, price: String(tier.price_cents / 100), qty: String(tier.qty || "") })) : [{ name: "Standard", price: String(Number(d.priceFrom) || ""), qty: String(s.event.capacity || "") }]);
  const [uploading, setUploading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const photoInput = useRef<HTMLInputElement | null>(null);
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((current) => ({ ...current, [key]: value }));

  const uploadCover = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const data = new FormData(); data.set("file", file); data.set("eventId", eventId);
      const res = await fetch("/api/events/upload", { method: "POST", body: data });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.url) set("img", json.url as string);
      else toast?.(json?.reason === "too_large" ? "Image is too large (max 5MB)" : "Couldn’t upload that image");
    } catch { toast?.("Couldn’t upload that image"); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.title.trim()) { toast?.("Event title is required"); return; }
    const body = {
      title: form.title.trim(), capacity: Math.max(0, Number(form.capacity) || 0), date_iso: form.date_iso || null, is_free: form.is_free,
      display: { cat: form.cat, blurb: form.blurb, venue: form.venue, area: form.area, dateLabel: form.dateLabel, timeLabel: form.timeLabel,
        endTime: form.endTime, priceFrom: form.is_free ? 0 : Math.max(0, Number(form.priceFrom) || 0), img: form.img,
        prayerNearby: form.prayerNearby, halalCatering: form.halalCatering, prayerSlotNote: form.prayerSlotNote,
        genderArrangement: form.genderArrangement, seatingNote: form.seatingNote, refundPolicy: form.refundPolicy, requiresApproval: form.requiresApproval },
      tiers: form.is_free ? [] : ticketTiers.map((tier) => ({ name: tier.name, price: Math.max(0, Number(tier.price) || 0), qty: Math.max(0, Number(tier.qty) || 0) })),
    };
    setBusy(true);
    try {
      const r = await fetch(`/api/events/${eventId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => null);
      if (j?.ok) { toast?.("Saved ✓"); onSaved(); } else toast?.("Couldn’t save — please try again");
    } catch { toast?.("Couldn’t save — please try again"); }
    finally { setBusy(false); }
  };

  const cancelEvent = async () => {
    if (typeof window !== "undefined" && !window.confirm("Cancel this event? Tickets are voided and paid orders refunded. This can’t be undone.")) return;
    setCancelling(true);
    try {
      const r = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      const j = await r.json().catch(() => null);
      if (j?.ok) { toast?.("Event cancelled"); navigate("owner-dashboard"); } else toast?.("Couldn’t cancel — please try again");
    } catch { toast?.("Couldn’t cancel — please try again"); }
    finally { setCancelling(false); }
  };

  return (
    <div className="stack g16" style={{ maxWidth: 720 }}>
      {s.event.status === "pending" && <div className="notice notice-warn"><Icon name="info" size={17} /><span>This event is still under review. Your updates are saved to the pending submission for the admin to review.</span></div>}
      <div className="card" style={{ padding: 18 }}><h3>Event details</h3><div className="grid-2 g12" style={{ marginTop: 14 }}>
        <div className="field" style={{ gridColumn: "1 / -1" }}><label>Event title</label><input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
        <div className="field"><label>Category</label><input className="input" value={form.cat} onChange={(e) => set("cat", e.target.value)} /></div>
        <div className="field"><label>Capacity (0 = unlimited)</label><input className="input" type="number" min={0} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} /></div>
        <div className="field" style={{ gridColumn: "1 / -1" }}><label>Description</label><textarea className="input" rows={5} value={form.blurb} onChange={(e) => set("blurb", e.target.value)} /></div>
      </div></div>
      <div className="card" style={{ padding: 18 }}><h3>Date &amp; location</h3><div className="grid-2 g12" style={{ marginTop: 14 }}>
        <div className="field"><label>Date</label><input className="input" type="date" value={form.date_iso.slice(0, 10)} onChange={(e) => set("date_iso", e.target.value)} /></div>
        <div className="field"><label>Date label</label><input className="input" placeholder="Sat, 20 July" value={form.dateLabel} onChange={(e) => set("dateLabel", e.target.value)} /></div>
        <div className="field"><label>Start time</label><input className="input" placeholder="e.g. 7:00 PM" value={form.timeLabel} onChange={(e) => set("timeLabel", e.target.value)} /></div>
        <div className="field"><label>End time</label><input className="input" placeholder="e.g. 9:30 PM" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} /></div>
        <div className="field"><label>Venue</label><input className="input" value={form.venue} onChange={(e) => set("venue", e.target.value)} /></div>
        <div className="field"><label>Area</label><input className="input" value={form.area} onChange={(e) => set("area", e.target.value)} /></div>
      </div></div>
      <div className="card" style={{ padding: 18 }}><div className="flex between center"><h3>Cover image</h3><div><input ref={photoInput} hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={uploadCover} /><button className="btn btn-outline btn-sm" disabled={uploading} onClick={() => photoInput.current?.click()}><Icon name="camera" size={15} /> {uploading ? "Uploading…" : form.img ? "Replace image" : "Add image"}</button></div></div>{form.img ? <div style={{ marginTop: 12, position: "relative" }}><ImagePh src={form.img} label="Event cover preview" style={{ width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 12 }} /><button className="btn btn-ghost btn-sm" style={{ position: "absolute", top: 8, right: 8, background: "#fff" }} onClick={() => set("img", "")}><Icon name="x" size={14} /> Remove</button></div> : <p className="muted" style={{ marginTop: 8 }}>JPG, PNG, WebP or AVIF, up to 5MB.</p>}</div>
      <div className="card" style={{ padding: 18 }}><h3>Tickets &amp; attendance</h3><div className="grid-2 g12" style={{ marginTop: 14 }}>
        <label className="check-row"><input type="checkbox" checked={form.is_free} disabled={!['pending','draft'].includes(s.event.status)} onChange={(e) => set("is_free", e.target.checked)} /><span><strong>Free event</strong><small>{!['pending','draft'].includes(s.event.status) ? "Pricing mode is locked after publication." : "Turn off to set a starting ticket price."}</small></span></label>
        {!form.is_free && <div className="field"><label>Starting price (SGD)</label><input className="input" type="number" min={0} step="0.01" value={form.priceFrom} onChange={(e) => set("priceFrom", e.target.value)} /></div>}
        <label className="check-row"><input type="checkbox" checked={form.requiresApproval} onChange={(e) => set("requiresApproval", e.target.checked)} /><span><strong>Approve registrations</strong><small>Review requests before issuing tickets.</small></span></label>
      </div>{!form.is_free && ['pending','draft'].includes(s.event.status) && <div style={{ marginTop: 16 }}><div className="flex between center"><strong>Ticket tiers</strong><button className="btn btn-ghost btn-sm" onClick={() => setTicketTiers((items) => [...items, { name: `Tier ${items.length + 1}`, price: "", qty: form.capacity }])}><Icon name="plus" size={14} /> Add tier</button></div><div className="stack g8" style={{ marginTop: 8 }}>{ticketTiers.map((tier, index) => <div className="grid-3 g8" key={index}><input className="input" aria-label={`Tier ${index + 1} name`} value={tier.name} onChange={(e) => setTicketTiers((items) => items.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} /><input className="input" type="number" min={0} step="0.01" aria-label={`Tier ${index + 1} price`} placeholder="Price SGD" value={tier.price} onChange={(e) => setTicketTiers((items) => items.map((item, i) => i === index ? { ...item, price: e.target.value } : item))} /><div className="flex g4"><input className="input" type="number" min={0} aria-label={`Tier ${index + 1} quantity`} placeholder="Quantity" value={tier.qty} onChange={(e) => setTicketTiers((items) => items.map((item, i) => i === index ? { ...item, qty: e.target.value } : item))} /><button className="btn btn-ghost btn-sm" disabled={ticketTiers.length === 1} onClick={() => setTicketTiers((items) => items.filter((_, i) => i !== index))}><Icon name="x" size={14} /></button></div></div>)}</div></div>}</div>
      <div className="card" style={{ padding: 18 }}><h3>Muslim-friendly arrangements</h3><div className="grid-2 g12" style={{ marginTop: 14 }}>
        <label className="check-row"><input type="checkbox" checked={form.prayerNearby} onChange={(e) => set("prayerNearby", e.target.checked)} /><span><strong>Prayer space nearby</strong></span></label>
        <label className="check-row"><input type="checkbox" checked={form.halalCatering} onChange={(e) => set("halalCatering", e.target.checked)} /><span><strong>Halal catering</strong></span></label>
        <div className="field"><label>Gender arrangement</label><select className="input" value={form.genderArrangement} onChange={(e) => set("genderArrangement", e.target.value)}><option value="mixed">Mixed</option><option value="segregated">Segregated</option><option value="sisters">Sisters only</option><option value="brothers">Brothers only</option></select></div>
        <div className="field"><label>Prayer note</label><input className="input" value={form.prayerSlotNote} onChange={(e) => set("prayerSlotNote", e.target.value)} /></div>
        <div className="field"><label>Seating note</label><input className="input" value={form.seatingNote} onChange={(e) => set("seatingNote", e.target.value)} /></div>
        <div className="field"><label>Refund policy</label><input className="input" value={form.refundPolicy} onChange={(e) => set("refundPolicy", e.target.value)} /></div>
      </div></div>
      <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save changes"}</button>
      <hr className="divider" />
      {s.event.status !== "cancelled" ? (
        <div className="card" style={{ padding: 16, borderColor: "var(--danger)" }}>
          <strong style={{ color: "var(--danger)" }}>Cancel event</strong>
          <p className="muted" style={{ fontSize: ".84rem", margin: "6px 0 12px" }}>Voids all tickets, refunds paid orders, and emails attendees.</p>
          <button className="btn btn-ghost" style={{ color: "var(--danger)" }} disabled={cancelling} onClick={cancelEvent}><Icon name="x" size={16} /> {cancelling ? "Cancelling…" : "Cancel this event"}</button>
        </div>
      ) : <p className="muted">This event is cancelled.</p>}
    </div>
  );
}
