import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { allSeoPages, seoPagePath, SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";

/* B2B directory hub for "halal business singapore" (150/mo, KD 12) — routes
   into every category, area and vertical directory on the site. */

export const metadata: Metadata = pageMeta({
  title: `Halal Business Directory Singapore (${SEO_YEAR})`,
  description:
    "Singapore's halal business directory — MUIS-certified and Muslim-owned restaurants, caterers, services, shops and wedding vendors, organised by category and area.",
  path: "/halal-business-directory-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "What is the halal business directory?", a: "A structured directory of halal and Muslim-owned businesses in Singapore — food, catering, weddings, services, fashion, health and more — each labelled MUIS Certified, Muslim-Owned or self-declared with a halal-confidence score." },
  { q: "How do businesses get listed?", a: "Any halal or Muslim-owned business can list free via Add Your Business. Our team verifies halal status before the listing goes live; verified and featured tiers add more visibility." },
  { q: "Can I advertise to the halal market through Humble Halal?", a: "Yes — see the Advertise page for featured placement and sponsored slots (always labelled, never blended into organic rankings)." },
];

export default function Page() {
  const pages = allSeoPages();
  const catPages = pages.filter((p) => p.catId && !p.areaId);
  const areaPages = pages.filter((p) => p.kind === "area").slice(0, 12);
  return (
    <ContentPage
      crumbs={[
        { name: "For business", path: "/for-business" },
        { name: "Halal business directory", path: "/halal-business-directory-singapore" },
      ]}
      h1="Halal Business Directory Singapore"
      intro={
        <>
          <strong>Every halal and Muslim-owned business vertical in Singapore, in one directory</strong> — restaurants and
          cafés, caterers and wedding vendors, groceries, fashion, health, services and more. Each listing carries a clear
          halal label and confidence score, so consumers can choose with certainty and businesses get found.
        </>
      }
      links={[
        ...catPages.map((p) => ({ label: p.h1, href: seoPagePath(p) })),
        ...areaPages.map((p) => ({ label: p.h1, href: seoPagePath(p) })),
        { label: "Muslim-owned businesses", href: "/muslim-owned-businesses-singapore" },
        { label: "MUIS-certified directory", href: "/muis-halal-certified-directory" },
        { label: "List your business (free)", href: "/add-listing" },
        { label: "Advertise to the halal market", href: "/advertise" },
      ]}
      linksHeading="Browse the directory"
      faq={FAQ}
    />
  );
}
