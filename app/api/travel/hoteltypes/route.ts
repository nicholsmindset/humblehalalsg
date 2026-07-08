import { NextResponse } from "next/server";
import { getHotelTypes, liteapiConfigured } from "@/lib/liteapi";

/* Hotel-type classifications (resort, boutique, business…) for the search filter
   rail. Reference data, cached in lib/liteapi (24h); graceful without a key. */
const HOTEL_TYPES_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

export async function GET() {
  if (!liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true, types: [] }, { headers: HOTEL_TYPES_HEADERS });
  try {
    return NextResponse.json({ ok: true, types: await getHotelTypes() }, { headers: HOTEL_TYPES_HEADERS });
  } catch {
    return NextResponse.json({ ok: true, types: [] }, { headers: HOTEL_TYPES_HEADERS });
  }
}
