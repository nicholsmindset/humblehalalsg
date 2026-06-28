import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/* One-click "my details are current" link from the freshness email (B2).
   Re-stamps last_verified_at — RLS ensures only the owner can touch their own
   listing. Redirects to the owner dashboard. Graceful + auth-gated. */
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const business = searchParams.get("business") || "";
  const base = process.env.NEXT_PUBLIC_SITE_URL || origin;
  try {
    const { getSupabaseServer } = await import("@/lib/supabase/server");
    const sb = await getSupabaseServer();
    if (sb && business) {
      const { userId } = await auth();
      if (!userId) return NextResponse.redirect(`${base}/login?next=/owner`);
      await sb
        .from("businesses")
        .update({ last_verified_at: new Date().toISOString() })
        .eq("id", business)
        .eq("claimed_by", userId);
      return NextResponse.redirect(`${base}/owner?restamped=1`);
    }
  } catch {
    /* graceful */
  }
  return NextResponse.redirect(`${base}/owner`);
}
