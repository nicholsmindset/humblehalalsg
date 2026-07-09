import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoScreen } from "@/components/screens/misc";
import {
  SEO_LOCATION_IDS,
  getSeoPageByLocation,
  seoListings,
  seoFaqItems,
  seoPageIndexable,
  seoPagePath,
} from "@/lib/seo-pages";
import { getDirectory } from "@/lib/directory";
import { pageMeta } from "@/lib/seo";
import { JsonLd, itemListJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";

/* Canonical home of the location factory (flat-URL migration): every
   `{place} halal food` page — malls, districts and curated areas — lives at
   /halal-food/[location]. Old /halal/halal-food-{in,at}-… URLs 301 here via
   next.config.ts. */
export function generateStaticParams() {
  return SEO_LOCATION_IDS.map((location) => ({ location }));
}

// Fixed page set ⇒ unknown locations are true 404s at the routing layer
// (notFound() inside the component would stream a soft 200 in this app).
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>;
}): Promise<Metadata> {
  const { location } = await params;
  const p = getSeoPageByLocation(location);
  if (!p) return pageMeta({ title: "Halal Food in Singapore", path: `/halal-food/${location}` });
  const indexable = seoPageIndexable(p, await getDirectory());
  return pageMeta({
    title: p.title || p.h1,
    description: p.intro,
    path: seoPagePath(p),
    absoluteTitle: true,
    index: indexable,
  });
}

export default async function Page({ params }: { params: Promise<{ location: string }> }) {
  const { location } = await params;
  const p = getSeoPageByLocation(location);
  if (!p) notFound();
  const all = await getDirectory();
  const matched = seoListings(p, all);
  return (
    <>
      <JsonLd
        data={[
          // ItemList only when there are REAL matches — an empty list would
          // assert unrelated businesses belong to this venue/area.
          ...(matched.length ? [itemListJsonLd(matched, p.h1)] : []),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Explore", path: "/explore" },
            { name: p.h1, path: seoPagePath(p) },
          ]),
          faqJsonLd(seoFaqItems(p)),
        ]}
      />
      <SeoScreen slug={p.slug} />
    </>
  );
}
