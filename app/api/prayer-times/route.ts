import { NextResponse } from "next/server";
import { getPrayerTimes } from "@/lib/prayer-times";

/* Today's real Singapore prayer times (MUIS method, via Aladhan), cached daily.
   Degrades to ok:false so the client falls back to its seed. */
const PRAYER_TIMES_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

export async function GET() {
  const data = await getPrayerTimes();
  if (!data) return NextResponse.json({ ok: false }, { headers: PRAYER_TIMES_HEADERS });
  return NextResponse.json({ ok: true, ...data }, { headers: PRAYER_TIMES_HEADERS });
}
