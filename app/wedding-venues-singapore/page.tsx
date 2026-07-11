import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";
import { VendorList, byFragments } from "@/components/weddings/vendor-list";

/* Hub 2 — "wedding venue singapore" (400/mo, KD 5) — halal-friendly angle. */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Wedding Venues Singapore (${SEO_YEAR}) — Halal-Friendly Options`,
  description:
    "Halal-friendly wedding venues in Singapore — event spaces, halls, gardens and hotels that welcome halal caterers, compared by capacity and budget.",
  path: "/wedding-venues-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "Which wedding venues in Singapore are halal-friendly?", a: "Venues that allow external halal-certified caterers (or have MUIS-certified kitchens), don't mandate alcohol packages, and can accommodate prayer breaks — from CC halls and styled event spaces to selected hotels. Always confirm catering policy in writing." },
  { q: "How much do wedding venues cost?", a: "CC halls run several hundred to a few thousand dollars; styled event spaces $500–$2,500+ per block; hotel ballrooms price per table (often $1,000–$2,000+ per table of 10). Venue + catering is the bulk of any wedding budget." },
  { q: "Do hotels allow external halal caterers?", a: "Some do for halal weddings, others have their own MUIS-certified kitchens or halal menus — policies vary widely. Ask specifically: MUIS-certified kitchen? external caterer surcharge? alcohol-free reception fine?" },
];

export default function Page() {
  return (
    <ContentPage
      leadVertical="weddings"
      crumbs={[{ name: "Wedding venues", path: "/wedding-venues-singapore" }]}
      h1={`Wedding Venues in Singapore (${SEO_YEAR}) — Halal-Friendly`}
      intro={
        <>
          <strong>The best halal-friendly wedding venues share three traits</strong>: freedom to bring your halal-certified
          caterer, no alcohol-package requirements, and logistics that respect prayer times. From CC halls to styled spaces
          and hotel ballrooms — here&apos;s how they compare and what to confirm.
        </>
      }
      sections={[
        {
          heading: "Venues on Humble Halal",
          body: (
            <VendorList
              filter={byFragments("venue", "event space", "hall", "hotel", "garden")}
              listName="Halal-Friendly Wedding Venues in Singapore"
              emptyNote="Verified wedding venues are being added to the directory."
            />
          ),
        },
        {
          heading: "Malay wedding? Start here instead",
          body: (
            <p>
              Planning a majlis? The <Link href="/malay-wedding-venues-singapore">Malay wedding venues guide</Link> covers
              CCs, void decks and pavilions with booking channels (onePA, town councils) — usually the better-value path for
              500+ guests.
            </p>
          ),
        },
      ]}
      links={[
        { label: "Malay wedding venues (CCs & more)", href: "/malay-wedding-venues-singapore" },
        { label: "Event spaces for rent", href: "/event-spaces-singapore" },
        { label: "Halal wedding catering", href: "/halal-wedding-catering-singapore" },
        { label: "The complete Malay wedding guide", href: "/malay-wedding-singapore" },
      ]}
      faq={FAQ}
    />
  );
}
