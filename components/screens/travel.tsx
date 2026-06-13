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
  type HotelReview,
  type RateOffer,
} from "@/lib/halal-hotels";
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

/* ── landing + search ────────────────────────────────────────────────────── */

export function TravelScreen({ cities }: { cities: TravelHub[] }) {
  const today = new Date();
  const [city, setCity] = useState(cities[0]?.slug || "");
  const [checkin, setCheckin] = useState(fmtDate(new Date(today.getTime() + 30 * 864e5)));
  const [checkout, setCheckout] = useState(fmtDate(new Date(today.getTime() + 32 * 864e5)));
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
        body: JSON.stringify({ cityName: c.cityName, countryCode: c.countryCode, checkin, checkout, currency: c.currency, guestNationality: "SG", occupancies: [{ adults }], limit: 24 }),
      });
      const data = await res.json();
      if (data.ok) {
        setResults(data.hotels as Hotel[]);
        if (data.simulated) setNote("Live rates aren't connected yet — browse destinations below.");
        else if (!data.hotels.length) setNote("No hotels found for those dates. Try another city or dates.");
      } else setNote(data.error || "Couldn't search right now.");
    } catch {
      setNote("Couldn't search right now.");
    }
    setLoading(false);
  };

  return (
    <div className="screen-in hh-page">
      <Crumbs trail={[{ label: "Home", href: "/" }, { label: "Travel" }]} />
      <section className="travel-hero hh-pattern">
        <div className="hh-wrap">
          <span className="eyebrow" style={{ color: "#cfe0da" }}>Halal travel</span>
          <h1>Muslim-friendly hotels, worldwide</h1>
          <p className="sub">Prayer rooms, halal dining nearby and alcohol-free stays — from Umrah hotels by the Haramain to family trips across Asia.</p>
          <form className="travel-search" onSubmit={submit}>
            <div className="field">
              <label htmlFor="t-city">Destination</label>
              <select id="t-city" value={city} onChange={(e) => setCity(e.target.value)}>
                {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}, {c.country}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="t-in">Check-in</label><input id="t-in" type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} /></div>
            <div className="field"><label htmlFor="t-out">Check-out</label><input id="t-out" type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} /></div>
            <div className="field"><label htmlFor="t-adults">Guests</label>
              <select id="t-adults" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} adult{n > 1 ? "s" : ""}</option>)}</select>
            </div>
            <div className="field field-go"><label aria-hidden>&nbsp;</label><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Searching…" : "Search hotels"}</button></div>
          </form>
        </div>
      </section>

      <div className="hh-wrap hh-section">
        {note ? <p className="muted" style={{ marginBottom: 14 }}>{note}</p> : null}
        {results && results.length > 0 && (
          <>
            <div className="flex between center" style={{ marginBottom: 14 }}>
              <h2 style={{ fontSize: "1.35rem" }}>{results.length} hotels</h2>
              <span className="muted" style={{ fontSize: ".86rem" }}>Most Muslim-friendly first</span>
            </div>
            <div className="hotel-grid" style={{ marginBottom: 40 }}>{results.map((h) => <HotelCard key={h.id} hotel={h} />)}</div>
          </>
        )}

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

