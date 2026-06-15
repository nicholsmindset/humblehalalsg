"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/types";

export interface MapPoint {
  id: string;
  name: string;
  coords: LatLng;
  active?: boolean;
  kind?: "listing" | "mosque" | "user";
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
    if (fit && points.length > 1) {
      const b = L.latLngBounds(points.map((p) => [p.coords.lat, p.coords.lng] as [number, number]));
      map.fitBounds(b, { padding: [48, 48], maxZoom: 15, animate: false });
    } else {
      map.flyTo([center.lat, center.lng], zoom, { duration: 0.5 });
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

export default function LeafletMap({
  center,
  zoom = 13,
  points,
  onSelect,
  onPick,
  fit = false,
}: {
  center: LatLng;
  zoom?: number;
  points: MapPoint[];
  onSelect?: (id: string) => void;
  /** When set, the map becomes a single-pin location picker: tap the map or
   *  drag the marker to choose a precise spot. */
  onPick?: (c: LatLng) => void;
  /** Frame all markers (used on the results map when nothing is selected). */
  fit?: boolean;
}) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom
      style={{ width: "100%", height: "100%" }}
      aria-label="Map of halal places in Singapore"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitOrCenter center={center} zoom={zoom} points={points} fit={fit} />
      <AutoSize />
      {onPick && <ClickToPick onPick={onPick} />}
      {points.map((p) => {
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
          />
        );
      })}
    </MapContainer>
  );
}
