import { describe, expect, it } from "vitest";
import { benefitsForPlan, expectedFeatured } from "../../lib/plan-entitlements";

describe("plan entitlement contract", () => {
  it("keeps advanced analytics and offers Premium-only", () => {
    const featured = new Set(benefitsForPlan("featured").map((item) => item.key));
    const premium = new Set(benefitsForPlan("premium").map((item) => item.key));
    expect(featured.has("advanced_analytics")).toBe(false);
    expect(featured.has("offers")).toBe(false);
    expect(premium.has("advanced_analytics")).toBe(true);
    expect(premium.has("offers")).toBe(true);
  });

  it("includes every paid visibility promise for Featured and Premium", () => {
    for (const plan of ["featured", "premium"] as const) {
      const keys = new Set(benefitsForPlan(plan).map((item) => item.key));
      expect(keys.has("featured_placement")).toBe(true);
      expect(keys.has("category_area_priority")).toBe(true);
      expect(keys.has("homepage_rotation")).toBe(true);
      expect(keys.has("priority_support")).toBe(true);
      expect(expectedFeatured(plan)).toBe(true);
    }
  });

  it("does not mark Free or Verified as featured", () => {
    expect(expectedFeatured("free")).toBe(false);
    expect(expectedFeatured("verified")).toBe(false);
  });
});
