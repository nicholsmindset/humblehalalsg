import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { JsonLd, faqJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Newsletter } from "@/components/newsletter";

export const metadata: Metadata = pageMeta({
  title: "Ramadan 2026 Singapore — Dates, Bazaars & Iftar Guide",
  description:
    "When is Ramadan 2026? Expected to begin around 18 February 2026. Your Singapore guide to fasting times, the Geylang Serai bazaar, iftar spots and Raya.",
  path: "/ramadan",
  absoluteTitle: true,
});

const FAQ = [
  { q: "When is Ramadan 2026?", a: "Ramadan 2026 (1447 AH) is expected to begin on or around 18 February 2026 in Singapore, subject to the official moon sighting confirmed by MUIS. The first day of fasting follows the sighting of the new moon." },
  { q: "When is Hari Raya Aidilfitri 2026?", a: "Hari Raya Aidilfitri (Eid al-Fitr) 2026 is expected to fall on or around 20 March 2026, marking the end of Ramadan, subject to the official moon sighting." },
  { q: "Where is the Ramadan bazaar in Singapore 2026?", a: "The largest Ramadan bazaar is at Geylang Serai, alongside neighbourhood bazaars across Singapore. They typically run for the weeks leading up to Hari Raya." },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(FAQ),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Ramadan 2026", path: "/ramadan" },
          ]),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Ramadan 2026</span>
            </nav>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>Ramadan 2026 in Singapore</h1>
            <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>
              <strong>Ramadan 2026 is expected to begin around 18 February 2026</strong> (1447 AH), subject to the
              official MUIS moon sighting. Here&apos;s your Singapore guide to fasting times, bazaars, iftar spots and Hari Raya.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <h2 style={{ fontSize: "1.4rem", marginBottom: 14 }}>Plan your Ramadan</h2>
          <div className="hub-grid">
            <Link href="/tools/prayer-times" className="hub-link"><span>Sahur &amp; iftar prayer times</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/tools/islamic-calendar" className="hub-link"><span>Islamic calendar 2026</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/tools/zakat" className="hub-link"><span>Zakat calculator</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/ramadan-bazaar-singapore" className="hub-link"><span>Geylang Serai &amp; Ramadan bazaars</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/iftar-buka-puasa-singapore" className="hub-link"><span>Iftar &amp; buka puasa spots</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/halal-buffet-singapore" className="hub-link"><span>Halal buffets for iftar</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/halal-catering-singapore" className="hub-link"><span>Ramadan &amp; Raya catering</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/mosques" className="hub-link"><span>Mosques for tarawih</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/hari-raya" className="hub-link"><span>Hari Raya 2026 guide</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
          </div>

          <section className="newsletter-card mt24" style={{ maxWidth: 640 }}>
            <span className="eyebrow" style={{ color: "var(--emerald)" }}>🌙 Free Ramadan 2026 Planner</span>
            <h2 style={{ fontSize: "1.25rem", marginTop: 8 }}>Get the Ramadan 2026 Planner</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              A 30-day fasting tracker, iftar spots, sahur &amp; iftar times and a zakat checklist — plus our
              weekly halal guide for Singapore. We&apos;ll email it to you.
            </p>
            <div style={{ marginTop: 14 }}>
              <Newsletter source="ramadan" cta="Send me the planner" />
            </div>
          </section>

          <div className="seo-prose mt24" style={{ maxWidth: 720 }}>
            <h2 style={{ fontSize: "1.4rem", margin: "8px 0 12px" }}>Frequently asked</h2>
            {FAQ.map((f) => (
              <details key={f.q} className="faq-item" name="ramadan-faq">
                <summary>{f.q}<span className="faq-chevron" aria-hidden="true" /></summary>
                <p className="muted" style={{ padding: "8px 0" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
