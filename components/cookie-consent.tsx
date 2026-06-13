"use client";

import { useEffect, useState } from "react";

const KEY = "hh_consent_v1";

/* Minimal PDPA-aware consent banner. Records the user's choice in localStorage.
   Analytics (if added later) should check this value before loading. */
export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* storage blocked — don't nag */
    }
  }, []);

  const choose = (v: "accepted" | "essential") => {
    try {
      localStorage.setItem(KEY, v);
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;
  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent" aria-live="polite">
      <p className="cookie-text">
        We use essential browser storage to run the site and remember your saved places. With your consent we may add
        analytics later. See our <a href="/cookies">Cookie Policy</a> and <a href="/privacy">Privacy Policy</a>.
      </p>
      <div className="cookie-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => choose("essential")}>Essential only</button>
        <button className="btn btn-primary btn-sm" onClick={() => choose("accepted")}>Accept all</button>
      </div>
    </div>
  );
}
