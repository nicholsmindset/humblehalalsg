/* Dynamic per-post OG card (branded fallback / socialImage target). A post's
   hero photo is used as the OG image by default (see generateMetadata); this
   branded card is available at /blog/<slug>/opengraph-image and can be pinned via
   the post's `socialImage` override. */
import { ImageResponse } from "next/og";
import { getBlogPost } from "@/lib/cms-blog";
import { getCategory } from "@/lib/blog-categories";
import { OgCard } from "@/components/og/card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Humble Halal";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getBlogPost(slug);
  const kicker = (p && getCategory(p.category)?.name) || "Halal guide";
  const title = p?.metaTitle || p?.title || "Humble Halal";
  return new ImageResponse(OgCard({ kicker, title, subtitle: "humblehalal.com/blog" }), { ...size });
}
