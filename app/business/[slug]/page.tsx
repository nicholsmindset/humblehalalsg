import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailScreen } from "@/components/screens/consumer";
import { getDirectory, getListingBySlug } from "@/lib/directory";
import { pageMeta } from "@/lib/seo";
import { joinParts } from "@/lib/format";
import { muisUnbacked } from "@/lib/halal-score";
import {
  JsonLd,
  listingJsonLd,
  breadcrumbJsonLd,
} from "@/components/seo/json-ld";

export async function generateStaticParams() {
  return (await getDirectory()).map((l) => ({ slug: l.slug as string }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const l = await getListingBySlug(slug);
  if (!l) return pageMeta({ title: "Business", path: `/business/${slug}`, index: false });
  // "MUIS / verified" only when the claim is backed; register-sourced places
  // without a cert number on file say "MUIS-listed" (matches the on-page tier).
  const certified = l.certified ? (muisUnbacked(l) ? "MUIS-listed halal" : "MUIS / verified halal") : "halal-friendly";
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
      {/* Pass the server-resolved listing so hawker stalls (excluded from the
          client directory context) render their real, claimable page instead
          of a dead-end "not found". */}
      <DetailScreen initial={l} />
    </>
  );
}
