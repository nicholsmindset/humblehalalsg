"use client";

/* Humble Halal — Advertise with us (advertising sales page). */
import { useApp } from "../app-context";
import { Icon, MobileHeader } from "../ui";
import { Newsletter } from "../newsletter";

const STATS: [string, string][] = [
  ["480K", "Monthly searches"],
  ["12,400+", "Halal listings"],
  ["68%", "Aged 18–44"],
  ["3.4×", "Higher purchase intent"],
];

const FORMATS: { icon: string; name: string; desc: string; price: string }[] = [
  { icon: "trophy", name: "Featured Listing", desc: "Top placement in your category and area with a Featured badge, priority in search and map.", price: "from $89/mo" },
  { icon: "home", name: "Homepage Spotlight", desc: "Premium hero or “Featured this week” slot seen by every visitor to humblehalal.com.", price: "from $450/mo" },
  { icon: "store", name: "Category Sponsorship", desc: "Own a whole category (e.g. Restaurants in Tampines) — exclusive banner + featured slots.", price: "from $300/mo" },
  { icon: "mail", name: "Newsletter Sponsorship", desc: "A dedicated placement in the weekly halal guide email to our subscriber community.", price: "from $250/send" },
  { icon: "calendar", name: "Event Promotion", desc: "Boost your bazaar, class or community event across the Events page and homepage strip.", price: "from $120/event" },
  { icon: "megaphone", name: "Sponsored Content", desc: "An editorial feature or area guide written with your brand — built for search and AI citation.", price: "Custom" },
];

export function AdvertiseScreen() {
  const { navigate, toast } = useApp();
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
            <button className="btn btn-primary btn-lg" onClick={() => toast("Our team will email you the media kit")}>
              Get the media kit <Icon name="arrow" size={17} />
            </button>
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
              </div>
            ))}
          </div>
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
              Prefer to talk? Email <strong>partners@humblehalal.com</strong>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
