import { describe, it, expect } from "vitest";
import { articleAdBreaks, AD_SUPPORTED_TOOLS, validPublisherId } from "@/lib/editorial-ads";
const section = (words: number) => ({ h2: "Section", body: [Array(words).fill("word").join(" ")] });
describe("editorial ad density", () => {
  it("keeps short pieces and a single long section free of injected ads", () => {
    expect(articleAdBreaks([section(200), section(200)])).toEqual([]);
    expect(articleAdBreaks([section(2000)])).toEqual([]);
  });
  it("requires two paragraphs and avoids newsletter/lead breaks", () => {
    expect(articleAdBreaks(Array.from({ length: 9 }, () => section(180)), [1, 3])).toEqual([2, 4, 6]);
  });
  it("caps long articles at three and maintains content between placements", () => {
    const sections = Array.from({ length: 40 }, () => section(80));
    const breaks = articleAdBreaks(sections);
    expect(breaks).toHaveLength(3);
    let previous = -1;
    for (const index of breaks) {
      expect((index - previous) * 80).toBeGreaterThanOrEqual(350);
      expect(index - previous).toBeGreaterThanOrEqual(2);
      expect(index).toBeLessThan(sections.length - 1);
      previous = index;
    }
  });
  it("does not monetize prayer/readers, forms or arbitrary tool paths", () => {
    for (const path of ["/tools/quran", "/tools/quran/1", "/tools/quran/114", "/tools/quran/search", "/tools/tasbih", "/tools/duas", "/tools/qibla", "/tools/prayer-times", "/contact", "/tools/unknown"]) {
      expect(AD_SUPPORTED_TOOLS.has(path)).toBe(false);
    }
    expect(AD_SUPPORTED_TOOLS.has("/tools/zakat")).toBe(true);
  });
  it("rejects missing and malformed publishers", () => {
    expect(validPublisherId("ca-pub-7886081043408699")).toBe(true);
    for (const id of ["", "ca-pub-", "ca-pub-placeholder", "ca-pub-123"]) expect(validPublisherId(id)).toBe(false);
  });
});
