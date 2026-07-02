import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSafeEventRef } from "@/lib/event-ref";
import { attributionFromLanding, serializeAttributionCookie, sanitizeAttribution } from "@/lib/attribution";

/* Organiser tracking link: /e/[slug]?ref=CODE → 302 /events/[slug].
   Counts the click and stamps the hh_attr attribution cookie so a later
   purchase credits this channel (orders.ref_code / orders.utm — 0042).
   ALWAYS overwrites the cookie: an explicit campaign click is the strongest
   signal (site-wide capture in lib/attribution.ts is first-touch-only).
   Never fails the redirect — attribution is best-effort. */

const CODE_RE = /^[a-z0-9][a-z0-9-]{1,31}$/;

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const safeSlug = isSafeEventRef(slug) ? slug : "";
  const dest = new URL(safeSlug ? `/events/${safeSlug}` : "/events", url.origin);

  const ref = (url.searchParams.get("ref") || "").toLowerCase();
  const attr =
    sanitizeAttribution({
      ...(attributionFromLanding(url.search, req.headers.get("referer") || "", url.hostname) ?? {}),
      ref: CODE_RE.test(ref) ? ref : undefined,
    }) ?? null;

  const res = NextResponse.redirect(dest, 302);
  if (attr) res.headers.append("Set-Cookie", serializeAttributionCookie(attr));

  // Click count — best-effort, service-role only (0042).
  if (safeSlug && attr?.ref) {
    const supa = getSupabaseAdmin();
    if (supa) {
      try {
        const { data: ev } = await supa
          .from("events")
          .select("id")
          .or(`id.eq.${safeSlug},slug.eq.${safeSlug}`)
          .maybeSingle();
        if (ev?.id) {
          const { data: rc } = await supa
            .from("event_ref_codes")
            .select("id")
            .eq("event_id", ev.id)
            .eq("code", attr.ref)
            .maybeSingle();
          if (rc?.id) await supa.rpc("increment_ref_click", { p_id: rc.id });
        }
      } catch {
        /* never block the redirect */
      }
    }
  }

  return res;
}
