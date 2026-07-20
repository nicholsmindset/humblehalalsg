import type { Metadata } from "next";
import Link from "next/link";
import { STATUS_META } from "@/lib/halal-status";
import { allBrandsMerged } from "@/lib/cms-brands";
import { allComparePairs } from "@/lib/brand-compare";
import { HALALSG_BASE } from "@/lib/muis";
import { SITE } from "@/lib/seo";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";
import { CheckAnotherSearch } from "@/components/halal-check/check-search";
import { Faq } from "@/components/faq";
import { Newsletter } from "@/components/newsletter";

export const metadata: Metadata = pageMeta({
  title: "Is It Halal? Singapore Brand & Restaurant Checker",
  description:
    "Is Paris Baguette, Genki Sushi or Starbucks halal in Singapore? Check the MUIS halal-certification status of popular food brands — each answer cites its source and links to the official MUIS HalalSG register.",
  path: "/is-halal",
});

const HUB_FAQ = [
  {
    q: "How do I check if a brand is halal in Singapore?",
    a: "Look it up on the official MUIS HalalSG register at halal.muis.gov.sg, or check for a valid MUIS halal certificate displayed at the outlet. A self-declared “no pork, no lard” sign is not the same as MUIS halal certification.",
  },
  {
    q: "Is “no pork, no lard” the same as halal?",
    a: "No. “No pork, no lard” is self-declared by the business and only means those two ingredients are not used. MUIS halal certification verifies the whole kitchen, ingredients and supply chain. Always confirm certification on MUIS HalalSG.",
  },
  {
    q: "Why isn’t a brand that I know is halal listed here?",
    a: "This checker covers commonly-searched brands and is not exhaustive. The authoritative source is always the MUIS HalalSG register — check there for the latest certification status of any establishment.",
  },
];

export default async function Page() {
  const brands = await allBrandsMerged();
  const comparisons = await allComparePairs();
  // group by category for a scannable directory
  const byCat = new Map<string, typeof brands>();
  for (const b of brands) {
    const arr = byCat.get(b.category) || [];
    arr.push(b);
    byCat.set(b.category, arr);
  }
  const groups = [...byCat.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const searchBrands = brands.map((x) => ({
    slug: x.slug,
    brand: x.brand,
    tone: STATUS_META[x.status].tone,
    verdict: STATUS_META[x.status].verdict,
    aliases: x.aliases,
  }));
  const slugSet = new Set(brands.map((x) => x.slug));
  const chips = [
    { label: "BreadTalk", slug: "breadtalk" },
    { label: "Swee Heng", slug: "swee-heng" },
    { label: "Chocolate Origin", slug: "chocolate-origin" },
    { label: "Paris Baguette", slug: "paris-baguette" },
  ].filter((c) => slugSet.has(c.slug)).map((c) => ({ label: c.label, href: `/is-halal/${c.slug}` }))
    .concat([
      { label: "Gelatin", href: "/tools/ingredient-checker?q=gelatine" },
      { label: "E471", href: "/tools/ingredient-checker?q=E471" },
    ]);

  const groupMeta = (items: typeof brands) => {
    const counts = new Map<string, number>();
    for (const b of items) {
      const v = STATUS_META[b.status].label;
      counts.set(v, (counts.get(v) || 0) + 1);
    }
    return [...counts.entries()].map(([label, n]) => `${n} ${label.toLowerCase()}`).join(" · ");
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Is it halal? Singapore brand checker",
    numberOfItems: brands.length,
    itemListElement: brands.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `Is ${b.brand} halal?`,
      url: `${SITE.url}/is-halal/${b.slug}`,
    })),
  };

  return (
    <>
      <JsonLd
        data={[
          itemList,
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Is it halal?", path: "/is-halal" },
          ]),
          faqJsonLd(HUB_FAQ),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link><span>›</span><span style={{ color: "var(--ink)" }}>Is it halal?</span>
            </nav>
            <span className="eyebrow">Halal status checker</span>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720, marginTop: 8 }}>Is it halal? Singapore brand checker</h1>
            <p className="hs-answer" style={{ maxWidth: 680, marginTop: 12 }}>
              Quick, sourced answers on whether popular food brands are <strong>MUIS halal-certified</strong> in Singapore.
              Certification is per-premises and can change — and “no pork, no lard” is not the same as
              halal certification. Always confirm on the official{" "}
              <a className="link-inline" href={HALALSG_BASE} target="_blank" rel="noopener noreferrer">MUIS HalalSG register</a>.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <CheckAnotherSearch brands={searchBrands} chips={chips} heading="Check a brand or ingredient" />

          {groups.map(([cat, items]) => (
            <section key={cat} style={{ marginBottom: 26 }}>
              <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>
                {cat}
                <span className="hcx-group-meta">{groupMeta(items)}</span>
              </h2>
              <div className="hub-grid">
                {items.map((b) => {
                  const m = STATUS_META[b.status];
                  return (
                    <Link key={b.slug} href={`/is-halal/${b.slug}`} className="hs-row">
                      <span className="hs-row-name">Is {b.brand} halal?</span>
                      <span className={`hs-pill hs-${m.tone}`}>{m.verdict}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
          {comparisons.length ? (
            <section style={{ marginBottom: 26 }}>
              <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Popular halal comparisons</h2>
              <div className="hub-grid">
                {comparisons.map((p) => (
                  <Link key={p.pairSlug} href={`/is-halal/compare/${p.pairSlug}`} className="hs-row">
                    <span className="hs-row-name">{p.a.brand} vs {p.b.brand} — which is halal?</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          <p className="faint" style={{ fontSize: ".84rem", marginTop: 8 }}>
            Statuses reflect publicly available information and are checked periodically — they can change.
            The authoritative source is always the{" "}
            <a className="link-inline" href={HALALSG_BASE} target="_blank" rel="noopener noreferrer">MUIS HalalSG register</a>.
            Humble Halal is a discovery platform, not a halal certifier.
          </p>
        </div>

        <Faq items={HUB_FAQ} title="Checking halal status in Singapore" />

        <div className="hh-wrap" style={{ paddingBottom: 40 }}>
          <section className="newsletter-card">
            <span className="eyebrow">The weekly halal guide</span>
            <h2 style={{ fontSize: "1.25rem", margin: "6px 0 10px" }}>Halal status changes — we track them</h2>
            <p className="muted" style={{ marginBottom: 12 }}>New certifications, lapses and halal finds, delivered to your inbox.</p>
            <Newsletter source="is-halal-hub" cta="Subscribe" />
          </section>
        </div>
      </div>
    </>
  );
}
