/* Lead marketplace routing engine — match a quote request to claimed
   businesses and fan it out (shared-lead / Bark model, capped at
   LEAD_ROUTE_CAP). Pure matching in matchBusinessesForLead(); side effects
   (insert routes, notify, mark routed) in routeLead(). Called from the admin
   "Route" action (beta) and later inline from /api/leads (LEAD_AUTO_ROUTE). */

import type { getSupabaseAdmin } from "@/lib/supabase/server";
import { PLAN_KEYS, planKey } from "@/lib/plans";
import { LEAD_ROUTE_CAP, verticalLabel } from "@/lib/lead-verticals";
import { leadRoutedEmail, leadFullContactEmail } from "@/lib/emails/templates";
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
  /** PII — only ever forwarded for consented leads (routeLeadExclusive guard). */
  email?: string | null;
  phone?: string | null;
  details?: string | null;
}

export interface MatchCandidate {
  business_id: string;
  slug: string;
  name: string;
  owner_id: string | null;
  claimed_by: string | null;
  plan: string | null;
  hasQuota: boolean;
  /** Exclusive-rotor extras (optional — legacy callers unaffected). */
  claimed?: boolean;
  contactEmail?: string | null;
  phone?: string | null;
}

export interface MatchResult {
  candidates: MatchCandidate[];
  vertical: string | null;
  area: string | null;
  gap: boolean; // matched fewer than the 3-provider target
}

const TARGET_MIN = 3;

export interface MatchOpts {
  /** Include admin-added UNCLAIMED businesses as a lower tier (exclusive-rotor
      outreach: their free lead is delivered by email/WhatsApp, and claiming
      the listing surfaces it in the inbox). Default false = legacy behaviour. */
  includeUnclaimed?: boolean;
  /** Return the full ranked pool instead of slicing to LEAD_ROUTE_CAP — the
      rotor needs the whole pool to cascade through (hops are capped separately). */
  uncapped?: boolean;
}

