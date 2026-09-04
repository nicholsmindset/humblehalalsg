import { beforeEach, describe, expect, it, vi } from "vitest";

const allBlogPosts = vi.fn();

vi.mock("@/lib/cms-blog", () => ({ allBlogPosts }));
vi.mock("@/lib/blog-categories", () => ({
  getCategory: () => ({ name: "Guides" }),
}));
vi.mock("@/lib/seo", () => ({
  SITE: {
    name: "Humble Halal",
    url: "https://example.com",
    description: "Halal guides",
  },
}));

describe("blog RSS feed", () => {
  beforeEach(() => {
    allBlogPosts.mockReset();
  });

  it("uses the publication date for pubDate even when the post was modified earlier", async () => {
    allBlogPosts.mockResolvedValue([
      {
        slug: "scheduled-post",
        title: "Scheduled post",
        dek: "Published after it was prepared",
        datePublished: "2026-09-05",
        dateModified: "2026-08-30",
        category: "guides",
      },
    ]);

    const { GET } = await import("@/app/blog/feed.xml/route");
    const response = await GET();
    const xml = await response.text();

    expect(xml).toContain("<pubDate>Sat, 05 Sep 2026 01:00:00 GMT</pubDate>");
    expect(xml).not.toContain("<pubDate>Sun, 30 Aug 2026 01:00:00 GMT</pubDate>");
  });
});
