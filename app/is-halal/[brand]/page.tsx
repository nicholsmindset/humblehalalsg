import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATUS_META } from "@/lib/halal-status";
import { allBrandsMerged, getBrandMerged, relatedBrandsMerged } from "@/lib/cms-brands";
import { buildBrandFaq, watchForItems } from "@/lib/halal-status-content";
import { HALALSG_BASE } from "@/lib/muis";
import { pageMeta } from "@/lib/seo";
import { JsonLd, articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";
import { getApprovedVerdict, approvedVerdictSlugs } from "@/lib/verdicts-data";
import { VerdictView } from "@/components/verdict/verdict-view";
import { StatusCard } from "@/components/halal-check/status-card";
import { BrandMonogram, MethodPanel } from "@/components/halal-check/method-panel";
import { CheckAnotherSearch } from "@/components/halal-check/check-search";
import { SimilarChecks } from "@/components/halal-check/similar-checks";
import { StatusExplainer } from "@/components/halal-check/status-explainer";
import { BrandFaqList } from "@/components/halal-check/brand-faq";
import { WatchFor, Alternatives } from "@/components/halal-check/content-sections";
import { Newsletter } from "@/components/newsletter";

// Approved AI-drafted verdicts (when HALAL_VERDICTS_ENABLED) render on demand;
// ISR keeps newly-approved pages fresh within the hour without a redeploy.
export const revalidate = 3600;

export async function generateStaticParams() {
  const fileSlugs = (await allBrandsMerged()).map((b) => b.slug);
  const dbSlugs = await approvedVerdictSlugs(); // [] when flag off / no DB
  return [...new Set([...fileSlugs, ...dbSlugs])].map((brand) => ({ brand }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand } = await params;
  // Prefer an approved AI-drafted verdict (richer); fall back to the file brand.
  const v = await getApprovedVerdict(brand);
  if (v) {
    const desc = v.one_line_answer || `Is ${v.name} halal in Singapore? A human-reviewed halal assessment.`;
    return pageMeta({
      title: v.h1 || `Is ${v.name} Halal in Singapore? (2026)`,
      description: desc.length > 155 ? desc.slice(0, 152) + "…" : desc,
      path: `/is-halal/${v.slug}`,
      absoluteTitle: true,
    });
  }
  const b = await getBrandMerged(brand);
  if (!b) return pageMeta({ title: "Is it halal?", path: `/is-halal/${brand}` });
  return pageMeta({
    title: `Is ${b.brand} Halal in Singapore? (2026)`,
    description: b.answer.length > 155 ? b.answer.slice(0, 152) + "…" : b.answer,
    path: `/is-halal/${b.slug}`,
    absoluteTitle: true,
  });
}

/** Popular-search chips: resolved server-side so no dead links ever ship. */
function popularChips(slugs: Set<string>): { label: string; href: string }[] {
  const brandChips = [
    { label: "BreadTalk", slug: "breadtalk" },
    { label: "Swee Heng", slug: "swee-heng" },
    { label: "Chocolate Origin", slug: "chocolate-origin" },
    { label: "Paris Baguette", slug: "paris-baguette" },
  ].filter((c) => slugs.has(c.slug)).map((c) => ({ label: c.label, href: `/is-halal/${c.slug}` }));
  return [
    ...brandChips,
    { label: "Gelatin", href: "/tools/ingredient-checker?q=gelatine" },
    { label: "E471", href: "/tools/ingredient-checker?q=E471" },
  ];
}

export default async function Page({ params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params;

  // Approved AI-drafted verdict (human-reviewed) takes precedence — richer page.
  const v = await getApprovedVerdict(brand);
  if (v) {
    const vFaq = v.faq_answer ? [{ q: v.h1 || `Is ${v.name} halal in Singapore?`, a: v.faq_answer }] : [];
    return (
      <>
        <JsonLd
          data={[
            articleJsonLd({
              headline: `${v.h1 || `Is ${v.name} Halal in Singapore?`} (2026)`,
              description: v.one_line_answer || `Is ${v.name} halal in Singapore?`,
              path: `/is-halal/${v.slug}`,
            }),
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Is it halal?", path: "/is-halal" },
              { name: v.name, path: `/is-halal/${v.slug}` },
            ]),
            ...(vFaq.length ? [faqJsonLd(vFaq)] : []),
          ]}
        />
        <VerdictView v={v} />
      </>
    );
  }

  const b = await getBrandMerged(brand);
  if (!b) notFound();
  const m = STATUS_META[b.status];
  const related = await relatedBrandsMerged(b, 6);
  const fullFaq = buildBrandFaq(b);
  const title = `Is ${b.brand} Halal in Singapore?`;

  const all = await allBrandsMerged();
  const searchBrands = all.map((x) => ({
    slug: x.slug,
    brand: x.brand,
    tone: STATUS_META[x.status].tone,
    verdict: STATUS_META[x.status].verdict,
    aliases: x.aliases,
  }));
  const chips = popularChips(new Set(all.map((x) => x.slug)));

  return (
    <>
      <JsonLd
        data={[
          articleJsonLd({
            headline: `${title} (2026)`,
            description: b.answer,
            path: `/is-halal/${b.slug}`,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Is it halal?", path: "/is-halal" },
            { name: b.brand, path: `/is-halal/${b.slug}` },
          ]),
          faqJsonLd(fullFaq),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link><span>›</span>
              <Link className="link-inline" href="/is-halal">Is it halal?</Link><span>›</span>
              <span style={{ color: "var(--ink)" }}>{b.brand}</span>
            </nav>
            <span className="eyebrow">Halal status checker</span>
            <h1 style={{ fontSize: "clamp(1.7rem,4vw,2.5rem)", maxWidth: 720, marginTop: 8 }}>{title}</h1>
            <p className="muted" style={{ marginTop: 8, maxWidth: 640 }}>
              Clear, source-backed guidance to help you make an informed choice.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          {/* Status area: verdict card + side panel */}
          <div className="hcx-grid">
            <StatusCard b={b} />
            <aside className="hcx-side">
              <BrandMonogram brand={b.brand} category={b.category} tone={m.tone} logo={b.logo} />
              <MethodPanel status={b.status} lastChecked={b.lastChecked} />
            </aside>
          </div>

          <div className="notice notice-warn" style={{ marginTop: 22 }}>
            <span>
              <strong>Important:</strong> Halal certification can change. This is a guide based on publicly available
              information as of {b.lastChecked} — always confirm the current status on the official{" "}
              <a className="link-inline" href={HALALSG_BASE} target="_blank" rel="noopener noreferrer">MUIS HalalSG register</a>.
              Humble Halal is a discovery platform, not a halal certifier.
            </span>
          </div>

          <div style={{ marginTop: 26, display: "grid", gap: 26 }}>
            <WatchFor items={watchForItems(b)} />
            {b.alternatives?.length ? <Alternatives items={b.alternatives} /> : null}
          </div>

          <CheckAnotherSearch brands={searchBrands} chips={chips} />

          <div className="hcx-cols">
            <BrandFaqList items={fullFaq} />
            <SimilarChecks items={related} category={b.category} />
          </div>

          <StatusExplainer status={b.status} explainer={b.explainer} />

          <section className="newsletter-card" style={{ marginTop: 26 }}>
            <span className="eyebrow">The weekly halal guide</span>
            <h2 style={{ fontSize: "1.25rem", margin: "6px 0 10px" }}>Halal status changes — we track them</h2>
            <p className="muted" style={{ marginBottom: 12 }}>New certifications, lapses and halal finds, delivered to your inbox.</p>
            <Newsletter source="is-halal-brand" cta="Subscribe" />
          </section>
        </div>
      </div>
    </>
  );
}
