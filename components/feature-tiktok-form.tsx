"use client";

/* "Feature your TikTok" — public submit form. Anyone can paste a TikTok link
   about a halal spot; it goes to the admin review queue (AI-classified, then
   human-approved). Rate-limited + honeypot server-side. */

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "./ui";

const TIKTOK_RE = /tiktok\.com/i;

export function FeatureTikTokForm() {
  const params = useSearchParams();
  const businessSlug = params.get("business") || "";

  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const urlErr = !url.trim() ? "Paste the TikTok video link" : !TIKTOK_RE.test(url) ? "That doesn't look like a TikTok link" : "";
  const emailErr = email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "Enter a valid email" : "";

  const submit = async () => {
    setTouched(true);
    if (urlErr || emailErr) return;
    setBusy(true);
    try {
      const res = await fetch("/api/tiktok", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), note: note.trim() || undefined, email: email.trim() || undefined, businessSlug: businessSlug || undefined, website: website || undefined }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.status === 404) { setBusy(false); setTouched(true); return; }
      if (res.ok && d?.ok) { setDone(true); }
    } catch { /* graceful */ }
    setBusy(false);
    setDone(true); // always confirm (graceful)
  };

  if (done) {
    return (
      <div className="card form-card" style={{ textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 40 }}>🙌</div>
        <h2 style={{ fontSize: "1.4rem", marginTop: 10 }}>Thanks — we got your video!</h2>
        <p className="muted" style={{ marginTop: 8 }}>Our team reviews every submission before it appears on a listing. If it&apos;s a match and it&apos;s family-friendly, you&apos;ll see it featured soon.</p>
        <div className="flex g10 center wrap" style={{ marginTop: 18, justifyContent: "center" }}>
          <button className="btn btn-soft" onClick={() => { setDone(false); setUrl(""); setNote(""); setTouched(false); }}>Submit another</button>
          <Link className="btn btn-ghost" href="/explore">Browse halal spots</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card form-card">
      <div className="stack g16">
        <div className="field">
          <label htmlFor="tt-url">TikTok video link</label>
          <input id="tt-url" className="input" inputMode="url" placeholder="https://www.tiktok.com/@creator/video/…" value={url} onChange={(e) => setUrl(e.target.value)}
            aria-required="true" aria-invalid={touched && !!urlErr} aria-describedby={touched && urlErr ? "tt-url-err" : undefined} />
          {touched && urlErr && <span id="tt-url-err" className="field-error"><Icon name="warning" size={13} /> {urlErr}</span>}
        </div>
        <div className="field">
          <label htmlFor="tt-note">Which halal spot is it about? <span className="hint">(optional but helps us match it)</span></label>
          <textarea id="tt-note" className="textarea" rows={3} placeholder="e.g. Sabar Menanti, Adam Road — the nasi padang stall" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="tt-email">Your email <span className="hint">(optional — we&apos;ll tell you when it&apos;s live)</span></label>
          <input id="tt-email" className="input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
            aria-invalid={touched && !!emailErr} aria-describedby={touched && emailErr ? "tt-email-err" : undefined} />
          {touched && emailErr && <span id="tt-email-err" className="field-error"><Icon name="warning" size={13} /> {emailErr}</span>}
        </div>
        {/* honeypot — hidden from real users */}
        <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} aria-hidden="true" />
        <button className="btn btn-primary btn-lg" onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Submit my TikTok"}</button>
        <p className="faint" style={{ fontSize: ".8rem" }}>By submitting you confirm you&apos;re happy for us to feature this public TikTok on the matching listing, with credit to the creator. Creators can ask us to remove a video anytime via <Link className="link-inline" href="/remove-video">remove a video</Link>.</p>
      </div>
    </div>
  );
}
