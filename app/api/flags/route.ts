import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/feature-flags";

/* Public resolved feature flags (DB override → env) for the client shell.
   Static pages bake the root layout at build time in this Next version, so
   the layout's serverFlags prop is stale-false on them — the client context
   re-fetches from here after mount. Booleans only; nothing sensitive (every
   flag is inferable from whether its surface renders). 30s CDN cache matches
   the server-side flag cache TTL. */
export const dynamic = "force-dynamic";

export async function GET() {
  const flags = await getServerFlags();
  return NextResponse.json(
    { ok: true, flags },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
  );
}
