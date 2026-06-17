"use client";

/* Humble Halal — flights shared bits: Airport type, airport autocomplete,
   passengers + cabin popover, leg/layover helpers, and landing constants
   (POPULAR_ROUTES / FLT_BENEFITS / FLT_FAQS). Pure/props-driven so the search,
   landing and card surfaces can all reuse them. */
import { useEffect, useState } from "react";
import { Icon } from "../../ui";
import { Popover, Stepper } from "../../ota";
import { fmtDuration, type FlightLeg } from "@/lib/flights";
import { searchLocalAirports } from "@/lib/airports";
import { airportAmenity, type AirportAmenity } from "@/lib/airport-amenities";

export interface Airport { iata: string; name: string; city: string; country: string }

/* layover stops within a leg (connection airports + how long the wait is) */
export function legLayovers(leg: FlightLeg): { iata: string; durationMin: number; amenity?: AirportAmenity }[] {
  const out: { iata: string; durationMin: number; amenity?: AirportAmenity }[] = [];
  for (let i = 0; i < leg.segments.length - 1; i++) {
    const a = leg.segments[i];
    const b = leg.segments[i + 1];
    const wait = a.arriveISO && b.departISO ? Math.max(0, Math.round((Date.parse(b.departISO) - Date.parse(a.arriveISO)) / 60000)) : 0;
    out.push({ iata: a.to, durationMin: wait, amenity: airportAmenity(a.to) });
  }
  return out;
}

export function dayChange(leg: FlightLeg): number {
  const a = leg.segments[leg.segments.length - 1]?.arriveISO?.slice(0, 10);
  const d = leg.segments[0]?.departISO?.slice(0, 10);
  if (!a || !d) return 0;
  return Math.round((Date.parse(a) - Date.parse(d)) / 86400000);
}

/* ── airport autocomplete (instant local + merged live) ───────────────────── */
export function AirportInput({ label, value, onPick, placeholder, plain }: { label?: string; value: Airport | null; onPick: (a: Airport | null) => void; placeholder: string; plain?: boolean }) {
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

  const input = (
    <div className="ac">
      <input
        value={q}
        placeholder={placeholder}
        aria-label={label}
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
  );

  if (plain) return input;

  return (
    <div className="field">
      {label ? <label>{label}</label> : null}
      {input}
    </div>
  );
}

/* ── passengers + cabin popover (flights need adults/children/infants) ──────── */
export interface Pax3 { adults: number; children: number; infants: number }
export const CABINS: [string, string][] = [
  ["ECONOMY", "Economy"],
  ["PREMIUM_ECONOMY", "Premium economy"],
  ["BUSINESS", "Business"],
  ["FIRST", "First"],
];
const cabinLabel = (v: string) => CABINS.find(([k]) => k === v)?.[1] || "Economy";

export function PassengersField({ value, cabin, onChange, onCabin, label = "Travellers" }: { value: Pax3; cabin: string; onChange: (p: Pax3) => void; onCabin: (c: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const total = value.adults + value.children + value.infants;
  const summary = `${total} traveller${total === 1 ? "" : "s"} · ${cabinLabel(cabin)}`;
  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      align="right"
      panelLabel={label}
      trigger={
        <button type="button" className="ota-seg" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open}>
          <span className="ota-seg-label">{label}</span>
          <span className="ota-seg-value">{summary}</span>
        </button>
      }
    >
      <div className="ota-stepper">
        <Stepper label="Adults" sub="Age 12+" value={value.adults} min={1} max={9} onChange={(v) => onChange({ ...value, adults: v })} />
        <Stepper label="Children" sub="Age 2–11" value={value.children} min={0} max={8} onChange={(v) => onChange({ ...value, children: v })} />
        <Stepper label="Infants" sub="Under 2" value={value.infants} min={0} max={Math.max(1, value.adults)} onChange={(v) => onChange({ ...value, infants: v })} />
        <div className="flt-cabin-row">
          <label htmlFor="flt-cabin-sel">Cabin</label>
          <select id="flt-cabin-sel" value={cabin} onChange={(e) => onCabin(e.target.value)}>
            {CABINS.map(([k, lbl]) => <option key={k} value={k}>{lbl}</option>)}
          </select>
        </div>
        <div className="ota-step-done">
          <button type="button" className="btn btn-soft btn-sm" onClick={() => setOpen(false)}>Done</button>
        </div>
      </div>
    </Popover>
  );
}

