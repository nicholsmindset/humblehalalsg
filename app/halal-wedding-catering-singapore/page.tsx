import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";
import { VendorList, caterers } from "@/components/weddings/vendor-list";

/* Hub 2 — "wedding catering singapore" (300/mo, KD 5) + "wedding catering
   halal" (150, KD 7) + "halal wedding catering singapore" (150, KD 45). */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Halal Wedding Catering Singapore (${SEO_YEAR}) — Caterers & Prices`,
  description:
    "Halal wedding catering in Singapore — caterers for Malay weddings and halal receptions, per-pax price ranges, menu formats (buffet, dome, makan beradab) and quotes.",
  path: "/halal-wedding-catering-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "How much is halal wedding catering per person?", a: "For Malay weddings, buffet catering commonly runs $12–20 per pax at volume (500–1,000 guests), with premium menus, dome service or makan beradab costing more. Most caterers quote as a package including warmers, service crew and setup — compare like for like." },
  { q: "What menu formats do wedding caterers offer?", a: "Buffet lines are standard for large majlis; dome (hidang) service seats guests at tables of 8–10 with shared platters; makan beradab is the formal plated tradition for the bridal table. Popular menus anchor on nasi minyak or briyani with ayam masak merah, daging rendang and sayur." },
  { q: "MUIS-certified or Muslim-owned — does it matter for weddings?", a: "Both are trusted choices; MUIS certification (Food Preparation Area scheme) is independently audited, which matters when in-laws and guests expect proof. Every caterer here is labelled — verify certificates on HalalSG." },
  { q: "When should we book wedding catering?", a: "12–18 months ahead for popular caterers and weekend dates. Tastings, menu finalisation and guest-count confirmation typically happen 1–3 months out." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[
        { name: "Halal catering", path: "/halal-catering-singapore" },
        { name: "Wedding catering", path: "/halal-wedding-catering-singapore" },
      ]}
      h1={`Halal Wedding Catering in Singapore (${SEO_YEAR})`}
      intro={
        <>
          <strong>Halal wedding catering in Singapore typically costs $12–20 per guest at majlis volume</strong> — for nasi
          minyak or briyani spreads with rendang, ayam masak merah and the full kenduri line-up. Here are the caterers to
          talk to, the menu formats, and what a fair quote includes.
        </>
      }
      sections={[
        {
          heading: "Wedding caterers on Humble Halal",
          body: (
            <VendorList
              filter={caterers}
              listName="Halal Wedding Caterers in Singapore"
              emptyNote="Verified wedding caterers are being added to the directory."
            />
          ),
        },
        {
          heading: "What a complete quote includes",
          body: (
            <ul style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
              <li>Menu with per-pax price at YOUR guest count (prices drop at volume)</li>
              <li>Buffet line(s), warmers, tables, skirting and deco level</li>
              <li>Service crew count and hours, plus overtime rates</li>
              <li>Setup/teardown times agreed with the venue</li>
              <li>Halal documentation — MUIS cert (check <a href="https://www.halal.gov.sg" target="_blank" rel="noopener noreferrer">HalalSG</a>) or ownership verification</li>
            </ul>
          ),
        },
      ]}
      links={[
        { label: "Malay wedding guide", href: "/malay-wedding-singapore" },
        { label: "Wedding packages & costs", href: "/malay-wedding-packages-singapore" },
        { label: "Malay catering", href: "/malay-catering-singapore" },
        { label: "Wedding buffet catering", href: "/wedding-buffet-catering-singapore" },
        { label: "Request quotes", href: "/quotes" },
      ]}
      faq={FAQ}
    />
  );
}
