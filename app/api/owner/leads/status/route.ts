import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags } from "@/lib/flags";

/* Owner updates the pipeline state of an ACCEPTED lead: contacted / won / lost.
   Only valid from an already-accepted route (contact was unlocked). */
export const dynamic = "force-dynamic";

const NEXT = new Set(["contacted", "won", "lost"]);
type Db = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

async function ownsBusiness(db: Db, businessId: string, userId: string): Promise<boolean> {
  const { data } = await db
    .from("businesses").select("id").eq("id", businessId)
    .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`).maybeSingle();
  return !!data;
}

export async function POST(req: Request) {
  if (!getServerFlags().leadRouting) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let routeId = "", status = "";
  try { const b = (await req.json()) as { routeId?: string; status?: string }; routeId = String(b.routeId || ""); status = String(b.status || ""); } catch { /* noop */ }
  if (!routeId || !NEXT.has(status)) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  const { data: route } = await db.from("lead_routes").select("id, business_id, status").eq("id", routeId).maybeSingle();
  if (!route) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (!(await ownsBusiness(db, route.business_id, userId))) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  if (!["accepted", "contacted", "won", "lost"].includes(route.status))
    return NextResponse.json({ ok: false, error: "accept_first" }, { status: 409 });

  const { error } = await db
    .from("lead_routes")
    .update({ status, outcome_at: new Date().toISOString() })
    .eq("id", routeId);
  if (error) return NextResponse.json({ ok: false, error: "could_not_update" }, { status: 502 });
  return NextResponse.json({ ok: true, status });
}
