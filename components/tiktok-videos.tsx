"use client";

/* Community TikTok videos on a listing. Fetches admin-APPROVED videos for the
   business and renders them as CONSENT-GATED embeds: nothing loads from TikTok
   until the visitor either has granted marketing consent (hh_consent_v1) or
   clicks "Play" on a specific video — so no third-party frame/cookie loads by
   default. Renders nothing when the feature is off or there are no videos. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./ui";

type Video = { id: string; url: string; videoId: string; handle: string; caption: string };

function marketingConsent(): boolean {
  if (typeof window === "undefined") return false;
  try { return JSON.parse(localStorage.getItem("hh_consent_v1") || "{}")?.marketing === true; } catch { return false; }
}

function VideoCard({ v, consented }: { v: Video; consented: boolean }) {
  const [play, setPlay] = useState(consented);
  const canEmbed = !!v.videoId;

  return (
    <figure className="tiktok-card">
      {play && canEmbed ? (
        <div className="tiktok-frame">
          <iframe
            src={`https://www.tiktok.com/embed/v2/${v.videoId}`}
            title={v.caption || `TikTok by @${v.handle}`}
            allow="encrypted-media; fullscreen"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <button type="button" className="tiktok-facade" onClick={() => canEmbed && setPlay(true)} aria-label={canEmbed ? "Load this TikTok video" : "Open on TikTok"}>
          <span className="tiktok-facade-play"><Icon name="play" size={26} /></span>
          <span className="tiktok-facade-txt">{canEmbed ? "Play video" : "Watch on TikTok"}</span>
          <span className="tiktok-facade-note">Loads from tiktok.com</span>
        </button>
      )}
      <figcaption className="tiktok-cap">
        {v.caption && <span className="tiktok-cap-txt">{v.caption}</span>}
        <a className="tiktok-cap-handle" href={v.url} target="_blank" rel="noopener noreferrer nofollow">{v.handle ? `@${v.handle}` : "View on TikTok"} <Icon name="external" size={12} /></a>
      </figcaption>
    </figure>
  );
}

export function TikTokVideos({ slug, name }: { slug: string; name?: string }) {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(marketingConsent());
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/tiktok/videos?business=${encodeURIComponent(slug)}`);
        const d = await res.json();
        if (alive) setVideos(Array.isArray(d.videos) ? d.videos : []);
      } catch { if (alive) setVideos([]); }
    })();
    return () => { alive = false; };
  }, [slug]);

  if (!videos || videos.length === 0) return null;

  return (
    <section className="tiktok-section" aria-label="Community TikTok videos">
      <div className="flex between center wrap g8" style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: "1.15rem", display: "flex", alignItems: "center", gap: 6 }}><Icon name="play" size={17} /> On TikTok{name ? ` — ${name}` : ""}</h3>
        <Link className="link-inline" href={`/feature-tiktok?business=${encodeURIComponent(slug)}`} style={{ fontSize: ".85rem", fontWeight: 700 }}>Feature your video →</Link>
      </div>
      <p className="faint" style={{ fontSize: ".82rem", marginTop: -6, marginBottom: 12 }}>Community videos submitted by creators and reviewed by our team. Featuring a video doesn&apos;t certify a business as halal — always check the listing&apos;s trust signals.</p>
      <div className="tiktok-grid">
        {videos.map((v) => <VideoCard key={v.id} v={v} consented={consented} />)}
      </div>
      {/* Creator opt-out — always visible wherever embeds appear (mock-up spec). */}
      <p className="faint" style={{ fontSize: ".8rem", marginTop: 10 }}>
        Your video? <Link className="link-inline" href="/remove-video">Request removal</Link> — processed within 48 hours.
      </p>
    </section>
  );
}
