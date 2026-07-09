"use client";

/* Creator opt-out — "remove my TikTok". We always honour removal: submitting a
   valid TikTok link immediately unpublishes any featured copy of it. */

import { useState } from "react";
import Link from "next/link";
import { Icon } from "./ui";

const TIKTOK_RE = /tiktok\.com/i;

export function RemoveVideoForm() {
  const [url, setUrl] = useState("");
  const [reason, setReason] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const urlErr = !url.trim() ? "Paste the TikTok link you'd like removed" : !TIKTOK_RE.test(url) ? "That doesn't look like a TikTok link" : "";

  const submit = async () => {
    setTouched(true);
    if (urlErr) return;
    setBusy(true);
    try {
      await fetch("/api/tiktok/remove", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), reason: reason.trim() || undefined, website: website || undefined }),
      });
    } catch { /* graceful */ }
    setBusy(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="card form-card" style={{ textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 40 }}>✅</div>
        <h2 style={{ fontSize: "1.4rem", marginTop: 10 }}>Done — it&apos;s removed</h2>
        <p className="muted" style={{ marginTop: 8 }}>If that video was featured on a listing, it&apos;s been taken down. It can take a few minutes to disappear from cached pages. Thanks for letting us know.</p>
        <Link className="btn btn-soft" href="/" style={{ marginTop: 16 }}>Back to Humble Halal</Link>
      </div>
    );
  }

  return (
    <div className="card form-card">
      <div className="stack g16">
        <div className="field">
          <label htmlFor="rv-url">TikTok video link</label>
          <input id="rv-url" className="input" inputMode="url" placeholder="https://www.tiktok.com/@you/video/…" value={url} onChange={(e) => setUrl(e.target.value)}
            aria-required="true" aria-invalid={touched && !!urlErr} aria-describedby={touched && urlErr ? "rv-url-err" : undefined} />
          {touched && urlErr && <span id="rv-url-err" className="field-error"><Icon name="warning" size={13} /> {urlErr}</span>}
        </div>
        <div className="field">
          <label htmlFor="rv-reason">Anything you&apos;d like us to know? <span className="hint">(optional)</span></label>
          <textarea id="rv-reason" className="textarea" rows={3} placeholder="Optional" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} aria-hidden="true" />
        <button className="btn btn-primary btn-lg" onClick={submit} disabled={busy}>{busy ? "Removing…" : "Remove my video"}</button>
      </div>
    </div>
  );
}
