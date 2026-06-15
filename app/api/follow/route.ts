import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";

/* Follow / unfollow an organiser (business). Auth required; RLS scopes rows to
   the caller. Returns the new follow state + public follower count. */
export async function POST(req: Request) {
  const rl = await rateLimit(req, "follow", 60, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const server = await getSupabaseServer();
  if (!server) return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  const { data: { user } } = await server.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  let b: { businessId?: string; follow?: boolean };
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 }); }
  const businessId = String(b.businessId || "");
  if (!businessId) return NextResponse.json({ ok: false, reason: "no_business" }, { status: 422 });
  const follow = b.follow !== false;

  if (follow) {
    await server.from("organizer_follows").upsert({ user_id: user.id, business_id: businessId }, { onConflict: "user_id,business_id" });
  } else {
    await server.from("organizer_follows").delete().eq("user_id", user.id).eq("business_id", businessId);
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
  const server = await getSupabaseServer();
  if (!server) return NextResponse.json({ ok: true, following: [] });
  const { data: { user } } = await server.auth.getUser();
  if (!user) return NextResponse.json({ ok: true, following: [] });
  const { data } = await server.from("organizer_follows").select("business_id").eq("user_id", user.id);
  return NextResponse.json({ ok: true, following: (data || []).map((r) => r.business_id as string) });
}
