"use client";

/* Humble Halal — flights vertical (v2): round-trip search, Best/Cheapest/Fastest
   sort, a filter rail, rich itinerary cards and a 3-step booking flow (Passenger
   → Seats & Bags → Review & Pay) with a price-hold countdown. zzzello-depth in
   Humble Halal styling. Booking is gated by PAID_FLIGHTS_ENABLED — until then the
   Select CTA degrades to enquiry. */
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon, Empty, RewardsNote, PromoCode } from "../ui";
import { fmtDuration, fmtTime, sortItineraries, type FlightItinerary, type FlightLeg } from "@/lib/flights";
import { searchLocalAirports, nearbyAirports } from "@/lib/airports";
import { COUNTRIES, flagEmoji } from "@/lib/countries";
import { estimateCO2 } from "@/lib/carbon";
import { airportAmenity, PRAYER_LAYOVER_MIN, type AirportAmenity } from "@/lib/airport-amenities";
import { airlineMeal } from "@/lib/airline-meals";
import { qiblaBearing, compassLabel } from "@/lib/qibla";
import { formatHijri, hijriSeason } from "@/lib/hijri";

/* layover stops within a leg (connection airports + how long the wait is) */
function legLayovers(leg: FlightLeg): { iata: string; durationMin: number; amenity?: AirportAmenity }[] {
  const out: { iata: string; durationMin: number; amenity?: AirportAmenity }[] = [];
  for (let i = 0; i < leg.segments.length - 1; i++) {
    const a = leg.segments[i];
    const b = leg.segments[i + 1];
    const wait = a.arriveISO && b.departISO ? Math.max(0, Math.round((Date.parse(b.departISO) - Date.parse(a.arriveISO)) / 60000)) : 0;
    out.push({ iata: a.to, durationMin: wait, amenity: airportAmenity(a.to) });
  }
  return out;
}

interface Airport { iata: string; name: string; city: string; country: string }

