import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { ContentPage } from "@/components/seo/content-page";

/* Seasonal hub for "iftar buffet singapore" / buka puasa (300/mo, KD 20). */

export const metadata: Metadata = pageMeta({
  title: "Iftar & Buka Puasa Singapore 2026 — Buffets & Spots",
  description:
    "Where to break fast in Singapore 2026 — iftar buffets, halal restaurants for buka puasa, group-friendly spots and catering, with prayer times built in.",
  path: "/iftar-buka-puasa-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "Where can I break fast (buka puasa) in Singapore?", a: "Options range from halal buffets and hotel iftar spreads to nasi padang institutions and hawker centres near mosques. Book buffets ahead during Ramadan — tables at popular spots go fast, especially weekends." },
  { q: "What time is iftar in Singapore?", a: "Iftar is at Maghrib — around 7:10–7:25pm in Singapore depending on the date. Check daily prayer times for the exact minute; restaurants near mosques fill up just before." },
  { q: "Are iftar buffets halal-certified?", a: "Many are MUIS-certified, others Muslim-owned or self-declared — it varies by venue, including hotels. Every listing on Humble Halal is labelled with its status; confirm certification on MUIS HalalSG when it matters." },
  { q: "Can I cater iftar for a group or corporate event?", a: "Yes — halal caterers offer iftar packages for offices, mosques and events during Ramadan. Order 1–2 weeks ahead; Raya-adjacent dates sell out first." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[
        { name: "Ramadan 2026", path: "/ramadan" },
        { name: "Iftar & buka puasa", path: "/iftar-buka-puasa-singapore" },
      ]}
      h1="Iftar & Buka Puasa in Singapore (2026)"
      intro={
        <>
          <strong>Breaking fast in Singapore is spoilt for choice</strong> — halal buffets and hotel iftar spreads, nasi
          padang and hawker favourites near mosques, and caterers for group iftars. This guide gathers the best buka puasa
          options with halal labels and prayer times built in.
        </>
      }
      sections={[
        {
          heading: "Where to buka puasa",
          body: (
            <ul style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
              <li><strong>Iftar buffets</strong> — <Link href="/halal-buffet-singapore">halal buffets</Link> run special Ramadan spreads; book ahead for weekends.</li>
              <li><strong>Near the mosque</strong> — eateries around <Link href="/mosques">mosques</Link> time their service to Maghrib; many offer dates and water on the house.</li>
              <li><strong>Hawker & heritage</strong> — <Link href="/halal-food/geylang">Geylang Serai</Link> and <Link href="/halal-food/kampong-glam">Kampong Glam</Link> are classic buka puasa territory.</li>
              <li><strong>Group iftar</strong> — offices and events go smoother with <Link href="/halal-catering-singapore">halal catering</Link> iftar packages.</li>
            </ul>
          ),
        },
        {
          heading: "Time it right",
          body: (
            <p>
              Iftar is at Maghrib — check <Link href="/tools/prayer-times">today&apos;s prayer times</Link> for the exact
              minute. Aim to be seated 20–30 minutes early at popular spots, or order delivery before the pre-iftar rush.
            </p>
          ),
        },
      ]}
      links={[
        { label: "Halal buffets in Singapore", href: "/halal-buffet-singapore" },
        { label: "Ramadan bazaars 2026", href: "/ramadan-bazaar-singapore" },
        { label: "Ramadan 2026 guide", href: "/ramadan" },
        { label: "Prayer times today", href: "/tools/prayer-times" },
        { label: "Halal catering for group iftar", href: "/halal-catering-singapore" },
      ]}
      faq={FAQ}
    />
  );
}
