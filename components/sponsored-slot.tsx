"use client";

/* Back-compat shim. The sponsored placement is now served by <AdSlot>, which adds
   AdSense fill + IAB sizing + CLS-safe reserved height on top of the original
   direct-sponsor behaviour. Existing call sites keep using <SponsoredSlot
   placement="…" />; new code can use <AdSlot slot="…" /> directly. */

import { AdSlot } from "./ads/ad-slot";

export function SponsoredSlot({ placement }: { placement: string }) {
  return <AdSlot slot={placement} />;
}
