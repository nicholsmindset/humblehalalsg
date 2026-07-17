/* Profile-strength score for the owner dashboard — derived ONLY from real
 * listing fields (no fabricated percentages). Each check is actionable and
 * deep-links to where the owner fixes it. */

export interface StrengthInput {
  photosCount: number;
  descriptionLength: number;
  hasHours: boolean;
  hasContact: boolean; // phone / whatsapp / socials
  hasWebsite: boolean;
  verified: boolean; // halal_tier muis/admin
}

export interface StrengthCheck {
  key: string;
  label: string;
  done: boolean;
  /** dashboard tab that fixes it */
  tab: string;
}

export function strengthChecks(i: StrengthInput): StrengthCheck[] {
  return [
    { key: "details", label: "Business details complete", done: i.descriptionLength >= 80, tab: "listings" },
    { key: "photos", label: i.photosCount >= 3 ? "Photos added" : `Add ${Math.max(1, 3 - i.photosCount)} more photo${3 - i.photosCount === 1 ? "" : "s"}`, done: i.photosCount >= 3, tab: "listings" },
    { key: "hours", label: "Opening hours set", done: i.hasHours, tab: "listings" },
    { key: "contact", label: "Contact channel added", done: i.hasContact, tab: "listings" },
    { key: "website", label: "Website or socials linked", done: i.hasWebsite, tab: "listings" },
    { key: "cert", label: "Halal certificate verified", done: i.verified, tab: "cert" },
  ];
}

export function strengthScore(i: StrengthInput): { score: number; checks: StrengthCheck[] } {
  const checks = strengthChecks(i);
  const done = checks.filter((c) => c.done).length;
  return { score: done / checks.length, checks };
}