export function TravelCityScreen({ hub, hotels, faq, related }: { hub: TravelHub; hotels: Hotel[]; faq: QA[]; related: TravelHub[] }) {
  const [view, setView] = useState<"list" | "map">("list");
  const [open, setOpen] = useState<number | null>(0);
  const points = hotels.filter((h) => h.coords).map((h) => ({ id: h.id, name: h.name, coords: h.coords! }));

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
        <div className="flex between center" style={{ marginBottom: 16, gap: 10, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "1.3rem" }}>{hotels.length ? `${hotels.length} Muslim-friendly hotels in ${hub.name}` : `Hotels in ${hub.name}`}</h2>
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
          <div className="travel-map"><MapView center={hub.coords} zoom={12} points={points} /></div>
        ) : (
          <div className="hotel-grid">{hotels.map((h) => <HotelCard key={h.id} hotel={h} />)}</div>
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
export function TravelHotelScreen({ hotel, images, offers, reviews, mosques, halalFood, bookingEnabled }: { hotel: Hotel; images: string[]; offers: RateOffer[]; reviews: HotelReview[]; mosques: NearPlace[]; halalFood: NearPlace[]; bookingEnabled: boolean }) {
  const flags = activeFlagLabels(hotel.flags);
  const gallery = images.slice(0, 5);
  const cheapest = offers.filter((o) => o.price != null).sort((a, b) => (a.price! - b.price!))[0];
  const ctaHref = (o: RateOffer) =>
    `/travel/booking?offerId=${encodeURIComponent(o.offerId)}&hotelId=${encodeURIComponent(hotel.id)}&hotel=${encodeURIComponent(hotel.name)}&city=${encodeURIComponent(hotel.city || "")}`;

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
          <div className="travel-gallery" style={{ marginBottom: 18 }}>
            {gallery.map((src, i) => <img key={i} src={src} alt={`${hotel.name} ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} />)}
          </div>
        )}

        <div className="hotel-detail-grid">
          <div>
            <div className="flex g10 center wrap" style={{ marginBottom: 4 }}>
              <Stars n={hotel.stars} />
              <HalalChip hotel={hotel} />
            </div>
            <h1 style={{ fontSize: "clamp(1.5rem,3vw,2.1rem)" }}>{hotel.name}</h1>
            <div className="loc" style={{ margin: "6px 0 14px" }}><Icon name="pin" size={14} /> {hotel.address || hotel.city}{hotel.country ? `, ${countryLabel(hotel.country)}` : ""}</div>

            {hotel.guestRating ? (
              <div className="rating-block">
                <RatingBadge score={hotel.guestRating} count={hotel.reviewCount} size="lg" />
              </div>
            ) : null}

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

            {hotel.amenities && hotel.amenities.length > 0 && (
              <section style={{ marginBottom: 26 }}>
                <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Amenities</h2>
                <div className="amenity-grid">{hotel.amenities.map((a) => <span key={a} className="amenity"><Icon name="check" size={14} /> {a}</span>)}</div>
              </section>
            )}

            <section id="rooms" style={{ marginBottom: 26 }}>
              <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Choose your room</h2>
              {offers.length === 0 ? (
                <p className="muted">Live rates aren't available for the selected dates. Try the search on the Travel home.</p>
              ) : (
                <div className="rooms-list">
                  {offers.slice(0, 12).map((o) => (
                    <div key={o.offerId} className="room-row">
                      <div className="room-info">
                        <div className="room-name">{o.name}</div>
                        <div className="room-tags">
                          {o.refundable ? <span className="tag-good"><Icon name="check" size={12} /> Free cancellation</span> : <span className="muted" style={{ fontSize: ".82rem" }}>Non-refundable</span>}
                        </div>
                      </div>
                      <div className="room-cta">
                        {o.price != null ? <div className="room-price">{o.currency || ""} {Math.round(o.price)}<small>total</small></div> : null}
                        {bookingEnabled ? (
                          <Link className="btn btn-primary btn-sm" href={ctaHref(o)}>Reserve</Link>
                        ) : (
                          <Link className="btn btn-soft btn-sm" href="/quotes?category=travel">Enquire</Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!bookingEnabled && <p className="muted" style={{ fontSize: ".84rem", marginTop: 10 }}>Online booking is opening soon — enquire and we'll help you book.</p>}
            </section>

            {reviews.length > 0 && (
              <section style={{ marginBottom: 26 }}>
                <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Guest reviews</h2>
                <div className="reviews-grid">
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
              <section style={{ marginBottom: 12 }}>
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
        <Link className="btn btn-primary" href="/travel">Back to travel</Link>
      </div>
    </div>
  );
}
