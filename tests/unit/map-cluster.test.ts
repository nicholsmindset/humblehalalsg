import { describe, expect, it } from "vitest";
import Supercluster from "supercluster";

/* Validates the exact supercluster usage in components/map/leaflet-map.tsx's
   ClusterLayer (index options, feature shape, getClusters/getClusterExpansionZoom)
   — the local dev environment has no listing coords, so the render path can't
   be exercised end-to-end there. */

const SG_BOUNDS: [number, number, number, number] = [103.6, 1.15, 104.1, 1.48];

function buildIndex(points: { id: string; lat: number; lng: number }[]) {
  const sc = new Supercluster<{ pointId: string }, { pointId: string }>({ radius: 60, maxZoom: 16 });
  sc.load(points.map((p) => ({
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
    properties: { pointId: p.id },
  })));
  return sc;
}

// 300 pseudo-listings spread across Singapore (deterministic, no Math.random).
const many = Array.from({ length: 300 }, (_, i) => ({
  id: `l${i}`,
  lat: 1.25 + ((i * 37) % 100) / 500, // 1.25–1.45
  lng: 103.65 + ((i * 53) % 100) / 250, // 103.65–104.05
}));

describe("map clustering (supercluster)", () => {
  it("collapses 300 points into fewer markers at island zoom", () => {
    const idx = buildIndex(many);
    const clusters = idx.getClusters(SG_BOUNDS, 10);
    expect(clusters.length).toBeGreaterThan(0);
    expect(clusters.length).toBeLessThan(100); // far fewer markers than points
    const total = clusters.reduce(
      (n, c) => n + ("point_count" in c.properties ? (c.properties as { point_count: number }).point_count : 1),
      0,
    );
    expect(total).toBe(300); // nothing dropped
  });

  it("returns individual points past maxZoom", () => {
    const idx = buildIndex(many);
    const leaves = idx.getClusters(SG_BOUNDS, 17); // maxZoom 16 + 1
    expect(leaves.every((c) => !("cluster" in c.properties && c.properties.cluster))).toBe(true);
    expect(leaves.length).toBe(300);
  });

  it("expansion zoom for a cluster is a sane zoom level", () => {
    const idx = buildIndex(many);
    const cluster = idx.getClusters(SG_BOUNDS, 11).find((c) => "cluster" in c.properties);
    expect(cluster).toBeDefined();
    const z = idx.getClusterExpansionZoom(cluster!.id as number);
    expect(z).toBeGreaterThan(11);
    expect(z).toBeLessThanOrEqual(17);
  });

  it("keeps identical-coordinate points grouped until maxZoom (stacked-postal case)", () => {
    const stacked = Array.from({ length: 8 }, (_, i) => ({ id: `s${i}`, lat: 1.3521, lng: 103.8198 }));
    const idx = buildIndex(stacked);
    const atMax = idx.getClusters(SG_BOUNDS, 16);
    expect(atMax.length).toBe(1); // still one cluster badge, not 8 stacked pins
    expect(idx.getClusterExpansionZoom(atMax[0].id as number)).toBe(17);
  });
});
