import { NextResponse } from "next/server";
import { getChains, liteapiConfigured } from "@/lib/liteapi";

/* Hotel chains/brands for the search filter rail. Reference data, cached in
   lib/liteapi (24h); graceful without a key. */
export async function GET() {
  if (!liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true, chains: [] });
  try {
    return NextResponse.json({ ok: true, chains: await getChains() });
  } catch {
    return NextResponse.json({ ok: true, chains: [] });
  }
}
