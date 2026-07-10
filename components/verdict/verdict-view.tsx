/* Server component — renders an APPROVED AI-drafted halal verdict on
   /is-halal/[slug]. Reuses the /is-halal verdict pill/tone classes. Always
   carries the "informational, not a certifier — verify on MUIS HalalSG"
   disclaimer, the review date, and (for halal/likely) the cited sources. */
import Link from "next/link";
import { halalSgSearchUrl, HALALSG_BASE } from "@/lib/muis";
import { VERDICT_META, CONFIDENCE_META } from "@/lib/verdicts";
import type { StoredVerdict } from "@/lib/verdicts-data";

const ING_TONE: Record<string, string> = { halal: "yes", mushbooh: "warn", haram: "no", unknown: "warn" };
const ING_LABEL: Record<string, string> = { halal: "Halal", mushbooh: "Doubtful", haram: "Avoid", unknown: "Unclear" };

// Only ever turn a source into a clickable link when it is a plain http(s) URL —
// a stored `javascript:`/`data:` "url" must render as inert text, never an <a>.
const isHttpUrl = (u: string | undefined | null): u is string => !!u && /^https?:\/\//i.test(u);

export function VerdictView({ v }: { v: StoredVerdict }) {
  const m = VERDICT_META[v.verdict];
  const title = v.h1 || `Is ${v.name} Halal in Singapore?`;
  const related = v.internal_links?.related_checks || [];

  return (
    <div className="screen-in hh-page">
      <section className="seo-hero hh-pattern">
        <div className="hh-wrap">
          <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
            <Link className="link-inline" href="/">Home</Link><span>›</span>
            <Link className="link-inline" href="/is-halal">Is it halal?</Link><span>›</span>
            <span style={{ color: "var(--ink)" }}>{v.name}</span>
          </nav>
          <h1 style={{ fontSize: "clamp(1.7rem,4vw,2.5rem)", maxWidth: 720 }}>{title}</h1>

          <div className={`hs-verdict hs-${m.tone}`} style={{ marginTop: 16 }}>
            <div className="hs-verdict-head">
              <span className={`hs-pill hs-${m.tone}`}>{v.verdict_label || m.label}</span>
              <span className="hs-verdict-label">{v.cert_status} · {CONFIDENCE_META[v.confidence]}</span>
            </div>
            {v.one_line_answer && <p className="hs-verdict-answer">{v.one_line_answer}</p>}
            <div className="hs-verdict-meta">
              {v.date_reviewed && <><span>Reviewed: {v.date_reviewed}</span><span>·</span></>}
              <span>Human-reviewed · informational, not certification</span>
            </div>
            <a className="btn btn-primary btn-sm" href={halalSgSearchUrl(v.name)} target="_blank" rel="noopener noreferrer" style={{ marginTop: 12 }}>
              Verify on MUIS HalalSG →
            </a>
          </div>
        </div>
      </section>

      <div className="hh-wrap hh-section" style={{ maxWidth: 760 }}>
        <div className="notice notice-warn">
          <span>
            <strong>Important:</strong> This is general guidance, not a fatwa or halal certification, and statuses change.
            Always confirm the current status on the official{" "}
            <a className="link-inline" href={HALALSG_BASE} target="_blank" rel="noopener noreferrer">MUIS HalalSG register</a>.
            Humble Halal is a discovery platform, not a halal certifier.
          </span>
        </div>

        {v.why_verdict.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.3rem", margin: "26px 0 12px" }}>Why this verdict</h2>
            {v.why_verdict.map((p, i) => <p key={i} className="muted" style={{ lineHeight: 1.65, marginBottom: 10 }}>{p}</p>)}
          </>
        )}

        {v.confidence_explainer && (
          <p className="faint" style={{ fontSize: ".9rem", marginTop: 4 }}>
            <strong>Confidence — {CONFIDENCE_META[v.confidence]}:</strong> {v.confidence_explainer}
          </p>
        )}

        {v.official_sources.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.3rem", margin: "26px 0 12px" }}>Official sources</h2>
            <ul className="stack g8" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {v.official_sources.map((s, i) => (
                <li key={i} className="card" style={{ padding: "10px 12px" }}>
                  <strong>{s.body}</strong> — {s.claim}
                  {isHttpUrl(s.url) && <> · <a className="link-inline" href={s.url} target="_blank" rel="noopener noreferrer">source</a></>}
                </li>
              ))}
            </ul>
          </>
        )}

        {v.ingredient_table.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.3rem", margin: "26px 0 12px" }}>Ingredients at a glance</h2>
            <ul className="stack g6" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {v.ingredient_table.map((r, i) => (
                <li key={i} className="hs-row" style={{ cursor: "default" }}>
                  <span className="hs-row-name">{r.name}{r.note ? <span className="faint" style={{ fontWeight: 400 }}> — {r.note}</span> : null}</span>
                  <span className={`hs-pill hs-${ING_TONE[r.status] || "warn"}`}>{ING_LABEL[r.status] || r.status}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {v.scholarly_views.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.3rem", margin: "26px 0 12px" }}>Where scholars differ</h2>
            {v.scholarly_views.map((s, i) => (
              <p key={i} className="muted" style={{ lineHeight: 1.65, marginBottom: 8 }}><strong>{s.view}:</strong> {s.position}</p>
            ))}
          </>
        )}

        {v.look_for.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.3rem", margin: "26px 0 12px" }}>What to look for</h2>
            <ul className="stack g6" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {v.look_for.map((l, i) => (
                <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}><span aria-hidden>{l.icon}</span><span className="muted">{l.text}</span></li>
              ))}
            </ul>
          </>
        )}

        {v.alternatives.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.3rem", margin: "26px 0 12px" }}>Halal alternatives</h2>
            <div className="flex g6 wrap">{v.alternatives.map((a, i) => <span key={i} className="chip">{a}</span>)}</div>
          </>
        )}

        {related.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.3rem", margin: "30px 0 12px" }}>Check another</h2>
            <div className="hub-grid">
              {related.map((slug) => (
                <Link key={slug} href={`/is-halal/${slug}`} className="hs-row">
                  <span className="hs-row-name">Is {slug.replace(/-/g, " ")} halal?</span>
                  <span className="hs-pill hs-warn">Check</span>
                </Link>
              ))}
            </div>
            <p style={{ marginTop: 16 }}><Link className="link-inline" href="/is-halal">See all brands in the halal checker →</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
