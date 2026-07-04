/* Humble Halal — lead marketplace verticals (single source of truth).
   `id` is the stable key stored in leads.vertical_id and
   lead_preferences.verticals; `label` is the consumer-facing form option
   (kept identical to the historical `leads.category` strings so existing
   rows stay queryable); `catIds` maps directory categories to the vertical
   (detail-page CTA + owner preference suggestions). */

export interface LeadVertical {
  id: string;
  label: string;
  catIds: string[];
}

export const LEAD_VERTICALS: LeadVertical[] = [
  { id: "catering", label: "Event & buffet catering", catIds: [] },
  { id: "weddings", label: "Wedding & bridal (MUA, deco, hantaran)", catIds: ["weddings"] },
  { id: "umrah", label: "Umrah & Hajj travel", catIds: ["travel"] },
  { id: "finance", label: "Islamic finance & takaful", catIds: [] },
  { id: "home-services", label: "Home services (renovation, cleaning, aircon)", catIds: ["services"] },
  { id: "automotive", label: "Automotive (servicing, detailing)", catIds: ["automotive"] },
  { id: "photography", label: "Photography & videography", catIds: [] },
  { id: "professional", label: "Professional services (legal, accounting, marketing)", catIds: ["professional"] },
  { id: "education", label: "Quran & tuition / education", catIds: ["education"] },
  { id: "other", label: "Something else", catIds: [] },
];

export const LEAD_VERTICAL_IDS = LEAD_VERTICALS.map((v) => v.id);

/** How many providers a single quote request may be shared with (PDPA consent copy + routing cap). */
export const LEAD_ROUTE_CAP = 5;

/** Bump whenever the consent wording on the quote form changes. */
export const LEAD_CONSENT_VERSION = "v1-2026-07";

export function verticalIdFromLabel(label?: string | null): string | null {
  if (!label) return null;
  const l = label.trim().toLowerCase();
  return LEAD_VERTICALS.find((v) => v.label.toLowerCase() === l)?.id ?? null;
}

export function verticalLabel(id: string): string {
  return LEAD_VERTICALS.find((v) => v.id === id)?.label ?? id;
}

/** The vertical a directory category maps to (detail-page quote CTA), if any. */
export function verticalForCatId(catId?: string | null): LeadVertical | undefined {
  if (!catId) return undefined;
  return LEAD_VERTICALS.find((v) => v.catIds.includes(catId));
}
