"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui";

function hasMarketingConsent() {
  if (typeof window === "undefined") return false;
  try {
    return JSON.parse(localStorage.getItem("hh_consent_v1") || "{}")?.marketing === true;
  } catch {
    return false;
  }
}

export function BlogSocialEmbed({ url, label }: { url: string; label: string }) {
  const videoId = useMemo(() => url.match(/\/video\/(\d+)/)?.[1] || "", [url]);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setPlay(hasMarketingConsent()), 0);
    return () => window.clearTimeout(id);
  }, []);

  if (!videoId) {
    return <a className="article-social-link" href={url} target="_blank" rel="noopener noreferrer nofollow">View on TikTok <Icon name="external" size={13} /></a>;
  }

  return (
    <figure className="article-social-embed">
      {play ? (
        <iframe
          src={`https://www.tiktok.com/embed/v2/${videoId}`}
          title={label}
          allow="encrypted-media; fullscreen"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} aria-label={`Play ${label} on TikTok`}>
          <span><Icon name="play" size={25} /></span>
          <strong>Watch this spot on TikTok</strong>
          <small>Loads from tiktok.com</small>
        </button>
      )}
      <figcaption>{label} · <a href={url} target="_blank" rel="noopener noreferrer nofollow">Open on TikTok</a></figcaption>
    </figure>
  );
}
