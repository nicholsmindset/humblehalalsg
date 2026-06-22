import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Newsletter } from "@/components/newsletter";

export const metadata: Metadata = pageMeta({
  title: "Free Halal Guides — Singapore Food, Ramadan & Brand Cheat-Sheet",
  description:
    "Download HumbleHalal's free guides: the Ultimate Halal Food Guide by MRT Station, the Ramadan 2026 Planner with Singapore sahur & iftar times, and the Halal Brand Status Cheat-Sheet.",
  path: "/guides",
  absoluteTitle: true,
});

type Guide = { file: string; title: string; blurb: string; tag: string };

const GUIDES: Guide[] = [
  {
    file: "ultimate-halal-food-guide-mrt.pdf",
    title: "Ultimate Halal Food Guide by MRT Station",
    blurb:
      "Verified halal & Muslim-owned spots across Singapore, grouped by the nearest MRT — with clear MUIS-certified vs self-declared labels.",
    tag: "Directory",
  },
  {
    file: "ramadan-2026-planner.pdf",
    title: "Ramadan 2026 Planner",
    blurb:
      "A day-by-day fasting companion: Singapore sahur & iftar times (MUIS method), a tracker, zakat reference and Ramadan tips.",
    tag: "Seasonal",
  },
  {
    file: "halal-brand-cheat-sheet.pdf",
    title: "Halal Brand Status Cheat-Sheet",
    blurb:
      "Quick yes/no verdicts for popular Singapore food brands, checked against the MUIS HalalSG register. Know before you go.",
    tag: "Is it halal?",
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Free Guides", path: "/guides" },
          ]),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Free Guides</span>
            </nav>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>Free halal guides</h1>
            <p className="muted" style={{ maxWidth: 640, marginTop: 10, fontSize: "1.05rem" }}>
              Download our most useful guides for Muslim life in Singapore — free. Subscribe to the weekly
              newsletter and we&apos;ll keep them updated in your inbox.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <div className="hub-grid">
            {GUIDES.map((g) => (
              <a key={g.file} href={`/guides/${g.file}`} className="hub-link" download>
                <span>
                  <strong style={{ display: "block" }}>{g.title}</strong>
                  <span className="muted" style={{ fontSize: ".88rem" }}>{g.blurb}</span>
                </span>
                <span className="hub-link-arr" aria-hidden="true">↓</span>
              </a>
            ))}
          </div>

          <section className="newsletter-card" style={{ marginTop: 24, maxWidth: 640 }}>
            <span className="eyebrow" style={{ color: "var(--emerald)" }}>🌙 Keep them updated</span>
            <h2 style={{ fontSize: "1.25rem", marginTop: 8 }}>Get new guides as they drop</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Join HumbleHalal for the weekly halal guide — new MUIS-verified spots, mosque events and deals
              across Singapore.
            </p>
            <div style={{ marginTop: 14 }}>
              <Newsletter source="guides" cta="Subscribe — it's free" />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
