"use client";

import { MapView, type MapPoint } from "@/components/map/map-view";
import { SG_CENTER } from "@/lib/data";
import type { PrayerSpace } from "@/lib/prayer-spaces";

/* Client island: an overview map of all geocoded musollah pins for the
   /prayer-rooms page. Coordinate-free entries are dropped by MapView. */
export function PrayerRoomsMap({ spaces }: { spaces: PrayerSpace[] }) {
  const points: MapPoint[] = spaces
    .filter((p) => p.coords)
    .map((p) => ({ id: p.id, name: p.name, coords: p.coords!, kind: "prayer-room" as const }));

  return (
    <div className="map-canvas" style={{ height: "clamp(320px, 56vh, 460px)", borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--line)" }}>
      <MapView center={SG_CENTER} zoom={12} points={points} fit />
    </div>
  );
}
