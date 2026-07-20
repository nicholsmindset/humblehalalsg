import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta, SITE } from "@/lib/seo";
import { certChanges, certChangesIndexable, type CertChangeEvent, type CertChange } from "@/lib/cert-changes";
import { HALALSG_BASE } from "@/lib/muis";
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";
import { Newsletter } from "@/components/newsletter";

/* Halal certification changes — the public cert-lifecycle changelog. Fed by
   dated cert_new / cert_renewed / cert_expired events our weekly re-checks and
   admin verifications log (lib/cert-changes.ts). No competitor publishes this.

   ACCURACY (lib/halal-status.ts policy): we NEVER assert a lapse as fact — a
   cert_expired event means "no longer listed per our records"; every lapse line
   points to the official MUIS HalalSG register. MUIS is the authority, we are a
   dated record of what our re-checks found.

   INDEXATION GATE: noindex until ≥10 logged events (certChangesIndexable) so
   the page never enters the index thin. */

export const revalidate = 3600;

const PATH = "/halal-certification-changes";
const TITLE = "Halal Certification Changes in Singapore — Dated Changelog";
const DESCRIPTION =
  "A dated changelog of MUIS halal-certification changes across Singapore per Humble Halal's records — newly certified businesses, renewals and lapsed listings from our weekly re-checks. Always verify on the official MUIS HalalSG register.";

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta({
    title: TITLE,
    description: DESCRIPTION,
    path: PATH,
    absoluteTitle: true,
    index: await certChangesIndexable(),
  });
}

const FAQ = [
  {
    q: "How does Humble Halal track halal certification changes?",
    a: "Our system re-checks the certification records in our directory every week — recorded MUIS certificate expiry dates, admin verifications and owner-uploaded certificates. Each change we find is logged as a dated event: newly certified, renewed, or no longer listed per our records. We record what our checks found and when; we are not a certifier.",
  },
  {
    q: "Does an expired certificate mean the food is not halal?",
    a: "Not necessarily. A lapse in our records means the certificate we had on file has passed its expiry date or is no longer listed per our records — the business may have renewed and the register simply updated after our check, or it may have chosen not to re-certify. It is not a statement that the food is not halal. Always verify the current status on the official MUIS HalalSG register.",
  },
  {
    q: "What should I do before visiting a place listed here?",
    a: "Check the official MUIS HalalSG register at halal.muis.gov.sg for the current certification status, and look for a valid MUIS halal certificate displayed at the premises. Certification is per-premises and can change at any time — this changelog reflects our records as of each dated entry, not live MUIS data.",
  },
  {
    q: "Why is a certification change I know about not listed?",
    a: "This changelog only covers published listings in the Humble Halal directory, and we log changes as our weekly re-checks and verifications find them — it is not an exhaustive mirror of the MUIS register. The authoritative and complete source is always the official MUIS HalalSG register.",
  },
];

const EVENT_META: Record<CertChangeEvent, { label: string; tone: "yes" | "warn" }> = {
  cert_new: { label: "Newly certified per our records", tone: "yes" },
  cert_renewed: { label: "Certification renewed per our records", tone: "yes" },
  cert_expired: { label: "No longer listed per our records", tone: "warn" },
};

const sgMonth = (iso: string) =>
  new Date(iso).toLocaleDateString("en-SG", { month: "long", year: "numeric", timeZone: "Asia/Singapore" });
const sgDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-SG", { day: "numeric", month: "short", timeZone: "Asia/Singapore" });

