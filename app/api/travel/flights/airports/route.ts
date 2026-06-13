import { NextResponse } from "next/server";
import { liteapiConfigured, searchAirports } from "@/lib/liteapi";
import { searchLocalAirports } from "@/lib/airports";

/* Airport autocomplete. The bundled dataset (lib/airports.ts) is the reliable
   primary source — instant, key-less, and unaffected by LiteAPI sandbox limits.
   Any live LiteAPI matches are merged on top (deduped by IATA) so coverage grows
   once flights are activated. */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ ok: true, airports: [] });

  const local = searchLocalAirports(q, 7);
  let live: typeof local = [];
  if (liteapiConfigured()) {
    try {
      const a = await searchAirports(q);
      live = a.filter((x) => x.iata).map((x) => ({ iata: x.iata, name: x.name || "", city: x.city || "", country: x.country || "" }));
    } catch { /* fall back to local only */ }
  }

  const seen = new Set(local.map((a) => a.iata));
  const merged = [...local];
  for (const a of live) { if (!seen.has(a.iata)) { merged.push(a); seen.add(a.iata); } }

  return NextResponse.json({ ok: true, airports: merged.slice(0, 8) });
}
