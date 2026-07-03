import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* The signed-in owner's in-flight submissions — pending listing reviews
   (staging_businesses via the submitted_by generated column, 0044) and
   pending claims. Powers the "In review" cards on the owner dashboard so a
   fresh submission doesn't look like it vanished into a void. */
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const [staging, claims] = await Promise.all([
    db
      .from("staging_businesses")
      .select("id, name, review_status, created_at")
      .eq("submitted_by", userId)
      .in("review_status", ["new", "reviewing"])
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("claims")
      .select("id, status, created_at, business_id, businesses(name)")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const listings = (staging.data || []).map((r) => ({
    id: String(r.id),
    kind: "listing" as const,
    name: String(r.name || "Your business"),
    status: String(r.review_status),
    created_at: String(r.created_at),
  }));
  const claimRows = (claims.data || []).map((r) => {
    const biz = r.businesses as { name?: string } | { name?: string }[] | null;
    const bizName = Array.isArray(biz) ? biz[0]?.name : biz?.name;
    return {
      id: String(r.id),
      kind: "claim" as const,
      name: String(bizName || "Claimed business"),
      status: String(r.status),
      created_at: String(r.created_at),
    };
  });

  return NextResponse.json({ ok: true, submissions: [...listings, ...claimRows] });
}
