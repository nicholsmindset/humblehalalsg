import { describe, it, expect } from "vitest";
import {
  allSeoPages,
  seoPagePath,
  seoPathForSlug,
  getSeoPageByLocation,
  SEO_LOCATION_IDS,
} from "../../lib/seo-pages";
import { seoRedirects, seoRewrites } from "../../lib/redirects";

/* Flat-URL migration guards. The invariant that keeps GSC clean: every legacy
   /halal/<slug> URL must reach its canonical seoPagePath() in EXACTLY ONE
   redirect hop, and no redirect may point at itself or at another redirect. */

// Minimal simulation of next.config path-to-regexp for OUR rule shapes only.
function applyRedirects(url: string): { to: string; hops: number } {
  const rules = seoRedirects();
  let current = url;
  let hops = 0;
  for (let guard = 0; guard < 5; guard++) {
    const hit = rules.find((r) => {
      if (!r.source.includes(":")) return r.source === current;
      const rx = new RegExp(
        "^" +
          r.source
            .replace(/:(\w+)\(([^)]*)\)/g, (_m, _n, pat) => `(${pat})`)
            .replace(/:(\w+)/g, "([^/]+)") +
          "$",
      );
      return rx.test(current);
    });
    if (!hit) return { to: current, hops };
    const rx = new RegExp(
      "^" +
        hit.source
          .replace(/:(\w+)\(([^)]*)\)/g, (_m, _n, pat) => `(${pat})`)
          .replace(/:(\w+)/g, "([^/]+)") +
        "$",
    );
    const m = current.match(rx)!;
    let i = 0;
    const dest = hit.destination.replace(/:(\w+)/g, () => m[++i]);
    current = dest;
    hops++;
  }
  return { to: current, hops };
}

const pages = allSeoPages();
const placePages = pages.filter((p) => p.kind === "area" || p.kind === "venue");
const topLevelPages = pages.filter((p) => p.kind === "cuisine" || p.kind === "cat");
const legacyKindPages = pages.filter(
  (p) => !["area", "venue", "cuisine", "cat"].includes(p.kind ?? ""),
);

describe("flat-URL migration — canonical paths", () => {
  it("area/venue pages canonicalise to /halal-food/[location]", () => {
    for (const p of placePages) {
      expect(p.locationId, `${p.slug} missing locationId`).toBeTruthy();
      expect(seoPagePath(p)).toBe(`/halal-food/${p.locationId}`);
    }
  });

  it("cuisine + category pages canonicalise to top level", () => {
    for (const p of topLevelPages) expect(seoPagePath(p)).toBe(`/${p.slug}`);
  });

  it("area-cat / mrt / muslim-owned pages stay under /halal/", () => {
    for (const p of legacyKindPages) expect(seoPagePath(p)).toBe(`/halal/${p.slug}`);
  });

  it("location ids are unique across areas + venues (flat namespace)", () => {
    expect(new Set(SEO_LOCATION_IDS).size).toBe(SEO_LOCATION_IDS.length);
  });

  it("seoPathForSlug falls back to /halal/ for unknown slugs", () => {
    expect(seoPathForSlug("not-a-real-slug")).toBe("/halal/not-a-real-slug");
  });
});

describe("flat-URL migration — 301 map", () => {
  it("every migrated page's old URL resolves to seoPagePath in exactly one hop", () => {
    for (const p of [...placePages, ...topLevelPages]) {
      const { to, hops } = applyRedirects(`/halal/${p.slug}`);
      expect(to, `/halal/${p.slug}`).toBe(seoPagePath(p));
      expect(hops, `/halal/${p.slug} should be one hop`).toBe(1);
    }
  });

  it("un-migrated kinds are untouched by the redirect layer", () => {
    for (const p of legacyKindPages) {
      const { hops } = applyRedirects(`/halal/${p.slug}`);
      expect(hops, `/halal/${p.slug} must NOT redirect`).toBe(0);
    }
  });

  it("no redirect is a self-redirect and every static rule resolves in one hop", () => {
    for (const r of seoRedirects()) {
      expect(r.source).not.toBe(r.destination);
      if (!r.source.includes(":")) {
        // Static sources (legacy + aliases) must land on a final URL, not chain.
        const { hops, to } = applyRedirects(r.source);
        expect(hops, `${r.source} chains (${hops} hops → ${to})`).toBe(1);
      }
    }
  });

  it("legacy + alias destinations under /halal-food/ point at REAL locations", () => {
    for (const r of seoRedirects()) {
      const m = r.destination.match(/^\/halal-food\/([a-z0-9-]+)$/);
      if (m) expect(getSeoPageByLocation(m[1]), r.destination).toBeTruthy();
    }
  });

  it("all redirects are permanent (301/308)", () => {
    for (const r of seoRedirects()) {
      expect(r.permanent === true || r.statusCode === 301).toBe(true);
    }
  });
});

describe("flat-URL migration — cuisine/category rewrite", () => {
  it("every top-level page's public URL matches the rewrite back to /halal/", () => {
    for (const p of topLevelPages) {
      const pub = seoPagePath(p);
      const rule = seoRewrites().afterFiles.find((candidate) => {
        if (!candidate.source.includes(":")) return candidate.source === pub;
        const rx = new RegExp(
          "^" + candidate.source.replace(/:(\w+)\(([^)]*)\)/g, (_m, _n, pat) => `(${pat})`) + "$",
        );
        return rx.test(pub);
      });
      expect(rule, `${pub} must match a rewrite`).toBeTruthy();
      expect(rule!.destination.replace(":slug", p.slug)).toBe(`/halal/${p.slug}`);
    }
  });

  it("the rewrite pattern does NOT swallow non-SEO top-level routes", () => {
    const rule = seoRewrites().afterFiles[0];
    const rx = new RegExp(
      "^" + rule.source.replace(/:(\w+)\(([^)]*)\)/g, (_m, _n, pat) => `(${pat})`) + "$",
    );
    for (const path of ["/halal", "/halal-food-near-me", "/is-halal", "/hari-raya", "/explore"]) {
      expect(rx.test(path), `${path} must not rewrite`).toBe(false);
    }
  });
});
