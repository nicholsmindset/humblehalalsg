import type { FlagKey } from "@/lib/flags";

/* Human-readable copy per feature flag — shared by the global Monetization
   toggles (admin.tsx) and the per-business Features panel (admin-businesses.tsx).
   Client-safe (no server imports). */
export const FLAG_COPY: Record<FlagKey, { title: string; desc: string }> = {
  paidTickets: { title: "Paid event tickets", desc: "Let businesses sell paid tickets (Stripe Connect). When OFF, every event is free RSVP only and the paid checkout API is blocked server-side." },
  paidAds: { title: "Paid advertising", desc: "Enable purchasable ad placements on the Advertise page. When OFF, ad CTAs invite enquiries instead of charging." },
  paidPlans: { title: "Paid listing plans", desc: "Enable Verified / Featured / Premium subscriptions on the Pricing page and billing." },
  paidHotels: { title: "Paid hotel bookings", desc: "Enable live hotel payments via LiteAPI. When OFF, hotel search stays browse-only (no checkout)." },
  paidFlights: { title: "Paid flight bookings", desc: "Enable live flight payments via LiteAPI. Requires Vercel Pro for the 10-minute retry cron before going live." },
  payNow: { title: "PayNow", desc: "Accept PayNow as a checkout method alongside cards, where supported." },
  paidLeads: { title: "Paid lead marketplace", desc: "Businesses pay to receive routed customer leads instead of receiving them for free." },
  certVault: { title: "Cert Vault", desc: "Certificate upload & verification vault for businesses claiming halal certification." },
  semanticSearch: { title: "Semantic search", desc: "AI-powered semantic search across listings and travel results." },
  aiConcierge: { title: "AI concierge", desc: "The AI concierge / Ask-Hotel assistant surfaced to visitors." },
  halalVerdicts: { title: "Halal verdicts", desc: "Admin halal-verdict workflow surfaced on listing pages." },
  leadRouting: { title: "Lead routing", desc: "Automatically route customer enquiries to matching businesses." },
  leadCapture: { title: "Lead capture surfaces", desc: "Show the subtle 'get free quotes' capture blocks on vertical blog posts, guide pages, listings and the vertical popup. Per-surface toggles live in the Leads tab. When OFF, no capture surface renders anywhere." },
  leadAutoRoute: { title: "Lead auto-routing", desc: "Route each new consented lead automatically to ONE matching vendor (round-robin, cascades after ~24h). When OFF, leads wait for manual routing in the Leads tab. Only effective while Lead routing is also on." },
  passport: { title: "Halal Passport", desc: "The gamified Halal Passport check-in feature." },
  listingEnrichment: { title: "Listing enrichment", desc: "AI drafts an improved description + SEO for submitted listings; admins review before it writes to the live listing. Adds a Listing-enrichment tab to admin." },
  hawkerFinder: { title: "Hawker Finder", desc: "The halal hawker-stall finder (/hawker) — a map + centre pages grouping halal stalls by hawker centre. Surfaces the Hawker nav link." },
  tiktokUgc: { title: "TikTok features", desc: "Community TikTok videos: creators/users submit a TikTok about a listing (/feature-tiktok), an AI classifies + place-matches it as a draft, admins approve, and approved videos show on the listing as consent-gated embeds. Adds a TikTok-queue tab to admin. NOTE: the /feature-tiktok route gate lives in the routing layer, which can't read this DB toggle — set the TIKTOK_UGC_ENABLED env var to fully enable it, not this switch alone." },
};
