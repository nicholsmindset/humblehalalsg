import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

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
      const { userId } = await auth();
      if (userId) {
        const { error } = await sb
          .from("community_confirmations")
          .insert({ business_id: businessId, user_id: userId });
        if (!error) {
          // Sync the denormalized businesses.confirm_count from the source of
          // truth (community_confirmations). Best-effort, service-role (a
          // community confirmer isn't the owner, so RLS blocks a user-scoped write).
          try {
            const { getSupabaseAdmin } = await import("@/lib/supabase/server");
            const admin = getSupabaseAdmin();
            if (admin) {
              const { count } = await admin.from("community_confirmations").select("*", { count: "exact", head: true }).eq("business_id", businessId);
              if (typeof count === "number") await admin.from("businesses").update({ confirm_count: count }).eq("id", businessId);
            }
          } catch { /* counter is best-effort */ }
          return NextResponse.json({ ok: true, simulated: false });
        }
      } else {
        return NextResponse.json({ ok: false, error: "Sign in to confirm" }, { status: 401 });
      }
    }
  } catch {
    /* fall through to simulated */
  }

  return NextResponse.json({ ok: true, simulated: true });
}
