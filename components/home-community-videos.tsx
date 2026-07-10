"use client";

/* Homepage "Fresh from the community" row — the latest admin-approved TikToks
   across ALL businesses (from /api/tiktok/latest). Consent-gated exactly like
   the listing-page strip: no TikTok iframe loads until the visitor granted
   marketing consent (hh_consent_v1) or clicks Play. Renders NOTHING when the
   feature is off, Supabase is absent, or no videos are approved yet — so it's
   safe to ship before any community content exists. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./ui";

type Video = {
  id: string; url: string; videoId: string; handle: string;
  caption: string; business: string; slug: string;
};

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
        {v.business && <Link className="tiktok-cap-txt" href={`/business/${v.slug}`} style={{ fontWeight: 700 }}>{v.business}</Link>}
        <a className="tiktok-cap-handle" href={v.url} target="_blank" rel="noopener noreferrer nofollow">{v.handle ? `@${v.handle}` : "View on TikTok"} <Icon name="external" size={12} /></a>
      </figcaption>
    </figure>
  );
}

export function HomeCommunityVideos() {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    setConsented(marketingConsent());
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/tiktok/latest");
        const d = await res.json();
        if (alive) setVideos(Array.isArray(d.videos) ? d.videos : []);
      } catch { if (alive) setVideos([]); }
    })();
    return () => { alive = false; };
  }, []);

  // Hide entirely until we have approved videos (flag off / none → null).
  if (!videos || videos.length === 0) return null;

  return (
    <section className="hh-wrap home-sec" aria-label="Community videos">
      <div className="flex between center wrap g8" style={{ marginBottom: 6 }}>
        <div>
          <h2 style={{ fontSize: "1.5rem" }}>Fresh from the community</h2>
          <p className="muted" style={{ marginTop: 4, fontSize: ".9rem" }}>Real reviews from Singapore&apos;s halal creators · not a halal certification</p>
        </div>
        <Link className="link" href="/feature-tiktok">Share your find <Icon name="chevron" size={14} /></Link>
      </div>
      <div className="tiktok-grid">
        {videos.map((v) => <VideoCard key={v.id} v={v} consented={consented} />)}
        {/* Submission CTA tile — fills the row while community content is young
            and keeps the funnel visible as it grows. */}
        <Link className="tiktok-card tiktok-cta" href="/feature-tiktok" aria-label="Share your TikTok about a halal spot and get featured">
          <span className="tiktok-cta-ico"><Icon name="camera" size={26} /></span>
          <strong>Your find here?</strong>
          <span className="tiktok-cta-sub">Made a TikTok about a halal spot? Share the link — we feature it with credit to you.</span>
          <span className="btn btn-primary btn-sm">Share your find</span>
        </Link>
      </div>
    </section>
  );
}
