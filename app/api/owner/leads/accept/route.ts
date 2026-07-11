import { NextResponse, after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags, resolveBusinessFlag } from "@/lib/feature-flags";
import { leadAcceptedConsumerEmail } from "@/lib/emails/templates";
import { verticalLabel } from "@/lib/lead-verticals";
import { sendEmail } from "@/lib/email";

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

  // delivery is 0066 — retry without it pre-paste (treated as teaser).
  let route: { id: string; lead_id: string; business_id: string; status: string; quota_consumed: boolean | null; delivery?: string; leads: unknown } | null;
  {
    const r = await db.from("lead_routes")
      .select("id, lead_id, business_id, status, quota_consumed, delivery, leads(name,email,phone,vertical_id)")
      .eq("id", routeId).maybeSingle();
    if (r.error && /column|schema cache/i.test(r.error.message || "")) {
      route = (await db.from("lead_routes")
        .select("id, lead_id, business_id, status, quota_consumed, leads(name,email,phone,vertical_id)")
        .eq("id", routeId).maybeSingle()).data as typeof route;
    } else {
      route = r.data as typeof route;
    }
  }
  if (!route) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (!(await ownsBusiness(db, route.business_id, userId)))
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  // businessId is in scope now (the route's own business) — resolve per-business.
  const paidLeads = await resolveBusinessFlag("paidLeads", route.business_id);

  // Idempotent: already accepted → just return contact.
  const already = ["accepted", "contacted", "won", "lost"].includes(route.status);
  const freeTaste = route.delivery === "full";
  if (!already && freeTaste) {
    // The gifted first lead: contact was already delivered in full, so
    // accepting is just an acknowledgement — no quota, no beta slot. Direct
    // conditional update (status-guarded, idempotent) instead of the RPC.
    const { data: flipped } = await db.from("lead_routes")
      .update({ status: "accepted", accepted_at: new Date().toISOString(), quota_consumed: false })
      .eq("id", routeId).in("status", ["sent", "viewed"]).select("id");
    if (flipped?.length) {
      try { await db.from("leads").update({ status: "contacted" }).eq("id", route.lead_id).eq("status", "routed"); } catch { /* noop */ }
    }
  } else if (!already) {
    // Derive the cap + window; the RPC re-checks it under a per-business advisory
    // lock and flips the route in the same transaction, so two concurrent accepts
    // of different routes for the same business can't both slip past the cap
    // (the old count-then-update was a TOCTOU that over-delivered credits).
    let cap = BETA_FREE_CAP;
    let since = monthStartIso();
    if (paidLeads) {
      const { data: sub } = await db
        .from("subscriptions")
        .select("monthly_quota, current_period_start, status")
        .eq("kind", "leads").eq("business_id", route.business_id)
        .order("current_period_start", { ascending: false }).limit(1).maybeSingle();
      const active = !!sub && (sub.status === "active" || sub.status === "trialing");
      cap = active && sub ? (sub.monthly_quota || 0) : 0;
      since = active && sub?.current_period_start ? sub.current_period_start : new Date(0).toISOString();
    }

    const { data: result, error } = await db.rpc("accept_lead_route", {
      p_route_id: routeId, p_business_id: route.business_id, p_paid: paidLeads, p_cap: cap, p_since: since,
    });
    if (error) return NextResponse.json({ ok: false, error: "could_not_accept" }, { status: 502 });
    if (result === "quota") return NextResponse.json({ ok: false, error: "quota_exhausted", upsell: true }, { status: 402 });
    if (result === "cap") return NextResponse.json({ ok: false, error: "beta_cap", betaCap: BETA_FREE_CAP }, { status: 402 });
    if (result === "ok") {
      // Reflect intent on the lead itself (first accept moves it to contacted-ready).
      try { await db.from("leads").update({ status: "contacted" }).eq("id", route.lead_id).eq("status", "routed"); } catch { /* noop */ }
    } else if (result !== "wrong_state") {
      // 'not_found' / unexpected → fail. 'wrong_state' = concurrently accepted
      // between our read and the lock, so fall through and return the contact.
      return NextResponse.json({ ok: false, error: "could_not_accept" }, { status: 502 });
    }
  }

  const raw = route.leads as unknown;
  const lead = (Array.isArray(raw) ? raw[0] : raw) as { name?: string; email?: string; phone?: string; vertical_id?: string } | undefined ?? {};

  // Close the loop for the CONSUMER (post-response): they never used to hear
  // that a provider picked up their request. First accept only.
  if (!already && lead.email) {
    const consumerEmail = lead.email;
    const consumerName = lead.name ?? null;
    const vertical = lead.vertical_id ? verticalLabel(String(lead.vertical_id)) : null;
    const businessId = route.business_id;
    after(async () => {
      try {
        const { data: biz } = await db.from("businesses").select("name").eq("id", businessId).maybeSingle();
        if (!biz?.name) return;
        const t = leadAcceptedConsumerEmail({ name: consumerName, businessName: String(biz.name), vertical });
        await sendEmail({ to: consumerEmail, subject: t.subject, html: t.html, template: "lead-accepted-consumer" });
      } catch { /* email best-effort */ }
    });
  }

  return NextResponse.json({ ok: true, contact: { name: lead.name ?? null, email: lead.email ?? null, phone: lead.phone ?? null } });
}
