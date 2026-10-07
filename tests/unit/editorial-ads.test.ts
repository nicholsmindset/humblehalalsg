import { describe, it, expect } from "vitest";
import { articleAdBreaks, articleAdPlan, listingAdBreaks, AD_SUPPORTED_TOOLS, validPublisherId, canInitializeGoogleAds } from "@/lib/editorial-ads";
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

describe("Google-managed consent initialization", () => {
  it("lets Google resolve new visitors without fabricating a consent grant", () => {
    expect(canInitializeGoogleAds(null)).toBe(true);
    expect(canInitializeGoogleAds("not-json")).toBe(true);
  });
  it("honors existing explicit opt-outs and later opt-ins", () => {
    expect(canInitializeGoogleAds(JSON.stringify({v: 1, marketing: false}))).toBe(false);
    expect(canInitializeGoogleAds(JSON.stringify({v: 1, marketing: true}))).toBe(true);
  });
});


describe("additional editorial inventory", () => {
  it("adds an intro only to substantial articles and Multiplex only to long ones", () => {
    expect(articleAdPlan([section(599)])).toEqual({ intro: false, end: false, breaks: [] });
    expect(articleAdPlan([section(600)])).toEqual({ intro: true, end: false, breaks: [] });
    expect(articleAdPlan(Array.from({ length: 9 }, () => section(180)), [1, 3]))
      .toEqual({ intro: true, end: true, breaks: [2, 4, 6] });
  });
  it("keeps content between the last inline unit and Multiplex, and skips noindex pages", () => {
    const sections = Array.from({ length: 7 }, () => section(200));
    expect(articleAdPlan(sections).breaks).toEqual([1, 3]);
    expect(articleAdPlan(sections, [], true)).toEqual({ intro: false, end: false, breaks: [] });
  });
  it("caps list inventory and never adds a unit at the end of a short list", () => {
    expect(listingAdBreaks(8)).toEqual([]);
    expect(listingAdBreaks(9)).toEqual([5]);
    expect(listingAdBreaks(20)).toEqual([5]);
    expect(listingAdBreaks(21)).toEqual([5, 17]);
    expect(listingAdBreaks(100)).toEqual([5, 17, 29]);
    expect(listingAdBreaks(100, 2)).toEqual([5, 17]);
  });
});
