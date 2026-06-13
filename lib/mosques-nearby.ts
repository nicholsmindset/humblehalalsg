import "server-only";

/* Nearby mosques + halal food from OpenStreetMap (Overpass API). Global,
   key-free, FACTUAL location data — proximity/info, not a halal certification,
   so it respects the golden rule (we point to real places, we don't certify).
   One combined query; best-effort: returns empty on any failure. */

export type PlaceKind = "mosque" | "halal-food";

export interface NearbyPlace {
  name: string;
  lat: number;
  lng: number;
  distanceM: number;
  kind: PlaceKind;
  cuisine?: string;
}

// Back-compat alias for earlier callers.
export type NearbyMosque = NearbyPlace;

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

export async function nearbyPlaces(
  lat: number,
  lng: number,
  radiusM = 3000,
): Promise<{ mosques: NearbyPlace[]; halalFood: NearbyPlace[] }> {
  const a = `(around:${radiusM},${lat},${lng})`;
  const q = `[out:json][timeout:10];(` +
    `node["amenity"="place_of_worship"]["religion"="muslim"]${a};` +
    `way["amenity"="place_of_worship"]["religion"="muslim"]${a};` +
    `node["amenity"~"^(restaurant|cafe|fast_food|food_court)$"]["diet:halal"~"^(yes|only)$"]${a};` +
    `way["amenity"~"^(restaurant|cafe|fast_food|food_court)$"]["diet:halal"~"^(yes|only)$"]${a};` +
    `);out center 60;`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(q),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return { mosques: [], halalFood: [] };
    const data = (await res.json()) as { elements?: { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[] };

    const mosques: NearbyPlace[] = [];
    const halalFood: NearbyPlace[] = [];
    const seen = new Set<string>();
    for (const el of data.elements || []) {
      const elat = el.lat ?? el.center?.lat;
      const elng = el.lon ?? el.center?.lon;
      if (elat == null || elng == null) continue;
      const tags = el.tags || {};
      const isMosque = tags.religion === "muslim";
      const name = tags.name || tags["name:en"] || (isMosque ? "Mosque" : "Halal eatery");
      const k = `${name}|${Math.round(elat * 1000)}|${Math.round(elng * 1000)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const place: NearbyPlace = {
        name,
        lat: elat,
        lng: elng,
        distanceM: Math.round(haversine(lat, lng, elat, elng)),
        kind: isMosque ? "mosque" : "halal-food",
        cuisine: !isMosque ? tags.cuisine?.replace(/[_;]/g, " ") : undefined,
      };
      (isMosque ? mosques : halalFood).push(place);
    }
    const byDist = (a: NearbyPlace, b: NearbyPlace) => a.distanceM - b.distanceM;
    return { mosques: mosques.sort(byDist).slice(0, 6), halalFood: halalFood.sort(byDist).slice(0, 6) };
  } catch {
    return { mosques: [], halalFood: [] };
  }
}
