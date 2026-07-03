"use client";

/* Ask-for-reviews tool (owner Reviews tab). Owners could previously only
   *reply* to reviews — this closes the acquisition loop: a short review link
   (/r/[slug]) they can copy, WhatsApp-share, print as a QR poster, or download
   as a QR image. More reviews → richer AggregateRating schema → better SERP CTR. */

import { useState } from "react";
import { Icon } from "../ui";

const SITE = "https://www.humblehalal.com";

type BizLite = { id: string; slug: string; name: string };

export function ReviewRequestCard({ biz }: { biz: BizLite[] | null }) {
  const [copied, setCopied] = useState<string>("");
  if (!biz || biz.length === 0) return null;

  const copy = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(`${SITE}/r/${slug}`);
      setCopied(slug);
      setTimeout(() => setCopied(""), 1800);
    } catch { /* clipboard blocked */ }
  };

  const downloadQr = async (slug: string, name: string) => {
    try {
      const { default: QRCode } = await import("qrcode");
      const url = await QRCode.toDataURL(`${SITE}/r/${slug}`, { margin: 1, width: 640, errorCorrectionLevel: "M" });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-review-qr.png`;
      a.click();
    } catch { /* qrcode failed to load */ }
  };

  const waMsg = (name: string, slug: string) =>
    `https://wa.me/?text=${encodeURIComponent(`Enjoyed ${name}? 🙏 Leave us a quick review on Humble Halal: ${SITE}/r/${slug}`)}`;

  return (
    <div className="dash-pane">
      <div className="card" style={{ padding: 18 }}>
        <div className="flex g10 center" style={{ marginBottom: 4 }}>
          <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--gold-50,#fbf3df)", color: "var(--gold,#b8860b)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="star" size={17} /></span>
          <div>
            <h3 style={{ fontSize: "1.1rem" }}>Ask happy customers for reviews</h3>
            <p className="faint" style={{ fontSize: ".85rem" }}>Share your review link — more reviews help you rank higher and win trust.</p>
          </div>
        </div>
        <div className="stack g10" style={{ marginTop: 12 }}>
          {biz.map((b) => (
            <div key={b.id} className="card" style={{ padding: "12px 14px", background: "var(--wash,#f8f6f0)" }}>
              <div className="flex between center wrap g8">
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontWeight: 700, fontSize: ".95rem" }}>{b.name}</div>
                  <code style={{ fontSize: ".8rem", color: "var(--ink-soft,#5b6d64)" }}>humblehalal.com/r/{b.slug}</code>
                </div>
                <div className="flex g8 wrap">
                  <button className="btn btn-soft btn-sm" onClick={() => copy(b.slug)}><Icon name={copied === b.slug ? "check" : "doc"} size={15} /> {copied === b.slug ? "Copied" : "Copy link"}</button>
                  <a className="btn btn-soft btn-sm" href={waMsg(b.name, b.slug)} target="_blank" rel="noopener"><Icon name="whatsapp" size={15} /> Share</a>
                  <button className="btn btn-soft btn-sm" onClick={() => downloadQr(b.slug, b.name)}><Icon name="upload" size={15} /> QR image</button>
                  <a className="btn btn-ghost btn-sm" href={`/business/${b.slug}/poster#review`} target="_blank" rel="noopener"><Icon name="external" size={15} /> Poster</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
