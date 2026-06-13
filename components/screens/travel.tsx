"use client";

/* Humble Halal — halal travel vertical screens (props-driven; server pages fetch
   LiteAPI data and pass it in). Discovery + SEO in Phase 1; the Book CTA degrades
   to lead capture while PAID_HOTELS_ENABLED is off. */
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon, Empty } from "../ui";
import { MapView } from "../map/map-view";
import { activeFlagLabels, type Hotel, type RateOffer } from "@/lib/halal-hotels";
import type { TravelHub } from "@/lib/travel-hubs";
import type { QA } from "@/lib/faq";

/* ── shared bits ─────────────────────────────────────────────────────────── */

function ScoreBadge({ hotel }: { hotel: Hotel }) {
  return (
    <span className={`halal-score ${hotel.verified ? "verified" : ""}`} title={hotel.verified ? "Verified by our team" : "Auto-derived — not yet verified"}>
      <span className="dot" /> {hotel.halalScore} {hotel.verified ? "· verified" : ""}
    </span>
  );
}

function FlagRow({ hotel, max = 4 }: { hotel: Hotel; max?: number }) {
  const labels = activeFlagLabels(hotel.flags).slice(0, max);
  if (!labels.length) return null;
  return (
    <div className="halal-flags">
      {labels.map((l) => (
        <span key={l} className="halal-flag"><Icon name="check" size={12} /> {l}</span>
      ))}
    </div>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <Link href={`/travel/hotel/${hotel.id}`} className="hotel-card">
      {hotel.image ? (
        <img className="ph" src={hotel.image} alt={hotel.name} loading="lazy" />
      ) : (
        <div className="ph" aria-hidden />
      )}
      <div className="body">
        <div className="hotel-meta">
          {hotel.stars ? <span className="hotel-stars">{"★".repeat(Math.round(hotel.stars))}</span> : null}
          {hotel.guestRating ? <span>{hotel.guestRating}/10{hotel.reviewCount ? ` · ${hotel.reviewCount}` : ""}</span> : null}
        </div>
        <h3>{hotel.name}</h3>
        {hotel.city ? <div className="loc">{hotel.city}{hotel.country ? `, ${hotel.country}` : ""}</div> : null}
        <FlagRow hotel={hotel} />
        <div className="flex between center" style={{ marginTop: "auto", gap: 8 }}>
          {hotel.priceFrom ? (
            <div className="price">{hotel.priceFrom.currency} {Math.round(hotel.priceFrom.amount)} <small>/ stay</small></div>
          ) : <span />}
          <ScoreBadge hotel={hotel} />
        </div>
      </div>
    </Link>
  );
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/* ── landing + search ────────────────────────────────────────────────────── */

export function TravelScreen({ cities }: { cities: TravelHub[] }) {
  const today = new Date();
  const inDefault = new Date(today.getTime() + 30 * 864e5);
  const outDefault = new Date(today.getTime() + 32 * 864e5);
  const [city, setCity] = useState(cities[0]?.slug || "");
  const [checkin, setCheckin] = useState(fmtDate(inDefault));
  const [checkout, setCheckout] = useState(fmtDate(outDefault));
  const [adults, setAdults] = useState(2);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Hotel[] | null>(null);
  const [note, setNote] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const c = cities.find((x) => x.slug === city);
    if (!c) return;
    setLoading(true);
    setNote("");
    try {
      const res = await fetch("/api/travel/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityName: c.cityName,
          countryCode: c.countryCode,
          checkin,
          checkout,
          currency: c.currency,
          guestNationality: "SG",
          occupancies: [{ adults }],
          limit: 24,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setResults(data.hotels as Hotel[]);
        if (data.simulated) setNote("Live rates aren't connected yet — showing destinations below.");
        else if (!data.hotels.length) setNote("No hotels found for those dates. Try another city or dates.");
      } else {
        setNote(data.error || "Couldn't search right now.");
      }
    } catch {
      setNote("Couldn't search right now.");
    }
    setLoading(false);
  };

  return (
    <div className="screen-in hh-page">
      <section className="travel-hero hh-pattern">
        <div className="hh-wrap">
          <span className="eyebrow" style={{ color: "#cfe0da" }}>Halal travel</span>
          <h1>Muslim-friendly hotels, worldwide</h1>
          <p className="sub">Find hotels with prayer rooms, halal dining nearby and alcohol-free options — from Umrah stays near the Haramain to family trips across Asia.</p>
          <form className="travel-search" onSubmit={submit}>
            <div className="field">
              <label htmlFor="t-city">Destination</label>
              <select id="t-city" value={city} onChange={(e) => setCity(e.target.value)}>
                {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}, {c.country}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="t-in">Check-in</label>
              <input id="t-in" type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="t-out">Check-out</label>
              <input id="t-out" type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="t-adults">Guests</label>
              <select id="t-adults" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} adult{n > 1 ? "s" : ""}</option>)}
              </select>
            </div>
            <div className="field field-go">
              <label aria-hidden>&nbsp;</label>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Searching…" : "Search"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <div className="hh-wrap hh-section">
        {note ? <p className="muted" style={{ marginBottom: 14 }}>{note}</p> : null}
        {results && results.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.35rem", marginBottom: 14 }}>Hotels — most Muslim-friendly first</h2>
            <div className="hotel-grid" style={{ marginBottom: 36 }}>
              {results.map((h) => <HotelCard key={h.id} hotel={h} />)}
            </div>
          </>
        )}

        <h2 style={{ fontSize: "1.35rem", marginBottom: 6 }}>Browse destinations</h2>
        <p className="muted" style={{ marginBottom: 16 }}>Curated halal-travel guides with Muslim-friendly hotels in each city.</p>
        <div className="hub-grid">
          {cities.map((c) => (
            <Link key={c.slug} href={`/travel/${c.slug}`} className="hub-card">
              <span className="city">{c.name}</span>
              <span className="country">{c.country}</span>
              {c.umrah ? <span className="umrah-tag">Umrah</span> : null}
            </Link>
          ))}
        </div>

        <p className="travel-disclaimer" style={{ marginTop: 26 }}>
          Humble Halal is a discovery platform, not a certifier. Muslim-friendly facilities are derived from each hotel's
          own information and, where marked, verified by our team — always confirm specific halal requirements with the hotel.
        </p>
      </div>
    </div>
  );
}

