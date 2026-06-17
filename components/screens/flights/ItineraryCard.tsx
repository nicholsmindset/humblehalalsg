"use client";

/* Humble Halal — flight itinerary result card (zzzello-grade, emerald brand).
   Airline + leg rows · price · refundable/baggage/CO₂ tags · Select/Enquire ·
   expandable details · and the Muslim-traveller moat: Muslim-meal flag,
   prayer-room layovers, qibla at destination. */
import { useState } from "react";
import Link from "next/link";
import { Icon } from "../../ui";
import { fmtDuration, fmtTime, type FlightItinerary, type FlightLeg } from "@/lib/flights";
import { estimateCO2 } from "@/lib/carbon";
import { airportAmenity, PRAYER_LAYOVER_MIN } from "@/lib/airport-amenities";
import { airlineMeal } from "@/lib/airline-meals";
import { qiblaBearing, compassLabel } from "@/lib/qibla";
import { dayChange, legLayovers } from "./shared";

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

export function ItineraryCard({ it, bookingEnabled, adults }: { it: FlightItinerary; bookingEnabled: boolean; adults: number }) {
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
