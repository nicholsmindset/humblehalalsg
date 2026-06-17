"use client";

/* Humble Halal — halal travel landing (zzzello-grade OTA, emerald brand).
   Image hero + tabbed search (Search / ✦ Ask AI) overlaid on the banner, with
   inline live results (client sort), AI-search answer, and recommended/nearby
   carousels. Booking is gated downstream by PAID_HOTELS_ENABLED. */
import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon } from "../../ui";
import {
  Carousel,
  DateRangeField,
  OccupancyField,
  AiAnswer,
  SkeletonCard,
  type Occupancy,
} from "../../ota";
import type { Hotel } from "@/lib/halal-hotels";
import type { TravelHub } from "@/lib/travel-hubs";
import { HotelCard } from "./HotelCard";
import {
  Crumbs,
  DestinationCard,
  FilterBar,
  PlaceAutocomplete,
  availableFilters,
  fmtDate,
  matchesFilters,
} from "./shared";
import type { Dest, HotelSort } from "./types";

const HERO_IMG =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=70";

function sortHotels(list: Hotel[], sort: HotelSort): Hotel[] {
  if (sort === "halal") return list; // API already orders by halalScore
  const copy = [...list];
  if (sort === "price") {
    copy.sort((a, b) => (a.priceFrom?.amount ?? Infinity) - (b.priceFrom?.amount ?? Infinity));
  } else {
    copy.sort((a, b) => (b.guestRating ?? 0) - (a.guestRating ?? 0));
  }
  return copy;
}

