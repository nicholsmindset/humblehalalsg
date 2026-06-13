/* Editorial calendar for the weekly blog-drafting job (C1) — typed (replaces the
   playbook's /content/calendar.json). The Claude job reads the slots due this
   week, drafts typed BlogPost objects into lib/blog-drafts.ts, and opens a PR. */
export interface CalendarSlot {
  week: string; // ISO week-start YYYY-MM-DD
  title: string;
  template: "best-of" | "cuisine" | "area" | "seasonal" | "explainer";
  primaryKeyword: string;
  targetSlug: string; // money/landing page to link to
  notes?: string;
}

export const contentCalendar: CalendarSlot[] = [
  { week: "2026-06-15", title: "Best Halal BBQ & Grills in Singapore", template: "cuisine", primaryKeyword: "halal bbq singapore", targetSlug: "halal-bbq-singapore" },
  { week: "2026-06-22", title: "Halal Food in Orchard Road", template: "area", primaryKeyword: "halal food orchard", targetSlug: "halal-food-in-orchard" },
  { week: "2026-06-29", title: "Best Halal Desserts in Singapore", template: "best-of", primaryKeyword: "halal dessert singapore", targetSlug: "halal-desserts-singapore" },
  { week: "2026-07-06", title: "Halal Western Food in Singapore", template: "cuisine", primaryKeyword: "halal western food singapore", targetSlug: "halal-western-singapore" },
];

export function slotsDueThisWeek(weekStart: string): CalendarSlot[] {
  return contentCalendar.filter((s) => s.week === weekStart);
}
