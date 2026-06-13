"use client";

/* Humble Halal — halal travel vertical (Booking.com/Trip.com-style).
   Props-driven; server pages fetch LiteAPI data. Full journey: search → hotel →
   room → guest details → payment → confirmation. Booking is gated by
   PAID_HOTELS_ENABLED; when off, the Book CTA degrades to lead capture. */
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon, Empty } from "../ui";
import { MapView } from "../map/map-view";
import {
  activeFlagLabels,
  countryLabel,
  ratingWord,
  type Hotel,
  type HotelFlags,
  type HotelReview,
  type HotelSentiment,
  type RateOffer,
  type RoomGroup,
} from "@/lib/halal-hotels";
import { compassLabel } from "@/lib/qibla";
import type { PrayerTimesResult } from "@/lib/prayer";
import type { TravelHub } from "@/lib/travel-hubs";
import type { QA } from "@/lib/faq";

declare global {
  interface Window {
    LiteAPIPayment?: new (cfg: Record<string, unknown>) => { handlePayment?: () => void; mountPaymentForm?: () => void };
  }
}

/* ── shared bits ─────────────────────────────────────────────────────────── */

function RatingBadge({ score, count, size = "sm" }: { score?: number; count?: number; size?: "sm" | "lg" }) {
  if (score == null) return null;
  return (
    <div className={`rate-badge ${size}`}>
      <span className="rate-num">{score.toFixed(1)}</span>
      <span className="rate-word">{ratingWord(score)}{count ? <small> · {count.toLocaleString()} reviews</small> : null}</span>
    </div>
  );
}

function Stars({ n }: { n?: number }) {
  if (!n || n < 1) return null;
  return <span className="hotel-stars" aria-label={`${n} star`}>{"★".repeat(Math.round(n))}</span>;
}

