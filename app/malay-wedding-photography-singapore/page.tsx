import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";
import { VendorList, byFragments } from "@/components/weddings/vendor-list";

/* Hub 2 — "wedding photography package" (150/mo, KD 0). */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Malay Wedding Photography Singapore (${SEO_YEAR}) — Packages`,
  description:
    "Malay wedding photography and videography in Singapore — package price ranges, what coverage includes (nikah, sanding, outdoor), and photographers to book.",
  path: "/malay-wedding-photography-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "How much is Malay wedding photography in Singapore?", a: "Photography packages commonly run $1,500–$4,000 depending on hours, one or two shooters and deliverables; adding cinematic videography typically brings combined packages to $3,000–$6,000+. Same-day-edit videos and outdoor shoots are common add-ons." },
  { q: "What should the package cover?", a: "Nikah and sanding coverage as the core, with pre-event prep, outdoor/studio session and bertandang as options. Confirm hours, number of edited photos, full-resolution delivery, album inclusions and turnaround time." },
  { q: "One photographer or two?", a: "For a full majlis with 500+ rolling guests, two shooters (or photo + video team) keep both the couple and guest moments covered — especially during bersanding and makan beradab." },
  { q: "When should we book?", a: "9–15 months ahead for in-demand teams; peak weekend dates go first. Lock the timeline with your MUA and pelamin decorator so golden-hour shots fit the schedule." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[
        { name: "Malay wedding guide", path: "/malay-wedding-singapore" },
        { name: "Photography", path: "/malay-wedding-photography-singapore" },
      ]}
      h1={`Malay Wedding Photography in Singapore (${SEO_YEAR})`}
      intro={
        <>
          <strong>Malay wedding photography packages typically run $1,500–$4,000</strong> — covering the akad nikah and
          sanding with edited galleries, and $3,000–$6,000+ with cinematic videography. Here are the photographers and
          videographers to shortlist, and what a complete package includes.
        </>
      }
      sections={[
        {
          heading: "Photographers & videographers",
          body: (
            <VendorList
              filter={byFragments("photo", "video", "cinemat", "wedding")}
              listName="Malay Wedding Photographers in Singapore"
              emptyNote="Verified wedding photographers are being added to the directory."
            />
          ),
        },
      ]}
      links={[
        { label: "Wedding packages & costs", href: "/malay-wedding-packages-singapore" },
        { label: "Bridal makeup artists", href: "/malay-bridal-makeup-artists-singapore" },
        { label: "Bridal car rental", href: "/wedding-bridal-car-rental-singapore" },
        { label: "The complete Malay wedding guide", href: "/malay-wedding-singapore" },
      ]}
      faq={FAQ}
    />
  );
}
