"use client";

/* Humble Halal — flights search + results (zzzello-grade, emerald brand).
   Image hero + tabbed search (Search / ✦ Ask AI) overlaid on the banner, then a
   filter rail, flexible-date calendar, Best/Cheapest/Fastest sort and rich
   itinerary cards. Booking is gated downstream by PAID_FLIGHTS_ENABLED.

   `embedded` = rendered inside the unified /travel landing under a shared hero +
   top-level Stays|Flights switcher: skips its own hero/Crumbs/landing and renders
   just the search card + results in normal flow. Standalone (/travel/flights)
   keeps the overlaid hero + FlightsLanding below. */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon, Empty } from "../../ui";
import { Carousel, DateRangeField, AiAnswer, SkeletonCard, isoOf, parseISO } from "../../ota";
import { fmtDuration, sortItineraries, type FlightItinerary } from "@/lib/flights";
// Aliased: this screen has local `[track, setTrack]` price-alert state.
import { track as analytics } from "@/lib/analytics";
import { nearbyAirports } from "@/lib/airports";
import { formatHijri, hijriSeason } from "@/lib/hijri";
import { Crumbs } from "../travel/shared";
import { ItineraryCard } from "./ItineraryCard";
import { FlightsLanding } from "./landing";
import {
  AirportInput,
  PassengersField,
  POPULAR_ROUTES,
  SG_ORIGIN,
  type Airport,
  type Pax3,
} from "./shared";

const HERO_IMG =
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1920&q=70";

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
  const [open, setOpen] = useState(false);
  const activeCount = (f.stops !== null ? 1 : 0) + (f.bagOnly ? 1 : 0) + (f.airlines.size > 0 ? 1 : 0) + (f.depFrom !== 0 || f.depTo !== 24 ? 1 : 0) + (f.maxDur < maxDur ? 1 : 0);
  return (
    <aside className={`flt-rail ${open ? "open" : ""}`}>
      <div className="flt-rail-head">
        <button type="button" className="flt-rail-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <h3>Filters{activeCount ? ` · ${activeCount}` : ""}</h3>
          <Icon name="chevron" size={15} className={`flt-rail-caret ${open ? "up" : ""}`} />
        </button>
        <button type="button" className="flt-rail-clear" onClick={() => setF(noFilters(maxDur))}>Clear</button>
      </div>
      <div className="flt-rail-body">
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
      </div>
    </aside>
  );
}

/* ── recent searches (localStorage) ───────────────────────────────────────── */
const RECENT_KEY = "hh.flt.recent";
interface RecentSearch { from: Airport; to: Airport; date: string; returnDate: string; tripType: "one" | "round"; pax: Pax3; cabin: string; ts: number }
type RecentInput = Omit<RecentSearch, "ts">;

