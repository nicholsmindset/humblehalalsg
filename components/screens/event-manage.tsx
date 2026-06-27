"use client";

/* Event command center — the organiser's per-event hub: live stats, attendee
   list + check-in status, requests, and settings. Reached from the owner
   dashboard "Manage". Auth is enforced by the APIs (organiser/admin), not this
   screen. Charts (Recharts) are dynamically imported so they never ship to the
   public bundle. */
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useApp } from "../app-context";
import { Empty, Icon, MobileHeader } from "../ui";

const ChartSkeleton = () => <div className="muted" style={{ display: "grid", placeItems: "center", height: "100%" }}>Loading chart…</div>;
const BookingsChart = dynamic(() => import("./event-manage-charts").then((m) => m.BookingsChart), { ssr: false, loading: ChartSkeleton });
const TierChart = dynamic(() => import("./event-manage-charts").then((m) => m.TierChart), { ssr: false, loading: ChartSkeleton });

type Stats = {
  event: { id: string; title: string; slug: string; status: string; capacity: number; is_free: boolean; date_iso: string | null; requiresApproval: boolean };
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
  const [title, setTitle] = useState(s.event.title);
  const [cap, setCap] = useState(String(s.event.capacity || ""));
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const save = async () => {
    const body: Record<string, unknown> = {};
    if (title.trim() && title.trim() !== s.event.title) body.title = title.trim();
    const capNum = Math.max(0, Number(cap) || 0);
    if (capNum !== s.event.capacity) body.capacity = capNum;
    if (!Object.keys(body).length) { toast?.("No changes to save"); return; }
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
    <div className="stack g16" style={{ maxWidth: 480 }}>
      <div className="field"><label>Event title</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="field"><label>Capacity (0 = unlimited)</label><input className="input" type="number" min={0} value={cap} onChange={(e) => setCap(e.target.value)} /></div>
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