/* ── airport autocomplete (instant local + merged live) ───────────────────── */
function AirportInput({ label, value, onPick, placeholder }: { label: string; value: Airport | null; onPick: (a: Airport | null) => void; placeholder: string }) {
  const [q, setQ] = useState(value ? `${value.city} (${value.iata})` : "");
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Airport[]>([]);

  // reflect an externally-set airport (Umrah preset / programmatic) in the box,
  // but not the bare 3-letter auto-pick (city === "") so typing isn't disturbed
  useEffect(() => { if (value && value.city) { setQ(`${value.city} (${value.iata})`); setOpen(false); } }, [value?.iata, value?.city]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setList([]); return; }
    // instant local seed so the dropdown is never empty
    setList(searchLocalAirports(term, 7).map((a) => ({ iata: a.iata, name: a.name, city: a.city, country: a.country })));
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/travel/flights/airports?q=${encodeURIComponent(term)}`);
        const d = await r.json();
        if (d.ok && Array.isArray(d.airports) && d.airports.length) setList(d.airports);
      } catch { /* keep local */ }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const choose = (a: Airport) => { onPick(a); setQ(`${a.city || a.name} (${a.iata})`); setOpen(false); };

  return (
    <div className="field">
      <label>{label}</label>
      <div className="ac">
        <input
          value={q}
          placeholder={placeholder}
          onChange={(e) => {
            const v = e.target.value; setQ(v); setOpen(true); onPick(null);
            if (/^[A-Za-z]{3}$/.test(v.trim())) onPick({ iata: v.trim().toUpperCase(), name: v.trim().toUpperCase(), city: "", country: "" });
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
        />
        {open && list.length > 0 && (
          <div className="ac-list">
            {list.map((a) => (
              <button key={a.iata} type="button" className="ac-item" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(a)}>
                <Icon name="plane" size={13} /> <span>{a.city || a.name} ({a.iata})<small> · {a.name}{a.country ? `, ${a.country}` : ""}</small></span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── card pieces ──────────────────────────────────────────────────────────── */
function dayChange(leg: FlightLeg): number {
  const a = leg.segments[leg.segments.length - 1]?.arriveISO?.slice(0, 10);
  const d = leg.segments[0]?.departISO?.slice(0, 10);
  if (!a || !d) return 0;
  return Math.round((Date.parse(a) - Date.parse(d)) / 86400000);
}

function LegRow({ leg, label }: { leg: FlightLeg; label: string }) {
  const first = leg.segments[0];
  const last = leg.segments[leg.segments.length - 1];
  const dc = dayChange(leg);
  return (
    <div className="flt-leg">
      <span className="flt-leg-label">{label}</span>
      <div className="flt-leg-row">
        <div className="flt-end"><div className="flt-time">{fmtTime(first.departISO)}</div><div className="flt-code">{first.from}</div></div>
        <div className="flt-mid">
          <div className="flt-dur">{fmtDuration(leg.durationMin)}</div>
          <div className="flt-line"><span /></div>
          <div className={`flt-stops ${leg.stops === 0 ? "direct" : ""}`}>{leg.stops === 0 ? "Direct" : `${leg.stops} stop${leg.stops > 1 ? "s" : ""}`}</div>
        </div>
        <div className="flt-end">
          <div className="flt-time">{fmtTime(last.arriveISO)}{dc > 0 && <sup className="flt-plus">+{dc}</sup>}</div>
          <div className="flt-code">{last.to}</div>
        </div>
      </div>
    </div>
  );
}

function ItineraryCard({ it, bookingEnabled, adults }: { it: FlightItinerary; bookingEnabled: boolean; adults: number }) {
  const [open, setOpen] = useState(false);
  const out = it.legs[0];
  const ret = it.legs[1];
  const lead = out.segments[0];
  const meal = airlineMeal(lead.carrierCode);
  const prayerLayovers = it.legs.flatMap(legLayovers).filter((l) => l.amenity?.prayerRoom);
  const dest = airportAmenity(out.segments[out.segments.length - 1].to);
  const bookHref = (() => {
    const last = out.segments[out.segments.length - 1];
    const p = new URLSearchParams({ offerId: it.offerId, from: lead.from, to: last.to, date: lead.departISO.slice(0, 10), price: String(it.price ?? ""), currency: it.currency ?? "USD", adults: String(adults) });
    if (ret) { p.set("rt", "1"); p.set("rdate", ret.segments[0].departISO.slice(0, 10)); }
    return `/travel/flights/booking?${p.toString()}`;
  })();

  return (
    <div className="flt-card">
      <div className="flt-card-main">
        <div className="flt-airline">
          {lead.carrierLogo ? <img src={lead.carrierLogo} alt={lead.carrierName} /> : <span className="flt-airline-ph"><Icon name="plane" size={16} /></span>}
          <div><div className="flt-airline-name">{it.carriers.join(", ") || lead.carrierName}</div>{it.fareFamily && <div className="flt-fare-family">{it.fareFamily}</div>}</div>
        </div>
        <div className="flt-legs">
          <LegRow leg={out} label="Outbound" />
          {ret && <LegRow leg={ret} label="Return" />}
        </div>
      </div>

      <div className="flt-card-side">
        {it.price != null && <div className="flt-price">{it.currency} {Math.round(it.price)}</div>}
        <div className="flt-tags">
          {it.refundable && <span className="flt-tag ok"><Icon name="check" size={12} /> Refundable</span>}
          {it.baggage?.checkedIncluded && <span className="flt-tag"><Icon name="briefcase" size={12} /> Bag incl.</span>}
          {it.baggage && !it.baggage.checkedIncluded && it.baggage.carryOn && <span className="flt-tag faint"><Icon name="briefcase" size={12} /> Cabin only</span>}
          <span className="flt-tag faint" title="Estimated CO₂ per passenger">~{estimateCO2(it)} kg CO₂</span>
        </div>
        {bookingEnabled && it.offerId
          ? <Link className="btn btn-primary btn-sm" href={bookHref}>Select</Link>
          : <Link className="btn btn-soft btn-sm" href="/quotes?category=travel">Enquire</Link>}
        <button type="button" className="flt-details-toggle" onClick={() => setOpen((o) => !o)}>{open ? "Hide details" : "Flight details"} <Icon name="chevron" size={12} /></button>
      </div>

      {(meal || prayerLayovers.length > 0) && (
        <div className="flt-muslim">
          {meal && <span className="flt-mtag"><Icon name="check" size={12} /> {meal.alcoholFree ? "Alcohol-free cabin" : "Muslim meal on request"}</span>}
          {prayerLayovers.slice(0, 2).map((l, i) => (
            <span key={i} className={`flt-mtag ${l.durationMin >= PRAYER_LAYOVER_MIN ? "" : "tight"}`}><Icon name="mosque" size={12} /> Prayer room at {l.iata}{l.durationMin ? ` · ${fmtDuration(l.durationMin)} layover` : ""}</span>
          ))}
        </div>
      )}

      {open && (
        <div className="flt-details">
          {it.legs.map((leg, li) => (
            <div key={li} className="flt-detail-leg">
              <h5>{li === 0 ? "Outbound" : "Return"} · {fmtDuration(leg.durationMin)}</h5>
              {leg.segments.map((s, si) => (
                <div key={si} className="flt-seg">
                  <div className="flt-seg-time"><strong>{fmtTime(s.departISO)}</strong><span>{s.from}{s.fromName ? ` · ${s.fromName}` : ""}</span></div>
                  <div className="flt-seg-mid">{s.carrierName}{s.flight ? ` ${s.flight}` : ""}{s.durationMin ? ` · ${fmtDuration(s.durationMin)}` : ""}</div>
                  <div className="flt-seg-time"><strong>{fmtTime(s.arriveISO)}</strong><span>{s.to}{s.toName ? ` · ${s.toName}` : ""}</span></div>
                </div>
              ))}
            </div>
          ))}
          {it.termsSummary.length > 0 && (
            <div className="flt-terms">{it.termsSummary.map((t, i) => <span key={i} className={`flt-term ${t.level}`}>{t.message}</span>)}</div>
          )}
          {(prayerLayovers.length > 0 || dest || meal) && (
            <div className="flt-faith">
              <h5><Icon name="moon" size={13} /> Muslim traveller notes</h5>
              {meal && <p>{meal.name}: {meal.note || "Muslim meal (MOML) available when requested in advance"}. Request the meal with the airline and confirm.</p>}
              {prayerLayovers.map((l, i) => (
                <p key={i}>Layover at {l.iata}{l.amenity?.city ? ` (${l.amenity.city})` : ""}: {l.amenity?.musalla || "prayer room available"}. {l.durationMin >= PRAYER_LAYOVER_MIN ? `${fmtDuration(l.durationMin)} — enough time to pray.` : `${fmtDuration(l.durationMin)} — tight connection.`}</p>
              ))}
              {dest && <p>Qibla at {dest.city}: {Math.round(qiblaBearing(dest.lat, dest.lng))}° ({compassLabel(qiblaBearing(dest.lat, dest.lng))}) from north.</p>}
              <p className="flt-faith-foot">Prayer facilities and meal options are factual references — please confirm with the airport and airline.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── filter rail ──────────────────────────────────────────────────────────── */
interface Filters { stops: number | null; maxDur: number; depFrom: number; depTo: number; bagOnly: boolean; airlines: Set<string> }
const noFilters = (maxDur: number): Filters => ({ stops: null, maxDur, depFrom: 0, depTo: 24, bagOnly: false, airlines: new Set() });

function applyFilters(items: FlightItinerary[], f: Filters): FlightItinerary[] {
  return items.filter((it) => {
    if (f.stops !== null && it.stops > f.stops) return false;
    if (it.durationMin > f.maxDur) return false;
    const dh = Number(it.legs[0]?.segments[0]?.departISO?.slice(11, 13) || 0);
    if (dh < f.depFrom || dh > f.depTo) return false;
    if (f.bagOnly && !it.baggage?.checkedIncluded) return false;
    if (f.airlines.size && !it.carriers.some((c) => f.airlines.has(c))) return false;
    return true;
  });
}

function FilterRail({ all, f, setF, airlines }: { all: FlightItinerary[]; f: Filters; setF: (f: Filters) => void; airlines: string[] }) {
  const maxDur = Math.max(...all.map((x) => x.durationMin), 60);
  return (
    <aside className="flt-rail">
      <div className="flt-rail-head"><h3>Filter</h3><button type="button" className="flt-rail-clear" onClick={() => setF(noFilters(maxDur))}>Clear</button></div>
      <div className="flt-rail-group">
        <h4>Stops</h4>
        {[[null, "Any number"], [0, "Non-stop only"], [1, "Max 1 stop"], [2, "Max 2 stops"]].map(([v, lbl]) => (
          <label key={String(v)} className="flt-radio">
            <input type="radio" name="stops" checked={f.stops === v} onChange={() => setF({ ...f, stops: v as number | null })} /> <span>{lbl as string}</span>
          </label>
        ))}
      </div>
      <div className="flt-rail-group">
        <h4>Departure time</h4>
        <div className="flt-range-val">{String(f.depFrom).padStart(2, "0")}:00 – {String(f.depTo).padStart(2, "0")}:00</div>
        <input type="range" min={0} max={24} value={f.depFrom} onChange={(e) => setF({ ...f, depFrom: Math.min(Number(e.target.value), f.depTo) })} />
        <input type="range" min={0} max={24} value={f.depTo} onChange={(e) => setF({ ...f, depTo: Math.max(Number(e.target.value), f.depFrom) })} />
      </div>
      <div className="flt-rail-group">
        <h4>Max duration</h4>
        <div className="flt-range-val">{fmtDuration(f.maxDur)}</div>
        <input type="range" min={60} max={maxDur} step={30} value={f.maxDur} onChange={(e) => setF({ ...f, maxDur: Number(e.target.value) })} />
      </div>
      <div className="flt-rail-group">
        <h4>Baggage</h4>
        <label className="flt-check"><input type="checkbox" checked={f.bagOnly} onChange={(e) => setF({ ...f, bagOnly: e.target.checked })} /> <span>Checked bag included</span></label>
      </div>
      {airlines.length > 1 && (
        <div className="flt-rail-group">
          <h4>Airlines</h4>
          {airlines.map((a) => (
            <label key={a} className="flt-check">
              <input type="checkbox" checked={f.airlines.has(a)} onChange={(e) => { const s = new Set(f.airlines); if (e.target.checked) s.add(a); else s.delete(a); setF({ ...f, airlines: s }); }} /> <span>{a}</span>
            </label>
          ))}
        </div>
      )}
    </aside>
  );
}

/* ── pre-search landing content (benefits, routes, how-it-works, FAQ) ──────── */
const SG_ORIGIN: Airport = { iata: "SIN", name: "Changi", city: "Singapore", country: "Singapore" };
const POPULAR_ROUTES: (Airport & { tag?: string })[] = [
  { iata: "JED", city: "Jeddah", name: "King Abdulaziz Intl", country: "Saudi Arabia", tag: "Umrah" },
  { iata: "MED", city: "Madinah", name: "Prince Mohammad bin Abdulaziz", country: "Saudi Arabia", tag: "Umrah" },
  { iata: "IST", city: "Istanbul", name: "Istanbul Airport", country: "Türkiye" },
  { iata: "DXB", city: "Dubai", name: "Dubai Intl", country: "United Arab Emirates" },
  { iata: "CAI", city: "Cairo", name: "Cairo Intl", country: "Egypt" },
  { iata: "KUL", city: "Kuala Lumpur", name: "KLIA", country: "Malaysia" },
  { iata: "CGK", city: "Jakarta", name: "Soekarno-Hatta", country: "Indonesia" },
  { iata: "DOH", city: "Doha", name: "Hamad Intl", country: "Qatar" },
];
const FLT_BENEFITS: [string, string, string][] = [
  ["moon", "Muslim meals, flagged", "See at a glance which airlines serve a Muslim meal (MOML) on request, and which cabins are alcohol-free — before you book."],
  ["mosque", "Prayer-aware layovers", "We highlight connecting airports with a prayer room and tell you whether your layover is long enough to pray, plus the qibla at your destination."],
  ["crescent", "Built for Umrah & Hajj", "Jeddah and Madinah presets, Hijri dates and Ramadan / Hajj-season awareness — travel planning that understands your pilgrimage."],
  ["bed", "One trip, planned together", "Pair your flight with a Muslim-friendly hotel — prayer rooms, halal dining nearby and alcohol-free stays — in one place."],
  ["clock", "Hundreds of airlines, real fares", "Compare live prices across hundreds of airlines and find the cheapest day to fly with our flexible-date calendar."],
  ["shield-check", "Book with confidence", "Transparent pricing, fare-drop alerts and secure payment handled by our trusted travel partner."],
];
const FLT_FAQS: [string, string][] = [
  ["Do you show which airlines serve a Muslim meal?", "Yes. Results flag carriers that offer a Muslim meal (MOML) on request, and note alcohol-free cabins where applicable. Always request the meal with the airline and confirm before you fly."],
  ["Can I see prayer facilities for my layover?", "Yes. For connecting airports with a documented prayer room or musalla, we show the facility and whether your layover is long enough to pray comfortably, plus the qibla direction at your destination."],
  ["Is this built for Umrah and Hajj travel?", "Absolutely. Use the Jeddah and Madinah presets, see the Hijri date and Ramadan/Hajj-season flags, and pair your flight with a Muslim-friendly hotel near the Haramain."],
  ["Can I book flights and a hotel together?", "You can search flights and a Muslim-friendly stay — with prayer rooms, halal dining nearby and alcohol-free options — in one place, so your whole trip is planned together."],
  ["When am I charged, and who handles payment?", "Payment is handled securely by our travel partner, and you're never charged without a confirmed booking. Baggage, times and fare rules are shown before you pay."],
];

function FlightsLanding({ onRoute }: { onRoute: (origin: Airport, dest: Airport) => void }) {
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

/* ── search + results ─────────────────────────────────────────────────────── */
export function FlightsScreen({ bookingEnabled }: { bookingEnabled: boolean }) {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const [tripType, setTripType] = useState<"one" | "round">("one");
  const [from, setFrom] = useState<Airport | null>(null);
  const [to, setTo] = useState<Airport | null>(null);
  const [date, setDate] = useState(iso(new Date(today.getTime() + 30 * 864e5)));
  const [returnDate, setReturnDate] = useState(iso(new Date(today.getTime() + 37 * 864e5)));
  const [adults, setAdults] = useState(1);
  const [cabin, setCabin] = useState("ECONOMY");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FlightItinerary[] | null>(null);
  const [note, setNote] = useState("");
  const [sort, setSort] = useState<"best" | "cheapest" | "fastest">("best");
  const [f, setF] = useState<Filters>(noFilters(3000));
  const [calendar, setCalendar] = useState<{ date: string; price: number | null }[] | null>(null);
  const [searched, setSearched] = useState<{ origin: string; destination: string; date: string } | null>(null);
  const [track, setTrack] = useState<{ open: boolean; email: string; msg: string }>({ open: false, email: "", msg: "" });

  const runSearch = async (searchDate: string, originOv?: Airport, destOv?: Airport) => {
    const o = originOv || from;
    const dst = destOv || to;
    if (!o || !dst) { setNote("Pick origin and destination airports."); return; }
    setLoading(true); setNote(""); setCalendar(null); setTrack({ open: false, email: "", msg: "" });
    try {
      const r = await fetch("/api/travel/flights/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: o.iata, destination: dst.iata, date: searchDate, returnDate: tripType === "round" ? returnDate : "", tripType, adults, cabin, currency: "SGD" }),
      });
      const d = await r.json();
      if (d.ok) {
        const list: FlightItinerary[] = d.itineraries || [];
        setItems(list);
        setSearched({ origin: o.iata, destination: dst.iata, date: searchDate });
        setF(noFilters(Math.max(...list.map((x) => x.durationMin), 3000)));
        if (d.simulated) setNote("Live flights aren't connected yet — this is a preview of the experience.");
        else if (!list.length) setNote("No flights found. Try other dates or airports.");
        // flexible-date price calendar (one-way window; non-blocking)
        fetch("/api/travel/flights/calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ origin: o.iata, destination: dst.iata, date: searchDate, currency: "SGD" }) })
          .then((c) => c.json()).then((c) => { if (c.ok) setCalendar(c.days); }).catch(() => {});
      } else setNote(d.error || "Couldn't search flights right now.");
    } catch { setNote("Couldn't search flights right now."); }
    setLoading(false);
  };

  const submit = (e: FormEvent) => { e.preventDefault(); runSearch(date); };

  const pickDay = (d: string) => { setDate(d); runSearch(d); };

  const setAlert = async () => {
    if (!searched) return;
    const prices = (items || []).map((x) => x.price).filter((p): p is number => p != null);
    const cheapest = prices.length ? Math.round(Math.min(...prices)) : null;
    try {
      const r = await fetch("/api/travel/flights/watch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...searched, price: cheapest, currency: "SGD" }) });
      const d = await r.json();
      setTrack({ open: true, email: "", msg: d.ok ? "Done — we'll email you if the price drops." : d.needLogin ? "Please log in to track this price." : d.error || "Could not save your alert." });
    } catch { setTrack({ open: true, email: "", msg: "Could not save your alert." }); }
  };

  const nearby = searched ? { from: nearbyAirports(searched.origin), to: nearbyAirports(searched.destination) } : { from: [], to: [] };
  const cheapestDay = calendar ? calendar.reduce((m, d) => (d.price != null && (m == null || d.price < m) ? d.price : m), null as number | null) : null;

  const airlines = useMemo(() => [...new Set((items || []).flatMap((x) => x.carriers))].sort(), [items]);
  const filtered = useMemo(() => (items ? sortItineraries(applyFilters(items, f), sort) : []), [items, f, sort]);
  const headline = (mode: "best" | "cheapest" | "fastest") => {
    const top = items && items.length ? sortItineraries(applyFilters(items, f), mode)[0] : null;
    return top ? `${top.currency} ${Math.round(top.price ?? 0)} · ${fmtDuration(top.durationMin)}` : "";
  };

  return (
    <div className="screen-in hh-page">
      <nav className="travel-breadcrumbs" aria-label="Breadcrumb"><div className="hh-wrap">
        <span className="crumb"><Link href="/">Home</Link><Icon name="chevron" size={13} /></span>
        <span className="crumb"><Link href="/travel">Travel</Link><Icon name="chevron" size={13} /></span>
        <span className="crumb"><span aria-current="page">Flights</span></span>
      </div></nav>

      <section className="travel-hero hh-pattern">
        <div className="hh-wrap">
          <span className="eyebrow" style={{ color: "#cfe0da" }}>Halal travel</span>
          <h1>Find flights for your journey</h1>
          <p className="sub">Search hundreds of airlines for Umrah, Hajj and Muslim travel — plan flights alongside your halal-friendly stay.</p>
          <div className="flt-triptype" role="tablist" aria-label="Trip type">
            <button role="tab" aria-selected={tripType === "one"} className={tripType === "one" ? "on" : ""} onClick={() => setTripType("one")}>One-way</button>
            <button role="tab" aria-selected={tripType === "round"} className={tripType === "round" ? "on" : ""} onClick={() => setTripType("round")}>Round-trip</button>
          </div>
          <div className="flt-umrah">
            <span className="flt-umrah-label"><Icon name="moon" size={13} /> Umrah &amp; Hajj</span>
            <button type="button" onClick={() => setTo({ iata: "JED", city: "Jeddah", name: "King Abdulaziz Intl", country: "Saudi Arabia" })}>Jeddah (JED)</button>
            <button type="button" onClick={() => setTo({ iata: "MED", city: "Madinah", name: "Prince Mohammad bin Abdulaziz", country: "Saudi Arabia" })}>Madinah (MED)</button>
            <span className="flt-hijri">{formatHijri(date)}{hijriSeason(date) ? <em className="flt-season"> · {hijriSeason(date)!.label}</em> : null}</span>
          </div>
          <form className={`travel-search flight-search ${tripType === "round" ? "rt" : ""}`} onSubmit={submit}>
            <AirportInput label="From" value={from} onPick={setFrom} placeholder="City or code (e.g. SIN)" />
            <AirportInput label="To" value={to} onPick={setTo} placeholder="City or code (e.g. JED)" />
            <div className="field"><label htmlFor="f-date">Depart</label><input id="f-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            {tripType === "round" && <div className="field"><label htmlFor="f-rdate">Return</label><input id="f-rdate" type="date" value={returnDate} min={date} onChange={(e) => setReturnDate(e.target.value)} /></div>}
            <div className="field"><label htmlFor="f-pax">Travellers</label><select id="f-pax" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} traveller{n > 1 ? "s" : ""}</option>)}</select></div>
            <div className="field"><label htmlFor="f-cabin">Cabin</label><select id="f-cabin" value={cabin} onChange={(e) => setCabin(e.target.value)}><option value="ECONOMY">Economy</option><option value="PREMIUM_ECONOMY">Premium economy</option><option value="BUSINESS">Business</option><option value="FIRST">First</option></select></div>
            <div className="field field-go"><label aria-hidden>&nbsp;</label><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Searching…" : "Search flights"}</button></div>
          </form>
        </div>
      </section>

      <div className="hh-wrap hh-section">
        {note ? <p className="muted" style={{ marginBottom: 14 }}>{note}</p> : null}

        {items && items.length > 0 ? (
          <div className="flt-layout">
            <FilterRail all={items} f={f} setF={setF} airlines={airlines} />
            <div>
              {calendar && calendar.length > 1 && (
                <div className="flt-cal" role="group" aria-label="Flexible dates">
                  {calendar.map((c) => (
                    <button key={c.date} type="button" className={`flt-cal-day ${searched?.date === c.date ? "on" : ""} ${c.price != null && c.price === cheapestDay ? "cheap" : ""}`} onClick={() => pickDay(c.date)}>
                      <span className="flt-cal-d">{new Date(c.date + "T00:00:00").toLocaleDateString("en", { weekday: "short", day: "numeric" })}</span>
                      <span className="flt-cal-p">{c.price != null ? `SGD ${c.price}` : "—"}</span>
                    </button>
                  ))}
                </div>
              )}
              {searched && (
                <div className="flt-track">
                  {track.msg ? (
                    <span className="flt-track-msg"><Icon name="check" size={14} /> {track.msg}</span>
                  ) : (
                    <button type="button" className="flt-track-btn" onClick={setAlert}><Icon name="clock" size={14} /> Track this price — get emailed if {searched.origin}→{searched.destination} drops</button>
                  )}
                </div>
              )}
              <div className="flt-sort-tabs">
                {(["best", "cheapest", "fastest"] as const).map((m) => (
                  <button key={m} className={sort === m ? "on" : ""} onClick={() => setSort(m)}>
                    <span className="flt-sort-label">{m === "best" ? "Best" : m === "cheapest" ? "Cheapest" : "Fastest"}</span>
                    <span className="flt-sort-sub">{headline(m)}</span>
                  </button>
                ))}
              </div>
              <p className="flt-count">{filtered.length} of {items.length} flights</p>
              {to && (
                <Link href="/travel" className="hotel-cta">
                  <span className="hcta-ico"><Icon name="bed" size={20} /></span>
                  <span className="hcta-text"><strong>Complete your trip</strong> — find a Muslim-friendly hotel in {to.city || to.iata} with prayer rooms and halal dining nearby.</span>
                  <span className="hcta-go">Find a stay <Icon name="arrow" size={15} /></span>
                </Link>
              )}
              <div className="flt-list">{filtered.map((it, i) => <ItineraryCard key={it.offerId || i} it={it} bookingEnabled={bookingEnabled} adults={adults} />)}</div>
              {filtered.length === 0 && <Empty icon="plane" title="No flights match your filters" body="Try widening the stops, time or duration filters." />}
              {(nearby.from.length > 0 || nearby.to.length > 0) && (
                <div className="flt-nearby">
                  <span className="flt-nearby-label">Nearby airports — try a cheaper option:</span>
                  {nearby.from.map((a) => { const ap = { iata: a.iata, name: a.name, city: a.city, country: a.country }; return <button key={`f${a.iata}`} type="button" className="flt-nearby-chip" onClick={() => { setFrom(ap); runSearch(date, ap); }}>From {a.city} ({a.iata})</button>; })}
                  {nearby.to.map((a) => { const ap = { iata: a.iata, name: a.name, city: a.city, country: a.country }; return <button key={`t${a.iata}`} type="button" className="flt-nearby-chip" onClick={() => { setTo(ap); runSearch(date, undefined, ap); }}>To {a.city} ({a.iata})</button>; })}
                </div>
              )}
            </div>
          </div>
        ) : !items ? (
          <FlightsLanding onRoute={(o, d) => { setFrom(o); setTo(d); runSearch(date, o, d); }} />
        ) : null}

        {items ? <p className="travel-disclaimer" style={{ marginTop: 24 }}>Flights are provided via our travel partner. Confirm baggage allowance, times and fare rules before booking.</p> : null}
      </div>
    </div>
  );
}

/* ── booking: 3-step (Passenger & Contact → Seats & Bags → Review & Pay) ───── */

interface Pax { firstName: string; middleName: string; lastName: string; dobD: string; dobM: string; dobY: string; gender: string; nationality: string; docType: string; docNumber: string; docExpD: string; docExpM: string; docExpY: string; docCountry: string }
const blankPax = (): Pax => ({ firstName: "", middleName: "", lastName: "", dobD: "", dobM: "", dobY: "", gender: "M", nationality: "SG", docType: "passport", docNumber: "", docExpD: "", docExpM: "", docExpY: "", docCountry: "SG" });
interface Prebook { prebookId: string; transactionId: string | null; publishableKey: string | null; price: number | null; currency: string; expiration?: string | null; servicesAttachable?: unknown }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function isoDate(d: string, m: string, y: string): string {
  if (!d || !m || !y) return "";
  const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  // reject impossible calendar dates (e.g. 31 Feb) before sending to the API
  const dt = new Date(`${iso}T00:00:00Z`);
  return dt.getUTCFullYear() === Number(y) && dt.getUTCMonth() + 1 === Number(m) && dt.getUTCDate() === Number(d) ? iso : "";
}

function DOBSelect({ label, d, m, y, set, yearsBack, future }: { label: string; d: string; m: string; y: string; set: (k: "d" | "m" | "y", v: string) => void; yearsBack: number; future?: boolean }) {
  const now = new Date().getFullYear();
  const years = future
    ? Array.from({ length: 15 }, (_, i) => now + i)
    : Array.from({ length: yearsBack }, (_, i) => now - i);
  return (
    <div className="field">
      <label>{label} <span className="req">*</span></label>
      <div className="dob-grid">
        <select value={d} onChange={(e) => set("d", e.target.value)}><option value="">DD</option>{Array.from({ length: 31 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}</select>
        <select value={m} onChange={(e) => set("m", e.target.value)}><option value="">Month</option>{MONTHS.map((mo, i) => <option key={mo} value={i + 1}>{mo}</option>)}</select>
        <select value={y} onChange={(e) => set("y", e.target.value)}><option value="">YYYY</option>{years.map((yr) => <option key={yr} value={yr}>{yr}</option>)}</select>
      </div>
    </div>
  );
}

function CountrySelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label>{label} <span className="req">*</span></label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{flagEmoji(c.code)} {c.name}</option>)}
      </select>
    </div>
  );
}

function useCountdown(expiration?: string | null, active?: boolean) {
  const [left, setLeft] = useState<number | null>(null);
  const target = useRef<number | null>(null);
  useEffect(() => {
    if (!active) { setLeft(null); target.current = null; return; }
    target.current = expiration ? Date.parse(expiration) : Date.now() + 10 * 60000;
    const tick = () => setLeft(Math.max(0, Math.round(((target.current as number) - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiration, active]);
  return left;
}

export function FlightBookingScreen({ offerId, from, to, date, price, currency, adults, roundTrip, returnDate, bookingEnabled }: { offerId: string; from: string; to: string; date: string; price: string; currency: string; adults: number; roundTrip: boolean; returnDate: string; bookingEnabled: boolean }) {
  const [pax, setPax] = useState<Pax[]>(() => Array.from({ length: Math.max(1, adults) }, blankPax));
  const [contact, setContact] = useState({ email: "", phoneCc: "65", phone: "" });
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState("");
  const [pb, setPb] = useState<Prebook | null>(null);
  const [err, setErr] = useState("");
  const [priceNote, setPriceNote] = useState("");
  const countdown = useCountdown(pb?.expiration, step >= 2 && !!pb);

  const setP = (i: number, k: keyof Pax, v: string) => setPax((arr) => arr.map((p, idx) => (idx === i ? { ...p, [k]: v } : p)));
  const services = useMemo(() => {
    const s = pb?.servicesAttachable;
    return Array.isArray(s) ? (s as Record<string, unknown>[]) : [];
  }, [pb]);

  const crumbs = (
    <nav className="travel-breadcrumbs" aria-label="Breadcrumb"><div className="hh-wrap">
      <span className="crumb"><Link href="/travel">Travel</Link><Icon name="chevron" size={13} /></span>
      <span className="crumb"><Link href="/travel/flights">Flights</Link><Icon name="chevron" size={13} /></span>
      <span className="crumb"><span aria-current="page">Book</span></span>
    </div></nav>
  );

  if (!bookingEnabled || !offerId) {
    return (
      <div className="screen-in hh-page">{crumbs}
        <div className="hh-wrap hh-section" style={{ maxWidth: 640 }}>
          <Empty icon="plane" title="Flight booking opening soon" body="We're finishing secure flight checkout. In the meantime, enquire and our team will help you book." />
          <Link className="btn btn-primary" href="/quotes?category=travel" style={{ marginTop: 14 }}>Enquire</Link>
        </div>
      </div>
    );
  }

  const total = pb?.price ?? (price ? Number(price) : null);
  const cur = pb?.currency || currency || "USD";

  const continueToSeats = async (e: FormEvent) => {
    e.preventDefault();
    setErr(""); setPriceNote("");
    // validate document dates + contact before holding a price (empty/invalid ISO
    // must never reach the booking partner)
    for (let i = 0; i < pax.length; i++) {
      const p = pax[i];
      if (!isoDate(p.dobD, p.dobM, p.dobY)) { setErr(`Enter a valid date of birth for traveller ${i + 1}.`); return; }
      if (!isoDate(p.docExpD, p.docExpM, p.docExpY)) { setErr(`Enter a valid document expiry date for traveller ${i + 1}.`); return; }
    }
    if (!contact.phone.trim()) { setErr("Enter a contact phone number."); return; }
    setBusy("verify");
    try {
      const v = await fetch("/api/travel/flights/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerId }) }).then((r) => r.json()).catch(() => null);
      if (v?.ok && v.changed && v.total != null) setPriceNote(`Fare updated to ${v.currency || cur} ${Math.round(v.total)} before we hold it.`);
    } catch { /* non-blocking */ }
    try {
      setBusy("prebook");
      const passengers = pax.map((p, i) => ({
        firstName: p.firstName, lastName: p.lastName, birthday: isoDate(p.dobD, p.dobM, p.dobY),
        passengerType: 0, documentType: p.docType, documentNumber: p.docNumber,
        documentIssueCountry: p.docCountry, documentExpiry: isoDate(p.docExpD, p.docExpM, p.docExpY),
        gender: p.gender, nationality: p.nationality, ...(p.middleName ? { middleName: p.middleName } : {}),
      }));
      const lead = pax[0];
      const r = await fetch("/api/travel/flights/prebook", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, contact: { firstName: lead.firstName, lastName: lead.lastName, email: contact.email, phoneNumber: contact.phone.trim(), phoneCountryCode: contact.phoneCc }, passengers }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || d.reason || "Could not start booking."); setBusy(""); return; }
      setPb(d as Prebook); setStep(2); setBusy("");
    } catch { setErr("Could not start booking."); setBusy(""); }
  };

  const confirm = async () => {
    if (!pb) return;
    setBusy("book"); setErr("");
    try {
      const r = await fetch("/api/travel/flights/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prebookId: pb.prebookId, transactionId: pb.transactionId, origin: from, destination: to, date, currency: pb.currency, total: pb.price, contactEmail: contact.email, passengers: pax.map((p) => ({ firstName: p.firstName, lastName: p.lastName })) }) });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || "Booking failed."); setBusy(""); return; }
      const p = new URLSearchParams({ ref: String(d.bookingRef || d.id || ""), status: String(d.status || ""), from, to, date });
      window.location.href = `/travel/flights/confirmation?${p.toString()}`;
    } catch { setErr("Booking failed."); setBusy(""); }
  };

  const stepper = (
    <ol className="flt-stepper">
      {["Passenger & Contact", "Seats & Bags", "Review & Pay"].map((s, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        return <li key={s} className={`${step === n ? "on" : ""} ${step > n ? "done" : ""}`}><span className="flt-step-n">{step > n ? <Icon name="check" size={13} /> : n}</span><span className="flt-step-label">{s}</span></li>;
      })}
    </ol>
  );

  return (
    <div className="screen-in hh-page">{crumbs}
      <div className="hh-wrap hh-section">
        {stepper}
        <div className="flt-book-grid">
          <div className="flt-book-main">
            {step === 1 && (
              <form onSubmit={continueToSeats}>
                <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>Passenger &amp; contact details</h1>
                <p className="muted" style={{ marginBottom: 16 }}>Enter details exactly as they appear on your travel document.</p>
                <div className="notice"><Icon name="info" size={16} /><span>Fields marked with <span className="req">*</span> are required. Names must match the passport exactly.</span></div>

                {pax.map((p, i) => (
                  <div key={i} className="card pax-card">
                    <h2>Traveller {i + 1} <span className="faint">· Adult</span></h2>
                    <div className="form-row-3">
                      <div className="field"><label>First name <span className="req">*</span></label><input required value={p.firstName} onChange={(e) => setP(i, "firstName", e.target.value)} /></div>
                      <div className="field"><label>Middle name</label><input placeholder="Optional" value={p.middleName} onChange={(e) => setP(i, "middleName", e.target.value)} /></div>
                      <div className="field"><label>Last name <span className="req">*</span></label><input required value={p.lastName} onChange={(e) => setP(i, "lastName", e.target.value)} /></div>
                    </div>
                    <div className="form-row">
                      <CountrySelect label="Nationality" value={p.nationality} onChange={(v) => setP(i, "nationality", v)} />
                      <div className="field"><label>Gender <span className="req">*</span></label><select value={p.gender} onChange={(e) => setP(i, "gender", e.target.value)}><option value="M">Male</option><option value="F">Female</option></select></div>
                    </div>
                    <DOBSelect label="Date of birth" d={p.dobD} m={p.dobM} y={p.dobY} yearsBack={100} set={(k, v) => setP(i, k === "d" ? "dobD" : k === "m" ? "dobM" : "dobY", v)} />
                    <h3 className="pax-sub">Document details</h3>
                    <div className="form-row">
                      <div className="field"><label>Document type <span className="req">*</span></label><select value={p.docType} onChange={(e) => setP(i, "docType", e.target.value)}><option value="passport">Passport</option><option value="national_id">National ID</option></select></div>
                      <CountrySelect label="Issue country" value={p.docCountry} onChange={(v) => setP(i, "docCountry", v)} />
                    </div>
                    <div className="form-row">
                      <div className="field"><label>Document number <span className="req">*</span></label><input required value={p.docNumber} onChange={(e) => setP(i, "docNumber", e.target.value)} placeholder="Enter document number" /></div>
                      <DOBSelect label="Expiry date" d={p.docExpD} m={p.docExpM} y={p.docExpY} yearsBack={0} future set={(k, v) => setP(i, k === "d" ? "docExpD" : k === "m" ? "docExpM" : "docExpY", v)} />
                    </div>
                  </div>
                ))}

                <div className="card pax-card">
                  <h2>Contact details</h2>
                  <div className="form-row">
                    <div className="field"><label>Email <span className="req">*</span></label><input required type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="you@email.com" /></div>
                    <div className="field"><label>Phone <span className="req">*</span></label><div className="phone-grid"><input className="phone-cc" value={contact.phoneCc} onChange={(e) => setContact({ ...contact, phoneCc: e.target.value.replace(/\D/g, "") })} /><input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="Include country code" /></div></div>
                  </div>
                </div>

                {err && <p style={{ color: "var(--danger)", fontSize: ".9rem", margin: "8px 0" }}>{err}</p>}
                <div className="flt-book-foot">
                  <Link className="btn btn-soft" href="/travel/flights"><Icon name="back" size={16} /> Back to search</Link>
                  <button className="btn btn-primary btn-lg" type="submit" disabled={!!busy}>{busy === "verify" ? "Checking fare…" : busy === "prebook" ? "Holding price…" : "Continue to seats & bags"} <Icon name="chevron" size={15} /></button>
                </div>
              </form>
            )}

            {step === 2 && (
              <div>
                <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>Seats &amp; bags</h1>
                <p className="muted" style={{ marginBottom: 16 }}>Add extras to your trip, or continue with what's included in your fare.</p>
                {services.length === 0 ? (
                  <div className="card pax-card">
                    <div className="notice"><Icon name="check" size={16} /><span>Your fare includes the standard cabin {pb?.price != null ? "" : ""}baggage. No paid extras are available to add for this fare.</span></div>
                  </div>
                ) : (
                  <div className="card pax-card"><p className="muted">Optional seats and baggage available on this fare:</p>
                    <div className="seat-bag-list">{services.map((s, i) => <div key={i} className="seat-bag"><Icon name="briefcase" size={14} /> <span>{String(s.description || s.label || s.type || "Extra")}{s.price != null ? ` · +${cur} ${Math.round(Number(s.price))}` : ""}</span></div>)}</div>
                    <p className="faint" style={{ fontSize: ".78rem", marginTop: 10 }}>You can add seats and extra bags directly with the airline after booking.</p>
                  </div>
                )}
                {err && <p style={{ color: "var(--danger)", fontSize: ".9rem", margin: "8px 0" }}>{err}</p>}
                <div className="flt-book-foot">
                  <button className="btn btn-soft" onClick={() => setStep(1)}><Icon name="back" size={16} /> Back</button>
                  <button className="btn btn-primary btn-lg" onClick={() => setStep(3)}>Continue to review &amp; pay <Icon name="chevron" size={15} /></button>
                </div>
              </div>
            )}

            {step === 3 && pb && (
              <div>
                <h1 style={{ fontSize: "1.5rem", marginBottom: 4 }}>Review &amp; pay</h1>
                <p className="muted" style={{ marginBottom: 16 }}>Confirm your details and pay securely. You're never charged without a confirmed booking.</p>
                <div className="card pax-card">
                  <h2>Payment</h2>
                  {pb.publishableKey
                    ? <div id="liteapi-flight-payment" className="pay-mount"><p className="muted" style={{ fontSize: ".86rem" }}>Secure card payment by our travel partner.</p></div>
                    : <div className="notice notice-warn"><Icon name="info" size={16} /><span>Sandbox test mode — confirm a test booking (no card needed). The live card form appears once the partner public key is set.</span></div>}
                  {countdown === 0 && <p style={{ color: "var(--danger)", fontSize: ".9rem", marginTop: 10 }}>This held price has expired — please search again.</p>}
                  {err && <p style={{ color: "var(--danger)", fontSize: ".9rem", marginTop: 10 }}>{err}</p>}
                  <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 14 }} onClick={confirm} disabled={busy === "book" || countdown === 0}>{busy === "book" ? "Confirming…" : total != null ? `Pay ${cur} ${Math.round(total)} & confirm` : "Confirm booking"}</button>
                  <p className="muted" style={{ fontSize: ".78rem", marginTop: 10, textAlign: "center" }}>If payment succeeds we confirm your ticket — you're never charged without a booking.</p>
                </div>
                <div className="flt-book-foot"><button className="btn btn-soft" onClick={() => setStep(2)}><Icon name="back" size={16} /> Back</button></div>
              </div>
            )}
          </div>

          <aside className="flt-book-rail">
            {step >= 2 && pb && countdown !== null && (
              <div className={`price-hold ${countdown === 0 ? "expired" : ""}`}>
                <span><Icon name="clock" size={15} /> {countdown === 0 ? "Price expired" : "Price held for…"}</span>
                <strong>{countdown === 0 ? "00:00" : `${String(Math.floor(countdown / 60)).padStart(2, "0")}:${String(countdown % 60).padStart(2, "0")}`}</strong>
              </div>
            )}
            <div className="card flt-rail-card">
              <h2>Flight details</h2>
              <div className="flt-rail-route"><strong>{from} → {to}</strong>{roundTrip && <strong>{to} → {from}</strong>}</div>
              <div className="sum-row faint"><span>Depart</span><span>{date}</span></div>
              {roundTrip && returnDate && <div className="sum-row faint"><span>Return</span><span>{returnDate}</span></div>}
              <div className="sum-row faint"><span>Travellers</span><span>{adults} adult{adults > 1 ? "s" : ""}</span></div>
            </div>
            <div className="card flt-rail-card">
              <h2>Price breakdown</h2>
              <div className="sum-row"><span>Fare ({adults} adult{adults > 1 ? "s" : ""})</span><span>{total != null ? `${cur} ${Math.round(total)}` : "—"}</span></div>
              <div className="sum-row faint"><span>Taxes &amp; fees</span><span>Included</span></div>
              {priceNote && <p className="faint" style={{ fontSize: ".78rem", margin: "6px 0 0" }}>{priceNote}</p>}
              <div className="sum-row total"><span>Total</span><span>{total != null ? `${cur} ${Math.round(total)}` : "—"}</span></div>
              <PromoCode amount={total} currency={cur} />
              <RewardsNote amount={total} currency={cur} />
            </div>
            <div className="card flt-rail-card why-book">
              <h2>Why book with us</h2>
              <ul>
                <li><Icon name="shield-check" size={15} /> Secure payment via our travel partner</li>
                <li><Icon name="moon" size={15} /> Halal-friendly trip planning</li>
                <li><Icon name="mail" size={15} /> Email support from our team</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export function FlightConfirmationScreen({ reference, status, from, to, date }: { reference?: string; status?: string; from?: string; to?: string; date?: string }) {
  const confirming = status === "confirming";
  return (
    <div className="screen-in hh-page">
      <div className="hh-wrap hh-section" style={{ maxWidth: 620, textAlign: "center" }}>
        <div className="empty-ico" style={{ margin: "0 auto", background: confirming ? "var(--gold-50)" : "var(--emerald-50)", color: confirming ? "var(--gold-700)" : "var(--emerald)" }}><Icon name={confirming ? "clock" : "check"} size={30} /></div>
        <h1 style={{ fontSize: "1.7rem", marginTop: 16 }}>{confirming ? "Payment received — confirming your flight" : "Flight booked"}</h1>
        <p className="muted" style={{ marginTop: 8 }}>{confirming ? "Your payment went through and we're finalising your ticket with the airline. You'll get an email shortly — no need to pay again." : <>Your flight {from && to ? <>{from} → {to}</> : null}{date ? `, ${date}` : ""} is confirmed. Your e-ticket has been emailed.</>}</p>
        {reference && <div className="card" style={{ padding: 18, margin: "20px auto", maxWidth: 360, textAlign: "left" }}><div className="sum-row"><span className="muted">Booking ref</span><strong className="kbd-mono">{reference}</strong></div></div>}
        <div className="flex g10 center" style={{ justifyContent: "center" }}>
          <Link className="btn btn-primary" href="/travel/trips">View my trips</Link>
          <Link className="btn btn-soft" href="/travel/flights">Back to flights</Link>
        </div>

        <Link href="/travel" className="hotel-cta" style={{ marginTop: 26, textAlign: "left" }}>
          <span className="hcta-ico"><Icon name="bed" size={20} /></span>
          <span className="hcta-text"><strong>Now find your stay</strong> — book a Muslim-friendly hotel{to ? ` in ${to}` : ""} with prayer rooms and halal dining nearby.</span>
          <span className="hcta-go">Find a stay <Icon name="arrow" size={15} /></span>
        </Link>

        <div className="travel-dua">
          <p className="travel-dua-ar" lang="ar" dir="rtl">سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ</p>
          <p className="travel-dua-tr">Subḥāna-lladhī sakhkhara lanā hādhā wa mā kunnā lahu muqrinīn</p>
          <p className="travel-dua-en">“Glory to Him who has subjected this to us, and we could never have done it by ourselves.” — the du‘ā for travel. Safe travels, and consider a Sadaqah for a blessed journey.</p>
        </div>
      </div>
    </div>
  );
}
