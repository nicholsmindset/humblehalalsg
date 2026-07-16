"use client";

import { useEffect, useMemo, useState } from "react";
import { couponValue } from "@/lib/coupons";
import { Icon } from "../ui";

type Biz = { id: string; name: string; slug: string; plan: string };
type Promo = { id: string; business_id: string; title: string; details: string | null; discount_type: string; discount_value: number | null; reward_text: string | null; min_spend_cents: number; starts_at: string; ends_at: string | null; valid_days: number[]; redeem_start: string | null; redeem_end: string | null; per_user_limit: number; total_limit: number | null; claimed_count: number; redeemed_count: number; terms: string | null; status: string; rejection_reason: string | null };
const DAYS = [[1,"Mon"],[2,"Tue"],[3,"Wed"],[4,"Thu"],[5,"Fri"],[6,"Sat"],[0,"Sun"]] as const;
const EMPTY = { title: "", details: "", discountType: "percent", discountValue: "10", rewardText: "", minSpend: "", startsAt: new Date().toISOString().slice(0,10), endsAt: "", redeemStart: "", redeemEnd: "", perUserLimit: "1", totalLimit: "", terms: "", validDays: [0,1,2,3,4,5,6] as number[] };

export function OwnerCouponsTab({ toast, initialRedeem }: { toast: (m: string) => void; initialRedeem?: string }) {
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [businessId, setBusinessId] = useState("");
  const [promos, setPromos] = useState<Promo[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [redeem, setRedeem] = useState(initialRedeem || "");
  const [redeemResult, setRedeemResult] = useState("");
  const selected = businesses.find((b) => b.id === businessId);

  const load = async () => {
    const r = await fetch("/api/owner/coupons"); const d = await r.json().catch(() => ({}));
    if (d?.ok) {
      const bs = (d.businesses || []) as Biz[]; setBusinesses(bs); setPromos((d.promotions || []) as Promo[]);
      setBusinessId((cur) => cur || bs[0]?.id || "");
    }
  };
  useEffect(() => { void load(); }, []);
  const visible = useMemo(() => promos.filter((p) => p.business_id === businessId), [promos, businessId]);

  const update = (key: string, value: string | number[]) => setForm((f) => ({ ...f, [key]: value }));
  const submit = async () => {
    if (!businessId) return;
    setBusy(true);
    try {
      const r = await fetch("/api/owner/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId, ...form }) });
      const d = await r.json().catch(() => ({}));
      if (d?.ok) { toast("Coupon submitted for review"); setForm({ ...EMPTY }); setOpen(false); await load(); }
      else toast(d?.error === "plan_required" ? "Coupons are included with Premium." : d?.error === "bad_dates" ? "The end date must be after the start date." : "Couldn't save this coupon.");
    } catch { toast("Couldn't save this coupon."); } finally { setBusy(false); }
  };
  const action = async (p: Promo, what: "pause" | "resume") => {
    const r = await fetch("/api/owner/coupons", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, action: what }) });
    const d = await r.json().catch(() => ({})); if (d?.ok) { toast(what === "pause" ? "Coupon paused" : "Coupon sent for review"); await load(); }
  };
  const redeemNow = async () => {
    setBusy(true); setRedeemResult("");
    const r = await fetch("/api/owner/coupons/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: redeem.trim() }) });
    const d = await r.json().catch(() => ({}));
    if (d?.ok) { const again = !d.redemption?.newly_redeemed; setRedeemResult(again ? "Already redeemed — no duplicate counted." : `Redeemed successfully${d.pointsAwarded ? " · customer earned 25 Passport points" : ""}.`); setRedeem(""); await load(); }
    else setRedeemResult(d?.error === "not_found" ? "Code not found for your businesses." : d?.error === "expired" ? "This coupon has expired." : d?.error === "outside_hours" ? "This coupon isn't valid at this day or time." : "Couldn't redeem this code.");
    setBusy(false);
  };

  return (
    <div className="dash-pane stack g16">
      <div className="flex between center wrap g10">
        <div><h2 style={{ fontSize: "1.25rem" }}>Promotions &amp; coupons</h2><p className="faint">Publish measurable offers, then validate each redemption in-store.</p></div>
        <button className="btn btn-primary btn-sm" onClick={() => setOpen((v) => !v)}><Icon name="plus" size={15} /> New coupon</button>
      </div>
      {businesses.length > 1 && <div className="field" style={{ maxWidth: 360 }}><label>Business</label><select className="select" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>{businesses.map((b) => <option value={b.id} key={b.id}>{b.name}</option>)}</select></div>}
      {selected && selected.plan !== "premium" && <div className="notice"><Icon name="lock" size={16} /><span>Coupon publishing and redemption analytics are included with Premium. Your existing listing remains unchanged.</span></div>}
      <div className="card coupon-scanner">
        <div><h3>Redeem a customer coupon</h3><p className="faint">Enter the 8-character code shown on the customer&apos;s phone. Each redemption is atomic and can only count once.</p></div>
        <div className="flex g8 wrap"><input className="input" value={redeem} onChange={(e) => setRedeem(e.target.value.toUpperCase())} placeholder="e.g. A1B2C3D4" maxLength={36} /><button className="btn btn-gold" disabled={busy || !redeem.trim()} onClick={redeemNow}>Redeem</button></div>
        {redeemResult && <p role="status" className="notice">{redeemResult}</p>}
      </div>
      {open && (
        <div className="card coupon-builder">
          <h3>Create a coupon</h3>
          <div className="ed-grid2">
            <div className="field"><label>Title</label><input className="input" maxLength={90} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Weekday lunch special" /></div>
            <div className="field"><label>Discount</label><div className="flex g8"><select className="select" value={form.discountType} onChange={(e) => update("discountType", e.target.value)}><option value="percent">Percent off</option><option value="fixed">Dollar amount off</option><option value="free_item">Free item</option><option value="bundle">Bundle</option></select>{["percent","fixed"].includes(form.discountType) && <input className="input" type="number" min="1" max={form.discountType === "percent" ? 100 : undefined} value={form.discountValue} onChange={(e) => update("discountValue", e.target.value)} />}</div></div>
            {["free_item","bundle"].includes(form.discountType) && <div className="field"><label>Reward</label><input className="input" value={form.rewardText} onChange={(e) => update("rewardText", e.target.value)} placeholder="Free teh tarik with any main" /></div>}
            <div className="field"><label>Details</label><input className="input" value={form.details} onChange={(e) => update("details", e.target.value)} placeholder="Dine-in only" /></div>
            <div className="field"><label>Minimum spend (SGD)</label><input className="input" type="number" min="0" step="0.01" value={form.minSpend} onChange={(e) => update("minSpend", e.target.value)} /></div>
            <div className="field"><label>Starts</label><input className="input" type="date" value={form.startsAt} onChange={(e) => update("startsAt", e.target.value)} /></div>
            <div className="field"><label>Ends</label><input className="input" type="date" value={form.endsAt} onChange={(e) => update("endsAt", e.target.value)} /></div>
            <div className="field"><label>Daily time window (optional)</label><div className="flex g8"><input className="input" type="time" value={form.redeemStart} onChange={(e) => update("redeemStart", e.target.value)} /><input className="input" type="time" value={form.redeemEnd} onChange={(e) => update("redeemEnd", e.target.value)} /></div></div>
            <div className="field"><label>Total claims (blank = unlimited)</label><input className="input" type="number" min="1" value={form.totalLimit} onChange={(e) => update("totalLimit", e.target.value)} /></div>
          </div>
          <div className="field"><label>Valid days</label><div className="flex g8 wrap">{DAYS.map(([n,label]) => <label className="ed-amenity" key={n}><input type="checkbox" checked={form.validDays.includes(n)} onChange={(e) => update("validDays", e.target.checked ? [...form.validDays,n] : form.validDays.filter((d) => d !== n))} /> {label}</label>)}</div></div>
          <div className="field"><label>Terms</label><textarea className="textarea" value={form.terms} onChange={(e) => update("terms", e.target.value)} placeholder="Not valid with other promotions. One redemption per person." /></div>
          <div className="flex g8"><button className="btn btn-primary" disabled={busy || !form.title.trim()} onClick={submit}>{busy ? "Submitting…" : "Submit for review"}</button><button className="btn btn-soft" onClick={() => setOpen(false)}>Cancel</button></div>
        </div>
      )}
      <div className="stack g10">
        {visible.length === 0 ? <div className="card" style={{ padding: 24, textAlign: "center" }}><Icon name="ticket" size={26} /><h3>No coupons yet</h3><p className="faint">Create a measurable deal customers can claim and redeem.</p></div> : visible.map((p) => (
          <div className="card owner-coupon-row" key={p.id}>
            <div className="coupon-value">{couponValue(p as never)}</div><div className="f1"><div className="flex g8 center wrap"><h3>{p.title}</h3><span className={`pill-tag ${p.status === "active" ? "green" : ""}`}>{p.status}</span></div>{p.rejection_reason && <p className="coupon-error">Review note: {p.rejection_reason}</p>}<p className="faint">{p.claimed_count} claims · {p.redeemed_count} redemptions · {p.claimed_count ? Math.round((p.redeemed_count / p.claimed_count) * 100) : 0}% redemption rate</p></div>
            <div>{p.status === "active" ? <button className="btn btn-ghost btn-sm" onClick={() => action(p,"pause")}>Pause</button> : p.status === "paused" || p.status === "rejected" ? <button className="btn btn-soft btn-sm" onClick={() => action(p,"resume")}>Resubmit</button> : null}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
