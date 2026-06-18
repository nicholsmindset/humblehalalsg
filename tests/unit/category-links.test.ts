import { describe, it, expect } from "vitest";
import { allSeoPages } from "../../lib/seo-pages";
import { categories } from "../../lib/data";

/* Audit #6 — the footer / `/halal` hub render category links as
   "Halal {label}" → /halal/{slug}, deriving the LABEL from `categories` by the
   page's catId and the SLUG from the page. If a page's catId and slug ever
   reference different categories, a link's visible label would point at the
   wrong page (the audit saw "Halal Weddings" → halal-automotive-singapore).
   These tests assert label and slug always describe the SAME category. */

const catPages = allSeoPages().filter((p) => p.catId && !p.areaId);

describe("category SEO links — label ↔ slug integrity", () => {
  it("has Singapore-wide category landing pages", () => {
    expect(catPages.length).toBeGreaterThan(0);
  });

  it("every category page's slug encodes its own catId", () => {
    for (const p of catPages) {
      // Slug shape is `halal-<catId>-singapore`; the catId must be the one the
      // footer/hub will look the label up by — same category, no drift.
      expect(p.slug).toBe(`halal-${p.catId}-singapore`);
    }
  });

  it("every category page's label resolves to the same category as its slug", () => {
    for (const p of catPages) {
      const cat = categories.find((c) => c.id === p.catId);
      expect(cat, `no category for ${p.slug}`).toBeTruthy();
      // The label the footer renders ("Halal {label}") must belong to the same
      // category id embedded in the slug.
      expect(p.slug).toContain(`halal-${cat!.id}-singapore`);
    }
  });

  it("slugs are unique (no collision routes a label to another page)", () => {
    const slugs = catPages.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
