import { NextResponse } from "next/server";

/* Address autocomplete via OneMap (Singapore's official government map service).
   The public search endpoint returns results without a token; if OneMap ever
   enforces auth, set ONEMAP_TOKEN in env. On any failure we return an empty
   list so the listing form falls back to manual entry — never blocks. */

export const runtime = "nodejs";

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b([a-z])/g, (_, c) => c.toUpperCase());
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 3) return NextResponse.json({ results: [] });

  const url =
    `https://www.onemap.gov.sg/api/common/elastic/search` +
    `?searchVal=${encodeURIComponent(q)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
  const token = process.env.ONEMAP_TOKEN;

  try {
    const res = await fetch(url, {
      headers: token ? { Authorization: token } : {},
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return NextResponse.json({ results: [] });
    const data = await res.json();
    const raw = Array.isArray(data?.results) ? data.results : [];
    const results = raw
      .filter((r: Record<string, string>) => r.LATITUDE && r.LONGITUDE)
      .slice(0, 8)
      .map((r: Record<string, string>) => {
        const building = r.BUILDING && !["NIL", "NULL"].includes(r.BUILDING) ? titleCase(r.BUILDING) : "";
        const postal = r.POSTAL && !["NIL", "NULL"].includes(r.POSTAL) ? r.POSTAL : "";
        return {
          address: titleCase(r.ADDRESS || ""),
          road: titleCase(r.ROAD_NAME || ""),
          building,
          postal,
          lat: Number(r.LATITUDE),
          lng: Number(r.LONGITUDE),
        };
      });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
