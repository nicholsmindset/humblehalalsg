"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import Supercluster from "supercluster";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/types";

export interface MapPoint {
  id: string;
  name: string;
  coords: LatLng;
  active?: boolean;
  kind?: "listing" | "mosque" | "prayer-room" | "hawker" | "user";
  /* Popup enrichment — all optional so thin callers (location picker,
     travel maps) keep working with just id/name/coords. Callers pre-format
     strings so this component stays free of directory/geo imports. */
  meta?: string;     // "Category · Area" (listing) / "Area · Type" (prayer room)
  badge?: string;    // halal trust label, e.g. "MUIS-certified"
  distance?: string; // pre-formatted, e.g. "1.2 km away"
  open?: boolean;    // true "Open now" / false "Closed" / undefined hidden
}

function pinIcon(point: MapPoint) {
  if (point.kind === "user") {
    return L.divIcon({
      className: "hh-pin-wrap",
      html: `<span class="hh-pin hh-pin-user" title="You are here"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }
  if (point.kind === "mosque") {
    // Round gold badge — visually distinct from the emerald eatery teardrops.
    return L.divIcon({
      className: "hh-pin-wrap",
      html: `<span class="hh-mosque-pin ${point.active ? "on" : ""}" title="${point.name}"></span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }
  if (point.kind === "prayer-room") {
    // Round emerald badge — musollah (non-mosque prayer room).
    return L.divIcon({
      className: "hh-pin-wrap",
      html: `<span class="hh-prayer-pin ${point.active ? "on" : ""}" title="${point.name}"></span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }
  if (point.kind === "hawker") {
    // Round warm badge — hawker centre (distinct from mosque gold / prayer emerald).
    return L.divIcon({
      className: "hh-pin-wrap",
      html: `<span class="hh-hawker-pin ${point.active ? "on" : ""}" title="${point.name}"></span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }
  const cls = point.active ? "hh-pin hh-pin-active" : "hh-pin";
  return L.divIcon({
    className: "hh-pin-wrap",
    html: `<span class="${cls}"></span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });
}

/* When `fit` is on (nothing selected) frame ALL the markers — robust against
   container-size quirks and better UX than a single guessed center. When a pin
   or the user's location is active, fly to that point instead. */
function FitOrCenter({ center, zoom, points, fit }: { center: LatLng; zoom: number; points: MapPoint[]; fit: boolean }) {
  const map = useMap();
  const key = points.map((p) => p.id).join(",");
  useEffect(() => {
    map.invalidateSize();
    // flyTo/fitBounds interpolate using the container size; on a zero-size
    // container (mounted in a grid/flex cell that lays out AFTER the map) the
    // projection divides by zero → "Invalid LatLng (NaN,NaN)" thrown from an
    // effect (uncaught, not catchable by the React error boundary). Fall back
    // to an instant, size-independent setView until the container has a size.
    const size = map.getSize();
    const sized = size.x > 0 && size.y > 0;
    if (fit && points.length > 1) {
      const b = L.latLngBounds(points.map((p) => [p.coords.lat, p.coords.lng] as [number, number]));
      if (sized) map.fitBounds(b, { padding: [48, 48], maxZoom: 15, animate: false });
      else map.setView(b.getCenter(), zoom, { animate: false });
    } else if (sized) {
      map.flyTo([center.lat, center.lng], zoom, { duration: 0.5 });
    } else {
      map.setView([center.lat, center.lng], zoom, { animate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fit, key, points.length, center.lat, center.lng, zoom, map]);
  return null;
}

/* Keep Leaflet's internal size in sync with its container. Essential when the
   map lives in a grid/flex cell (split layout) that resolves its size AFTER the
   map mounts — without this the map renders the wrong area until interaction. */
function AutoSize() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    map.invalidateSize();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    // one more tick after first paint, for slow layout settles
    const raf = requestAnimationFrame(() => map.invalidateSize());
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [map]);
  return null;
}

// Lets the user drop/move the pin by tapping the map (location-picker mode).
function ClickToPick({ onPick }: { onPick: (c: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/* Scroll-wheel zoom only AFTER the user clicks into the map, released when the
   pointer leaves — an embedded map (explore preview) otherwise hijacks page
   scrolling the moment the cursor passes over it. */
function WheelGuard() {
  const map = useMap();
  useEffect(() => {
    map.scrollWheelZoom.disable();
    const el = map.getContainer();
    const enable = () => map.scrollWheelZoom.enable();
    const disable = () => map.scrollWheelZoom.disable();
    el.addEventListener("click", enable);
    el.addEventListener("focusin", enable);
    el.addEventListener("mouseleave", disable);
    return () => {
      el.removeEventListener("click", enable);
      el.removeEventListener("focusin", enable);
      el.removeEventListener("mouseleave", disable);
    };
  }, [map]);
  return null;
}

/* Deterministically spread points that share EXACT coordinates (mall tenants
   geocoded from one postal code) in a small ring so they stay separable once
   zoomed past cluster level. ~11m radius per ring step. */
function spreadStacked(points: MapPoint[]): MapPoint[] {
  const byCoord = new Map<string, number>();
  return points.map((p) => {
    const key = `${p.coords.lat.toFixed(6)},${p.coords.lng.toFixed(6)}`;
    const n = byCoord.get(key) ?? 0;
    byCoord.set(key, n + 1);
    if (n === 0) return p;
    const angle = n * 2.399963; // golden angle — even ring coverage
    const r = 0.0001 * (1 + Math.floor(n / 8));
    return { ...p, coords: { lat: p.coords.lat + r * Math.sin(angle), lng: p.coords.lng + r * Math.cos(angle) } };
  });
}

type ClusterProps = { point?: MapPoint };

/* Supercluster layer for listing pins — 300+ individual markers (each with a
   mounted popup) made the map slow and unreadable; clusters render one badge
   with a count and zoom in on tap. Mosque/user pins stay individual. */
function ClusterLayer({ points, renderPoint }: { points: MapPoint[]; renderPoint: (p: MapPoint) => React.ReactNode }) {
  const map = useMap();
  const spread = useMemo(() => spreadStacked(points), [points]);
  const index = useMemo(() => {
    const sc = new Supercluster<ClusterProps, ClusterProps>({ radius: 60, maxZoom: 16 });
    sc.load(spread.map((p) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [p.coords.lng, p.coords.lat] },
      properties: { point: p },
    })));
    return sc;
  }, [spread]);

  const [view, setView] = useState<{ bounds: [number, number, number, number]; zoom: number } | null>(null);
  useEffect(() => {
    const update = () => {
      const b = map.getBounds();
      setView({ bounds: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], zoom: map.getZoom() });
    };
    update();
    map.on("moveend", update);
    map.on("zoomend", update);
    return () => { map.off("moveend", update); map.off("zoomend", update); };
  }, [map]);

  const clusters = view ? index.getClusters(view.bounds, Math.round(view.zoom)) : [];
  return (
    <>
      {clusters.map((c) => {
        const [lng, lat] = c.geometry.coordinates;
        if (c.properties && "cluster" in c.properties && (c.properties as { cluster?: boolean }).cluster) {
          const count = (c.properties as { point_count: number }).point_count;
          const size = count >= 100 ? 44 : count >= 25 ? 38 : 32;
          const icon = L.divIcon({
            className: "hh-pin-wrap",
            html: `<span class="hh-cluster" style="width:${size}px;height:${size}px">${count}</span>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });
          const clusterId = c.id as number;
          return (
            <Marker
              key={`cluster-${clusterId}`}
              position={[lat, lng]}
              icon={icon}
              keyboard
              title={`${count} places — zoom in`}
              eventHandlers={{
                click: () => {
                  const z = Math.min(index.getClusterExpansionZoom(clusterId), 18);
                  map.flyTo([lat, lng], z, { duration: 0.4 });
                },
              }}
            />
          );
        }
        const p = (c.properties as ClusterProps).point!;
        return renderPoint(p);
      })}
    </>
  );
}

