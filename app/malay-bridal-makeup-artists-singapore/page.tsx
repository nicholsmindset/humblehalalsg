import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";
import { VendorList, byFragments } from "@/components/weddings/vendor-list";

/* Hub 2 — "bridal makeup artist singapore" (150/mo, KD 23). */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Malay Bridal Makeup Artists Singapore (${SEO_YEAR})`,
  description:
    "Malay bridal makeup artists (mak andam) in Singapore — what bridal makeup packages include, price ranges, wudhu-friendly options and MUAs to book.",
  path: "/malay-bridal-makeup-artists-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "How much does Malay bridal makeup cost in Singapore?", a: "Standalone bridal makeup commonly runs $250–$600 per look, with nikah + sanding packages (two looks, hairdo/hijab styling, touch-ups) from around $500–$1,200. Mak andam services bundled in bridal packages vary — confirm the number of looks included." },
  { q: "What does a mak andam do?", a: "Traditionally the mak andam prepares and beautifies the bride — today that means makeup, hairdo or hijab styling, outfit fitting and on-the-day styling, often with cultural touches like the merenjis preparation." },
  { q: "Are wudhu-friendly makeup options available?", a: "Yes — many MUAs offer wudhu-friendly and halal-conscious products on request (breathable, water-permeable formulations). Raise it at the trial if it matters to you." },
  { q: "When should we book a makeup artist?", a: "6–12 months ahead for sought-after MUAs, with a trial 1–3 months before the wedding. Weekend peak dates go first." },
];

export default function Page() {
  return (
    <ContentPage
      leadVertical="weddings"
      crumbs={[
        { name: "Malay wedding guide", path: "/malay-wedding-singapore" },
        { name: "Bridal makeup", path: "/malay-bridal-makeup-artists-singapore" },
      ]}
      h1={`Malay Bridal Makeup Artists in Singapore (${SEO_YEAR})`}
      intro={
        <>
          <strong>Bridal makeup for a Malay wedding typically runs $250–$600 per look</strong> — with nikah-plus-sanding
          packages from about $500–$1,200 including hairdo or hijab styling and touch-ups. Here are the MUAs and mak andam
          to book, and what to confirm before the trial.
        </>
      }
      sections={[
        {
          heading: "Makeup artists & bridal studios",
          body: (
            <VendorList
              filter={byFragments("makeup", "mua", "bridal", "beauty", "henna")}
              listName="Malay Bridal Makeup Artists in Singapore"
              emptyNote="Verified bridal makeup artists are being added to the directory."
            />
          ),
        },
      ]}
      links={[
        { label: "Baju nikah & attire", href: "/baju-nikah-attire-singapore" },
        { label: "Wedding photography", href: "/malay-wedding-photography-singapore" },
        { label: "Wedding packages & costs", href: "/malay-wedding-packages-singapore" },
        { label: "The complete Malay wedding guide", href: "/malay-wedding-singapore" },
      ]}
      faq={FAQ}
    />
  );
}
