"use client";

/* A sponsored placement. Fetches the active creative for a placement key, renders
   it labelled "Sponsored" (transparency), fires an impression when it scrolls into
   view, and a click event before following the link. Renders nothing when no
   campaign is active — zero footprint until the sales team books one. */
import { useEffect, useRef, useState } from "react";
import { useApp } from "./app-context";
import { Icon, ImagePh } from "./ui";

type Ad = { id: string; title: string; body?: string | null; imageUrl?: string | null; targetUrl?: string | null };

function sessionId(): string {
  try {
    let s = sessionStorage.getItem("hh_sid");
    if (!s) { s = Math.random().toString(36).slice(2, 12); sessionStorage.setItem("hh_sid", s); }
    return s;
  } catch { return ""; }
}

export function SponsoredSlot({ placement }: { placement: string }) {
  const { navigate } = useApp();
  const [ad, setAd] = useState<Ad | null>(null);
  const el = useRef<HTMLDivElement>(null);
  const seen = useRef(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/ads/active?placement=${encodeURIComponent(placement)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && j?.ads?.[0]) setAd(j.ads[0] as Ad); })
      .catch(() => {});
    return () => { alive = false; };
  }, [placement]);

  const track = (kind: "impression" | "click") => {
    if (!ad) return;
    try {
      fetch("/api/ads/track", {
        method: "POST", keepalive: true, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: ad.id, placementKey: placement, kind, session: sessionId() }),
      }).catch(() => {});
    } catch { /* ignore */ }
  };

  // A new creative (campaign rotation) is a fresh impression opportunity.
  useEffect(() => { seen.current = false; }, [ad]);

  useEffect(() => {
    if (!ad || !el.current || seen.current) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !seen.current) { seen.current = true; track("impression"); io.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(el.current);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ad]);

  if (!ad) return null;

  const go = () => {
    track("click");
    const url = ad.targetUrl || "";
    if (/^https?:\/\//.test(url)) window.open(url, "_blank", "noopener,noreferrer");
    else if (url.startsWith("/business/")) navigate("detail", { slug: url.replace("/business/", "") });
    else if (url.startsWith("/events/")) navigate("event-detail", { slug: url.replace("/events/", "") });
  };

  return (
    <div ref={el} className="sponsored-slot card card-hover" role="link" tabIndex={0}
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
  );
}
