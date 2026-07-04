import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { getServerFlags } from "@/lib/flags";
import { POINTS, sgtDate } from "@/lib/passport";
import { verifyCollectToken } from "@/lib/passport-collect";

/* Collect-stamp short link: /c/[slug]?k=TOKEN → award a Halal Passport "visit"
   stamp then 302 to the listing. A business displays this as a QR on its poster;
   a logged-in customer scans it in-store.
   ANTI-ABUSE: points are awarded ONLY when the signed `k` token (from the
   business's poster) is valid — so a user can't script /c/<slug> for every
   business to farm visits they never made — and only up to VISIT_DAILY_CAP
   stamps earn per SGT day. The redirect ALWAYS happens (poster never breaks);
   an invalid/absent token just means no points. */
export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9-]{1,80}$/;
// Max collect-stamps that EARN points per SGT day (a real person visits a
// handful of halal spots a day, not dozens).
const VISIT_DAILY_CAP = 5;

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const safe = SLUG_RE.test(slug) ? slug : "";
  const token = url.searchParams.get("k");
  const listing = new URL(safe ? `/business/${safe}` : "/explore", url.origin);

  const rl = await rateLimit(req, "collect", 30, 3600);
  if (!rl.ok) return tooMany(rl.retryAfter);

  if (!safe || !getServerFlags().passport) return NextResponse.redirect(listing, 302);

  const { userId } = await auth();
  if (!userId) {
    // Send to the login screen (/login — /sign-in is not a route, it 404s) and
    // come back to collect after auth (carry the token).
    const back = `/c/${safe}${token ? `?k=${encodeURIComponent(token)}` : ""}`;
    return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(back)}`, url.origin), 302);
  }

  const db = getSupabaseAdmin();
  if (db) {
    try {
      const { data: biz } = await db.from("businesses").select("id").eq("slug", safe).eq("status", "published").maybeSingle();
      const businessId = (biz as { id?: string } | null)?.id;
      // Award ONLY with a valid poster token (forgery guard).
      if (businessId && verifyCollectToken(businessId, token)) {
        const { awardDailyCapped, qualifyReferralIfPending, loadStats, emitProgress } = await import("@/lib/passport-server");
        const before = await loadStats(db, userId);
        const awarded = await awardDailyCapped(db, {
          userId, source: "visit", sourceId: businessId, points: POINTS.visit,
          reason: "Collected a stamp", dedupeKey: `visit:${businessId}:${sgtDate(new Date())}`, dailyCap: VISIT_DAILY_CAP,
        });
        if (awarded) {
          await qualifyReferralIfPending(db, userId);
          await emitProgress(db, userId, before, await loadStats(db, userId));
        }
        listing.search = `?tab=reviews&collected=1`;
      }
    } catch {
      /* never block the redirect */
    }
  }

  return NextResponse.redirect(listing, 302);
}
