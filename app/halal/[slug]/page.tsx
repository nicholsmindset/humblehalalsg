import type { Metadata } from "next";
import { SeoScreen } from "@/components/screens/misc";
import { allSeoPages, getSeoPage, seoListings, seoFaqItems } from "@/lib/seo-pages";
import { pageMeta } from "@/lib/seo";
import { JsonLd, itemListJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";

export function generateStaticParams() {
  return allSeoPages().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getSeoPage(slug);
  if (!p) return pageMeta({ title: "Halal in Singapore", path: `/halal/${slug}` });
  return pageMeta({
    title: p.h1,
    description: p.intro,
    path: `/halal/${p.slug}`,
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getSeoPage(slug);
  return (
    <>
      {p && (
        <JsonLd
          data={[
            itemListJsonLd(seoListings(p), p.h1),
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
