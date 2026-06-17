"use client";

/* Humble Halal — flights pre-search landing content (benefits, popular routes,
   how-it-works, FAQ). Rendered below the hero/results in the search screen. */
import Link from "next/link";
import { Icon } from "../../ui";
import { FLT_BENEFITS, FLT_FAQS, POPULAR_ROUTES, SG_ORIGIN, type Airport } from "./shared";

export function FlightsLanding({ onRoute }: { onRoute: (origin: Airport, dest: Airport) => void }) {
  return (
    <div className="flt-landing">
      <section className="flt-land-benefits">
        <h2>Why Muslim travellers fly with Humble Halal</h2>
        <p className="muted">The comfort of a mainstream flight search, with the details a Muslim traveller actually needs — all in one place.</p>
        <div className="flt-benefit-grid">
          {FLT_BENEFITS.map(([ic, h, b]) => (
            <div key={h} className="flt-benefit"><span className="fi-ico"><Icon name={ic} size={20} /></span><h3>{h}</h3><p className="muted">{b}</p></div>
          ))}
        </div>
      </section>

      <section className="flt-land-routes">
        <h2>Popular halal-travel routes</h2>
        <p className="muted">From Singapore — tap a route to search live fares.</p>
        <div className="flt-route-chips">
          {POPULAR_ROUTES.map((d) => (
            <button key={d.iata} type="button" className="flt-route-chip" onClick={() => onRoute(SG_ORIGIN, { iata: d.iata, name: d.name, city: d.city, country: d.country })}>
              <span className="frc-route">Singapore <Icon name="arrow" size={13} /> {d.city}</span>
              {d.tag ? <span className="frc-tag">{d.tag}</span> : null}
            </button>
          ))}
        </div>
      </section>

      <section className="flt-land-how">
        <h2>How it works</h2>
        <ol className="flt-how-steps">
          <li><span className="fhs-n">1</span><div><strong>Search your route</strong><p className="muted">One-way or round-trip, any cabin, with Umrah & Hajj presets.</p></div></li>
          <li><span className="fhs-n">2</span><div><strong>Compare with Muslim-first insights</strong><p className="muted">Muslim-meal flags, prayer-room layovers, qibla, baggage and the cheapest day to fly.</p></div></li>
          <li><span className="fhs-n">3</span><div><strong>Book &amp; travel with confidence</strong><p className="muted">Secure partner payment, fare alerts, and a Muslim-friendly hotel to match.</p></div></li>
        </ol>
      </section>

      <Link href="/travel" className="hotel-cta flt-land-cta">
        <span className="hcta-ico"><Icon name="bed" size={20} /></span>
        <span className="hcta-text"><strong>Plan the whole trip</strong> — add a Muslim-friendly hotel with prayer rooms, halal dining nearby and alcohol-free stays, from Umrah hotels by the Haramain to family trips across Asia.</span>
        <span className="hcta-go">Browse stays <Icon name="arrow" size={15} /></span>
      </Link>

      <section className="flt-land-faq">
        <h2>Halal flight booking — your questions</h2>
        <div className="flt-faq">
          {FLT_FAQS.map(([q, a]) => (
            <details key={q} className="flt-faq-item"><summary>{q}<span className="faq-chevron" aria-hidden="true" /></summary><p>{a}</p></details>
          ))}
        </div>
      </section>

      <p className="travel-disclaimer">Flights are provided via our travel partner. Confirm baggage allowance, times and fare rules before booking.</p>
    </div>
  );
}
