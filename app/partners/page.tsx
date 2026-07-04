import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { getServerFlags } from "@/lib/flags";
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";

/* Business acquisition landing page. Structured on Alex Hormozi's value
   equation — Value = (Dream Outcome × Perceived Likelihood) ÷ (Time × Effort)
   — plus an offer stack, risk reversal and urgency. COPY IS PLACEHOLDER:
   replace the strings with your own; the structure/CTAs are what matter. */
export const metadata = pageMeta({
  title: "Get discovered by Singapore's Muslim diners — free",
  description: "List your café, restaurant or halal business on Humble Halal. Get found in halal searches, build trust with a verified badge, and turn members into regulars — free to start.",
  path: "/partners",
  absoluteTitle: true,
});

const FAQ = [
  { q: "How much does it cost?", a: "Getting listed and claiming your business is free — no card, no lock-in. Paid plans add extra visibility and tools, but the core listing stays free." },
  { q: "How do customers find me?", a: "Muslim diners search Humble Halal for halal food by area, cuisine and mall. A claimed, verified listing puts you in those results with your menu, photos, reviews and directions." },
  { q: "What is the Halal Passport?", a: "It's our loyalty programme — members earn points for reviews, visits and referrals. You can offer a perk (e.g. a free drink) that members redeem with points, bringing repeat customers to your door." },
  { q: "How long does setup take?", a: "Minutes. Claim your existing listing or add your business, and you're live. We handle discovery, reviews and the halal trust signals." },
];

function Stat({ big, label }: { big: string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--emerald,#0e7a5f)" }}>{big}</div>
      <div className="faint" style={{ fontSize: ".82rem" }}>{label}</div>
    </div>
  );
}

