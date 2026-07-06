import { SITEMAP_SEGMENTS, isSitemapSegment, segmentUrls, urlsetXml } from "@/lib/sitemaps";

// Per-section sitemap at /sitemap/<segment>.xml (e.g. /sitemap/blog.xml).
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return SITEMAP_SEGMENTS.map((s) => ({ seg: `${s}.xml` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ seg: string }> }) {
  const { seg } = await params;
  const id = seg.replace(/\.xml$/, "");
  if (!isSitemapSegment(id)) {
    return new Response("Not found", { status: 404 });
  }
  const urls = await segmentUrls(id);
  return new Response(urlsetXml(urls), {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
