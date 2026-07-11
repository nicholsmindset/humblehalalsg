import { describe, it, expect } from "vitest";
import { leadInlineIndex } from "@/lib/lead-placement";

/* Blog page index math (app/blog/[slug]/page.tsx):
   midIndex = n >= 4 ? floor(n/2) - 1 : -1   (newsletter ribbon)
   adIndex  = n >= 3 ? n - 2 : -1            (sponsored slot) */
const mid = (n: number) => (n >= 4 ? Math.floor(n / 2) - 1 : -1);
const ad = (n: number) => (n >= 3 ? n - 2 : -1);

describe("leadInlineIndex — subtle placement", () => {
  it("omits the teaser on very short posts", () => {
    expect(leadInlineIndex(1, mid(1), ad(1))).toBe(-1);
    expect(leadInlineIndex(2, mid(2), ad(2))).toBe(-1);
  });

  it("places after the opening section when the ribbon is far enough (long posts)", () => {
    for (const n of [6, 7, 8, 10, 14]) {
      expect(leadInlineIndex(n, mid(n), ad(n))).toBe(0);
      // gap to the ribbon is ≥2 sections
      expect(mid(n) - 0).toBeGreaterThanOrEqual(2);
    }
  });

  it("places after the opening section when there is no ribbon at all (n=3)", () => {
    expect(leadInlineIndex(3, mid(3), ad(3))).toBe(0);
  });

  it("omits rather than crowd when the ribbon is early and the ad slot is close (n=4,5)", () => {
    // n=4: mid=1, ad=2 → candidate 3 is not < 2 → omit
    expect(leadInlineIndex(4, mid(4), ad(4))).toBe(-1);
    // n=5: mid=1, ad=3 → candidate 3 is not < 3 → omit
    expect(leadInlineIndex(5, mid(5), ad(5))).toBe(-1);
  });

  it("never returns the same index as the ribbon or the ad slot", () => {
    for (let n = 3; n <= 20; n++) {
      const idx = leadInlineIndex(n, mid(n), ad(n));
      if (idx === -1) continue;
      expect(idx).not.toBe(mid(n));
      expect(idx).not.toBe(ad(n));
      // ≥2 sections away from the newsletter ribbon in every placed case
      if (mid(n) !== -1) expect(Math.abs(idx - mid(n))).toBeGreaterThanOrEqual(2);
    }
  });
});
