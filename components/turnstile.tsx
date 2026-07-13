"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          size?: string;
          appearance?: string;
        },
      ) => string;
      reset: (id?: string) => void;
    };
  }
}

let scriptLoading: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptLoading) return scriptLoading;
  scriptLoading = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // never block the form on a CDN hiccup
    document.head.appendChild(s);
  });
  return scriptLoading;
}

/* Cloudflare Turnstile widget. Renders NOTHING until NEXT_PUBLIC_TURNSTILE_SITE_KEY
   is set (dark rollout) — the server-side verifyTurnstile() also no-ops until the
   secret is set, so the form works unchanged in the meantime. Calls onToken with
   the solved token ("" on expiry/error so the caller can re-gate submit). */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    let cancelled = false;
    void loadScript().then(() => {
      if (cancelled || !ref.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        appearance: "interaction-only", // invisible unless a challenge is needed
        callback: (t) => onToken(t),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [onToken]);

  if (!SITE_KEY) return null;
  return <div ref={ref} style={{ marginTop: 8 }} />;
}
