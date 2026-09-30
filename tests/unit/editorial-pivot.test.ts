import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { allPosts } from "@/lib/blog";
import { currentEditorialPost } from "@/lib/editorial-pivot";
import { legacyGuideRedirect, retiredFeatureResponse } from "@/proxy";

describe("editorial site transition", () => {
  it("retires listing, hawker, event and checkout routes while preserving guides and tools", () => {
    for (const path of ["/business/fika-swedish-cafe-beach-road", "/hawker", "/events", "/pricing", "/api/checkout/plan"]) {
      expect(retiredFeatureResponse(new NextRequest(`https://www.humblehalal.com${path}`))?.status).toBe(410);
    }
    for (const path of ["/blog", "/blog/what-is-halal-singapore", "/tools", "/tools/prayer-times"]) {
      expect(retiredFeatureResponse(new NextRequest(`https://www.humblehalal.com${path}`))).toBeNull();
    }
    expect(legacyGuideRedirect(new NextRequest("https://www.humblehalal.com/how-to-get-halal-certified-muis"))?.headers.get("location"))
      .toBe("https://www.humblehalal.com/blog/category/halal-basics");
  });

  it("removes obsolete directory claims and listing links from an older guide", () => {
    const original = allPosts().find((post) => post.slug === "best-halal-cafes-singapore");
    expect(original).toBeDefined();
    const post = currentEditorialPost({
      ...original!,
      sections: [...original!.sections, { h2: "Old directory", links: [{ label: "View listing", href: "/business/old-listing" }] }],
    });
    const publishedCopy = JSON.stringify(post);
    expect(publishedCopy).not.toMatch(/halal-confidence score|Humble Halal directory|\/business\//i);
    expect(post.sections.some((section) => section.links?.some((link) => link.href.includes("halal.muis.gov.sg")))).toBe(true);
  });
});
