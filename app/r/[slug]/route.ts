import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Review-request short link: /r/[slug] → 302 /business/[slug]?tab=reviews.
   Owners share this (or a QR of it) so customers land straight on the reviews
   tab. Records a best-effort page_view so scans show in owner insights
   (0010 analytics_events). Never blocks the redirect. */

const SLUG_RE = /^[a-z0-9-]{1,80}$/;

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const safe = SLUG_RE.test(slug) ? slug : "";
  const dest = new URL(
    safe ? `/business/${safe}?tab=reviews&utm_source=review-link&utm_medium=qr` : "/explore",
    url.origin,
  );

  if (safe) {
    const db = getSupabaseAdmin();
    if (db) {
      try {
        await db.from("analytics_events").insert({
          event_type: "page_view",
          listing_slug: safe,
          path: `/r/${safe}`,
          referrer: req.headers.get("referer") || null,
        });
      } catch {
        /* never block the redirect */
      }
    }
  }

  return NextResponse.redirect(dest, 302);
}
