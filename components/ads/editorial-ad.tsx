"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AD_SUPPORTED_TOOLS, EDITORIAL_AD_UNITS } from "@/lib/editorial-ads";
import { AdsenseUnit, adsenseEnabled, useAdvertisingConsent } from "./adsense";

function Placement({ kind, placement }: { kind: "article" | "display"; placement: string }) {
  const consent = useAdvertisingConsent();
  const [unfilled, setUnfilled] = useState(false);
  if (!adsenseEnabled) return null;
  return <aside className={`editorial-ad editorial-ad-${kind}`} aria-label="Advertisements" data-ad-placement={placement}>
    <span className="ad-label">{consent && !unfilled ? "Advertisements" : "More from Humble Halal"}</span>
    <div className="editorial-ad-space">
      {consent && !unfilled ? <AdsenseUnit slot={EDITORIAL_AD_UNITS[kind]}
        format={kind === "article" ? "in_article" : "rectangle"} onUnfilled={() => setUnfilled(true)} /> :
        <div className="editorial-ad-fallback"><p>Good guidance for everyday Muslim life.</p>
          <Link href="/blog">Explore our latest guides →</Link>
        </div>}
    </div>
  </aside>;
}

export function EditorialAd({ kind = "display", placement }: { kind?: "article" | "display"; placement: string }) {
  const pathname = usePathname();
  // A new page gets a new ins element. Never reuse a previously filled ad DOM.
  return <Placement key={`${pathname}:${placement}`} kind={kind} placement={placement} />;
}

export function ToolAd() {
  const pathname = usePathname();
  if (!AD_SUPPORTED_TOOLS.has(pathname)) return null;
  return <div className="hh-wrap"><EditorialAd placement="tool-after-content" /></div>;
}
