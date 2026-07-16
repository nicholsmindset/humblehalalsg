import { describe, it, expect } from "vitest";
import { PLAN_KEYS, PLANS, planKey, canUse, galleryMax, type Feature } from "../../lib/plans";

describe("plans — normalization", () => {
  it("normalizes known plan keys", () => {
    for (const k of PLAN_KEYS) expect(planKey(k)).toBe(k);
  });
  it("defaults unknown/empty to free", () => {
    expect(planKey(undefined)).toBe("free");
    expect(planKey(null)).toBe("free");
    expect(planKey("")).toBe("free");
    expect(planKey("enterprise")).toBe("free");
    expect(planKey({ plan: "spotlight" })).toBe("free");
  });
  it("reads .plan from a business-like object", () => {
    expect(planKey({ plan: "premium" })).toBe("premium");
    expect(planKey({ plan: null })).toBe("free");
  });
});

describe("plans — cumulative entitlements", () => {
  it("each tier includes everything below it", () => {
    const order = PLAN_KEYS; // free < verified < featured < premium
    for (let i = 1; i < order.length; i++) {
      const lower = new Set(PLANS[order[i - 1]].features);
      const higher = new Set(PLANS[order[i]].features);
      for (const f of lower) expect(higher.has(f)).toBe(true);
    }
  });
  it("gallery cap is monotonic non-decreasing by tier", () => {
    let prev = -1;
    for (const k of PLAN_KEYS) {
      expect(galleryMax(k)).toBeGreaterThanOrEqual(prev);
      prev = galleryMax(k);
    }
  });
});

describe("plans — canUse gates", () => {
  it("cert upload is Verified+ (not free, not premium-only)", () => {
    expect(canUse("free", "cert_upload")).toBe(false);
    expect(canUse("verified", "cert_upload")).toBe(true);
    expect(canUse("featured", "cert_upload")).toBe(true);
    expect(canUse("premium", "cert_upload")).toBe(true);
    expect(canUse({ plan: "verified" }, "cert_upload")).toBe(true);
  });
  it("featured placement is Featured+", () => {
    expect(canUse("verified", "featured_placement")).toBe(false);
    expect(canUse("featured", "featured_placement")).toBe(true);
    expect(canUse("premium", "featured_placement")).toBe(true);
  });
  it("priority support is Featured+", () => {
    expect(canUse("verified", "priority_support")).toBe(false);
    expect(canUse("featured", "priority_support")).toBe(true);
    expect(canUse("premium", "priority_support")).toBe(true);
  });
  it("premium-only features", () => {
    const premiumOnly: Feature[] = ["offers_block", "analytics"];
    for (const f of premiumOnly) {
      expect(canUse("featured", f)).toBe(false);
      expect(canUse("premium", f)).toBe(true);
    }
  });
  it("free includes review replies (marketed free value — matches the ungated app)", () => {
    expect(canUse("free", "reply_reviews")).toBe(true);
    expect(PLANS.free.features).toEqual(["reply_reviews"]);
  });
});
