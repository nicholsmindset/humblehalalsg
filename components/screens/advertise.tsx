"use client";

/* Humble Halal — Advertise with us (advertising sales page). */
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useApp } from "../app-context";
import { Icon, MobileHeader } from "../ui";
import { Newsletter } from "../newsletter";
import { CONTACT_EMAILS } from "@/lib/contact";
import { AD_PRODUCTS, PRODUCT_PLACEMENT } from "@/lib/ad-products";

/* Honest, defensible value props — not fabricated metrics. Current audience
   figures are shared in the media kit once they can be reported accurately. */
const STATS: [string, string][] = [
  ["Halal-first", "Every visitor is here for halal & Muslim-friendly"],
  ["High intent", "People actively choosing where to eat, shop & travel"],
  ["Singapore", "Built for the local Muslim community"],
  ["Brand-safe", "Curated, halal-context placements only"],
];

/* `product` maps to the server-trusted price map in /api/checkout/promo.
   Sponsored Content is bespoke (no fixed price) → contact instead of checkout.
   Displayed prices DERIVE from AD_PRODUCTS (the amount actually charged) so
   the sales page can never drift from checkout again (audit streams-P2-5). */
const fromPrice = (product: string, unit: string) => {
  const cents = AD_PRODUCTS[product]?.cents;
  return cents ? `from $${Math.round(cents / 100)}/${unit}` : "Custom";
};
const FORMATS: { icon: string; name: string; desc: string; price: string; product?: string }[] = [
  { icon: "trophy", name: "Featured Listing", desc: "Top placement in your category and area with a Featured badge, priority in search and map — our Featured plan.", price: fromPrice("featured-listing", "mo"), product: "featured-listing" },
  { icon: "home", name: "Homepage Spotlight", desc: "Premium hero or “Featured this week” slot seen by every visitor to humblehalal.com.", price: fromPrice("homepage-spotlight", "mo"), product: "homepage-spotlight" },
  { icon: "store", name: "Category Sponsorship", desc: "Own a whole category (e.g. Restaurants in Tampines) — exclusive banner + featured slots.", price: fromPrice("category-sponsorship", "mo"), product: "category-sponsorship" },
  { icon: "mail", name: "Newsletter Sponsorship", desc: "A dedicated placement in the weekly halal guide email to our subscriber community.", price: fromPrice("newsletter-sponsorship", "send"), product: "newsletter-sponsorship" },
  { icon: "calendar", name: "Event Promotion", desc: "Boost your bazaar, class or community event across the Events page and homepage strip.", price: fromPrice("event-promotion", "event"), product: "event-promotion" },
  { icon: "megaphone", name: "Sponsored Content", desc: "An editorial feature or area guide written with your brand — built for search and AI citation.", price: "Custom" },
];

