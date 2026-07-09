import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { allSeoPages, seoPagePath, SEO_YEAR } from "@/lib/seo-pages";
import { getDirectory } from "@/lib/directory";
import { itemListJsonLd } from "@/components/seo/json-ld";
import { ContentPage } from "@/components/seo/content-page";

/* B2B/consumer directory for "muslim owned business singapore" (150/mo, KD 6). */

export const revalidate = 86400;

export const metadata: Metadata = pageMeta({
  title: `Muslim-Owned Businesses Singapore (${SEO_YEAR}) — Directory`,
  description:
    "Support Muslim-owned businesses across Singapore — restaurants, home bakers, services and shops, each verified and labelled with a halal-confidence score.",
  path: "/muslim-owned-businesses-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "Is Muslim-owned the same as halal-certified?", a: "No — Muslim-owned means the business is confirmed to be owned by Muslims and typically follows halal practices, but it is not MUIS certification. Many home-based businesses aren't eligible for certification at all. We label both statuses separately." },
  { q: "How do you verify a business is Muslim-owned?", a: "Businesses declare ownership when listing and our team reviews supporting information before the Muslim-Owned badge appears. Community reports help keep it honest — flag anything that looks wrong." },
  { q: "How do I add my Muslim-owned business?", a: "List it free via Add Your Business — you'll get a page with your halal status, photos, opening hours and an enquiry button, plus a shareable badge." },
];

export default async function Page() {
  const all = await getDirectory();
  const owned = all
    .filter((l) => l.badges.includes("owned"))
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name))
    .slice(0, 60);
  const areaPages = allSeoPages().filter((p) => p.kind === "muslim-owned").slice(0, 8);

  return (
    <ContentPage
      crumbs={[{ name: "Muslim-owned businesses", path: "/muslim-owned-businesses-singapore" }]}
      h1="Muslim-Owned Businesses in Singapore"
      intro={
        <>
          <strong>Support Muslim-owned businesses across Singapore</strong> — from heritage nasi padang kitchens and home
          bakers to modest fashion, services and shops. Every listing is verified, labelled clearly (Muslim-Owned is not the
          same as MUIS certification) and scored for halal confidence.
        </>
      }
      links={[
        ...areaPages.map((p) => ({ label: p.h1, href: seoPagePath(p) })),
        { label: "MUIS halal-certified directory", href: "/muis-halal-certified-directory" },
        { label: "List your business (free)", href: "/add-listing" },
      ]}
      faq={FAQ}
      extraJsonLd={owned.length ? [itemListJsonLd(owned, "Muslim-Owned Businesses in Singapore")] : []}
    >
      {owned.length ? (
        <ul style={{ display: "grid", gap: 14, padding: 0, margin: "0 0 8px", listStyle: "none" }}>
          {owned.map((l) => (
            <li key={l.id} style={{ display: "flex", gap: 14, alignItems: "baseline", borderBottom: "1px solid var(--line, #ECE7DB)", paddingBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <Link href={`/business/${l.slug}`} style={{ fontWeight: 700, fontSize: "1.08rem" }}>{l.name}</Link>
                <div className="muted" style={{ fontSize: ".92rem", marginTop: 3 }}>
                  {[l.cat, l.cuisine, l.area].filter(Boolean).join(" · ")} · Muslim-owned
                  {l.certified ? " · MUIS certified" : ""}
                  {l.rating > 0 ? ` · ${l.rating.toFixed(1)}★ (${l.reviews})` : ""}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">
          Verified Muslim-owned listings will appear here as they&apos;re added —{" "}
          <Link href="/explore">browse the directory</Link> or <Link href="/add-listing">list your business free</Link>.
        </p>
      )}
    </ContentPage>
  );
}
