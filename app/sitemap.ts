import type { MetadataRoute } from "next";
import { listings, events } from "@/lib/data";
import { allSeoPages } from "@/lib/seo-pages";
import { SITE } from "@/lib/seo";

const PUBLIC_STATIC = [
  "/",
  "/explore",
  "/map",
  "/mosques",
  "/halal",
  "/events",
  "/for-business",
  "/advertise",
  "/pricing",
  "/quotes",
  "/verify",
  "/disclaimer",
  "/suggest",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const now = new Date();

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

  const eventEntries: MetadataRoute.Sitemap = events.map((e) => ({
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

  return [...staticEntries, ...listingEntries, ...eventEntries, ...seoEntries];
}
