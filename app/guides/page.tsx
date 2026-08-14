import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Newsletter } from "@/components/newsletter";

export const metadata: Metadata = pageMeta({
  title: "Free 10-Minute Halal Weekend Planner — Singapore",
  description:
    "Plan one meal, one prayer stop and one meaningful activity with Humble Halal's free reusable Singapore weekend planner.",
  path: "/guides",
  absoluteTitle: true,
});

const INCLUDES = [
  ["1", "Pick one area", "Keep the route simple before choosing the details."],
  ["2", "Plan food and prayer", "Choose a main meal, a backup and a prayer stop."],
  ["3", "Check before you go", "Use a clear halal-status check and current live sources."],
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Free Weekend Planner", path: "/guides" },
          ]),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link>
              <span>›</span>
              <span style={{ color: "var(--ink)" }}>Free Weekend Planner</span>
            </nav>
            <span className="eyebrow">Free 4-page planner</span>
            <h1 style={{ fontSize: "clamp(2rem,5vw,3.2rem)", maxWidth: 760, marginTop: 10 }}>
              Plan your halal weekend in 10 minutes
            </h1>
            <p className="muted" style={{ maxWidth: 650, marginTop: 12, fontSize: "1.08rem" }}>
              Choose one meal, place prayer into the route and add one meaningful activity—without opening
              twenty tabs or relying on an outdated list.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section" style={{ maxWidth: 960 }}>
          <div className="hub-grid" style={{ alignItems: "start" }}>
            <section aria-label="Planner preview">
              <div className="newsletter-card" style={{ borderTop: "5px solid var(--emerald)", minHeight: 360 }}>
                <span className="eyebrow">Inside the planner</span>
                <h2 style={{ fontSize: "1.7rem", marginTop: 10 }}>One small decision at a time</h2>
                <p className="muted" style={{ marginTop: 8 }}>
                  A mobile-friendly method, printable worksheet and quick halal-status check you can reuse every weekend.
                </p>
                <div style={{ display: "grid", gap: 10, marginTop: 22 }}>
                  {INCLUDES.map(([number, title, body]) => (
                    <div key={number} className="hub-link" style={{ cursor: "default" }}>
                      <span aria-hidden="true" style={{ color: "var(--emerald)", fontWeight: 800 }}>{number}</span>
                      <span>
                        <strong style={{ display: "block" }}>{title}</strong>
                        <span className="muted" style={{ fontSize: ".86rem" }}>{body}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="muted" style={{ fontSize: ".82rem", marginTop: 10 }}>
                No stale restaurant list. The planner points you to live Humble Halal pages and the official MUIS search for current details.
              </p>
            </section>

            <section className="newsletter-card" aria-labelledby="planner-form-title">
              <span className="eyebrow" style={{ color: "var(--emerald)" }}>Get it free</span>
              <h2 id="planner-form-title" style={{ fontSize: "1.45rem", marginTop: 8 }}>
                Where should we send your planner?
              </h2>
              <p className="muted" style={{ margin: "8px 0 16px" }}>
                Enter your email and we&apos;ll send it immediately. You&apos;ll also get one short Friday email with fresh Singapore finds and planning ideas.
              </p>
              <Newsletter
                source="weekend-planner:guides"
                variant="card"
                cta="Email me the planner"
                successHref="/guides/halal-weekend-planner-singapore.pdf"
                successCta="Open the planner now"
                successMessage="Sent. Check your inbox, or open the planner now."
              />
              <p className="muted" style={{ fontSize: ".78rem", marginTop: 12 }}>
                Four pages · PDF · reusable year-round · unsubscribe anytime
              </p>
            </section>
          </div>

          <section style={{ marginTop: 40 }} aria-labelledby="planner-faq">
            <h2 id="planner-faq" style={{ fontSize: "1.45rem" }}>A few useful details</h2>
            <div className="hub-grid" style={{ marginTop: 14 }}>
              <div className="newsletter-card"><strong>Is it really free?</strong><p className="muted" style={{ marginTop: 6 }}>Yes. No payment details and no account required.</p></div>
              <div className="newsletter-card"><strong>Will it go out of date?</strong><p className="muted" style={{ marginTop: 6 }}>The method is evergreen. Current places, events and halal details stay on the live site.</p></div>
              <div className="newsletter-card"><strong>Can I print it?</strong><p className="muted" style={{ marginTop: 6 }}>Yes. It is an A4 PDF that also reads cleanly on a phone.</p></div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
