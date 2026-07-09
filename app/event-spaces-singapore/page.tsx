import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";
import { VendorList, byFragments } from "@/components/weddings/vendor-list";

/* Hub 2 — "event space singapore" (1.4k/mo, KD 26) + "event space rental
   singapore" (600, KD 26). Muslim-friendly angle differentiates. */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Event Spaces Singapore (${SEO_YEAR}) — Halal-Friendly Venues`,
  description:
    "Event spaces for rent in Singapore — halal-friendly venues for weddings, kenduri, birthdays and corporate events, with capacity, catering rules and prayer-space notes.",
  path: "/event-spaces-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "How much does it cost to rent an event space in Singapore?", a: "Community spaces and studios start from about $50–150 per hour; styled event spaces commonly run $500–$2,500 per event block; hotel function rooms price per table or per head. Weekend evenings command the premium." },
  { q: "What makes an event space halal-friendly?", a: "Freedom to bring in halal-certified caterers (no mandatory in-house non-halal catering), no alcohol requirement, and ideally a clean corner for prayers with nearby wudhu access. Always confirm catering rules before paying a deposit." },
  { q: "Can I hold a Malay wedding at an event space?", a: "Yes — styled event spaces are an increasingly popular middle path between CC halls and hotels for intimate weddings (50–200 pax). Check power for warmers, load-in access for the pelamin, and end-time rules." },
  { q: "What should I confirm before booking?", a: "Capacity vs your format (banquet vs standing), external-caterer policy, hours including setup/teardown, parking and accessibility, AV and mic availability, and cancellation terms." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[{ name: "Event spaces", path: "/event-spaces-singapore" }]}
      h1={`Event Spaces in Singapore (${SEO_YEAR}) — Halal-Friendly Venues`}
      intro={
        <>
          <strong>Looking for an event space that welcomes halal catering?</strong> From styled studios and lofts to
          function halls, Singapore has venues for kenduri, weddings, birthdays and corporate events — the key is external
          halal-caterer freedom and prayer-friendly logistics. Here&apos;s what rental costs and who to book.
        </>
      }
      sections={[
        {
          heading: "Venues & event spaces on Humble Halal",
          body: (
            <VendorList
              filter={byFragments("venue", "event space", "hall", "studio", "loft")}
              listName="Halal-Friendly Event Spaces in Singapore"
              emptyNote="Verified event spaces are being added to the directory."
            />
          ),
        },
        {
          heading: "Planning the event",
          body: (
            <p>
              Pair your space with <Link href="/halal-catering-singapore">halal catering</Link> early — caterer and venue
              availability decide your date more than anything else. Hosting something public? {""}
              <Link href="/host-event">List it on Humble Halal events</Link> to reach the community.
            </p>
          ),
        },
      ]}
      links={[
        { label: "Wedding venues", href: "/wedding-venues-singapore" },
        { label: "Malay wedding venues", href: "/malay-wedding-venues-singapore" },
        { label: "Halal catering", href: "/halal-catering-singapore" },
        { label: "Host an event", href: "/host-event" },
      ]}
      faq={FAQ}
    />
  );
}
