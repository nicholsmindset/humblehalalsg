"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const KEY = "hh_consent_v1";

type Consent = { analytics: boolean; marketing: boolean; ts: number; v: 1 };

/** Read a valid v1 consent object, or null (missing / legacy string / malformed). */
function readConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    if (c && typeof c === "object" && c.v === 1) return c as Consent;
    return null; // legacy "accepted"/"essential" string → re-ask so we can capture granular choice
  } catch {
    return null;
  }
}

/** Push Google Consent Mode v2 updates + a dataLayer event GTM can trigger on. */
function applyConsentMode(analytics: boolean, marketing: boolean) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  // GTM only honors Consent Mode commands pushed as a REAL `arguments` object;
  // an Array (from a rest parameter) is silently ignored, so the granted/denied
  // update wouldn't take effect until the next full page load. Keep it a classic
  // function that pushes `arguments`.
  function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments as unknown as Record<string, unknown>);
  }
  (gtag as unknown as (...args: unknown[]) => void)("consent", "update", {
    analytics_storage: analytics ? "granted" : "denied",
    ad_storage: marketing ? "granted" : "denied",
    ad_user_data: marketing ? "granted" : "denied",
    ad_personalization: marketing ? "granted" : "denied",
  });
  window.dataLayer.push({ event: "consent_update", analytics_consent: analytics, marketing_consent: marketing });
}

/* PDPA-aware consent banner. Records a granular choice in localStorage and
   drives Google Consent Mode v2 (see components/analytics/gtm.tsx). Marketing
   pixels stay blocked until the user opts in; analytics runs in cookieless
   modeled mode until analytics is granted. */
export function CookieConsent() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!readConsent()) setShow(true);
  }, []);

  const save = (a: boolean, m: boolean) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ analytics: a, marketing: m, ts: Date.now(), v: 1 } satisfies Consent));
    } catch {
      /* storage blocked — still apply for this session */
    }
    applyConsentMode(a, m);
    setShow(false);
  };

  if (!show || pathname.startsWith("/keystatic")) return null;
  return (
    <div className="cookie-banner" role="region" aria-label="Cookie consent" aria-live="polite">
      <p className="cookie-text">
        We use essential storage to run the site. With your consent we also use analytics (to improve the site) and
        marketing cookies (to measure ads). See our <a href="/cookies">Cookie Policy</a> and{" "}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      {customize && (
        <div className="cookie-options stack g10" style={{ margin: "8px 0" }}>
          <label className="flex g10 center" style={{ cursor: "not-allowed", opacity: 0.7 }}>
            <input type="checkbox" checked disabled aria-label="Essential (always on)" />
            <span><strong>Essential</strong> — always on (site functionality &amp; saved places)</span>
          </label>
          <label className="flex g10 center" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
            <span><strong>Analytics</strong> — anonymous usage stats (GA4, Clarity)</span>
          </label>
          <label className="flex g10 center" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
            <span><strong>Marketing</strong> — ad measurement (Meta, TikTok, LinkedIn, Google Ads)</span>
          </label>
        </div>
      )}

      <div className="cookie-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => save(false, false)}>Essential only</button>
        {customize ? (
          <button className="btn btn-soft btn-sm" onClick={() => save(analytics, marketing)}>Save choices</button>
        ) : (
          <button className="btn btn-soft btn-sm" onClick={() => setCustomize(true)}>Customize</button>
        )}
        <button className="btn btn-primary btn-sm" onClick={() => save(true, true)}>Accept all</button>
      </div>
    </div>
  );
}
