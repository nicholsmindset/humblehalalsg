import { NextResponse } from "next/server";
import { getPrayerTimes } from "@/lib/prayer-times";

/* Today's real Singapore prayer times (MUIS method, via Aladhan), cached daily.
   Degrades to ok:false so the client falls back to its seed. */
export async function GET() {
  const data = await getPrayerTimes();
  if (!data) return NextResponse.json({ ok: false });
  return NextResponse.json({ ok: true, ...data });
}
