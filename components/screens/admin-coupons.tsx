"use client";

import { useEffect, useState } from "react";
import { couponValue } from "@/lib/coupons";
import { Icon } from "../ui";

type Row = { id: string; title: string; details: string | null; discount_type: "percent"|"fixed"|"free_item"|"bundle"; discount_value: number | null; reward_text: string | null; min_spend_cents: number; starts_at: string; ends_at: string | null; total_limit: number | null; claimed_count: number; redeemed_count: number; terms: string | null; status: string; rejection_reason: string | null; businesses: { name: string; slug: string; plan: string; status: string } | { name: string; slug: string; plan: string; status: string }[] };

export function AdminCoupons({ toast }: { toast: (m: string) => void }) {
  const [status, setStatus] = useState("pending"); const [rows, setRows] = useState<Row[]>([]); const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); const r = await fetch(`/api/admin/coupons?status=${status}`); const d = await r.json().catch(() => ({})); setRows(d?.ok ? d.promotions || [] : []); setLoading(false); };
  useEffect(() => { void load(); }, [status]);
  const act = async (id: string, action: "approve"|"reject"|"pause") => {
    const reason = action === "reject" ? window.prompt("What should the owner change?", "Please clarify the terms or discount.") || "Needs changes" : undefined;
    const r = await fetch("/api/admin/coupons", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, reason }) }); const d = await r.json().catch(() => ({}));
    if (d?.ok) { toast(`Coupon ${d.status}`); await load(); } else toast(d?.error === "business_not_eligible" ? "The listing must be published and on Premium." : "Couldn't update this coupon.");
  };
  return <div className="admin-section"><div className="admin-sec-head"><div><h2>Coupon moderation</h2><p>Verify value, dates and terms before a deal becomes claimable.</p></div></div>
    <div className="flex g8 wrap" style={{ marginBottom: 16 }}>{["pending","active","rejected","paused","all"].map((s) => <button className={`btn btn-sm ${status === s ? "btn-primary" : "btn-soft"}`} key={s} onClick={() => setStatus(s)}>{s}</button>)}</div>
    {loading ? <div className="card" style={{ height: 100, opacity: .5 }} /> : rows.length === 0 ? <div className="card" style={{ padding: 28, textAlign: "center" }}><Icon name="ticket" size={24} /><h3>Nothing in this queue</h3></div> : <div className="stack g10">{rows.map((row) => { const biz = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses; return <div className="card" style={{ padding: 18 }} key={row.id}><div className="flex between wrap g12"><div className="f1"><div className="flex g8 center wrap"><span className="coupon-value" style={{ display: "inline-grid", minHeight: 46, minWidth: 110, padding: 8, borderRadius: 10, fontSize: ".9rem" }}>{couponValue(row)}</span><div><h3>{row.title}</h3><p className="faint">{biz?.name} · {biz?.plan} · {row.status}</p></div></div>{row.details && <p className="muted" style={{ marginTop: 10 }}>{row.details}</p>}{row.terms && <p className="faint"><b>Terms:</b> {row.terms}</p>}<p className="faint">{row.claimed_count} claims · {row.redeemed_count} redemptions</p></div><div className="flex g8 wrap">{row.status === "pending" && <><button className="btn btn-primary btn-sm" onClick={() => act(row.id,"approve")}>Approve</button><button className="btn btn-soft btn-sm" onClick={() => act(row.id,"reject")}>Request changes</button></>}{row.status === "active" && <button className="btn btn-soft btn-sm" onClick={() => act(row.id,"pause")}>Pause</button>}<a className="btn btn-ghost btn-sm" href={`/business/${biz?.slug}`} target="_blank" rel="noopener">View listing</a></div></div></div>; })}</div>}
  </div>;
}
