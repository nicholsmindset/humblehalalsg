import Link from "next/link";
import type { LegalDoc } from "@/lib/legal-content";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export function LegalDocView({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: doc.title, path: `/${doc.slug}` }])} />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap" style={{ maxWidth: 800 }}>
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link><span>›</span><span style={{ color: "var(--ink)" }}>{doc.title}</span>
            </nav>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)" }}>{doc.title}</h1>
            <p className="faint" style={{ marginTop: 6, fontSize: ".84rem" }}>Last updated {doc.updated}</p>
            <p className="muted" style={{ maxWidth: 700, marginTop: 12, fontSize: "1.05rem" }}>{doc.intro}</p>
          </div>
        </section>
        <div className="hh-wrap hh-section legal-doc" style={{ maxWidth: 800 }}>
          {doc.sections.map((s) => (
            <section key={s.h2} className="legal-section">
              <h2>{s.h2}</h2>
              {s.body?.map((p, i) => <p key={i}>{p}</p>)}
              {s.bullets && <ul>{s.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
            </section>
          ))}
          <p className="faint" style={{ marginTop: 24, fontSize: ".84rem" }}>
            Humble Halal is a discovery platform, not a halal certifier. See our{" "}
            <Link className="link-inline" href="/disclaimer">Halal Disclaimer</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
