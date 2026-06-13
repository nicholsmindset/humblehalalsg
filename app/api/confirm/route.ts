import { NextResponse } from "next/server";

/* Community "confirm it's halal" signal. Requires an authenticated user
   (community_confirmations.user_id under RLS). Graceful: accepts in simulated
   mode when Supabase/auth aren't configured. */

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const businessId = String(body?.businessId || "").trim();
  if (!businessId) return NextResponse.json({ ok: false, error: "Missing business" }, { status: 422 });

  try {
    const { getSupabaseServer } = await import("@/lib/supabase/server");
    const sb = await getSupabaseServer();
    if (sb) {
      const { data } = await sb.auth.getUser();
      if (data?.user) {
        const { error } = await sb
          .from("community_confirmations")
          .insert({ business_id: businessId, user_id: data.user.id });
        if (!error) return NextResponse.json({ ok: true, simulated: false });
      } else {
        return NextResponse.json({ ok: false, error: "Sign in to confirm" }, { status: 401 });
      }
    }
  } catch {
    /* fall through to simulated */
  }

  return NextResponse.json({ ok: true, simulated: true });
}
