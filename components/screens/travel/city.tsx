"use client";

/* Humble Halal — city hub (Muslim-friendly hotels in a destination).
   List/Map toggle, halal filters, price tip, top-picks carousel, FAQ. */
import { useState } from "react";
import { Icon, Empty } from "../../ui";
import { Carousel } from "../../ota";
import { MapView } from "../../map/map-view";
import type { Hotel } from "@/lib/halal-hotels";
import type { TravelHub } from "@/lib/travel-hubs";
import type { CityGuide } from "@/lib/travel-guides";
import type { QA } from "@/lib/faq";
import { HotelCard } from "./HotelCard";
import { Crumbs, DestinationCard, FilterBar, availableFilters, matchesFilters, niceDate } from "./shared";
import type { CityPrice } from "./types";

export function TravelCityScreen({ hub, hotels, faq, related, priceTip, guide }: { hub: TravelHub; hotels: Hotel[]; faq: QA[]; related: TravelHub[]; priceTip?: CityPrice | null; guide?: CityGuide | null }) {
  const [view, setView] = useState<"list" | "map">("list");
  const [open, setOpen] = useState<number | null>(0);
  const [filters, setFilters] = useState<string[]>([]);
  const shown = hotels.filter((h) => matchesFilters(h, filters));
  const points = shown.filter((h) => h.coords).map((h) => ({ id: h.id, name: h.name, coords: h.coords! }));
  const topPicks = hotels.slice(0, 8);

  return (
    <div className="screen-in hh-page">
      <Crumbs trail={[{ label: "Home", href: "/" }, { label: "Travel", href: "/travel" }, { label: hub.name }]} />
      <section className="travel-hero hh-pattern">
        <div className="hh-wrap">
          <h1>{hub.h1}</h1>
          <p className="sub">{hub.blurb}</p>
        </div>
      </section>

      <div className="hh-wrap hh-section">
        {priceTip && (
          <div className="price-tip">
            <span className="pt-ico"><Icon name="trend" size={16} /></span>
            <span className="pt-text">{hub.name} averages <strong>USD {priceTip.avgUsd}/night</strong> over the next month (USD {priceTip.minUsd}–{priceTip.maxUsd}).{priceTip.cheapestDay ? <> Cheapest around <strong>{niceDate(priceTip.cheapestDay)}</strong>.</> : null}</span>
          </div>
        )}

        {hub.iata && (
          <a className="flights-cta" href={`/travel/flights?to=${hub.iata}`} style={{ marginBottom: 24 }}>
            <span className="fcta-ico"><Icon name="plane" size={20} /></span>
            <span className="fcta-text"><strong>Flying to {hub.name}?</strong> Search live fares from Singapore and pair them with your stay.</span>
            <span className="fcta-go">Search flights <Icon name="arrow" size={15} /></span>
          </a>
        )}

        {topPicks.length >= 4 && (
          <Carousel title={`Top picks in ${hub.name}`} ariaLabel={`Top Muslim-friendly picks in ${hub.name}`}>
            {topPicks.map((h) => <div key={h.id} className="ota-citem"><HotelCard hotel={h} /></div>)}
          </Carousel>
        )}

        {hotels.length > 0 && <FilterBar active={filters} setActive={setFilters} options={availableFilters(hotels)} />}
        <div className="flex between center" style={{ margin: "14px 0 16px", gap: 10, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "1.3rem" }}>{hotels.length ? `${shown.length} Muslim-friendly hotel${shown.length !== 1 ? "s" : ""} in ${hub.name}` : `Hotels in ${hub.name}`}</h2>
          {points.length > 0 && (
            <div className="flex g6">
              <button className={`chip ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>List</button>
              <button className={`chip ${view === "map" ? "active" : ""}`} onClick={() => setView("map")}>Map</button>
            </div>
          )}
        </div>

        {hotels.length === 0 ? (
          <Empty icon="bed" title="Live hotels loading" body="Hotel availability for this city will appear here. Use the search on the Travel home to check live rates." />
        ) : shown.length === 0 ? (
          <p className="muted">No hotels match those halal filters. Try removing one.</p>
        ) : view === "map" && points.length ? (
          <div className="travel-map"><MapView center={hub.coords} zoom={12} points={points} /></div>
        ) : (
          <div className="hotel-grid">{shown.map((h) => <HotelCard key={h.id} hotel={h} />)}</div>
        )}

        {guide && (
          <section className="city-guide" style={{ marginTop: 48 }}>
            <h2 className="cg-title">{hub.umrah ? `Umrah travel guide: ${hub.name}` : `Travelling to ${hub.name}`}</h2>
            <p className="cg-intro">{guide.intro}</p>
            {guide.sections.map((s) => (
              <div key={s.heading} className="cg-section">
                <h3>{s.heading}</h3>
                {s.body.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            ))}
            <p className="cg-disclaimer">
              <Icon name="info" size={13} /> Humble Halal is a discovery platform, not a certifier or a travel agent.
              Visa, permit and pricing details change — always confirm with official Saudi channels and your operator before you book.
            </p>
          </section>
        )}

        {faq.length > 0 && (
          <section className="travel-faq" style={{ marginTop: 44, maxWidth: 760 }}>
            <h2 style={{ fontSize: "1.3rem", marginBottom: 8 }}>Frequently asked</h2>
            {faq.map((f, i) => (
              <div key={i} className="faq-item">
                <div className="faq-q" onClick={() => setOpen(open === i ? null : i)}>{f.q} <Icon name={open === i ? "minus" : "plus"} size={16} /></div>
                {open === i && <div className="faq-a">{f.a}</div>}
              </div>
            ))}
          </section>
        )}

        {related.length > 0 && (
          <section style={{ marginTop: 44 }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: 14 }}>Other destinations</h2>
            <div className="dest-grid">{related.map((c) => <DestinationCard key={c.slug} c={c} />)}</div>
          </section>
        )}
      </div>
    </div>
  );
}
