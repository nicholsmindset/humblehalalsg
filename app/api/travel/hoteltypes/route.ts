import { NextResponse } from "next/server";
import { getHotelTypes, liteapiConfigured } from "@/lib/liteapi";

/* Hotel-type classifications (resort, boutique, business…) for the search filter
   rail. Reference data, cached in lib/liteapi (24h); graceful without a key. */
export async function GET() {
  if (!liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true, types: [] });
  try {
    return NextResponse.json({ ok: true, types: await getHotelTypes() });
  } catch {
    return NextResponse.json({ ok: true, types: [] });
  }
}
