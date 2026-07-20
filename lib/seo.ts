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
  // Brand palette — single source of truth so the manifest, viewport theme-color
  // and any icon generator stay in sync (previously #12525B was hardcoded in 3+ places).
  themeColor: "#12525B",
  backgroundColor: "#F8F6F1",
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
  /** Blog posts / articles: emits og:type=article + article:published_time /
      modified_time / section so scrapers classify the page correctly. */
  article?: { publishedTime?: string; modifiedTime?: string; section?: string };
  /** Override the canonical URL (absolute or root-relative). Defaults to `path`.
      Used by CMS per-post canonical overrides — leave unset for self-canonical. */
  canonical?: string;
  /** hreflang alternates — language code → URL (root-relative or absolute;
      absolutized against SITE.url like canonical). Used by the EN↔MS translation
      pairs (lib/ms-pages). Both sides of a pair must declare the SAME map
      (Google's hreflang reciprocity rule), including the page's own language
      and an "x-default" entry. Untouched callers emit canonical-only, as before. */
  languages?: Record<string, string>;
}

/** Build per-page Metadata with canonical + Open Graph + Twitter in one line. */
export function pageMeta({
  title,
  description = SITE.description,
  path = "/",
  image,
  index = true,
  absoluteTitle = false,
  article,
  canonical: canonicalOverride,
  languages,
}: PageMetaInput): Metadata {
  // Absolute canonical/OG URL (robust even if metadataBase is ever absent).
  // A CMS override (absolute or root-relative) wins over the self-canonical path.
  const canonical = new URL(canonicalOverride || path, SITE.url).toString();
  // hreflang map, absolutized the same way — only emitted when provided so every
  // existing caller's <head> output is byte-identical.
  const languageAlternates = languages
    ? Object.fromEntries(
        Object.entries(languages).map(([code, href]) => [code, new URL(href, SITE.url).toString()]),
      )
    : undefined;
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
    alternates: {
      canonical,
      ...(languageAlternates ? { languages: languageAlternates } : {}),
    },
    robots: index ? undefined : { index: false, follow: false },
    openGraph: {
      siteName: SITE.name,
      title,
      description,
      url: canonical,
      locale: SITE.locale,
      images,
      ...(article
        ? {
            type: "article" as const,
            publishedTime: article.publishedTime,
            modifiedTime: article.modifiedTime || article.publishedTime,
            section: article.section,
          }
        : { type: "website" as const }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}