export function TravelScreen({
  cities,
  recommended = [],
  nearby = [],
}: {
  cities: TravelHub[];
  recommended?: Hotel[];
  nearby?: Hotel[];
}) {
  const today = useMemo(() => new Date(), []);
  const first = cities[0];
  const [tab, setTab] = useState<"search" | "ai">("search");

  /* ── classic search state ── */
  const [dest, setDest] = useState<Dest | null>(
    first ? { label: `${first.name}, ${first.country}`, cityName: first.cityName, countryCode: first.countryCode, currency: first.currency } : null,
  );
  const [checkin, setCheckin] = useState<string | null>(fmtDate(new Date(today.getTime() + 30 * 864e5)));
  const [checkout, setCheckout] = useState<string | null>(fmtDate(new Date(today.getTime() + 32 * 864e5)));
  const [occ, setOcc] = useState<Occupancy>({ rooms: 1, adults: 2, children: 0 });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Hotel[] | null>(null);
  const [note, setNote] = useState("");
  const [filters, setFilters] = useState<string[]>([]);
  const [sort, setSort] = useState<HotelSort>("halal");

  /* ── AI search state ── */
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiHotels, setAiHotels] = useState<Hotel[] | null>(null);
  const [aiSimulated, setAiSimulated] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!dest || !checkin || !checkout) return;
    setLoading(true);
    setNote("");
    const childAges = occ.children > 0 ? Array(occ.children).fill(8) : undefined;
    const occupancies = Array.from({ length: occ.rooms }, () => (childAges ? { adults: occ.adults, children: childAges } : { adults: occ.adults }));
    try {
      const res = await fetch("/api/travel/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: dest.placeId, cityName: dest.cityName, countryCode: dest.countryCode, checkin, checkout, currency: dest.currency || "USD", guestNationality: "SG", occupancies, limit: 30 }),
      });
      const data = await res.json();
      if (data.ok) {
        setResults(data.hotels as Hotel[]);
        if (data.simulated) setNote("Live rates aren't connected yet — browse destinations below.");
        else if (!data.hotels.length) setNote("No hotels found for those dates. Try another destination or dates.");
      } else setNote(data.error || "Couldn't search right now.");
    } catch {
      setNote("Couldn't search right now.");
    }
    setLoading(false);
  };

  const askAi = async (e: FormEvent) => {
    e.preventDefault();
    const query = aiQuery.trim();
    if (query.length < 4) return;
    setAiLoading(true);
    setAiAnswer(null);
    setAiHotels(null);
    setAiSimulated(false);
    try {
      const res = await fetch("/api/travel/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setAiAnswer(data.answer || "Tell me a city and I'll find Muslim-friendly stays there.");
      setAiHotels((data.hotels as Hotel[]) || []);
      setAiSimulated(!!data.simulated);
    } catch {
      setAiAnswer("Couldn't reach the concierge right now — try the Search tab.");
      setAiHotels([]);
    }
    setAiLoading(false);
  };

  const shown = results ? sortHotels(results.filter((h) => matchesFilters(h, filters)), sort) : null;

  return (
    <div className="screen-in hh-page">
      <Crumbs trail={[{ label: "Home", href: "/" }, { label: "Travel" }]} />

      {/* ── hero ── */}
      <section className="ota-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ota-hero-media" src={HERO_IMG} alt="" aria-hidden loading="eager" />
        <div className="ota-hero-scrim pattern" />
        <div className="hh-wrap">
          <div className="ota-hero-head">
            <span className="eyebrow"><Icon name="crescent" size={13} /> Halal travel</span>
            <h1>Muslim-friendly stays, better prices</h1>
            <p className="sub">Prayer rooms, halal dining nearby and alcohol-free stays — from Umrah hotels by the Haramain to family trips across Asia.</p>
          </div>

          <div className="ota-segtabs" role="tablist" aria-label="Search mode">
            <button type="button" role="tab" aria-selected={tab === "search"} className={`ota-segtab ${tab === "search" ? "on" : ""}`} onClick={() => setTab("search")}>
              <Icon name="search" size={15} /> Search
            </button>
            <button type="button" role="tab" aria-selected={tab === "ai"} className={`ota-segtab ai-spark ${tab === "ai" ? "on" : ""}`} onClick={() => setTab("ai")}>
              <Icon name="sparkles" size={15} /> Ask AI
            </button>
          </div>

          <div className="ota-searchbox tabbed">
            {tab === "search" ? (
              <form className="ota-search-row" onSubmit={submit}>
                <div className="ota-seg ota-seg-where">
                  <span className="ota-seg-label">Where</span>
                  <PlaceAutocomplete cities={cities} value={dest} onPick={setDest} />
                </div>
                <DateRangeField checkin={checkin} checkout={checkout} onChange={(ci, co) => { setCheckin(ci); setCheckout(co); }} startLabel="Dates" />
                <OccupancyField value={occ} onChange={setOcc} withRooms label="Guests" />
                <button className="ota-search-go btn btn-primary" type="submit" disabled={loading}>
                  {loading ? "Searching…" : <><Icon name="search" size={17} /> Search</>}
                </button>
              </form>
            ) : (
              <form className="ota-ai-row" onSubmit={askAi}>
                <div className="ota-ai-input">
                  <Icon name="sparkles" size={18} className="ai-spark" />
                  <input
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    placeholder="e.g. Family-friendly hotel near a mosque in Mecca, first week of Ramadan"
                    aria-label="Describe your ideal halal stay"
                  />
                </div>
                <button className="ota-search-go btn btn-primary" type="submit" disabled={aiLoading}>{aiLoading ? "Finding…" : "Find stays"}</button>
              </form>
            )}
          </div>
        </div>
      </section>

      <div className="hh-wrap hh-section">
        {/* ── AI answer + results ── */}
        {tab === "ai" && (aiLoading || aiAnswer) && (
          <section className="travel-ai-results" style={{ marginBottom: 36 }}>
            {aiAnswer && <AiAnswer>{aiAnswer}</AiAnswer>}
            {aiSimulated && <p className="muted" style={{ fontSize: ".84rem", marginTop: 8 }}>Preview — live rates aren&apos;t connected yet, so the stays below are illustrative.</p>}
            {aiLoading ? (
              <div className="hotel-grid" style={{ marginTop: 16 }}>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
            ) : aiHotels && aiHotels.length > 0 ? (
              <div className="hotel-grid" style={{ marginTop: 16 }}>{aiHotels.map((h) => <HotelCard key={h.id} hotel={h} />)}</div>
            ) : aiHotels ? (
              <p className="muted" style={{ marginTop: 12 }}>No stays to show yet — add a city to your request, or try the Search tab.</p>
            ) : null}
          </section>
        )}

        {/* ── classic search results ── */}
        {note ? <p className="muted" style={{ marginBottom: 14 }}>{note}</p> : null}
        {loading && tab === "search" && (
          <div className="hotel-grid" style={{ marginBottom: 40 }}>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        )}
        {results && results.length > 0 && (
          <>
            <FilterBar active={filters} setActive={setFilters} options={availableFilters(results)} />
            <div className="flex between center" style={{ margin: "14px 0", gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "1.35rem" }}>{shown!.length} hotel{shown!.length !== 1 ? "s" : ""}</h2>
              <div className="flt-sort-tabs" role="tablist" aria-label="Sort results" style={{ marginBottom: 0 }}>
                {([
                  ["halal", "Most Muslim-friendly", "Halal score first"],
                  ["price", "Price", "Lowest first"],
                  ["rating", "Rating", "Top scored"],
                ] as [HotelSort, string, string][]).map(([k, label, sub]) => (
                  <button key={k} type="button" role="tab" aria-selected={sort === k} className={sort === k ? "on" : ""} onClick={() => setSort(k)}>
                    <span className="flt-sort-label">{label}</span>
                    <span className="flt-sort-sub">{sub}</span>
                  </button>
                ))}
              </div>
            </div>
            {shown!.length > 0 ? (
              <div className="hotel-grid" style={{ marginBottom: 40 }}>{shown!.map((h) => <HotelCard key={h.id} hotel={h} />)}</div>
            ) : (
              <p className="muted" style={{ marginBottom: 40 }}>No hotels match those halal filters. Try removing one.</p>
            )}
          </>
        )}

        {/* ── recommended / nearby carousels (landing default) ── */}
        {!results && tab === "search" && recommended.length > 0 && (
          <Carousel title="Recommended stays" ariaLabel="Recommended Muslim-friendly stays">
            {recommended.map((h) => <div key={h.id} className="ota-citem"><HotelCard hotel={h} /></div>)}
          </Carousel>
        )}
        {!results && tab === "search" && nearby.length > 0 && (
          <Carousel title="Nearby stays" ariaLabel="Nearby Muslim-friendly stays">
            {nearby.map((h) => <div key={h.id} className="ota-citem"><HotelCard hotel={h} /></div>)}
          </Carousel>
        )}

        <Link href="/travel/flights" className="flights-cta">
          <span className="fcta-ico"><Icon name="plane" size={20} /></span>
          <span className="fcta-text"><strong>Need flights too?</strong> Search hundreds of airlines for your Umrah or Muslim-travel journey.</span>
          <span className="fcta-go">Search flights <Icon name="arrow" size={15} /></span>
        </Link>

        <h2 style={{ fontSize: "1.35rem", marginBottom: 4 }}>Browse destinations</h2>
        <p className="muted" style={{ marginBottom: 18 }}>Curated halal-travel guides with Muslim-friendly hotels in each city.</p>
        <div className="dest-grid">{cities.map((c) => <DestinationCard key={c.slug} c={c} />)}</div>

        <section className="flt-land-benefits" style={{ marginTop: 44 }}>
          <h2 style={{ fontSize: "1.5rem" }}>Why book your halal travel with Humble Halal</h2>
          <p className="muted" style={{ maxWidth: 640, margin: "6px 0 18px" }}>The comfort of a mainstream hotel search, with the Muslim-first details that matter — and a team that checks, not just an algorithm.</p>
          <div className="flt-benefit-grid">
            {[
              ["mosque", "Prayer rooms & qibla on every stay", "See prayer-room availability, today's prayer times and the qibla direction for each hotel — with the nearest mosque and halal dining mapped close by."],
              ["badge-check", "Checked by people, not just an algorithm", "Muslim-friendly facilities come from each hotel's own information; where you see a Verified badge, our team has reviewed it. We're a discovery platform, never a blanket certifier."],
              ["crescent", "Filter for what you need", "Narrow stays by prayer room, halal food nearby, alcohol-free, women-only facilities and near-a-mosque — so you book with confidence."],
              ["plane", "Plan flights & hotel together", "Pair your stay with flights for Umrah, Hajj or Muslim travel in one place, and keep your whole trip organised."],
            ].map(([ic, h, b]) => (
              <div key={h} className="flt-benefit"><span className="fi-ico"><Icon name={ic} size={20} /></span><h3>{h}</h3><p className="muted">{b}</p></div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: 14 }}>How it works</h2>
          <ol className="flt-how-steps">
            <li><span className="fhs-n">1</span><div><strong>Search a destination &amp; dates</strong><p className="muted">Any city worldwide — from Umrah hotels by the Haramain to family trips across Asia.</p></div></li>
            <li><span className="fhs-n">2</span><div><strong>Filter by your halal needs</strong><p className="muted">Prayer room, halal food nearby, alcohol-free, women-only — and check prayer times, qibla and what&apos;s near.</p></div></li>
            <li><span className="fhs-n">3</span><div><strong>Book with confidence</strong><p className="muted">Pay securely through our travel partner, with free cancellation where the rate allows.</p></div></li>
          </ol>
        </section>

        <section style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: 14 }}>Halal hotel booking — your questions</h2>
          <div className="flt-faq">
            {[
              ["What makes a hotel “Muslim-friendly”?", "We surface facts that matter to Muslim travellers — prayer rooms, halal dining on-site or nearby, alcohol-free options, women-only facilities and proximity to a mosque — drawn from each hotel's own information, plus prayer times and qibla for the location. Always confirm specific requirements (kitchen, dining, facilities) with the hotel."],
              ["Are these hotels halal-certified?", "No — Humble Halal is a discovery platform, not a certifier. We never assert a hotel is “halal”. Where you see a Verified badge, our team has reviewed the hotel's information; everything else is the hotel's own declaration, which you should confirm directly."],
              ["Can I filter for prayer rooms or alcohol-free stays?", "Yes. After you search, filter by prayer room, halal food (on-site or nearby), alcohol-free, women-only facilities and near-a-mosque to find a stay that fits your needs."],
              ["Can I book flights and a hotel together?", "Yes. Search flights for your Umrah, Hajj or Muslim-travel journey and pair them with a Muslim-friendly stay, so your whole trip is planned in one place."],
            ].map(([q, a]) => (
              <details key={q} className="flt-faq-item"><summary>{q}<span className="faq-chevron" aria-hidden="true" /></summary><p>{a}</p></details>
            ))}
          </div>
        </section>

        <p className="travel-disclaimer" style={{ marginTop: 36 }}>
          Humble Halal is a discovery platform, not a certifier. Muslim-friendly facilities are derived from each hotel&apos;s own
          information and, where marked, verified by our team — always confirm specific halal requirements with the hotel.
        </p>
      </div>
    </div>
  );
}
