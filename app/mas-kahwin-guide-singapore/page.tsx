import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta, SITE } from "@/lib/seo";
import { SEO_YEAR } from "@/lib/seo-pages";
import { ContentPage } from "@/components/seo/content-page";

/* Hub 2 culture guide — "mas kahwin singapore" (200/mo, KD 0, fires AI
   Overview). Pure answer-engine play. */

export const metadata: Metadata = pageMeta({
  title: `Mas Kahwin Singapore (${SEO_YEAR}) — Amount, Rules & Meaning`,
  description:
    "Mas kahwin in Singapore explained — the current minimum amount, how it differs from hantaran, who decides it, and how it's paid at the akad nikah.",
  path: "/mas-kahwin-guide-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "What is the minimum mas kahwin in Singapore?", a: "The minimum mas kahwin in Singapore is $100, set under the Administration of Muslim Law Act and administered by ROMM (Registry of Muslim Marriages). Couples may agree any amount at or above the minimum — many keep it modest by sunnah and put bigger sums into hantaran instead." },
  { q: "What's the difference between mas kahwin and hantaran?", a: "Mas kahwin (mahr) is the obligatory marriage payment from groom to bride required by Muslim law — it belongs to the bride absolutely. Hantaran (or wang hantaran) is a customary gift agreed between families, not a religious requirement, and is typically much larger — commonly $8,000–$15,000+ in Singapore." },
  { q: "How is mas kahwin paid?", a: "It's declared during the akad nikah before the Kadi or Naib Kadi — in cash, jewellery or other agreed form — and recorded in the marriage certificate. If deferred (hutang), it remains a debt owed to the bride." },
  { q: "Who decides the amount?", a: "The bride (with her family) sets or agrees the amount with the groom — Islam encourages keeping the mahr easy. The Kadi confirms both parties' agreement at the solemnisation." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[
        { name: "Malay wedding guide", path: "/malay-wedding-singapore" },
        { name: "Mas kahwin", path: "/mas-kahwin-guide-singapore" },
      ]}
      h1="Mas Kahwin in Singapore — Amount, Rules & Meaning"
      intro={
        <>
          <strong>Mas kahwin is the obligatory marriage payment (mahr) from groom to bride, with a minimum of $100 in
          Singapore</strong> — declared at the akad nikah and recorded by ROMM. It is not the same as hantaran, the larger
          customary gift agreed between families. Here&apos;s how both work.
        </>
      }
      sections={[
        {
          heading: "Mas kahwin vs hantaran at a glance",
          body: (
            <ul style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
              <li><strong>Mas kahwin (mahr)</strong> — religious obligation · minimum $100 in SG · belongs to the bride absolutely · declared at the akad nikah.</li>
              <li><strong>Hantaran</strong> — Malay custom, not a religious requirement · commonly $8,000–$15,000+ · agreed between families · often presented on <Link href="/hantaran-dulang-guide-singapore">dulang trays</Link>.</li>
              <li><strong>Belanja / duit hangus</strong> — colloquial for the wedding contribution that offsets the majlis cost; usage overlaps with hantaran depending on family.</li>
            </ul>
          ),
        },
        {
          heading: "Practical notes for couples",
          body: (
            <p>
              Keep the mahr sincere and manageable — the Prophet ﷺ encouraged easy mahr. Agree hantaran early (it shapes the
              whole budget), document what&apos;s agreed, and remember deferred mas kahwin remains a real debt. For the
              legal specifics and current procedures, refer to ROMM&apos;s official guidance when registering your marriage.
            </p>
          ),
        },
      ]}
      links={[
        { label: "Hantaran & dulang guide", href: "/hantaran-dulang-guide-singapore" },
        { label: "The complete Malay wedding guide", href: "/malay-wedding-singapore" },
        { label: "Wedding packages & costs", href: "/malay-wedding-packages-singapore" },
        { label: "Baju nikah & attire", href: "/baju-nikah-attire-singapore" },
      ]}
      faq={FAQ}
      extraJsonLd={[
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `Mas Kahwin in Singapore (${SEO_YEAR}) — Amount, Rules & Meaning`,
          author: { "@type": "Organization", name: SITE.name },
          publisher: { "@type": "Organization", name: SITE.name },
          mainEntityOfPage: `${SITE.url}/mas-kahwin-guide-singapore`,
        },
      ]}
    />
  );
}
