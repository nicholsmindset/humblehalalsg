"use client";
// Fires a first-party page_view whenever the route changes. Mounted once in the
// root layout. No-op in mock mode (track.* checks for a configured client).

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics";

export function AnalyticsPageView() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) track.pageView(pathname);
  }, [pathname]);
  return null;
}
