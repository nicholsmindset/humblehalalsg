import type { Metadata } from "next";
import Link from "next/link";
import { areas, categories } from "@/lib/data";
import { allSeoPages } from "@/lib/seo-pages";
import { pageMeta, SITE } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = pageMeta({
  title: "Halal directory Singapore — browse by category & area",
  description:
    "Browse Singapore’s halal & Muslim-owned business directory by category — restaurants, cafés, groceries, beauty, modest fashion, services, weddings, travel and more — or by neighbourhood.",
  path: "/halal",
});

export default function Page() {
  const pages = allSeoPages();
  const catPages = pages.filter((p) => p.catId && !p.areaId);
  const catLabel = (catId?: string) => categories.find((c) => c.id === catId)?.label || "";

  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Halal directory Singapore",
    url: `${SITE.url}/halal`,
    hasPart: catPages.map((p) => ({ "@type": "WebPage", name: p.h1, url: `${SITE.url}/halal/${p.slug}` })),
  };

  return (
    <>
      <JsonLd
        data={[
          collection,
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Halal directory", path: "/halal" },
          ]),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <div className="flex g6 center faint" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Halal directory</span>
            </div>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>
              Singapore’s halal &amp; Muslim-owned business directory
            </h1>
            <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>
              Browse halal-certified and Muslim-owned businesses across Singapore by category or neighbourhood. Every
              listing shows a halal-confidence score so you can choose with certainty.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <h2 style={{ fontSize: "1.4rem", marginBottom: 14 }}>Browse by category</h2>
          <div className="hub-grid">
            {catPages.map((p) => (
              <Link key={p.slug} href={`/halal/${p.slug}`} className="hub-link">
                <span>Halal {catLabel(p.catId)}</span>
                <span className="hub-link-arr" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>

          <h2 style={{ fontSize: "1.4rem", margin: "32px 0 14px" }}>Browse by area</h2>
          <div className="hub-grid">
            {areas.map((a) => (
              <Link key={a.id} href={`/halal/halal-food-in-${a.id}`} className="hub-link">
                <span>Halal food in {a.name}</span>
                <span className="hub-link-arr" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
