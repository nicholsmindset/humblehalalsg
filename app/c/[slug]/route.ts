import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { getServerFlags } from "@/lib/feature-flags";
import { POINTS, sgtDate } from "@/lib/passport";

/* Collect-stamp short link: /c/[slug] → award a Halal Passport "visit" stamp
   (once per business per SGT day) then 302 to the listing. A business displays
   this as a QR on its poster; a logged-in customer scans it in-store.
   - Not signed in → 302 to sign-in with a return to /c/[slug].
   - Flag off → plain 302 to the listing (a printed poster never breaks).
   Never blocks the redirect. */
export const dynamic = "force-dynamic";

const SLUG_RE = /^[a-z0-9-]{1,80}$/;

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(req.url);
  const safe = SLUG_RE.test(slug) ? slug : "";
  const listing = new URL(safe ? `/business/${safe}` : "/explore", url.origin);

  const rl = await rateLimit(req, "collect", 30, 3600);
  if (!rl.ok) return tooMany(rl.retryAfter);

  if (!safe || !(await getServerFlags()).passport) return NextResponse.redirect(listing, 302);

  const { userId } = await auth();
  if (!userId) {
    // Send to sign-in and come back to collect after auth.
    return NextResponse.redirect(new URL(`/sign-in?redirect=/c/${safe}`, url.origin), 302);
  }

  const db = getSupabaseAdmin();
  if (db) {
    try {
      const { data: biz } = await db.from("businesses").select("id").eq("slug", safe).eq("status", "published").maybeSingle();
      const businessId = (biz as { id?: string } | null)?.id;
      if (businessId) {
        const { award, qualifyReferralIfPending, loadStats, emitProgress } = await import("@/lib/passport-server");
        const before = await loadStats(db, userId);
        const awarded = await award(db, {
          userId, source: "visit", sourceId: businessId, points: POINTS.visit,
          reason: "Collected a stamp", dedupeKey: `visit:${businessId}:${sgtDate(new Date())}`,
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
