import type { FlagKey } from "./flags";

/* Single source of truth for user-facing feature help. Powers BOTH the nested
   /faq page and the dismissible dashboard callouts, so they never drift.
   Client-safe (no server imports). HALAL: entries marked halalSensitive must
   never assert certification beyond the MUIS/admin-verified distinction. */

export type FaqCategory =
  | "Getting started" | "Features" | "For businesses" | "Travel" | "Trust & verification";

export interface HelpFeature {
  key: string;
  label: string;
  flag?: FlagKey;                       // omit = always on
  audience: ("user" | "business" | "public")[];
  what: string;                         // one-line "what it does"
  how: string[];                        // ordered "how it works" steps
  faqs: { q: string; a: string }[];
  faqCategory: FaqCategory;
  dashboard?: { surface: "owner" | "user"; tab: string };
  halalSensitive?: boolean;
}

export const HELP: HelpFeature[] = [
  {
    key: "ask-ai", label: "Ask AI", flag: "aiConcierge", audience: ["public"],
    what: "A halal-aware assistant that answers questions and finds places, prayer spaces and Muslim-friendly travel for you.",
    how: [
      "Open Ask AI from the top nav (or /ask).",
      "Type a question in plain English — e.g. “halal buffet near Bugis with a prayer room”.",
      "It answers using our verified listings and links you straight to them.",
    ],
    faqs: [
      { q: "What can Ask AI do?", a: "It answers halal-lifestyle questions and recommends places from our directory — by cuisine, area, prayer space, family-friendliness and more — and can help plan Muslim-friendly travel." },
      { q: "Is Ask AI a substitute for checking halal status?", a: "No. It surfaces our recorded halal status and links to the listing, but you should always confirm certification on the official MUIS HalalSG register." },
    ],
    faqCategory: "Features",
  },
  {
    key: "tiktok", label: "TikTok features", flag: "tiktokUgc", audience: ["public", "business", "user"],
    what: "Community TikToks about halal spots, shown on the matching listing with credit to the creator.",
    how: [
      "Anyone pastes a TikTok link at /feature-tiktok and says which place it's about.",
      "Our team reviews it (an AI helps classify and match it to a listing).",
      "Once approved, the video appears on that business's page. Creators can ask us to remove it anytime.",
    ],
    faqs: [
      { q: "How do I get my TikTok featured?", a: "Submit the link at /feature-tiktok with the business name. We review every submission before it appears — nothing is auto-published." },
      { q: "Does featuring a video mean the place is halal-certified?", a: "No. A featured video is community content, not a certification. Always check the listing's halal status and trust signals." },
      { q: "Can I remove my video?", a: "Yes — go to /remove-video and paste the link. We take it down right away." },
    ],
    faqCategory: "Features",
  },
  {
    key: "passport", label: "Halal Passport", flag: "passport", audience: ["user"],
    what: "A loyalty passport — earn points for reviews, visits and referrals, unlock badges, and climb tiers.",
    how: [
      "Open the Passport tab in your dashboard (it opens there by default when signed in).",
      "Earn points by writing reviews, confirming places, and inviting friends.",
      "Points unlock badges and move you up tiers — track progress on your passport.",
    ],
    faqs: [
      { q: "How do I earn points?", a: "You earn points for writing reviews, confirming a place is still halal/open, checking in, and referring friends who join and take their first action." },
      { q: "What are tiers and badges?", a: "Tiers reflect your total points (Explorer → Regular → and up). Badges are one-off achievements like your first review or visiting 5 places." },
    ],
    faqCategory: "Features",
    dashboard: { surface: "user", tab: "passport" },
  },
  {
    key: "halal-verdicts", label: "Halal verdicts", flag: "halalVerdicts", audience: ["public"], halalSensitive: true,
    what: "Researched “is it halal?” answers for brands and products, reviewed by our team before publishing.",
    how: [
      "Browse verdicts from the Is-it-halal section.",
      "Each verdict shows the reasoning and any cited source.",
      "Verdicts are drafted with AI assistance but published only after human review — never auto-approved.",
    ],
    faqs: [
      { q: "How are verdicts decided?", a: "Our team reviews each verdict before it's published. An AI drafts a starting point, but a person checks the reasoning and a cited source is required for a ‘halal’ call." },
      { q: "Is a verdict the same as MUIS certification?", a: "No. Verdicts are our informational research, not official certification. For certification, always check the MUIS HalalSG register." },
    ],
    faqCategory: "Trust & verification",
  },
  {
    key: "hawker", label: "Hawker Finder", flag: "hawkerFinder", audience: ["public"],
    what: "Find halal stalls grouped by hawker centre on a map, with trust signals and a Halal Confidence Score.",
    how: [
      "Open Hawker from the top nav (or /hawker).",
      "Browse centres on the map or by region, then tap one to see its halal stalls.",
      "Each stall links to its full listing — confirm halal status on site.",
    ],
    faqs: [
      { q: "Are hawker stalls halal-certified?", a: "Some are MUIS-certified; many are Muslim-owned or self-declared and clearly labelled as such. Always confirm on site — the Halal Confidence Score reflects the strength of the signals, not a certification." },
    ],
    faqCategory: "Features",
  },
  {
    key: "semantic-search", label: "Semantic search", flag: "semanticSearch", audience: ["public"],
    what: "Smarter search that understands what you mean, not just keywords.",
    how: [
      "Search from Explore or the map as usual.",
      "Describe what you want naturally — e.g. “cosy halal date-night spot”.",
      "Results are ranked by meaning and your filters (area, prayer space, open now).",
    ],
    faqs: [
      { q: "How is this different from normal search?", a: "It matches the intent of your query, so you can search in natural language and still get relevant halal places even without exact keyword matches." },
    ],
    faqCategory: "Getting started",
  },
  {
    key: "cert-vault", label: "Halal certificate", flag: "certVault", audience: ["business"], halalSensitive: true,
    what: "Upload your MUIS halal certificate so we can verify it and show a trusted badge on your listing.",
    how: [
      "Open the Halal certificate tab in your business dashboard.",
      "Upload a clear photo or PDF of your valid MUIS certificate.",
      "Our team reviews it; once verified, your listing shows the verified badge. We never mark a listing certified without a valid document.",
    ],
    faqs: [
      { q: "Does uploading a certificate make my listing ‘certified’ automatically?", a: "No. Certification status comes only from a valid MUIS certificate that our team verifies. Uploading starts that review; it isn't automatic." },
    ],
    faqCategory: "For businesses",
    dashboard: { surface: "owner", tab: "cert" },
  },
  {
    key: "events", label: "Events & tickets", flag: "paidTickets", audience: ["business"],
    what: "List community events and (optionally) sell tickets to them.",
    how: [
      "Open the My events tab and create an event.",
      "Keep it free RSVP, or enable paid tickets once your payout details are set.",
      "Manage attendees and check-ins from the same tab.",
    ],
    faqs: [
      { q: "Do I have to charge for tickets?", a: "No. Every event can be free RSVP. Paid tickets are optional and only work once payments are enabled and your payout onboarding is complete." },
    ],
    faqCategory: "For businesses",
    dashboard: { surface: "owner", tab: "events" },
  },
  {
    key: "sponsored-ads", label: "Sponsored ads", flag: "paidAds", audience: ["business"],
    what: "Promote your listing to the top of search and its category.",
    how: [
      "Open the Sponsored ads tab.",
      "Choose a placement and dates.",
      "When paid ads are live you pay per placement; otherwise it sends us an enquiry.",
    ],
    faqs: [
      { q: "Where do sponsored listings appear?", a: "At the top of relevant search results and category pages, clearly marked as sponsored." },
    ],
    faqCategory: "For businesses",
    dashboard: { surface: "owner", tab: "ads" },
  },
  {
    key: "leads", label: "Leads", flag: "leadRouting", audience: ["business"],
    what: "Customer enquiries that match your business, routed to you.",
    how: [
      "Open the Leads tab.",
      "Review incoming enquiries matched to your category and area.",
      "Respond to win the customer. Free while lead billing is off.",
    ],
    faqs: [
      { q: "How are leads matched to me?", a: "When a customer requests a quote or enquiry in your category and area, we route it to matching businesses so you can respond." },
    ],
    faqCategory: "For businesses",
    dashboard: { surface: "owner", tab: "leads" },
  },
  {
    key: "listing-enrichment", label: "Listing enrichment", flag: "listingEnrichment", audience: ["business"],
    what: "AI drafts a cleaner description and SEO for a listing; our team approves before it goes live.",
    how: [
      "Submit or claim your listing with the basics.",
      "Our team can run an AI draft that improves the wording and SEO from your facts only.",
      "A human approves it before anything changes on your live listing.",
    ],
    faqs: [
      { q: "Will AI invent details about my business?", a: "No. It only rewords the facts you provide and never claims halal certification. A person reviews every draft before it's published." },
    ],
    faqCategory: "For businesses",
  },
  // ── Always-on dashboard tabs (no flag) — callout only, minimal FAQ ──
  {
    key: "payouts", label: "Payouts", audience: ["business"],
    what: "Where your ticket/ad earnings are paid out. Connect your payout account to receive money.",
    how: ["Open the Payouts tab.", "Complete payout onboarding (bank details).", "Earnings are transferred to you on the platform's payout schedule."],
    faqs: [], faqCategory: "For businesses", dashboard: { surface: "owner", tab: "payouts" },
  },
  {
    key: "reviews-owner", label: "Reviews", audience: ["business"],
    what: "Reviews customers left on your listings — read them and reply.",
    how: ["Open the Reviews tab.", "Read customer reviews of your listings.", "Reply publicly to build trust."],
    faqs: [], faqCategory: "For businesses", dashboard: { surface: "owner", tab: "reviews" },
  },
  {
    key: "billing", label: "Billing", audience: ["business"],
    what: "Manage your subscription plan, card and invoices.",
    how: ["Open the Billing tab.", "Open the secure Stripe portal to change plan or card.", "Download invoices anytime."],
    faqs: [], faqCategory: "For businesses", dashboard: { surface: "owner", tab: "billing" },
  },
  {
    key: "collections", label: "Collections", audience: ["user"],
    what: "Group saved places into your own lists (e.g. “Date night”, “Halal cafes”).",
    how: ["Open the Collections tab.", "Create a collection.", "Add saved places to it and share the list."],
    faqs: [], faqCategory: "Getting started", dashboard: { surface: "user", tab: "collections" },
  },
  {
    key: "requests", label: "My requests", audience: ["user"],
    what: "Quote and enquiry requests you've sent to businesses, and their status.",
    how: ["Open the My requests tab.", "Track requests you've sent.", "See responses from matching businesses."],
    faqs: [], faqCategory: "Getting started", dashboard: { surface: "user", tab: "requests" },
  },
  {
    key: "reviews-user", label: "My reviews", audience: ["user"],
    what: "Reviews you've written — edit them or add photos.",
    how: ["Open the My reviews tab.", "See every review you've posted.", "Edit or add photos to keep them helpful."],
    faqs: [], faqCategory: "Getting started", dashboard: { surface: "user", tab: "reviews" },
  },
];

export function helpByKey(key: string): HelpFeature | undefined {
  return HELP.find((h) => h.key === key);
}

export function helpForTab(surface: "owner" | "user", tab: string): HelpFeature | undefined {
  return HELP.find((h) => h.dashboard?.surface === surface && h.dashboard.tab === tab);
}
