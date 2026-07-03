/* Server-trusted advertising product catalog (name + price in cents).
   Shared by the checkout route (create session) and the Stripe webhook
   (receipt email) so product names/prices stay single-sourced. */
export const AD_PRODUCTS: Record<string, { name: string; cents: number }> = {
  "featured-listing": { name: "Featured Listing (1 month)", cents: 4900 }, // aligned to the $49/mo Featured plan (was 8900 — contradicted /pricing)
  "homepage-spotlight": { name: "Homepage Spotlight (1 month)", cents: 45000 },
  "category-sponsorship": { name: "Category Sponsorship (1 month)", cents: 30000 },
  "newsletter-sponsorship": { name: "Newsletter Sponsorship", cents: 25000 },
  "event-promotion": { name: "Event Promotion", cents: 12000 },
};

/* Legacy /advertise product id → ad_placements key. Lets the sales page
   deep-link a signed-in owner into the self-serve campaign builder with the
   right placement preselected. Serving rates come from
   ad_placements.monthly_rate_cents (the DB is the source of truth for
   self-serve); AD_PRODUCTS above remains only for the anonymous legacy
   checkout that records an ad_orders lead. */
export const PRODUCT_PLACEMENT: Record<string, string> = {
  "featured-listing": "directory_inline",
  "homepage-spotlight": "homepage_hero",
  "category-sponsorship": "category_featured",
  "newsletter-sponsorship": "newsletter",
  "event-promotion": "event_featured",
};
