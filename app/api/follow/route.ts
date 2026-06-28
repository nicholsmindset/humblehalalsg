import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Follow / unfollow an organiser (business). Auth required; RLS scopes rows to
   the caller. Returns the new follow state + public follower count. */
export async function POST(req: Request) {
  const rl = await rateLimit(req, "follow", 60, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  const server = await getSupabaseServer();
  if (!server) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });

  let b: { businessId?: string; follow?: boolean };
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 }); }
  const businessId = String(b.businessId || "");
  if (!businessId) return NextResponse.json({ ok: false, reason: "no_business" }, { status: 422 });
  const follow = b.follow !== false;

  if (follow) {
    await server.from("organizer_follows").upsert({ user_id: userId, business_id: businessId }, { onConflict: "user_id,business_id" });
  } else {
    await server.from("organizer_follows").delete().eq("user_id", userId).eq("business_id", businessId);
  }

  // Public follower count (SECURITY DEFINER RPC; falls back gracefully).
  let count = 0;
  const admin = getSupabaseAdmin();
  if (admin) {
    const { data } = await admin.rpc("follower_count", { p_business_id: businessId });
    count = Number(data) || 0;
  }
  return NextResponse.json({ ok: true, following: follow, count });
}

/* Which businesses the caller follows (for hydrating follow buttons). */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: true, following: [] });
  const server = await getSupabaseServer();
  if (!server) return NextResponse.json({ ok: true, following: [] });
  const { data } = await server.from("organizer_follows").select("business_id").eq("user_id", userId);
  return NextResponse.json({ ok: true, following: (data || []).map((r) => r.business_id as string) });
}
