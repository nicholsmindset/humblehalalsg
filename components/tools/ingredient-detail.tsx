/* Server component — the reusable ingredient detail-page template. Driven
   entirely by an `Additive` object (no hardcoded ingredient), so every
   indexable ingredient renders from structured data. All primary content is in
   the server HTML (no client-JS dependency); the only island is the optional
   "Copy label names" button. Layout mirrors the approved E104 design: hero
   assessment card + "also known as" chips + icon-led sections + MUIS verify
   card, an "At a glance" sidebar, and native <details> accordions for
   health/regulatory, FAQ, related ingredients and sources. */
import Link from "next/link";
import { Icon } from "@/components/ui";
import { CopyLabels } from "./copy-labels";
import { HALALSG_BASE } from "@/lib/muis";
import {
  ADDITIVES, STATUS_META, ingredientSlug, ingredientQualifies,
  type Additive, type OriginType,
} from "@/lib/tools/ingredients";

const ORIGIN_LABEL: Record<OriginType, string> = {
  synthetic: "Synthetic",
  plant: "Plant-derived",
  microbial: "Microbial (fermentation)",
  mineral: "Mineral",
  animal: "Animal-derived",
  insect: "Insect-derived",
  variable: "Source-dependent",
};

/** "2026-07-18" → "July 2026". Falls back to the raw string if unparseable. */
function reviewedLabel(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** Trim an organisation string to a short label for the source line, e.g.
    "European Food Safety Authority (EFSA)" → "EFSA". */
function shortOrg(org: string): string {
  const m = org.match(/\(([^)]+)\)/);
  return m ? m[1] : org;
}

function GlanceRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="ingd-glance-row">
      <span className="ingd-glance-key"><Icon name={icon} size={17} /> {label}</span>
      <span className="ingd-glance-val">{children}</span>
    </div>
  );
}

