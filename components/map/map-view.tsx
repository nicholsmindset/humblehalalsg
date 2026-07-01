"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./leaflet-map";
import type { LatLng } from "@/lib/types";
import { SG_CENTER } from "@/lib/data";

// Leaflet throws "Invalid LatLng object: (NaN, NaN)" — crashing the whole page
// to the error boundary — if it ever receives a non-finite coordinate. Call
// sites guard with `!= null`, which does NOT catch NaN. Sanitize here so a bad
// coordinate degrades gracefully (fall back to SG, drop the bad pin) instead.
const isFiniteCoord = (c?: LatLng | null): c is LatLng =>
  !!c && Number.isFinite(c.lat) && Number.isFinite(c.lng);

// Leaflet touches `window`, so load the map only on the client.
const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="map-loading" aria-hidden="true">
      <span className="spinner" />
    </div>
  ),
});

export function MapView(props: {
  center: LatLng;
  zoom?: number;
  points: MapPoint[];
  onSelect?: (id: string) => void;
  onView?: (id: string, kind: string) => void;
  onPick?: (c: LatLng) => void;
  fit?: boolean;
}) {
  const center = isFiniteCoord(props.center) ? props.center : SG_CENTER;
  const points = (props.points || []).filter((p) => isFiniteCoord(p?.coords));
  return <LeafletMap {...props} center={center} points={points} />;
}

export type { MapPoint };