export default function Page() {
  const passport = getServerFlags().passport;

  // The offer stack — anchor each item's value so "free to start" feels absurd to pass up.
  const stack: { title: string; desc: string; value: string }[] = [
    { title: "A verified halal listing", desc: "Your menu, photos, opening hours, halal status and directions — in front of people actively looking for halal food.", value: "S$300/yr" },
    { title: "Found in halal search & maps", desc: "Appear when diners search your area, cuisine or mall on Singapore's halal directory.", value: "S$40/mo" },
    { title: "Reviews that build trust", desc: "Collect real reviews with a QR poster and reply to build your reputation.", value: "S$25/mo" },
    { title: "A halal trust badge", desc: "Show your MUIS / verified status so first-time diners feel safe choosing you.", value: "Priceless" },
    { title: "Customer insights", desc: "See how many people view, call, WhatsApp and get directions to you.", value: "S$20/mo" },
    { title: "Warm leads", desc: "Get matched to people requesting quotes for catering, events and more.", value: "S$50/lead" },
  ];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "For businesses", path: "/partners" }]), faqJsonLd(FAQ)]} />
      <div className="screen-in hh-page">
        {/* ── Hero: the dream outcome, stated plainly ── */}
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap" style={{ maxWidth: 820 }}>
            <span className="eyebrow">For cafés, restaurants &amp; halal businesses</span>
            <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", marginTop: 10, lineHeight: 1.08 }}>
              Fill your tables with Singapore&apos;s Muslim diners — <span style={{ color: "var(--emerald,#0e7a5f)" }}>free to start.</span>
            </h1>
            <p className="muted" style={{ fontSize: "1.12rem", marginTop: 14, maxWidth: 640 }}>
              Every day, Muslim Singaporeans search for halal places to eat. Get your business in front of them, earn their trust with a verified halal badge, and turn first-time diners into regulars — without spending a cent to begin.
            </p>
            <div className="flex g10 wrap" style={{ marginTop: 22 }}>
              <Link className="btn btn-gold btn-lg" href="/claim">Claim your listing — free</Link>
              <Link className="btn btn-outline btn-lg" href="/add-listing">Add your business</Link>
            </div>
            <div className="flex g16 wrap" style={{ marginTop: 26, justifyContent: "space-between", maxWidth: 520 }}>
              <Stat big="300+" label="halal businesses listed" />
              <Stat big="MUIS" label="verified trust signals" />
              <Stat big="Free" label="to get discovered" />
            </div>
          </div>
        </section>

        <div className="hh-wrap hh-section" style={{ maxWidth: 900 }}>
          {/* ── The gap (why now) ── */}
          <div className="card" style={{ padding: 22, background: "var(--wash,#f8f6f0)" }}>
            <h2 style={{ fontSize: "1.4rem" }}>If they can&apos;t find you — or trust you — they walk past</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Muslim diners won&apos;t risk a place they&apos;re unsure about. If your halal status isn&apos;t clear and you&apos;re not where they&apos;re searching, they choose the spot that is. Humble Halal makes you findable and trusted — the two things that decide where they eat.
            </p>
          </div>

          {/* ── The value equation, made explicit (Hormozi) ── */}
          <h2 style={{ fontSize: "1.5rem", margin: "34px 0 14px", textAlign: "center" }}>Why it works</h2>
          <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
            {[
              ["🎯", "The outcome you want", "More halal customers through your door — the diners already looking for you."],
              ["📈", "A reason to believe", "MUIS-aligned trust signals, real reviews and 300+ businesses already on board."],
              ["⚡", "Live today", "Claim or add your business in minutes — no website, no agency, no wait."],
              ["🪶", "Almost zero effort", "Free to start, and we do the discovery, reviews and halal trust for you."],
            ].map(([icon, h, b]) => (
              <div key={h} className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: "1.6rem" }}>{icon}</div>
                <div style={{ fontWeight: 700, marginTop: 8 }}>{h}</div>
                <p className="faint" style={{ fontSize: ".88rem", marginTop: 4 }}>{b}</p>
              </div>
            ))}
          </div>

          {/* ── The offer stack ── */}
          <h2 style={{ fontSize: "1.5rem", margin: "36px 0 6px", textAlign: "center" }}>Everything you get</h2>
          <p className="faint tc" style={{ marginBottom: 16 }}>Real tools other directories charge for — yours free to start.</p>
          <div className="stack g8">
            {stack.map((s) => (
              <div key={s.title} className="card" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div className="f1" style={{ minWidth: 200 }}>
                  <div className="flex g8 center"><span style={{ color: "var(--emerald,#0e7a5f)" }}>✓</span><strong>{s.title}</strong></div>
                  <p className="faint" style={{ fontSize: ".84rem", marginTop: 2, paddingLeft: 20 }}>{s.desc}</p>
                </div>
                <span className="faint" style={{ fontSize: ".84rem", textDecoration: "line-through" }}>{s.value}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 18, marginTop: 10, textAlign: "center", background: "var(--emerald-50,#e7f3ee)" }}>
            <div className="faint" style={{ textDecoration: "line-through" }}>Worth well over S$1,000/year</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--emerald,#0e7a5f)", marginTop: 4 }}>Free to get started</div>
          </div>

          {/* ── The differentiator: Halal Passport perks (only pitched when live) ── */}
          {passport && (
            <div className="card" style={{ padding: 22, marginTop: 30, background: "var(--gold-50,#fbf3df)" }}>
              <span className="eyebrow" style={{ color: "var(--gold,#b8860b)" }}>The repeat-customer engine</span>
              <h2 style={{ fontSize: "1.5rem", marginTop: 8 }}>Turn Humble Halal members into regulars</h2>
              <p className="muted" style={{ marginTop: 8 }}>
                Our members earn Halal Passport points for reviewing, visiting and referring halal spots. Offer a perk — say a free teh tarik at 200 points — and members spend their points to claim it <strong>at your counter</strong>. It&apos;s loyalty marketing that brings people back, and you only give the perk once they&apos;ve walked in.
              </p>
              <ul className="stack g6" style={{ listStyle: "none", padding: 0, margin: "12px 0 0", fontSize: ".92rem" }}>
                <li>✓ You set the perk and the points cost</li>
                <li>✓ Members redeem it in-store; you tap &ldquo;used&rdquo; or scan their QR</li>
                <li>✓ No upfront cost — a perk only costs you a repeat visit</li>
              </ul>
            </div>
          )}

          {/* ── Risk reversal ── */}
          <h2 style={{ fontSize: "1.5rem", margin: "36px 0 14px", textAlign: "center" }}>No risk to you</h2>
          <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
            {[
              ["Free forever core", "Your listing, badge and reviews stay free. Upgrade only if you want more."],
              ["No card to start", "Claim your business and go live without entering any payment details."],
              ["No lock-in", "Leave whenever you like. Your listing is yours."],
            ].map(([h, b]) => (
              <div key={h} className="card" style={{ padding: 16 }}>
                <div className="flex g8 center"><span style={{ color: "var(--emerald,#0e7a5f)", fontSize: "1.1rem" }}>🛡️</span><strong>{h}</strong></div>
                <p className="faint" style={{ fontSize: ".86rem", marginTop: 6 }}>{b}</p>
              </div>
            ))}
          </div>

          {/* ── Urgency ── */}
          <div className="card" style={{ padding: 20, marginTop: 30, textAlign: "center", border: "1px solid var(--gold,#b8860b)" }}>
            <strong style={{ fontSize: "1.1rem" }}>Founding businesses get featured first</strong>
            <p className="faint" style={{ fontSize: ".9rem", marginTop: 6, maxWidth: 560, marginInline: "auto" }}>
              We spotlight early businesses across our directory, newsletter and Halal Passport. The sooner you&apos;re on, the more you&apos;re seen.
            </p>
          </div>

          {/* ── FAQ ── */}
          <h2 style={{ fontSize: "1.4rem", margin: "36px 0 12px" }}>Questions</h2>
          <div className="faq-list">
            {FAQ.map((f) => (
              <details key={f.q} className="faq-item">
                <summary>{f.q}<span className="faq-chevron" aria-hidden="true" /></summary>
                <p className="muted" style={{ padding: "0 2px 4px", lineHeight: 1.6 }}>{f.a}</p>
              </details>
            ))}
          </div>

          {/* ── Final CTA ── */}
          <div style={{ textAlign: "center", marginTop: 34 }}>
            <h2 style={{ fontSize: "1.6rem" }}>Get discovered this week</h2>
            <p className="muted" style={{ marginTop: 6 }}>Claim your listing free — it takes a few minutes.</p>
            <div className="flex g10 wrap" style={{ justifyContent: "center", marginTop: 16 }}>
              <Link className="btn btn-gold btn-lg" href="/claim">Claim your listing</Link>
              <Link className="btn btn-outline btn-lg" href="/pricing">See paid plans</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
