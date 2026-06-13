import { NextResponse } from "next/server";
import { liteapiConfigured, searchPlaces } from "@/lib/liteapi";

/* Destination autocomplete → LiteAPI /data/places. Graceful: returns [] without
   a key. Filters out non-geographic results (taxi services etc.). */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ ok: true, places: [] });
  if (!liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true, places: [] });

  const GEO = ["locality", "geocode", "natural_feature", "tourist_attraction", "administrative_area_level_1", "administrative_area_level_2", "sublocality", "neighborhood"];
  const NON_GEO = ["taxi_service", "transportation_service", "airport_shuttle_service", "chauffeur_service", "store", "lodging", "travel_agency", "car_rental"];
  try {
    const all = await searchPlaces(q);
    const places = all
      .filter((p) => {
        const types = p.types || [];
        return types.some((t) => GEO.includes(t)) && !types.some((t) => NON_GEO.includes(t));
      })
      .slice(0, 6)
      .map((p) => ({ placeId: p.placeId, name: p.displayName || "", address: p.formattedAddress || "" }));
    return NextResponse.json({ ok: true, places });
  } catch {
    return NextResponse.json({ ok: false, places: [] }, { status: 502 });
  }
}
