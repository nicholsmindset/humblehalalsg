import { describe, expect, it } from "vitest";
import { filterGuides, guideCard, type GuideCard } from "@/lib/blog-discovery";
import type { BlogPost } from "@/lib/blog";

const base = { readMins: 8, datePublished: "2026-09-07", image: "/food.webp", imageAlt: "Food", tags: [] };
const posts: GuideCard[] = [
  { ...base, slug: "pho", title: "Vietnamese food in Singapore", dek: "Pho and banh mi", category: "cuisines", tags: ["noodles"] },
  { ...base, slug: "cafe", title: "A neighbourhood café", dek: "Coffee and cake", category: "restaurants-cafes", tags: ["Bugis"] },
];
describe("guide discovery", () => {
  it("matches case, accents and multiple terms across title, summary and tags", () => {
    expect(filterGuides(posts, " SINGAPORE noodles ").map(p => p.slug)).toEqual(["pho"]);
    expect(filterGuides(posts, "cafe bugis").map(p => p.slug)).toEqual(["cafe"]);
  });
  it("matches category names and preserves chronological source order", () => {
    expect(filterGuides(posts, "Cuisines").map(p => p.slug)).toEqual(["pho"]);
    expect(filterGuides(posts, "  ")).toEqual(posts);
  });
  it("requires every term, returning an honest empty result", () => {
    expect(filterGuides(posts, "pho cake")).toEqual([]);
  });
  it("sends only discovery metadata to the client", () => {
    const full = { ...posts[0], answer: "Full answer", author: "Team", sections: [], faq: [] } as BlogPost;
    expect(guideCard(full)).toEqual(posts[0]);
    expect(guideCard(full)).not.toHaveProperty("answer");
  });
});
