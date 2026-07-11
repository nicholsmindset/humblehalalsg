import { NextResponse, after } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags, resolveBusinessFlag } from "@/lib/feature-flags";
import { remainingQuota, advanceLeadCascade } from "@/lib/lead-routing";
import { maskName, maskEmail, maskPhone } from "@/lib/lead-mask";
import { verticalLabel } from "@/lib/lead-verticals";
import { leadPlan } from "@/lib/lead-plans";

/* Owner leads inbox. Returns routed leads for the businesses the caller owns,
   with consumer PII MASKED until a route is accepted (accept consumes quota).
   Marks freshly-seen routes as viewed. Ownership enforced via owner_id OR
   claimed_by === Clerk userId; the service-role client is used only after. */
export const dynamic = "force-dynamic";

type Db = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

async function ownedBusinessIds(db: Db, userId: string): Promise<string[]> {
  const { data } = await db
    .from("businesses")
    .select("id")
    .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`);
  return (data || []).map((b) => b.id);
}

export async function GET() {
  const { leadRouting, paidLeads: globalPaidLeads } = await getServerFlags();
  if (!leadRouting) return NextResponse.json({ ok: true, enabled: false, routes: [] });

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const bizIds = await ownedBusinessIds(db, userId);
  if (bizIds.length === 0) return NextResponse.json({ ok: true, enabled: true, paidLeads: globalPaidLeads, routes: [], quota: null });

  // Per-business resolved paidLeads (what /accept will actually enforce) — a
  // business override must not be contradicted by the global flag here (R5).
  // Top-level `paidLeads` = any owned business resolved true (drives quota UI).
  const paidByBiz: Record<string, boolean> = {};
  await Promise.all(bizIds.map(async (id) => { paidByBiz[id] = await resolveBusinessFlag("paidLeads", id); }));
  const paidLeads = bizIds.some((id) => paidByBiz[id]);

  // mode/delivery/expires_at are 0066 — retry without them pre-paste.
  let routes: Record<string, unknown>[] | null;
  {
    const sel = "id, lead_id, business_id, status, accepted_at, sent_at, viewed_at, mode, delivery, expires_at, leads(name,email,phone,vertical_id,area,budget,event_date,details,created_at)";
    const r = await db.from("lead_routes").select(sel).in("business_id", bizIds).neq("status", "expired").order("sent_at", { ascending: false }).limit(100);
    if (r.error && /column|schema cache/i.test(r.error.message || "")) {
      routes = (await db.from("lead_routes")
        .select("id, lead_id, business_id, status, accepted_at, sent_at, viewed_at, leads(name,email,phone,vertical_id,area,budget,event_date,details,created_at)")
        .in("business_id", bizIds).neq("status", "expired").order("sent_at", { ascending: false }).limit(100)).data;
    } else {
      routes = r.data;
    }
  }

  // Opportunistic cascade advance (post-response): an owner opening their
  // inbox is a natural moment to move any overdue exclusive holds along.
  after(async () => { try { await advanceLeadCascade(db, 10); } catch { /* best-effort */ } });

  // Mark unseen as viewed (best-effort).
  const unseen = (routes || []).filter((r) => !r.viewed_at).map((r) => r.id);
  if (unseen.length) {
    try { await db.from("lead_routes").update({ status: "viewed", viewed_at: new Date().toISOString() }).in("id", unseen).eq("status", "sent"); } catch { /* noop */ }
  }

  const shaped = (routes || []).map((r) => {
    const raw = r.leads as unknown;
    const lead = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown> | undefined ?? {};
    const accepted = r.status === "accepted" || r.status === "contacted" || r.status === "won" || r.status === "lost";
    // Free-taste routes (a business's first-ever lead) arrive with FULL
    // contact — the gift is the whole point, so the inbox unmasks them too.
    const fullDelivery = (r as { delivery?: string }).delivery === "full";
    const unmasked = accepted || fullDelivery;
    const vertical = lead.vertical_id ? verticalLabel(String(lead.vertical_id)) : "Enquiry";
    return {
      id: r.id,
      businessId: r.business_id,
      status: r.status,
      sentAt: r.sent_at,
      vertical,
      area: lead.area ?? null,
      budget: lead.budget ?? null,
      when: lead.event_date ?? null,
      details: lead.details ?? null,
      // PII after acceptance — or on the free full-contact taste.
      name: unmasked ? (lead.name ?? null) : maskName(lead.name as string),
      email: unmasked ? (lead.email ?? null) : maskEmail(lead.email as string),
      phone: unmasked ? (lead.phone ?? null) : maskPhone(lead.phone as string),
      accepted,
      exclusive: (r as { mode?: string }).mode === "exclusive",
      expiresAt: (r as { expires_at?: string | null }).expires_at ?? null,
      freeLead: fullDelivery,
    };
  });

  // Quota — summed across the owner's businesses (typically one).
  const remaining = await remainingQuota(db, bizIds);
  const { data: subs } = await db
    .from("subscriptions")
    .select("business_id, plan, status, monthly_quota, current_period_end")
    .eq("kind", "leads")
    .in("business_id", bizIds);
  const activeSub = (subs || []).find((s) => s.status === "active" || s.status === "trialing") || null;
  const plan = activeSub ? leadPlan(activeSub.plan) : null;
  const monthly = activeSub?.monthly_quota ?? plan?.quota ?? 0;
  const remainingTotal = bizIds.reduce((n, id) => n + (remaining[id] ?? 0), 0);

  const quota = {
    active: !!activeSub,
    planName: plan?.name ?? null,
    monthly,
    remaining: remainingTotal,
    used: Math.max(0, monthly - remainingTotal),
    periodEnd: activeSub?.current_period_end ?? null,
  };

  return NextResponse.json({ ok: true, enabled: true, paidLeads, routes: shaped, quota });
}
