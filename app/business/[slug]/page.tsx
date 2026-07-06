import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailScreen } from "@/components/screens/consumer";
import { getDirectory, getListingBySlug, getGoneBusinessMeta } from "@/lib/directory";
import { businessRedirectTarget, recordRedirect } from "@/lib/redirects";
import { pageMeta } from "@/lib/seo";
import { joinParts } from "@/lib/format";
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
  const certified = l.certified ? "MUIS / verified halal" : "halal-friendly";
  const reviewLine = l.reviews > 0 ? ` ${l.rating}★ from ${l.reviews} reviews.` : "";
  return pageMeta({
    title: joinParts([l.name, joinParts([l.cuisine, l.area], ", ")], " — "),
    description: `${l.blurb} ${certified} listing in ${l.area}, Singapore.${reviewLine}`,
    path: `/business/${l.slug}`,
    image: l.image,
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = await getListingBySlug(slug);
  if (!l) {
    // Gone (suspended/closed): self-heal a durable 301 so the next request 308s
    // (in middleware) to a relevant hub. Never-existed → honest not-found.
    const meta = await getGoneBusinessMeta(slug);
    if (meta) await recordRedirect(`/business/${slug}`, businessRedirectTarget(meta.catId, meta.area), "business");
    notFound();
  }
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
