import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListingBySlug } from "@/lib/directory";
import { PosterClient } from "@/components/business/poster-client";

/* Printable shopfront poster for owners — noindex (utility page, not SEO). */
export const metadata: Metadata = { robots: { index: false, follow: false } };

function statusLabel(l: Awaited<ReturnType<typeof getListingBySlug>>): string {
  if (!l) return "On Humble Halal";
  if (l.certBody === "MUIS") return "MUIS Certified Halal";
  if (l.badges?.includes("owned")) return "Muslim-Owned";
  if (l.certified) return "Verified Halal";
  return "On Humble Halal";
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = await getListingBySlug(slug);
  if (!l) notFound();
  return <PosterClient slug={l.slug || slug} name={l.name} statusLabel={statusLabel(l)} />;
}
