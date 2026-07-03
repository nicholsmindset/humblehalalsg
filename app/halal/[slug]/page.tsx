import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoScreen } from "@/components/screens/misc";
import { allSeoPages, getSeoPage, seoListings, seoFaqItems, seoPageIndexable } from "@/lib/seo-pages";
import { getDirectory } from "@/lib/directory";
import { pageMeta } from "@/lib/seo";
import { JsonLd, itemListJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";

export function generateStaticParams() {
  return allSeoPages().map((p) => ({ slug: p.slug }));
}

// The SEO page set is fixed at build time, so any slug not in
// generateStaticParams is a true 404 at the routing layer (real 404 status).
// This is what actually kills the old soft-404: notFound() inside the component
// still streams a 200 shell in this app, but dynamicParams:false 404s first.
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getSeoPage(slug);
  if (!p) return pageMeta({ title: "Halal in Singapore", path: `/halal/${slug}` });
  // Thin place-pages (below the real-listing threshold) are noindex — the pSEO
  // quality gate. getDirectory() is cache()d, so this shares Page()'s fetch.
  const indexable = seoPageIndexable(p, await getDirectory());
  return pageMeta({
    title: p.title || p.h1,
    description: p.intro,
    path: `/halal/${p.slug}`,
    absoluteTitle: true,
    index: indexable,
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getSeoPage(slug);
  // Unknown slugs used to render page-0's content with a 200 (soft duplicate).
  // Hard 404 instead — same pattern as /is-halal/[brand].
  if (!p) notFound();
  const all = await getDirectory();
  const matched = seoListings(p, all);
  return (
    <>
      {p && (
        <JsonLd
          data={[
            // ItemList only when there are REAL matches — an empty (or
            // formerly whole-directory) list asserted unrelated businesses
            // belonged to this venue/area.
            ...(matched.length ? [itemListJsonLd(matched, p.h1)] : []),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Explore", path: "/explore" },
              { name: p.h1, path: `/halal/${p.slug}` },
            ]),
            faqJsonLd(seoFaqItems(p)),
          ]}
        />
      )}
      <SeoScreen />
    </>
  );
}
