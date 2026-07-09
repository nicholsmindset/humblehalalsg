import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { allSeoPages, seoPagePath, SEO_YEAR } from "@/lib/seo-pages";
import { JsonLd, faqJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

/* Pillar guide for the head term "halal food singapore" (2.7k/mo). Sits ABOVE
   the location/cuisine factory pages and funnels internal links into them.
   Real folder ⇒ wins over the /halal-…-singapore rewrite (afterFiles). */

export const metadata: Metadata = pageMeta({
  title: `Halal Food Singapore — The Complete Guide (${SEO_YEAR})`,
  description:
    "Where to find halal food in Singapore: MUIS-certified restaurants, Muslim-owned kitchens and hawker stalls — by neighbourhood, mall and cuisine, with halal-confidence scores.",
  path: "/halal-food-singapore",
  absoluteTitle: true,
});

const FAQ = [
  { q: "Where can I find halal food in Singapore?", a: "Halal food is available across Singapore — from MUIS-certified restaurants in malls like Jewel, VivoCity and Northpoint to Muslim-owned hawker stalls in Tampines, Bedok and Geylang Serai. Browse by area or cuisine on this page, or use the map for places near you." },
  { q: "How do I know if a restaurant in Singapore is really halal?", a: "Look for MUIS certification — Singapore's official halal authority. On Humble Halal every listing is labelled MUIS Certified, Muslim-Owned or self-declared, with a halal-confidence score. Always confirm certificates on the official MUIS HalalSG register." },
  { q: "Is 'no pork no lard' the same as halal?", a: "No. 'No pork, no lard' is a self-declaration and is NOT equivalent to MUIS halal certification — ingredients like alcohol, non-halal meat or cross-contamination may still be present. We label self-declared places clearly." },
  { q: "Which malls in Singapore have the most halal food?", a: "Jewel Changi Airport, VivoCity, Northpoint City, Jurong Point, Tampines Mall and Bugis Junction all have strong halal clusters — see our mall-by-mall halal food guides for verified options in each." },
];

export default function Page() {
  const pages = allSeoPages();
  const areaPages = pages.filter((p) => p.kind === "area").slice(0, 18);
  const venuePages = pages.filter((p) => p.kind === "venue").slice(0, 12);
  const cuisinePages = pages.filter((p) => p.kind === "cuisine");
  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(FAQ),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Halal food Singapore", path: "/halal-food-singapore" },
          ]),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Halal food Singapore</span>
            </nav>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>Halal Food in Singapore — The Complete Guide</h1>
            <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>
              <strong>Singapore has one of the world&apos;s best halal food scenes</strong> — thousands of MUIS-certified
              restaurants, Muslim-owned kitchens and hawker stalls across every neighbourhood and mall. This guide maps it
              all: browse by area, by mall or by cuisine, with a halal-confidence score on every listing so you always know
              what&apos;s certified and what&apos;s self-declared.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <h2 style={{ fontSize: "1.4rem", marginBottom: 14 }}>Start here</h2>
          <div className="hub-grid">
            <Link href="/halal-food-near-me" className="hub-link"><span>Halal food near me</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/best-halal-restaurants-singapore" className="hub-link"><span>Best halal restaurants {SEO_YEAR}</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/new-halal-restaurants-singapore" className="hub-link"><span>New halal openings</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/hawker" className="hub-link"><span>Halal hawker finder</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/map" className="hub-link"><span>Map view</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/is-halal" className="hub-link"><span>Is this brand halal? checker</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
          </div>

          <h2 style={{ fontSize: "1.4rem", margin: "32px 0 14px" }}>Halal food by neighbourhood</h2>
          <div className="hub-grid">
            {areaPages.map((p) => (
              <Link key={p.slug} href={seoPagePath(p)} className="hub-link">
                <span>Halal food in {p.areaName}</span>
                <span className="hub-link-arr" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>

          <h2 style={{ fontSize: "1.4rem", margin: "32px 0 14px" }}>Halal food by mall</h2>
          <div className="hub-grid">
            {venuePages.map((p) => (
              <Link key={p.slug} href={seoPagePath(p)} className="hub-link">
                <span>Halal food at {p.areaName}</span>
                <span className="hub-link-arr" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>

          <h2 style={{ fontSize: "1.4rem", margin: "32px 0 14px" }}>Halal food by cuisine</h2>
          <div className="hub-grid">
            {cuisinePages.map((p) => (
              <Link key={p.slug} href={seoPagePath(p)} className="hub-link">
                <span>{p.h1.replace(/ in Singapore$/, "")}</span>
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
