import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";
import { VendorList, byFragments } from "@/components/weddings/vendor-list";

/* Hub 2 — "pelamin" (150/mo, KD 0). */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Pelamin Singapore (${SEO_YEAR}) — Wedding Dais Rental & Prices`,
  description:
    "Pelamin (wedding dais) in Singapore — styles from minimalist to grand kampung glam, rental price ranges, what's included, and decorators to book.",
  path: "/pelamin-wedding-dais-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "What is a pelamin?", a: "The pelamin is the decorated dais where the couple sit during the bersanding — the visual centrepiece of a Malay wedding, from which they receive blessings as raja sehari. Styles range from minimalist floral arches to grand traditional sets." },
  { q: "How much does a pelamin cost in Singapore?", a: "Standalone pelamin rental commonly starts around $1,500–$3,000 for standard sets, with elaborate or custom builds higher. Many couples get the pelamin bundled inside a full wedding package — compare bundled vs standalone pricing." },
  { q: "What's included in pelamin rental?", a: "Typically the dais structure, backdrop and floral styling, couple's seats, carpet/walkway and basic lighting — with setup and teardown. Fresh flowers, custom signage and extra staging are common add-ons." },
  { q: "When should we book?", a: "6–12 months ahead for popular decorators, earlier for peak (school-holiday) weekends. Confirm venue access times with your CC or venue so setup fits the booking window." },
];

export default function Page() {
  return (
    <ContentPage
      leadVertical="weddings"
      crumbs={[
        { name: "Malay wedding guide", path: "/malay-wedding-singapore" },
        { name: "Pelamin", path: "/pelamin-wedding-dais-singapore" },
      ]}
      h1={`Pelamin (Wedding Dais) in Singapore (${SEO_YEAR})`}
      intro={
        <>
          <strong>The pelamin is the throne of the majlis</strong> — the decorated dais where the couple sit as raja sehari.
          Standard rentals start around $1,500–$3,000 in Singapore, or come bundled in full wedding packages. Here are the
          styles, prices and decorators to book.
        </>
      }
      sections={[
        {
          heading: "Pelamin & deco vendors",
          body: (
            <VendorList
              filter={byFragments("pelamin", "deco", "decor", "wedding", "event styling", "florist")}
              listName="Pelamin & Wedding Deco Vendors in Singapore"
              emptyNote="Verified pelamin decorators are being added to the directory."
            />
          ),
        },
      ]}
      links={[
        { label: "Wedding packages & costs", href: "/malay-wedding-packages-singapore" },
        { label: "Wedding venues", href: "/malay-wedding-venues-singapore" },
        { label: "The complete Malay wedding guide", href: "/malay-wedding-singapore" },
        { label: "Request quotes", href: "/quotes" },
      ]}
      faq={FAQ}
    />
  );
}
