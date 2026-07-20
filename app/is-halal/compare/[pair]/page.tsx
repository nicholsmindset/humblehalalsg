import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATUS_META } from "@/lib/halal-status";
import { allComparePairs, getComparePair, compareSummary } from "@/lib/brand-compare";
import { HALALSG_BASE } from "@/lib/muis";
import { pageMeta } from "@/lib/seo";
import { JsonLd, articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";
import { StatusCard } from "@/components/halal-check/status-card";
import { Alternatives } from "@/components/halal-check/content-sections";
import { Newsletter } from "@/components/newsletter";

/* Curated "X vs Y: which is halal?" comparison pages. The pair list in
   lib/brand-compare.ts is the whole universe — dynamicParams=false means an
   uncurated pair 404s at the router, and the sitemap only ever lists pages
   that actually build. */
export const revalidate = 3600;
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await allComparePairs()).map((p) => ({ pair: p.pairSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair } = await params;
  const p = await getComparePair(pair);
  if (!p) return pageMeta({ title: "Is it halal?", path: `/is-halal/compare/${pair}` });
  const desc = compareSummary(p.a, p.b);
  return pageMeta({
    title: `${p.a.brand} vs ${p.b.brand}: Which Is Halal in Singapore? (2026)`,
    description: desc.length > 155 ? desc.slice(0, 152) + "…" : desc,
    path: `/is-halal/compare/${p.pairSlug}`,
    absoluteTitle: true,
  });
}

export default async function Page({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const p = await getComparePair(pair);
  if (!p) notFound();
  const { a, b } = p;
  const title = `${a.brand} vs ${b.brand}: Which Is Halal in Singapore?`;
  const summary = compareSummary(a, b);

  const faq = [
    { q: `Is ${a.brand} halal in Singapore?`, a: a.answer },
    { q: `Is ${b.brand} halal in Singapore?`, a: b.answer },
    { q: `${a.brand} or ${b.brand} — which should halal-conscious diners choose?`, a: summary },
  ];

  // Certified alternatives only matter when neither side is certified.
  const neitherCertified = a.status !== "certified" && b.status !== "certified";
  const alternatives = neitherCertified ? (a.alternatives || b.alternatives || []) : [];

  const others = (await allComparePairs()).filter((x) => x.pairSlug !== p.pairSlug).slice(0, 8);

  return (
    <>
      <JsonLd
        data={[
          articleJsonLd({
            headline: `${title} (2026)`,
            description: summary,
            path: `/is-halal/compare/${p.pairSlug}`,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Is it halal?", path: "/is-halal" },
            { name: `${a.brand} vs ${b.brand}`, path: `/is-halal/compare/${p.pairSlug}` },
          ]),
          faqJsonLd(faq),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link><span>›</span>
              <Link className="link-inline" href="/is-halal">Is it halal?</Link><span>›</span>
              <span style={{ color: "var(--ink)" }}>{a.brand} vs {b.brand}</span>
            </nav>
            <span className="eyebrow">Halal comparison</span>
            <h1 style={{ fontSize: "clamp(1.7rem,4vw,2.5rem)", maxWidth: 760, marginTop: 8 }}>{title}</h1>
            <p className="hs-answer" style={{ marginTop: 12, maxWidth: 680 }}>{summary}</p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18, alignItems: "start" }}>
            <StatusCard b={a} />
            <StatusCard b={b} />
          </div>

          <div className="notice notice-warn" style={{ marginTop: 22 }}>
            <span>
              <strong>Important:</strong> Halal certification is per-premises and can change. Statuses reflect publicly
              available information as of {a.lastChecked} — always confirm the current status on the official{" "}
              <a className="link-inline" href={HALALSG_BASE} target="_blank" rel="noopener noreferrer">MUIS HalalSG register</a>.
              Humble Halal is a discovery platform, not a halal certifier.
            </span>
          </div>

          {alternatives.length ? (
            <div style={{ marginTop: 26 }}>
              <Alternatives items={alternatives} />
            </div>
          ) : null}

          <section style={{ marginTop: 26 }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Read the full answers</h2>
            <div className="hub-grid">
              {[a, b].map((x) => {
                const m = STATUS_META[x.status];
                return (
                  <Link key={x.slug} href={`/is-halal/${x.slug}`} className="hs-row">
                    <span className="hs-row-name">Is {x.brand} halal?</span>
                    <span className={`hs-pill hs-${m.tone}`}>{m.verdict}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {others.length ? (
            <section style={{ marginTop: 26 }}>
              <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>More halal comparisons</h2>
              <div className="hub-grid">
                {others.map((x) => (
                  <Link key={x.pairSlug} href={`/is-halal/compare/${x.pairSlug}`} className="hs-row">
                    <span className="hs-row-name">{x.a.brand} vs {x.b.brand}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="newsletter-card" style={{ marginTop: 26 }}>
            <span className="eyebrow">The weekly halal guide</span>
            <h2 style={{ fontSize: "1.25rem", margin: "6px 0 10px" }}>Halal status changes — we track them</h2>
            <p className="muted" style={{ marginBottom: 12 }}>New certifications, lapses and halal finds, delivered to your inbox.</p>
            <Newsletter source="is-halal-compare" cta="Subscribe" />
          </section>
        </div>
      </div>
    </>
  );
}
