/* Humble Halal — business plan catalog + feature gating (single source of truth).

   Reuses the EXISTING `businesses.plan` values (free | verified | featured | premium)
   — there is no separate "tier" concept. This module centralizes what was hardcoded
   in components/screens/business.tsx (PricingScreen) so the pricing UI and the
   `canUse()` gate never drift. Pure + isomorphic (safe on client and server). */

export type PlanKey = "free" | "verified" | "featured" | "premium";
export const PLAN_KEYS: PlanKey[] = ["free", "verified", "featured", "premium"];

/** Entitlements gated by plan. Cumulative — a higher plan includes everything below it. */
export type Feature =
  | "verified_badge"
  | "contact_buttons" // WhatsApp & directions
  | "reply_reviews"
  | "cert_upload" // Halal Certificate Vault — Verified+ (a trust play, not a premium upsell)
  | "featured_placement"
  | "homepage_rotation"
  | "priority_rank"
  | "offers_block"
  | "multi_location"
  | "analytics"
  | "ad_credits";

export interface Plan {
  key: PlanKey;
  name: string;
  monthly: number; // SGD / month
  yearly: number; // SGD / year (billed annually)
  tag: string;
  cta: string;
  popular?: boolean;
  accent?: boolean;
  galleryMax: number; // max photos in the gallery
  features: Feature[]; // entitlements at this tier (cumulative)
  bullets: string[]; // marketing copy for PricingScreen
}

// Cumulative feature sets, built bottom-up so each tier inherits the one below.
const FREE_FEATURES: Feature[] = [];
const VERIFIED_FEATURES: Feature[] = [
  ...FREE_FEATURES,
  "verified_badge",
  "contact_buttons",
  "reply_reviews",
  "cert_upload",
];
const FEATURED_FEATURES: Feature[] = [
  ...VERIFIED_FEATURES,
  "featured_placement",
  "homepage_rotation",
  "priority_rank",
];
const PREMIUM_FEATURES: Feature[] = [
  ...FEATURED_FEATURES,
  "offers_block",
  "multi_location",
  "analytics",
  "ad_credits",
];

export const PLANS: Record<PlanKey, Plan> = {
  free: {
    key: "free",
    name: "Free",
    monthly: 0,
    yearly: 0,
    tag: "Get listed",
    cta: "Start free",
    galleryMax: 3,
    features: FREE_FEATURES,
    bullets: ["Basic profile", "1 category", "Up to 3 photos", "Map pin", "Customer reviews"],
  },
  verified: {
    key: "verified",
    name: "Verified",
    monthly: 19,
    yearly: 190,
    tag: "Build trust",
    cta: "Choose Verified",
    accent: true,
    popular: true,
    galleryMax: 15,
    features: VERIFIED_FEATURES,
    bullets: [
      "Everything in Free",
      "Admin Verified badge",
      "Halal status review",
      "Halal certificate vault",
      "Up to 15 photos",
      "Reply to reviews",
      "WhatsApp & directions buttons",
    ],
  },
  featured: {
    key: "featured",
    name: "Featured",
    monthly: 49,
    yearly: 490,
    tag: "Get seen",
    cta: "Choose Featured",
    galleryMax: 20,
    features: FEATURED_FEATURES,
    bullets: [
      "Everything in Verified",
      "Featured placement",
      "Top of category & area",
      "Homepage rotation",
      "Priority support",
    ],
  },
  premium: {
    key: "premium",
    name: "Premium",
    monthly: 99,
    yearly: 990,
    tag: "Grow faster",
    cta: "Contact sales",
    galleryMax: 30,
    features: PREMIUM_FEATURES,
    bullets: [
      "Everything in Featured",
      "Offers & promotions block",
      "Multiple locations",
      "Advanced analytics",
      "Promo & ad credits",
    ],
  },
};

export const PLAN_LIST: Plan[] = PLAN_KEYS.map((k) => PLANS[k]);

/** Normalize any plan-ish input to a known PlanKey (defaults to "free"). */
export function planKey(input: PlanKey | { plan?: string | null } | string | null | undefined): PlanKey {
  const raw = typeof input === "string" ? input : input && typeof input === "object" ? input.plan : input;
  return PLAN_KEYS.includes(raw as PlanKey) ? (raw as PlanKey) : "free";
}

/** Whether a business (or plan key) is entitled to a feature. */
export function canUse(
  input: PlanKey | { plan?: string | null } | string | null | undefined,
  feature: Feature,
): boolean {
  return PLANS[planKey(input)].features.includes(feature);
}

/** Max gallery photos for a business/plan. */
export function galleryMax(input: PlanKey | { plan?: string | null } | string | null | undefined): number {
  return PLANS[planKey(input)].galleryMax;
}