/* ── city hub ────────────────────────────────────────────────────────────── */

export function TravelCityScreen({ hub, hotels, faq, related }: { hub: TravelHub; hotels: Hotel[]; faq: QA[]; related: TravelHub[] }) {
  const [view, setView] = useState<"list" | "map">("list");
  const [open, setOpen] = useState<number | null>(0);
  const points = hotels.filter((h) => h.coords).map((h) => ({ id: h.id, name: h.name, coords: h.coords! }));

  return (
    <div className="screen-in hh-page">
      <section className="travel-hero hh-pattern">
        <div className="hh-wrap">
          <nav className="muted" style={{ fontSize: ".84rem", color: "#cfe0da" }}>
            <Link href="/travel" style={{ color: "#cfe0da" }}>Travel</Link> · {hub.name}
          </nav>
          <h1>{hub.h1}</h1>
          <p className="sub">{hub.blurb}</p>
        </div>
      </section>

      <div className="hh-wrap hh-section">
        <div className="flex between center" style={{ marginBottom: 16, gap: 10, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "1.3rem" }}>{hotels.length ? `${hotels.length} Muslim-friendly hotels` : `Hotels in ${hub.name}`}</h2>
          {points.length > 0 && (
            <div className="flex g6">
              <button className={`chip ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>List</button>
              <button className={`chip ${view === "map" ? "active" : ""}`} onClick={() => setView("map")}>Map</button>
            </div>
          )}
        </div>

        {hotels.length === 0 ? (
          <Empty icon="bed" title="Live hotels loading" body="Hotel availability for this city will appear here. Use the search on the Travel home to check live rates." />
        ) : view === "map" && points.length ? (
          <div style={{ height: 460, borderRadius: "var(--r-lg)", overflow: "hidden" }}>
            <MapView center={hub.coords} zoom={12} points={points} />
          </div>
        ) : (
          <div className="hotel-grid">
            {hotels.map((h) => <HotelCard key={h.id} hotel={h} />)}
          </div>
        )}

        {faq.length > 0 && (
          <section className="travel-faq" style={{ marginTop: 40, maxWidth: 760 }}>
            <h2 style={{ fontSize: "1.3rem", marginBottom: 8 }}>Frequently asked</h2>
            {faq.map((f, i) => (
              <div key={i} className="faq-item">
                <div className="faq-q" onClick={() => setOpen(open === i ? null : i)}>
                  {f.q} <Icon name={open === i ? "minus" : "plus"} size={16} />
                </div>
                {open === i && <div className="faq-a">{f.a}</div>}
              </div>
            ))}
          </section>
        )}

        {related.length > 0 && (
          <section style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: 14 }}>Other destinations</h2>
            <div className="hub-grid">
              {related.map((c) => (
                <Link key={c.slug} href={`/travel/${c.slug}`} className="hub-card">
                  <span className="city">{c.name}</span>
                  <span className="country">{c.country}</span>
                  {c.umrah ? <span className="umrah-tag">Umrah</span> : null}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ── hotel detail ────────────────────────────────────────────────────────── */

export function TravelHotelScreen({ hotel, images, offers, bookingEnabled }: { hotel: Hotel; images: string[]; offers: RateOffer[]; bookingEnabled: boolean }) {
  const flags = activeFlagLabels(hotel.flags);
  const gallery = images.slice(0, 5);

  return (
    <div className="screen-in hh-page">
      <div className="hh-wrap hh-section">
        <nav className="muted" style={{ fontSize: ".84rem", marginBottom: 12 }}>
          <Link href="/travel">Travel</Link>{hotel.city ? <> · {hotel.city}</> : null} · {hotel.name}
        </nav>

        {gallery.length > 0 && (
          <div className="travel-gallery" style={{ marginBottom: 18 }}>
            {gallery.map((src, i) => <img key={i} src={src} alt={`${hotel.name} ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} />)}
          </div>
        )}

        <div className="flex between center wrap g10" style={{ marginBottom: 6 }}>
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem,3vw,2rem)" }}>{hotel.name}</h1>
            <div className="hotel-meta" style={{ marginTop: 6 }}>
              {hotel.stars ? <span className="hotel-stars">{"★".repeat(Math.round(hotel.stars))}</span> : null}
              {hotel.guestRating ? <span>{hotel.guestRating}/10{hotel.reviewCount ? ` · ${hotel.reviewCount} reviews` : ""}</span> : null}
              {hotel.address ? <span>· {hotel.address}</span> : null}
            </div>
          </div>
          <ScoreBadge hotel={hotel} />
        </div>

        {!hotel.verified && (
          <p className="halal-unverified" style={{ marginBottom: 14 }}>
            Muslim-friendly facilities below are derived from the hotel's own information and not yet verified by our team.
          </p>
        )}

        {flags.length > 0 && (
          <div className="halal-flags" style={{ marginBottom: 18 }}>
            {flags.map((l) => <span key={l} className="halal-flag"><Icon name="check" size={13} /> {l}</span>)}
          </div>
        )}

        {hotel.description && <p className="muted" style={{ maxWidth: 760, lineHeight: 1.6, marginBottom: 22 }}>{hotel.description}</p>}

        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.2rem", marginBottom: 10 }}>Rooms &amp; rates</h2>
          {offers.length === 0 ? (
            <p className="muted">Live rates aren't available for the selected dates. Try the search on the Travel home.</p>
          ) : (
            <div className="card" style={{ overflow: "hidden" }}>
              <table className="rates-table">
                <thead><tr><th>Room</th><th>Refundable</th><th>Price</th><th></th></tr></thead>
                <tbody>
                  {offers.slice(0, 12).map((o) => (
                    <tr key={o.offerId}>
                      <td>{o.name}</td>
                      <td>{o.refundable ? <span className="halal-flag" style={{ background: "var(--emerald-50)" }}>Refundable</span> : <span className="muted">Non-refundable</span>}</td>
                      <td className="rate-price">{o.price != null ? `${o.currency || ""} ${Math.round(o.price)}` : "—"}</td>
                      <td>
                        {bookingEnabled ? (
                          <Link className="btn btn-primary btn-sm" href={`/travel/booking?offerId=${encodeURIComponent(o.offerId)}&hotelId=${encodeURIComponent(hotel.id)}`}>Book</Link>
                        ) : (
                          <Link className="btn btn-soft btn-sm" href="/quotes?category=travel">Enquire</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!bookingEnabled && <p className="muted" style={{ fontSize: ".84rem", marginTop: 10 }}>Online booking is opening soon — enquire and we'll help you book.</p>}
        </section>

        {hotel.coords && (
          <section style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: "1.2rem", marginBottom: 10 }}>Location</h2>
            <div style={{ height: 320, borderRadius: "var(--r-lg)", overflow: "hidden" }}>
              <MapView center={hotel.coords} zoom={14} points={[{ id: hotel.id, name: hotel.name, coords: hotel.coords }]} />
            </div>
          </section>
        )}

        <p className="travel-disclaimer" style={{ marginTop: 20 }}>
          Humble Halal is a discovery platform, not a certifier. Confirm specific halal requirements (kitchen, dining, facilities)
          directly with the hotel before booking.
        </p>
      </div>
    </div>
  );
}

/* ── booking (Phase 2 — minimal shell; gated) ────────────────────────────── */

export function TravelBookingScreen({ bookingEnabled }: { bookingEnabled: boolean }) {
  return (
    <div className="screen-in hh-page">
      <div className="hh-wrap hh-section" style={{ maxWidth: 640 }}>
        <h1 style={{ fontSize: "1.6rem", marginBottom: 10 }}>Booking</h1>
        {bookingEnabled ? (
          <p className="muted">Secure checkout is handled by LiteAPI. Complete payment to confirm your stay.</p>
        ) : (
          <Empty icon="bed" title="Online booking opening soon" body="We're finishing secure checkout. In the meantime, enquire and our team will help you book." />
        )}
        {!bookingEnabled && <Link className="btn btn-primary" href="/quotes?category=travel" style={{ marginTop: 14 }}>Enquire about this stay</Link>}
      </div>
    </div>
  );
}

export function TravelConfirmationScreen() {
  return (
    <div className="screen-in hh-page">
      <div className="hh-wrap hh-section" style={{ maxWidth: 640, textAlign: "center" }}>
        <div className="empty-ico" style={{ margin: "0 auto" }}><Icon name="check" size={28} /></div>
        <h1 style={{ fontSize: "1.6rem", marginTop: 14 }}>Booking confirmed</h1>
        <p className="muted" style={{ marginTop: 8 }}>Your voucher and confirmation have been sent to your email.</p>
        <Link className="btn btn-primary" href="/travel" style={{ marginTop: 18 }}>Back to travel</Link>
      </div>
    </div>
  );
}
