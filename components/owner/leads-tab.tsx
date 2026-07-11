"use client";

/* Owner "Leads" tab — the lead-marketplace inbox. Shows routed enquiries with
   the consumer's contact MASKED until the owner accepts (accept consumes quota
   when paid, or a free beta unlock). Accepted leads reveal contact + a
   won/lost pipeline. Includes a quota meter, an upsell/beta card, and a
   category/area preferences editor. All state comes from /api/owner/leads. */

import { useCallback, useEffect, useState } from "react";
import { useApp } from "../app-context";
import { Icon } from "../ui";

type Route = {
  id: string; status: string; vertical: string; sentAt: string;
  area: string | null; budget: string | null; when: string | null; details: string | null;
  name: string | null; email: string | null; phone: string | null; accepted: boolean;
};
type Quota = { active: boolean; planName: string | null; monthly: number; remaining: number; used: number; periodEnd: string | null };

const VLABEL: Record<string, string> = {
  catering: "Catering", weddings: "Weddings", umrah: "Umrah & Hajj", finance: "Islamic finance",
  "home-services": "Home services", automotive: "Automotive", photography: "Photography",
  professional: "Professional services", education: "Education", other: "Other",
};

export function OwnerLeads({ toast, live }: { toast: (m: string) => void; live: boolean; navigate: ReturnType<typeof useApp>["navigate"] }) {
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [paidLeads, setPaidLeads] = useState(false);
  const [busy, setBusy] = useState<string>("");
  const [showPrefs, setShowPrefs] = useState(false);

  const load = useCallback(async () => {
    if (!live) { setRoutes([]); return; }
    try {
      const res = await fetch("/api/owner/leads");
      const d = await res.json();
      setRoutes(Array.isArray(d.routes) ? d.routes : []);
      setQuota(d.quota || null);
      setPaidLeads(!!d.paidLeads);
    } catch { setRoutes([]); }
  }, [live]);

  useEffect(() => { let alive = true; (async () => { if (alive) await load(); })(); return () => { alive = false; }; }, [load]);

  const accept = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch("/api/owner/leads/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ routeId: id }) });
      const d = await res.json();
      if (res.status === 402) {
        toast(d.error === "beta_cap" ? `You've used your ${d.betaCap} free leads this month` : "You're out of lead credits — upgrade to accept more");
      } else if (!res.ok || !d.ok) {
        toast("Couldn't accept — try again");
      } else {
        toast("Lead accepted — contact unlocked");
        await load();
      }
    } catch { toast("Couldn't accept — try again"); }
    setBusy("");
  };

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      const res = await fetch("/api/owner/leads/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ routeId: id, status }) });
      if (!res.ok) toast("Couldn't update"); else { toast(status === "won" ? "Marked as won 🎉" : "Updated"); await load(); }
    } catch { toast("Couldn't update"); }
    setBusy("");
  };

  const startCheckout = async () => {
    try {
      const res = await fetch("/api/checkout/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: "inbox15" }) });
      const d = await res.json();
      if (d.url) { window.location.href = d.url; return; }
      toast(
        d.error === "paid_leads_disabled" ? "Lead subscriptions open soon — you're on the free beta"
        : d.error === "stripe_error" ? "Payments are having a moment — you have not been charged. Please try again shortly."
        : "Couldn't start checkout",
      );
    } catch { toast("Couldn't start checkout"); }
  };

  if (routes === null) return <div className="dash-pane"><div className="card" style={{ padding: 24, height: 120, opacity: 0.5 }} aria-busy="true" /></div>;

  return (
    <div className="dash-pane stack g14">
      {/* Quota / upsell / beta banner */}
      <div className="card" style={{ padding: 18 }}>
        <div className="flex between center wrap g10">
          <div>
            <h3 style={{ fontSize: "1.15rem" }}>Your leads</h3>
            <p className="faint" style={{ fontSize: ".86rem" }}>Customer enquiries matched to your business. Accept one to unlock their contact details.</p>
          </div>
          <button className="btn btn-soft btn-sm" onClick={() => setShowPrefs((s) => !s)}><Icon name="filter" size={15} /> {showPrefs ? "Close" : "Lead settings"}</button>
        </div>

        {quota?.active ? (
          <div className="mt12">
            <div className="flex between center" style={{ fontSize: ".84rem", fontWeight: 600 }}>
              <span>{quota.planName || "Lead Inbox"} — {quota.used}/{quota.monthly} leads used</span>
              {quota.periodEnd && <span className="faint">Resets {new Date(quota.periodEnd).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}</span>}
            </div>
            <div style={{ height: 8, borderRadius: 999, background: "var(--line,#eee)", marginTop: 6, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, quota.monthly ? (quota.used / quota.monthly) * 100 : 0)}%`, height: "100%", background: "var(--emerald,#0e7a5f)" }} />
            </div>
          </div>
        ) : paidLeads ? (
          <div className="card mt12" style={{ padding: 14, background: "var(--emerald-50,#e7f3ee)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ minWidth: 200 }}>
              <strong>Lead Inbox — S$99/mo</strong>
              <p className="faint" style={{ fontSize: ".84rem", marginTop: 2 }}>Up to 15 accepted leads a month in your categories. Cancel anytime.</p>
            </div>
            <button className="btn btn-gold" onClick={startCheckout}><Icon name="sparkles" size={16} /> Start Lead Inbox</button>
          </div>
        ) : (
          <div className="card mt12" style={{ padding: 12, background: "var(--wash,#f8f6f0)" }}>
            <p className="faint" style={{ fontSize: ".86rem" }}><Icon name="sparkles" size={14} /> You&apos;re on the free lead beta — accept up to 3 leads a month, no charge.</p>
          </div>
        )}

        {showPrefs && <LeadPrefs toast={toast} onSaved={() => setShowPrefs(false)} />}
      </div>

      {/* Route cards */}
      {routes.length === 0 ? (
        <div className="card" style={{ padding: 28, textAlign: "center" }}>
          <div className="empty-ico" style={{ width: 48, height: 48, borderRadius: 14, background: "var(--emerald-50)", margin: "0 auto 12px" }}><Icon name="briefcase" size={24} /></div>
          <h3 style={{ fontSize: "1.15rem", marginBottom: 6 }}>No leads yet</h3>
          <p className="faint" style={{ fontSize: ".9rem", maxWidth: 420, margin: "0 auto" }}>When customers request quotes in your categories, they&apos;ll appear here. Set your categories and areas so we send you the right ones.</p>
          <button className="btn btn-soft btn-sm mt12" onClick={() => setShowPrefs(true)}>Set lead preferences</button>
        </div>
      ) : (
        routes.map((r) => {
          const pending = !r.accepted;
          return (
            <div key={r.id} className="card" style={{ padding: 16 }}>
              <div className="flex between center wrap g8">
                <div className="flex g10 center">
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--gold-50,#fbf3df)", color: "var(--gold,#b8860b)", display: "grid", placeItems: "center" }}><Icon name="briefcase" size={18} /></span>
                  <div>
                    <div style={{ fontWeight: 700 }}>{VLABEL[r.vertical] || r.vertical}</div>
                    <div className="faint" style={{ fontSize: ".82rem" }}>{[r.area, r.budget, r.when].filter(Boolean).join(" · ") || "—"}</div>
                  </div>
                </div>
                {statusChip(r.status)}
              </div>

              {r.details && <p className="muted" style={{ marginTop: 10, fontSize: ".9rem" }}>{r.details}</p>}

              <div className="card" style={{ marginTop: 10, padding: "10px 12px", background: pending ? "var(--wash,#f8f6f0)" : "var(--emerald-50,#e7f3ee)" }}>
                {pending ? (
                  <div className="flex between center wrap g8">
                    <span className="faint" style={{ fontSize: ".86rem" }}><Icon name="lock" size={13} /> {r.name} · contact hidden until you accept</span>
                    <button className="btn btn-primary btn-sm" disabled={busy === r.id} onClick={() => accept(r.id)}>{busy === r.id ? "…" : (paidLeads ? "Accept (1 credit)" : "Accept lead")}</button>
                  </div>
                ) : (
                  <div className="stack g8">
                    <div style={{ fontWeight: 700 }}>{r.name}</div>
                    <div className="flex g8 wrap">
                      {r.phone && <a className="btn btn-soft btn-sm" href={`tel:${r.phone}`}><Icon name="phone" size={14} /> {r.phone}</a>}
                      {r.phone && <a className="btn btn-soft btn-sm" href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener"><Icon name="whatsapp" size={14} /> WhatsApp</a>}
                      {r.email && <a className="btn btn-soft btn-sm" href={`mailto:${r.email}`}><Icon name="mail" size={14} /> Email</a>}
                    </div>
                    {r.status !== "won" && r.status !== "lost" && (
                      <div className="flex g8 wrap" style={{ marginTop: 2 }}>
                        {r.status !== "contacted" && <button className="btn btn-ghost btn-sm" disabled={busy === r.id} onClick={() => setStatus(r.id, "contacted")}>Mark contacted</button>}
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--emerald,#0e7a5f)" }} disabled={busy === r.id} onClick={() => setStatus(r.id, "won")}><Icon name="check" size={14} /> Won</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: "var(--ink-soft,#5b6d64)" }} disabled={busy === r.id} onClick={() => setStatus(r.id, "lost")}>Lost</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function statusChip(status: string): React.ReactNode {
  const map: Record<string, [string, string]> = {
    sent: ["New", "amber"], viewed: ["New", "amber"], accepted: ["Accepted", "green"],
    contacted: ["Contacted", "green"], won: ["Won", "green"], lost: ["Lost", ""],
  };
  const [label, tone] = map[status] || ["", ""];
  if (!label) return null;
  return <span className={`pill-tag ${tone}`}>{label}</span>;
}

/* Categories + areas the business wants leads for. */
function LeadPrefs({ toast, onSaved }: { toast: (m: string) => void; onSaved: () => void }) {
  const [verticals, setVerticals] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [opts, setOpts] = useState<{ verticals: string[]; areas: string[] }>({ verticals: [], areas: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/owner/leads/preferences");
        const d = await res.json();
        if (d.preferences) { setVerticals(d.preferences.verticals || []); setAreas(d.preferences.areas || []); setActive(d.preferences.active !== false); }
        if (d.options) setOpts(d.options);
      } catch { /* noop */ }
    })();
  }, []);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/owner/leads/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verticals, areas, active }) });
      if (res.ok) { toast("Lead preferences saved"); onSaved(); } else toast("Couldn't save");
    } catch { toast("Couldn't save"); }
    setSaving(false);
  };

  return (
    <div className="card mt12" style={{ padding: 14, background: "var(--wash,#f8f6f0)" }}>
      <div className="field">
        <label>Categories you want leads for</label>
        <div className="flex g6 wrap">
          {opts.verticals.map((v) => (
            <button key={v} className={`chip ${verticals.includes(v) ? "active" : ""}`} aria-pressed={verticals.includes(v)} onClick={() => toggle(verticals, setVerticals, v)}>{VLABEL[v] || v}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Areas you serve <span className="hint">(none = all of Singapore)</span></label>
        <div className="flex g6 wrap">
          {opts.areas.map((a) => (
            <button key={a} className={`chip ${areas.includes(a) ? "active" : ""}`} aria-pressed={areas.includes(a)} onClick={() => toggle(areas, setAreas, a)}>{a}</button>
          ))}
        </div>
      </div>
      <label className="flex g8 center" style={{ cursor: "pointer", fontSize: ".88rem", marginTop: 4 }}>
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Receive new leads
      </label>
      <button className="btn btn-primary btn-sm mt8" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save preferences"}</button>
    </div>
  );
}
