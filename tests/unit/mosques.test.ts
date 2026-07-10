import { describe, it, expect } from "vitest";
import { mosques } from "../../lib/data";
import { mosqueSlug, mosqueBySlug } from "../../lib/mosques";
import { mosqueProfile, profiledMosqueSlugs } from "../../lib/mosque-content";

/* Mosque hub Phase 1 guards: every hand-written profile must resolve to a REAL
   mosque in the data (a typo'd slug would 404 its own detail page + sitemap
   entry), and slugs must be unique. */

describe("mosque slugs", () => {
  it("are unique across all mosques", () => {
    const slugs = mosques.map(mosqueSlug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("round-trip: mosqueBySlug(mosqueSlug(m)) === m", () => {
    for (const m of mosques) expect(mosqueBySlug(mosqueSlug(m))?.id).toBe(m.id);
  });
});

describe("mosque profiles (thin-content gate)", () => {
  it("every profiled slug resolves to a real mosque", () => {
    for (const slug of profiledMosqueSlugs()) {
      expect(mosqueBySlug(slug), `no mosque for profiled slug "${slug}"`).toBeTruthy();
    }
  });

  it("profile.slug matches its map key", () => {
    for (const slug of profiledMosqueSlugs()) {
      expect(mosqueProfile(slug)?.slug).toBe(slug);
    }
  });

  it("every profile has an intro and at least one FAQ", () => {
    for (const slug of profiledMosqueSlugs()) {
      const p = mosqueProfile(slug)!;
      expect(p.intro.length).toBeGreaterThan(40);
      expect(p.faqs.length).toBeGreaterThan(0);
    }
  });
});
