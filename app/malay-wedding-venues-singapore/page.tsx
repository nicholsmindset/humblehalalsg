import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";
import { VendorList, byFragments } from "@/components/weddings/vendor-list";

/* Hub 2 — "malay wedding venue singapore" (150/mo, KD 0, fires AI Overview). */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Malay Wedding Venues Singapore (${SEO_YEAR}) — CCs, Halls & More`,
  description:
    "Where to hold a Malay wedding in Singapore — community clubs, void decks, event spaces and hotels compared by capacity, cost and practicality, plus how to book each.",
  path: "/malay-wedding-venues-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "Where can I hold a Malay wedding in Singapore?", a: "The main options: community clubs (CCs) and their multi-purpose halls, void decks and pavilions (booked via town councils), dedicated event spaces and wedding venues, restaurants for intimate receptions, and hotel ballrooms for premium weddings." },
  { q: "How much does a wedding venue cost?", a: "Void decks and pavilions are the most affordable (town-council rates, typically a few hundred dollars plus fittings). CC halls range from several hundred to a few thousand depending on size and hours. Event spaces and hotels price per event or per table and climb quickly." },
  { q: "How do I book a CC or void deck for a wedding?", a: "CC halls are booked through the People's Association (onePA) — popular halls open bookings months ahead and go fast. Void decks and HDB pavilions are booked via your town council; apply early and confirm what's allowed (tentage, cooking, hours)." },
  { q: "What should I check before booking a venue?", a: "Capacity vs your guest flow, catering access and prep space, prayer-friendly timing (Friday timings matter), parking and accessibility for elders, PA/noise rules and end-time, and wet-weather cover for open-air spaces." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[
        { name: "Malay wedding guide", path: "/malay-wedding-singapore" },
        { name: "Venues", path: "/malay-wedding-venues-singapore" },
      ]}
      h1={`Malay Wedding Venues in Singapore (${SEO_YEAR})`}
      intro={
        <>
          <strong>Malay weddings in Singapore happen in four kinds of venues</strong> — community clubs, void decks and
          pavilions, dedicated event spaces, and hotels. Each trades cost against capacity and convenience differently;
          here&apos;s how to choose and book, plus the venues and vendors to talk to.
        </>
      }
      sections={[
        {
          heading: "Venue types compared",
          body: (
            <ul style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
              <li><strong>Community clubs (CCs)</strong> — the modern default: sheltered halls, power and prep space, book via onePA. Mid-range cost, high convenience.</li>
              <li><strong>Void decks & pavilions</strong> — the heritage choice and most affordable; book via town council; needs tentage/fittings and wet-weather planning.</li>
              <li><strong>Event spaces</strong> — styled venues with packages; less setup work, higher cost. See <Link href="/event-spaces-singapore">event spaces</Link>.</li>
              <li><strong>Hotels & restaurants</strong> — per-table pricing, premium finish, smaller guest lists; confirm halal catering arrangements explicitly.</li>
            </ul>
          ),
        },
        {
          heading: "Venues & venue-adjacent vendors",
          body: (
            <VendorList
              filter={byFragments("venue", "event space", "hall", "wedding")}
              listName="Malay Wedding Venues in Singapore"
              emptyNote="Verified venues are being added to the directory."
            />
          ),
        },
      ]}
      links={[
        { label: "The complete Malay wedding guide", href: "/malay-wedding-singapore" },
        { label: "Packages & costs", href: "/malay-wedding-packages-singapore" },
        { label: "Event spaces for rent", href: "/event-spaces-singapore" },
        { label: "Halal wedding catering", href: "/halal-wedding-catering-singapore" },
      ]}
      faq={FAQ}
    />
  );
}
