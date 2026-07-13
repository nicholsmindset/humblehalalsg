"use client";

// Tiny client island: one `tool_use` analytics event when a tool page mounts.
// Mounted by ToolShell (a server component), so every /tools/* page is
// instrumented from a single insertion point. Renders nothing.

import { useEffect } from "react";
import { track } from "@/lib/analytics";

export function ToolView({ slug }: { slug: string }) {
  useEffect(() => {
    if (slug) track.toolUse(slug);
  }, [slug]);
  return null;
}