export { fmtDuration };

/* ── pre-search landing constants (routes, benefits, FAQ) ─────────────────── */
export const SG_ORIGIN: Airport = { iata: "SIN", name: "Changi", city: "Singapore", country: "Singapore" };
export const POPULAR_ROUTES: (Airport & { tag?: string })[] = [
  { iata: "JED", city: "Jeddah", name: "King Abdulaziz Intl", country: "Saudi Arabia", tag: "Umrah" },
  { iata: "MED", city: "Madinah", name: "Prince Mohammad bin Abdulaziz", country: "Saudi Arabia", tag: "Umrah" },
  { iata: "IST", city: "Istanbul", name: "Istanbul Airport", country: "Türkiye" },
  { iata: "DXB", city: "Dubai", name: "Dubai Intl", country: "United Arab Emirates" },
  { iata: "CAI", city: "Cairo", name: "Cairo Intl", country: "Egypt" },
  { iata: "KUL", city: "Kuala Lumpur", name: "KLIA", country: "Malaysia" },
  { iata: "CGK", city: "Jakarta", name: "Soekarno-Hatta", country: "Indonesia" },
  { iata: "DOH", city: "Doha", name: "Hamad Intl", country: "Qatar" },
];
export const FLT_BENEFITS: [string, string, string][] = [
  ["moon", "Muslim meals, flagged", "See at a glance which airlines serve a Muslim meal (MOML) on request, and which cabins are alcohol-free — before you book."],
  ["mosque", "Prayer-aware layovers", "We highlight connecting airports with a prayer room and tell you whether your layover is long enough to pray, plus the qibla at your destination."],
  ["crescent", "Built for Umrah & Hajj", "Jeddah and Madinah presets, Hijri dates and Ramadan / Hajj-season awareness — travel planning that understands your pilgrimage."],
  ["bed", "One trip, planned together", "Pair your flight with a Muslim-friendly hotel — prayer rooms, halal dining nearby and alcohol-free stays — in one place."],
  ["clock", "Hundreds of airlines, real fares", "Compare live prices across hundreds of airlines and find the cheapest day to fly with our flexible-date calendar."],
  ["shield-check", "Book with confidence", "Transparent pricing, fare-drop alerts and secure payment handled by our trusted travel partner."],
];
export const FLT_FAQS: [string, string][] = [
  ["Do you show which airlines serve a Muslim meal?", "Yes. Results flag carriers that offer a Muslim meal (MOML) on request, and note alcohol-free cabins where applicable. Always request the meal with the airline and confirm before you fly."],
  ["Can I see prayer facilities for my layover?", "Yes. For connecting airports with a documented prayer room or musalla, we show the facility and whether your layover is long enough to pray comfortably, plus the qibla direction at your destination."],
  ["Is this built for Umrah and Hajj travel?", "Absolutely. Use the Jeddah and Madinah presets, see the Hijri date and Ramadan/Hajj-season flags, and pair your flight with a Muslim-friendly hotel near the Haramain."],
  ["Can I book flights and a hotel together?", "You can search flights and a Muslim-friendly stay — with prayer rooms, halal dining nearby and alcohol-free options — in one place, so your whole trip is planned together."],
  ["When am I charged, and who handles payment?", "Payment is handled securely by our travel partner, and you're never charged without a confirmed booking. Baggage, times and fare rules are shown before you pay."],
];
