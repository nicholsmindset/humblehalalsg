"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapView, type MapPoint } from "@/components/map/map-view";
import { SG_CENTER } from "@/lib/data";
import { directionsUrl, formatKm, haversineKm, mapsSearchUrl } from "@/lib/geo";
import type { LatLng } from "@/lib/types";
import type { PrayerSpace, PrayerSpaceCategory } from "@/lib/prayer-spaces";

type CategoryFilter = {
  id: PrayerSpaceCategory;
  label: string;
  blurb: string;
};

type ActiveFilter = PrayerSpaceCategory | "all";

function centroid(spaces: PrayerSpace[]): LatLng {
  const withCoords = spaces.filter((p): p is PrayerSpace & { coords: LatLng } => !!p.coords);
  if (!withCoords.length) return SG_CENTER;
  return {
    lat: withCoords.reduce((sum, p) => sum + p.coords.lat, 0) / withCoords.length,
    lng: withCoords.reduce((sum, p) => sum + p.coords.lng, 0) / withCoords.length,
  };
}

function categoryLabel(categories: CategoryFilter[], id: PrayerSpaceCategory) {
  return categories.find((c) => c.id === id)?.label || id;
}

export function PrayerRoomsDirectory({
  spaces,
  categories,
}: {
  spaces: PrayerSpace[];
  categories: CategoryFilter[];
}) {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const filtered = useMemo(
    () => spaces.filter((p) => activeFilter === "all" || p.category === activeFilter),
    [activeFilter, spaces],
  );

  const activeSpace = useMemo(
    () => filtered.find((p) => p.id === activeId) || null,
    [activeId, filtered],
  );

  useEffect(() => {
    if (!activeId) return;
    cardRefs.current[activeId]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (!userLoc) return copy;
    return copy.sort((a, b) => {
      if (!a.coords && !b.coords) return a.name.localeCompare(b.name);
      if (!a.coords) return 1;
      if (!b.coords) return -1;
      return haversineKm(userLoc, a.coords) - haversineKm(userLoc, b.coords);
    });
  }, [filtered, userLoc]);

  const points: MapPoint[] = useMemo(() => {
    const roomPoints: MapPoint[] = filtered
      .filter((p): p is PrayerSpace & { coords: LatLng } => !!p.coords)
      .map((p) => ({
        id: p.id,
        name: p.name,
        coords: p.coords,
        kind: "prayer-room" as const,
        active: p.id === activeId,
        meta: [p.area, p.type].filter(Boolean).join(" · "),
        distance: userLoc ? formatKm(haversineKm(userLoc, p.coords)) : undefined,
      }));
    return userLoc
      ? [{ id: "you", name: "You are here", coords: userLoc, kind: "user" as const }, ...roomPoints]
      : roomPoints;
  }, [activeId, filtered, userLoc]);

  const mapCenter = activeSpace?.coords || userLoc || centroid(filtered);
  const activeCategory = activeFilter === "all" ? null : categories.find((c) => c.id === activeFilter);
  const grouped = categories
    .map((c) => ({ ...c, items: sorted.filter((p) => p.category === c.id) }))
    .filter((g) => g.items.length);

  const useLocation = () => {
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError("Location is not available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocError("Could not get your location. Check browser permission and try again.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 300000 },
    );
  };

  const filterCount = (id: ActiveFilter) =>
    id === "all" ? spaces.length : spaces.filter((p) => p.category === id).length;

  return (
    <div className="prayer-map-shell" id="prayer-map">
      <div className="prayer-map-head">
        <div>
          <span className="eyebrow">Find by area type</span>
          <h2>Use the filters to focus the map</h2>
          <p className="muted">
            Select a category to redraw the pins and cards. Tap a pin to get directions and the level or landmark notes.
          </p>
        </div>
        <button type="button" className="btn btn-soft" onClick={useLocation} disabled={locating}>
          {locating ? "Finding you..." : userLoc ? "Nearest first on" : "Use my location"}
        </button>
      </div>

      <div className="prayer-filterbar" role="tablist" aria-label="Prayer room category filters">
        <button
          type="button"
          className={`prayer-filter ${activeFilter === "all" ? "on" : ""}`}
          onClick={() => { setActiveFilter("all"); setActiveId(null); }}
          aria-pressed={activeFilter === "all"}
        >
          All prayer rooms <span>{filterCount("all")}</span>
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`prayer-filter ${activeFilter === c.id ? "on" : ""}`}
            onClick={() => { setActiveFilter(c.id); setActiveId(null); }}
            aria-pressed={activeFilter === c.id}
          >
            {c.label} <span>{filterCount(c.id)}</span>
          </button>
        ))}
      </div>

      {locError && <p className="prayer-map-error">{locError}</p>}

      <div className="prayer-map-layout">
        <div className="map-canvas prayer-map-canvas">
          <MapView
            center={mapCenter}
            zoom={activeSpace ? 15 : userLoc ? 12 : 11}
            points={points}
            onSelect={(id) => { if (id !== "you") setActiveId(id); }}
            fit={!activeSpace}
          />
        </div>
        <aside className="prayer-map-panel" aria-live="polite">
          <div className="prayer-map-kicker">
            <strong>{filtered.length}</strong>
            <span>{activeCategory?.label || "All prayer rooms"}</span>
          </div>
          <p className="muted">
            {activeCategory?.blurb || "All non-mosque prayer spaces in the directory, grouped by venue type below."}
          </p>
          {activeSpace ? (
            <div className="prayer-selected">
              <span className="prayer-chip">{categoryLabel(categories, activeSpace.category)}</span>
              <h3>{activeSpace.name}</h3>
              <p className="prayer-selected-loc">{activeSpace.location}</p>
              <p className="muted">{activeSpace.notes}</p>
              {userLoc && activeSpace.coords && (
                <p className="prayer-distance">{formatKm(haversineKm(userLoc, activeSpace.coords))} from your location</p>
              )}
              <div className="prayer-selected-actions">
                {activeSpace.coords && (
                  <a className="btn btn-primary btn-sm" href={directionsUrl(activeSpace.coords)} target="_blank" rel="noopener noreferrer">
                    Directions
                  </a>
                )}
                <a className="btn btn-soft btn-sm" href={mapsSearchUrl(`${activeSpace.name} Singapore`)} target="_blank" rel="noopener noreferrer">
                  Open in Maps
                </a>
              </div>
            </div>
          ) : (
            <div className="prayer-selected empty">
              <h3>Select a pin or card</h3>
              <p className="muted">
                The map will zoom to the room and show the exact level, landmark notes, and directions link here.
              </p>
            </div>
          )}
        </aside>
      </div>

      <p className="faint" style={{ fontSize: ".82rem", margin: "8px 0 26px" }}>
        Pins are building-level. Use the level and landmark notes below to find the room inside.
      </p>

      {(activeFilter === "all" ? grouped : [{ ...activeCategory!, items: sorted }]).map((g) => (
        <section key={g.id} id={g.id} className="mosque-region">
          <h2 className="mosque-region-h">
            {g.label}
            <span className="mosque-region-count">
              {g.items.length} spaces{userLoc ? " · nearest first" : ""}
            </span>
          </h2>
          <p className="muted" style={{ marginTop: -6, marginBottom: 14, fontSize: ".92rem" }}>{g.blurb}</p>
          <div className="prayer-grid">
            {g.items.map((p) => (
              <div
                key={p.id}
                ref={(el) => { cardRefs.current[p.id] = el; }}
                className={`prayer-card ${p.id === activeId ? "on" : ""}`}
                onClick={() => setActiveId(p.id)}
              >
                <div className="prayer-card-name">{p.name}</div>
                <div className="prayer-card-meta">
                  {p.area && <span className="prayer-chip">{p.area}</span>}
                  <span className="prayer-card-type">{p.type}</span>
                  {userLoc && p.coords && <span className="prayer-card-distance">{formatKm(haversineKm(userLoc, p.coords))}</span>}
                </div>
                <div className="prayer-card-loc">{p.location}</div>
                <div className="prayer-card-notes">{p.notes}</div>
                <div className="prayer-card-foot">
                  {p.source && <span className="prayer-card-src">{p.source}</span>}
                  <a
                    className="prayer-card-dir"
                    href={p.coords ? directionsUrl(p.coords) : mapsSearchUrl(`${p.name} Singapore`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Open directions to ${p.name}`}
                  >
                    Directions →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
