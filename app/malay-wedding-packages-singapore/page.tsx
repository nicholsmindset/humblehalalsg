import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";
import { VendorList, weddingVendors } from "@/components/weddings/vendor-list";

/* Hub 2 — "malay wedding package" (150/mo, KD 0) + "wedding package singapore
   malay" (150, KD 0). */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Malay Wedding Packages Singapore (${SEO_YEAR}) — Costs & What's Included`,
  description:
    "Malay wedding packages in Singapore compared — what full packages include (catering, pelamin, bridal, photography), realistic price ranges and how to spot hidden costs.",
  path: "/malay-wedding-packages-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "How much is a Malay wedding package in Singapore?", a: "Full packages for a void deck or community club wedding typically range $15,000–$30,000 for 500–1,000 guests, covering catering, pelamin, bridal outfits and makeup, and photography. Smaller intimate packages start under $10,000; hotel packages run much higher per guest." },
  { q: "What's included in a Malay wedding package?", a: "The classic bundle: catering (buffet or dome service), pelamin and deco, bridal package (outfits, makeup, hairdo), photography/videography, and often PA system, kompang and bunga manggar. Confirm inclusions line by line — chairs, tentage, warmers and overtime are common extras." },
  { q: "Package or à la carte — which is better?", a: "Packages simplify coordination and usually price better than assembling the same vendors separately; à la carte gives control for couples with specific vendors in mind. Get 2–3 package quotes AND one à-la-carte estimate to compare honestly." },
  { q: "When should we book a package?", a: "12–18 months ahead for popular vendors and weekend dates — earlier for school-holiday months and dates near Hari Raya. Deposits are typically 10–30%." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[
        { name: "Malay wedding guide", path: "/malay-wedding-singapore" },
        { name: "Packages & costs", path: "/malay-wedding-packages-singapore" },
      ]}
      h1={`Malay Wedding Packages in Singapore (${SEO_YEAR})`}
      intro={
        <>
          <strong>A full Malay wedding package in Singapore typically costs $15,000–$30,000</strong> for a void deck or CC
          wedding of 500–1,000 guests — bundling catering, pelamin, bridal outfits and makeup, and photography. Here&apos;s
          what packages really include, how prices break down, and the questions that expose hidden costs.
        </>
      }
      sections={[
        {
          heading: "Typical package tiers",
          body: (
            <ul style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
              <li><strong>Intimate (&lt;150 pax)</strong> — from ~$8,000–$12,000: solemnisation-plus-reception at home, event space or restaurant; simplified pelamin and deco.</li>
              <li><strong>Classic (500–800 pax)</strong> — ~$15,000–$25,000: void deck/CC, full buffet, standard pelamin, bridal package, photo + video.</li>
              <li><strong>Premium (800–1,000+ pax or hotel)</strong> — $30,000 upwards: hotel ballroom or premium venue, upgraded menu and deco, extended photo/video coverage.</li>
            </ul>
          ),
        },
        {
          heading: "Questions that expose hidden costs",
          body: (
            <ol style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
              <li>Is <strong>tentage, tables, chairs and warmers</strong> included, and how many?</li>
              <li>What&apos;s the <strong>overtime rate</strong> if the majlis runs long?</li>
              <li>How many <strong>outfit changes</strong> and makeup sessions does the bridal package cover?</li>
              <li>Is the caterer <strong>MUIS-certified</strong> (Food Preparation Area scheme) or Muslim-owned — and can they show it?</li>
              <li>What happens to the deposit if the date must move?</li>
            </ol>
          ),
        },
        {
          heading: "Vendors offering packages",
          body: (
            <VendorList
              filter={weddingVendors}
              listName="Malay Wedding Package Vendors in Singapore"
              emptyNote="Verified package vendors are being added to the directory."
            />
          ),
        },
      ]}
      links={[
        { label: "The complete Malay wedding guide", href: "/malay-wedding-singapore" },
        { label: "Wedding venues", href: "/malay-wedding-venues-singapore" },
        { label: "Halal wedding catering", href: "/halal-wedding-catering-singapore" },
        { label: "Request quotes from vendors", href: "/quotes" },
      ]}
      faq={FAQ}
    />
  );
}
