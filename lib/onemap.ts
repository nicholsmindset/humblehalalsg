export interface OneMapGeocodeResult {
  address: string;
  road: string;
  building: string;
  postal: string;
  lat: number;
  lng: number;
}

function titleCase(value: unknown): string {
  return typeof value === "string"
    ? value.toLowerCase().replace(/\b([a-z])/g, (_, char: string) => char.toUpperCase())
    : "";
}

function optionalText(value: unknown): string {
  if (typeof value !== "string" || ["NIL", "NULL"].includes(value.trim().toUpperCase())) return "";
  return value.trim();
}

function coordinate(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Normalizes the untrusted response returned by OneMap's public search API. */
export function normalizeOneMapResults(value: unknown): OneMapGeocodeResult[] {
  if (!Array.isArray(value)) return [];

  const results: OneMapGeocodeResult[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const lat = coordinate(row.LATITUDE);
    const lng = coordinate(row.LONGITUDE);

    if (
      lat === null ||
      lng === null ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) continue;

    results.push({
      address: titleCase(row.ADDRESS),
      road: titleCase(row.ROAD_NAME),
      building: titleCase(optionalText(row.BUILDING)),
      postal: optionalText(row.POSTAL),
      lat,
      lng,
    });
    if (results.length === 8) break;
  }

  return results;
}
