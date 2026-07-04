import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allBrands, getBrand, relatedBrands, STATUS_META } from "@/lib/halal-status";
import { halalSgSearchUrl, HALALSG_BASE } from "@/lib/muis";
import { pageMeta } from "@/lib/seo";
import { JsonLd, articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";
import { getApprovedVerdict, approvedVerdictSlugs } from "@/lib/verdicts-data";
import { VerdictView } from "@/components/verdict/verdict-view";

// Approved AI-drafted verdicts (when HALAL_VERDICTS_ENABLED) render on demand;
// ISR keeps newly-approved pages fresh within the hour without a redeploy.
export const revalidate = 3600;

export async function generateStaticParams() {
  const fileSlugs = allBrands().map((b) => b.slug);
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
  const b = getBrand(brand);
  if (!b) return pageMeta({ title: "Is it halal?", path: `/is-halal/${brand}` });
  return pageMeta({
    title: `Is ${b.brand} Halal in Singapore? (2026)`,
    description: b.answer.length > 155 ? b.answer.slice(0, 152) + "…" : b.answer,
    path: `/is-halal/${b.slug}`,
    absoluteTitle: true,
  });
}

function brandFaq(brandName: string, answer: string) {
  return [
    { q: `Is ${brandName} MUIS halal-certified in Singapore?`, a: answer },
    {
      q: `How can I check if ${brandName} is halal?`,
      a: `Search for ${brandName} on the official MUIS HalalSG register at halal.muis.gov.sg, or look for a valid MUIS halal certificate displayed at the outlet. A “no pork, no lard” sign is self-declared and is not the same as MUIS halal certification.`,
    },
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

  const b = getBrand(brand);
  if (!b) notFound();
  const m = STATUS_META[b.status];
  const related = relatedBrands(b, 8);
  const faq = brandFaq(b.brand, b.answer);
  const title = `Is ${b.brand} Halal in Singapore?`;

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
          faqJsonLd(faq),
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
            <h1 style={{ fontSize: "clamp(1.7rem,4vw,2.5rem)", maxWidth: 720 }}>{title}</h1>

            {/* Answer-first block — the AI-Overview / featured-snippet unit */}
            <div className={`hs-verdict hs-${m.tone}`} style={{ marginTop: 16 }}>
              <div className="hs-verdict-head">
                <span className={`hs-pill hs-${m.tone}`}>{m.verdict}</span>
                <span className="hs-verdict-label">{m.label}</span>
              </div>
              <p className="hs-verdict-answer">{b.answer}</p>
              <div className="hs-verdict-meta">
                <span>Category: {b.category}</span>
                <span>·</span>
                <span>Last checked: {b.lastChecked}</span>
                <span>·</span>
                <span>Source: {b.source}</span>
              </div>
              <a className="btn btn-primary btn-sm" href={halalSgSearchUrl(b.brand)} target="_blank" rel="noopener noreferrer" style={{ marginTop: 12 }}>
                Verify on MUIS HalalSG →
              </a>
            </div>
          </div>
        </section>

        <div className="hh-wrap hh-section" style={{ maxWidth: 760 }}>
          <div className="notice notice-warn">
            <span>
              <strong>Important:</strong> Halal certification can change. This is a guide based on publicly available
              information as of {b.lastChecked} — always confirm the current status on the official{" "}
              <a className="link-inline" href={HALALSG_BASE} target="_blank" rel="noopener noreferrer">MUIS HalalSG register</a>.
              Humble Halal is a discovery platform, not a halal certifier.
            </span>
          </div>

          <h2 style={{ fontSize: "1.3rem", margin: "26px 0 12px" }}>Frequently asked questions</h2>
          <div className="faq-list">
            {faq.map((f) => (
              <details key={f.q} className="faq-item">
                <summary>{f.q}<span className="faq-chevron" aria-hidden="true" /></summary>
                <p className="muted" style={{ padding: "0 2px 4px", lineHeight: 1.6 }}>{f.a}</p>
              </details>
            ))}
          </div>

          {related.length > 0 && (
            <>
              <h2 style={{ fontSize: "1.3rem", margin: "30px 0 12px" }}>Check another brand</h2>
              <div className="hub-grid">
                {related.map((r) => {
                  const rm = STATUS_META[r.status];
                  return (
                    <Link key={r.slug} href={`/is-halal/${r.slug}`} className="hs-row">
                      <span className="hs-row-name">Is {r.brand} halal?</span>
                      <span className={`hs-pill hs-${rm.tone}`}>{rm.verdict}</span>
                    </Link>
                  );
                })}
              </div>
              <p style={{ marginTop: 16 }}>
                <Link className="link-inline" href="/is-halal">See all brands in the halal checker →</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
