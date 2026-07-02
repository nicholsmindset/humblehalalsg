"use client";

/* Google AdSense — programmatic fill for unsold slots. Flag-gated: nothing loads
   unless NEXT_PUBLIC_ADSENSE_CLIENT (ca-pub-…) is set, so the whole integration
   ships dark until the AdSense account is approved.

   Privacy: serves non-personalised ads (data-npa="1") until the visitor grants
   marketing consent via the existing cookie banner (hh_consent_v1). Brand safety
   (blocked categories) is configured in the AdSense dashboard — see lib/ad-safety.ts
   and the runbook. */

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
export const adsenseEnabled = ADSENSE_CLIENT.startsWith("ca-pub-");

// Read marketing consent from the cookie-consent store (localStorage hh_consent_v1).
function marketingConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("hh_consent_v1");
    if (!raw) return false;
    return JSON.parse(raw)?.marketing === true;
  } catch {
    return false;
  }
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Loads the AdSense library once, after hydration. Rendered in the root layout.
 *  No-op unless a real publisher id is configured. */
export function AdsenseScript() {
  if (!adsenseEnabled) return null;
  return (
    <Script
      id="adsbygoogle-js"
      strategy="afterInteractive"
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}

/** A single AdSense unit, sized by the placement's IAB format. Only pushes to
 *  adsbygoogle when it scrolls near the viewport (lazy) to protect performance. */
export function AdsenseUnit({
  slot,
  format,
  onFilled,
}: {
  slot: string;
  format: string;
  onFilled?: () => void;
}) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [npa] = useState(() => (marketingConsent() ? "0" : "1"));

  useEffect(() => {
    if (!adsenseEnabled || !slot || pushed.current) return;
    const node = ref.current;
    if (!node) return;
    const push = () => {
      if (pushed.current) return;
      pushed.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        onFilled?.();
      } catch {
        /* AdSense not ready / blocked — leave the reserved box empty */
      }
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          push();
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(node);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot]);

  if (!adsenseEnabled || !slot) return null;

  // Responsive by default; the placement's size_format drives the reserved box
  // (see styles/ads.css) so this stays CLS-safe.
  return (
    <ins
      ref={ref}
      className="adsbygoogle"
      style={{ display: "block", width: "100%", height: "100%" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format === "in_article" ? "fluid" : "auto"}
      data-ad-layout={format === "in_article" ? "in-article" : undefined}
      data-full-width-responsive="true"
      data-npa={npa}
    />
  );
}
