import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { ContentPage } from "@/components/seo/content-page";

/* Seasonal hub for "ramadan bazaar singapore" (150/mo baseline, KD 0, CPC $1.7 —
   spikes hard in season). Evergreen page, annually refreshed content. */

export const metadata: Metadata = pageMeta({
  title: "Ramadan Bazaar Singapore 2026 — Geylang Serai & More",
  description:
    "Ramadan bazaars in Singapore 2026 — the Geylang Serai bazaar plus neighbourhood bazaars: expected dates, what to eat, stall highlights and how to get there.",
  path: "/ramadan-bazaar-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "Where is the main Ramadan bazaar in Singapore?", a: "Geylang Serai hosts Singapore's largest and most famous Ramadan bazaar, around Wisma Geylang Serai and the surrounding streets. Neighbourhood bazaars also pop up in Tampines, Woodlands, Jurong and other heartland town centres." },
  { q: "When is the Ramadan bazaar 2026?", a: "Bazaars typically run through Ramadan up to the eve of Hari Raya — for 2026 that means roughly mid-February to mid-March, subject to the official MUIS moon sighting. Exact opening dates are announced closer to the season." },
  { q: "Is all the food at Ramadan bazaars halal?", a: "Most vendors at Muslim-organised bazaars like Geylang Serai cater to the fasting crowd, but individual stalls vary in certification — MUIS-certified, Muslim-owned or self-declared. When it matters to you, ask the stall or check for certification." },
  { q: "What should I eat at a Ramadan bazaar?", a: "Classics: Ramly burgers, ayam percik, kebabs, dendeng, vadai, putu piring, kueh, and drinks like katira and air kathira — plus each year's viral snacks. Go hungry, break fast on time (check prayer times), and bring cash for smaller stalls." },
];

export default function Page() {
  return (
    <ContentPage
      crumbs={[
        { name: "Ramadan 2026", path: "/ramadan" },
        { name: "Ramadan bazaars", path: "/ramadan-bazaar-singapore" },
      ]}
      h1="Ramadan Bazaars in Singapore (2026)"
      intro={
        <>
          <strong>Singapore&apos;s Ramadan bazaars return in 2026 with Geylang Serai as the anchor</strong> — hundreds of food
          and festive stalls running through the fasting month to Hari Raya eve, joined by neighbourhood bazaars across the
          heartlands. Here&apos;s where to go, what to eat and when.
        </>
      }
      sections={[
        {
          heading: "The bazaars to know",
          body: (
            <ul style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
              <li><strong>Geylang Serai</strong> — the icon: food street, Raya shopping, festive lights around Wisma Geylang Serai. Nearest MRT: Paya Lebar.</li>
              <li><strong>Heartland bazaars</strong> — Tampines, Woodlands, Jurong, Yishun and other town centres host smaller bazaars, typically in open plazas near the MRT/interchange.</li>
              <li><strong>Mall pop-ups</strong> — Raya fairs in malls like Tampines Mall and Northpoint City for cookies, kueh and baju.</li>
            </ul>
          ),
        },
        {
          heading: "Plan your visit",
          body: (
            <p>
              Evenings before iftar get packed — arrive an hour early or after tarawih for lighter crowds. Check{" "}
              <Link href="/tools/prayer-times">prayer times</Link> so you break fast on time, browse{" "}
              <Link href="/events">current events</Link> for confirmed bazaar dates, and if you&apos;re hosting, order early
              from <Link href="/halal-catering-singapore">halal caterers</Link> — Raya-week slots sell out.
            </p>
          ),
        },
      ]}
      links={[
        { label: "Ramadan 2026 guide (dates & iftar)", href: "/ramadan" },
        { label: "Iftar & buka puasa spots", href: "/iftar-buka-puasa-singapore" },
        { label: "Hari Raya catering", href: "/hari-raya-catering-singapore" },
        { label: "Halal food in Geylang Serai", href: "/halal-food/geylang" },
        { label: "Prayer times", href: "/tools/prayer-times" },
      ]}
      faq={FAQ}
    />
  );
}
