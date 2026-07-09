import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";
import { VendorList, caterers } from "@/components/weddings/vendor-list";

/* Hub 2 — "malay catering singapore" (150/mo, KD 16). */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Malay Catering Singapore (${SEO_YEAR}) — Nasi Minyak, Rendang & More`,
  description:
    "Malay catering in Singapore — nasi minyak, briyani, rendang and kampung-style spreads from halal caterers for weddings, kenduri, birthdays and office events.",
  path: "/malay-catering-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "What does Malay catering include?", a: "Signature spreads anchor on nasi minyak, nasi briyani or nasi ambeng with ayam masak merah, daging rendang, sambal goreng, sayur lodeh and achar — plus kueh and drinks. Most caterers offer mini buffets, full lines and dome (hidang) service." },
  { q: "How much does Malay catering cost?", a: "Mini buffets from about $12–18 per pax; wedding-scale buffet lines commonly $12–20 per pax at volume; nasi ambeng trays and dome sets are priced per tray/table. Setup, warmers and crew may be separate lines." },
  { q: "Is Malay catering halal?", a: "Malay caterers are overwhelmingly Muslim-owned and many hold MUIS certification — but always check the label on each listing and verify certificates on the MUIS HalalSG register, especially for corporate bookings." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[
        { name: "Halal catering", path: "/halal-catering-singapore" },
        { name: "Malay catering", path: "/malay-catering-singapore" },
      ]}
      h1={`Malay Catering in Singapore (${SEO_YEAR})`}
      intro={
        <>
          <strong>Malay catering is Singapore&apos;s kenduri backbone</strong> — nasi minyak and briyani spreads, rendang,
          sambal goreng and sayur lodeh, served mini-buffet to a full majlis line. Here are the caterers to call for
          weddings, kenduri arwah, birthdays and office events, with prices and halal labels.
        </>
      }
      sections={[
        {
          heading: "Malay caterers on Humble Halal",
          body: (
            <VendorList
              filter={caterers}
              listName="Malay Caterers in Singapore"
              emptyNote="Verified Malay caterers are being added to the directory."
            />
          ),
        },
      ]}
      links={[
        { label: "Halal catering (all)", href: "/halal-catering-singapore" },
        { label: "Wedding catering", href: "/halal-wedding-catering-singapore" },
        { label: "Aqiqah & kenduri catering", href: "/aqiqah-kenduri-catering-singapore" },
        { label: "Hari Raya catering", href: "/hari-raya-catering-singapore" },
        { label: "Request quotes", href: "/quotes" },
      ]}
      faq={FAQ}
    />
  );
}
