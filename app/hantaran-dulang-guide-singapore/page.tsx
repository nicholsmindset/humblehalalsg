import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta, SITE } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";
import { VendorList, byFragments } from "@/components/weddings/vendor-list";

/* Hub 2 culture guide — "hantaran kahwin" (150/mo, KD 0, fires AI Overview). */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Hantaran & Dulang Guide Singapore (${SEO_YEAR})`,
  description:
    "Hantaran explained for Singapore couples — typical amounts, what goes on the dulang trays, how many trays each side gives, and where to get trays decorated.",
  path: "/hantaran-dulang-guide-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "What is hantaran?", a: "Hantaran is the customary exchange of gifts between the bride's and groom's families in a Malay wedding — headline being the wang hantaran (gift sum) plus gift trays (dulang) of items like attire, shoes, perfume, chocolates and the Quran. It's tradition, not a religious obligation — unlike mas kahwin." },
  { q: "How much is hantaran in Singapore?", a: "There's no fixed rule — commonly $8,000–$15,000+ depending on families' agreement and means. Discuss it early and honestly; it's a gift between families, not a price." },
  { q: "How many dulang trays do we need?", a: "Trays are exchanged in odd numbers — commonly the groom gives 7, 9 or 11 trays and the bride returns two more than received (e.g. 9 for 7). Typical contents: baju, shoes, bag, perfume, skincare, chocolates or fruits, sirih junjung, and the Quran and telekung for the bride." },
  { q: "Where do couples get dulang decorated?", a: "Bridal houses and dedicated dulang decorators offer tray rental and gift styling, or DIY with rented trays. Book alongside your bridal package 3–6 months out." },
];

export default function Page() {
  return (
    <ContentPage
      leadVertical="weddings"
      crumbs={[
        { name: "Malay wedding guide", path: "/malay-wedding-singapore" },
        { name: "Hantaran & dulang", path: "/hantaran-dulang-guide-singapore" },
      ]}
      h1="Hantaran & Dulang — The Singapore Guide"
      intro={
        <>
          <strong>Hantaran is the customary gift exchange of a Malay wedding</strong> — the agreed wang hantaran plus
          odd-numbered dulang trays of gifts flowing both ways between families. It&apos;s adat (custom), distinct from the
          obligatory <Link href="/mas-kahwin-guide-singapore">mas kahwin</Link>. Here&apos;s how amounts, trays and
          etiquette work in Singapore.
        </>
      }
      sections={[
        {
          heading: "Classic dulang contents",
          body: (
            <ul style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
              <li><strong>To the bride</strong> — Quran & telekung, baju/kain, shoes & bag, perfume, skincare/cosmetics, chocolates or fruit, sirih junjung.</li>
              <li><strong>To the groom</strong> — baju melayu/kain samping, shoes, wallet or watch, perfume, snacks, sirih junjung.</li>
              <li><strong>Numbers</strong> — odd counts by custom; the bride&apos;s side returns two trays more than received.</li>
            </ul>
          ),
        },
        {
          heading: "Dulang & bridal-gift vendors",
          body: (
            <VendorList
              filter={byFragments("bridal", "wedding", "gift", "dulang", "henna")}
              listName="Hantaran & Bridal Gift Vendors in Singapore"
              emptyNote="Verified dulang and bridal-gift vendors are being added to the directory."
            />
          ),
        },
      ]}
      links={[
        { label: "Mas kahwin guide", href: "/mas-kahwin-guide-singapore" },
        { label: "Baju nikah & attire", href: "/baju-nikah-attire-singapore" },
        { label: "The complete Malay wedding guide", href: "/malay-wedding-singapore" },
        { label: "Wedding packages & costs", href: "/malay-wedding-packages-singapore" },
      ]}
      faq={FAQ}
      extraJsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `Hantaran & Dulang Guide Singapore (${SEO_YEAR})`,
          author: { "@type": "Organization", name: SITE.name },
          publisher: { "@type": "Organization", name: SITE.name },
          mainEntityOfPage: `${SITE.url}/hantaran-dulang-guide-singapore`,
        },
      ]}
    />
  );
}
