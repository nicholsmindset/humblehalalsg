"use client";

/* Humble Halal — unified /travel landing. One shared hero with a top-level
   Stays | Flights switcher above the active vertical's search widget, then shared
   halal promo sections that promote BOTH. Each vertical's search/results come from
   the existing TravelScreen / FlightsScreen in `embedded` mode (no own hero), so
   their proven logic is reused. Hotels are the default + primary (SEO). */
import { useState } from "react";
import Image from "next/image";
import { Icon } from "../../ui";
import { Crumbs } from "./shared";
import { TravelScreen } from "./landing";
import { FlightsScreen } from "../flights/search";
import { HeroTrustPills, SharedTravelPromo } from "./promo";
import type { Hotel } from "@/lib/halal-hotels";
import type { TravelHub } from "@/lib/travel-hubs";
import type { FlightDeal } from "@/lib/flights-data";

const HERO_IMG =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=70";

export function UnifiedTravelScreen({
  cities,
  recommended = [],
  nearby = [],
  flightDeals,
  semanticEnabled = false,
  flightsBookingEnabled = false,
}: {
  cities: TravelHub[];
  recommended?: Hotel[];
  nearby?: Hotel[];
  flightDeals: FlightDeal[];
  semanticEnabled?: boolean;
  flightsBookingEnabled?: boolean;
}) {
  const [vertical, setVertical] = useState<"stays" | "flights">("stays");

  return (
    <div className="screen-in hh-page">
      <Crumbs trail={[{ label: "Home", href: "/" }, { label: "Travel" }]} />

      {/* ── shared hero ── */}
      <section className="ota-hero trv-unified-hero">
        <Image className="ota-hero-media" src={HERO_IMG} alt="" aria-hidden fill priority sizes="100vw" style={{ objectFit: "cover" }} />
        <div className="ota-hero-scrim pattern" />
        <div className="hh-wrap">
          <div className="ota-hero-head">
            <span className="eyebrow"><Icon name="crescent" size={13} /> Halal travel</span>
            <h1>Muslim-friendly stays &amp; flights, better prices</h1>
            <p className="sub">Prayer rooms, halal dining nearby and alcohol-free stays — plus prayer-aware flights for Umrah, Hajj and Muslim travel, planned in one place.</p>
            <HeroTrustPills />
          </div>

          {/* top-level vertical switcher — distinct aria-label from the Search/Ask-AI sub-tabs */}
          <div className="ota-segtabs ota-segtabs--top" role="tablist" aria-label="Travel type">
            <button type="button" role="tab" aria-selected={vertical === "stays"} className={`ota-segtab ${vertical === "stays" ? "on" : ""}`} onClick={() => setVertical("stays")}>
              <Icon name="bed" size={16} /> Stays
            </button>
            <button type="button" role="tab" aria-selected={vertical === "flights"} className={`ota-segtab ${vertical === "flights" ? "on" : ""}`} onClick={() => setVertical("flights")}>
              <Icon name="plane" size={16} /> Flights
            </button>
          </div>
        </div>
      </section>

      {/* ── active vertical's search + results (embedded) ── */}
      {vertical === "stays" ? (
        <TravelScreen cities={cities} recommended={recommended} nearby={nearby} semanticEnabled={semanticEnabled} embedded />
      ) : (
        <FlightsScreen bookingEnabled={flightsBookingEnabled} embedded />
      )}

      {/* ── shared promo (promotes both verticals) ── */}
      <SharedTravelPromo cities={cities} flightDeals={flightDeals} vertical={vertical} />
    </div>
  );
}
