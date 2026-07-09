import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";
import { VendorList, caterers } from "@/components/weddings/vendor-list";

/* Hub 2 — "halal event catering (aqiqah/kenduri)" (100/mo, KD 0). */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Aqiqah & Kenduri Catering Singapore (${SEO_YEAR})`,
  description:
    "Aqiqah and kenduri catering in Singapore — halal caterers for kenduri arwah, doa selamat, aqiqah celebrations and home majlis, from mini buffets to full spreads.",
  path: "/aqiqah-kenduri-catering-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "What is aqiqah catering?", a: "Catering for the aqiqah — the celebration marking a child's birth, traditionally with the sacrifice of sheep/goats and a meal shared with family and the needy. In Singapore, families typically order aqiqah packages (often with the sacrifice performed overseas or locally arranged) plus catering for the home majlis." },
  { q: "What does kenduri catering include?", a: "Kenduri spreads — for doa selamat, kenduri arwah, housewarmings and thanksgivings — are usually mini buffets or dome service with nasi and classic lauk (ayam masak merah, rendang, sayur lodeh), plus kueh and drinks. Most caterers serve homes and void decks." },
  { q: "How much does it cost?", a: "Mini buffets for a home kenduri commonly start around $12–18 per pax with 20–30 pax minimums; nasi ambeng trays serve 4–5 and are priced per tray. Aqiqah packages (sacrifice + distribution) are priced per animal — confirm what documentation you receive." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[
        { name: "Halal catering", path: "/halal-catering-singapore" },
        { name: "Aqiqah & kenduri", path: "/aqiqah-kenduri-catering-singapore" },
      ]}
      h1={`Aqiqah & Kenduri Catering in Singapore (${SEO_YEAR})`}
      intro={
        <>
          <strong>Hosting an aqiqah, kenduri arwah or doa selamat?</strong> Halal caterers across Singapore serve home
          majlis with mini buffets from about $12–18 per pax and nasi ambeng trays for smaller gatherings — with aqiqah
          sacrifice packages arranged separately. Here&apos;s who to call.
        </>
      }
      sections={[
        {
          heading: "Kenduri caterers on Humble Halal",
          body: (
            <VendorList
              filter={caterers}
              listName="Aqiqah & Kenduri Caterers in Singapore"
              emptyNote="Verified kenduri caterers are being added to the directory."
            />
          ),
        },
      ]}
      links={[
        { label: "Halal catering (all)", href: "/halal-catering-singapore" },
        { label: "Malay catering", href: "/malay-catering-singapore" },
        { label: "Hari Raya catering", href: "/hari-raya-catering-singapore" },
        { label: "Request quotes", href: "/quotes" },
      ]}
      faq={FAQ}
    />
  );
}
