import "server-only";

import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../keystatic.config";
import { allPosts as allLegacyPosts, type BlogPost } from "./blog";
import type { BlogCategorySlug } from "./blog-categories";
import { isPostLive } from "./content-calendar";

const reader = createReader(process.cwd(), keystaticConfig);

function clean(value: string | null | undefined): string | undefined {
  const result = value?.trim();
  return result || undefined;
}

/** Today's date (YYYY-MM-DD) in Asia/Singapore — the go-live boundary for
    scheduled posts. en-CA yields ISO format; a plain string compare is safe
    against Keystatic's `date` field, which is also YYYY-MM-DD. Kept local so
    the blog path stays free of the events/Supabase module. */
function todaySG(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(new Date());
}

/** Live Keystatic entries, converted to the existing blog view model. A post is
    live when it is Published, or Scheduled with a publish date that has arrived
    (SGT). Scheduled future posts stay hidden from the site but remain visible in
    the Keystatic admin. */
export async function cmsPosts(): Promise<BlogPost[]> {
  const entries = await reader.collections.posts.all();
  const today = todaySG();
  return entries
    .filter(({ entry }) => isPostLive(entry.status, entry.datePublished, today))
    .map(({ slug, entry }) => ({
      slug,
      title: entry.title,
      dek: entry.dek,
      answer: entry.answer,
      author: entry.author,
      datePublished: entry.datePublished,
      dateModified: clean(entry.dateModified),
      readMins: entry.readMins,
      category: entry.category as BlogCategorySlug,
      tags: [...entry.tags],
      image: entry.image,
      imageAlt: entry.imageAlt,
      imageCredit: clean(entry.imageCredit),
      sections: entry.sections.map((section) => ({
        h2: section.h2,
        body: section.body.length ? [...section.body] : undefined,
        bullets: section.bullets.length ? [...section.bullets] : undefined,
        links: section.links.length ? section.links.map((link) => ({ label: link.label, href: link.href })) : undefined,
        socialUrl: clean(section.socialUrl),
        socialLabel: clean(section.socialLabel),
        image: clean(section.image),
        imageAlt: clean(section.imageAlt),
        caption: clean(section.caption),
      })),
      faq: entry.faq.map((item) => ({ q: item.q, a: item.a })),
      related: entry.related.length ? [...entry.related] : undefined,
      dropcap: entry.dropcap,
      pullQuote: clean(entry.pullQuote),
      pullQuoteBy: clean(entry.pullQuoteBy),
      leadVertical: clean(entry.leadVertical),
    }));
}

/** CMS posts override a legacy post with the same slug, enabling gradual migration. */
export async function allBlogPosts(): Promise<BlogPost[]> {
  const merged = new Map(allLegacyPosts().map((post) => [post.slug, post]));
  for (const post of await cmsPosts()) merged.set(post.slug, post);
  return [...merged.values()].sort((a, b) => b.datePublished.localeCompare(a.datePublished));
}

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  return (await allBlogPosts()).find((post) => post.slug === slug);
}

export async function blogPostsByCategory(category: BlogCategorySlug): Promise<BlogPost[]> {
  return (await allBlogPosts()).filter((post) => post.category === category);
}

export async function featuredBlogPost(): Promise<BlogPost> {
  return (await allBlogPosts())[0];
}

export async function relatedBlogPosts(post: BlogPost, limit = 3): Promise<BlogPost[]> {
  const posts = await allBlogPosts();
  const bySlug = new Map(posts.map((candidate) => [candidate.slug, candidate]));
  const picked = (post.related || []).map((slug) => bySlug.get(slug)).filter(Boolean) as BlogPost[];
  const rest = posts.filter((candidate) => candidate.slug !== post.slug && !picked.includes(candidate));
  return [...picked, ...rest].slice(0, limit);
}
