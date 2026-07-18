/* CI guard for CMS blog content (content/posts/*.yaml).
   Fails the build on: missing required fields, unknown category, publish-date
   collisions, too-few sections/FAQ, or related/section-link references to a blog
   slug that doesn't exist (legacy lib/blog.ts + CMS + scheduled plan). Run:
     npx tsx scripts/check-blog-content.mts
   Keeps AI-drafted or hand-edited entries from merging broken. */
import { createReader } from "@keystatic/core/reader";
import cfgMod from "../keystatic.config";
import { BLOG_CATEGORIES } from "../lib/blog-categories";
import { allPosts as legacyPosts } from "../lib/blog";
import { postSchedule } from "../lib/content-calendar";

const cfg = (cfgMod as any).default ?? cfgMod;
const reader = createReader(process.cwd(), cfg);

const CATS = new Set(BLOG_CATEGORIES.map((c) => c.slug));
const errors: string[] = [];

// The runtime `as any` unwrap of the config (for tsx's double-default) strips the
// reader's generic types, so annotate the entry shape we read.
type PostEntry = {
  slug: string;
  entry: {
    title: string; status: string; dek: string; answer: string; author: string;
    datePublished: string; category: string; image: string; imageAlt: string;
    sections: { links: { href: string }[] }[]; faq: unknown[]; related: string[];
  };
};
const cms = (await reader.collections.posts.all()) as unknown as PostEntry[];

// Every slug the blog can resolve: legacy published + all CMS entries + scheduled plan.
const knownSlugs = new Set<string>([
  ...legacyPosts().map((p) => p.slug),
  ...cms.map((e) => e.slug),
  ...postSchedule.map((s) => s.slug),
]);

const seenDates = new Map<string, string>(); // date -> first slug (scheduled only)

for (const { slug, entry } of cms) {
  const where = `content/posts/${slug}.yaml`;
  const req: [string, unknown][] = [
    ["title", entry.title],
    ["status", entry.status],
    ["dek", entry.dek],
    ["answer", entry.answer],
    ["author", entry.author],
    ["datePublished", entry.datePublished],
    ["category", entry.category],
    ["image", entry.image],
    ["imageAlt", entry.imageAlt],
  ];
  for (const [k, v] of req) if (!v) errors.push(`${where}: missing required field "${k}"`);

  if (entry.category && !CATS.has(entry.category as never))
    errors.push(`${where}: unknown category "${entry.category}" (see lib/blog-categories.ts)`);

  if (entry.sections.length < 3) errors.push(`${where}: only ${entry.sections.length} sections (min 3)`);
  if (entry.faq.length < 4) errors.push(`${where}: only ${entry.faq.length} FAQ (min 4)`);

  // Publish-date collisions among scheduled posts would put two posts on one day.
  if (entry.status === "scheduled" && entry.datePublished) {
    const prev = seenDates.get(entry.datePublished);
    if (prev) errors.push(`${where}: datePublished ${entry.datePublished} collides with ${prev}`);
    else seenDates.set(entry.datePublished, slug);
  }

  // related[] must reference a known blog slug.
  for (const rel of entry.related) {
    if (rel && !knownSlugs.has(rel)) errors.push(`${where}: related "${rel}" is not a known blog slug`);
  }

  // Internal /blog/<slug> links in sections must resolve.
  for (const s of entry.sections) {
    for (const link of s.links) {
      const m = /\/blog\/([a-z0-9-]+)(?:[/?#]|$)/.exec(link.href || "");
      if (m && m[1] !== "category" && !knownSlugs.has(m[1]))
        errors.push(`${where}: section link → /blog/${m[1]} does not exist`);
    }
  }
}

if (errors.length) {
  console.error(`\n✗ blog content check failed (${errors.length}):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(`✓ blog content check passed — ${cms.length} CMS entries, ${knownSlugs.size} known slugs.`);
