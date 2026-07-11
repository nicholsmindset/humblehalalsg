import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";
import { VendorList, caterers } from "@/components/weddings/vendor-list";

/* Hub 2 anchor — "halal catering" (900/mo, KD 12) + "halal catering singapore"
   (1.2k/mo, KD 52). Real folder replaces the old cuisine-template page (the
   app route wins over the afterFiles rewrite). */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Halal Catering Singapore (${SEO_YEAR}) — Caterers & Price Guide`,
  description:
    "Halal catering in Singapore — MUIS-certified and Muslim-owned caterers for weddings, corporate events, iftar and parties, with realistic per-pax prices and quote requests.",
  path: "/halal-catering-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "How much does halal catering cost in Singapore?", a: "Mini buffets typically start around $12–18 per person; full buffet lines with live stations, setup and warmers run $20–35+; premium wedding and corporate menus climb from there. Delivery, tentage and staffing are often line items — compare quotes carefully." },
  { q: "Is the catering MUIS halal-certified?", a: "Many caterers hold MUIS certification under the Food Preparation Area scheme; others are Muslim-owned without certification. Every caterer here is labelled — confirm certificates on the official MUIS HalalSG register before booking." },
  { q: "How far ahead should I book?", a: "2–4 weeks for ordinary dates, 2–3 months for weekends, and 12+ months for wedding dates. Ramadan iftar and Hari Raya weeks sell out earliest of all." },
  { q: "Do halal caterers handle corporate events?", a: "Yes — corporate spreads, seminar bentos, high-tea sets and iftar packages are standard offerings. MUIS-certified caterers are the safe default when the guest list is mixed or halal assurance is a hard requirement." },
];

export default function Page() {
  return (
    <ContentPage
      leadVertical="catering"
      crumbs={[{ name: "Halal catering", path: "/halal-catering-singapore" }]}
      h1={`Halal Catering in Singapore (${SEO_YEAR})`}
      intro={
        <>
          <strong>Halal catering in Singapore runs from $12–18 per person for mini buffets</strong> to premium wedding and
          corporate spreads — from MUIS-certified caterers and trusted Muslim-owned kitchens. Compare options below, check
          each caterer&apos;s halal label, and request quotes from several before you book.
        </>
      }
      sections={[
        {
          heading: "Caterers on Humble Halal",
          body: (
            <VendorList
              filter={caterers}
              listName="Halal Caterers in Singapore"
              emptyNote="Verified caterers are being added to the directory."
            />
          ),
        },
        {
          heading: "Choosing the right caterer",
          body: (
            <ol style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
              <li><strong>Match the format</strong> — mini buffet (10–40 pax), buffet line (40–1,000), dome/plated service for formal majlis, bento drops for offices.</li>
              <li><strong>Verify halal status</strong> — MUIS-certified (check HalalSG) or Muslim-owned; never settle for an unverifiable &quot;halal&quot; claim on a mixed kitchen.</li>
              <li><strong>Read the quote</strong> — warmers, tables, setup/teardown, delivery windows and overtime are where budgets quietly grow.</li>
              <li><strong>Taste if you can</strong> — established caterers run tasting sessions for wedding-scale bookings.</li>
            </ol>
          ),
        },
      ]}
      links={[
        { label: "Halal wedding catering", href: "/halal-wedding-catering-singapore" },
        { label: "Malay catering", href: "/malay-catering-singapore" },
        { label: "Buffet catering", href: "/halal-buffet-catering-singapore" },
        { label: "Hari Raya catering", href: "/hari-raya-catering-singapore" },
        { label: "Aqiqah & kenduri catering", href: "/aqiqah-kenduri-catering-singapore" },
        { label: "Request quotes", href: "/quotes" },
      ]}
      faq={FAQ}
    />
  );
}
