import { NextResponse } from "next/server";
import { getLeadCaptureConfig } from "@/lib/lead-capture";

/* Public lead-capture surface config — booleans only.
   Blog posts are SSG (no revalidate) and guide pages revalidate daily, so the
   capture components gate themselves CLIENT-SIDE via this endpoint — admin
   toggles take effect within ~a minute with zero redeploys. CDN-cached and
   fail-closed (lib/lead-capture returns all-off on any error). */
export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = await getLeadCaptureConfig();
  return NextResponse.json(cfg, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
