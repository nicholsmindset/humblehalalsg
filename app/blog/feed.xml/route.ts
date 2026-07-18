/* RSS 2.0 feed for the blog — /blog/feed.xml. Feeds readers, aggregators,
   Zapier/newsletter automations and AI crawlers. Built from the date-gated
   published set (allBlogPosts), so scheduled/future posts never leak. */
import { allBlogPosts } from "@/lib/cms-blog";
import { getCategory } from "@/lib/blog-categories";
import { SITE } from "@/lib/seo";

export const dynamic = "force-static";
export const revalidate = 3600;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET() {
  const posts = (await allBlogPosts()).filter((p) => !p.noindex).slice(0, 50);
  const now = new Date().toUTCString();
  const items = posts
    .map((p) => {
      const url = `${SITE.url}/blog/${p.slug}`;
      const pub = new Date(`${p.dateModified || p.datePublished}T09:00:00+08:00`).toUTCString();
      const cat = getCategory(p.category)?.name || "";
      return [
        "    <item>",
        `      <title>${esc(p.metaTitle || p.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${pub}</pubDate>`,
        cat ? `      <category>${esc(cat)}</category>` : "",
        `      <description>${esc(p.metaDescription || p.dek)}</description>`,
        p.image ? `      <enclosure url="${esc(p.image)}" type="image/jpeg" />` : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.name)} — Halal guides for Singapore</title>
    <link>${SITE.url}/blog</link>
    <atom:link href="${SITE.url}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <description>${esc(SITE.description)}</description>
    <language>en-SG</language>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
