"use client";

/* The one reusable ad slot. Given a placement key it:
     1. fetches the active direct creative + the placement's serving config,
     2. reserves the slot's height (CSS var) so filling causes NO layout shift,
     3. serves by fill_mode:  direct sponsor → AdSense fill → nothing (collapse).
   Direct sponsors always win; AdSense only backfills unsold inventory; a slot with
   no fill and no AdSense renders nothing and reserves no space.

   Tracking: a direct impression fires once at 50% visibility (persisted via
   /api/ads/track for the admin report) and mirrors to GA4 via track.adImpression;
   a direct click logs + mirrors via track.adClick. AdSense reports its own numbers;
   we push an ad_impression{source:'adsense'} for GA4 slot visibility. */

import { useEffect, useRef, useState } from "react";
import { useApp } from "../app-context";
import { Icon, ImagePh } from "../ui";
import { track } from "@/lib/analytics";
import { AdsenseUnit, adsenseEnabled } from "./adsense";

type Ad = { id: string; title: string; body?: string | null; imageUrl?: string | null; targetUrl?: string | null };
type Placement = {
  key: string;
  active: boolean;
  fillMode: "off" | "direct_only" | "adsense_only" | "direct_then_adsense";
  sizeFormat: string;
  adsenseSlot: string | null;
  minHeight: number;
  minHeightMobile: number;
  lazy: boolean;
};

const BANNER_FORMATS = new Set(["leaderboard", "mobile_banner", "rectangle", "halfpage"]);

function sessionId(): string {
  try {
    let s = sessionStorage.getItem("hh_sid");
    if (!s) { s = Math.random().toString(36).slice(2, 12); sessionStorage.setItem("hh_sid", s); }
    return s;
  } catch { return ""; }
}

export function AdSlot({ slot, className }: { slot: string; className?: string }) {
  const { navigate } = useApp();
  const [ad, setAd] = useState<Ad | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const el = useRef<HTMLDivElement>(null);
  const seen = useRef(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/ads/active?placement=${encodeURIComponent(slot)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!alive) return;
        setAd((j?.ads?.[0] as Ad) ?? null);
        setPlacement((j?.placement as Placement) ?? null);
        setLoaded(true);
      })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [slot]);

  const trackDirect = (kind: "impression" | "click") => {
    if (!ad) return;
    try {
      fetch("/api/ads/track", {
        method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: ad.id, placementKey: slot, kind, session: sessionId() }),
      }).catch(() => {});
    } catch { /* ignore */ }
  };

  // A new creative (campaign rotation) is a fresh impression opportunity.
  useEffect(() => { seen.current = false; }, [ad]);

  // Direct impression — once, at 50% visibility. AdSense does its own impression.
  useEffect(() => {
    if (!ad || !el.current || seen.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !seen.current) {
        seen.current = true;
        trackDirect("impression");
        track.adImpression({ placement: slot, source: "direct", campaignId: ad.id });
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el.current);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad]);

  if (!loaded || !placement || placement.fillMode === "off") return null;

  const adsenseAllowed = placement.fillMode === "adsense_only" || placement.fillMode === "direct_then_adsense";
  const showAdsense = !ad && adsenseAllowed && adsenseEnabled && !!placement.adsenseSlot;

  // Clean empty state: no direct sponsor and no AdSense → render nothing, reserve
  // no space (the plan's collapse rule).
  if (!ad && !showAdsense) return null;

  const style = {
    // Consumed by styles/ads.css to reserve the box → zero CLS.
    ["--ad-h" as string]: `${placement.minHeight}px`,
    ["--ad-h-m" as string]: `${placement.minHeightMobile}px`,
  } as React.CSSProperties;

  // ── Direct sponsor ──────────────────────────────────────────────────────────
  if (ad) {
    const go = () => {
      trackDirect("click");
      track.adClick({ placement: slot, source: "direct", campaignId: ad.id });
      const url = ad.targetUrl || "";
      if (/^https?:\/\//.test(url)) window.open(url, "_blank", "noopener,noreferrer");
      else if (url.startsWith("/business/")) navigate("detail", { slug: url.replace("/business/", "") });
      else if (url.startsWith("/events/")) navigate("event-detail", { slug: url.replace("/events/", "") });
    };
    const isBanner = BANNER_FORMATS.has(placement.sizeFormat);
    return (
      <div ref={el} className={`ad-slot ad-${placement.sizeFormat} ${className || ""}`} style={style}>
        {isBanner ? (
          <div className="ad-banner card card-hover" role="link" tabIndex={0}
            onClick={go} onKeyDown={(e) => { if (e.key === "Enter") go(); }}>
            <span className="sponsored-badge"><Icon name="star" size={12} /> Sponsored</span>
            <ImagePh label={ad.title} tone="gold" src={ad.imageUrl || undefined} style={{ width: "100%", height: "100%" }} />
          </div>
        ) : (
          <div className="sponsored-slot card card-hover" role="link" tabIndex={0}
            onClick={go} onKeyDown={(e) => { if (e.key === "Enter") go(); }}>
            <span className="sponsored-badge"><Icon name="star" size={12} /> Sponsored</span>
            <div className="sponsored-media">
              <ImagePh label="sponsored" tone="gold" src={ad.imageUrl || undefined} style={{ width: "100%", height: "100%" }} />
            </div>
            <div className="sponsored-body">
              <strong>{ad.title}</strong>
              {ad.body && <p className="muted" style={{ fontSize: ".88rem", marginTop: 4 }}>{ad.body}</p>}
            </div>
            <Icon name="arrow" size={16} />
          </div>
        )}
      </div>
    );
  }

  // ── AdSense fill ────────────────────────────────────────────────────────────
  return (
    <div className={`ad-slot ad-adsense ad-${placement.sizeFormat} ${className || ""}`} style={style}>
      <span className="ad-label">Advertisement</span>
      <AdsenseUnit
        slot={placement.adsenseSlot!}
        format={placement.sizeFormat}
        onFilled={() => track.adImpression({ placement: slot, source: "adsense" })}
      />
    </div>
  );
}
