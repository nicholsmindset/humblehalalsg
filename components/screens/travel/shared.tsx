"use client";

/* Humble Halal — travel-screen shared bits: helpers, halal filters, destination
   autocomplete, breadcrumbs, halal chip, destination card. Pure/props-driven. */
import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "../../ui";
import {
  activeFlagLabels,
  countryLabel,
  type Hotel,
  type HotelFlags,
} from "@/lib/halal-hotels";
import type { TravelHub } from "@/lib/travel-hubs";
import type { Dest } from "./types";

/* ── helpers ──────────────────────────────────────────────────────────────── */

export function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function niceDate(iso?: string): string {
  if (!iso) return "";
  const [, m, d] = iso.split("-").map(Number);
  const mo = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][(m || 1) - 1];
  return `${d} ${mo}`;
}

export function dist(m: number): string {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

/* ── halal chip ───────────────────────────────────────────────────────────── */

export function HalalChip({ hotel, compact }: { hotel: Hotel; compact?: boolean }) {
  const flags = activeFlagLabels(hotel.flags);
  const show = hotel.verified || flags.length > 0 || hotel.halalScore >= 45;
  if (!show) return null;
  return (
    <span
      className={`halal-chip ${hotel.verified ? "verified" : ""}`}
      title={hotel.verified ? "Verified Muslim-friendly by our team" : "Muslim-friendly facilities (unverified)"}
    >
      <Icon name="crescent" size={12} /> {hotel.verified ? "Verified " : ""}Muslim-friendly{compact ? "" : ` · ${hotel.halalScore}`}
    </span>
  );
}

/* ── destination card ─────────────────────────────────────────────────────── */

export function DestinationCard({ c }: { c: TravelHub }) {
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

/* ── breadcrumbs ──────────────────────────────────────────────────────────── */

export function Crumbs({ trail }: { trail: { label: string; href?: string }[] }) {
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

export { countryLabel };

/* ── halal filters ────────────────────────────────────────────────────────── */

export const HOTEL_FILTERS: { key: keyof HotelFlags; label: string; alt?: keyof HotelFlags }[] = [
  { key: "has_prayer_room", label: "Prayer room" },
  { key: "halal_food_onsite", label: "Halal food", alt: "halal_food_nearby" },
  { key: "alcohol_free", label: "Alcohol-free" },
  { key: "women_only_facilities", label: "Women-only" },
  { key: "near_mosque", label: "Near mosque" },
];

export function matchesFilters(h: Hotel, active: string[]): boolean {
  return active.every((k) => {
    const f = HOTEL_FILTERS.find((x) => x.key === k);
    if (!f) return true;
    return h.flags[f.key] || (f.alt ? h.flags[f.alt] : false);
  });
}

/** Which halal filters have at least one matching hotel in this list. We only
 *  show filters we have data for, so a filter can never blank the whole page. */
export function availableFilters(hotels: Hotel[]): typeof HOTEL_FILTERS {
  return HOTEL_FILTERS.filter((f) => hotels.some((h) => h.flags[f.key] || (f.alt ? h.flags[f.alt] : false)));
}

export function FilterBar({ active, setActive, options }: { active: string[]; setActive: (a: string[]) => void; options: typeof HOTEL_FILTERS }) {
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

/* ── destination autocomplete ─────────────────────────────────────────────── */

export function PlaceAutocomplete({ cities, value, onPick }: { cities: TravelHub[]; value: Dest | null; onPick: (d: Dest) => void }) {
  const [q, setQ] = useState(value?.label || "");
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState<{ placeId: string; name: string; address: string }[]>([]);
  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 2) { setPlaces([]); return; }
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
