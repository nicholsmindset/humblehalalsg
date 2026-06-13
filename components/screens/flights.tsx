"use client";

/* Humble Halal — flights vertical (Phase 1: airport autocomplete + one-way
   search + results). Discovery only; the Select CTA degrades to enquiry while
   PAID_FLIGHTS_ENABLED is off. */
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Icon, Empty } from "../ui";
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
        {bookingEnabled && j.offerId ? (
          <Link className="btn btn-primary btn-sm" href={`/travel/flights/booking?offerId=${encodeURIComponent(j.offerId)}&from=${first.from}&to=${last.to}&date=${first.departISO.slice(0, 10)}&price=${j.price ?? ""}&currency=${j.currency ?? "USD"}`}>Select</Link>
        ) : (
          <Link className="btn btn-soft btn-sm" href="/quotes?category=travel">Enquire</Link>
        )}
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

/* ── flight booking (passengers → prebook → payment → book) ───────────────── */

interface Pax { firstName: string; lastName: string; birthday: string; gender: string; nationality: string; docNumber: string; docExpiry: string; docCountry: string; email: string; phone: string }
interface Prebook { prebookId: string; transactionId: string | null; secretKey: string | null; publishableKey: string | null; price: number | null; currency: string }

export function FlightBookingScreen({ offerId, from, to, date, price, currency, bookingEnabled }: { offerId: string; from: string; to: string; date: string; price: string; currency: string; bookingEnabled: boolean }) {
  const [pax, setPax] = useState<Pax>({ firstName: "", lastName: "", birthday: "", gender: "M", nationality: "SG", docNumber: "", docExpiry: "", docCountry: "SG", email: "", phone: "" });
  const [stage, setStage] = useState<"form" | "verifying" | "pay" | "booking">("form");
  const [pb, setPb] = useState<Prebook | null>(null);
  const [err, setErr] = useState("");
  const set = (k: keyof Pax, v: string) => setPax((p) => ({ ...p, [k]: v }));

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

  const startPrebook = async (e: FormEvent) => {
    e.preventDefault();
    setErr(""); setStage("verifying");
    try { await fetch("/api/travel/flights/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerId }) }); } catch { /* non-blocking */ }
    try {
      const contact = { firstName: pax.firstName, lastName: pax.lastName, email: pax.email, phoneNumber: pax.phone || "00000000", phoneCountryCode: "65" };
      const passengers = [{ firstName: pax.firstName, lastName: pax.lastName, birthday: pax.birthday, passengerType: 0, documentType: "passport", documentNumber: pax.docNumber, documentIssueCountry: pax.docCountry, documentExpiry: pax.docExpiry, gender: pax.gender, nationality: pax.nationality }];
      const r = await fetch("/api/travel/flights/prebook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerId, contact, passengers }) });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || d.reason || "Could not start booking."); setStage("form"); return; }
      setPb(d as Prebook); setStage("pay");
    } catch { setErr("Could not start booking."); setStage("form"); }
  };

  const confirm = async () => {
    if (!pb) return;
    setStage("booking"); setErr("");
    try {
      const r = await fetch("/api/travel/flights/book", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prebookId: pb.prebookId, transactionId: pb.transactionId, origin: from, destination: to, date, currency: pb.currency, total: pb.price, contactEmail: pax.email, passengers: [{ firstName: pax.firstName, lastName: pax.lastName }] }) });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || "Booking failed."); setStage("pay"); return; }
      const p = new URLSearchParams({ ref: String(d.bookingRef || d.id || ""), status: String(d.status || ""), from, to, date });
      window.location.href = `/travel/flights/confirmation?${p.toString()}`;
    } catch { setErr("Booking failed."); setStage("pay"); }
  };

  const total = pb?.price ?? (price ? Number(price) : null);

  return (
    <div className="screen-in hh-page">{crumbs}
      <div className="hh-wrap hh-section booking-wrap">
        <h1 style={{ fontSize: "1.6rem", marginBottom: 4 }}>Complete your flight booking</h1>
        <p className="muted" style={{ marginBottom: 22 }}>{from} → {to} · {date}</p>

        <div className="booking-grid">
          <div className="card" style={{ padding: 20 }}>
            {stage === "pay" && pb ? (
              <>
                <h2 style={{ fontSize: "1.1rem", marginBottom: 12 }}>Payment</h2>
                {pb.publishableKey ? (
                  <div id="liteapi-flight-payment" className="pay-mount"><p className="muted" style={{ fontSize: ".86rem" }}>Secure card payment by LiteAPI.</p></div>
                ) : (
                  <div className="notice notice-warn" style={{ marginBottom: 14 }}><Icon name="info" size={16} /><span>Sandbox test mode — confirm a test booking (no card needed). Add the LiteAPI public key to enable the live card form.</span></div>
                )}
                {err && <p style={{ color: "var(--danger)", fontSize: ".9rem", marginBottom: 10 }}>{err}</p>}
                <button className="btn btn-primary btn-block btn-lg" onClick={confirm}>{total != null ? `Pay ${pb.currency} ${Math.round(total)} & confirm` : "Confirm booking"}</button>
                <p className="muted" style={{ fontSize: ".78rem", marginTop: 10, textAlign: "center" }}>If payment succeeds we'll confirm your ticket — you're never charged without a booking.</p>
              </>
            ) : (
              <form onSubmit={startPrebook}>
                <h2 style={{ fontSize: "1.1rem", marginBottom: 14 }}>Passenger 1 (adult)</h2>
                <div className="form-row"><div className="field"><label>First name</label><input required value={pax.firstName} onChange={(e) => set("firstName", e.target.value)} /></div><div className="field"><label>Last name</label><input required value={pax.lastName} onChange={(e) => set("lastName", e.target.value)} /></div></div>
                <div className="form-row"><div className="field"><label>Date of birth</label><input required type="date" value={pax.birthday} onChange={(e) => set("birthday", e.target.value)} /></div><div className="field"><label>Gender</label><select value={pax.gender} onChange={(e) => set("gender", e.target.value)}><option value="M">Male</option><option value="F">Female</option></select></div></div>
                <div className="form-row"><div className="field"><label>Nationality (ISO)</label><input required value={pax.nationality} maxLength={2} onChange={(e) => set("nationality", e.target.value.toUpperCase())} /></div><div className="field"><label>Passport number</label><input required value={pax.docNumber} onChange={(e) => set("docNumber", e.target.value)} /></div></div>
                <div className="form-row"><div className="field"><label>Passport expiry</label><input required type="date" value={pax.docExpiry} onChange={(e) => set("docExpiry", e.target.value)} /></div><div className="field"><label>Passport country (ISO)</label><input required value={pax.docCountry} maxLength={2} onChange={(e) => set("docCountry", e.target.value.toUpperCase())} /></div></div>
                <h2 style={{ fontSize: "1.1rem", margin: "18px 0 12px" }}>Contact</h2>
                <div className="form-row"><div className="field"><label>Email</label><input required type="email" value={pax.email} onChange={(e) => set("email", e.target.value)} /></div><div className="field"><label>Phone</label><input value={pax.phone} onChange={(e) => set("phone", e.target.value)} /></div></div>
                {err && <p style={{ color: "var(--danger)", fontSize: ".9rem", margin: "10px 0" }}>{err}</p>}
                <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={stage === "verifying"} style={{ marginTop: 14 }}>{stage === "verifying" ? "Checking fare…" : "Continue to payment"}</button>
              </form>
            )}
          </div>

          <aside className="card booking-summary" style={{ padding: 18 }}>
            <h2 style={{ fontSize: "1.05rem", marginBottom: 12 }}>Trip</h2>
            <div className="sum-row"><span>{from} → {to}</span></div>
            <div className="sum-row faint"><span>Depart</span><span>{date}</span></div>
            {total != null && <div className="sum-row total"><span>Total</span><span>{(pb?.currency || currency || "USD")} {Math.round(total)}</span></div>}
            <p className="muted" style={{ fontSize: ".78rem", marginTop: 12 }}>Fares change until confirmed. Booking handled securely by LiteAPI.</p>
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
      </div>
    </div>
  );
}
