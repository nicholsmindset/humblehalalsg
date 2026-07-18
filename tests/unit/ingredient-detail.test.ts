import { describe, it, expect } from "vitest";
import {
  ADDITIVES, ingredientSlug, ingredientAltSlugs, ingredientQualifies,
  indexableIngredients, getIngredientBySlug, type Additive,
} from "../../lib/tools/ingredients";
import {
  INGREDIENT_HUBS, getHub, hubMembers, hubQualifies, indexableHubs, HUB_MIN_MEMBERS,
} from "../../lib/tools/ingredient-hubs";

/* Detail-page invariants for the ingredient checker. These lock the quality
   gate, slug stability and redirect-safety that the route, sitemap and 301 map
   all depend on — a break here would ship 404s, duplicate pages or thin content. */

describe("ingredientSlug", () => {
  it("is lowercase, kebab-case and starts with the E-number for coded entries", () => {
    const e104 = ADDITIVES.find((a) => a.code === "E104")!;
    expect(ingredientSlug(e104)).toBe("e104-quinoline-yellow");
    for (const a of indexableIngredients()) {
      const slug = ingredientSlug(a);
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      if (a.code) expect(slug.startsWith(`${a.code.toLowerCase()}-`)).toBe(true);
    }
  });

  it("honours a pinned slug override", () => {
    const pinned: Additive = { code: "E999", name: "Test", category: "Other", status: "halal", origin: "x", slug: "custom-slug" };
    expect(ingredientSlug(pinned)).toBe("custom-slug");
  });
});

describe("canonical slug uniqueness", () => {
  it("has no duplicate canonical slugs across indexable ingredients", () => {
    const slugs = indexableIngredients().map(ingredientSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("alt slugs (redirect safety)", () => {
  const canonical = new Set(indexableIngredients().map(ingredientSlug));

  it("never collide with any canonical slug (would shadow a real page)", () => {
    for (const a of indexableIngredients()) {
      for (const alt of ingredientAltSlugs(a)) {
        expect(canonical.has(alt)).toBe(false);
      }
    }
  });

  it("include the bare E-number for coded entries", () => {
    const e104 = ADDITIVES.find((a) => a.code === "E104")!;
    expect(ingredientAltSlugs(e104)).toContain("e104");
  });
});

describe("quality gate (ingredientQualifies)", () => {
  it("passes only entries with answer + what-is-it + uses/label + verification + source + review date", () => {
    for (const a of indexableIngredients()) {
      expect(a.halalReasoning && a.halalReasoning.length > 40).toBeTruthy();
      expect((a.description && a.description.length > 40) || (a.originSummary && a.originSummary.length > 40)).toBeTruthy();
      expect(a.commonUses?.length || a.labelNames?.length).toBeTruthy();
      expect(a.verificationAdvice || a.singaporeGuidance).toBeTruthy();
      expect(a.sources && a.sources.length >= 1).toBeTruthy();
      expect(a.lastReviewed).toBeTruthy();
      expect(a.code).toBeTruthy();
    }
  });

  it("rejects a thin entry, a name-only entry, and an explicit indexable:false", () => {
    const thin: Additive = { code: "E999", name: "Thin", category: "Other", status: "halal", origin: "x" };
    expect(ingredientQualifies(thin)).toBe(false);
    const nameOnly = ADDITIVES.find((a) => !a.code)!;
    expect(ingredientQualifies(nameOnly)).toBe(false);
    const killed: Additive = { ...ADDITIVES.find((a) => a.code === "E104")!, indexable: false };
    expect(ingredientQualifies(killed)).toBe(false);
  });

  it("authors a meaningful set of indexable ingredients (>= 25)", () => {
    expect(indexableIngredients().length).toBeGreaterThanOrEqual(25);
  });
});

describe("getIngredientBySlug", () => {
  it("round-trips every indexable ingredient (case-insensitive)", () => {
    for (const a of indexableIngredients()) {
      const slug = ingredientSlug(a);
      expect(getIngredientBySlug(slug)?.code).toBe(a.code);
      expect(getIngredientBySlug(slug.toUpperCase())?.code).toBe(a.code);
    }
  });

  it("returns undefined for unknown or thin slugs (→ 404)", () => {
    expect(getIngredientBySlug("not-a-real-thing")).toBeUndefined();
    // E508 (potassium chloride) is in the dataset but thin → no page.
    expect(getIngredientBySlug("e508-potassium-chloride")).toBeUndefined();
  });
});

describe("related ingredient codes resolve", () => {
  it("every relatedCode points to a real additive", () => {
    for (const a of indexableIngredients()) {
      for (const c of a.relatedCodes || []) {
        expect(ADDITIVES.some((x) => x.code === c)).toBe(true);
      }
    }
  });
});

describe("FAQ + source shape for indexable pages", () => {
  it("FAQs (when present) have a question and answer, and there are >=2 for FAQ schema", () => {
    const e104 = getIngredientBySlug("e104-quinoline-yellow")!;
    expect((e104.faqs || []).length).toBeGreaterThanOrEqual(2);
    for (const f of e104.faqs || []) {
      expect(f.q.trim().length).toBeGreaterThan(3);
      expect(f.a.trim().length).toBeGreaterThan(10);
    }
  });

  it("every source has a title and organisation", () => {
    for (const a of indexableIngredients()) {
      for (const s of a.sources || []) {
        expect(s.title.trim().length).toBeGreaterThan(3);
        expect(s.organisation.trim().length).toBeGreaterThan(1);
      }
    }
  });
});

describe("category hubs", () => {
  it("hub members are all indexable and match the hub predicate", () => {
    for (const hub of INGREDIENT_HUBS) {
      for (const a of hubMembers(hub)) {
        expect(ingredientQualifies(a)).toBe(true);
        expect(hub.match(a)).toBe(true);
      }
    }
  });

  it("only indexes hubs at or above the member threshold", () => {
    for (const hub of INGREDIENT_HUBS) {
      expect(hubQualifies(hub)).toBe(hubMembers(hub).length >= HUB_MIN_MEMBERS);
    }
    // food-colourings should qualify with the first batch; a sparse hub should not.
    expect(hubQualifies(getHub("food-colourings")!)).toBe(true);
  });

  it("indexableHubs() returns a non-empty, threshold-filtered set", () => {
    const hubs = indexableHubs();
    expect(hubs.length).toBeGreaterThan(0);
    expect(hubs.every((h) => hubMembers(h).length >= HUB_MIN_MEMBERS)).toBe(true);
  });
});
