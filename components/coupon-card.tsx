"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { couponAvailability, couponValue, type PublicCoupon } from "@/lib/coupons";
import { track } from "@/lib/analytics";
import { Icon } from "./ui";

export function CouponCard({ coupon, compact = false }: { coupon: PublicCoupon; compact?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [claimed, setClaimed] = useState<{ token: string; short_code: string; expires_at: string | null } | null>(null);
  const [qr, setQr] = useState("");
  const remaining = couponAvailability(coupon);
  const slug = coupon.business_slug || "";

  useEffect(() => { if (slug) track.couponView(slug, coupon.id); }, [coupon.id, slug]);
  useEffect(() => {
    if (!claimed?.token || typeof window === "undefined") return;
    QRCode.toDataURL(`${window.location.origin}/owner?tab=promotions&redeem=${claimed.token}`, { width: 220, margin: 1, color: { dark: "#0d4f4f", light: "#ffffff" } })
      .then(setQr).catch(() => setQr(""));
  }, [claimed]);

  const claim = async () => {
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/coupons/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ promotionId: coupon.id }) });
      const d = await r.json().catch(() => ({}));
      if (r.status === 401) {
        window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
      if (d?.ok && d.redemption) { setClaimed(d.redemption); if (slug) track.couponClaim(slug, coupon.id); }
      else setError(d?.error === "sold_out" ? "This coupon has just sold out." : d?.error === "unavailable" ? "This coupon is no longer available." : "Couldn't claim this coupon. Try again.");
    } catch { setError("Couldn't claim this coupon. Check your connection."); }
    finally { setBusy(false); }
  };

  const end = coupon.ends_at ? new Date(coupon.ends_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" }) : null;
  return (
    <article className={`coupon-card ${compact ? "is-compact" : ""}`}>
      <div className="coupon-value">{couponValue(coupon)}</div>
      <div className="coupon-content">
        {coupon.business_name && <a className="coupon-business" href={coupon.business_slug ? `/business/${coupon.business_slug}` : undefined}>{coupon.business_name}</a>}
        <h3>{coupon.title}</h3>
        {coupon.details && <p>{coupon.details}</p>}
        <div className="coupon-meta">
          {coupon.min_spend_cents > 0 && <span>Min. spend ${(coupon.min_spend_cents / 100).toFixed(2)}</span>}
          {end && <span>Ends {end}</span>}
          {remaining != null && remaining <= 20 && <span>{remaining} left</span>}
        </div>
        {coupon.terms && <details><summary>Terms</summary><p>{coupon.terms}</p></details>}
        {!claimed ? (
          <button className="btn btn-primary btn-sm" disabled={busy || remaining === 0} onClick={claim}>
            <Icon name="ticket" size={15} /> {remaining === 0 ? "Sold out" : busy ? "Claiming…" : "Claim coupon"}
          </button>
        ) : (
          <div className="coupon-wallet" role="status">
            <div>
              <span>Show staff this code</span>
              <strong>{claimed.short_code}</strong>
              <small>Staff confirms it in their Humble Halal dashboard.</small>
            </div>
            {qr && <img src={qr} alt="Coupon redemption QR code" width={112} height={112} />}
          </div>
        )}
        {error && <p className="coupon-error" role="alert">{error}</p>}
      </div>
    </article>
  );
}
