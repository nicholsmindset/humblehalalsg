import { describe, it, expect } from "vitest";
import { allSeoPages } from "../../lib/seo-pages";
import { categories } from "../../lib/data";
import { businessMetaText } from "../../lib/business-seo";
import { businessSeoLinks } from "../../lib/seo-pages";
import type { Listing } from "../../lib/types";
import {
  CATEGORY_PRESENTATION,
  categoryDirectoryLabel,
  categoryPageTerminology,
} from "../../lib/category-presentation";

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

  it("never generates a halal-prefixed H1 for a non-food business category", () => {
    const nonFood = new Set([
      "beauty", "health", "fashion", "services", "automotive", "weddings",
      "education", "professional", "travel",
    ]);
    for (const page of allSeoPages().filter((p) => p.catId && nonFood.has(p.catId))) {
      expect(page.h1, page.slug).not.toMatch(/\bhalal\s+(beauty|health|fashion|home|automotive|wedding|education|professional|travel)\b/i);
    }
  });

  it("uses precise result-page language for every non-food category", () => {
    expect(categoryPageTerminology("education").resultNoun).toBe("Islamic education providers");
    expect(categoryPageTerminology("automotive").resultNoun).toBe("Muslim-owned automotive service providers");
    expect(categoryPageTerminology("fashion").resultNoun).toBe("modest fashion shops & designers");
    expect(categoryPageTerminology("services").resultNoun).toBe("Muslim-owned home service providers");
    expect(categoryPageTerminology("professional").resultNoun).toBe("Muslim-owned professional service providers");
  });

  it("keeps halal terminology for food categories", () => {
    expect(categoryPageTerminology("restaurants").resultNoun).toBe("halal restaurants");
    expect(categoryPageTerminology("cafes").resultNoun).toBe("halal cafés");
    expect(categoryPageTerminology("groceries").resultNoun).toBe("halal grocers");
  });
});

describe("business-page SEO links", () => {
  const listing = {
    id: "uuid-1", slug: "wanderlost-lounge", name: "Wanderlost Lounge",
    cat: "Cafés", catId: "cafes", cuisine: "Rooftop Café", area: "Tanjong Pagar",
    price: "$$", rating: 4.7, reviews: 20, badges: ["friendly"],
    blurb: "A rooftop café serving alcohol-free drinks.", img: "", tone: "emerald",
    open: true, distance: "", prayer: false, delivery: false, featured: false,
    hours: "", phone: "", wa: "", ig: "", web: "", address: "", tags: [],
  } as Listing;

  it("uses full multiword slugs and only links to existing SEO pages", () => {
    expect(businessSeoLinks(listing)).toEqual([{
      href: "/halal-food/tanjong-pagar", slug: "halal-food-in-tanjong-pagar",
      label: "Halal Food in Tanjong Pagar",
    }]);
    expect(businessSeoLinks({ ...listing, area: "Shenton Way" })).toEqual([]);
  });

  it("does not put blank location delimiters in fallback metadata", () => {
    const meta = businessMetaText({ ...listing, area: "", cuisine: "", blurb: "", reviews: 0 }, "Muslim-friendly");
    expect(meta.description).toContain("in Singapore");
    expect(meta.description).not.toMatch(/in\s*,|,\s*,|—\s*,/);
    expect(meta.title.length).toBeLessThanOrEqual(60);
    expect(meta.description.length).toBeLessThanOrEqual(160);
  });
});
