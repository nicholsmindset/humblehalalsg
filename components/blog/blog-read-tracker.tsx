"use client";

// Blog engagement island (the blog pages are fully server-rendered, so this is
// the single client hook): scroll-depth milestones (25/50/75/100%) as
// `blog_read` dataLayer events, plus delegated click tracking for the zero-JS
// ShareRow anchors (keeps ShareRow a server component). Renders nothing.

import { useEffect } from "react";
import { track } from "@/lib/analytics";

const MILESTONES = [25, 50, 75, 100] as const;

export function BlogReadTracker({ slug }: { slug: string }) {
  useEffect(() => {
    if (!slug) return;
    const fired = new Set<number>();

    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const pct = total <= 0 ? 100 : Math.min(100, Math.round((window.scrollY / total) * 100));
      for (const m of MILESTONES) {
        if (pct >= m && !fired.has(m)) {
          fired.add(m);
          track.blogRead(slug, m);
        }
      }
      if (fired.size === MILESTONES.length) window.removeEventListener("scroll", onScroll);
    };

    // Delegated share tracking for the server-rendered ShareRow anchors.
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.(".share-row a");
      if (a) track.leadAction("share", `blog:${slug}`);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    onScroll(); // short posts may already satisfy milestones on load
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, [slug]);

  return null;
}
