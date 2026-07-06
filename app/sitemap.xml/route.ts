import { sitemapIndexXml } from "@/lib/sitemaps";

// Sitemap index at /sitemap.xml — points crawlers and Search Console to the
// per-section children at /sitemap/<segment>.xml.
export const revalidate = 3600;

export function GET() {
  return new Response(sitemapIndexXml(), {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
