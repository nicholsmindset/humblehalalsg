"use client";

/* Humble Halal — hotel detail (the showcase). zzzello-grade gallery + sticky
   scrollspy tabs + reserve rail, with the halal moat kept prominent: Smart
   Highlights, prayer/qibla/weather cards, nearby mosques & halal food, the map,
   room table and Ask-AI. Booking gated by PAID_HOTELS_ENABLED (bookingEnabled). */
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { isUnoptimizedImageSrc } from "@/lib/img";
import { Icon } from "../../ui";
import { ImageGallery, StickyTabs, RatingBadge, Stars, AiAnswer, Skeleton } from "../../ota";
import { MapView } from "../../map/map-view";
import {
  activeFlagLabels,
  ratingWord,
  scoreBreakdown,
  type Hotel,
  type HotelReview,
  type HotelSentiment,
  type RateOffer,
  type RoomGroup,
} from "@/lib/halal-hotels";
import { compassLabel } from "@/lib/qibla";
import { nearestHaram } from "@/lib/haversine";
import type { PrayerTimesResult } from "@/lib/prayer";
import { Crumbs, HalalChip, countryLabel, dist } from "./shared";
import type { Highlight, NearPlace, WxDay } from "./types";

/* ── Ask AI about this hotel (gold beta + emerald callout) ─────────────────── */

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
      <h2 style={{ fontSize: "1.2rem" }}>Ask about this hotel <span className="aa-beta"><Icon name="sparkles" size={12} /> Ask AI · Beta</span></h2>
      <p className="muted" style={{ fontSize: ".86rem", marginTop: 4 }}>Instant answers from the hotel&apos;s own information — ask about prayer rooms, halal food, alcohol policy and more.</p>
      <div className="aa-suggest">{suggestions.map((s) => <button key={s} type="button" className="aa-chip" onClick={() => { setQ(s); ask(s); }}>{s}</button>)}</div>
      <form className="aa-form" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask anything about this hotel…" aria-label="Ask a question about this hotel" />
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Asking…" : "Ask"}</button>
      </form>
      {answer && <AiAnswer>{answer}</AiAnswer>}
    </div>
  );
}

/* ── Smart Highlights (grounded; never empty) ─────────────────────────────── */

function SmartHighlights({ hotelId }: { hotelId: string }) {
  const [items, setItems] = useState<Highlight[] | null>(null);
  useEffect(() => {
    let on = true;
    fetch("/api/travel/highlights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hotelId }) })
      .then((r) => r.json())
      .then((d) => { if (on) setItems(Array.isArray(d.highlights) ? (d.highlights as Highlight[]) : []); })
      .catch(() => { if (on) setItems([]); });
    return () => { on = false; };
  }, [hotelId]);

  if (items && items.length === 0) return null;
  return (
    <section style={{ margin: "20px 0 6px" }}>
      <div className="ota-highlights-head">
        <Icon name="sparkles" size={16} /> <h3>Why Muslim travellers pick this stay</h3>
      </div>
      <div className="ota-highlights">
        {items == null
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="ota-highlight"><div className="ota-highlight-inner"><Skeleton w={36} h={36} r={10} /><Skeleton w="80%" h={14} style={{ marginTop: 8 }} /><Skeleton w="100%" h={12} style={{ marginTop: 6 }} /></div></div>
            ))
          : items.slice(0, 4).map((h, i) => (
              <div key={i} className="ota-highlight">
                <div className="ota-highlight-inner">
                  <span className="ota-hl-ico"><Icon name={h.icon} size={18} /></span>
                  <strong>{h.title}</strong>
                  <p>{h.blurb}</p>
                </div>
              </div>
            ))}
      </div>
    </section>
  );
}

/* ── Muslim moat cards ────────────────────────────────────────────────────── */

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

