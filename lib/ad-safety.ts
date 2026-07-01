/* Brand-safety policy for a halal-trust audience. Single source of truth for the
   advertiser categories we never want shown — applied two ways:
     1. AdSense: mirror this list into the AdSense dashboard's "Blocking controls →
        Sensitive categories / General categories" (documented in the runbook). The
        AdSense API does not accept a client-side category blocklist, so the dashboard
        config is authoritative; this list is the checklist + what the admin UI shows.
     2. Direct sponsors: shown to the reviewer in the admin as the rejection rubric,
        enforced by the human review gate (ad_campaigns.review_status).
   Owner-approved strict policy (2026-07). */

export type BlockedCategory = {
  key: string;
  label: string;
  why: string;
};

export const BLOCKED_AD_CATEGORIES: BlockedCategory[] = [
  { key: "alcohol",       label: "Alcohol",                       why: "Haram — intoxicants." },
  { key: "gambling",      label: "Gambling & betting",            why: "Haram — maisir." },
  { key: "dating",        label: "Dating & relationships",        why: "Off-brand for a family/faith audience." },
  { key: "adult",         label: "Adult & mature content",        why: "Haram / not brand-safe." },
  { key: "non_halal_food",label: "Non-halal food (pork etc.)",    why: "Contradicts the directory's halal promise." },
  { key: "riba_finance",  label: "Interest-based (riba) finance", why: "Conventional loans/credit — riba." },
  { key: "insurance",     label: "Conventional insurance",        why: "Non-takaful insurance — gharar/riba concerns." },
  { key: "music_ent",     label: "Music & mainstream entertainment", why: "Stricter audience preference." },
  { key: "crypto_trading",label: "Crypto, forex & speculative trading", why: "Excessive gharar / speculation." },
];

/** Keys only — handy for storing/comparing an active policy. */
export const BLOCKED_AD_CATEGORY_KEYS = BLOCKED_AD_CATEGORIES.map((c) => c.key);
