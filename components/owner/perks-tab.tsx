"use client";

/* Owner "Passport perks" tab — offer perks that members redeem with Halal
   Passport points (drives repeat footfall), and mark vouchers used at the
   counter. All data from /api/owner/perks + /api/owner/perks/redemptions. */

import { useCallback, useEffect, useState } from "react";
import { Icon } from "../ui";

type Biz = { id: string; name: string };
type Perk = { id: string; business_id: string; title: string; description: string | null; terms: string | null; points_cost: number; active: boolean };
type Voucher = { id: string; voucher_code: string; title: string; cost: number; status: string; created_at: string };

export function OwnerPerks({ toast }: { toast: (m: string) => void }) {
  const [biz, setBiz] = useState<Biz[]>([]);
  const [perks, setPerks] = useState<Perk[] | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [form, setForm] = useState({ businessId: "", title: "", description: "", terms: "", pointsCost: 200 });
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      const [p, r] = await Promise.all([fetch("/api/owner/perks").then((x) => x.json()), fetch("/api/owner/perks/redemptions").then((x) => x.json())]);
      if (p.ok) { setBiz(p.businesses || []); setPerks(p.perks || []); setForm((f) => ({ ...f, businessId: f.businessId || (p.businesses?.[0]?.id || "") })); }
      else setPerks([]);
      if (r.ok) setVouchers(r.redemptions || []);
    } catch { setPerks([]); }
  }, []);
  useEffect(() => { let alive = true; (async () => { if (alive) await load(); })(); return () => { alive = false; }; }, [load]);

  const create = async () => {
    if (!form.businessId || !form.title.trim()) return toast("Pick a business and add a title");
    setBusy("create");
    try {
      const res = await fetch("/api/owner/perks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) toast("Couldn't create perk"); else { toast("Perk created"); setForm((f) => ({ ...f, title: "", description: "", terms: "" })); await load(); }
    } catch { toast("Couldn't create perk"); }
    setBusy("");
  };

  const toggle = async (p: Perk) => {
    setBusy(p.id);
    try {
      const res = await fetch("/api/owner/perks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, active: !p.active }) });
      if (res.ok) await load();
    } catch { /* noop */ }
    setBusy("");
  };

  const markUsed = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch("/api/owner/perks/redemptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const d = await res.json();
      if (d.error === "already_used") toast("Already marked used"); else if (!res.ok) toast("Couldn't update"); else { toast("Marked used ✓"); await load(); }
    } catch { toast("Couldn't update"); }
    setBusy("");
  };

  if (perks === null) return <div className="dash-pane"><div className="card" style={{ padding: 24, height: 100, opacity: 0.5 }} aria-busy="true" /></div>;

  const active = vouchers.filter((v) => v.status === "active");

  return (
    <div className="dash-pane stack g16">
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: "1.1rem", marginBottom: 4 }}>Offer a perk</h3>
        <p className="faint" style={{ fontSize: ".86rem", marginBottom: 12 }}>Members spend their Halal Passport points to unlock it, then show you the voucher in-store — bringing repeat customers through your door.</p>
        {biz.length === 0 ? (
          <p className="faint">Claim a listing first to offer perks.</p>
        ) : (
          <>
            <div className="grid2" style={{ gap: 10 }}>
              <div className="field"><label htmlFor="p-biz">Business</label><select id="p-biz" className="select" value={form.businessId} onChange={(e) => setForm((f) => ({ ...f, businessId: e.target.value }))}>{biz.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div className="field"><label htmlFor="p-cost">Points cost</label><input id="p-cost" type="number" className="input" value={form.pointsCost} onChange={(e) => setForm((f) => ({ ...f, pointsCost: Number(e.target.value) }))} /></div>
            </div>
            <div className="field"><label htmlFor="p-title">Perk</label><input id="p-title" className="input" placeholder="Free teh tarik with any main" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div className="field"><label htmlFor="p-terms">Terms <span className="hint">(optional)</span></label><input id="p-terms" className="input" placeholder="One per customer · dine-in only" value={form.terms} onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))} /></div>
            <button className="btn btn-primary btn-sm" disabled={busy === "create"} onClick={create}><Icon name="plus" size={15} /> Create perk</button>
          </>
        )}
      </div>

      {perks.length > 0 && (
        <div className="stack g8">
          <h3 style={{ fontSize: "1.1rem" }}>Your perks</h3>
          {perks.map((p) => (
            <div key={p.id} className="card" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div><div style={{ fontWeight: 700 }}>{p.title} <span className="faint" style={{ fontWeight: 400 }}>· {p.points_cost} pts</span></div>{p.terms && <div className="faint" style={{ fontSize: ".8rem" }}>{p.terms}</div>}</div>
              <button className="btn btn-ghost btn-sm" disabled={busy === p.id} onClick={() => toggle(p)}>{p.active ? "Pause" : "Activate"}</button>
            </div>
          ))}
        </div>
      )}

      <div className="stack g8">
        <h3 style={{ fontSize: "1.1rem" }}>Vouchers to redeem {active.length > 0 && <span className="pill-tag amber">{active.length}</span>}</h3>
        {active.length === 0 ? (
          <div className="card" style={{ padding: 20, textAlign: "center" }}><p className="faint">No active vouchers. When a member redeems a perk, it appears here — tap &ldquo;Mark used&rdquo; when they show it.</p></div>
        ) : (
          active.map((v) => (
            <div key={v.id} className="card" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div><div style={{ fontWeight: 700 }}>{v.title}</div><code style={{ fontSize: ".82rem", letterSpacing: ".05em" }}>{v.voucher_code}</code></div>
              <button className="btn btn-primary btn-sm" disabled={busy === v.id} onClick={() => markUsed(v.id)}><Icon name="check" size={15} /> Mark used</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