function WeatherCard({ coords }: { coords: { lat: number; lng: number } }) {
  const [days, setDays] = useState<WxDay[] | null>(null);
  useEffect(() => {
    let on = true;
    fetch(`/api/travel/weather?lat=${coords.lat}&lng=${coords.lng}`).then((r) => r.json()).then((d) => { if (on && d.ok && Array.isArray(d.days)) setDays(d.days); }).catch(() => {});
    return () => { on = false; };
  }, [coords.lat, coords.lng]);
  if (!days || days.length === 0) return null;
  return (
    <div className="muslim-card weather-card">
      <h3 className="muslim-card-h"><Icon name="sun" size={15} /> Weather forecast</h3>
      <div className="weather-row">
        {days.slice(0, 6).map((d) => (
          <div key={d.date} className="weather-cell">
            <span className="wd">{new Date(d.date + "T00:00:00").toLocaleDateString("en", { weekday: "short" })}</span>
            <span className="wt">{d.tempMax != null ? `${Math.round(d.tempMax)}°` : "—"}</span>
            <span className="wl">{d.tempMin != null ? `${Math.round(d.tempMin)}°` : ""}</span>
            {d.precipitation ? <span className="wp">{Math.round(d.precipitation)}mm</span> : <span className="wp dry">·</span>}
          </div>
        ))}
      </div>
      <p className="muslim-card-f">Forecast to help plan your trip · °C</p>
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

/* ── "Why this score?" — make the halal score legible (base + each flag) ──── */

function ScoreExplainer({ hotel }: { hotel: Hotel }) {
  const b = scoreBreakdown(hotel.flags);
  if (b.items.length === 0) return null; // nothing to break down → don't tease an empty score
  return (
    <details className="score-why">
      <summary>
        <span className="score-why-q"><Icon name="crescent" size={13} /> Why this Muslim-friendly score?</span>
        <span className="score-why-num">{hotel.halalScore}<small>/100</small></span>
      </summary>
      <div className="score-why-body">
        <div className="score-why-row"><span>Starting score</span><span>+{b.base}</span></div>
        {b.items.map((it) => (
          <div key={it.label} className="score-why-row"><span><Icon name="check" size={12} /> {it.label}</span><span>+{it.points}</span></div>
        ))}
        <div className="score-why-row total"><span>Total</span><span>{b.total}/100</span></div>
        <p className="muted">
          {hotel.verified
            ? "Verified by the Humble Halal team."
            : "Provisional — derived from the property’s own information and not yet verified by our team. We never assert halal certification automatically."}
        </p>
      </div>
    </details>
  );
}

/* ── room group with photo lightbox ──────────────────────────────────────── */

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
      {/* eslint-disable-next-line @next/next/no-img-element */}
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
            <Image src={photos[pi % photos.length]} alt={group.name} fill sizes="(max-width: 720px) 100vw, 360px" unoptimized={isUnoptimizedImageSrc(photos[pi % photos.length])} onClick={() => setZoom(true)} style={{ objectFit: "cover", cursor: "zoom-in" }} />
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

/* ── hotel detail screen ─────────────────────────────────────────────────── */

export function TravelHotelScreen({ hotel, images, offers, roomGroups, reviews, mosques, halalFood, prayer, sentiment, qibla, bookingEnabled }: { hotel: Hotel; images: string[]; offers: RateOffer[]; roomGroups: RoomGroup[]; reviews: HotelReview[]; mosques: NearPlace[]; halalFood: NearPlace[]; prayer: PrayerTimesResult | null; sentiment: HotelSentiment | null; qibla: number | null; bookingEnabled: boolean }) {
  const [saved, setSaved] = useState(false);
  const flags = activeFlagLabels(hotel.flags);
  const haram = hotel.coords ? nearestHaram(hotel.coords) : null; // live "X to the Haram" for Umrah stays
  const allOptionPrices = roomGroups.flatMap((g) => g.options).filter((o) => o.price != null);
  const cheapestOpt = allOptionPrices.sort((a, b) => a.price! - b.price!)[0];
  const cheapestFlat = offers.filter((o) => o.price != null).sort((a, b) => a.price! - b.price!)[0];
  const cheapest = cheapestOpt
    ? { price: cheapestOpt.price!, currency: cheapestOpt.currency }
    : cheapestFlat
      ? { price: cheapestFlat.price!, currency: cheapestFlat.currency }
      : null;

  const hasReviews = reviews.length > 0 || !!sentiment;
  const hasFacilities = !!(hotel.amenities && hotel.amenities.length > 0);
  const hasDesc = !!(hotel.descriptionHtml || hotel.description);
  const tabs = [
    { id: "overview", label: "Overview" },
    ...(hasFacilities ? [{ id: "facilities", label: "Facilities" }] : []),
    { id: "rooms", label: "Rooms" },
    ...(hasReviews ? [{ id: "reviews", label: "Reviews" }] : []),
    ...(hasDesc ? [{ id: "description", label: "Description" }] : []),
    { id: "ask-ai", label: "Ask AI", ai: true },
  ];

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

      <div className="hh-wrap hh-section" style={{ paddingBottom: 6 }}>
        {/* title row */}
        <div className="hotel-head">
          <div>
            <Link href="/travel" className="hotel-back"><Icon name="back" size={15} /> See all properties</Link>
            <div className="flex g10 center wrap" style={{ margin: "8px 0 4px" }}>
              <Stars count={hotel.stars || 0} />
              <HalalChip hotel={hotel} />
            </div>
            <h1 style={{ fontSize: "clamp(1.5rem,3vw,2.1rem)", margin: 0 }}>{hotel.name}</h1>
            <div className="loc" style={{ margin: "6px 0 0" }}>
              <Icon name="pin" size={14} /> {hotel.address || hotel.city}{hotel.country ? `, ${countryLabel(hotel.country)}` : ""}
              {hotel.coords ? <> · <a href="#location" className="link">Show map</a></> : null}
            </div>
            {haram && (
              <div className="haram-distance" title={`Straight-line distance to ${haram.haram.name}`}>
                <Icon name="crescent" size={14} /> <strong>{dist(haram.distanceM)}</strong> to {haram.haram.name}
                <span className="haram-distance-note">· walking distance varies</span>
              </div>
            )}
          </div>
          <button type="button" className={`hotel-save ${saved ? "on" : ""}`} aria-pressed={saved} onClick={() => setSaved((s) => !s)}>
            <Icon name="heart" size={16} /> {saved ? "Saved" : "Save"}
          </button>
        </div>

        {images.length > 0 && <div style={{ marginTop: 14 }}><ImageGallery images={images} alt={hotel.name} /></div>}
      </div>

      <StickyTabs tabs={tabs} />

      <div className="hh-wrap hh-section">
        <div className="hotel-detail-grid">
          <div>
            <div id="overview" style={{ scrollMarginTop: 70 }}>
              {hotel.guestRating ? <div className="rating-block"><RatingBadge score={hotel.guestRating} count={hotel.reviewCount} word={ratingWord(hotel.guestRating)} lg /></div> : null}

              <SmartHighlights hotelId={hotel.id} />

              {!hotel.verified && flags.length > 0 && (
                <p className="halal-unverified" style={{ marginTop: 14 }}>Muslim-friendly facilities below are derived from the hotel&apos;s own information and not yet verified by our team.</p>
              )}
              {flags.length > 0 && (
                <div className="halal-flags lg" style={{ margin: "14px 0" }}>{flags.map((l) => <span key={l} className="halal-flag"><Icon name="check" size={13} /> {l}</span>)}</div>
              )}

              <ScoreExplainer hotel={hotel} />

              {flags.length > 0 && (
                <p className="muslim-note">
                  <Icon name="moon" size={14} /> For Muslim travellers, this stay highlights {flags.slice(0, 3).map((l) => l.toLowerCase()).join(", ")}{flags.length > 3 ? " and more" : ""}. Below you&apos;ll find today&apos;s prayer times, the qibla direction and the nearest mosques &amp; halal dining. Specifics — such as whether breakfast is halal, the prayer-room location and the alcohol policy — vary by property, so please confirm directly with the hotel before booking.
                </p>
              )}
            </div>

            {/* the moat — between overview and rooms */}
            {(prayer || qibla != null || hotel.coords) && (
              <div className="muslim-cards" style={{ marginBottom: 26 }}>
                {prayer && <PrayerCard prayer={prayer} />}
                {qibla != null && <QiblaCard qibla={qibla} />}
                {hotel.coords && <WeatherCard coords={hotel.coords} />}
              </div>
            )}

            {(mosques.length > 0 || halalFood.length > 0) && (
              <section style={{ marginBottom: 26 }}>
                <h2 style={{ fontSize: "1.2rem", marginBottom: 4 }}>What&apos;s nearby</h2>
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
              <section id="location" style={{ marginBottom: 26, scrollMarginTop: 70 }}>
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

            {hasFacilities && (
              <section id="facilities" style={{ marginBottom: 26, scrollMarginTop: 70 }}>
                <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Facilities</h2>
                <div className="amenity-grid">{hotel.amenities!.map((a) => <span key={a} className="amenity"><Icon name="check" size={14} /> {a}</span>)}</div>
              </section>
            )}

            <section id="rooms" style={{ marginBottom: 26, scrollMarginTop: 70 }}>
              <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Choose your room</h2>
              {roomGroups.length > 0 ? (
                <div className="room-cards">{roomGroups.map((g) => <RoomGroupCard key={g.name} group={g} hotel={hotel} bookingEnabled={bookingEnabled} />)}</div>
              ) : (
                <p className="muted">Live rates aren&apos;t available for the selected dates. Try the search on the Travel home.</p>
              )}
              {!bookingEnabled && roomGroups.length > 0 && <p className="muted" style={{ fontSize: ".84rem", marginTop: 10 }}>Online booking is opening soon — enquire and we&apos;ll help you book.</p>}
            </section>

            {hasReviews && (
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

            {hasDesc && (
              <section id="description" style={{ marginBottom: 26, scrollMarginTop: 70 }}>
                <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>About this property</h2>
                {hotel.descriptionHtml ? (
                  <div className="hotel-desc" dangerouslySetInnerHTML={{ __html: hotel.descriptionHtml }} />
                ) : (
                  <p className="hotel-desc">{hotel.description}</p>
                )}
              </section>
            )}

            <section id="ask-ai" style={{ marginBottom: 26, scrollMarginTop: 70 }}>
              <AskHotel hotelId={hotel.id} />
            </section>
          </div>

          {/* sticky reserve box */}
          <aside className="reserve-box">
            <div className="card" style={{ padding: 18 }}>
              {hotel.guestRating ? <RatingBadge score={hotel.guestRating} count={hotel.reviewCount} word={ratingWord(hotel.guestRating)} /> : null}
              {cheapest?.price != null ? (
                <div style={{ margin: "12px 0" }}>
                  <div className="muted" style={{ fontSize: ".8rem" }}>From</div>
                  <div className="reserve-price">{cheapest.currency || ""} {Math.round(cheapest.price)}<small> / night · incl. taxes</small></div>
                </div>
              ) : <p className="muted" style={{ fontSize: ".88rem", margin: "10px 0" }}>Check live rates from the Travel home.</p>}
              <HalalChip hotel={hotel} />
              {cheapest && (bookingEnabled ? (
                <a className="btn btn-primary btn-block" href="#rooms" style={{ marginTop: 14 }}>Select rooms</a>
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
