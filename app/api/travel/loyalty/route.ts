import { NextResponse } from "next/server";
import { getLoyalty, liteapiConfigured } from "@/lib/liteapi";

/* "Humble Halal Rewards" — exposes the LiteAPI loyalty cashback rate so the UI can
   show what a traveller earns on a stay/flight. Cached; graceful without a key. */
let cache: { at: number; data: { cashbackRate: number; currency: string; status: string } | null } | null = null;
const TTL = 60 * 60_000;
const LOYALTY_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

export async function GET() {
  if (!liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true, enabled: false }, { headers: LOYALTY_HEADERS });
  if (cache && Date.now() - cache.at < TTL) return NextResponse.json({ ok: true, ...(cache.data || { enabled: false }), enabled: cache.data?.status === "enabled" }, { headers: LOYALTY_HEADERS });
  try {
    const data = await getLoyalty();
    cache = { at: Date.now(), data };
    return NextResponse.json({ ok: true, enabled: data?.status === "enabled", cashbackRate: data?.cashbackRate ?? 0, currency: data?.currency ?? "USD" }, { headers: LOYALTY_HEADERS });
  } catch {
    return NextResponse.json({ ok: true, enabled: false }, { headers: LOYALTY_HEADERS });
  }
}