function HalalChip({ hotel, compact }: { hotel: Hotel; compact?: boolean }) {
  const flags = activeFlagLabels(hotel.flags);
  const show = hotel.verified || flags.length > 0 || hotel.halalScore >= 45;
  if (!show) return null;
  return (
    <span className={`halal-chip ${hotel.verified ? "verified" : ""}`} title={hotel.verified ? "Verified Muslim-friendly by our team" : "Muslim-friendly facilities (unverified)"}>
      <Icon name="crescent" size={12} /> {hotel.verified ? "Verified " : ""}Muslim-friendly{compact ? "" : ` · ${hotel.halalScore}`}
    </span>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  const flags = activeFlagLabels(hotel.flags).slice(0, 3);
  return (
    <Link href={`/travel/hotel/${hotel.id}`} className="hotel-card">
      <div className="hotel-photo">
        {hotel.image ? <img src={hotel.image} alt={hotel.name} loading="lazy" /> : <div className="ph-empty" aria-hidden />}
        {hotel.stars ? <span className="photo-stars"><Stars n={hotel.stars} /></span> : null}
        {hotel.guestRating ? <span className="photo-rating">{hotel.guestRating.toFixed(1)}</span> : null}
        <HalalChip hotel={hotel} compact />
      </div>
      <div className="body">
        <h3>{hotel.name}</h3>
        <div className="loc"><Icon name="pin" size={13} /> {hotel.city || ""}{hotel.country ? `, ${countryLabel(hotel.country)}` : ""}</div>
        {flags.length > 0 && (
          <div className="halal-flags">{flags.map((l) => <span key={l} className="halal-flag"><Icon name="check" size={11} /> {l}</span>)}</div>
        )}
        <div className="card-foot">
          {hotel.guestRating ? <span className="rate-word-sm">{ratingWord(hotel.guestRating)}{hotel.reviewCount ? ` · ${hotel.reviewCount.toLocaleString()}` : ""}</span> : <span />}
          {hotel.priceFrom ? <span className="price">{hotel.priceFrom.currency} {Math.round(hotel.priceFrom.amount)}<small>/stay</small></span> : null}
        </div>
      </div>
    </Link>
  );
}

function DestinationCard({ c }: { c: TravelHub }) {
  return (
    <Link href={`/travel/${c.slug}`} className={`dest-card ${c.umrah ? "umrah" : ""}`}>
      <span className="dest-pattern hh-pattern" aria-hidden />
      {c.umrah ? <span className="dest-tag"><Icon name="crescent" size={11} /> Umrah</span> : null}
      <span className="dest-city">{c.name}</span>
      <span className="dest-country">{c.country}</span>
      <span className="dest-go">View hotels <Icon name="arrow" size={14} /></span>
    </Link>
  );
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function Crumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav className="travel-breadcrumbs" aria-label="Breadcrumb">
      <div className="hh-wrap">
        {trail.map((c, i) => (
          <span key={i} className="crumb">
            {c.href ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
            {i < trail.length - 1 && <Icon name="chevron" size={13} />}
          </span>
        ))}
      </div>
    </nav>
  );
}

/* ── halal filters + destination autocomplete + occupancy ─────────────────── */

const HOTEL_FILTERS: { key: keyof HotelFlags; label: string; alt?: keyof HotelFlags }[] = [
  { key: "has_prayer_room", label: "Prayer room" },
  { key: "halal_food_onsite", label: "Halal food", alt: "halal_food_nearby" },
  { key: "alcohol_free", label: "Alcohol-free" },
  { key: "women_only_facilities", label: "Women-only" },
  { key: "near_mosque", label: "Near mosque" },
];

function matchesFilters(h: Hotel, active: string[]): boolean {
  return active.every((k) => {
    const f = HOTEL_FILTERS.find((x) => x.key === k);
    if (!f) return true;
    return h.flags[f.key] || (f.alt ? h.flags[f.alt] : false);
  });
}

/** Which halal filters have at least one matching hotel in this list. We only
 *  show filters we have data for, so a filter can never blank the whole page. */
function availableFilters(hotels: Hotel[]): typeof HOTEL_FILTERS {
  return HOTEL_FILTERS.filter((f) => hotels.some((h) => h.flags[f.key] || (f.alt ? h.flags[f.alt] : false)));
}

function FilterBar({ active, setActive, options }: { active: string[]; setActive: (a: string[]) => void; options: typeof HOTEL_FILTERS }) {
  if (options.length === 0) return null;
  const toggle = (k: string) => setActive(active.includes(k) ? active.filter((x) => x !== k) : [...active, k]);
  return (
    <div className="filter-bar">
      <span className="filter-label"><Icon name="crescent" size={13} /> Halal filters</span>
      {options.map((f) => (
        <button key={f.key} type="button" className={`filter-chip ${active.includes(f.key) ? "on" : ""}`} onClick={() => toggle(f.key)}>{f.label}</button>
      ))}
      {active.length > 0 && <button type="button" className="filter-clear" onClick={() => setActive([])}>Clear</button>}
    </div>
  );
}

interface Dest { label: string; placeId?: string; cityName?: string; countryCode?: string; currency?: string }

function PlaceAutocomplete({ cities, value, onPick }: { cities: TravelHub[]; value: Dest | null; onPick: (d: Dest) => void }) {
  const [q, setQ] = useState(value?.label || "");
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState<{ placeId: string; name: string; address: string }[]>([]);
  useEffect(() => {
    if (q.trim().length < 2) { setPlaces([]); return; }
    const t = setTimeout(async () => {
      try { const r = await fetch(`/api/travel/places?q=${encodeURIComponent(q)}`); const d = await r.json(); if (d.ok) setPlaces(d.places || []); } catch { /* ignore */ }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  const curated = cities.filter((c) => `${c.name} ${c.country}`.toLowerCase().includes(q.toLowerCase())).slice(0, 4);
  return (
    <div className="ac">
      <input value={q} placeholder="City, landmark…" onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} />
      {open && q.trim().length >= 2 && (curated.length > 0 || places.length > 0) && (
        <div className="ac-list">
          {curated.map((c) => (
            <button key={c.slug} type="button" className="ac-item" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick({ label: `${c.name}, ${c.country}`, cityName: c.cityName, countryCode: c.countryCode, currency: c.currency }); setQ(`${c.name}, ${c.country}`); setOpen(false); }}>
              <Icon name="crescent" size={13} /> <span>{c.name}<small> · {c.country}{c.umrah ? " · Umrah" : ""}</small></span>
            </button>
          ))}
          {places.map((p) => (
            <button key={p.placeId} type="button" className="ac-item" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick({ label: p.name, placeId: p.placeId }); setQ(p.name); setOpen(false); }}>
              <Icon name="pin" size={13} /> <span>{p.name}<small> · {p.address}</small></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── landing + search ────────────────────────────────────────────────────── */

export function TravelScreen({ cities }: { cities: TravelHub[] }) {
  const today = new Date();
  const first = cities[0];
  const [dest, setDest] = useState<Dest | null>(first ? { label: `${first.name}, ${first.country}`, cityName: first.cityName, countryCode: first.countryCode, currency: first.currency } : null);
  const [checkin, setCheckin] = useState(fmtDate(new Date(today.getTime() + 30 * 864e5)));
  const [checkout, setCheckout] = useState(fmtDate(new Date(today.getTime() + 32 * 864e5)));
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Hotel[] | null>(null);
  const [note, setNote] = useState("");
  const [filters, setFilters] = useState<string[]>([]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!dest) return;
    setLoading(true);
    setNote("");
    const childAges = children > 0 ? Array(children).fill(8) : undefined;
    const occ = Array.from({ length: rooms }, () => (childAges ? { adults, children: childAges } : { adults }));
    try {
      const res = await fetch("/api/travel/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: dest.placeId, cityName: dest.cityName, countryCode: dest.countryCode, checkin, checkout, currency: dest.currency || "USD", guestNationality: "SG", occupancies: occ, limit: 30 }),
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

  const shown = results ? results.filter((h) => matchesFilters(h, filters)) : null;

  return (
    <div className="screen-in hh-page">
      <Crumbs trail={[{ label: "Home", href: "/" }, { label: "Travel" }]} />
      <section className="travel-hero hh-pattern">
        <div className="hh-wrap">
          <span className="eyebrow" style={{ color: "#cfe0da" }}>Halal travel</span>
          <h1>Muslim-friendly hotels, worldwide</h1>
          <p className="sub">Prayer rooms, halal dining nearby and alcohol-free stays — from Umrah hotels by the Haramain to family trips across Asia.</p>
          <form className="travel-search v2" onSubmit={submit}>
            <div className="field"><label>Destination</label><PlaceAutocomplete cities={cities} value={dest} onPick={setDest} /></div>
            <div className="field"><label htmlFor="t-in">Check-in</label><input id="t-in" type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} /></div>
            <div className="field"><label htmlFor="t-out">Check-out</label><input id="t-out" type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} /></div>
            <div className="field occ"><label>Rooms &amp; guests</label>
              <div className="occ-row">
                <select aria-label="Rooms" value={rooms} onChange={(e) => setRooms(Number(e.target.value))}>{[1, 2, 3].map((n) => <option key={n} value={n}>{n} room{n > 1 ? "s" : ""}</option>)}</select>
                <select aria-label="Adults" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} adult{n > 1 ? "s" : ""}</option>)}</select>
                <select aria-label="Children" value={children} onChange={(e) => setChildren(Number(e.target.value))}>{[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n} child{n !== 1 ? "ren" : ""}</option>)}</select>
              </div>
            </div>
            <div className="field field-go"><label aria-hidden>&nbsp;</label><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Searching…" : "Search hotels"}</button></div>
          </form>
        </div>
      </section>

      <div className="hh-wrap hh-section">
        {note ? <p className="muted" style={{ marginBottom: 14 }}>{note}</p> : null}
        {results && results.length > 0 && (
          <>
            <FilterBar active={filters} setActive={setFilters} options={availableFilters(results)} />
            <div className="flex between center" style={{ margin: "14px 0" }}>
              <h2 style={{ fontSize: "1.35rem" }}>{shown!.length} hotel{shown!.length !== 1 ? "s" : ""}</h2>
              <span className="muted" style={{ fontSize: ".86rem" }}>Most Muslim-friendly first</span>
            </div>
            {shown!.length > 0 ? (
              <div className="hotel-grid" style={{ marginBottom: 40 }}>{shown!.map((h) => <HotelCard key={h.id} hotel={h} />)}</div>
            ) : (
              <p className="muted" style={{ marginBottom: 40 }}>No hotels match those halal filters. Try removing one.</p>
            )}
          </>
        )}

        <Link href="/travel/flights" className="flights-cta">
          <span className="fcta-ico"><Icon name="plane" size={20} /></span>
          <span className="fcta-text"><strong>Need flights too?</strong> Search hundreds of airlines for your Umrah or Muslim-travel journey.</span>
          <span className="fcta-go">Search flights <Icon name="arrow" size={15} /></span>
        </Link>

        <h2 style={{ fontSize: "1.35rem", marginBottom: 4 }}>Browse destinations</h2>
        <p className="muted" style={{ marginBottom: 18 }}>Curated halal-travel guides with Muslim-friendly hotels in each city.</p>
        <div className="dest-grid">{cities.map((c) => <DestinationCard key={c.slug} c={c} />)}</div>

        <p className="travel-disclaimer" style={{ marginTop: 28 }}>
          Humble Halal is a discovery platform, not a certifier. Muslim-friendly facilities are derived from each hotel's own
          information and, where marked, verified by our team — always confirm specific halal requirements with the hotel.
        </p>
      </div>
    </div>
  );
}

/* ── city hub ────────────────────────────────────────────────────────────── */

interface CityPrice { city: string; avgUsd: number; minUsd: number; maxUsd: number; cheapestDay?: string }
function niceDate(iso?: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const mo = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][(m || 1) - 1];
  return `${d} ${mo}`;
}
export function TravelCityScreen({ hub, hotels, faq, related, priceTip }: { hub: TravelHub; hotels: Hotel[]; faq: QA[]; related: TravelHub[]; priceTip?: CityPrice | null }) {
  const [view, setView] = useState<"list" | "map">("list");
  const [open, setOpen] = useState<number | null>(0);
  const [filters, setFilters] = useState<string[]>([]);
  const shown = hotels.filter((h) => matchesFilters(h, filters));
  const points = shown.filter((h) => h.coords).map((h) => ({ id: h.id, name: h.name, coords: h.coords! }));

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

/* ── hotel detail ────────────────────────────────────────────────────────── */

interface NearPlace { name: string; lat: number; lng: number; distanceM: number; cuisine?: string }
function dist(m: number) { return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`; }

const HOTEL_TABS: [string, string][] = [["overview", "Overview"], ["amenities", "Facilities"], ["rooms", "Rooms"], ["reviews", "Reviews"], ["ask", "Ask AI"], ["location", "Location"]];

function AskHotel({ hotelId }: { hotelId: string }) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const suggestions = ["Is there a prayer room?", "Is halal food available nearby?", "Is alcohol served?", "What time is check-in?", "Is there free parking?"];
  const ask = async (question: string) => {
    const text = question.trim();
    if (text.length < 3) return;
    setLoading(true);
    setAnswer(null);
    try {
      const r = await fetch(`/api/travel/ask?hotelId=${encodeURIComponent(hotelId)}&q=${encodeURIComponent(text)}`);
      const d = await r.json();
      setAnswer(d.ok && d.answer ? d.answer : "I don't have that information for this hotel — please check with the hotel directly.");
    } catch {
      setAnswer("Couldn't get an answer right now.");
    }
    setLoading(false);
  };
  return (
    <div className="ask-ai">
      <h2 style={{ fontSize: "1.2rem" }}>Ask about this hotel <span className="aa-beta">AI · Beta</span></h2>
      <p className="muted" style={{ fontSize: ".86rem", marginTop: 4 }}>Instant answers from the hotel's own information — ask about prayer rooms, halal food, alcohol policy and more.</p>
      <div className="aa-suggest">{suggestions.map((s) => <button key={s} type="button" className="aa-chip" onClick={() => { setQ(s); ask(s); }}>{s}</button>)}</div>
      <form className="aa-form" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything about this hotel…" />
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Asking…" : "Ask"}</button>
      </form>
      {answer && <div className="aa-answer">{answer}</div>}
    </div>
  );
}
function HotelTabs() {
  return (
    <nav className="hotel-tabs">
      <div className="hh-wrap inner">{HOTEL_TABS.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}</div>
    </nav>
  );
}

function PrayerCard({ prayer }: { prayer: PrayerTimesResult }) {
  const rows: [string, string][] = [["Fajr", prayer.fajr], ["Dhuhr", prayer.dhuhr], ["Asr", prayer.asr], ["Maghrib", prayer.maghrib], ["Isha", prayer.isha]];
  return (
    <div className="muslim-card">
      <h3 className="muslim-card-h"><Icon name="clock" size={15} /> Prayer times today</h3>
      <div className="prayer-row">{rows.map(([n, t]) => <div key={n} className="prayer-cell"><span className="pn">{n}</span><span className="pt">{t}</span></div>)}</div>
      <p className="muslim-card-f">Iftar at Maghrib {prayer.maghrib} · Suhoor ends Fajr {prayer.fajr}{prayer.timezone ? ` · ${prayer.timezone}` : ""}</p>
    </div>
  );
}

function QiblaCard({ qibla }: { qibla: number }) {
  return (
    <div className="muslim-card qibla-card">
      <h3 className="muslim-card-h"><Icon name="crescent" size={15} /> Qibla direction</h3>
      <div className="qibla-body">
        <div className="qibla-dial"><span className="qibla-arrow" style={{ transform: `rotate(${qibla}deg)` }} /></div>
        <div><div className="qibla-deg">{Math.round(qibla)}°</div><div className="muted" style={{ fontSize: ".82rem" }}>{compassLabel(qibla)} — toward the Kaaba</div></div>
      </div>
    </div>
  );
}

function SentimentBlock({ sentiment }: { sentiment: HotelSentiment }) {
  return (
    <div className="sentiment">
      {sentiment.pros.length > 0 && (
        <div className="sent-likes">
          <span className="sent-likes-h">What guests liked</span>
          <div className="halal-flags" style={{ marginTop: 8 }}>{sentiment.pros.slice(0, 8).map((p) => <span key={p} className="halal-flag"><Icon name="check" size={11} /> {p}</span>)}</div>
        </div>
      )}
      {sentiment.categories.length > 0 && (
        <div className="sent-cats">{sentiment.categories.slice(0, 8).map((c) => (
          <div key={c.name} className="sent-cat"><span className="sc-name">{c.name}</span><span className="sc-bar"><span className="sc-fill" style={{ width: `${Math.min(100, c.rating * 10)}%` }} /></span><span className="sc-val">{c.rating.toFixed(1)}</span></div>
        ))}</div>
      )}
    </div>
  );
}

function Lightbox({ photos, index, setIndex, title, onClose }: { photos: string[]; index: number; setIndex: (n: number) => void; title: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((index - 1 + photos.length) % photos.length);
      if (e.key === "ArrowRight") setIndex((index + 1) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onClose, setIndex]);
  return (
    <div className="lightbox" onClick={onClose} role="dialog" aria-modal="true">
      <button type="button" className="lb-close" onClick={onClose} aria-label="Close">✕</button>
      {photos.length > 1 && <button type="button" className="lb-nav prev" onClick={(e) => { e.stopPropagation(); setIndex((index - 1 + photos.length) % photos.length); }} aria-label="Previous">‹</button>}
      <img src={photos[index]} alt={title} onClick={(e) => e.stopPropagation()} />
      {photos.length > 1 && <button type="button" className="lb-nav next" onClick={(e) => { e.stopPropagation(); setIndex((index + 1) % photos.length); }} aria-label="Next">›</button>}
      <span className="lb-count">{index + 1} / {photos.length}</span>
    </div>
  );
}

function RoomGroupCard({ group, hotel, bookingEnabled }: { group: RoomGroup; hotel: Hotel; bookingEnabled: boolean }) {
  const [pi, setPi] = useState(0);
  const [zoom, setZoom] = useState(false);
  const photos = group.photos.length ? group.photos : hotel.image ? [hotel.image] : [];
  const href = (offerId: string) => `/travel/booking?offerId=${encodeURIComponent(offerId)}&hotelId=${encodeURIComponent(hotel.id)}&hotel=${encodeURIComponent(hotel.name)}&city=${encodeURIComponent(hotel.city || "")}`;
  return (
    <div className="room-card">
      {zoom && photos.length > 0 && <Lightbox photos={photos} index={pi % photos.length} setIndex={setPi} title={group.name} onClose={() => setZoom(false)} />}
      <div className="room-media">
        {photos.length > 0 ? (
          <div className="room-photo">
            <img src={photos[pi % photos.length]} alt={group.name} loading="lazy" onClick={() => setZoom(true)} style={{ cursor: "zoom-in" }} />
            {photos.length > 1 && (
              <>
                <button type="button" className="rm-nav prev" onClick={() => setPi((p) => (p - 1 + photos.length) % photos.length)} aria-label="Previous photo">‹</button>
                <button type="button" className="rm-nav next" onClick={() => setPi((p) => (p + 1) % photos.length)} aria-label="Next photo">›</button>
                <span className="rm-count">{(pi % photos.length) + 1}/{photos.length}</span>
              </>
            )}
          </div>
        ) : <div className="room-photo empty" aria-hidden />}
        <div className="room-meta">
          <div className="room-name">{group.name}</div>
          <div className="room-facts">
            {group.sizeSqm ? <span>{group.sizeSqm} {group.sizeUnit || "m²"}</span> : null}
            {group.sleeps ? <span><Icon name="user" size={13} /> Sleeps {group.sleeps}</span> : null}
          </div>
          {group.amenities.length > 0 && <div className="room-amen">{group.amenities.slice(0, 4).map((a) => <span key={a}>{a}</span>)}</div>}
        </div>
      </div>
      <div className="room-options">
        {group.options.map((o) => (
          <div key={o.offerId} className="room-opt">
            <div className="ro-board">
              <span className="ro-board-name">{o.board}</span>
              <span className={o.refundable ? "tag-good" : "muted"} style={{ fontSize: ".8rem" }}>{o.refundable ? "Free cancellation" : "Non-refundable"}</span>
            </div>
            <div className="ro-price">
              {o.discountPct ? <span className="ro-off">{o.discountPct}% OFF</span> : null}
              <span className="ro-amount">{o.currency || ""} {o.price != null ? Math.round(o.price) : "—"}</span>
              {o.original ? <span className="ro-was">{o.currency || ""} {Math.round(o.original)}</span> : null}
            </div>
            {bookingEnabled ? <Link className="btn btn-primary btn-sm" href={href(o.offerId)}>Reserve</Link> : <Link className="btn btn-soft btn-sm" href="/quotes?category=travel">Enquire</Link>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TravelHotelScreen({ hotel, images, offers, roomGroups, reviews, mosques, halalFood, prayer, sentiment, qibla, bookingEnabled }: { hotel: Hotel; images: string[]; offers: RateOffer[]; roomGroups: RoomGroup[]; reviews: HotelReview[]; mosques: NearPlace[]; halalFood: NearPlace[]; prayer: PrayerTimesResult | null; sentiment: HotelSentiment | null; qibla: number | null; bookingEnabled: boolean }) {
  const flags = activeFlagLabels(hotel.flags);
  const gallery = images.slice(0, 5);
  const allOptionPrices = roomGroups.flatMap((g) => g.options).filter((o) => o.price != null);
  const cheapestOpt = allOptionPrices.sort((a, b) => a.price! - b.price!)[0];
  const cheapestFlat = offers.filter((o) => o.price != null).sort((a, b) => a.price! - b.price!)[0];
  const cheapest = cheapestOpt
    ? { price: cheapestOpt.price!, currency: cheapestOpt.currency }
    : cheapestFlat
      ? { price: cheapestFlat.price!, currency: cheapestFlat.currency }
      : null;

  return (
    <div className="screen-in hh-page">
      <Crumbs
        trail={[
          { label: "Home", href: "/" },
          { label: "Travel", href: "/travel" },
          ...(hotel.city ? [{ label: hotel.city }] : []),
          { label: hotel.name },
        ]}
      />
      <div className="hh-wrap hh-section">
        {gallery.length > 0 && (
          <div className="travel-gallery" style={{ marginBottom: 14 }}>
            {gallery.map((src, i) => <img key={i} src={src} alt={`${hotel.name} ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} />)}
          </div>
        )}
      </div>
      <HotelTabs />
      <div className="hh-wrap hh-section">
        <div className="hotel-detail-grid">
          <div>
            <div id="overview" style={{ scrollMarginTop: 70 }}>
              <div className="flex g10 center wrap" style={{ marginBottom: 4 }}>
                <Stars n={hotel.stars} />
                <HalalChip hotel={hotel} />
              </div>
              <h1 style={{ fontSize: "clamp(1.5rem,3vw,2.1rem)" }}>{hotel.name}</h1>
              <div className="loc" style={{ margin: "6px 0 14px" }}><Icon name="pin" size={14} /> {hotel.address || hotel.city}{hotel.country ? `, ${countryLabel(hotel.country)}` : ""}</div>

              {hotel.guestRating ? <div className="rating-block"><RatingBadge score={hotel.guestRating} count={hotel.reviewCount} size="lg" /></div> : null}

              {(prayer || qibla != null) && (
                <div className="muslim-cards">
                  {prayer && <PrayerCard prayer={prayer} />}
                  {qibla != null && <QiblaCard qibla={qibla} />}
                </div>
              )}

              {!hotel.verified && flags.length > 0 && (
                <p className="halal-unverified" style={{ marginTop: 14 }}>Muslim-friendly facilities below are derived from the hotel's own information and not yet verified by our team.</p>
              )}
              {flags.length > 0 && (
                <div className="halal-flags lg" style={{ margin: "14px 0" }}>{flags.map((l) => <span key={l} className="halal-flag"><Icon name="check" size={13} /> {l}</span>)}</div>
              )}

              {hotel.descriptionHtml ? (
                <div className="hotel-desc" dangerouslySetInnerHTML={{ __html: hotel.descriptionHtml }} />
              ) : hotel.description ? (
                <p className="hotel-desc">{hotel.description}</p>
              ) : null}
            </div>

            {hotel.amenities && hotel.amenities.length > 0 && (
              <section id="amenities" style={{ marginBottom: 26, scrollMarginTop: 70 }}>
                <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Amenities</h2>
                <div className="amenity-grid">{hotel.amenities.map((a) => <span key={a} className="amenity"><Icon name="check" size={14} /> {a}</span>)}</div>
              </section>
            )}

            <section id="rooms" style={{ marginBottom: 26, scrollMarginTop: 70 }}>
              <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Choose your room</h2>
              {roomGroups.length > 0 ? (
                <div className="room-cards">{roomGroups.map((g) => <RoomGroupCard key={g.name} group={g} hotel={hotel} bookingEnabled={bookingEnabled} />)}</div>
              ) : (
                <p className="muted">Live rates aren't available for the selected dates. Try the search on the Travel home.</p>
              )}
              {!bookingEnabled && roomGroups.length > 0 && <p className="muted" style={{ fontSize: ".84rem", marginTop: 10 }}>Online booking is opening soon — enquire and we'll help you book.</p>}
            </section>

            {(reviews.length > 0 || sentiment) && (
              <section id="reviews" style={{ marginBottom: 26, scrollMarginTop: 70 }}>
                <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Guest reviews</h2>
                {sentiment && <SentimentBlock sentiment={sentiment} />}
                <div className="reviews-grid" style={{ marginTop: sentiment ? 18 : 0 }}>
                  {reviews.slice(0, 6).map((r, i) => (
                    <div key={i} className="review-card">
                      <div className="review-top">
                        <span className="review-avatar">{r.name.charAt(0).toUpperCase()}</span>
                        <div><div className="review-name">{r.name}</div><div className="review-meta">{[r.type, r.country?.toUpperCase()].filter(Boolean).join(" · ")}</div></div>
                        {r.score != null ? <span className="review-score">{r.score.toFixed(1)}</span> : null}
                      </div>
                      {r.headline && <div className="review-headline">“{r.headline}”</div>}
                      {r.pros && <p className="review-pros"><Icon name="plus" size={12} /> {r.pros}</p>}
                      {r.cons && <p className="review-cons"><Icon name="minus" size={12} /> {r.cons}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section id="ask" style={{ marginBottom: 26, scrollMarginTop: 70 }}>
              <AskHotel hotelId={hotel.id} />
            </section>

            {(mosques.length > 0 || halalFood.length > 0) && (
              <section style={{ marginBottom: 26 }}>
                <h2 style={{ fontSize: "1.2rem", marginBottom: 4 }}>What's nearby</h2>
                <p className="muted" style={{ fontSize: ".84rem", marginBottom: 14 }}>Mosques and halal eateries close to this hotel (from OpenStreetMap).</p>
                <div className="nearby-cols">
                  {mosques.length > 0 && (
                    <div>
                      <h3 className="nearby-head"><Icon name="mosque" size={15} /> Mosques</h3>
                      <div className="mosque-list">
                        {mosques.map((m, i) => (
                          <div key={i} className="mosque-row">
                            <a className="mosque-name" href={`https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lng}`} target="_blank" rel="noopener noreferrer">{m.name}</a>
                            <span className="mosque-dist">{dist(m.distanceM)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {halalFood.length > 0 && (
                    <div>
                      <h3 className="nearby-head"><Icon name="utensils" size={15} /> Halal food</h3>
                      <div className="mosque-list">
                        {halalFood.map((m, i) => (
                          <div key={i} className="mosque-row food">
                            <a className="mosque-name" href={`https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lng}`} target="_blank" rel="noopener noreferrer">{m.name}{m.cuisine ? <span className="muted" style={{ fontWeight: 500 }}> · {m.cuisine}</span> : null}</a>
                            <span className="mosque-dist">{dist(m.distanceM)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {hotel.coords && (
              <section id="location" style={{ marginBottom: 12, scrollMarginTop: 70 }}>
                <h2 style={{ fontSize: "1.2rem", marginBottom: 10 }}>Location</h2>
                <div className="travel-map sm">
                  <MapView
                    center={hotel.coords}
                    zoom={14}
                    points={[
                      { id: hotel.id, name: hotel.name, coords: hotel.coords },
                      ...mosques.map((m, i) => ({ id: `mq-${i}`, name: `Mosque: ${m.name}`, coords: { lat: m.lat, lng: m.lng } })),
                      ...halalFood.map((m, i) => ({ id: `hf-${i}`, name: `Halal: ${m.name}`, coords: { lat: m.lat, lng: m.lng } })),
                    ]}
                  />
                </div>
              </section>
            )}
          </div>

          {/* sticky reserve box */}
          <aside className="reserve-box">
            <div className="card" style={{ padding: 18 }}>
              {hotel.guestRating ? <RatingBadge score={hotel.guestRating} count={hotel.reviewCount} /> : null}
              {cheapest?.price != null ? (
                <div style={{ margin: "12px 0" }}>
                  <div className="muted" style={{ fontSize: ".8rem" }}>From</div>
                  <div className="reserve-price">{cheapest.currency || ""} {Math.round(cheapest.price)}<small> total</small></div>
                </div>
              ) : <p className="muted" style={{ fontSize: ".88rem", margin: "10px 0" }}>Check live rates from the Travel home.</p>}
              <HalalChip hotel={hotel} />
              {cheapest && (bookingEnabled ? (
                <a className="btn btn-primary btn-block" href="#rooms" style={{ marginTop: 14 }}>Choose a room</a>
              ) : (
                <Link className="btn btn-primary btn-block" href="/quotes?category=travel" style={{ marginTop: 14 }}>Enquire</Link>
              ))}
            </div>
          </aside>
        </div>

        <p className="travel-disclaimer" style={{ marginTop: 20 }}>
          Humble Halal is a discovery platform, not a certifier. Confirm specific halal requirements (kitchen, dining, facilities)
          directly with the hotel before booking.
        </p>
      </div>
    </div>
  );
}

/* ── booking flow (prebook → guest → payment → book) ─────────────────────── */

interface Prebook {
  prebookId: string;
  transactionId: string | null;
  secretKey: string | null;
  currency: string;
  price: number | null;
  sellingPrice: number | null;
  commission: number | null;
}

export function TravelBookingScreen({ offerId, hotelId, hotelName, city, bookingEnabled }: { offerId: string; hotelId: string; hotelName: string; city: string; bookingEnabled: boolean }) {
  const [pb, setPb] = useState<Prebook | null>(null);
  const [stage, setStage] = useState<"loading" | "details" | "paying" | "error">("loading");
  const [err, setErr] = useState("");
  const [holder, setHolder] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [booking, setBooking] = useState(false);
  const payRef = useRef<HTMLDivElement>(null);
  const publicKey = process.env.NEXT_PUBLIC_LITEAPI_PUBLIC_KEY;

  useEffect(() => {
    if (!bookingEnabled || !offerId) { setStage("error"); setErr(bookingEnabled ? "Missing offer." : "Online booking isn't enabled yet."); return; }
    (async () => {
      try {
        const res = await fetch("/api/travel/prebook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerId }) });
        const d = await res.json();
        if (!d.ok) { setStage("error"); setErr(d.error || d.reason || "Could not start booking."); return; }
        setPb(d as Prebook);
        setStage("details");
      } catch { setStage("error"); setErr("Could not start booking."); }
    })();
  }, [offerId, bookingEnabled]);

  const total = pb?.sellingPrice ?? pb?.price ?? null;

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    if (!pb) return;
    setBooking(true);
    setErr("");
    try {
      const res = await fetch("/api/travel/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prebookId: pb.prebookId,
          transactionId: pb.transactionId,
          holder,
          guests: [{ occupancyNumber: 1, ...holder }],
          hotelName, city, liteapiHotelId: hotelId,
          currency: pb.currency, retailTotal: total, commissionAmount: pb.commission,
        }),
      });
      const d = await res.json();
      if (!d.ok) { setErr(d.error || "Payment/booking failed."); setBooking(false); return; }
      const p = new URLSearchParams({ ref: String(d.bookingId || ""), code: String(d.confirmationCode || ""), hotel: hotelName, city });
      window.location.href = `/travel/booking/confirmation?${p.toString()}`;
    } catch { setErr("Payment/booking failed."); setBooking(false); }
  };

  return (
    <div className="screen-in hh-page">
      <Crumbs trail={[{ label: "Home", href: "/" }, { label: "Travel", href: "/travel" }, { label: "Book" }]} />
      <div className="hh-wrap hh-section booking-wrap">
        <h1 style={{ fontSize: "1.6rem", marginBottom: 4 }}>Complete your booking</h1>
        <p className="muted" style={{ marginBottom: 22 }}>{hotelName}{city ? ` · ${city}` : ""}</p>

        {stage === "loading" && <div className="route-loading" role="status"><span className="spinner" /> <span className="faint">Confirming your rate…</span></div>}
        {stage === "error" && <Empty icon="alert" title="Couldn't start booking" body={err || "Please try another room or dates."} />}

        {(stage === "details" || stage === "paying") && pb && (
          <div className="booking-grid">
            <form className="booking-form card" style={{ padding: 20 }} onSubmit={confirm}>
              <h2 style={{ fontSize: "1.1rem", marginBottom: 14 }}>Guest details</h2>
              <div className="form-row">
                <div className="field"><label>First name</label><input required value={holder.firstName} onChange={(e) => setHolder({ ...holder, firstName: e.target.value })} /></div>
                <div className="field"><label>Last name</label><input required value={holder.lastName} onChange={(e) => setHolder({ ...holder, lastName: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="field"><label>Email</label><input required type="email" value={holder.email} onChange={(e) => setHolder({ ...holder, email: e.target.value })} /></div>
                <div className="field"><label>Phone</label><input value={holder.phone} onChange={(e) => setHolder({ ...holder, phone: e.target.value })} /></div>
              </div>

              <h2 style={{ fontSize: "1.1rem", margin: "18px 0 12px" }}>Payment</h2>
              {publicKey ? (
                <div id="liteapi-payment" ref={payRef} className="pay-mount">
                  <p className="muted" style={{ fontSize: ".86rem" }}>Secure card payment by LiteAPI.</p>
                </div>
              ) : (
                <div className="notice notice-warn" style={{ marginBottom: 14 }}>
                  <Icon name="info" size={16} />
                  <span>Sandbox test mode — use the button below to complete a test booking (no card needed). Add <code>NEXT_PUBLIC_LITEAPI_PUBLIC_KEY</code> to enable the live card form.</span>
                </div>
              )}
              {err && <p style={{ color: "var(--danger)", fontSize: ".9rem", marginBottom: 10 }}>{err}</p>}
              <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={booking}>
                {booking ? "Confirming…" : total != null ? `Pay ${pb.currency} ${Math.round(total)} & confirm` : "Confirm booking"}
              </button>
              <p className="muted" style={{ fontSize: ".78rem", marginTop: 10, textAlign: "center" }}>You won't be charged until your booking is confirmed.</p>
            </form>

            <aside className="card booking-summary" style={{ padding: 18 }}>
              <h2 style={{ fontSize: "1.05rem", marginBottom: 12 }}>Price summary</h2>
              <div className="sum-row"><span>Room total</span><span>{pb.currency} {Math.round(pb.price ?? total ?? 0)}</span></div>
              {pb.commission != null && <div className="sum-row faint"><span>Incl. our service</span><span>{pb.currency} {Math.round(pb.commission)}</span></div>}
              <div className="sum-row total"><span>Total</span><span>{pb.currency} {Math.round(total ?? 0)}</span></div>
              <p className="muted" style={{ fontSize: ".78rem", marginTop: 12 }}>Booking handled securely by LiteAPI. Free cancellation where the rate allows.</p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export function TravelConfirmationScreen({ reference, code, hotel, city }: { reference?: string; code?: string; hotel?: string; city?: string }) {
  return (
    <div className="screen-in hh-page">
      <div className="hh-wrap hh-section" style={{ maxWidth: 620, textAlign: "center" }}>
        <div className="empty-ico" style={{ margin: "0 auto", background: "var(--emerald-50)", color: "var(--emerald)" }}><Icon name="check" size={30} /></div>
        <h1 style={{ fontSize: "1.7rem", marginTop: 16 }}>Booking confirmed</h1>
        <p className="muted" style={{ marginTop: 8 }}>{hotel ? <>Your stay at <strong>{hotel}</strong>{city ? `, ${city}` : ""} is confirmed.</> : "Your stay is confirmed."} A voucher has been sent to your email.</p>
        {(reference || code) && (
          <div className="card" style={{ padding: 18, margin: "20px auto", maxWidth: 360, textAlign: "left" }}>
            {reference && <div className="sum-row"><span className="muted">Booking ref</span><strong className="kbd-mono">{reference}</strong></div>}
            {code && <div className="sum-row"><span className="muted">Hotel confirmation</span><strong className="kbd-mono">{code}</strong></div>}
          </div>
        )}
        <div className="flex g10 center" style={{ justifyContent: "center" }}>
          <Link className="btn btn-primary" href="/travel/trips">View my trips</Link>
          <Link className="btn btn-soft" href="/travel">Back to travel</Link>
        </div>
      </div>
    </div>
  );
}

/* ── my trips (auth-gated) ───────────────────────────────────────────────── */

export interface TripBooking {
  id: string;
  liteapi_booking_id?: string | null;
  hotel_confirmation_code?: string | null;
  liteapi_hotel_id?: string | null;
  hotel_name?: string | null;
  city?: string | null;
  country?: string | null;
  checkin?: string | null;
  checkout?: string | null;
  currency?: string | null;
  retail_total?: number | null;
  refundable_tag?: string | null;
  status: string;
  created_at?: string;
}

export function TravelTripsScreen({ loggedIn, bookings }: { loggedIn: boolean; bookings: TripBooking[] }) {
  const [items, setItems] = useState(bookings);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const cancel = async (id: string) => {
    if (!window.confirm("Cancel this booking? The hotel's cancellation policy applies.")) return;
    setBusy(id);
    setErr("");
    try {
      const r = await fetch("/api/travel/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const d = await r.json();
      if (d.ok) setItems((xs) => xs.map((b) => (b.id === id ? { ...b, status: d.status || "cancelled" } : b)));
      else setErr(d.error || "Could not cancel.");
    } catch {
      setErr("Could not cancel.");
    }
    setBusy(null);
  };

  return (
    <div className="screen-in hh-page">
      <Crumbs trail={[{ label: "Home", href: "/" }, { label: "Travel", href: "/travel" }, { label: "My trips" }]} />
      <div className="hh-wrap hh-section" style={{ maxWidth: 760 }}>
        <h1 style={{ fontSize: "1.6rem", marginBottom: 14 }}>My trips</h1>
        {!loggedIn ? (
          <Empty icon="user" title="Log in to see your trips" body="Your hotel bookings appear here when you're signed in." />
        ) : items.length === 0 ? (
          <Empty icon="bed" title="No bookings yet" body="When you book a halal-friendly stay, it'll show up here." />
        ) : (
          <>
            {err && <p style={{ color: "var(--danger)", fontSize: ".9rem", marginBottom: 10 }}>{err}</p>}
            <div className="trip-list">
              {items.map((b) => (
                <div key={b.id} className={`trip-card ${b.status !== "confirmed" ? "inactive" : ""}`}>
                  <div className="trip-main">
                    <div className="trip-hotel">{b.liteapi_hotel_id ? <Link href={`/travel/hotel/${b.liteapi_hotel_id}`}>{b.hotel_name || "Hotel"}</Link> : b.hotel_name || "Hotel"}</div>
                    <div className="trip-meta">{[b.city, b.checkin && b.checkout ? `${b.checkin} → ${b.checkout}` : null].filter(Boolean).join(" · ")}</div>
                    <div className="trip-tags">
                      <span className={`trip-status ${b.status}`}>{b.status}</span>
                      {b.hotel_confirmation_code ? <span className="kbd-mono trip-ref">{b.hotel_confirmation_code}</span> : null}
                    </div>
                  </div>
                  <div className="trip-side">
                    {b.retail_total != null ? <div className="trip-total">{b.currency || ""} {Math.round(Number(b.retail_total))}</div> : null}
                    {b.status === "confirmed" && <button className="btn btn-ghost btn-sm" disabled={busy === b.id} onClick={() => cancel(b.id)}>{busy === b.id ? "Cancelling…" : "Cancel"}</button>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
