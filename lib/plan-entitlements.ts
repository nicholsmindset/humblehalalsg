import { canUse, galleryMax, planKey, type Feature, type PlanKey } from "./plans";

export type BenefitKey =
  | "verification_review"
  | "certificate_vault"
  | "contact_buttons"
  | "featured_placement"
  | "category_area_priority"
  | "homepage_rotation"
  | "priority_support"
  | "offers"
  | "advanced_analytics"
  | "photo_capacity";

export type BenefitDelivery = "automatic" | "available" | "earned" | "capacity";

export type BenefitDefinition = {
  key: BenefitKey;
  label: string;
  description: string;
  minimumPlan: PlanKey;
  feature?: Feature;
  delivery: BenefitDelivery;
  href: string;
};

export const PLAN_BENEFITS: readonly BenefitDefinition[] = [
  {
    key: "verification_review",
    label: "Halal-status review",
    description: "Submit evidence for our team to review. Payment unlocks the review, never an automatic badge.",
    minimumPlan: "verified",
    feature: "verified_badge",
    delivery: "earned",
    href: "/owner?tab=cert",
  },
  {
    key: "certificate_vault",
    label: "Halal certificate vault",
    description: "Upload and manage supporting documents securely from your dashboard.",
    minimumPlan: "verified",
    feature: "cert_upload",
    delivery: "available",
    href: "/owner?tab=cert",
  },
  {
    key: "contact_buttons",
    label: "WhatsApp and directions",
    description: "One-tap WhatsApp and directions buttons are enabled on your public listing.",
    minimumPlan: "verified",
    feature: "contact_buttons",
    delivery: "automatic",
    href: "/owner?tab=listings",
  },
  {
    key: "featured_placement",
    label: "Featured placement",
    description: "Your listing receives Featured treatment throughout the directory.",
    minimumPlan: "featured",
    feature: "featured_placement",
    delivery: "automatic",
    href: "/explore",
  },
  {
    key: "category_area_priority",
    label: "Top of category and area",
    description: "Featured listings are placed before standard listings after category and area filters are applied.",
    minimumPlan: "featured",
    feature: "priority_rank",
    delivery: "automatic",
    href: "/explore",
  },
  {
    key: "homepage_rotation",
    label: "Homepage rotation",
    description: "Your listing joins the fair daily rotation in the homepage Featured rail.",
    minimumPlan: "featured",
    feature: "homepage_rotation",
    delivery: "automatic",
    href: "/",
  },
  {
    key: "priority_support",
    label: "Priority support",
    description: "Dashboard support requests are automatically marked high priority for the Humble Halal team.",
    minimumPlan: "featured",
    feature: "priority_support",
    delivery: "automatic",
    href: "/owner?tab=billing",
  },
  {
    key: "offers",
    label: "Offers and promotions",
    description: "Publish a live offer directly on your listing.",
    minimumPlan: "premium",
    feature: "offers_block",
    delivery: "available",
    href: "/owner?tab=listings",
  },
  {
    key: "advanced_analytics",
    label: "Advanced analytics and search insights",
    description: "Unlock daily trends and aggregated searches that led customers to your listing.",
    minimumPlan: "premium",
    feature: "analytics",
    delivery: "automatic",
    href: "/owner",
  },
] as const;

export function benefitsForPlan(input: string | { plan?: string | null } | null | undefined) {
  const plan = planKey(input);
  const included = PLAN_BENEFITS.filter((benefit) => benefit.feature && canUse(plan, benefit.feature));
  return [
    ...included,
    {
      key: "photo_capacity" as const,
      label: "Photo capacity",
      description: `Your plan includes up to ${galleryMax(plan)} listing photos.`,
      minimumPlan: plan,
      delivery: "capacity" as const,
      href: "/owner?tab=listings",
    },
  ];
}

export function expectedFeatured(input: string | { plan?: string | null } | null | undefined): boolean {
  return canUse(input, "featured_placement");
}
