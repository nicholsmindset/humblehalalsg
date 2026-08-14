import type { Listing } from "./types";
import { joinParts } from "./format";

/** Keep generated SERP copy within a hard character budget without cutting a word. */
export function clipMeta(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const candidate = clean.slice(0, max + 1);
  const boundary = candidate.lastIndexOf(" ");
  return (boundary > Math.floor(max * 0.65) ? candidate.slice(0, boundary) : clean.slice(0, max))
    .replace(/[\s,;:·—-]+$/g, "")
    .trim();
}

/** Fallback metadata for listings without an admin-authored SEO override. */
export function businessMetaText(
  listing: Listing,
  descriptor: string,
): { title: string; description: string } {
  const detail = joinParts([listing.cuisine, listing.area], ", ");
  const title = clipMeta(joinParts([listing.name, detail], " — ") || "Business", 60);
  const kind = listing.cuisine || listing.cat || "business";
  const place = listing.area && listing.area.toLowerCase() !== "singapore"
    ? `${listing.area}, Singapore`
    : "Singapore";
  const blurb = listing.blurb.trim().replace(/[.!?]+$/g, "");
  const lead = blurb || `${listing.name} is a ${descriptor} ${kind} listing`;
  const context = blurb ? `${descriptor} ${kind} listing in ${place}` : `in ${place}`;
  const reviews = listing.reviews > 0 ? ` ${listing.rating}★ from ${listing.reviews} reviews.` : ".";
  const description = clipMeta(`${lead}. ${context}${reviews}`, 160)
    .replace(/\s+([.,])/g, "$1");

  return { title, description };
}
