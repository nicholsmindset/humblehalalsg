import { describe, it, expect } from "vitest";
import { VERDICTS } from "../../lib/verdicts";
import { brands, STATUS_META, type HalalStatus } from "../../lib/halal-status";
import {
  BRAND_CONTENT,
  STATUS_EXPLAINERS,
  buildBrandFaq,
  methodLines,
  watchForItems,
  withCuratedContent,
} from "../../lib/halal-status-content";
import { ADDITIVES } from "../../lib/tools/ingredients";

const STATUSES = Object.keys(STATUS_META) as HalalStatus[];

describe("halal checker content integrity", () => {
  it("STATUS_EXPLAINERS covers every status with full depth", () => {
    for (const s of STATUSES) {
      const e = STATUS_EXPLAINERS[s];
      expect(e, s).toBeTruthy();
      expect(e.title.length, s).toBeGreaterThan(10);
      expect(e.body.length, s).toBeGreaterThanOrEqual(1);
      expect(e.defaultWatchFor.length, s).toBeGreaterThanOrEqual(2);
      expect(e.method.length, s).toBe(3);
      expect(e.defaultFaqs("TestBrand").length, s).toBeGreaterThanOrEqual(2);
    }
  });

  it("every BRAND_CONTENT key exists in the built-in dataset (no orphans)", () => {
    const slugs = new Set(brands.map((b) => b.slug));
    for (const key of Object.keys(BRAND_CONTENT)) {
      expect(slugs.has(key), `orphan content key: ${key}`).toBe(true);
    }
  });

  it("every alternatives[].slug resolves to a real brand slug or alias", () => {
    const known = new Set(brands.flatMap((b) => [b.slug, ...(b.aliases || [])]));
    for (const [key, c] of Object.entries(BRAND_CONTENT)) {
      for (const a of c.alternatives || []) {
        if (a.slug) expect(known.has(a.slug), `${key} → dead alternative slug: ${a.slug}`).toBe(true);
      }
    }
  });

  it("alternatives only recommend certified checker brands (policy)", () => {
    const bySlug = new Map(brands.map((b) => [b.slug, b]));
    for (const [key, c] of Object.entries(BRAND_CONTENT)) {
      for (const a of c.alternatives || []) {
        if (!a.slug) continue;
        const target = bySlug.get(a.slug);
        expect(target, `${key} → ${a.slug}`).toBeTruthy();
        expect(target!.status, `${key} recommends non-certified ${a.slug}`).toBe("certified");
      }
    }
  });

  it("buildBrandFaq returns 4–6 unique-question items for every brand", () => {
    for (const base of brands) {
      const b = withCuratedContent(base);
      const faq = buildBrandFaq(b);
      expect(faq.length, b.slug).toBeGreaterThanOrEqual(4);
      expect(faq.length, b.slug).toBeLessThanOrEqual(6);
      const qs = new Set(faq.map((f) => f.q.toLowerCase()));
      expect(qs.size, `${b.slug} has duplicate FAQ questions`).toBe(faq.length);
      for (const f of faq) expect(f.a.length, `${b.slug}: ${f.q}`).toBeGreaterThan(30);
    }
  });

  it("method lines interpolate the last-checked date", () => {
    for (const s of STATUSES) {
      const lines = methodLines(s, "July 2026");
      expect(lines.some((l) => l.includes("July 2026")), s).toBe(true);
      expect(lines.some((l) => l.includes("{date}")), s).toBe(false);
    }
  });

  it("watchForItems always returns at least two items", () => {
    for (const base of brands) {
      expect(watchForItems(withCuratedContent(base)).length, base.slug).toBeGreaterThanOrEqual(2);
    }
  });

  it("popular-chip targets resolve (brand slugs + additive codes)", () => {
    const slugs = new Set(brands.map((b) => b.slug));
    for (const s of ["breadtalk", "swee-heng", "chocolate-origin", "paris-baguette"]) {
      expect(slugs.has(s), s).toBe(true);
    }
    const codes = new Set(ADDITIVES.flatMap((a) => [a.code, a.name.toLowerCase(), ...(a.aliases || []).map((x) => x.toLowerCase())]));
    expect(codes.has("E471")).toBe(true);
    expect([...codes].some((c) => String(c).toLowerCase().includes("gelatine") || String(c).toLowerCase().includes("gelatin"))).toBe(true);
  });

  it("verdict vocabulary stays in sync with the verdict engine", () => {
    // The checker's five statuses and the AI verdict engine's five verdicts are
    // separate axes, but both must stay complete — a new status needs explainer copy.
    expect(STATUSES.length).toBe(5);
    expect(VERDICTS.length).toBe(5);
  });
});
