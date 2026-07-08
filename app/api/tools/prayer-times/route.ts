import { NextResponse } from "next/server";
import { getPrayerTimesFor } from "@/lib/tools/prayer-times";
import { PRAYER_METHODS, DEFAULT_METHOD } from "@/lib/tools/prayer-methods";

/* Prayer times for any location (Aladhan, cached daily upstream). Public, no PII
   stored — coordinates come from the client and are used only for this lookup. */
const PRAYER_TIMES_FOR_LOCATION_HEADERS = {
  "Cache-Control": "private, max-age=3600",
};

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const lat = Number(sp.get("lat"));
  const lng = Number(sp.get("lng"));
  const method = Number(sp.get("method"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ ok: false, error: "invalid_coords" }, { status: 400 });
  }
  const m = PRAYER_METHODS.some((x) => x.id === method) ? method : DEFAULT_METHOD;

  const data = await getPrayerTimesFor(lat, lng, m);
  if (!data) return NextResponse.json({ ok: false }, { headers: PRAYER_TIMES_FOR_LOCATION_HEADERS });
  return NextResponse.json({ ok: true, ...data }, { headers: PRAYER_TIMES_FOR_LOCATION_HEADERS });
}
