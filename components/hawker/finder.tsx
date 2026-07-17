"use client";

/* Hawker finder — split map + filterable centre list. Client island fed with
   server-fetched centres + per-centre stall aggregates. Filters are honest
   centre-level facts ("has MUIS-certified stalls"); distance sort activates
   only after the user grants location. */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { HawkerMap } from "@/components/hawker-map";
import { haversineKm, formatKm } from "@/lib/geo";
import type { HawkerCentre } from "@/lib/hawker";

export interface FinderAggregates {
  [centreId: string]: { count: number; muis: number; muslimOwned: number };
}

type LatLng = { lat: number; lng: number };
type Filter = "muis" | "owned" | "mrt";

export function HawkerFinder({
  centres,
  aggregates,
  regions,
}: {
  centres: HawkerCentre[];
  aggregates: FinderAggregates;
  regions: { id: string; label: string }[];
}) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string>("all");
  const [filters, setFilters] = useState<Set<Filter>>(new Set());
  const [me, setMe] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locErr, setLocErr] = useState("");

  const toggle = (f: Filter) =>
    setFilters((s) => {
      const next = new Set(s);
      if (next.has(f)) next.delete(f); else next.add(f);
      return next;
    });

  const locate = () => {
    if (!navigator.geolocation) { setLocErr("Location isn’t available in this browser."); return; }
    setLocating(true); setLocErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => { setLocErr("Couldn’t get your location — check permissions."); setLocating(false); },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
  };

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    let out = centres.filter((c) => {
      if (region !== "all" && (c.region || "Other") !== region) return false;
      const a = aggregates[c.id];
      if (filters.has("muis") && !(a?.muis)) return false;
      if (filters.has("owned") && !(a?.muslimOwned)) return false;
      if (filters.has("mrt") && !c.nearestMrt) return false;
      if (query && !`${c.name} ${c.address || ""} ${c.nearestMrt || ""}`.toLowerCase().includes(query)) return false;
      return true;
    });
    if (me) {
      out = [...out].sort((x, y) => {
        const dx = x.lat != null && x.lng != null ? haversineKm(me, { lat: x.lat, lng: x.lng! }) : Infinity;
        const dy = y.lat != null && y.lng != null ? haversineKm(me, { lat: y.lat, lng: y.lng! }) : Infinity;
        return dx - dy;
      });
    }
    return out;
  }, [centres, aggregates, q, region, filters, me]);

  const distanceOf = (c: HawkerCentre) =>
    me && c.lat != null && c.lng != null ? formatKm(haversineKm(me, { lat: c.lat, lng: c.lng })) : null;

  return (
    <div className="hk-finder">
      <div className="hk-searchrow">
        <form className="searchbar hk-search" role="search" onSubmit={(e) => e.preventDefault()}>
          <Icon name="search" size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by hawker centre, dish or neighbourhood"
            aria-label="Search hawker centres"
          />
        </form>
        <button type="button" className="btn btn-gold hk-locate" onClick={locate} disabled={locating}>
          <Icon name="pin" size={15} /> {locating ? "Locating…" : me ? "Location on" : "Use my location"}
        </button>
      </div>
      {locErr && <p className="field-error" style={{ marginTop: 6 }}><Icon name="warning" size={13} /> {locErr}</p>}

      <div className="hk-filters" aria-label="Filter centres">
        <select className="select hk-region-sel" value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region">
          <option value="all">All regions</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
        {([
          ["muis", "MUIS-certified stalls"],
          ["owned", "Muslim-owned stalls"],
          ["mrt", "Near MRT"],
        ] as [Filter, string][]).map(([f, label]) => (
          <button key={f} type="button" className={`chip ${filters.has(f) ? "active" : ""}`} onClick={() => toggle(f)} aria-pressed={filters.has(f)}>
            {label}
          </button>
        ))}
      </div>

      <div className="hk-split">
        <div className="hk-map">
          <HawkerMap centres={list} numbered height="100%" />
        </div>
        <div className="hk-list">
          <div className="hk-list-head">
            <strong>{list.length} hawker centre{list.length === 1 ? "" : "s"}</strong>
            {me && <span className="faint" style={{ fontSize: ".78rem" }}>sorted by distance</span>}
          </div>
          {list.length === 0 && (
            <div className="card" style={{ padding: 22, textAlign: "center" }}>
              <p className="muted">No centres match — try clearing a filter.</p>
            </div>
          )}
          {list.map((c, i) => {
            const a = aggregates[c.id];
            const dist = distanceOf(c);
            return (
              <Link key={c.id} href={`/hawker/${c.id}`} className="hk-centre-card">
                <span className="hk-centre-num" aria-hidden="true">{i + 1}</span>
                <span className="hk-monogram hk-mono-sm" aria-hidden="true">{c.name.replace(/[^A-Za-z0-9]/g, "")[0] || "H"}</span>
                <span className="hk-centre-body">
                  <strong>{c.name}</strong>
                  <span className="hk-centre-meta">
                    {[c.region, c.nearestMrt && `Near ${c.nearestMrt}`].filter(Boolean).join(" · ")}
                  </span>
                  <span className="hk-centre-meta">
                    {[a?.count ? `${a.count} halal stall${a.count === 1 ? "" : "s"}` : null, c.hours].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="hk-centre-side">
                  {dist && <em>{dist}</em>}
                  <span className="hk-view">View stalls →</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
