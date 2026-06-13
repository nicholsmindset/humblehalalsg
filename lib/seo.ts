/* Humble Halal — SEO helpers + site constants */
import type { Metadata } from "next";

export const SITE = {
  name: "Humble Halal",
  shortName: "Humble Halal",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://humblehalal.com",
  tagline: "Singapore's trusted halal & Muslim-owned business directory",
  description:
    "Discover halal restaurants, cafés, Muslim-owned businesses, services and community-friendly places across Singapore. A discovery platform — not a certifier.",
  locale: "en_SG",
  twitter: "@humblehalalsg",
  org: {
    legalName: "ONN GROUP LLP",
    streetAddress: "60 Paya Lebar Road, #06-28 Paya Lebar Square",
    addressLocality: "Singapore",
    postalCode: "409051",
    addressCountry: "SG",
  },
} as const;

interface PageMetaInput {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  index?: boolean;
}

/** Build per-page Metadata with canonical + Open Graph + Twitter in one line. */
export function pageMeta({
  title,
  description = SITE.description,
  path = "/",
  image,
  index = true,
}: PageMetaInput): Metadata {
  const canonical = path;
  const images = image ? [{ url: image }] : undefined;
  return {
    title,
    description,
    alternates: { canonical },
    robots: index ? undefined : { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      title,
      description,
      url: canonical,
      locale: SITE.locale,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
