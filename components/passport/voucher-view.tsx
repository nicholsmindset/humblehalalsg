"use client";

/* Perk voucher landing (/v/[code]). Business owner (canMark) taps "Mark used";
   anyone else just sees the voucher to present at the counter. */

import { useEffect, useState } from "react";
import { Icon } from "../ui";

const SITE = "https://www.humblehalal.com";

function QR({ value, size = 200 }: { value: string; size?: number }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let alive = true;
    import("qrcode").then(({ default: Q }) => Q.toDataURL(value, { margin: 1, width: size * 2, errorCorrectionLevel: "M" })).then((u) => { if (alive) setUrl(u); }).catch(() => {});
    return () => { alive = false; };
  }, [value, size]);
  if (!url) return <div style={{ width: size, height: size, background: "#f2f0ea", borderRadius: 12 }} aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" width={size} height={size} style={{ display: "block", borderRadius: 12 }} />;
}

export function VoucherView({ code, title, cost, status, business, canMark }: { code: string; title: string; cost: number; status: string; business: string; canMark: boolean }) {
  const [state, setState] = useState(status);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const markUsed = async () => {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/owner/perks/redemptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const d = await res.json();
      if (d.error === "already_used") { setState("used"); setMsg("This voucher was already used."); }
      else if (!res.ok || !d.ok) setMsg("Couldn't update — try again.");
      else { setState("used"); setMsg("Marked used ✓"); }
    } catch { setMsg("Couldn't update — try again."); }
    setBusy(false);
  };

  const used = state === "used";
  return (
    <div className="screen-in hh-page">
      <div className="hh-wrap" style={{ maxWidth: 460, paddingTop: 36, paddingBottom: 48 }}>
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <div className="eyebrow" style={{ color: "var(--emerald,#0e7a5f)" }}>HALAL PASSPORT PERK</div>
          <h1 style={{ fontSize: "1.5rem", marginTop: 8 }}>{title}</h1>
          <div className="faint" style={{ marginTop: 4 }}>{business} · {cost} pts</div>

          <div style={{ marginTop: 16 }}>
            <span className={`pill-tag ${used ? "" : "green"}`} style={{ fontSize: ".9rem" }}>{used ? "Used" : "Valid"}</span>
          </div>

          {!used && !canMark && (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}><QR value={`${SITE}/v/${code}`} /></div>
              <p className="faint" style={{ fontSize: ".84rem", marginTop: 12 }}>Show this to staff at the counter.</p>
            </>
          )}

          <code style={{ display: "block", marginTop: 16, fontSize: "1.1rem", fontWeight: 700, letterSpacing: ".08em" }}>{code}</code>

          {canMark && !used && (
            <button className="btn btn-primary btn-lg mt16" disabled={busy} onClick={markUsed}><Icon name="check" size={18} /> {busy ? "…" : "Mark used"}</button>
          )}
          {msg && <p className="faint" style={{ marginTop: 12 }}>{msg}</p>}
          {used && <p className="faint" style={{ marginTop: 12 }}>This perk has been redeemed.</p>}
        </div>
      </div>
    </div>
  );
}
