"use client";

import { useRouter } from "next/navigation";
import { MapView, type MapPoint } from "@/components/map/map-view";
import { SG_CENTER } from "@/lib/data";
import type { HawkerCentre } from "@/lib/hawker";

/* Client island: an overview map of geocoded hawker-centre pins. Coordinate-free
   centres are dropped by MapView. Used full-size on /hawker and scoped to one
   centre on /hawker/[centre]. */
export function HawkerMap({
  centres,
  height = "clamp(320px, 56vh, 460px)",
  zoom = 12,
  numbered = false,
}: {
  centres: HawkerCentre[];
  height?: string;
  zoom?: number;
  /** Number pins by array order (1-based) so map markers track a visible list. */
  numbered?: boolean;
}) {
  const router = useRouter();
  const points: MapPoint[] = centres
    .filter((c) => c.lat != null && c.lng != null)
    .map((c, i) => ({
      id: c.id,
      name: c.name,
      coords: { lat: c.lat as number, lng: c.lng as number },
      kind: "hawker" as const,
      meta: [c.region, c.nearestMrt].filter(Boolean).join(" · ") || undefined,
      order: numbered ? i + 1 : undefined,
    }));

  const single = centres.length === 1 && points.length === 1;
  const center = single ? points[0].coords : SG_CENTER;

  return (
    <div className="map-canvas" style={{ height, borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--line)" }}>
      <MapView
        center={center}
        zoom={single ? 15 : zoom}
        points={points}
        fit={!single}
        onView={(id) => router.push(`/hawker/${encodeURIComponent(id)}`)}
      />
    </div>
  );
}
