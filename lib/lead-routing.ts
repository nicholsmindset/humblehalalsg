/* Lead marketplace routing engine — match a quote request to claimed
   businesses and fan it out (shared-lead / Bark model, capped at
   LEAD_ROUTE_CAP). Pure matching in matchBusinessesForLead(); side effects
   (insert routes, notify, mark routed) in routeLead(). Called from the admin
   "Route" action (beta) and later inline from /api/leads (LEAD_AUTO_ROUTE). */

import type { getSupabaseAdmin } from "@/lib/supabase/server";
import { PLAN_KEYS, planKey } from "@/lib/plans";
import { LEAD_ROUTE_CAP, verticalLabel } from "@/lib/lead-verticals";
import { leadRoutedEmail } from "@/lib/emails/templates";
import { sendEmail } from "@/lib/email";

type Db = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

export interface LeadRow {
  id: string;
  name: string | null;
  vertical_id: string | null;
  area: string | null;
  budget: string | null;
  event_date: string | null;
  source_listing_slug: string | null;
  status: string | null;
  consent_contact?: boolean | null;
}

export interface MatchCandidate {
  business_id: string;
  slug: string;
  name: string;
  owner_id: string | null;
  claimed_by: string | null;
  plan: string | null;
  hasQuota: boolean;
}

export interface MatchResult {
  candidates: MatchCandidate[];
  vertical: string | null;
  area: string | null;
  gap: boolean; // matched fewer than the 3-provider target
}

const TARGET_MIN = 3;

/** Businesses eligible for a lead, ranked, capped at LEAD_ROUTE_CAP. */
export async function matchBusinessesForLead(db: Db, lead: LeadRow): Promise<MatchResult> {
  const vertical = lead.vertical_id;
  const area = lead.area;
  if (!vertical) return { candidates: [], vertical, area, gap: true };

  // Preferences opting into this vertical (and area, if the business set one).
  const { data: prefs } = await db
    .from("lead_preferences")
    .select("business_id, verticals, areas, active")
    .contains("verticals", [vertical])
    .eq("active", true);

  const prefRows = (prefs || []).filter((p) => {
    const areas: string[] = Array.isArray(p.areas) ? p.areas : [];
    return areas.length === 0 || (area != null && areas.includes(area));
  });
  if (prefRows.length === 0) return { candidates: [], vertical, area, gap: true };

  const ids = prefRows.map((p) => p.business_id);
  const { data: bizRows } = await db
    .from("businesses")
    .select("id, slug, name, owner_id, claimed_by, plan, status")
    .in("id", ids)
    .eq("status", "published");

  // Claimed only — a lead can't be "accepted" by an unowned listing.
  const claimed = (bizRows || []).filter((b) => b.owner_id || b.claimed_by);
  if (claimed.length === 0) return { candidates: [], vertical, area, gap: true };

  // Which of these have an active leads subscription with remaining quota?
  const quotaByBiz = await remainingQuota(db, claimed.map((b) => b.id));

  const candidates: MatchCandidate[] = claimed.map((b) => ({
    business_id: b.id,
    slug: b.slug,
    name: b.name,
    owner_id: b.owner_id,
    claimed_by: b.claimed_by,
    plan: b.plan,
    hasQuota: (quotaByBiz[b.id] ?? 0) > 0,
  }));

  const planRank = (p: string | null) => PLAN_KEYS.indexOf(planKey(p));
  candidates.sort((a, b) => {
    // 1. the listing the consumer was viewing gets slot 1
    if (lead.source_listing_slug) {
      if (a.slug === lead.source_listing_slug) return -1;
      if (b.slug === lead.source_listing_slug) return 1;
    }
    // 2. active leads subscription with quota first
    if (a.hasQuota !== b.hasQuota) return a.hasQuota ? -1 : 1;
    // 3. higher listing plan first
    return planRank(b.plan) - planRank(a.plan);
  });

  const capped = candidates.slice(0, LEAD_ROUTE_CAP);
  return { candidates: capped, vertical, area, gap: capped.length < TARGET_MIN };
}

/** Remaining quota per business in the CURRENT billing period (counted, not stored). */
export async function remainingQuota(db: Db, businessIds: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  if (businessIds.length === 0) return out;
  const { data: subs } = await db
    .from("subscriptions")
    .select("business_id, status, monthly_quota, current_period_start")
    .eq("kind", "leads")
    .in("business_id", businessIds);

  for (const s of subs || []) {
    if (!s.business_id) continue;
    const active = s.status === "active" || s.status === "trialing";
    if (!active || !s.monthly_quota) { out[s.business_id] = 0; continue; }
    const since = s.current_period_start || new Date(0).toISOString();
    const { count } = await db
      .from("lead_routes")
      .select("id", { count: "exact", head: true })
      .eq("business_id", s.business_id)
      .eq("quota_consumed", true)
      .gte("accepted_at", since);
    out[s.business_id] = Math.max(0, s.monthly_quota - (count || 0));
  }
  return out;
}

/** Create routes for a lead + notify each matched business. Idempotent per
   (lead, business) via the unique index. Returns the number of new routes. */
export async function routeLead(
  db: Db,
  lead: LeadRow,
  candidates: MatchCandidate[],
): Promise<number> {
  if (candidates.length === 0) return 0;

  const rows = candidates.map((c) => ({ lead_id: lead.id, business_id: c.business_id, status: "sent" }));
  const { error } = await db.from("lead_routes").upsert(rows, { onConflict: "lead_id,business_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);

  await db.from("leads").update({ status: "routed", routed_at: new Date().toISOString() }).eq("id", lead.id);

  const verticalName = lead.vertical_id ? verticalLabel(lead.vertical_id) : "service";

  // Best-effort notifications — never fail the route on a notify error.
  for (const c of candidates) {
    const ownerSub = c.owner_id || c.claimed_by;
    if (!ownerSub) continue;
    try {
      await db.from("notifications").insert({
        user_id: ownerSub,
        type: "lead_routed",
        title: `New ${verticalName} enquiry`,
        body: [lead.area, lead.budget].filter(Boolean).join(" · ") || "Tap to view and accept.",
        link: "/owner?tab=leads",
        dedupe_key: `lead_routed:${lead.id}:${c.business_id}`,
      });
    } catch { /* dedupe/RLS — ignore */ }
  }

  // Email owners we can reach (owner email lives on profiles by Clerk sub).
  const subs = candidates.map((c) => c.owner_id || c.claimed_by).filter(Boolean) as string[];
  if (subs.length) {
    const { data: profiles } = await db.from("profiles").select("id, email, name").in("id", subs);
    for (const pr of profiles || []) {
      if (!pr.email) continue;
      try {
        const t = leadRoutedEmail({
          name: pr.name, vertical: verticalName,
          area: lead.area, budget: lead.budget, when: lead.event_date,
        });
        await sendEmail({ to: pr.email, subject: t.subject, html: t.html, template: "lead-routed" });
      } catch { /* email best-effort */ }
    }
  }

  return candidates.length;
}
