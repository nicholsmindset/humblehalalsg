import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { JsonLd, faqJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Newsletter } from "@/components/newsletter";

export const metadata: Metadata = pageMeta({
  title: "Hari Raya 2026 Singapore — Dates, Bazaars & Raya Guide",
  description:
    "When is Hari Raya 2026? Hari Raya Aidilfitri is expected around 20 March 2026. Your Singapore guide to Raya dates, bazaars, catering, baju and open houses.",
  path: "/hari-raya",
  absoluteTitle: true,
  // hreflang pair with the Malay page (lib/ms-pages.ts) — both sides declare
  // the same map, x-default → EN.
  languages: {
    "en-SG": "/hari-raya",
    ms: "/ms/hari-raya",
    "x-default": "/hari-raya",
  },
});

const FAQ = [
  { q: "When is Hari Raya 2026?", a: "Hari Raya Aidilfitri (Eid al-Fitr) 2026 is expected to fall on or around 20 March 2026 in Singapore, subject to the official MUIS moon sighting that marks the end of Ramadan." },
  { q: "When is Hari Raya Haji 2026?", a: "Hari Raya Haji (Eid al-Adha) 2026 is expected to fall on or around 27 May 2026, subject to the official moon sighting." },
  { q: "When does the Hari Raya bazaar start in 2026?", a: "The Geylang Serai Hari Raya bazaar and neighbourhood bazaars typically run through Ramadan in the weeks leading up to Hari Raya Aidilfitri." },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          faqJsonLd(FAQ),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Hari Raya 2026", path: "/hari-raya" },
          ]),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Hari Raya 2026</span>
            </nav>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 720 }}>Hari Raya 2026 in Singapore</h1>
            <p className="muted" style={{ maxWidth: 660, marginTop: 10, fontSize: "1.05rem" }}>
              <strong>Hari Raya Aidilfitri 2026 is expected around 20 March 2026</strong>, subject to the official MUIS
              moon sighting. Here&apos;s your Singapore guide to Raya dates, bazaars, catering, baju and open houses.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <h2 style={{ fontSize: "1.4rem", marginBottom: 14 }}>Get ready for Raya</h2>
          <div className="hub-grid">
            <Link href="/events" className="hub-link"><span>Geylang Serai Hari Raya bazaar</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/hari-raya-catering-singapore" className="hub-link"><span>Hari Raya catering &amp; buffets</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/modest-fashion-singapore" className="hub-link"><span>Baju kurung &amp; modest fashion</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/halal-dessert-singapore" className="hub-link"><span>Raya cookies &amp; desserts</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/tools/islamic-calendar" className="hub-link"><span>Islamic calendar 2026</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/ramadan" className="hub-link"><span>Ramadan 2026 guide</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
          </div>

          <section className="newsletter-card mt24" style={{ maxWidth: 640 }}>
            <span className="eyebrow" style={{ color: "var(--emerald)" }}>🌙 Free Hari Raya checklist</span>
            <h2 style={{ fontSize: "1.25rem", marginTop: 8 }}>Get the Hari Raya 2026 planning checklist</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Catering, baju, open-house prep and a Raya countdown — plus our weekly halal guide for Singapore.
              We&apos;ll email it to you.
            </p>
            <div style={{ marginTop: 14 }}>
              <Newsletter source="hari-raya" cta="Send me the checklist" />
            </div>
          </section>

          <div className="seo-prose mt24" style={{ maxWidth: 720 }}>
            <h2 style={{ fontSize: "1.4rem", margin: "8px 0 12px" }}>Frequently asked</h2>
            {FAQ.map((f) => (
              <details key={f.q} className="faq-item" name="raya-faq">
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
