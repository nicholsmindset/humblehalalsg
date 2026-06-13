/* Humble Halal — JSON-LD structured data (server component + builders). */
import { SITE } from "@/lib/seo";
import type { EventItem, Listing } from "@/lib/types";
import type { Hotel } from "@/lib/halal-hotels";

export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // structured data is static, server-rendered, and trusted
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    legalName: SITE.org.legalName,
    url: SITE.url,
    description: SITE.description,
    logo: `${SITE.url}/icon.svg`,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.org.streetAddress,
      addressLocality: SITE.org.addressLocality,
      postalCode: SITE.org.postalCode,
      addressCountry: SITE.org.addressCountry,
    },
    areaServed: { "@type": "Country", name: "Singapore" },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/explore?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE.url}${it.path === "/" ? "" : it.path}`,
    })),
  };
}

const CAT_SCHEMA: Record<string, string> = {
  restaurants: "Restaurant",
  cafes: "CafeOrCoffeeShop",
  groceries: "GroceryStore",
  beauty: "BeautySalon",
  health: "MedicalBusiness",
  fashion: "ClothingStore",
  services: "HomeAndConstructionBusiness",
  automotive: "AutoRepair",
  weddings: "LocalBusiness",
  education: "EducationalOrganization",
  professional: "ProfessionalService",
  travel: "TravelAgency",
  "muslim-owned": "Store",
};

export function listingJsonLd(l: Listing) {
  const type = CAT_SCHEMA[l.catId] || "LocalBusiness";
  return {
    "@context": "https://schema.org",
    "@type": type,
    name: l.name,
    description: l.blurb,
    image: l.image,
    url: `${SITE.url}/business/${l.slug}`,
    telephone: l.phone || undefined,
    priceRange: l.price,
    address: {
      "@type": "PostalAddress",
      streetAddress: l.address,
      addressLocality: l.area,
      addressRegion: "Singapore",
      addressCountry: "SG",
    },
    ...(l.coords
      ? { geo: { "@type": "GeoCoordinates", latitude: l.coords.lat, longitude: l.coords.lng } }
      : {}),
    areaServed: { "@type": "City", name: "Singapore" },
    currenciesAccepted: "SGD",
    ...(["restaurants", "cafes"].includes(l.catId)
      ? { servesCuisine: l.cuisine.split("·").map((s) => s.trim()) }
      : {}),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: l.rating,
      reviewCount: l.reviews,
      bestRating: 5,
    },
    ...(l.certified && l.verify?.certNo
      ? {
          hasCredential: {
            "@type": "EducationalOccupationalCredential",
            credentialCategory: `${l.certBody} Halal Certification`,
            identifier: l.verify.certNo,
          },
        }
      : {}),
  };
}

export function eventJsonLd(e: EventItem) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.blurb,
    image: e.img,
    url: `${SITE.url}/events/${e.slug}`,
    startDate: e.dateISO,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: e.venue,
      address: { "@type": "PostalAddress", addressLocality: e.area, addressCountry: "SG" },
    },
    organizer: { "@type": "Organization", name: e.organiser },
    offers: {
      "@type": "Offer",
      price: e.free ? 0 : e.priceFrom,
      priceCurrency: "SGD",
      availability: e.soldOut
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      url: `${SITE.url}/events/${e.slug}`,
    },
  };
}

export function articleJsonLd(a: {
  headline: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.headline,
    description: a.description,
    url: `${SITE.url}${a.path}`,
    mainEntityOfPage: `${SITE.url}${a.path}`,
    ...(a.image ? { image: a.image } : {}),
    ...(a.datePublished ? { datePublished: a.datePublished } : {}),
    ...(a.dateModified || a.datePublished
      ? { dateModified: a.dateModified || a.datePublished }
      : {}),
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: `${SITE.url}/icon.svg` },
    },
  };
}

export function blogPostingJsonLd(p: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  wordCount?: number;
  section?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.headline,
    description: p.description,
    url: `${SITE.url}${p.path}`,
    mainEntityOfPage: `${SITE.url}${p.path}`,
    datePublished: p.datePublished,
    dateModified: p.dateModified || p.datePublished,
    author: { "@type": "Organization", name: p.author, url: SITE.url },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: { "@type": "ImageObject", url: `${SITE.url}/icon.svg` },
    },
    ...(p.wordCount ? { wordCount: p.wordCount } : {}),
    ...(p.section ? { articleSection: p.section } : {}),
    inLanguage: "en-SG",
  };
}

export function hotelJsonLd(h: Hotel) {
  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: h.name,
    ...(h.description ? { description: h.description.slice(0, 300) } : {}),
    ...(h.image ? { image: h.image } : {}),
    url: `${SITE.url}/travel/hotel/${h.id}`,
    ...(h.address || h.city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(h.address ? { streetAddress: h.address } : {}),
            ...(h.city ? { addressLocality: h.city } : {}),
            ...(h.country ? { addressCountry: h.country } : {}),
          },
        }
      : {}),
    ...(h.coords ? { geo: { "@type": "GeoCoordinates", latitude: h.coords.lat, longitude: h.coords.lng } } : {}),
    ...(h.stars ? { starRating: { "@type": "Rating", ratingValue: h.stars, bestRating: 5 } } : {}),
    ...(h.guestRating && h.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: h.guestRating,
            reviewCount: h.reviewCount,
            bestRating: 10,
          },
        }
      : {}),
    ...(h.priceFrom ? { priceRange: `${h.priceFrom.currency} ${Math.round(h.priceFrom.amount)}+` } : {}),
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

export function itemListJsonLd(listings: Listing[], name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: listings.length,
    itemListElement: listings.map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE.url}/business/${l.slug}`,
      name: l.name,
    })),
  };
}
