import type { MetadataRoute } from "next";
import { getDirectory } from "@/lib/directory";
import { getEvents } from "@/lib/events-source";
import { allSeoPages } from "@/lib/seo-pages";
import { allBrands } from "@/lib/halal-status";
import { allPosts } from "@/lib/blog";
import { allCategories } from "@/lib/blog-categories";
import { allTravelHubs } from "@/lib/travel-hubs";
import { TOOLS } from "@/lib/tools";
import { SURAHS } from "@/lib/tools/surahs";
import { SITE } from "@/lib/seo";

const PUBLIC_STATIC = [
  "/",
  "/explore",
  "/map",
  "/mosques",
  "/tools",
  "/halal",
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  const now = new Date();
  const [listings, eventsList] = await Promise.all([getDirectory(), getEvents()]);

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_STATIC.map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  const listingEntries: MetadataRoute.Sitemap = listings.map((l) => ({
    url: `${base}/business/${l.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
    images: l.image ? [l.image] : undefined,
  }));

  const eventEntries: MetadataRoute.Sitemap = eventsList.map((e) => ({
    url: `${base}/events/${e.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
    images: e.img ? [e.img] : undefined,
  }));

  const seoEntries: MetadataRoute.Sitemap = allSeoPages().map((p) => ({
    url: `${base}/halal/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const brandEntries: MetadataRoute.Sitemap = allBrands().map((b) => ({
    url: `${base}/is-halal/${b.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const blogEntries: MetadataRoute.Sitemap = allPosts().map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.dateModified || p.datePublished),
    changeFrequency: "monthly",
    priority: 0.7,
    images: p.image ? [p.image] : undefined,
  }));

  const blogCatEntries: MetadataRoute.Sitemap = allCategories().map((c) => ({
    url: `${base}/blog/category/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
    images: c.heroImage ? [c.heroImage] : undefined,
  }));

  const travelEntries: MetadataRoute.Sitemap = allTravelHubs().map((h) => ({
    url: `${base}/travel/${h.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const toolEntries: MetadataRoute.Sitemap = TOOLS.filter((t) => t.live && !t.href).map((t) => ({
    url: `${base}/tools/${t.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const quranEntries: MetadataRoute.Sitemap = SURAHS.map((s) => ({
    url: `${base}/tools/quran/${s.n}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [
    ...staticEntries,
    ...listingEntries,
    ...eventEntries,
    ...seoEntries,
    ...brandEntries,
    ...blogEntries,
    ...blogCatEntries,
    ...travelEntries,
    ...toolEntries,
    ...quranEntries,
  ];
}
