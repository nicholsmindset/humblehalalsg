import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Newsletter } from "@/components/newsletter";

export const metadata: Metadata = pageMeta({
  title: "Get the free Halal Weekend Planner — Humble Halal Singapore",
  description:
    "Get the reusable 10-minute halal weekend planner and one useful Friday email with Singapore food, prayer and community ideas.",
  path: "/subscribe",
  absoluteTitle: true,
});

const PERKS = [
  "A reusable food, prayer and activity worksheet",
  "A quick check for current halal-status information",
  "Fresh Singapore finds and community ideas each Friday",
  "Seasonal Ramadan and Hari Raya help when it is relevant",
];

export default function Page() {
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Subscribe", path: "/subscribe" }])]} />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap" style={{ textAlign: "center" }}>
            <span className="eyebrow">Free 4-page planner</span>
            <h1 style={{ fontSize: "clamp(2rem,5vw,3.2rem)", maxWidth: 760, margin: "10px auto 0" }}>
              Plan your halal weekend in 10 minutes
            </h1>
            <p className="muted" style={{ maxWidth: 610, margin: "12px auto 0", fontSize: "1.08rem" }}>
              Choose one meal, one prayer stop and one meaningful activity with a simple worksheet you can reuse every Friday.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section" style={{ maxWidth: 680 }}>
          <div className="newsletter-card">
            <h2 style={{ fontSize: "1.35rem", marginBottom: 8 }}>Email me the free planner</h2>
            <p className="muted" style={{ marginBottom: 14 }}>Instant PDF delivery. Email only—no account or payment details.</p>
            <Newsletter
              source="weekend-planner:landing"
              cta="Email me the planner"
              successHref="/guides/halal-weekend-planner-singapore.pdf"
              successCta="Open the planner now"
              successMessage="Sent. Check your inbox, or open the planner now."
            />
          </div>

          <ul className="subscribe-perks" style={{ marginTop: 24 }}>
            {PERKS.map((label) => <li key={label}>{label}</li>)}
          </ul>

          <p className="muted" style={{ textAlign: "center", marginTop: 24, fontSize: ".85rem" }}>
            Want to see what is inside first? <Link className="link-inline" href="/guides">Preview the planner</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