export default function LeafletMap({
  center,
  zoom = 13,
  points,
  onSelect,
  onView,
  onPick,
  fit = false,
}: {
  center: LatLng;
  zoom?: number;
  points: MapPoint[];
  onSelect?: (id: string) => void;
  /** Popup primary action — open the listing detail (or mosque directions). */
  onView?: (id: string, kind: string) => void;
  /** When set, the map becomes a single-pin location picker: tap the map or
   *  drag the marker to choose a precise spot. */
  onPick?: (c: LatLng) => void;
  /** Frame all markers (used on the results map when nothing is selected). */
  fit?: boolean;
}) {
  const renderPoint = (p: MapPoint) => {
    // Build handlers WITHOUT undefined values (passing dragend:undefined
    // makes Leaflet log "wrong listener type" for every marker).
    const handlers: L.LeafletEventHandlerFnMap = { click: () => onSelect?.(p.id) };
    if (onPick) {
      handlers.dragend = (e) => {
        const ll = (e.target as L.Marker).getLatLng();
        onPick({ lat: ll.lat, lng: ll.lng });
      };
    }
    return (
      <Marker
        key={p.id}
        position={[p.coords.lat, p.coords.lng]}
        icon={pinIcon(p)}
        draggable={!!onPick}
        eventHandlers={handlers}
        keyboard
        title={p.name}
      >
        {p.kind !== "user" && !onPick && (
          <Popup>
            <div className="hh-popcard">
              <strong className="hh-popcard-name">{p.name}</strong>
              {p.meta && <span className="hh-popcard-meta">{p.meta}</span>}
              {(p.badge || p.open != null || p.distance) && (
                <span className="hh-popcard-chips">
                  {p.badge && <em className="hh-popchip hh-popchip-halal">{p.badge}</em>}
                  {p.open != null && (
                    <em className={`hh-popchip ${p.open ? "hh-popchip-open" : "hh-popchip-closed"}`}>
                      {p.open ? "Open now" : "Closed"}
                    </em>
                  )}
                  {p.distance && <em className="hh-popchip">{p.distance}</em>}
                </span>
              )}
              <span className="hh-popcard-actions">
                {p.kind === "mosque" || p.kind === "prayer-room" ? (
                  <a className="btn btn-primary btn-sm" href={`https://www.google.com/maps/dir/?api=1&destination=${p.coords.lat},${p.coords.lng}`} target="_blank" rel="noopener noreferrer">Directions →</a>
                ) : (
                  <>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => onView?.(p.id, p.kind || "listing")}>View listing →</button>
                    <a className="btn btn-soft btn-sm" href={`https://www.google.com/maps/dir/?api=1&destination=${p.coords.lat},${p.coords.lng}`} target="_blank" rel="noopener noreferrer">Directions</a>
                  </>
                )}
              </span>
            </div>
          </Popup>
        )}
      </Marker>
    );
  };

  // Listing pins cluster (the directory has 300+); mosque/user/active pins and
  // the location-picker pin always render individually.
  const clusterable = onPick ? [] : points.filter((p) => (p.kind ?? "listing") === "listing" && !p.active);
  const individual = onPick ? points : points.filter((p) => (p.kind ?? "listing") !== "listing" || p.active);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom={false}
      style={{ width: "100%", height: "100%" }}
      aria-label="Map of halal places in Singapore"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitOrCenter center={center} zoom={zoom} points={points} fit={fit} />
      <AutoSize />
      <WheelGuard />
      {onPick && <ClickToPick onPick={onPick} />}
      {clusterable.length > 0 && <ClusterLayer points={clusterable} renderPoint={renderPoint} />}
      {individual.map(renderPoint)}
    </MapContainer>
  );
}
