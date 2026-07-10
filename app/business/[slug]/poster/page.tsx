import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListingBySlug } from "@/lib/directory";
import { PosterClient } from "@/components/business/poster-client";
import { getServerFlags } from "@/lib/feature-flags";
import { muisUnbacked } from "@/lib/halal-score";

/* Printable shopfront poster for owners — noindex (utility page, not SEO). */
export const metadata: Metadata = { robots: { index: false, follow: false } };

function statusLabel(l: Awaited<ReturnType<typeof getListingBySlug>>): string {
  if (!l) return "On Humble Halal";
  // Print "MUIS Certified" ONLY with a certificate on file — this goes on a
  // physical shopfront, the one place an unbacked claim must never appear.
  if (l.certBody === "MUIS") return muisUnbacked(l) ? "Halal · MUIS-listed" : "MUIS Certified Halal";
  if (l.badges?.includes("owned")) return "Muslim-Owned";
  if (l.certified) return "Verified Halal";
  return "On Humble Halal";
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = await getListingBySlug(slug);
  if (!l) notFound();
  return <PosterClient slug={l.slug || slug} name={l.name} statusLabel={statusLabel(l)} collectEnabled={(await getServerFlags()).passport} />;
}
