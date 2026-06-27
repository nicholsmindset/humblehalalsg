/* Humble Halal — SEO helpers + site constants */
import type { Metadata } from "next";

export const SITE = {
  name: "Humble Halal",
  shortName: "Humble Halal",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.humblehalal.com",
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
  /** When true, bypass the "%s | Humble Halal" template to keep a precise,
      keyword-first <title> (used for programmatic/SEO pages). */
  absoluteTitle?: boolean;
}

/** Build per-page Metadata with canonical + Open Graph + Twitter in one line. */
export function pageMeta({
  title,
  description = SITE.description,
  path = "/",
  image,
  index = true,
  absoluteTitle = false,
}: PageMetaInput): Metadata {
  // Absolute canonical/OG URL (robust even if metadataBase is ever absent).
  const canonical = new URL(path, SITE.url).toString();
  // Default to the branded site OG image (app/opengraph-image) when a page does
  // not supply its own. Because pageMeta defines openGraph, Next's file-based
  // opengraph-image convention is suppressed — so without this, pageMeta pages
  // render NO og:image at all (breaks social/chat link previews). Per-page
  // images (e.g. business/listing photos) still win when passed in.
  const ogImage = image || `${SITE.url}/opengraph-image`;
  const images = [{ url: ogImage }];
  return {
    title: absoluteTitle ? { absolute: title } : title,
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
      images: [ogImage],
    },
  };
}
