import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { ContentPage } from "@/components/seo/content-page";

/* Money page for "halal marketing agency" (100/mo, KD 10, CPC $2) — routes
   commercial intent into /advertise + /growth-partner + listings. */

export const metadata: Metadata = pageMeta({
  title: "Halal Marketing Services Singapore — Reach the Muslim Market",
  description:
    "Reach Singapore's halal-conscious consumers — featured listings, sponsored placement and growth partnerships on the platform Muslims use to find halal food and businesses.",
  path: "/halal-marketing-services",
  absoluteTitle: true,
});

const FAQ = [
  { q: "How can my business reach Muslim consumers in Singapore?", a: "Start where they already search: Humble Halal's directory, map and guides are built for halal-conscious consumers. A free listing gets you found; featured placement, sponsored slots and content partnerships scale your reach." },
  { q: "Do I need to be MUIS-certified to market on Humble Halal?", a: "No — Muslim-owned and halal-friendly businesses are welcome and labelled accurately. What we never do is present an uncertified business as certified; honest labels are why the audience trusts the platform." },
  { q: "What advertising options are available?", a: "Featured placement in your category and area, sponsored slots across high-intent pages (always clearly labelled), seasonal campaign placements (Ramadan, Hari Raya) and growth partnerships. See the Advertise page for current packages." },
  { q: "Why not just run Facebook or Google ads?", a: "You can — but intent matters. Someone browsing 'halal food near me' or 'halal wedding catering' is already deciding where to spend. Placement inside that journey converts better than interrupting an unrelated one." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[
        { name: "For business", path: "/for-business" },
        { name: "Halal marketing services", path: "/halal-marketing-services" },
      ]}
      h1="Halal Marketing Services — Reach Singapore's Muslim Market"
      intro={
        <>
          <strong>Singapore&apos;s Muslim community makes purchase decisions on trust</strong> — and they search where halal
          status is verified, not guessed. Humble Halal puts your business inside that decision journey: directory listings,
          featured placement, seasonal campaigns and partnerships, all clearly labelled and never blended into organic
          rankings.
        </>
      }
      sections={[
        {
          heading: "Ways to grow with Humble Halal",
          body: (
            <ul style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
              <li><strong>Free listing</strong> — your page with halal status, photos, hours, reviews and enquiries. <Link href="/add-listing">List free</Link>.</li>
              <li><strong>Verified & Featured tiers</strong> — trust badge, top-of-category placement in your area, analytics. <Link href="/pricing">See pricing</Link>.</li>
              <li><strong>Sponsored placement</strong> — labelled slots on high-intent pages (near-me, cuisine, seasonal hubs). <Link href="/advertise">Advertise</Link>.</li>
              <li><strong>Seasonal campaigns</strong> — Ramadan and Hari Raya hubs put your offer in front of peak demand.</li>
              <li><strong>Growth partnership</strong> — deeper collaborations for brands building a halal-market presence. <Link href="/growth-partner">Learn more</Link>.</li>
            </ul>
          ),
        },
        {
          heading: "Why trust-first advertising works",
          body: (
            <p>
              Our ranking policy is public: sponsored slots are always labelled and never affect organic ordering, and halal
              trust outranks convenience in results. That policy is exactly why the audience keeps coming back — and why
              placement here carries weight that interruption ads don&apos;t.
            </p>
          ),
        },
      ]}
      links={[
        { label: "Advertise with Humble Halal", href: "/advertise" },
        { label: "List your business (free)", href: "/add-listing" },
        { label: "Pricing & plans", href: "/pricing" },
        { label: "Growth partner programme", href: "/growth-partner" },
      ]}
      faq={FAQ}
    />
  );
}
