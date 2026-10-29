import type { BlogPost } from "./blog";
import { getCategory } from "./blog-categories";

export type GuideCard = Pick<BlogPost, "slug" | "title" | "dek" | "readMins" | "datePublished" | "image" | "imageAlt" | "category" | "tags">;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function filterGuides(posts: GuideCard[], query: string): GuideCard[] {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return posts.filter(post => {
    const text = normalize([post.title, post.dek, ...post.tags, getCategory(post.category)?.name || ""].join(" "));
    return terms.every(term => text.includes(term));
  });
}

/** Send only card metadata to the interactive guide finder, never full articles. */
export function guideCard(post: BlogPost): GuideCard {
  const { slug, title, dek, readMins, datePublished, image, imageAlt, category, tags } = post;
  return { slug, title, dek, readMins, datePublished, image, imageAlt, category, tags };
}
