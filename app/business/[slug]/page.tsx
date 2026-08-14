import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailScreen } from "@/components/screens/consumer";
import { getDirectory, getListingBySlug, getGoneBusinessMeta } from "@/lib/directory";
import { businessRedirectTarget, recordRedirect } from "@/lib/gone-redirects";
import { getHawkerCentre } from "@/lib/hawker";
import { pageMeta } from "@/lib/seo";
import { muisUnbacked } from "@/lib/halal-score";
import { businessMetaText } from "@/lib/business-seo";
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
  // Trust wording rule (owner): "halal …" describes FOOD; services and
  // professionals are "Muslim-owned" — never "halal dentist"/"halal lawyer".
  // Within food, keep certification honesty: "MUIS / verified" only when the
  // claim is backed; register-sourced places without a cert number say
  // "MUIS-listed" (matches the on-page tier); Muslim-owned (uncertified) food
  // says Muslim-owned, not halal.
  const isFood = ["restaurants", "cafes", "groceries"].includes(l.catId);
  const owned = l.badges?.includes("owned");
  const descriptor = l.certified
    ? (muisUnbacked(l) ? "MUIS-listed halal" : "MUIS / verified halal")
    : owned
      ? "Muslim-owned"
      : isFood
        ? "halal-friendly"
        : "Muslim-friendly";
  const generated = businessMetaText(l, descriptor);
  return pageMeta({
    // Prefer admin-approved AI-enriched SEO when present; else the computed default.
    title: l.seoTitle || generated.title,
    description: l.seoDescription || generated.description,
    path: `/business/${l.slug}`,
    // Real photo when we have one; else the branded per-listing OG card (the
    // dynamic route is otherwise shadowed by pageMeta's generic fallback).
    image: l.image || `/business/${l.slug}/opengraph-image`,
    // The generated title is already capped for the result page; adding the
    // root brand template would push it back over the practical limit.
    absoluteTitle: true,
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
  // Hawker stalls get a "back to centre" context line — resolve the centre name
  // server-side (null-safe: centre may be unpublished/missing).
  const centre = l.hawkerCentreId ? await getHawkerCentre(l.hawkerCentreId) : null;
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
      <DetailScreen initial={l} hawkerCentre={centre ? { id: centre.id, name: centre.name } : undefined} />
    </>
  );
}
