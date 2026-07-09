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
  passport: { title: "Halal Passport", desc: "The gamified Halal Passport check-in feature." },
  listingEnrichment: { title: "Listing enrichment", desc: "AI drafts an improved description + SEO for submitted listings; admins review before it writes to the live listing. Adds a Listing-enrichment tab to admin." },
  hawkerFinder: { title: "Hawker Finder", desc: "The halal hawker-stall finder (/hawker) — a map + centre pages grouping halal stalls by hawker centre. Surfaces the Hawker nav link." },
};