function readRecent(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try { const r = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); return Array.isArray(r) ? r.slice(0, 6) : []; } catch { return []; }
}
function pushRecent(input: RecentInput): RecentSearch[] {
  // timestamp generated here (module scope) to keep the caller render-pure
  const s: RecentSearch = { ...input, ts: Date.now() };
  const cur = readRecent().filter((x) => !(x.from.iata === s.from.iata && x.to.iata === s.to.iata && x.date === s.date));
  const next = [s, ...cur].slice(0, 6);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

/* ── search + results ─────────────────────────────────────────────────────── */
export function FlightsScreen({ bookingEnabled, embedded = false }: { bookingEnabled: boolean; embedded?: boolean }) {
  const today = useMemo(() => new Date(), []);
  const iso = (d: Date) => isoOf(d);
  // The initial dates render on the server (UTC) then hydrate on the client
  // (SG) — isoOf uses LOCAL parts, so for SG 00:00–08:00 the two disagree by a
  // day (hydration mismatch). Format the DEFAULTS in SG so both agree and they
  // line up with the SG-local calendar; isoOf stays for user interaction.
  const sgISO = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(d);
  const [tab, setTab] = useState<"search" | "ai">("search");
  const [tripType, setTripType] = useState<"one" | "round">("one");
  const [nonStop, setNonStop] = useState(false);
  const [from, setFrom] = useState<Airport | null>(null);
  const [to, setTo] = useState<Airport | null>(null);
  const [date, setDate] = useState<string | null>(sgISO(new Date(today.getTime() + 30 * 864e5)));
  const [returnDate, setReturnDate] = useState<string | null>(sgISO(new Date(today.getTime() + 37 * 864e5)));
  const [pax, setPax] = useState<Pax3>({ adults: 1, children: 0, infants: 0 });
  const [cabin, setCabin] = useState("ECONOMY");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FlightItinerary[] | null>(null);
  const [note, setNote] = useState("");
  const [sort, setSort] = useState<"best" | "cheapest" | "fastest">("best");
  const [f, setF] = useState<Filters>(noFilters(3000));
  const [calendar, setCalendar] = useState<{ date: string; price: number | null }[] | null>(null);
  const [searched, setSearched] = useState<{ origin: string; destination: string; date: string } | null>(null);
  const [track, setTrack] = useState<{ open: boolean; email: string; msg: string }>({ open: false, email: "", msg: "" });
  const [recent, setRecent] = useState<RecentSearch[]>([]);

  /* ── AI search state ── */
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiItins, setAiItins] = useState<FlightItinerary[] | null>(null);
  const [aiSimulated, setAiSimulated] = useState(false);

  useEffect(() => { setRecent(readRecent()); }, []);

  const adults = pax.adults;

  const swap = () => { setFrom(to); setTo(from); };

  const runSearch = async (searchDate: string, originOv?: Airport, destOv?: Airport) => {
    const o = originOv || from;
    const dst = destOv || to;
    if (!o || !dst) { setNote("Pick origin and destination airports."); return; }
    setLoading(true); setNote(""); setCalendar(null); setTrack({ open: false, email: "", msg: "" });
    setRecent(pushRecent({ from: o, to: dst, date: searchDate, returnDate: returnDate || "", tripType, pax, cabin }));
    try {
      const r = await fetch("/api/travel/flights/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: o.iata, destination: dst.iata, date: searchDate, returnDate: tripType === "round" ? returnDate : "", tripType, adults: pax.adults, children: pax.children, infants: pax.infants, cabin, nonStop, currency: "SGD" }),
      });
      const d = await r.json();
      if (d.ok) {
        const list: FlightItinerary[] = d.itineraries || [];
        analytics.search(`flight:${o.iata}-${dst.iata}`, list.length);
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

  const submit = (e: FormEvent) => { e.preventDefault(); if (date) runSearch(date); };

  const pickDay = (d: string) => { setDate(d); runSearch(d); };

  const askAi = async (e: FormEvent) => {
    e.preventDefault();
    const query = aiQuery.trim();
    if (query.length < 4) return;
    setAiLoading(true); setAiAnswer(null); setAiItins(null); setAiSimulated(false);
    analytics.aiQuery(query);
    try {
      const r = await fetch("/api/travel/flights/ai-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
      const d = await r.json();
      setAiAnswer(d.answer || "Tell me where you'd like to fly and I'll find Muslim-friendly options.");
      setAiItins((d.itineraries as FlightItinerary[]) || []);
      setAiSimulated(!!d.simulated);
    } catch {
      setAiAnswer("Couldn't reach the concierge right now — try the Search tab.");
      setAiItins([]);
    }
    setAiLoading(false);
  };

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

  const replayRecent = (s: RecentSearch) => {
    setTab("search");
    setFrom(s.from); setTo(s.to); setTripType(s.tripType); setDate(s.date);
    setReturnDate(s.returnDate || null); setPax(s.pax); setCabin(s.cabin);
    runSearch(s.date, s.from, s.to);
  };

  // Deep link: /travel/flights?to=JED[&from=SIN][&date=YYYY-MM-DD] pre-fills the
  // route and runs the search once on mount (used by the landing's "Fly there"
  // promo cards). Reads window.location to avoid a Suspense boundary; a no-op when
  // there's no valid ?to= (e.g. the embedded unified /travel URL).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const toIata = (sp.get("to") || "").trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(toIata)) return;
    const fromIata = (sp.get("from") || "").trim().toUpperCase();
    const qDate = (sp.get("date") || "").trim();
    const lookup = (code: string): Airport => {
      const r = POPULAR_ROUTES.find((p) => p.iata === code);
      if (r) return { iata: r.iata, name: r.name, city: r.city, country: r.country };
      if (code === SG_ORIGIN.iata) return SG_ORIGIN;
      return { iata: code, name: code, city: "", country: "" };
    };
    const o = /^[A-Z]{3}$/.test(fromIata) ? lookup(fromIata) : SG_ORIGIN;
    const dst = lookup(toIata);
    const d = /^\d{4}-\d{2}-\d{2}$/.test(qDate) ? qDate : date;
    setTab("search"); setFrom(o); setTo(dst);
    if (d) { setDate(d); runSearch(d, o, dst); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nearby = searched ? { from: nearbyAirports(searched.origin), to: nearbyAirports(searched.destination) } : { from: [], to: [] };
  const cheapestDay = calendar ? calendar.reduce((m, d) => (d.price != null && (m == null || d.price < m) ? d.price : m), null as number | null) : null;

  const airlines = useMemo(() => [...new Set((items || []).flatMap((x) => x.carriers))].sort(), [items]);
  const filtered = useMemo(() => (items ? sortItineraries(applyFilters(items, f), sort) : []), [items, f, sort]);
  const headline = (mode: "best" | "cheapest" | "fastest") => {
    const top = items && items.length ? sortItineraries(applyFilters(items, f), mode)[0] : null;
    return top ? `${top.currency} ${Math.round(top.price ?? 0)} · ${fmtDuration(top.durationMin)}` : "";
  };

  /* The search card (Search/Ask-AI sub-tabs + the search box). Rendered overlaid
     inside the hero when standalone, or in normal flow when embedded. */
  const searchCard = (
    <>
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
          <form onSubmit={submit}>
            <div className="ota-optrow">
              <div className="ota-pill-group" role="tablist" aria-label="Trip type">
                <button type="button" role="tab" aria-selected={tripType === "round"} className={`ota-pill ${tripType === "round" ? "on" : ""}`} onClick={() => setTripType("round")}>Round trip</button>
                <button type="button" role="tab" aria-selected={tripType === "one"} className={`ota-pill ${tripType === "one" ? "on" : ""}`} onClick={() => setTripType("one")}>One way</button>
              </div>
              <label className="ota-check"><input type="checkbox" checked={nonStop} onChange={(e) => setNonStop(e.target.checked)} /> Non-stop only</label>
              <span className="flt-hijri-inline">{formatHijri(date || iso(today))}{hijriSeason(date || iso(today)) ? <em className="flt-season"> · {hijriSeason(date || iso(today))!.label}</em> : null}</span>
            </div>

            <div className="ota-search-row">
              <div className="ota-seg ota-seg-where">
                <span className="ota-seg-label">From</span>
                <AirportInput value={from} onPick={setFrom} placeholder="City or airport (e.g. SIN)" label="From" plain />
              </div>
              <button type="button" className="ota-swap" onClick={swap} aria-label="Swap origin and destination"><Icon name="refresh" size={16} /></button>
              <div className="ota-seg ota-seg-where">
                <span className="ota-seg-label">To</span>
                <AirportInput value={to} onPick={setTo} placeholder="City or airport (e.g. JED)" label="To" plain />
              </div>
              <DateRangeField
                checkin={date}
                checkout={tripType === "round" ? returnDate : null}
                onChange={(ci, co) => { setDate(ci); if (tripType === "round") setReturnDate(co); }}
                startLabel={tripType === "round" ? "Dates" : "Departure"}
                singleDate={tripType !== "round"}
              />
              <PassengersField value={pax} cabin={cabin} onChange={setPax} onCabin={setCabin} />
              <button className="ota-search-go btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Searching…" : <><Icon name="search" size={17} /> Search</>}
              </button>
            </div>

            <div className="flt-umrah">
              <span className="flt-umrah-label"><Icon name="moon" size={13} /> Umrah &amp; Hajj</span>
              <button type="button" onClick={() => setTo({ iata: "JED", city: "Jeddah", name: "King Abdulaziz Intl", country: "Saudi Arabia" })}>Jeddah (JED)</button>
              <button type="button" onClick={() => setTo({ iata: "MED", city: "Madinah", name: "Prince Mohammad bin Abdulaziz", country: "Saudi Arabia" })}>Madinah (MED)</button>
            </div>
          </form>
        ) : (
          <form className="ota-ai-row" onSubmit={askAi}>
            <div className="ota-ai-input">
              <Icon name="sparkles" size={18} className="ai-spark" />
              <input
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="e.g. Cheapest Umrah flights from Singapore to Jeddah next month, 2 adults"
                aria-label="Describe the flights you're looking for"
              />
            </div>
            <button className="ota-search-go btn btn-primary" type="submit" disabled={aiLoading}>{aiLoading ? "Finding…" : "Find flights"}</button>
          </form>
        )}
      </div>
    </>
  );

  /* Results + pre-search content (the part below the hero). `withLanding` adds the
     standalone FlightsLanding (omitted when embedded — shared promo handles it). */
  const resultsRegion = (withLanding: boolean) => (
    <div className="hh-wrap hh-section">
      {/* ── AI answer + results ── */}
      {tab === "ai" && (aiLoading || aiAnswer) && (
        <section className="flt-ai-results" style={{ marginBottom: 36 }}>
          {aiAnswer && <AiAnswer>{aiAnswer}</AiAnswer>}
          {aiSimulated && <p className="muted" style={{ fontSize: ".84rem", marginTop: 8 }}>Preview — live fares aren&apos;t connected yet, so the flights below are illustrative.</p>}
          {aiLoading ? (
            <div className="flt-list" style={{ marginTop: 16 }}>{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : aiItins && aiItins.length > 0 ? (
            <div className="flt-list" style={{ marginTop: 16 }}>{aiItins.map((it, i) => <ItineraryCard key={it.offerId || i} it={it} bookingEnabled={bookingEnabled} adults={adults} />)}</div>
          ) : aiItins ? (
            <p className="muted" style={{ marginTop: 12 }}>No flights to show yet — add a route to your request, or try the Search tab.</p>
          ) : null}
        </section>
      )}

      {note && tab === "search" ? <p className="muted" style={{ marginBottom: 14 }}>{note}</p> : null}
      {loading && tab === "search" && (
        <div className="flt-list" style={{ marginBottom: 40 }}>{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      )}

      {tab === "search" && items && items.length > 0 ? (
        <div className="flt-layout">
          <FilterRail all={items} f={f} setF={setF} airlines={airlines} />
          <div>
            {calendar && calendar.length > 1 && (
              <div className="flt-cal" role="group" aria-label="Flexible dates">
                {calendar.map((c) => (
                  <button key={c.date} type="button" className={`flt-cal-day ${searched?.date === c.date ? "on" : ""} ${c.price != null && c.price === cheapestDay ? "cheap" : ""}`} onClick={() => pickDay(c.date)}>
                    <span className="flt-cal-d">{parseISO(c.date).toLocaleDateString("en", { weekday: "short", day: "numeric" })}</span>
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
                {nearby.from.map((a) => { const ap = { iata: a.iata, name: a.name, city: a.city, country: a.country }; return <button key={`f${a.iata}`} type="button" className="flt-nearby-chip" onClick={() => { setFrom(ap); if (date) runSearch(date, ap); }}>From {a.city} ({a.iata})</button>; })}
                {nearby.to.map((a) => { const ap = { iata: a.iata, name: a.name, city: a.city, country: a.country }; return <button key={`t${a.iata}`} type="button" className="flt-nearby-chip" onClick={() => { setTo(ap); if (date) runSearch(date, undefined, ap); }}>To {a.city} ({a.iata})</button>; })}
              </div>
            )}
          </div>
        </div>
      ) : tab === "search" && !items ? (
        <>
          {/* trending destinations */}
          <Carousel title="Trending destinations" ariaLabel="Trending halal-travel destinations">
            {POPULAR_ROUTES.map((d) => (
              <button key={d.iata} type="button" className="ota-citem flt-trend" onClick={() => { const dst = { iata: d.iata, name: d.name, city: d.city, country: d.country }; setFrom(SG_ORIGIN); setTo(dst); if (date) runSearch(date, SG_ORIGIN, dst); }}>
                <span className="flt-trend-ico"><Icon name="plane" size={18} /></span>
                <span className="flt-trend-main">
                  <span className="flt-trend-route">Singapore <Icon name="arrow" size={12} /> {d.city}</span>
                  <span className="flt-trend-sub">{d.name}{d.tag ? ` · ${d.tag}` : ""}</span>
                </span>
                {d.tag ? <span className="frc-tag">{d.tag}</span> : null}
              </button>
            ))}
          </Carousel>

          {recent.length > 0 && (
            <Carousel title="Your recent searches" ariaLabel="Your recent flight searches">
              {recent.map((s, i) => (
                <button key={`${s.from.iata}-${s.to.iata}-${s.ts}-${i}`} type="button" className="ota-citem ota-recent" onClick={() => replayRecent(s)}>
                  <span className="ota-recent-ico"><Icon name="clock" size={18} /></span>
                  <span className="ota-recent-main">
                    <p>{s.from.city || s.from.iata} → {s.to.city || s.to.iata}</p>
                    <p>{parseISO(s.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{s.tripType === "round" && s.returnDate ? ` – ${parseISO(s.returnDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""} · {s.pax.adults + s.pax.children + s.pax.infants} traveller{s.pax.adults + s.pax.children + s.pax.infants === 1 ? "" : "s"}</p>
                  </span>
                </button>
              ))}
            </Carousel>
          )}

          {withLanding && <FlightsLanding onRoute={(o, d) => { setFrom(o); setTo(d); if (date) runSearch(date, o, d); }} />}
        </>
      ) : null}

      {items && tab === "search" ? <p className="travel-disclaimer" style={{ marginTop: 24 }}>Flights are provided via our travel partner. Confirm baggage allowance, times and fare rules before booking.</p> : null}
    </div>
  );

  // Embedded in the unified /travel landing: no own hero/Crumbs/landing.
  if (embedded) {
    return (
      <div className="flt-embedded">
        <div className="hh-wrap">{searchCard}</div>
        {resultsRegion(false)}
      </div>
    );
  }

  // Standalone /travel/flights: overlaid hero + FlightsLanding below.
  return (
    <div className="screen-in hh-page">
      <Crumbs trail={[{ label: "Home", href: "/" }, { label: "Travel", href: "/travel" }, { label: "Flights" }]} />
      <section className="ota-hero flt-hero">
        <Image className="ota-hero-media" src={HERO_IMG} alt="" aria-hidden fill priority sizes="100vw" style={{ objectFit: "cover" }} />
        <div className="ota-hero-scrim pattern" />
        <div className="hh-wrap">
          <div className="ota-hero-head">
            <span className="eyebrow"><Icon name="crescent" size={13} /> Halal travel</span>
            <h1>Search hundreds of airlines at once</h1>
            <p className="sub">Find the best fares for Umrah, Hajj and Muslim travel — flagged for Muslim meals, prayer-room layovers and the qibla at your destination.</p>
          </div>
          {searchCard}
        </div>
      </section>
      {resultsRegion(true)}
    </div>
  );
}
