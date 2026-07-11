import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailScreen } from "@/components/screens/consumer";
import { getDirectory, getListingBySlug } from "@/lib/directory";
import { pageMeta } from "@/lib/seo";
import { joinParts } from "@/lib/format";
import {
  JsonLd,
  listingJsonLd,
  breadcrumbJsonLd,
} from "@/components/seo/json-ld";

// Prerendering all ~330 businesses at build time dominates Vercel build CPU.
// Eagerly build only the highest-signal listings (certified, then most
// reviewed) — every other slug still exists (dynamicParams stays true) and
// renders + caches on its first real request instead of at build time.
export const dynamicParams = true;
export const revalidate = 3600;

const EAGER_BUSINESS_COUNT = 25;

export async function generateStaticParams() {
  const listings = await getDirectory();
  const ranked = [...listings].sort((a, b) => {
    if (a.certified !== b.certified) return a.certified ? -1 : 1;
    if (b.reviews !== a.reviews) return b.reviews - a.reviews;
    return b.rating - a.rating;
  });
  return ranked.slice(0, EAGER_BUSINESS_COUNT).map((l) => ({ slug: l.slug as string }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const l = await getListingBySlug(slug);
  if (!l) return pageMeta({ title: "Business", path: `/business/${slug}`, index: false });
  const certified = l.certified ? "MUIS / verified halal" : "halal-friendly";
  const reviewLine = l.reviews > 0 ? ` ${l.rating}★ from ${l.reviews} reviews.` : "";
  return pageMeta({
    // Prefer admin-approved AI-enriched SEO when present; else the computed default.
    title: l.seoTitle || joinParts([l.name, joinParts([l.cuisine, l.area], ", ")], " — "),
    description: l.seoDescription || `${l.blurb} ${certified} listing in ${l.area}, Singapore.${reviewLine}`,
    path: `/business/${l.slug}`,
    image: l.image,
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = await getListingBySlug(slug);
  if (!l) notFound(); // unknown slug → clean 404 (used to render the first listing)
  return (
    <>
      {l && (
        <JsonLd
          data={[
            listingJsonLd(l),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Explore", path: "/explore" },
              { name: l.name, path: `/business/${l.slug}` },
            ]),
          ]}
        />
      )}
      <DetailScreen />
    </>
  );
}
