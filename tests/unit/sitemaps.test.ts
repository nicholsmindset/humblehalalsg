import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cms-blog", () => ({
  allBlogPosts: vi.fn(async () => [
    {
      slug: "bad-date-post",
      datePublished: "not-a-date",
      noindex: false,
    },
  ]),
}));
vi.mock("@/lib/blog-categories", () => ({ allCategories: vi.fn(() => []) }));

import { segmentUrls, sitemapDate } from "@/lib/sitemaps";

describe("sitemapDate", () => {
  it("normalizes valid source dates", () => {
    expect(sitemapDate("2026-09-03")).toBe("2026-09-03T00:00:00.000Z");
  });

  it("omits missing or malformed dates instead of throwing", () => {
    expect(sitemapDate()).toBeUndefined();
    expect(sitemapDate("not-a-date")).toBeUndefined();
  });
});

describe("blog sitemap dates", () => {
  it("keeps the sitemap available when a CMS post has a malformed date", async () => {
    const urls = await segmentUrls("blog");

    expect(urls).toHaveLength(1);
    expect(urls[0].loc).toContain("/blog/bad-date-post");
    expect(urls[0].lastmod).toBeUndefined();
  });
});
