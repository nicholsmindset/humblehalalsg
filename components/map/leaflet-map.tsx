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

function Recenter({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], zoom, { duration: 0.6 });
  }, [center.lat, center.lng, zoom, map]);
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
}: {
  center: LatLng;
  zoom?: number;
  points: MapPoint[];
  onSelect?: (id: string) => void;
  /** When set, the map becomes a single-pin location picker: tap the map or
   *  drag the marker to choose a precise spot. */
  onPick?: (c: LatLng) => void;
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
      <Recenter center={center} zoom={zoom} />
      {onPick && <ClickToPick onPick={onPick} />}
      {points.map((p) => (
        <Marker
          key={p.id}
          position={[p.coords.lat, p.coords.lng]}
          icon={pinIcon(p)}
          draggable={!!onPick}
          eventHandlers={{
            click: () => onSelect?.(p.id),
            dragend: onPick
              ? (e) => {
                  const ll = (e.target as L.Marker).getLatLng();
                  onPick({ lat: ll.lat, lng: ll.lng });
                }
              : undefined,
          }}
          keyboard
          title={p.name}
        />
      ))}
    </MapContainer>
  );
}
