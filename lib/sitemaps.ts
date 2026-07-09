/* Segmented sitemaps. The index lives at /sitemap.xml and each section at
   /sitemap/<segment>.xml, so Search Console can report indexation per content
   type and no single file approaches Google's 50k-URL limit. Served by explicit
   route handlers (app/sitemap.xml + app/sitemap/[seg]) rather than the metadata
   convention, which does not emit an index alongside generateSitemaps. */
import { getDirectory } from "@/lib/directory";
import { getEvents } from "@/lib/events-source";
import { allSeoPages, seoPageIndexable, seoPagePath } from "@/lib/seo-pages";
import { allEventSeoPages, eventSeoPath } from "@/lib/event-seo-pages";
import { allBrands } from "@/lib/halal-status";
import { allPosts } from "@/lib/blog";
import { allCategories } from "@/lib/blog-categories";
import { allTravelHubs } from "@/lib/travel-hubs";
import { TOOLS } from "@/lib/tools";
import { SURAHS } from "@/lib/tools/surahs";
import { SITE } from "@/lib/seo";

export const SITEMAP_SEGMENTS = [
  "core",
  "businesses",
  "areas",
  "brands",
  "events",
  "blog",
  "travel",
  "tools",
] as const;

export type SitemapSegment = (typeof SITEMAP_SEGMENTS)[number];

type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: ChangeFreq;
  priority?: number;
  image?: string;
}

export function isSitemapSegment(v: string): v is SitemapSegment {
  return (SITEMAP_SEGMENTS as readonly string[]).includes(v);
}

const PUBLIC_STATIC = [
  "/",
  "/explore",
  "/map",
  "/mosques",
  "/prayer-rooms",
  "/tools",
  "/halal",
  "/halal-food-singapore",
  "/halal-food-near-me",
  "/best-halal-restaurants-singapore",
  "/new-halal-restaurants-singapore",
  "/is-halal",
  "/travel",
  "/travel/umrah",
  "/blog",
  "/events",
  "/ramadan",
  "/hari-raya",
  "/for-business",
  "/advertise",
  "/pricing",
  "/quotes",
  "/verify",
  "/disclaimer",
  "/suggest",
  "/terms",
  "/privacy",
  "/pdpa",
  "/cookies",
  "/accessibility",
];

/** URLs for one sitemap segment. Unknown segments return []. */
export async function segmentUrls(seg: string): Promise<SitemapUrl[]> {
  const base = SITE.url;
  const now = new Date().toISOString();

  switch (seg) {
    case "core":
      return PUBLIC_STATIC.map((path) => ({
        loc: `${base}${path === "/" ? "" : path}`,
        lastmod: now,
        changefreq: path === "/" ? "daily" : "weekly",
        priority: path === "/" ? 1 : 0.7,
      }));

    case "businesses": {
      const listings = await getDirectory();
      return listings.map((l) => ({
        loc: `${base}/business/${l.slug}`,
        lastmod: now,
        changefreq: "weekly",
        priority: 0.8,
        image: l.image || undefined,
      }));
    }

    case "areas": {
      // Only indexable SEO place-pages — thin ones below the real-listing
      // threshold carry robots:noindex, so listing them would be a mixed signal.
      const listings = await getDirectory();
      return allSeoPages()
        .filter((p) => seoPageIndexable(p, listings))
        .map((p) => ({
          // Canonical public path (flat-URL migration): /halal-food/[location]
          // for places, top-level for cuisine/cat, /halal/[slug] for the rest.
          loc: `${base}${seoPagePath(p)}`,
          lastmod: now,
          changefreq: "weekly",
          priority: 0.7,
        }));
    }

    case "brands":
      return allBrands().map((b) => ({
        loc: `${base}/is-halal/${b.slug}`,
        lastmod: now,
        changefreq: "monthly",
        priority: 0.6,
      }));

    case "events": {
      const eventsList = await getEvents();
      const eventEntries: SitemapUrl[] = eventsList.map((e) => ({
        loc: `${base}/events/${e.slug}`,
        lastmod: now,
        changefreq: "weekly",
        priority: 0.6,
        image: e.img || undefined,
      }));
      const eventSeoEntries: SitemapUrl[] = allEventSeoPages().map((p) => ({
        loc: `${base}${eventSeoPath(p)}`,
        lastmod: now,
        changefreq: "weekly",
        priority: 0.7,
      }));
      return [...eventEntries, ...eventSeoEntries];
    }

    case "blog": {
      const blogEntries: SitemapUrl[] = allPosts().map((p) => ({
        loc: `${base}/blog/${p.slug}`,
        lastmod: new Date(p.dateModified || p.datePublished).toISOString(),
        changefreq: "monthly",
        priority: 0.7,
        image: p.image || undefined,
      }));
      const blogCatEntries: SitemapUrl[] = allCategories().map((c) => ({
        loc: `${base}/blog/category/${c.slug}`,
        lastmod: now,
        changefreq: "weekly",
        priority: 0.6,
        image: c.heroImage || undefined,
      }));
      return [...blogEntries, ...blogCatEntries];
    }

    case "travel":
      return allTravelHubs().map((h) => ({
        loc: `${base}/travel/${h.slug}`,
        lastmod: now,
        changefreq: "weekly",
        priority: 0.7,
      }));

    case "tools": {
      const toolEntries: SitemapUrl[] = TOOLS.filter((t) => t.live && !t.href).map((t) => ({
        loc: `${base}/tools/${t.slug}`,
        lastmod: now,
        changefreq: "monthly",
        priority: 0.7,
      }));
      const quranEntries: SitemapUrl[] = SURAHS.map((s) => ({
        loc: `${base}/tools/quran/${s.n}`,
        lastmod: now,
        changefreq: "yearly",
        priority: 0.6,
      }));
      return [...toolEntries, ...quranEntries];
    }

    default:
      return [];
  }
}

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

// URLs (esp. Unsplash/Supabase image URLs) can contain & — always escape.
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);
}

// Sitemap <loc>/<image:loc> must be ABSOLUTE. Blog feature images are stored as
// site-relative paths (e.g. /blog/<slug>.webp), so prefix them with the origin.
function absUrl(u: string): string {
  return /^https?:\/\//i.test(u) ? u : `${SITE.url}${u.startsWith("/") ? "" : "/"}${u}`;
}

/** Serialise a segment's URLs to a sitemap <urlset> document. */
export function urlsetXml(urls: SitemapUrl[]): string {
  const body = urls
    .map((u) => {
      const parts = [`    <loc>${esc(u.loc)}</loc>`];
      if (u.lastmod) parts.push(`    <lastmod>${u.lastmod}</lastmod>`);
      if (u.changefreq) parts.push(`    <changefreq>${u.changefreq}</changefreq>`);
      if (typeof u.priority === "number") parts.push(`    <priority>${u.priority.toFixed(1)}</priority>`);
      if (u.image) parts.push(`    <image:image><image:loc>${esc(absUrl(u.image))}</image:loc></image:image>`);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;
}

/** Serialise the sitemap index pointing at every segment child. */
export function sitemapIndexXml(): string {
  const base = SITE.url;
  const lastmod = new Date().toISOString();
  const body = SITEMAP_SEGMENTS.map(
    (s) => `  <sitemap>\n    <loc>${esc(`${base}/sitemap/${s}.xml`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}
