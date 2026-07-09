import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerFlags } from "@/lib/feature-flags";
import { pageMeta } from "@/lib/seo";
import { FeatureTikTokForm } from "@/components/feature-tiktok-form";

// Flag-gated: evaluate tiktokUgc on every request so a toggle reflects at once.
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMeta({
  title: "Feature your TikTok — Humble Halal",
  description: "Made a TikTok about a halal spot in Singapore? Submit it and we'll feature it on the listing, with credit to you.",
  path: "/feature-tiktok",
});

export default async function Page() {
  if (!(await getServerFlags()).tiktokUgc) notFound();
  return (
    <div className="screen-in hh-page">
      <div className="form-page">
        <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
          <Link className="link-inline" href="/">Home</Link><span>›</span><span style={{ color: "var(--ink)" }}>Feature your TikTok</span>
        </nav>
        <div className="form-head">
          <span className="eyebrow">Community</span>
          <h1 style={{ fontSize: "1.9rem", marginTop: 8 }}>Feature your TikTok</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Made a video about a halal restaurant, café or hawker stall in Singapore? Share the link — our team reviews it, matches it to the listing, and features it with credit to you. It doesn&apos;t certify a business as halal; it&apos;s community discovery.
          </p>
        </div>
        <Suspense fallback={<div className="card form-card" style={{ height: 320, opacity: 0.5 }} aria-busy="true" />}>
          <FeatureTikTokForm />
        </Suspense>
      </div>
    </div>
  );
}
