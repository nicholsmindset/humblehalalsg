"use client";

/* Humble Halal — shared promo sections for the unified /travel landing. Rendered
   below the active vertical's search widget; promotes BOTH hotels and flights.
   Reuses existing OTA + travel CSS. Golden rule: no halal-certification claims. */
import Link from "next/link";
import { Icon } from "../../ui";
import { Carousel } from "../../ota";
import { DestinationCard } from "./shared";
import { FLT_BENEFITS } from "../flights/shared";
import { TRAVEL_LANDING_FAQ } from "@/lib/travel-content";
import type { TravelHub } from "@/lib/travel-hubs";
import type { FlightDeal } from "@/lib/flights-data";

/* ── hero trust pills (rendered inside the shared hero) ───────────────────── */
export function HeroTrustPills() {
  const pills: [string, string][] = [
    ["mosque", "Prayer-friendly stays & layovers"],
    ["crescent", "Muslim-friendly facilities, surfaced"],
    ["check", "Free cancellation on most rates"],
  ];
  return (
    <div className="trv-trust" role="list">
      {pills.map(([ic, t]) => (
        <span key={t} className="trv-trust-pill" role="listitem"><Icon name={ic} size={13} /> {t}</span>
      ))}
    </div>
  );
}

/* ── plan by purpose ─────────────────────────────────────────────────────── */
function PlanByPurpose() {
  const cards: { ic: string; title: string; body: string; href: string; cta: string }[] = [
    { ic: "crescent", title: "Umrah & Hajj", body: "Hotels by the Haramain and flights to Jeddah & Madinah — with Hijri dates and prayer-aware layovers.", href: "/travel/mecca", cta: "Plan Umrah" },
    { ic: "family", title: "Family-friendly", body: "Family rooms, halal dining nearby and safe neighbourhoods for trips with the kids.", href: "/travel", cta: "Find family stays" },
    { ic: "shield-check", title: "Women-friendly", body: "Filter for women-only facilities and privacy-minded, respectful stays.", href: "/travel", cta: "See women-friendly" },
    { ic: "plane", title: "Transit-friendly", body: "Flights flagged for prayer-room layovers and the qibla at your destination.", href: "/travel/flights", cta: "Find flights" },
  ];
  return (
    <section className="trv-promo" style={{ marginTop: 40 }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: 4 }}>Plan by purpose</h2>
      <p className="muted" style={{ marginBottom: 18 }}>Start from how you travel — we tailor the search to what matters.</p>
      <div className="flt-benefit-grid">
        {cards.map((c) => (
          <Link key={c.title} href={c.href} className="flt-benefit trv-purpose">
            <span className="fi-ico"><Icon name={c.ic} size={20} /></span>
            <h3>{c.title}</h3>
            <p className="muted">{c.body}</p>
            <span className="trv-purpose-cta">{c.cta} <Icon name="arrow" size={13} /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── popular halal destinations (hotels grid + fly-there rail) ────────────── */
function PopularDestinations({ cities, flightDeals }: { cities: TravelHub[]; flightDeals: FlightDeal[] }) {
  return (
    <section className="trv-promo" style={{ marginTop: 40 }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: 4 }}>Popular halal-friendly destinations</h2>
      <p className="muted" style={{ marginBottom: 18 }}>Muslim-friendly hotels in each city — and flights to get you there.</p>
      <div className="dest-grid">{cities.map((c) => <DestinationCard key={c.slug} c={c} />)}</div>
      {flightDeals.length > 0 && (
        <Carousel title="Fly from Singapore" ariaLabel="Flights to popular halal destinations">
          {flightDeals.map((d) => (
            <Link key={d.to.iata} href={`/travel/flights?to=${d.to.iata}`} className="ota-citem flt-trend">
              <span className="flt-trend-ico"><Icon name="plane" size={18} /></span>
              <span className="flt-trend-main">
                <span className="flt-trend-route">{d.from.city} <Icon name="arrow" size={12} /> {d.to.city}</span>
                <span className="flt-trend-sub">{d.to.name}{d.to.tag ? ` · ${d.to.tag}` : ""} · tap for live fares</span>
              </span>
              {d.to.tag ? <span className="frc-tag">{d.to.tag}</span> : null}
            </Link>
          ))}
        </Carousel>
      )}
    </section>
  );
}

/* ── contextual hotel ⇄ flight cross-sell ────────────────────────────────── */
function CrossSell({ vertical }: { vertical: "stays" | "flights" }) {
  if (vertical === "stays") {
    return (
      <Link href="/travel/flights" className="flights-cta" style={{ marginTop: 36 }}>
        <span className="fcta-ico"><Icon name="plane" size={20} /></span>
        <span className="fcta-text"><strong>Need flights too?</strong> Search hundreds of airlines for your Umrah or Muslim-travel journey.</span>
        <span className="fcta-go">Search flights <Icon name="arrow" size={15} /></span>
      </Link>
    );
  }
  return (
    <Link href="/travel" className="hotel-cta" style={{ marginTop: 36 }}>
      <span className="hcta-ico"><Icon name="bed" size={20} /></span>
      <span className="hcta-text"><strong>Complete your trip</strong> — pair your flight with a Muslim-friendly hotel: prayer rooms, halal dining nearby and alcohol-free stays.</span>
      <span className="hcta-go">Find a stay <Icon name="arrow" size={15} /></span>
    </Link>
  );
}

/* ── why book + FAQ (merged hotels + flights, deduped) ────────────────────── */
function WhyBookAndFaq() {
  // Hotels-first benefits, then the flight-specific ones from FLT_BENEFITS that add
  // new value (Muslim meals, prayer-aware layovers) — deduped against the hotel set.
  const benefits: [string, string, string][] = [
    ["mosque", "Prayer rooms & qibla on every stay", "Prayer-room availability, today's prayer times and the qibla for each hotel — with the nearest mosque and halal dining mapped close by."],
    ["badge-check", "Checked by people, not just an algorithm", "Muslim-friendly facilities come from each property's own information; a Verified badge means our team has reviewed it. A discovery platform, never a blanket certifier."],
    ["moon", "Muslim meals & alcohol-free cabins, flagged", "On flights, see which airlines serve a Muslim meal (MOML) on request and which cabins are alcohol-free — before you book."],
    ["plane", "Prayer-aware flights, planned with your stay", "Flights flagged for prayer-room layovers and the qibla at your destination — paired with a Muslim-friendly hotel in one place."],
  ];
  // Visible FAQ is the SAME source the server page emits as FAQPage JSON-LD
  // (lib/travel-content) so structured data matches what users see.
  const faqs = TRAVEL_LANDING_FAQ;
  // benefits above are authored; FLT_BENEFITS is referenced so the import stays
  // meaningful and future copy can pull from it.
  void FLT_BENEFITS;
  return (
    <>
      <section className="flt-land-benefits" style={{ marginTop: 44 }}>
        <h2 style={{ fontSize: "1.5rem" }}>Why book your halal travel with Humble Halal</h2>
        <p className="muted" style={{ maxWidth: 640, margin: "6px 0 18px" }}>The comfort of a mainstream travel search, with the Muslim-first details that matter — and a team that checks, not just an algorithm.</p>
        <div className="flt-benefit-grid">
          {benefits.map(([ic, h, b]) => (
            <div key={h} className="flt-benefit"><span className="fi-ico"><Icon name={ic} size={20} /></span><h3>{h}</h3><p className="muted">{b}</p></div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: 14 }}>Halal travel — your questions</h2>
        <div className="flt-faq">
          {faqs.map(({ q, a }) => (
            <details key={q} className="flt-faq-item"><summary>{q}<span className="faq-chevron" aria-hidden="true" /></summary><p>{a}</p></details>
          ))}
        </div>
      </section>

      <p className="travel-disclaimer" style={{ marginTop: 36 }}>
        Humble Halal is a discovery platform, not a certifier. Muslim-friendly facilities are derived from each provider&apos;s own
        information and, where marked, verified by our team — always confirm specific halal requirements with the hotel or airline.
      </p>
    </>
  );
}

/* ── long-form SEO content (collapsible, internally linked) ───────────────── */
function HalalTravelGuide() {
  return (
    <section className="trv-guide" style={{ marginTop: 44, maxWidth: 820 }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: 6 }}>Halal travel from Singapore: a quick guide</h2>
      <p className="muted" style={{ marginBottom: 16 }}>Everything a Muslim traveller weighs — prayer, halal food, alcohol-free stays and getting there — in one place.</p>
      <div className="trv-guide-list">
        <details className="flt-faq-item" name="trv-guide" open>
          <summary>Finding Muslim-friendly hotels<span className="faq-chevron" aria-hidden="true" /></summary>
          <p>
            A “Muslim-friendly” hotel is one where the details that matter to Muslim travellers are easy to confirm — a prayer
            room or musalla, the qibla direction, halal dining on-site or close by, and alcohol-free options. Humble Halal
            surfaces those facts from each property and, where you see a Verified badge, our team has reviewed the listing.
            Browse our city guides for <Link href="/travel/kuala-lumpur">Kuala Lumpur</Link>,{" "}
            <Link href="/travel/bangkok">Bangkok</Link>, <Link href="/travel/tokyo">Tokyo</Link>,{" "}
            <Link href="/travel/seoul">Seoul</Link>, <Link href="/travel/istanbul">Istanbul</Link> and{" "}
            <Link href="/travel/dubai">Dubai</Link> to see Muslim-friendly hotels in each.
          </p>
        </details>
        <details className="flt-faq-item" name="trv-guide">
          <summary>Umrah &amp; Hajj travel<span className="faq-chevron" aria-hidden="true" /></summary>
          <p>
            For Umrah, the two biggest choices are your flight dates and how close your hotel sits to the Haramain. Our{" "}
            <Link href="/travel/umrah">Umrah hub</Link> gathers Muslim-friendly hotels near{" "}
            <Link href="/travel/mecca">Masjid al-Haram in Mecca</Link> and{" "}
            <Link href="/travel/medina">Al-Masjid an-Nabawi in Medina</Link>, plus live flights from Singapore to{" "}
            <Link href="/travel/flights?to=JED">Jeddah</Link> and <Link href="/travel/flights?to=MED">Medina</Link>, with an
            answer-first guide to visas, vaccinations and the rituals. We help you find and book the parts — we are not a
            licensed Umrah agent.
          </p>
        </details>
        <details className="flt-faq-item" name="trv-guide">
          <summary>Flights for Muslim travellers<span className="faq-chevron" aria-hidden="true" /></summary>
          <p>
            <Link href="/travel/flights">Search live flight fares</Link> across hundreds of airlines from Singapore. We flag
            Muslim meals (MOML) available on request, alcohol-free cabins and prayer-room layovers, so you can plan a journey
            that fits — then pair it with a Muslim-friendly stay so the whole trip sits in one place.
          </p>
        </details>
      </div>
    </section>
  );
}

/* Single shared-promo block rendered below the active vertical's widget. */
export function SharedTravelPromo({ cities, flightDeals, vertical }: { cities: TravelHub[]; flightDeals: FlightDeal[]; vertical: "stays" | "flights" }) {
  return (
    <div className="hh-wrap hh-section">
      <PlanByPurpose />
      <PopularDestinations cities={cities} flightDeals={flightDeals} />
      <CrossSell vertical={vertical} />
      <WhyBookAndFaq />
      <HalalTravelGuide />
    </div>
  );
}
