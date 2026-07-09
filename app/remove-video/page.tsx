import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { RemoveVideoForm } from "@/components/remove-video-form";

/* Not flag-gated: a creator must always be able to opt out, even if the feature
   is toggled off (the removal endpoint is a no-op when nothing matches). */
export const metadata: Metadata = pageMeta({
  title: "Remove your TikTok — Humble Halal",
  description: "Featured on Humble Halal and want your TikTok taken down? Paste the link and we'll remove it right away.",
  path: "/remove-video",
  index: false,
});

export default function Page() {
  return (
    <div className="screen-in hh-page">
      <div className="form-page">
        <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
          <Link className="link-inline" href="/">Home</Link><span>›</span><span style={{ color: "var(--ink)" }}>Remove your TikTok</span>
        </nav>
        <div className="form-head">
          <span className="eyebrow">Creator control</span>
          <h1 style={{ fontSize: "1.9rem", marginTop: 8 }}>Remove your TikTok</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            If we&apos;ve featured your TikTok on a listing and you&apos;d like it taken down, just paste the link. We remove it right away — no questions asked.
          </p>
        </div>
        <RemoveVideoForm />
      </div>
    </div>
  );
}
