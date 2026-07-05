import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags, resolveBusinessFlag } from "@/lib/feature-flags";
import { remainingQuota } from "@/lib/lead-routing";

/* Accept a routed lead → unmask the consumer's contact details. This is the
   quota gate:
     - paidLeads ON  → requires an active leads subscription with remaining
                       quota; consumes one credit (quota_consumed = true).
     - paidLeads OFF → free during beta, capped at BETA_FREE_CAP unlocks per
                       calendar month so scarcity exists and usage proves value. */
export const dynamic = "force-dynamic";

const BETA_FREE_CAP = 3;
type Db = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

function monthStartIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

async function ownsBusiness(db: Db, businessId: string, userId: string): Promise<boolean> {
  const { data } = await db
    .from("businesses").select("id").eq("id", businessId)
    .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`).maybeSingle();
  return !!data;
}

export async function POST(req: Request) {
  // leadRouting gates the whole surface before any businessId is knowable
  // (routeId hasn't even been parsed yet) — stays on the global/env resolution.
  const { leadRouting } = await getServerFlags();
  if (!leadRouting) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let routeId = "";
  try { routeId = String(((await req.json()) as { routeId?: string }).routeId || ""); } catch { /* noop */ }
  if (!routeId) return NextResponse.json({ ok: false, error: "missing_route" }, { status: 400 });

  const { data: route } = await db
    .from("lead_routes")
    .select("id, lead_id, business_id, status, quota_consumed, leads(name,email,phone)")
    .eq("id", routeId).maybeSingle();
  if (!route) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (!(await ownsBusiness(db, route.business_id, userId)))
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  // businessId is in scope now (the route's own business) — resolve per-business.
  const paidLeads = await resolveBusinessFlag("paidLeads", route.business_id);

  // Idempotent: already accepted → just return contact.
  const already = ["accepted", "contacted", "won", "lost"].includes(route.status);
  if (!already) {
    if (paidLeads) {
      const remaining = await remainingQuota(db, [route.business_id]);
      if ((remaining[route.business_id] ?? 0) <= 0) {
        return NextResponse.json({ ok: false, error: "quota_exhausted", upsell: true }, { status: 402 });
      }
    } else {
      // Beta courtesy cap — count this calendar month's free unlocks.
      const { count } = await db
        .from("lead_routes")
        .select("id", { count: "exact", head: true })
        .eq("business_id", route.business_id)
        .in("status", ["accepted", "contacted", "won", "lost"])
        .gte("accepted_at", monthStartIso());
      if ((count || 0) >= BETA_FREE_CAP) {
        return NextResponse.json({ ok: false, error: "beta_cap", betaCap: BETA_FREE_CAP }, { status: 402 });
      }
    }

    const { error } = await db
      .from("lead_routes")
      .update({ status: "accepted", accepted_at: new Date().toISOString(), quota_consumed: paidLeads })
      .eq("id", routeId)
      .in("status", ["sent", "viewed"]); // guard against a double-accept race
    if (error) return NextResponse.json({ ok: false, error: "could_not_accept" }, { status: 502 });

    // Reflect intent on the lead itself (first accept moves it to contacted-ready).
    try { await db.from("leads").update({ status: "contacted" }).eq("id", route.lead_id).eq("status", "routed"); } catch { /* noop */ }
  }

  const raw = route.leads as unknown;
  const lead = (Array.isArray(raw) ? raw[0] : raw) as { name?: string; email?: string; phone?: string } | undefined ?? {};
  return NextResponse.json({ ok: true, contact: { name: lead.name ?? null, email: lead.email ?? null, phone: lead.phone ?? null } });
}
