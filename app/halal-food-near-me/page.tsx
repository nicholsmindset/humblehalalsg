import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { allSeoPages, seoPagePath, SEO_YEAR } from "@/lib/seo-pages";
import { JsonLd, faqJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

/* Geo hub for the biggest keyword in the dataset: "halal food near me"
   (14k/mo, KD 8). Server-rendered content for crawlers + a prominent
   "use my location" path into /map (the existing geolocation surface). */

export const metadata: Metadata = pageMeta({
  title: `Halal Food Near Me — Find Halal in Singapore (${SEO_YEAR})`,
  description:
    "Find halal food near you in Singapore — MUIS-certified restaurants, Muslim-owned stalls and cafés with live map, halal-confidence scores and directions.",
  path: "/halal-food-near-me",
  absoluteTitle: true,
});

const FAQ = [
  { q: "How do I find halal food near me in Singapore?", a: "Open the Humble Halal map and allow location access — it shows MUIS-certified and Muslim-owned places around you with halal-confidence scores, opening hours and directions. Or browse by neighbourhood below." },
  { q: "Is the halal food on this site verified?", a: "Every listing is labelled MUIS Certified, Muslim-Owned or self-declared, with a halal-confidence score and links to evidence. Humble Halal is a discovery platform, not a certifier — always confirm certificates on the MUIS HalalSG register." },
  { q: "Can I filter for prayer spaces nearby?", a: "Yes — the explore and map views can filter for places with prayer spaces, and the mosques directory shows the nearest masjid with walking distance." },
  { q: "Does this work at malls and MRT stations?", a: "Yes — we have dedicated halal food guides for major malls (Jewel, VivoCity, Northpoint, Jurong Point…) and MRT areas, each listing verified options inside or within a short walk." },
];

export default function Page() {
  const pages = allSeoPages();
  const areaPages = pages.filter((p) => p.kind === "area").slice(0, 18);
  const mrtPages = pages.filter((p) => p.kind === "mrt");
  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(FAQ),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Halal food near me", path: "/halal-food-near-me" },
          ]),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Halal food near me</span>
            </nav>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>Halal Food Near Me</h1>
            <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>
              <strong>Find halal food near you in Singapore in seconds</strong> — open the live map to see MUIS-certified
              restaurants, Muslim-owned stalls and halal cafés around your location, each with a halal-confidence score,
              opening hours and directions. Prefer to browse? Jump into your neighbourhood below.
            </p>
            <div className="pillbar" style={{ marginTop: 16 }}>
              <Link className="btn btn-primary" href="/map">📍 Use my location — open the map</Link>
              <Link className="chip" href="/explore">Browse all places</Link>
              <Link className="chip" href="/hawker">Hawker finder</Link>
            </div>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <h2 style={{ fontSize: "1.4rem", marginBottom: 14 }}>Halal food by neighbourhood</h2>
          <div className="hub-grid">
            {areaPages.map((p) => (
              <Link key={p.slug} href={seoPagePath(p)} className="hub-link">
                <span>Halal food in {p.areaName}</span>
                <span className="hub-link-arr" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>

          <h2 style={{ fontSize: "1.4rem", margin: "32px 0 14px" }}>Halal food near MRT stations</h2>
          <div className="hub-grid">
            {mrtPages.map((p) => (
              <Link key={p.slug} href={seoPagePath(p)} className="hub-link">
                <span>{p.h1}</span>
                <span className="hub-link-arr" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>

          <h2 style={{ fontSize: "1.4rem", margin: "32px 0 14px" }}>Your questions, answered</h2>
          <div className="stack g12">
            {FAQ.map((f) => (
              <details key={f.q} className="faq-item">
                <summary style={{ fontWeight: 600 }}>{f.q}</summary>
                <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
