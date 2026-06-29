"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./leaflet-map";
import type { LatLng } from "@/lib/types";

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
  return <LeafletMap {...props} />;
}

export type { MapPoint };
