import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta, SITE } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";
import { VendorList, weddingVendors } from "@/components/weddings/vendor-list";

/* Hub 2 pillar — "malay wedding" (450/mo, KD 0, fires AI Overview) +
   "singapore malay wedding" (150, KD 2). The cluster's internal-link anchor. */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Malay Wedding Singapore — Complete Guide (${SEO_YEAR})`,
  description:
    "Planning a Malay wedding in Singapore: the akad nikah and sanding explained, venue options, package costs, timeline and the halal vendors to book — all in one guide.",
  path: "/malay-wedding-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "What happens at a Malay wedding in Singapore?", a: "A Malay-Muslim wedding centres on the akad nikah — the solemnisation, where the groom, the bride's wali (guardian) and witnesses complete the marriage contract before a Kadi — followed by the sanding (reception), where the couple sit on the pelamin (dais) as 'raja sehari' (king and queen for a day), with a bersanding ceremony, blessings and a feast for guests." },
  { q: "How much does a Malay wedding cost in Singapore?", a: "Most couples budget between $15,000 and $50,000+. Void deck or community club weddings with full packages typically run $15k–30k for 500–1,000 guests; hotel weddings cost significantly more per guest. Packages usually bundle catering, pelamin, bridal outfits, makeup and photography." },
  { q: "Where do Malay weddings happen in Singapore?", a: "The classics: void decks and multi-purpose halls, community clubs (CCs), and event spaces — with hotels for smaller, premium receptions. CCs and dedicated wedding venues have largely replaced void decks for newer couples." },
  { q: "What is mas kahwin and how much is it?", a: "Mas kahwin is the obligatory marriage payment from groom to bride under Muslim law, set at a minimum of $100 in Singapore — distinct from hantaran (the gift/dowry), which couples agree separately, commonly $8,000–$15,000+." },
  { q: "How far ahead should we book vendors?", a: "12–18 months for popular caterers, venues and bridal houses — weekend dates in school-holiday months go first. Photography, pelamin and makeup artists are commonly booked 6–12 months out." },
];

export default function Page() {
  return (
    <ContentPage
      leadVertical="weddings"
      crumbs={[{ name: "Malay wedding guide", path: "/malay-wedding-singapore" }]}
      h1={`Malay Wedding in Singapore — The Complete Guide (${SEO_YEAR})`}
      intro={
        <>
          <strong>A Malay wedding in Singapore has two hearts: the akad nikah (solemnisation) and the sanding
          (reception)</strong> — where the couple reign as <em>raja sehari</em> on the pelamin, surrounded by family, dana
          and a halal feast. This guide covers the ceremonies, real costs, venues, timeline and every vendor you&apos;ll
          need to book.
        </>
      }
      sections={[
        {
          heading: "The ceremonies, in order",
          body: (
            <ul style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
              <li><strong>Merisik &amp; meminang</strong> — the families meet; the proposal is made and accepted.</li>
              <li><strong>Bertunang</strong> — the engagement: rings, <Link href="/hantaran-dulang-guide-singapore">hantaran trays (dulang)</Link> exchanged, date set.</li>
              <li><strong>Akad nikah</strong> — the solemnisation before a Kadi/Naib Kadi, with the wali and two witnesses; <Link href="/mas-kahwin-guide-singapore">mas kahwin</Link> is stated and the taklik pronounced. Registered with ROMM (Registry of Muslim Marriages).</li>
              <li><strong>Majlis sanding</strong> — the reception: the couple on the <Link href="/pelamin-wedding-dais-singapore">pelamin</Link>, bersanding, merenjis blessings, silat performance, and makan beradab or buffet for guests.</li>
              <li><strong>Bertandang</strong> — a second, smaller reception hosted by the groom&apos;s side (optional for many couples now).</li>
            </ul>
          ),
        },
        {
          heading: "What it costs (realistic 2026 ranges)",
          body: (
            <>
              <p>
                <strong>Full packages</strong> (catering + pelamin + bridal + photo/video, void deck or CC, 500–1,000
                guests): commonly <strong>$15,000–$30,000</strong>. <strong>À-la-carte</strong>: catering $12–20/pax,
                pelamin from ~$1,500, bridal (outfits + makeup) $2,000–5,000, photography $1,500–4,000. Hotels and premium
                venues push budgets well past $50,000. Always confirm what&apos;s inside a &quot;package&quot; — chairs,
                warmers, deco and overtime charges vary wildly.
              </p>
              <p style={{ marginTop: 10 }}>
                See <Link href="/malay-wedding-packages-singapore">Malay wedding packages</Link> for the full breakdown, and{" "}
                <Link href="/quotes">request quotes</Link> from several vendors before committing.
              </p>
            </>
          ),
        },
        {
          heading: "Wedding vendors on Humble Halal",
          body: (
            <VendorList
              filter={weddingVendors}
              listName="Malay Wedding Vendors in Singapore"
              emptyNote="Verified wedding vendors are being added to the directory."
            />
          ),
        },
      ]}
      links={[
        { label: "Malay wedding packages & costs", href: "/malay-wedding-packages-singapore" },
        { label: "Malay wedding venues", href: "/malay-wedding-venues-singapore" },
        { label: "Halal wedding catering", href: "/halal-wedding-catering-singapore" },
        { label: "Pelamin (wedding dais)", href: "/pelamin-wedding-dais-singapore" },
        { label: "Mas kahwin guide", href: "/mas-kahwin-guide-singapore" },
        { label: "Hantaran & dulang guide", href: "/hantaran-dulang-guide-singapore" },
        { label: "Baju nikah & attire", href: "/baju-nikah-attire-singapore" },
        { label: "Wedding photography", href: "/malay-wedding-photography-singapore" },
      ]}
      linksHeading="Plan every part"
      faq={FAQ}
      extraJsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `Malay Wedding in Singapore — The Complete Guide (${SEO_YEAR})`,
          author: { "@type": "Organization", name: SITE.name },
          publisher: { "@type": "Organization", name: SITE.name },
          mainEntityOfPage: `${SITE.url}/malay-wedding-singapore`,
        },
      ]}
    />
  );
}
