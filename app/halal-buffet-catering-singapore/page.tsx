import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";
import { VendorList, caterers } from "@/components/weddings/vendor-list";

/* Hub 2 — "halal buffet catering singapore" (600/mo, KD 23). */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Halal Buffet Catering Singapore (${SEO_YEAR}) — Mini Buffets to Full Lines`,
  description:
    "Halal buffet catering in Singapore — mini buffets from ~$12/pax, full buffet lines with live stations, high-tea sets and corporate spreads from certified and Muslim-owned caterers.",
  path: "/halal-buffet-catering-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "How much is halal buffet catering per person?", a: "Mini buffets (self-collect or basic drop-off) start around $12–18 per pax. Full buffet lines with warmers, setup and service crew typically run $20–35 per pax, with live stations and premium menus higher. Minimum orders apply — commonly 20–30 pax for minis." },
  { q: "What's the difference between a mini buffet and a full buffet?", a: "Mini buffets are compact drop-off spreads with disposables — ideal for homes and offices. Full buffet lines add warmers, tables and skirting, service crew and on-site setup — the standard for weddings and big events." },
  { q: "Can I get a halal high-tea or breakfast buffet?", a: "Yes — most halal caterers run high-tea sets (kueh, finger food, noodles) and breakfast spreads (nasi lemak, mee siam, kueh) alongside lunch and dinner menus." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[
        { name: "Halal catering", path: "/halal-catering-singapore" },
        { name: "Buffet catering", path: "/halal-buffet-catering-singapore" },
      ]}
      h1={`Halal Buffet Catering in Singapore (${SEO_YEAR})`}
      intro={
        <>
          <strong>Halal buffet catering starts around $12–18 per person for mini buffets</strong> and $20–35 for full lines
          with setup and crew — from MUIS-certified caterers and Muslim-owned kitchens. Compare formats, menus and halal
          labels below, then get quotes in one go.
        </>
      }
      sections={[
        {
          heading: "Buffet caterers on Humble Halal",
          body: (
            <VendorList
              filter={caterers}
              listName="Halal Buffet Caterers in Singapore"
              emptyNote="Verified buffet caterers are being added to the directory."
            />
          ),
        },
      ]}
      links={[
        { label: "Halal catering (all)", href: "/halal-catering-singapore" },
        { label: "Wedding buffet catering", href: "/wedding-buffet-catering-singapore" },
        { label: "Halal buffet restaurants", href: "/halal-buffet-singapore" },
        { label: "Iftar & buka puasa", href: "/iftar-buka-puasa-singapore" },
        { label: "Request quotes", href: "/quotes" },
      ]}
      faq={FAQ}
    />
  );
}
