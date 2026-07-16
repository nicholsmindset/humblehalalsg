"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { couponValue } from "@/lib/coupons";

type Mine = { id: string; token: string; short_code: string; status: string; expires_at: string | null; redeemed_at: string | null; business_promotions: { title: string; discount_type: "percent"|"fixed"|"free_item"|"bundle"; discount_value: number | null; reward_text: string | null } | null; businesses: { name: string; slug: string } | null };

export function MyCoupons() {
  const [rows, setRows] = useState<Mine[]>([]); const [loaded, setLoaded] = useState(false); const [qrs, setQrs] = useState<Record<string,string>>({});
  useEffect(() => { fetch("/api/coupons/mine").then((r) => r.ok ? r.json() : null).then((d) => { if (d?.ok) setRows(d.redemptions || []); setLoaded(true); }).catch(() => setLoaded(true)); }, []);
  useEffect(() => { if (typeof window === "undefined") return; for (const row of rows.filter((r) => r.status === "claimed")) QRCode.toDataURL(`${window.location.origin}/owner?tab=promotions&redeem=${row.token}`, { width: 180, margin: 1 }).then((url) => setQrs((q) => ({ ...q, [row.id]: url }))).catch(() => {}); }, [rows]);
  if (!loaded || rows.length === 0) return null;
  return <section style={{ marginBottom: 32 }}><h2>My coupons</h2><p className="faint" style={{ marginBottom: 12 }}>Your claimed and redeemed offers.</p><div className="deals-grid">{rows.map((row) => <article className="coupon-card" key={row.id}><div className="coupon-value">{row.business_promotions ? couponValue(row.business_promotions) : "Coupon"}</div><div className="coupon-content"><a className="coupon-business" href={`/business/${row.businesses?.slug || ""}`}>{row.businesses?.name}</a><h3>{row.business_promotions?.title || "Coupon"}</h3><span className="pill-tag">{row.status}</span>{row.status === "claimed" && <div className="coupon-wallet"><div><span>Show staff this code</span><strong>{row.short_code}</strong></div>{qrs[row.id] && <img src={qrs[row.id]} alt="Coupon redemption QR code" width={88} height={88} />}</div>}</div></article>)}</div></section>;
}
