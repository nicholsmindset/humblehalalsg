"use client";

/* Printable shopfront poster — two QR codes (listing + review link) a business
   can print and display. QR generated client-side via the same dynamically
   imported `qrcode` used for ticket check-in (no network, no bundle cost until
   this page renders). "Print / Save as PDF" uses the browser print dialog. */

import { useEffect, useState } from "react";

const SITE = "https://www.humblehalal.com";

function QR({ value, size = 220 }: { value: string; size?: number }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let alive = true;
    import("qrcode")
      .then(({ default: QRCode }) => QRCode.toDataURL(value, { margin: 1, width: size * 2, errorCorrectionLevel: "M" }))
      .then((u) => { if (alive) setUrl(u); })
      .catch(() => {});
    return () => { alive = false; };
  }, [value, size]);
  if (!url) return <div style={{ width: size, height: size, background: "#f2f0ea", borderRadius: 12 }} aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" width={size} height={size} style={{ display: "block", borderRadius: 12 }} />;
}

export function PosterClient({ slug, name, statusLabel, collectEnabled = false, collectToken = "" }: { slug: string; name: string; statusLabel: string; collectEnabled?: boolean; collectToken?: string }) {
  const listingUrl = `${SITE}/business/${slug}?utm_source=poster&utm_medium=qr`;
  const reviewUrl = `${SITE}/r/${slug}`;
  // Signed token gates the points award (anti-forgery — see lib/passport-collect).
  const collectUrl = `${SITE}/c/${slug}${collectToken ? `?k=${collectToken}` : ""}`;

  return (
    <div className="poster-wrap">
      <div className="poster-actions">
        <button className="btn btn-primary" onClick={() => window.print()}>Print / Save as PDF</button>
        <a className="btn btn-outline" href={`/for-business/badge?slug=${encodeURIComponent(slug)}`}>Get website badge instead</a>
      </div>

      <div className="poster-sheet">
        <div className="poster-brand">HUMBLE HALAL</div>
        <h1 className="poster-name">{name}</h1>
        <div className="poster-status">{statusLabel}</div>

        <div className="poster-qrs">
          <div className="poster-qr" id="menu">
            <QR value={listingUrl} />
            <div className="poster-qr-h">See our listing</div>
            <div className="poster-qr-s">Menu, halal status, reviews &amp; directions</div>
          </div>
          <div className="poster-qr" id="review">
            <QR value={reviewUrl} />
            <div className="poster-qr-h">Enjoyed it? Leave a review</div>
            <div className="poster-qr-s">Scan &amp; share your experience — it takes a minute</div>
          </div>
          {collectEnabled && (
            <div className="poster-qr" id="collect">
              <QR value={collectUrl} />
              <div className="poster-qr-h">Collect a Halal Passport stamp</div>
              <div className="poster-qr-s">Scan to earn points &amp; badges on Humble Halal</div>
            </div>
          )}
        </div>

        <div className="poster-foot">Find us on humblehalal.com — Singapore&apos;s halal directory</div>
      </div>

      <style>{`
        .poster-wrap { max-width: 720px; margin: 0 auto; padding: 24px 16px 60px; }
        .poster-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 22px; }
        .poster-sheet {
          background: #fff; color: #123c30; border: 1px solid #e2ebe6; border-radius: 18px;
          padding: 44px 36px; text-align: center; box-shadow: 0 8px 30px rgba(18,60,48,.06);
        }
        .poster-brand { font-size: .82rem; letter-spacing: .22em; font-weight: 700; color: #0e7a5f; }
        .poster-name { font-size: clamp(1.7rem, 4.5vw, 2.5rem); margin: 10px 0 6px; line-height: 1.1; }
        .poster-status { display: inline-block; font-size: .9rem; font-weight: 600; color: #0e7a5f; background: #e7f3ee; border-radius: 999px; padding: 5px 14px; }
        .poster-qrs { display: flex; gap: 28px; flex-wrap: wrap; justify-content: center; margin: 34px 0 24px; }
        .poster-qr { flex: 1; min-width: 220px; }
        .poster-qr-h { font-weight: 700; margin-top: 14px; font-size: 1.05rem; }
        .poster-qr-s { color: #5b6d64; font-size: .84rem; margin-top: 4px; }
        .poster-foot { font-size: .82rem; color: #7c8a96; border-top: 1px solid #eef3f0; padding-top: 18px; }
        @media print {
          .poster-actions { display: none !important; }
          .poster-wrap { padding: 0; max-width: none; }
          .poster-sheet { border: none; box-shadow: none; border-radius: 0; }
        }
      `}</style>
    </div>
  );
}
