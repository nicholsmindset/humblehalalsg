/* Lead marketplace subscription plans — single source of truth for checkout,
   webhook fulfillment, quota enforcement and owner UI copy.

   Pricing anchors against the listing plans (lib/plans.ts: Verified $19 <
   Featured $49 < Premium $99). A "Lead Inbox" seat is $99/mo for up to 15
   accepted leads (~$6.60/lead vs. $500–$5,000 job values). A founding rate
   ($49/mo, first businesses per vertical) mirrors the plans.ts FOUNDING offer.

   Stripe price IDs come from env (created once in the Stripe dashboard):
     STRIPE_PRICE_LEADS_M           — standard monthly
     STRIPE_PRICE_LEADS_FOUNDING_M  — founding monthly */

export type LeadPlanKey = "inbox15";

export interface LeadPlan {
  key: LeadPlanKey;
  name: string;
  monthly: number;   // SGD/mo (display)
  quota: number;     // accepted leads per billing period
  blurb: string;
}

export const LEAD_PLANS: Record<LeadPlanKey, LeadPlan> = {
  inbox15: {
    key: "inbox15",
    name: "Lead Inbox",
    monthly: 99,
    quota: 15,
    blurb: "Up to 15 accepted leads a month in your categories and areas.",
  },
};

export const FOUNDING_LEAD_MONTHLY = 49;

export function leadPlan(key: string | null | undefined): LeadPlan | null {
  if (key && key in LEAD_PLANS) return LEAD_PLANS[key as LeadPlanKey];
  return null;
}

/** Resolve the Stripe price id for a lead plan (founding rate when available). */
export function leadPriceId(_key: LeadPlanKey, founding: boolean): string | null {
  const std = process.env.STRIPE_PRICE_LEADS_M || null;
  const found = process.env.STRIPE_PRICE_LEADS_FOUNDING_M || null;
  return (founding && found) ? found : std;
}
