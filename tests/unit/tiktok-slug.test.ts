import { describe, it, expect } from "vitest";
import { normalizeBusinessSlugInput } from "../../lib/tiktok";

/* The admin "attach to business" field gets full listing URLs pasted into it
   (that's what broke the first real approval) — it must resolve to a slug. */
describe("normalizeBusinessSlugInput — admin attach field", () => {
  it("extracts the slug from a full listing URL", () => {
    expect(normalizeBusinessSlugInput("https://www.humblehalal.com/business/atrium-restaurant")).toBe("atrium-restaurant");
  });
  it("handles trailing slash, query and hash", () => {
    expect(normalizeBusinessSlugInput("https://humblehalal.com/business/prive-keppel-bay/?tab=reviews#top")).toBe("prive-keppel-bay");
  });
  it("passes a bare slug through (trimmed, lowercased)", () => {
    expect(normalizeBusinessSlugInput("  Atrium-Restaurant ")).toBe("atrium-restaurant");
    expect(normalizeBusinessSlugInput("/atrium-restaurant/")).toBe("atrium-restaurant");
  });
  it("relative /business/ path works too", () => {
    expect(normalizeBusinessSlugInput("/business/haron-satay-east-coast-lagoon-food-village")).toBe("haron-satay-east-coast-lagoon-food-village");
  });
  it("empty input stays empty", () => {
    expect(normalizeBusinessSlugInput("")).toBe("");
    expect(normalizeBusinessSlugInput("   ")).toBe("");
  });
});
