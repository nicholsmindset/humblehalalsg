/* Shared skeleton for authority guides, directories and seasonal hubs
   (SEO blueprint Hub 3). Server component — answer-first hero, content
   sections, hub links, FAQ (visible + FAQPage schema), breadcrumbs. */
import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd, faqJsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { LeadInline } from "@/components/lead-capture/lead-inline";
import { LeadCapturePopup } from "@/components/lead-capture/lead-capture-popup";

export interface QAItem { q: string; a: string }
export interface Crumb { name: string; path: string }
export interface HubLinkItem { label: string; href: string }
export interface ContentSection { heading: string; body: ReactNode }

export function ContentPage({
  crumbs,
  h1,
  intro,
  sections = [],
  links,
  linksHeading = "Explore next",
  faq,
  extraJsonLd = [],
  children,
  leadVertical,
}: {
  /** Breadcrumb trail INCLUDING the current page as the last item. */
  crumbs: Crumb[];
  h1: string;
  /** Answer-first opening (the first 40–60 words answer the query — AIO rule). */
  intro: ReactNode;
  sections?: ContentSection[];
  links?: HubLinkItem[];
  linksHeading?: string;
  faq?: QAItem[];
  extraJsonLd?: object[];
  children?: ReactNode;
  /** Lead vertical id (lib/lead-verticals) — renders the subtle inline
      capture + the vertical popup (both flag-gated client-side). */
  leadVertical?: string;
}) {
  const current = crumbs[crumbs.length - 1];
  return (
    <>
      <JsonLd
        data={[
          ...(faq?.length ? [faqJsonLd(faq)] : []),
          breadcrumbJsonLd([{ name: "Home", path: "/" }, ...crumbs]),
          ...extraJsonLd,
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            {/* Centered reading column (owner rule: content centered on every
                page) — mirrors the blog's .article-head treatment instead of
                pinning a ~760px column to the left of the wide hh-wrap. */}
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
              <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
                <Link className="link-inline" href="/">Home</Link>
                {crumbs.map((c) => (
                  <span key={c.path} style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                    <span>›</span>
                    {c.path === current.path ? (
                      <span style={{ color: "var(--ink)" }}>{c.name}</span>
                    ) : (
                      <Link className="link-inline" href={c.path}>{c.name}</Link>
                    )}
                  </span>
                ))}
              </nav>
              <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)" }}>{h1}</h1>
              <p className="muted" style={{ marginTop: 10, fontSize: "1.05rem" }}>{intro}</p>
            </div>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {sections.map((s) => (
            <section key={s.heading} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: "1.4rem", marginBottom: 12 }}>{s.heading}</h2>
              <div className="muted" style={{ lineHeight: 1.7 }}>{s.body}</div>
            </section>
          ))}

          {children}

          {/* Subtle vertical lead capture (flag-gated client-side; renders
              nothing while leadCapture is off) + the coordinated popup. */}
          {leadVertical && <LeadInline vertical={leadVertical} surface="hub" />}
          {leadVertical && <LeadCapturePopup vertical={leadVertical} />}

          {links?.length ? (
            <>
              <h2 style={{ fontSize: "1.4rem", margin: "32px 0 14px" }}>{linksHeading}</h2>
              <div className="hub-grid">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} className="hub-link">
                    <span>{l.label}</span>
                    <span className="hub-link-arr" aria-hidden="true">→</span>
                  </Link>
                ))}
              </div>
            </>
          ) : null}

          {faq?.length ? (
            <>
              <h2 style={{ fontSize: "1.4rem", margin: "32px 0 14px" }}>Your questions, answered</h2>
              <div className="stack g12">
                {faq.map((f) => (
                  <details key={f.q} className="faq-item">
                    <summary style={{ fontWeight: 600 }}>{f.q}</summary>
                    <p className="muted" style={{ marginTop: 8, lineHeight: 1.6 }}>{f.a}</p>
                  </details>
                ))}
              </div>
            </>
          ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
