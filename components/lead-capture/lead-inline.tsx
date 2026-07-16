"use client";

/* Subtle inline lead capture (leads growth loop, PR-B).
   Renders as a COLLAPSED one-line teaser ("Planning a wedding? Get free quotes
   from Muslim wedding vendors →") that expands to a 3-field form on click —
   deliberately low-key so it never competes with the newsletter capture the
   owner actively promotes. Self-gates via GET /api/leads/config (client-side,
   because blog posts are SSG and guide pages revalidate daily — admin toggles
   must bite without a redeploy). Fail-closed: any config error renders nothing.
   Submits to the EXISTING POST /api/leads with full consent + attribution. */

import { useEffect, useState } from "react";
import { LEAD_VERTICALS, LEAD_CONSENT_VERSION, LEAD_ROUTE_CAP } from "@/lib/lead-verticals";
import { track } from "@/lib/analytics";
import { Turnstile } from "@/components/turnstile";

type SurfaceKey = "blog" | "hub" | "listing" | "popup";
type Config = { enabled: boolean; surfaces: Partial<Record<SurfaceKey, boolean>> };

// One fetch per page load, shared by every capture block on the page.
let configPromise: Promise<Config> | null = null;
function fetchConfig(): Promise<Config> {
  if (!configPromise) {
    configPromise = fetch("/api/leads/config")
      .then((r) => (r.ok ? r.json() : { enabled: false, surfaces: {} }))
      .catch(() => ({ enabled: false, surfaces: {} }));
  }
  return configPromise as Promise<Config>;
}

/** True only when the master flag AND this surface are on. Fail-closed. */
export function useLeadCaptureConfig(surface: SurfaceKey): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let live = true;
    fetchConfig().then((c) => { if (live) setOn(!!c.enabled && !!c.surfaces?.[surface]); });
    return () => { live = false; };
  }, [surface]);
  return on;
}

/** Visibility for PRE-EXISTING capture surfaces (the /quotes banner on hub
 *  pages and the listing "Request a quote" CTA), which shipped BEFORE the
 *  leadCapture flag and must not vanish when the flag is simply off:
 *  master flag OFF → visible (legacy behaviour, fail-open);
 *  master flag ON  → the per-surface toggle governs, so the admin can hide
 *  each one from the Leads tab. */
export function useLegacySurfaceVisible(surface: SurfaceKey): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    let live = true;
    fetchConfig().then((c) => { if (live) setVisible(!c.enabled || !!c.surfaces?.[surface]); });
    return () => { live = false; };
  }, [surface]);
  return visible;
}

const TEASER: Record<string, string> = {
  weddings: "Planning a wedding? Get free quotes from Malay & Muslim wedding vendors",
  catering: "Feeding a crowd? Get free quotes from halal caterers",
  umrah: "Planning Umrah? Get free quotes from trusted travel agents",
  photography: "Need a photographer? Get free quotes from Muslim-owned studios",
};

export function LeadInline({ vertical, surface, defaultOpen = false, onDone }: { vertical: string; surface: SurfaceKey; defaultOpen?: boolean; onDone?: () => void }) {
  const on = useLeadCaptureConfig(surface);
  const [open, setOpen] = useState(defaultOpen);
  const [name, setName] = useState("");
  const [contact, setContact] = useState(""); // email or phone/WhatsApp
  const [details, setDetails] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [tsToken, setTsToken] = useState("");

  const v = LEAD_VERTICALS.find((x) => x.id === vertical);
  if (!on || !v) return null;

  const teaser = TEASER[vertical] || `Looking for ${v.label.toLowerCase()}? Get free quotes from trusted vendors`;
  const isEmail = /@/.test(contact);
  const sourcePath = typeof window !== "undefined" ? window.location.pathname : "";

  const submit = async () => {
    setErr("");
    if (!name.trim()) { setErr("Please add your name."); return; }
    if (!contact.trim()) { setErr("Add an email or WhatsApp number so vendors can reach you."); return; }
    if (!consent) { setErr("Please tick the consent box so we may share your request."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: isEmail ? contact.trim() : "",
          phone: isEmail ? "" : contact.trim(),
          category: v.label,
          details: details.trim(),
          sourcePath: surface === "popup" ? `${sourcePath}#popup` : sourcePath,
          consent: true,
          consentVersion: LEAD_CONSENT_VERSION,
          ...(tsToken ? { turnstileToken: tsToken } : {}),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d?.ok !== false) {
        track.leadSubmit("quote", { listing_category: v.label });
        setDone(true);
        onDone?.();
      } else {
        setErr("Couldn't send your request — please try again.");
      }
    } catch {
      setErr("Couldn't send your request — please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="card" style={{ padding: "12px 16px", fontSize: ".9rem" }} data-lead-capture={surface}>
        ✅ Request received — we&apos;ll send it to up to {LEAD_ROUTE_CAP} matching vendors, who&apos;ll contact you directly.
      </div>
    );
  }

  if (!open) {
    return (
      <p style={{ margin: "18px 0" }} data-lead-capture={surface}>
        <button
          className="link-inline"
          style={{ background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit", fontWeight: 600 }}
          onClick={() => setOpen(true)}
        >
          {teaser} →
        </button>
      </p>
    );
  }

  return (
    <div className="card" style={{ padding: 16, margin: "18px 0" }} data-lead-capture={surface}>
      <strong style={{ fontSize: ".95rem" }}>{teaser}</strong>
      <div className="stack g8" style={{ marginTop: 10 }}>
        <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Your name" />
        <input className="input" placeholder="Email or WhatsApp number" value={contact} onChange={(e) => setContact(e.target.value)} aria-label="Email or WhatsApp number" />
        <input className="input" placeholder={`What do you need? (date, guests, budget — optional)`} value={details} onChange={(e) => setDetails(e.target.value)} aria-label="Details (optional)" />
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer", fontSize: ".8rem" }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 3, flexShrink: 0 }} />
          <span className="faint">
            I agree that Humble Halal may share my request and contact details with up to {LEAD_ROUTE_CAP} matching
            halal providers, who may contact me directly about this request.
          </span>
        </label>
        {err && <span className="field-error" style={{ fontSize: ".8rem" }}>{err}</span>}
        <Turnstile onToken={setTsToken} />
        <div className="flex g8 center wrap">
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={submit}>{busy ? "Sending…" : "Get my free quotes"}</button>
          <a className="link-inline" style={{ fontSize: ".8rem" }} href={`/quotes?category=${encodeURIComponent(v.label)}&source=${encodeURIComponent(sourcePath)}`}>
            Prefer the full form?
          </a>
        </div>
      </div>
    </div>
  );
}