export default async function Page() {
  const changes = await certChanges(200);

  // Group newest-first by SGT month (input is already newest-first).
  const byMonth: [string, CertChange[]][] = [];
  for (const c of changes) {
    const m = sgMonth(c.date);
    const last = byMonth[byMonth.length - 1];
    if (last && last[0] === m) last[1].push(c);
    else byMonth.push([m, [c]]);
  }

  // ItemList of the businesses with logged changes (deduped, newest first).
  const seen = new Set<string>();
  const listItems: CertChange[] = [];
  for (const c of changes) {
    if (seen.has(c.businessSlug)) continue;
    seen.add(c.businessSlug);
    listItems.push(c);
  }
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Halal certification changes in Singapore (per Humble Halal records)",
    numberOfItems: listItems.length,
    itemListElement: listItems.slice(0, 50).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.businessName,
      url: `${SITE.url}/business/${c.businessSlug}`,
    })),
  };

  return (
    <>
      <JsonLd
        data={[
          ...(listItems.length ? [itemList] : []),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Halal food Singapore", path: "/halal-food-singapore" },
            { name: "Certification changes", path: PATH },
          ]),
          faqJsonLd(FAQ),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link>
              <span>›</span>
              <Link className="link-inline" href="/halal-food-singapore">Halal food</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Certification changes</span>
            </nav>
            <span className="eyebrow">Freshness log</span>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 760 }}>Halal Certification Changes in Singapore</h1>
            <p className="muted" style={{ maxWidth: 680, marginTop: 10, fontSize: "1.05rem" }}>
              A <strong>dated changelog of halal-certification changes per our records</strong> — newly certified
              businesses, renewals and lapsed listings, logged as our weekly re-checks and verifications find them.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <div className="notice notice-warn" style={{ marginBottom: 22 }}>
            <span>
              <strong>MUIS HalalSG is the authority.</strong> Entries below are Humble Halal&apos;s dated records — not
              live MUIS data, and never a ruling on whether food is halal. A lapse means a certificate is no longer
              listed per our records; the business may have since renewed. Always verify the current status on the
              official{" "}
              <a className="link-inline" href={HALALSG_BASE} target="_blank" rel="noopener noreferrer">MUIS HalalSG register</a>.
              Humble Halal is a discovery platform, not a halal certifier.
            </span>
          </div>

          {byMonth.length ? (
            byMonth.map(([month, items]) => (
              <section key={month} style={{ marginBottom: 26 }}>
                <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>{month}</h2>
                <ul style={{ display: "grid", gap: 12, padding: 0, margin: 0, listStyle: "none" }}>
                  {items.map((c) => {
                    const m = EVENT_META[c.event];
                    return (
                      <li key={c.id} style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap", borderBottom: "1px solid var(--line, #ECE7DB)", paddingBottom: 12 }}>
                        <span className="faint" style={{ fontSize: ".82rem", fontWeight: 600, minWidth: 52 }}>{sgDay(c.date)}</span>
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <Link href={`/business/${c.businessSlug}`} style={{ fontWeight: 700 }}>{c.businessName}</Link>
                          {c.area ? <span className="muted" style={{ fontSize: ".92rem" }}> · {c.area}</span> : null}
                          {c.event === "cert_expired" ? (
                            <div className="faint" style={{ fontSize: ".84rem", marginTop: 3 }}>
                              Certificate no longer listed per our records —{" "}
                              <a className="link-inline" href={HALALSG_BASE} target="_blank" rel="noopener noreferrer">
                                verify on the official MUIS HalalSG register
                              </a>.
                            </div>
                          ) : null}
                        </div>
                        <span className={`hs-pill hs-${m.tone}`}>{m.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          ) : (
            <p className="muted">
              No certification changes logged yet — we log changes as our weekly re-checks find them, so this page
              fills in over time. Meanwhile, check any establishment on the official{" "}
              <a className="link-inline" href={HALALSG_BASE} target="_blank" rel="noopener noreferrer">MUIS HalalSG register</a>{" "}
              or explore <Link href="/new-halal-restaurants-singapore">new halal restaurants</Link>.
            </p>
          )}

          <div className="hub-grid" style={{ marginTop: 28 }}>
            <Link href="/new-halal-restaurants-singapore" className="hub-link"><span>New halal restaurants</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/is-halal" className="hub-link"><span>Is it halal? Brand checker</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
            <Link href="/explore" className="hub-link"><span>Browse the full directory</span><span className="hub-link-arr" aria-hidden="true">→</span></Link>
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

          <section className="newsletter-card" style={{ marginTop: 30 }}>
            <span className="eyebrow">The weekly halal guide</span>
            <h2 style={{ fontSize: "1.25rem", margin: "6px 0 10px" }}>Certification changes, in your inbox.</h2>
            <p className="muted" style={{ marginBottom: 12 }}>New certifications, renewals and lapses per our records — weekly.</p>
            <Newsletter source="cert-changes" cta="Subscribe" />
          </section>
        </div>
      </div>
    </>
  );
}
