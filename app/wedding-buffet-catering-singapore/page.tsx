import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";
import { VendorList, caterers } from "@/components/weddings/vendor-list";

/* Hub 2 — "wedding buffet catering singapore" (200/mo, KD 4). */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Wedding Buffet Catering Singapore (${SEO_YEAR}) — Halal Options`,
  description:
    "Wedding buffet catering in Singapore — halal buffet lines for majlis and receptions, per-pax pricing at volume, menu ideas and caterers to book.",
  path: "/wedding-buffet-catering-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "How much does a wedding buffet cost per pax in Singapore?", a: "Halal wedding buffets commonly run $12–20 per pax at majlis volume (500+ guests) and $20–35 for smaller receptions with richer menus. Quotes bundle warmers, buffet-line setup and service crew — confirm inclusions before comparing." },
  { q: "How many buffet lines do we need?", a: "Rule of thumb: one buffet line per 150–250 guests in rolling attendance. Two lines keep queues short at a typical 500–800-pax majlis; add a dessert/kueh station to spread the flow." },
  { q: "Are wedding buffet caterers halal-certified?", a: "Many hold MUIS certification (Food Preparation Area scheme); others are established Muslim-owned kitchens. Every caterer here is labelled — verify certificates on the MUIS HalalSG register." },
];

export default function Page() {
  return (
    <ContentPage
      leadVertical="catering"
      crumbs={[
        { name: "Halal catering", path: "/halal-catering-singapore" },
        { name: "Wedding buffet catering", path: "/wedding-buffet-catering-singapore" },
      ]}
      h1={`Wedding Buffet Catering in Singapore (${SEO_YEAR})`}
      intro={
        <>
          <strong>Wedding buffet catering in Singapore runs $12–20 per guest at majlis volume</strong> — halal buffet lines
          with nasi minyak or briyani anchors, rendang and the full kenduri spread, plus warmers, crew and setup. Compare
          caterers below and quote several before locking your date.
        </>
      }
      sections={[
        {
          heading: "Wedding buffet caterers on Humble Halal",
          body: (
            <VendorList
              filter={caterers}
              listName="Wedding Buffet Caterers in Singapore"
              emptyNote="Verified wedding buffet caterers are being added to the directory."
            />
          ),
        },
      ]}
      links={[
        { label: "Halal wedding catering", href: "/halal-wedding-catering-singapore" },
        { label: "Buffet catering (all events)", href: "/halal-buffet-catering-singapore" },
        { label: "Malay wedding packages", href: "/malay-wedding-packages-singapore" },
        { label: "Request quotes", href: "/quotes" },
      ]}
      faq={FAQ}
    />
  );
}
