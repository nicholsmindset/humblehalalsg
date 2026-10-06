import type { BlogSection } from "./blog";

// Public ad-unit IDs created specifically for Humble Halal, 6 October 2026.
export const EDITORIAL_AD_UNITS = {
  article: "2244043974",
  display: "8557426020",
} as const;

export function validPublisherId(value: string): boolean {
  return /^ca-pub-\d{16}$/.test(value);
}

/** Section boundaries only: no broken paragraphs, lists, figures or controls.
 * Keep >=350 words and two sections between units, with a maximum of three.
 * Short articles (<600 body words) stay ad-free. Avoid newsletter/lead breaks. */
export function articleAdBreaks(sections: BlogSection[], excluded: number[] = []): number[] {
  const words = sections.map(s => [...(s.body || []), ...(s.bullets || [])]
    .join(" ").trim().split(/\s+/).filter(Boolean).length);
  if (words.reduce((a, b) => a + b, 0) < 600) return [];
  const breaks: number[] = [];
  let sinceLast = 0;
  let paragraphs = 0;
  for (let i = 0; i < sections.length - 1; i++) {
    sinceLast += words[i];
    paragraphs += sections[i].body?.length || 0;
    const last = breaks.at(-1);
    const enoughSpace = last === undefined || i - last >= 2;
    if (sinceLast >= 350 && paragraphs >= 2 && enoughSpace && !excluded.includes(i)) {
      breaks.push(i);
      sinceLast = 0;
      paragraphs = 0;
      if (breaks.length === 3) break;
    }
  }
  return breaks;
}

// Explicit opt-in: devotional readers, maps, search, forms and legal pages do
// not inherit inventory simply because they share a layout.
export const AD_SUPPORTED_TOOLS = new Set([
  "/tools", "/tools/zakat", "/tools/zakat-fitrah", "/tools/fidyah",
  "/tools/date-converter", "/tools/islamic-calendar", "/tools/baby-names",
  "/tools/ingredient-checker",
]);
