import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { ContentPage } from "@/components/seo/content-page";

/* Seasonal hub for "hari raya catering singapore" (200/mo, KD 15). */

export const metadata: Metadata = pageMeta({
  title: "Hari Raya Catering Singapore 2026 — Buffets & Home Spreads",
  description:
    "Hari Raya catering in Singapore 2026 — halal buffets, rendang and lontong spreads, kueh platters and open-house packages from MUIS-certified and Muslim-owned caterers.",
  path: "/hari-raya-catering-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "When should I book Hari Raya catering?", a: "As early as possible — the first two Raya weekends sell out weeks ahead. For Hari Raya 2026 (expected around 20 March), reputable caterers start taking bookings during Ramadan; order at least 2–3 weeks before your open house." },
  { q: "What's in a typical Hari Raya catering menu?", a: "The classics: lontong, sayur lodeh, beef rendang, ayam masak merah, sambal goreng pengantin, achar, and kueh for dessert. Most caterers offer mini buffets for smaller gatherings and full buffet lines for open houses." },
  { q: "Is Hari Raya catering halal-certified?", a: "Many caterers are MUIS-certified (Food Preparation Area scheme); others are Muslim-owned. Each caterer on Humble Halal is labelled with its status — confirm certification on MUIS HalalSG when booking." },
  { q: "How much does Raya catering cost per person?", a: "Mini buffets typically start around $12–18 per person, with festive Raya menus and open-house packages running higher. Get quotes from 2–3 caterers to compare inclusions like delivery, setup and warmers." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[
        { name: "Hari Raya 2026", path: "/hari-raya" },
        { name: "Raya catering", path: "/hari-raya-catering-singapore" },
      ]}
      h1="Hari Raya Catering in Singapore (2026)"
      intro={
        <>
          <strong>Hosting an open house for Hari Raya 2026?</strong> Book halal catering early — rendang-and-lontong
          spreads, mini buffets and kueh platters from MUIS-certified and Muslim-owned caterers sell out for the first Raya
          weekends. Here&apos;s how to plan the spread, what it costs, and who to book.
        </>
      }
      sections={[
        {
          heading: "Planning your Raya spread",
          body: (
            <ul style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
              <li><strong>Guest count</strong> — mini buffets suit 10–30 guests; open houses with rolling guests need buffet lines with warmers.</li>
              <li><strong>The menu</strong> — lontong, rendang, ayam masak merah, sambal goreng and achar are the anchors; add kueh platters and drinks.</li>
              <li><strong>Timing</strong> — book 2–3 weeks ahead minimum; first-weekend slots go first. Confirm delivery windows — Raya-day traffic is real.</li>
              <li><strong>Verification</strong> — check each caterer&apos;s halal label on its listing and confirm MUIS certification on HalalSG if required.</li>
            </ul>
          ),
        },
        {
          heading: "Get quotes",
          body: (
            <p>
              Compare 2–3 caterers before committing — browse <Link href="/halal-catering-singapore">halal caterers</Link>{" "}
              and <Link href="/quotes">request quotes</Link> in one go. Ordering cookies and kueh separately? See{" "}
              <Link href="/halal-cakes-singapore">halal cakes &amp; bakes</Link>.
            </p>
          ),
        },
      ]}
      links={[
        { label: "Halal catering directory", href: "/halal-catering-singapore" },
        { label: "Hari Raya 2026 guide", href: "/hari-raya" },
        { label: "Halal cakes & kueh", href: "/halal-cakes-singapore" },
        { label: "Request catering quotes", href: "/quotes" },
        { label: "Ramadan 2026 guide", href: "/ramadan" },
      ]}
      faq={FAQ}
    />
  );
}
