"use client";

/* Humble Halal — flights vertical (Phase 1: airport autocomplete + one-way
   search + results). Discovery only; the Select CTA degrades to enquiry while
   PAID_FLIGHTS_ENABLED is off. */
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon } from "../ui";
import { fmtDuration, fmtTime, type FlightJourney } from "@/lib/flights";

interface Airport { iata: string; name: string; city: string; country: string }

function AirportInput({ label, value, onPick, placeholder }: { label: string; value: Airport | null; onPick: (a: Airport) => void; placeholder: string }) {
  const [q, setQ] = useState(value ? `${value.city} (${value.iata})` : "");
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Airport[]>([]);
  useEffect(() => {
    if (q.trim().length < 2) { setList([]); return; }
    const t = setTimeout(async () => {
      try { const r = await fetch(`/api/travel/flights/airports?q=${encodeURIComponent(q)}`); const d = await r.json(); if (d.ok) setList(d.airports || []); } catch { /* ignore */ }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="field">
      <label>{label}</label>
      <div className="ac">
        <input value={q} placeholder={placeholder} onChange={(e) => { const v = e.target.value; setQ(v); setOpen(true); if (/^[A-Za-z]{3}$/.test(v.trim())) onPick({ iata: v.trim().toUpperCase(), name: v.trim().toUpperCase(), city: "", country: "" }); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} />
        {open && list.length > 0 && (
          <div className="ac-list">
            {list.map((a) => (
              <button key={a.iata} type="button" className="ac-item" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(a); setQ(`${a.city || a.name} (${a.iata})`); setOpen(false); }}>
                <Icon name="plane" size={13} /> <span>{a.city || a.name} ({a.iata})<small> · {a.name}{a.country ? `, ${a.country}` : ""}</small></span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FlightCard({ j, bookingEnabled }: { j: FlightJourney; bookingEnabled: boolean }) {
  const first = j.segments[0];
  const last = j.segments[j.segments.length - 1];
  return (
    <div className="flight-card">
      <div className="fc-airline">
        {first.carrierLogo ? <img src={first.carrierLogo} alt={first.carrierName} /> : <span className="fc-airline-ph"><Icon name="plane" size={16} /></span>}
        <span className="fc-airline-name">{j.carriers.join(", ") || first.carrierName}</span>
      </div>
      <div className="fc-route">
        <div className="fc-end"><div className="fc-time">{fmtTime(first.departISO)}</div><div className="fc-code">{first.from}</div></div>
        <div className="fc-mid"><div className="fc-dur">{fmtDuration(j.durationMin)}</div><div className="fc-line"><span /></div><div className="fc-stops">{j.stops === 0 ? "Direct" : `${j.stops} stop${j.stops > 1 ? "s" : ""}`}</div></div>
        <div className="fc-end"><div className="fc-time">{fmtTime(last.arriveISO)}</div><div className="fc-code">{last.to}</div></div>
      </div>
      <div className="fc-cta">
        {j.price != null ? <div className="fc-price">{j.currency || ""} {Math.round(j.price)}</div> : null}
        {bookingEnabled ? <button type="button" className="btn btn-primary btn-sm" disabled>Select</button> : <Link className="btn btn-soft btn-sm" href="/quotes?category=travel">Enquire</Link>}
      </div>
    </div>
  );
}

export function FlightsScreen({ bookingEnabled }: { bookingEnabled: boolean }) {
  const today = new Date();
  const [from, setFrom] = useState<Airport | null>(null);
  const [to, setTo] = useState<Airport | null>(null);
  const [date, setDate] = useState(new Date(today.getTime() + 30 * 864e5).toISOString().slice(0, 10));
  const [adults, setAdults] = useState(1);
  const [loading, setLoading] = useState(false);
  const [journeys, setJourneys] = useState<FlightJourney[] | null>(null);
  const [note, setNote] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!from || !to) { setNote("Pick origin and destination airports."); return; }
    setLoading(true);
    setNote("");
    try {
      const r = await fetch("/api/travel/flights/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ origin: from.iata, destination: to.iata, date, adults, currency: "USD" }) });
      const d = await r.json();
      if (d.ok) {
        setJourneys(d.journeys);
        if (d.simulated) setNote("Live flights aren't connected yet.");
        else if (!d.journeys.length) setNote("No flights found. Try other dates or airports.");
      } else setNote(d.error || "Couldn't search flights right now.");
    } catch {
      setNote("Couldn't search flights right now.");
    }
    setLoading(false);
  };

  return (
    <div className="screen-in hh-page">
      <nav className="travel-breadcrumbs" aria-label="Breadcrumb">
        <div className="hh-wrap">
          <span className="crumb"><Link href="/">Home</Link><Icon name="chevron" size={13} /></span>
          <span className="crumb"><Link href="/travel">Travel</Link><Icon name="chevron" size={13} /></span>
          <span className="crumb"><span aria-current="page">Flights</span></span>
        </div>
      </nav>
      <section className="travel-hero hh-pattern">
        <div className="hh-wrap">
          <span className="eyebrow" style={{ color: "#cfe0da" }}>Halal travel</span>
          <h1>Find flights for your journey</h1>
          <p className="sub">Search hundreds of airlines for Umrah, Hajj and Muslim travel — plan flights alongside your halal-friendly stay.</p>
          <form className="travel-search flight-search" onSubmit={submit}>
            <AirportInput label="From" value={from} onPick={setFrom} placeholder="City or code (e.g. LON)" />
            <AirportInput label="To" value={to} onPick={setTo} placeholder="City or code (e.g. DXB)" />
            <div className="field"><label htmlFor="f-date">Depart</label><input id="f-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="field"><label htmlFor="f-pax">Passengers</label><select id="f-pax" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} passenger{n > 1 ? "s" : ""}</option>)}</select></div>
            <div className="field field-go"><label aria-hidden>&nbsp;</label><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Searching…" : "Search flights"}</button></div>
          </form>
          <p style={{ color: "#cfe0da", fontSize: ".78rem", marginTop: 10 }}>One-way search · round-trip coming soon</p>
        </div>
      </section>
      <div className="hh-wrap hh-section">
        {note ? <p className="muted" style={{ marginBottom: 14 }}>{note}</p> : null}
        {journeys && journeys.length > 0 ? (
          <>
            <h2 style={{ fontSize: "1.35rem", marginBottom: 14 }}>{journeys.length} flights · cheapest first</h2>
            <div className="flight-list">{journeys.map((j, i) => <FlightCard key={j.offerId || i} j={j} bookingEnabled={bookingEnabled} />)}</div>
          </>
        ) : !journeys ? (
          <div className="flight-info">
            {[["plane", "Real-time prices", "We scan hundreds of airlines to show the lowest fares."], ["globe", "Flights everywhere", "Search routes worldwide — from city hops to long-haul Umrah journeys."], ["shield-check", "Plan the whole trip", "Pair your flights with a Muslim-friendly hotel in one place."]].map(([ic, h, b]) => (
              <div key={h} className="flight-info-card"><span className="fi-ico"><Icon name={ic} size={20} /></span><h3>{h}</h3><p className="muted">{b}</p></div>
            ))}
          </div>
        ) : null}
        <p className="travel-disclaimer" style={{ marginTop: 24 }}>Flights are provided via our travel partner. Confirm baggage allowance, times and fare rules before booking.</p>
      </div>
    </div>
  );
}
