const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export type WeatherQuery =
  | { ok: true; lat: number; lng: number; start: string; end: string }
  | { ok: false; error: "bad coords" | "bad dates" };

export function parseWeatherQuery(searchParams: URLSearchParams, now = new Date()): WeatherQuery {
  const latRaw = searchParams.get("lat")?.trim();
  const lngRaw = searchParams.get("lng")?.trim();
  const lat = Number(latRaw);
  const lng = Number(lngRaw);

  if (
    !latRaw ||
    !lngRaw ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return { ok: false, error: "bad coords" };
  }

  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const start = searchParams.get("checkin") || iso(now);
  const end = searchParams.get("checkout") || iso(new Date(now.getTime() + 6 * 86_400_000));

  if (!isIsoDate(start) || !isIsoDate(end) || end < start) {
    return { ok: false, error: "bad dates" };
  }

  return { ok: true, lat, lng, start, end };
}
