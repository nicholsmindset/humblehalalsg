import type { Metadata } from "next";
import { DetailScreen } from "@/components/screens/consumer";
import { getListing, listings } from "@/lib/data";
import { pageMeta } from "@/lib/seo";
import {
  JsonLd,
  listingJsonLd,
  breadcrumbJsonLd,
} from "@/components/seo/json-ld";

export function generateStaticParams() {
  return listings.map((l) => ({ slug: l.slug as string }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const l = getListing(slug);
  if (!l) return pageMeta({ title: "Business", path: `/business/${slug}`, index: false });
  const certified = l.certified ? "MUIS / verified halal" : "halal-friendly";
  return pageMeta({
    title: `${l.name} — ${l.cuisine}, ${l.area}`,
    description: `${l.blurb} ${certified} listing in ${l.area}, Singapore. ${l.rating}★ from ${l.reviews} reviews.`,
    path: `/business/${l.slug}`,
    image: l.image,
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = getListing(slug);
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
