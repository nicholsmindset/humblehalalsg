import { NextResponse } from "next/server";
import { getChains, liteapiConfigured } from "@/lib/liteapi";

/* Hotel chains/brands for the search filter rail. Reference data, cached in
   lib/liteapi (24h); graceful without a key. */
const CHAINS_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

export async function GET() {
  if (!liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true, chains: [] }, { headers: CHAINS_HEADERS });
  try {
    return NextResponse.json({ ok: true, chains: await getChains() }, { headers: CHAINS_HEADERS });
  } catch {
    return NextResponse.json({ ok: true, chains: [] }, { headers: CHAINS_HEADERS });
  }
}