export function AdvertiseScreen() {
  const { navigate, toast } = useApp();
  const { isSignedIn } = useUser();
  const [buying, setBuying] = useState<string | null>(null);

  // Signed-in owners get the full self-serve builder (placement + dates +
  // creative + review gate) in their dashboard; anonymous visitors keep the
  // legacy one-click checkout that records an ad_orders lead.
  async function handleBuy(f: (typeof FORMATS)[number]) {
    if (!f.product) {
      window.location.assign(`mailto:${CONTACT_EMAILS.partners}?subject=${encodeURIComponent("Sponsored Content enquiry")}&body=${encodeURIComponent("Hi Humble Halal, I'd like to discuss a Sponsored Content campaign.")}`);
      return;
    }
    if (isSignedIn) {
      const placement = PRODUCT_PLACEMENT[f.product];
      navigate("owner-dashboard", { tab: "ads", new: "1", ...(placement ? { placement } : {}) });
      return;
    }
    setBuying(f.product);
    try {
      const r = await fetch("/api/checkout/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: f.product }),
      });
      const d = await r.json().catch(() => ({}));
      if (d?.ok && d.url) { window.location.assign(d.url); return; }
      toast(
        d?.reason === "paid_ads_disabled"
          ? "Advertising checkout is opening soon — email us for the media kit."
          : "Couldn't start checkout — please email us for the media kit.",
      );
    } catch {
      toast("Couldn't start checkout — please email us for the media kit.");
    }
    setBuying(null);
  }

  return (
    <div className="screen-in hh-page">
      <MobileHeader title="Advertise with us" onBack={() => navigate("for-business")} />

      {/* hero */}
      <section className="evt-hero hh-pattern-gold">
        <div className="hh-wrap">
          <span className="eyebrow">Advertise on Humble Halal</span>
          <h1 style={{ fontSize: "clamp(1.9rem,4vw,2.7rem)", maxWidth: 720, marginTop: 10 }}>
            Reach Singapore’s Muslim community at the moment of intent
          </h1>
          <p className="muted" style={{ maxWidth: 600, marginTop: 12, fontSize: "1.05rem" }}>
            Put your halal or Muslim-friendly brand in front of people actively searching for where to
            eat, shop and gather — across web, map, newsletter and AI search.
          </p>
          <div className="flex g10 wrap" style={{ marginTop: 18 }}>
            <a className="btn btn-primary btn-lg" href={`mailto:${CONTACT_EMAILS.partners}?subject=Media%20kit%20request&body=Hi%20Humble%20Halal%2C%20please%20send%20me%20the%20advertising%20media%20kit.`}>
              Get the media kit <Icon name="arrow" size={17} />
            </a>
            <button className="btn btn-outline btn-lg" onClick={() => navigate("pricing")}>
              See listing plans
            </button>
          </div>
        </div>
      </section>

      <div className="hh-wrap">
        {/* audience stats */}
        <section className="hh-section">
          <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            {STATS.map(([v, l]) => (
              <div key={l} className="stat tc">
                <div className="v">{v}</div>
                <div className="l">{l}</div>
              </div>
            ))}
          </div>
          <p className="muted tc" style={{ fontSize: ".82rem", marginTop: 12 }}>Current audience and performance figures are shared in our media kit. Advertising is subject to our content review and approval, and our standard advertising terms.</p>
        </section>

        {/* ad formats */}
        <section className="hh-section" style={{ paddingTop: 8 }}>
          <div className="section-head"><h2>Ways to advertise</h2></div>
          <div className="grid-cards">
            {FORMATS.map((f) => (
              <div key={f.name} className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                <span className="attn-ico"><Icon name={f.icon} size={18} /></span>
                <h3 style={{ fontSize: "1.15rem" }}>{f.name}</h3>
                <p className="muted" style={{ fontSize: ".92rem", lineHeight: 1.5, flex: 1 }}>{f.desc}</p>
                <div style={{ fontWeight: 700, color: "var(--emerald)" }}>{f.price}</div>
                <button className="btn btn-primary btn-sm btn-block" style={{ marginTop: 6 }} disabled={buying === f.product} onClick={() => handleBuy(f)}>
                  {f.product ? (buying === f.product ? "Starting…" : "Get started") : "Talk to us"} <Icon name="arrow" size={15} />
                </button>
              </div>
            ))}
          </div>
          <p className="muted tc" style={{ fontSize: ".9rem", marginTop: 16 }}>
            Prefer done-for-you? <strong>Managed marketing is available</strong> — campaigns, content and lead
            generation run by <strong>Onnifyworks</strong>, Humble Halal&rsquo;s growth partner.{" "}
            <a href="/contact" style={{ fontWeight: 600 }}>Request a call →</a>
          </p>
        </section>

        {/* why */}
        <section className="hh-section" style={{ paddingTop: 8 }}>
          <div className="section-head"><h2>Why brands choose Humble Halal</h2></div>
          <div className="grid-cards">
            {([
              ["shield-check", "Trusted context", "Your brand appears beside MUIS-certified, community-vetted listings — not random results."],
              ["near", "High intent", "Visitors are deciding where to spend right now, by area and category."],
              ["users", "The right audience", "A focused Singapore Muslim audience you can’t target as precisely elsewhere."],
              ["sparkles", "AI & search ready", "Sponsored content is structured for Google rich results and AI answer-engine citations."],
            ] as [string, string, string][]).map(([ic, t, d]) => (
              <div key={t} className="card" style={{ padding: 20 }}>
                <span className="attn-ico"><Icon name={ic} size={18} /></span>
                <h3 style={{ fontSize: "1.1rem", marginTop: 10 }}>{t}</h3>
                <p className="muted" style={{ fontSize: ".92rem", lineHeight: 1.5, marginTop: 6 }}>{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA + lead capture */}
        <section className="hh-section">
          <div className="newsletter-card" style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.5rem" }}>Let’s build your campaign</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Leave your email and we’ll send the media kit, audience data and current rates.
            </p>
            <div style={{ marginTop: 16, textAlign: "left" }}>
              <Newsletter source="advertise" />
            </div>
            <p className="faint" style={{ fontSize: ".82rem", marginTop: 12 }}>
              Prefer to talk? Email <strong>{CONTACT_EMAILS.partners}</strong>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
