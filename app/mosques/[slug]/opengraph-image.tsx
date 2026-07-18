/* Dynamic per-mosque OG card (branded 1200×630 share image). Renders the mosque
   name + area on the brand card so link previews for /mosques/<slug> are
   on-brand instead of the generic site OG. */
import { ImageResponse } from "next/og";
import { mosqueBySlug } from "@/lib/mosques";
import { profiledMosqueSlugs } from "@/lib/mosque-content";
import { OgCard } from "@/components/og/card";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Mosque in Singapore — Humble Halal";

// Pre-render one card per profiled mosque (matches the page's static set) so the
// schema/sitemap image URLs resolve to a built PNG rather than on-demand only.
export function generateStaticParams() {
  return profiledMosqueSlugs().map((slug) => ({ slug }));
}
export const dynamicParams = false;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = mosqueBySlug(slug);
  const title = m?.name || "Mosque in Singapore";
  const kicker = m ? `Mosque · ${m.area}` : "Mosque";
  return new ImageResponse(
    OgCard({ kicker, title, subtitle: "Prayer times · Jumu'ah · Qibla · Directions" }),
    { ...size },
  );
}