export function IngredientDetail({ a }: { a: Additive }) {
  const m = STATUS_META[a.status];
  const h1 = a.code ? `Is ${a.code} (${a.name}) Halal?` : `Is ${a.name} Halal?`;
  const directAnswer = a.originSummary || a.halalReasoning || a.origin;

  const aka = a.alternativeNames?.length
    ? a.alternativeNames
    : [a.code, a.name, ...(a.aliases || [])].filter(Boolean);

  const faqs = (a.faqs || []).filter((f) => f.q?.trim() && f.a?.trim());
  const related = (a.relatedCodes || [])
    .map((c) => ADDITIVES.find((x) => x.code === c))
    .filter((x): x is Additive => !!x && ingredientQualifies(x));

  const reviewed = reviewedLabel(a.lastReviewed);
  const sourceOrgs = [...new Set((a.sources || []).map((s) => shortOrg(s.organisation)))];
  const whyHeading =
    a.status === "halal" ? "Why is it generally halal?"
    : a.status === "haram" ? "Why is it best avoided?"
    : "Why is it doubtful (mushbooh)?";

  return (
    <div className="screen-in hh-page ing-detail">
      <section className="seo-hero hh-pattern">
        <div className="hh-wrap">
          <nav className="ingd-crumb" aria-label="Breadcrumb">
            <Link className="link-inline" href="/tools">Tools</Link>
            <span aria-hidden="true">›</span>
            <Link className="link-inline" href="/tools/ingredient-checker">Ingredient Checker</Link>
            <span aria-hidden="true">›</span>
            <span className="ingd-crumb-cur">{a.code ? `${a.code} ${a.name}` : a.name}</span>
          </nav>
          <h1 className="ingd-h1">{h1}</h1>
        </div>
      </section>

      <div className="hh-wrap hh-section ingd-grid">
        {/* ── Main column ─────────────────────────────────────────────── */}
        <div className="ingd-main">
          {/* Hero assessment card */}
          <div className={`ingd-verdict ingd-verdict-${m.tone}`}>
            <div className={`ingd-verdict-badge hs-${m.tone}`} aria-hidden="true">
              <Icon name={a.status === "halal" ? "shield" : a.status === "haram" ? "warning" : "info"} size={30} />
            </div>
            <div>
              <span className="ingd-verdict-eyebrow">Our assessment</span>
              <p className="ingd-verdict-label">{m.label}</p>
              <p className="ingd-answer">{directAnswer}</p>
            </div>
          </div>

          {/* Also known as */}
          {aka.length > 0 && (
            <div className="ingd-aka">
              <span className="ingd-aka-lbl">Also known as</span>
              <span className="ingd-aka-chips">
                {aka.slice(0, 6).map((n) => (
                  <span key={n} className="ingd-chip">{n}</span>
                ))}
              </span>
            </div>
          )}

          {/* What is this ingredient */}
          {(a.description || a.manufacturingSummary) && (
            <section className="ingd-block">
              <span className="ingd-block-icon" aria-hidden="true"><Icon name="info" size={20} /></span>
              <div className="ingd-block-body">
                <h2>What is {a.code || a.name}?</h2>
                {a.description && <p>{a.description}</p>}
                {a.manufacturingSummary && <p className="muted">{a.manufacturingSummary}</p>}
              </div>
            </section>
          )}

          {/* Why halal / doubtful / avoid */}
          {a.halalReasoning && (
            <section className="ingd-block">
              <span className="ingd-block-icon" aria-hidden="true"><Icon name="shield" size={20} /></span>
              <div className="ingd-block-body">
                <h2>{whyHeading}</h2>
                <p>{a.halalReasoning}</p>
              </div>
            </section>
          )}

          {/* Commonly found in */}
          {!!a.commonUses?.length && (
            <section className="ingd-block">
              <span className="ingd-block-icon" aria-hidden="true"><Icon name="basket" size={20} /></span>
              <div className="ingd-block-body">
                <h2>Commonly found in</h2>
                <p className="faint" style={{ marginTop: 0 }}>It <strong>may be found in</strong> — this does not mean every product below contains it.</p>
                <ul className="ingd-uses">
                  {a.commonUses.map((u) => (
                    <li key={u} className="ingd-use"><Icon name="check" size={15} /> {u}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* How it appears on labels */}
          {!!a.labelNames?.length && (
            <section className="ingd-block">
              <span className="ingd-block-icon" aria-hidden="true"><Icon name="tag" size={20} /></span>
              <div className="ingd-block-body">
                <div className="ingd-labels-head">
                  <h2>How it appears on labels</h2>
                  <CopyLabels labels={a.labelNames} />
                </div>
                <div className="ingd-labelchips">
                  {a.labelNames.map((n) => <code key={n} className="ingd-label">{n}</code>)}
                </div>
                {a.insNumber && <p className="faint" style={{ marginTop: 10 }}>INS number: <strong>{a.insNumber}</strong></p>}
              </div>
            </section>
          )}

          {/* Singapore verification */}
          <section className="ingd-verify">
            <span className="ingd-verify-icon" aria-hidden="true"><Icon name="building" size={22} /></span>
            <div className="ingd-verify-body">
              <h2>How to verify a product in Singapore</h2>
              <ol className="ingd-steps">
                <li>Ingredient-level guidance is <strong>not</strong> halal certification — check the complete product, not just this ingredient.</li>
                <li>Look for recognised halal certification, and check the finished product on the official MUIS HalalSG register.</li>
                <li>When the source or processing aids are unclear, contact the manufacturer.</li>
              </ol>
              {a.singaporeGuidance && <p className="muted ingd-sg-note">{a.singaporeGuidance}</p>}
              <a className="ingd-verify-cta" href={HALALSG_BASE} target="_blank" rel="noopener noreferrer">
                Check MUIS HalalSG <Icon name="external" size={15} />
              </a>
            </div>
          </section>

          {/* Compact source line */}
          <p className="ingd-sourceline">
            <Icon name="info" size={14} />{" "}
            {sourceOrgs.length > 0 && <>Sources: {sourceOrgs.join(", ")} · </>}
            {reviewed && <>Last reviewed: {reviewed} · </>}
            This guidance is not certification.
          </p>

          {/* ── Accordions ────────────────────────────────────────────── */}
          <div className="ingd-accordions">
            {(a.healthSummary || a.regulatorySummary) && (
              <details className="ingd-acc">
                <summary><Icon name="heart" size={18} /> Health &amp; regulatory information <span className="ingd-acc-chev" aria-hidden="true" /></summary>
                <div className="ingd-acc-body">
                  <p className="ingd-health-callout">Halal does not automatically mean healthy, and a health concern does not automatically make an ingredient haram.</p>
                  {a.healthSummary && <><h3>Health &amp; safety</h3><p>{a.healthSummary}</p></>}
                  {a.regulatorySummary && <><h3>Regulatory status</h3><p>{a.regulatorySummary}</p></>}
                </div>
              </details>
            )}

            {faqs.length > 0 && (
              <details className="ingd-acc" open>
                <summary><Icon name="info" size={18} /> Frequently asked questions <span className="ingd-acc-chev" aria-hidden="true" /></summary>
                <div className="ingd-acc-body">
                  <div className="ingd-faqs">
                    {faqs.map((f) => (
                      <div key={f.q} className="ingd-faq-item">
                        <h3>{f.q}</h3>
                        <p>{f.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            )}

            {related.length > 0 && (
              <details className="ingd-acc">
                <summary><Icon name="list" size={18} /> Related ingredients <span className="ingd-acc-chev" aria-hidden="true" /></summary>
                <div className="ingd-acc-body">
                  <ul className="ingd-related">
                    {related.map((r) => {
                      const rm = STATUS_META[r.status];
                      return (
                        <li key={r.code}>
                          <Link href={`/tools/ingredient-checker/${ingredientSlug(r)}`} className="ingd-related-link">
                            <span>{r.code ? <><strong>{r.code}</strong> · </> : null}{r.name}</span>
                            <span className={`hs-pill hs-${rm.tone}`}>{rm.verdict}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </details>
            )}

            {!!a.sources?.length && (
              <details className="ingd-acc">
                <summary><Icon name="doc" size={18} /> Sources &amp; methodology <span className="ingd-acc-chev" aria-hidden="true" /></summary>
                <div className="ingd-acc-body">
                  <ul className="ingd-sources">
                    {a.sources.map((s) => (
                      <li key={s.title}>
                        {s.url
                          ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="link-inline">{s.title}</a>
                          : <span>{s.title}</span>}
                        <span className="faint"> — {s.organisation}{s.supports ? ` · ${s.supports}` : ""}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="muted ingd-method">
                    <strong>Humble Halal methodology:</strong> we classify additives by their common
                    origin, not by any specific product. A generally-halal ingredient does not make a
                    finished product halal-certified. This page is general guidance, not certification
                    or religious/legal advice — always verify the complete product.
                    {reviewed && <> Last reviewed {reviewed}.</>}
                  </p>
                </div>
              </details>
            )}
          </div>
        </div>

        {/* ── Sidebar: At a glance ───────────────────────────────────── */}
        <aside className="ingd-side">
          <div className="ingd-glance">
            <h2 className="ingd-glance-title">At a glance</h2>
            <GlanceRow icon="shield" label="Status">
              <span className={`hs-pill hs-${m.tone}`}>{m.verdict}</span>
            </GlanceRow>
            {a.confidence && (
              <GlanceRow icon="chart" label="Confidence">
                {a.confidence.charAt(0).toUpperCase() + a.confidence.slice(1)}
              </GlanceRow>
            )}
            {a.originType && <GlanceRow icon="sparkles" label="Origin">{ORIGIN_LABEL[a.originType]}</GlanceRow>}
            {a.fn && <GlanceRow icon="tag" label="Function">{a.fn}</GlanceRow>}
            {a.code && <GlanceRow icon="doc" label="E-number">{a.code}</GlanceRow>}
            {a.insNumber && <GlanceRow icon="doc" label="INS number">{a.insNumber}</GlanceRow>}
            {reviewed && <GlanceRow icon="calendar" label="Last reviewed">{reviewed}</GlanceRow>}
            <GlanceRow icon="check" label="Verification">Product-level required</GlanceRow>

            <Link href="/tools/ingredient-checker" className="ingd-glance-cta">Check another ingredient</Link>
            <p className="ingd-glance-note">
              Our assessments are based on ingredient origin and established references.
              Always check the product label and its halal certification.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
