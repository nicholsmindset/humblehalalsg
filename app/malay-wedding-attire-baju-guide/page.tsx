import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta, SITE } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";

/* Hub 2 editorial — "malay wedding outfit" (150/mo, KD 0). */

export const metadata: Metadata = pageMeta({
  title: `Malay Wedding Attire Guide (${SEO_YEAR}) — Baju for Every Ceremony`,
  description:
    "What to wear at each stage of a Malay wedding — nikah, sanding and bertandang outfits for bride and groom, plus guest attire etiquette and where to rent or tailor.",
  path: "/malay-wedding-attire-baju-guide",
  absoluteTitle: true,
});

const FAQ = [
  { q: "What do the bride and groom wear at a Malay wedding?", a: "For the nikah: modest, classically white or soft-toned outfits (kurung/kebaya; baju melayu with samping). For the sanding: grander coordinated songket or embellished outfits as raja sehari, often with a tanjak for the groom. A second colourway is common for bertandang or evening changes." },
  { q: "What should guests wear to a Malay wedding?", a: "Smart and modest — baju kurung, kebaya or a midi/maxi dress for women; baju melayu or shirt and slacks for men. Avoid white head-to-toe (the couple's palette) and anything revealing; light fabrics win at void deck and CC weddings." },
  { q: "How many outfit changes does a bridal package include?", a: "Typically two (nikah + sanding), with extra changes as add-ons. Confirm whether accessories — tanjak, veil, jewellery — and pressing are included." },
];

export default function Page() {
  return (
    <ContentPage
      leadVertical="weddings"
      crumbs={[
        { name: "Malay wedding guide", path: "/malay-wedding-singapore" },
        { name: "Attire guide", path: "/malay-wedding-attire-baju-guide" },
      ]}
      h1="Malay Wedding Attire — What to Wear, Ceremony by Ceremony"
      intro={
        <>
          <strong>Malay wedding attire follows the ceremony</strong> — modest, classically white for the akad nikah;
          coordinated songket grandeur for the sanding; a lighter change for bertandang. Here&apos;s the full guide for
          couples and guests, plus where to rent or tailor in Singapore.
        </>
      }
      sections={[
        {
          heading: "Ceremony by ceremony",
          body: (
            <ul style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
              <li><strong>Akad nikah</strong> — see the dedicated <Link href="/baju-nikah-attire-singapore">baju nikah guide</Link>: white/soft tones, modest cuts.</li>
              <li><strong>Majlis sanding</strong> — the showpiece: matching songket or heavily embellished couture; tanjak and keris for the groom by tradition.</li>
              <li><strong>Bertandang</strong> — a second colourway, often lighter; many couples reuse the sanding outfit to save budget.</li>
              <li><strong>Guests</strong> — smart-modest; avoid outshining or matching the couple&apos;s announced palette.</li>
            </ul>
          ),
        },
      ]}
      links={[
        { label: "Baju nikah — rental & custom", href: "/baju-nikah-attire-singapore" },
        { label: "Bridal makeup artists", href: "/malay-bridal-makeup-artists-singapore" },
        { label: "Wedding photography", href: "/malay-wedding-photography-singapore" },
        { label: "The complete Malay wedding guide", href: "/malay-wedding-singapore" },
      ]}
      faq={FAQ}
      extraJsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `Malay Wedding Attire Guide (${SEO_YEAR})`,
          author: { "@type": "Organization", name: SITE.name },
          publisher: { "@type": "Organization", name: SITE.name },
          mainEntityOfPage: `${SITE.url}/malay-wedding-attire-baju-guide`,
        },
      ]}
    />
  );
}
