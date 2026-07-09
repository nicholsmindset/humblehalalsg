import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta, SITE } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";
import { VendorList, byFragments } from "@/components/weddings/vendor-list";

/* Hub 2 — "baju nikah" (150/mo, KD 1). */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Baju Nikah Singapore (${SEO_YEAR}) — Styles, Rental & Custom`,
  description:
    "Baju nikah in Singapore — classic white kurung and modern nikah dress styles, rental vs custom-made costs, and the bridal houses to visit.",
  path: "/baju-nikah-attire-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "What is a baju nikah?", a: "The outfit worn for the akad nikah (solemnisation) — traditionally elegant and modest, most classically in white or soft tones: baju kurung or kebaya styles for the bride and baju melayu with samping for the groom. Many couples keep a simpler look for the nikah and change into grander sanding outfits." },
  { q: "Rent or custom-make — what does it cost?", a: "Rental from bridal houses typically runs a few hundred dollars including basic fitting; custom-made nikah dresses range from several hundred to a few thousand depending on fabric and work. Bridal packages often bundle nikah + sanding outfits with makeup." },
  { q: "What colours are appropriate?", a: "White and off-white remain the classic nikah choice, symbolising purity — but soft pastels, champagne and dusty tones are all common now. There's no religious colour requirement; modesty is the constant." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[
        { name: "Malay wedding guide", path: "/malay-wedding-singapore" },
        { name: "Baju nikah", path: "/baju-nikah-attire-singapore" },
      ]}
      h1="Baju Nikah in Singapore — Styles, Rental & Custom"
      intro={
        <>
          <strong>The baju nikah is the solemnisation outfit</strong> — classically white or soft-toned, modest and elegant:
          kurung and kebaya silhouettes for brides, baju melayu with samping for grooms. Here&apos;s what rental and custom
          cost in Singapore, and the bridal houses to visit.
        </>
      }
      sections={[
        {
          heading: "Bridal & attire vendors",
          body: (
            <VendorList
              filter={byFragments("bridal", "fashion", "attire", "tailor", "kurung", "kebaya")}
              listName="Baju Nikah & Bridal Attire Vendors in Singapore"
              emptyNote="Verified bridal attire vendors are being added to the directory."
            />
          ),
        },
      ]}
      links={[
        { label: "Malay wedding attire guide (full)", href: "/malay-wedding-attire-baju-guide" },
        { label: "Bridal makeup artists", href: "/malay-bridal-makeup-artists-singapore" },
        { label: "Hantaran & dulang guide", href: "/hantaran-dulang-guide-singapore" },
        { label: "The complete Malay wedding guide", href: "/malay-wedding-singapore" },
      ]}
      faq={FAQ}
      extraJsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `Baju Nikah Singapore (${SEO_YEAR}) — Styles, Rental & Custom`,
          author: { "@type": "Organization", name: SITE.name },
          publisher: { "@type": "Organization", name: SITE.name },
          mainEntityOfPage: `${SITE.url}/baju-nikah-attire-singapore`,
        },
      ]}
    />
  );
}
