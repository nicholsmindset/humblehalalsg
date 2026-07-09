import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";
import { VendorList, byFragments } from "@/components/weddings/vendor-list";

/* Hub 2 — "bridal car rental singapore" (200/mo, KD 4). */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Bridal Car Rental Singapore (${SEO_YEAR}) — Wedding Cars & Prices`,
  description:
    "Wedding and bridal car rental in Singapore — typical rates by car class, what's included (decor, chauffeur, hours), and rental companies to compare.",
  path: "/wedding-bridal-car-rental-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "How much does bridal car rental cost in Singapore?", a: "Chauffeured bridal cars commonly run $250–$600 for a standard booking (3–5 hours) in executive sedans, and $600–$1,500+ for luxury and exotic marques. Self-drive rentals are cheaper but confirm insurance covers wedding use and decorations." },
  { q: "What's included in a bridal car package?", a: "Typically a chauffeur, basic ribbon-and-flower decor, and a set number of hours/stops (fetch bride, solemnisation, venue). Extra hours, additional stops and custom florals are add-ons — agree the route beforehand." },
  { q: "When should we book the bridal car?", a: "2–4 months ahead is usually enough, earlier for luxury models and peak weekends. Reconfirm timing the week of the wedding and share the day-of contact with your best man or coordinator." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[
        { name: "Malay wedding guide", path: "/malay-wedding-singapore" },
        { name: "Bridal car rental", path: "/wedding-bridal-car-rental-singapore" },
      ]}
      h1={`Bridal Car Rental in Singapore (${SEO_YEAR})`}
      intro={
        <>
          <strong>Chauffeured bridal cars in Singapore typically cost $250–$600</strong> for a standard 3–5 hour booking —
          climbing for luxury marques — including a driver and basic wedding decor. Here&apos;s what packages include and the
          rental companies to compare.
        </>
      }
      sections={[
        {
          heading: "Car rental & transport vendors",
          body: (
            <VendorList
              filter={byFragments("car", "rental", "transport", "limo")}
              listName="Bridal Car Rental Companies in Singapore"
              emptyNote="Verified bridal car rental companies are being added to the directory."
            />
          ),
        },
      ]}
      links={[
        { label: "Wedding packages & costs", href: "/malay-wedding-packages-singapore" },
        { label: "Wedding photography", href: "/malay-wedding-photography-singapore" },
        { label: "The complete Malay wedding guide", href: "/malay-wedding-singapore" },
        { label: "Request quotes", href: "/quotes" },
      ]}
      faq={FAQ}
    />
  );
}
