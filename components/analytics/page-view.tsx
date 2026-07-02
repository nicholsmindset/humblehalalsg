"use client";
// Fires a first-party page_view whenever the route changes. Mounted once in the
// root layout. No-op in mock mode (track.* checks for a configured client).
// Also records first-touch marketing attribution (hh_attr cookie) on landing so
// ticket orders can credit their channel — see lib/attribution.ts.

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";
import { captureAttribution } from "@/lib/attribution";

export function AnalyticsPageView() {
  const pathname = usePathname();
  useEffect(() => {
    captureAttribution();
  }, []);
  useEffect(() => {
    if (pathname) track.pageView(pathname);
  }, [pathname]);
  return null;
}
