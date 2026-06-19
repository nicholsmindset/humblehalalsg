import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Newsletter } from "@/components/newsletter";

export const metadata: Metadata = pageMeta({
  title: "Join the HumbleHalal newsletter — Singapore's weekly halal guide",
  description:
    "Get MUIS-verified halal food finds, mosque events and deals across Singapore every week — free. Subscribe and we'll send you the Ultimate Halal Food Guide by MRT Station.",
  path: "/subscribe",
  absoluteTitle: true,
});

const PERKS: string[] = [
  "New MUIS-verified halal spots before anyone else",
  "Mosque events, classes & community happenings",
  "Exclusive deals and new-opening alerts",
  "Ramadan & Hari Raya guides when the season comes",
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Subscribe", path: "/subscribe" },
          ]),
        ]}
      />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap" style={{ textAlign: "center" }}>
            <span className="eyebrow">🌙 Founding member</span>
            <h1 style={{ fontSize: "clamp(1.9rem,4.5vw,2.8rem)", maxWidth: 760, margin: "10px auto 0" }}>
              Singapore&apos;s weekly halal guide, in your inbox
            </h1>
            <p className="muted" style={{ maxWidth: 600, margin: "12px auto 0", fontSize: "1.08rem" }}>
              Join HumbleHalal — the free weekly newsletter for Muslim life in Singapore. MUIS-verified food
              finds, mosque events and deals, every week. Subscribe now and we&apos;ll email you the{" "}
              <strong>Ultimate Halal Food Guide by MRT Station</strong>.
            </p>
          </div>
        </section>

        <div className="hh-wrap hh-section" style={{ maxWidth: 640 }}>
          <div className="newsletter-card">
            <Newsletter source="landing" collectName cta="Subscribe — it's free" />
            <p className="muted" style={{ marginTop: 12, fontSize: ".84rem" }}>
              No spam, ever. Unsubscribe in one click.
            </p>
          </div>

          <ul className="subscribe-perks" style={{ marginTop: 24 }}>
            {PERKS.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
