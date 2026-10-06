"use client";

import Script from "next/script";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { canInitializeGoogleAds, validPublisherId } from "@/lib/editorial-ads";

export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
export const adsenseEnabled = validPublisherId(ADSENSE_CLIENT);
let adLibraryFailed = false;
export const CONSENT_EVENT = "hh:consent-change";

function subscribeConsent(notify: () => void) {
  window.addEventListener(CONSENT_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(CONSENT_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}
function adServingEnabled() {
  try { return canInitializeGoogleAds(localStorage.getItem("hh_consent_v1")); }
  catch { return true; } // Google's certified CMP remains the consent authority.
}
export function useAdvertisingConsent() {
  return useSyncExternalStore(subscribeConsent, adServingEnabled, () => false);
}

declare global {
  interface Window { adsbygoogle?: unknown[]; }
}

/** next/script deduplicates the library across slots and client navigations.
 * Google Privacy & messaging supplies the certified regional consent flow;
 * prior site-level opt-outs remain an additional gate, never a TCF substitute.
 * No default consent grant is fabricated when the custom popup is absent. */
export function AdsenseScript() {
  const consent = useAdvertisingConsent();
  if (!adsenseEnabled || !consent) return null;
  return <Script id="adsbygoogle-js" strategy="afterInteractive" async
    crossOrigin="anonymous"
    onError={() => { adLibraryFailed = true; window.dispatchEvent(new Event("hh:ads-unavailable")); }}
    src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`} />;
}

export function AdsenseUnit({ slot, format, onFilled, onUnfilled }: {
  slot: string; format: string; onFilled?: () => void; onUnfilled?: () => void;
}) {
  const ref = useRef<HTMLModElement>(null);
  const consent = useAdvertisingConsent();
  const filled = useRef(onFilled);
  const unfilled = useRef(onUnfilled);
  useEffect(() => { filled.current = onFilled; unfilled.current = onUnfilled; }, [onFilled, onUnfilled]);

  useEffect(() => {
    const node = ref.current;
    if (!adsenseEnabled || !consent || !node || !/^\d+$/.test(slot)) return;
    const unavailable = () => unfilled.current?.();
    if (adLibraryFailed) { unavailable(); return; }
    window.addEventListener("hh:ads-unavailable", unavailable);
    let requested = node.dataset.hhRequested === "true";
    let reported = false;
    const status = new MutationObserver(() => {
      if (node.dataset.adStatus === "filled" && !reported) {
        reported = true;
        filled.current?.();
      } else if (node.dataset.adStatus === "unfilled") unfilled.current?.();
    });
    status.observe(node, { attributes: true, attributeFilter: ["data-ad-status"] });
    let near = false;
    const request = () => {
      // Hidden/zero-width slots must not be pushed. A ResizeObserver retries
      // only until the first successful request; no refresh timers or loops.
      if (!near || requested || node.getBoundingClientRect().width < 250) return;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        requested = true;
        node.dataset.hhRequested = "true";
      } catch { unfilled.current?.(); }
    };
    const resize = new ResizeObserver(request);
    resize.observe(node);
    const intersection = new IntersectionObserver(entries => {
      near = entries.some(entry => entry.isIntersecting);
      request();
    }, { rootMargin: "300px" });
    intersection.observe(node);
    return () => { intersection.disconnect(); resize.disconnect(); status.disconnect(); window.removeEventListener("hh:ads-unavailable", unavailable); };
  }, [slot, consent]);

  if (!adsenseEnabled || !consent || !/^\d+$/.test(slot)) return null;
  return <>
    <AdsenseScript />
    <ins ref={ref} className="adsbygoogle" style={{ display: "block", width: "100%" }}
      data-ad-client={ADSENSE_CLIENT} data-ad-slot={slot}
      data-ad-format={format === "in_article" ? "fluid" : "auto"}
      data-ad-layout={format === "in_article" ? "in-article" : undefined}
      data-full-width-responsive="false"
      data-adtest={typeof window !== "undefined" && !["humblehalal.com", "www.humblehalal.com"].includes(window.location.hostname) ? "on" : undefined} />
  </>;
}