/** Businesses eligible for a lead, ranked, capped at LEAD_ROUTE_CAP. */
export async function matchBusinessesForLead(db: Db, lead: LeadRow, opts: MatchOpts = {}): Promise<MatchResult> {
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
  // contact_email is 0066 — retry without it so matching never breaks pre-paste.
  let bizRows: Record<string, unknown>[] | null;
  {
    const r = await db
      .from("businesses")
      .select("id, slug, name, owner_id, claimed_by, plan, status, phone, contact_email")
      .in("id", ids)
      .eq("status", "published");
    if (r.error && /column|schema cache/i.test(r.error.message || "")) {
      bizRows = (await db.from("businesses").select("id, slug, name, owner_id, claimed_by, plan, status, phone").in("id", ids).eq("status", "published")).data;
    } else {
      bizRows = r.data;
    }
  }

  // Claimed only by default — a lead can't be "accepted" by an unowned listing.
  // The exclusive rotor may include admin-added unclaimed businesses (ranked last).
  const pool = (bizRows || []).filter((b) => opts.includeUnclaimed || b.owner_id || b.claimed_by);
  if (pool.length === 0) return { candidates: [], vertical, area, gap: true };

  // Which of these have an active leads subscription with remaining quota?
  const quotaByBiz = await remainingQuota(db, pool.map((b) => String(b.id)));

  const candidates: MatchCandidate[] = pool.map((b) => ({
    business_id: String(b.id),
    slug: String(b.slug),
    name: String(b.name),
    owner_id: (b.owner_id as string) ?? null,
    claimed_by: (b.claimed_by as string) ?? null,
    plan: (b.plan as string) ?? null,
    hasQuota: (quotaByBiz[String(b.id)] ?? 0) > 0,
    claimed: !!(b.owner_id || b.claimed_by),
    contactEmail: (b.contact_email as string) ?? null,
    phone: (b.phone as string) ?? null,
  }));

  const planRank = (p: string | null) => PLAN_KEYS.indexOf(planKey(p));
  candidates.sort((a, b) => {
    // 1. the listing the consumer was viewing gets slot 1
    if (lead.source_listing_slug) {
      if (a.slug === lead.source_listing_slug) return -1;
      if (b.slug === lead.source_listing_slug) return 1;
    }
    // 2. claimed businesses always outrank unclaimed outreach targets
    if (a.claimed !== b.claimed) return a.claimed ? -1 : 1;
    // 3. active leads subscription with quota first
    if (a.hasQuota !== b.hasQuota) return a.hasQuota ? -1 : 1;
    // 4. higher listing plan first
    return planRank(b.plan) - planRank(a.plan);
  });

  const capped = opts.uncapped ? candidates : candidates.slice(0, LEAD_ROUTE_CAP);
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

/* ── Exclusive round-robin routing + 24h cascade (leads growth loop) ──────
   One lead → ONE vendor at a time. A vendor's FIRST-EVER lead is delivered
   FREE with full contact (delivery='full', branded outreach); later leads are
   teasers accepted in-app. If a vendor doesn't act within 24h the route
   expires and the lead cascades to the next vendor in rotation (hops capped
   at LEAD_ROUTE_CAP, matching the consent copy). Rotation state is DERIVED
   from lead_routes history — no rotor table to corrupt. All functions degrade
   gracefully pre-0066 (missing columns → no-op/teaser-safe). */

export const EXCLUSIVE_TTL_MS = 24 * 60 * 60 * 1000;

const LEAD_FIELDS = "id, name, email, phone, vertical_id, area, budget, event_date, details, source_listing_slug, status, consent_contact";

/** Pure rotation pick: never-routed businesses first, then least-recently
    routed, tie-broken by the match ranking; the consumer's source listing is
    pinned first; businesses already routed for THIS lead are excluded. */
export function pickNextExclusive(
  candidates: MatchCandidate[],
  lastSentByBiz: Record<string, string | null | undefined>,
  alreadyRouted: Set<string>,
  sourceListingSlug?: string | null,
): MatchCandidate | null {
  const pool = candidates.filter((c) => !alreadyRouted.has(c.business_id));
  if (pool.length === 0) return null;
  if (sourceListingSlug) {
    const pinned = pool.find((c) => c.slug === sourceListingSlug);
    if (pinned) return pinned;
  }
  const qualityRank = new Map(candidates.map((c, i) => [c.business_id, i]));
  const sorted = [...pool].sort((a, b) => {
    const la = lastSentByBiz[a.business_id] ?? null;
    const lb = lastSentByBiz[b.business_id] ?? null;
    if ((la === null) !== (lb === null)) return la === null ? -1 : 1; // never-routed first
    if (la !== null && lb !== null && la !== lb) return la < lb ? -1 : 1; // least-recent first
    return (qualityRank.get(a.business_id) ?? 0) - (qualityRank.get(b.business_id) ?? 0);
  });
  return sorted[0] ?? null;
}

/** Most recent route sent_at per business (rotation fairness input). */
export async function lastRoutedByBusiness(db: Db, businessIds: string[]): Promise<Record<string, string | null>> {
  const out: Record<string, string | null> = {};
  for (const id of businessIds) out[id] = null;
  if (businessIds.length === 0) return out;
  const { data } = await db
    .from("lead_routes")
    .select("business_id, sent_at")
    .in("business_id", businessIds)
    .order("sent_at", { ascending: false })
    .limit(500);
  for (const r of data || []) {
    const b = String(r.business_id);
    if (out[b] === null && r.sent_at) out[b] = String(r.sent_at);
  }
  return out;
}

/** Has this business ever received its free full-contact lead? Fail-SAFE to
    true (→ teaser) when the 0066 delivery column isn't live yet. */
export async function hasHadFreeLead(db: Db, businessId: string): Promise<boolean> {
  const { data, error } = await db
    .from("lead_routes")
    .select("id")
    .eq("business_id", businessId)
    .eq("delivery", "full")
    .limit(1);
  if (error) return true; // pre-0066 / transient → never gift blindly
  return (data || []).length > 0;
}

export type ExclusiveRouteResult = "routed-full" | "routed-teaser" | "duplicate" | "blocked" | "schema";

/** Route a lead EXCLUSIVELY to one candidate: first-ever lead for the business
    goes FREE with full contact, later ones as teasers. PDPA: hard-refuses
    leads without consent_contact — contact is never forwarded unconsented. */
export async function routeLeadExclusive(db: Db, lead: LeadRow, c: MatchCandidate): Promise<ExclusiveRouteResult> {
  if (lead.consent_contact !== true) return "blocked";

  const free = !(await hasHadFreeLead(db, c.business_id));
  const delivery = free ? "full" : "teaser";
  const expiresAt = new Date(Date.now() + EXCLUSIVE_TTL_MS).toISOString();

  const { error } = await db.from("lead_routes").insert({
    lead_id: lead.id,
    business_id: c.business_id,
    status: "sent",
    mode: "exclusive",
    delivery,
    expires_at: expiresAt,
  });
  if (error) {
    if (error.code === "23505") return "duplicate";
    if (/column|schema cache|check constraint/i.test(error.message || "")) return "schema"; // pre-0066
    throw new Error(error.message);
  }

  await db.from("leads").update({ status: "routed", routed_at: new Date().toISOString() }).eq("id", lead.id);

  const verticalName = lead.vertical_id ? verticalLabel(lead.vertical_id) : "service";
  const ownerSub = c.owner_id || c.claimed_by;

  // Bell notification for claimed businesses (best-effort).
  if (ownerSub) {
    try {
      await db.from("notifications").insert({
        user_id: ownerSub,
        type: "lead_routed",
        title: `New ${verticalName} enquiry — reserved for you`,
        body: [lead.area, lead.budget].filter(Boolean).join(" · ") || "Exclusive for 24h — tap to view.",
        link: "/owner?tab=leads",
        dedupe_key: `lead_routed:${lead.id}:${c.business_id}`,
      });
    } catch { /* dedupe/RLS — ignore */ }
  }

  // Delivery email: claimed → owner profile email; unclaimed → admin-entered
  // contact_email (outreach). No address → route stays undelivered for the
  // admin WhatsApp queue (delivered_at null).
  let to: string | null = null;
  let toName: string | null = null;
  if (ownerSub) {
    const { data: pr } = await db.from("profiles").select("email, name").eq("id", ownerSub).maybeSingle();
    to = (pr?.email as string) || null;
    toName = (pr?.name as string) || null;
  }
  if (!to && c.contactEmail) to = c.contactEmail;

  let channel: string | null = ownerSub ? "inbox" : null; // claimed sees it in-app regardless
  if (to) {
    try {
      const t = delivery === "full"
        ? leadFullContactEmail({
            name: toName,
            businessName: c.name,
            vertical: verticalName,
            claimed: !!ownerSub,
            slug: c.slug,
            lead: {
              name: lead.name, email: lead.email ?? null, phone: lead.phone ?? null,
              area: lead.area, budget: lead.budget, when: lead.event_date, details: lead.details ?? null,
            },
          })
        : leadRoutedEmail({ name: toName, vertical: verticalName, area: lead.area, budget: lead.budget, when: lead.event_date, exclusive: true });
      await sendEmail({ to, subject: t.subject, html: t.html, template: delivery === "full" ? "lead-free-full" : "lead-routed", businessId: c.business_id });
      channel = "email";
    } catch { /* email best-effort — inbox/queue still covers delivery */ }
  }
  if (channel) {
    try {
      await db.from("lead_routes")
        .update({ delivered_at: new Date().toISOString(), delivery_channel: channel })
        .eq("lead_id", lead.id).eq("business_id", c.business_id);
    } catch { /* cosmetic */ }
  }

  return delivery === "full" ? "routed-full" : "routed-teaser";
}

/** Pick + route the next vendor for a lead (intake auto-route, admin
    route-exclusive, and each cascade hop all funnel through here). */
export async function autoRouteLead(db: Db, leadId: string, opts: { pinSource?: boolean } = { pinSource: true }): Promise<ExclusiveRouteResult | "no_match" | "wrong_state" | "not_found"> {
  const { data: leadRow } = await db.from("leads").select(LEAD_FIELDS).eq("id", leadId).maybeSingle();
  if (!leadRow) return "not_found";
  const lead = leadRow as unknown as LeadRow;
  if (lead.consent_contact !== true) return "blocked";
  if (lead.status && !["new", "reviewing", "routed"].includes(lead.status)) return "wrong_state";

  const { data: prior } = await db.from("lead_routes").select("business_id").eq("lead_id", leadId);
  const routedSet = new Set((prior || []).map((p) => String(p.business_id)));
  if (routedSet.size >= LEAD_ROUTE_CAP) return "no_match"; // consent cap: never exceed 5 providers

  const match = await matchBusinessesForLead(db, lead, { includeUnclaimed: true, uncapped: true });
  if (match.candidates.length === 0) return "no_match";
  const lastByBiz = await lastRoutedByBusiness(db, match.candidates.map((c) => c.business_id));
  const next = pickNextExclusive(match.candidates, lastByBiz, routedSet, opts.pinSource ? lead.source_listing_slug : null);
  if (!next) return "no_match";
  return routeLeadExclusive(db, lead, next);
}

/** Expire overdue exclusive routes and cascade each lead to its next vendor.
    Race-safe: only the caller whose conditional update wins advances a route.
    Called by the daily cron + opportunistically (after()) on hot paths. */
export async function advanceLeadCascade(db: Db, limit = 20): Promise<{ advanced: number; exhausted: number }> {
  const nowIso = new Date().toISOString();
  let advanced = 0, exhausted = 0;

  const { data: due, error } = await db
    .from("lead_routes")
    .select("id, lead_id")
    .eq("mode", "exclusive")
    .in("status", ["sent", "viewed"])
    .lt("expires_at", nowIso)
    .limit(limit);
  if (error || !due?.length) return { advanced, exhausted }; // pre-0066 lands here harmlessly

  for (const r of due) {
    // Atomic claim — a concurrent cascade caller gets 0 rows and skips.
    const { data: claimed } = await db
      .from("lead_routes")
      .update({ status: "expired", outcome_at: nowIso })
      .eq("id", r.id)
      .in("status", ["sent", "viewed"])
      .select("id");
    if (!claimed?.length) continue;

    const res = await autoRouteLead(db, String(r.lead_id), { pinSource: false });
    if (res === "routed-full" || res === "routed-teaser") {
      advanced++;
    } else {
      // Rotation exhausted (or blocked) → hand back to the admin queue.
      exhausted++;
      try { await db.from("leads").update({ status: "reviewing" }).eq("id", r.lead_id); } catch { /* best-effort */ }
    }
  }
  return { advanced, exhausted };
}
