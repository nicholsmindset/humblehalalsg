import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = pageMeta({
  title: "Getting started — everything you can do as a business owner",
  description:
    "A quick tour of your Humble Halal business tools: claim and manage your listing, get halal-verified, host events, run sponsored placements, receive customer leads, and see your analytics.",
  path: "/for-business/onboarding",
});

type Card = { title: string; desc: string; href: string; cta?: string };
type Section = { id: string; label: string; blurb: string; cards: Card[] };

const SECTIONS: Section[] = [
  {
    id: "listing", label: "1. Set up your listing", blurb: "Get on the map and keep your details accurate.",
    cards: [
      { title: "Claim your business", desc: "Take ownership of an existing listing so you can edit it and reply to reviews.", href: "/claim", cta: "Claim →" },
      { title: "Add a new listing", desc: "Not listed yet? Add your halal or Muslim-owned business in a couple of minutes.", href: "/add-listing", cta: "Add listing →" },
      { title: "Manage details, photos & hours", desc: "Edit your description, contact info, opening hours and photo gallery from your dashboard.", href: "/owner", cta: "Open dashboard →" },
      { title: "Get halal-verified", desc: "Upload your MUIS certificate to the Cert Vault so we can show a verified badge and a higher Halal Confidence Score.", href: "/verify", cta: "How we verify →" },
    ],
  },
  {
    id: "grow", label: "2. Grow your reach", blurb: "Turn your listing into visits and enquiries.",
    cards: [
      { title: "Host an event", desc: "Publish bazaars, classes, iftars and community days — free RSVPs, or paid tickets when ticketing is on.", href: "/host-event", cta: "Host an event →" },
      { title: "Sponsored & featured placement", desc: "Boost visibility with homepage, category and listing-feed placements from your dashboard.", href: "/advertise", cta: "See placements →" },
      { title: "Receive customer leads", desc: "Get matched enquiries from people looking for exactly what you offer, routed straight to you.", href: "/owner", cta: "Leads in dashboard →" },
      { title: "Upgrade your plan", desc: "Verified, Featured and Premium plans unlock more photos, priority placement and analytics.", href: "/pricing", cta: "Compare plans →" },
    ],
  },
  {
    id: "understand", label: "3. Understand your customers", blurb: "See what's working and build trust.",
    cards: [
      { title: "Your analytics", desc: "Views, saves, clicks to call/directions and enquiry trends — all in your dashboard.", href: "/owner", cta: "View analytics →" },
      { title: "Reviews & replies", desc: "Read customer reviews and reply publicly to build trust with the community.", href: "/owner", cta: "Manage reviews →" },
      { title: "Community freshness", desc: "Customers can confirm you're halal and flag if you've moved or closed — keeping your listing accurate and trusted.", href: "/owner", cta: "Learn more →" },
    ],
  },
];

export default function Page() {
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "For business", path: "/for-business" }, { name: "Getting started", path: "/for-business/onboarding" }])]} />
      <div className="screen-in hh-page">
        <section className="seo-hero hh-pattern">
          <div className="hh-wrap">
            <nav className="flex g6 center faint" aria-label="Breadcrumb" style={{ fontSize: ".82rem", fontWeight: 600, marginBottom: 10 }}>
              <Link className="link-inline" href="/">Home</Link><span>›</span>
              <Link className="link-inline" href="/for-business">For business</Link><span>›</span>
              <span style={{ color: "var(--ink)" }}>Getting started</span>
            </nav>
            <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.6rem)", maxWidth: 760 }}>Everything you can do as a business owner</h1>
            <p className="muted" style={{ maxWidth: 680, marginTop: 10, fontSize: "1.05rem" }}>
              Welcome to Humble Halal. Here is a quick tour of your tools — from claiming your listing and getting halal-verified,
              to hosting events, running placements, receiving leads and reading your analytics. Everything lives in your dashboard.
            </p>
            <div style={{ marginTop: 16 }} className="flex g10 wrap">
              <Link href="/owner" className="btn btn-primary">Go to my dashboard →</Link>
              <Link href="/claim" className="btn btn-soft">Claim my business</Link>
            </div>
            <nav className="mosque-jump" aria-label="Jump to section">
              {SECTIONS.map((s) => <a key={s.id} href={`#${s.id}`} className="mosque-jump-link">{s.label}</a>)}
            </nav>
          </div>
        </section>

        <div className="hh-wrap hh-section">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="mosque-region">
              <h2 className="mosque-region-h">{s.label}</h2>
              <p className="muted" style={{ marginTop: -6, marginBottom: 14, fontSize: ".92rem" }}>{s.blurb}</p>
              <div className="hub-grid">
                {s.cards.map((c) => (
                  <Link key={c.title} href={c.href} className="prayer-card" style={{ textDecoration: "none" }}>
                    <div className="prayer-card-name">{c.title}</div>
                    <div className="prayer-card-notes" style={{ marginTop: 6 }}>{c.desc}</div>
                    <div className="prayer-card-foot"><span className="prayer-card-dir">{c.cta || "Open →"}</span></div>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <p className="faint" style={{ fontSize: ".86rem", marginTop: 20 }}>
            Some tools (paid tickets, ads, leads, Halal Passport) switch on as we roll them out — they will appear in your
            dashboard. Questions? <Link className="link-inline" href="/contact">Contact us →</Link>
          </p>
        </div>
      </div>
    </>
  );
}
