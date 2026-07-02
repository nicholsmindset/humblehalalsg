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
