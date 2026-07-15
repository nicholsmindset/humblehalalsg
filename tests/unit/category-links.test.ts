import { describe, it, expect } from "vitest";
import { allSeoPages } from "../../lib/seo-pages";
import { categories } from "../../lib/data";
import { CATEGORY_PRESENTATION, categoryDirectoryLabel } from "../../lib/category-presentation";

/* Audit #6 — the footer / `/halal` hub render category links as
   a category-aware label → the page slug, deriving the LABEL from the category
   page's catId and the SLUG from the page. If a page's catId and slug ever
   reference different categories, a link's visible label would point at the
   wrong page (an earlier audit found a Weddings label pointing to Automotive).
   These tests assert label and slug always describe the SAME category. */

const catPages = allSeoPages().filter((p) => p.catId && !p.areaId);

describe("category SEO links — label ↔ slug integrity", () => {
  it("has Singapore-wide category landing pages", () => {
    expect(catPages.length).toBeGreaterThan(0);
  });

  it("every category page uses the canonical slug for its own catId", () => {
    for (const p of catPages) {
      expect(p.slug).toBe(CATEGORY_PRESENTATION[p.catId!]?.singaporeSlug);
    }
  });

  it("every category page's label resolves to the same category as its slug", () => {
    for (const p of catPages) {
      const cat = categories.find((c) => c.id === p.catId);
      expect(cat, `no category for ${p.slug}`).toBeTruthy();
      expect(categoryDirectoryLabel(p.catId, cat!.label)).toBe(
        CATEGORY_PRESENTATION[cat!.id].directoryLabel,
      );
    }
  });

  it("slugs are unique (no collision routes a label to another page)", () => {
    const slugs = catPages.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
