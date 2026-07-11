import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { matchBusinessesForLead, routeLead, autoRouteLead, routeLeadExclusive, lastRoutedByBusiness, pickNextExclusive, advanceLeadCascade, type LeadRow } from "@/lib/lead-routing";
import { verticalLabel } from "@/lib/lead-verticals";

/* Admin lead pipeline (beta: admin approves + routes each lead).
   GET  ?status=  → leads with their routes + a matched-vendor preview + gap flag
   POST { id, action: 'route'|'reroute'|'spam'|'close', businessIds? }
   Admin-gated; service-role after the gate. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const status = new URL(req.url).searchParams.get("status") || "";
  let q = db.from("leads")
    .select("id, name, email, phone, vertical_id, area, budget, event_date, details, source_listing_slug, consent_contact, status, created_at, routed_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) q = q.eq("status", status);
  const { data: leads } = await q;

  // Routes for these leads (routed/contacted view + the WhatsApp delivery
  // queue: exclusive routes with delivered_at null need a manual send).
  const ids = (leads || []).map((l) => l.id);
  type RouteShape = { business_id: string; status: string; mode?: string | null; delivery?: string | null; deliveredAt?: string | null; expiresAt?: string | null; businessName?: string | null; businessPhone?: string | null };
  const routesByLead: Record<string, RouteShape[]> = {};
  if (ids.length) {
    // mode/delivery/delivered_at/expires_at are 0066 — retry without pre-paste.
    let routes: Record<string, unknown>[] | null;
    {
      const r = await db.from("lead_routes").select("lead_id, business_id, status, mode, delivery, delivered_at, expires_at, businesses(name, phone)").in("lead_id", ids);
      if (r.error && /column|schema cache/i.test(r.error.message || "")) {
        routes = (await db.from("lead_routes").select("lead_id, business_id, status, businesses(name, phone)").in("lead_id", ids)).data;
      } else {
        routes = r.data;
      }
    }
    for (const r of routes || []) {
      const rawBiz = (r as { businesses?: unknown }).businesses;
      const biz = (Array.isArray(rawBiz) ? rawBiz[0] : rawBiz) as { name?: string; phone?: string } | undefined;
      (routesByLead[String(r.lead_id)] ||= []).push({
        business_id: String(r.business_id),
        status: String(r.status),
        mode: (r as { mode?: string }).mode ?? null,
        delivery: (r as { delivery?: string }).delivery ?? null,
        deliveredAt: (r as { delivered_at?: string }).delivered_at ?? null,
        expiresAt: (r as { expires_at?: string }).expires_at ?? null,
        businessName: biz?.name ?? null,
        businessPhone: biz?.phone ?? null,
      });
    }
  }

  // For not-yet-routed leads, compute the matched-vendor preview + gap flag.
  const shaped = [];
  for (const l of leads || []) {
    const base = {
      id: l.id, name: l.name, verticalId: l.vertical_id,
      vertical: l.vertical_id ? verticalLabel(l.vertical_id) : "—",
      // Consumer contact — admin-only, and only for consented leads, so the
      // WhatsApp delivery queue can forward the free lead to an unclaimed vendor.
      email: l.consent_contact ? l.email : null,
      phone: l.consent_contact ? l.phone : null,
      area: l.area, budget: l.budget, when: l.event_date, details: l.details,
      status: l.status, consent: l.consent_contact, createdAt: l.created_at,
      sourceSlug: l.source_listing_slug,
      routes: routesByLead[l.id] || [],
    };
    if (l.status === "new" || l.status === "reviewing") {
      const m = await matchBusinessesForLead(db, l as LeadRow);
      shaped.push({ ...base, match: { count: m.candidates.length, gap: m.gap, candidates: m.candidates.map((c) => ({ id: c.business_id, name: c.name, plan: c.plan, hasQuota: c.hasQuota })) } });
    } else {
      shaped.push({ ...base, match: null });
    }
  }

  return NextResponse.json({ ok: true, leads: shaped });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let id = "", action = "", businessIds: string[] = [];
  try {
    const b = (await req.json()) as { id?: string; action?: string; businessIds?: string[] };
    id = String(b.id || ""); action = String(b.action || "");
    businessIds = Array.isArray(b.businessIds) ? b.businessIds.map(String) : [];
  } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 400 });

  if (action === "spam" || action === "close") {
    const next = action === "spam" ? "spam" : "closed";
    const { error } = await db.from("leads").update({ status: next }).eq("id", id);
    if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });
    await logAudit(db, { actor: gate.userId, action: `lead_${action}`, target: id });
    return NextResponse.json({ ok: true, status: next });
  }

  if (action === "route" || action === "reroute") {
    const { data: lead } = await db
      .from("leads")
      .select("id, name, vertical_id, area, budget, event_date, source_listing_slug, status, consent_contact")
      .eq("id", id).maybeSingle();
    if (!lead) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    if (!lead.consent_contact) return NextResponse.json({ ok: false, error: "no_consent" }, { status: 409 });

    const match = await matchBusinessesForLead(db, lead as LeadRow);
    let candidates = match.candidates;
    if (businessIds.length) candidates = candidates.filter((c) => businessIds.includes(c.business_id));
    if (candidates.length === 0) return NextResponse.json({ ok: false, error: "no_matches", gap: true }, { status: 409 });

    const n = await routeLead(db, lead as LeadRow, candidates);
    await logAudit(db, { actor: gate.userId, action: `lead_${action}`, target: id, meta: { routed: n } });
    return NextResponse.json({ ok: true, routed: n });
  }

  // Round-robin: send this lead EXCLUSIVELY to the next vendor in rotation
  // (or to an explicit businessIds[0] override). First-ever lead for that
  // business goes free with full contact; cascades after 24h of no action.
  if (action === "route-exclusive") {
    if (businessIds.length) {
      const { data: lead } = await db
        .from("leads")
        .select("id, name, email, phone, vertical_id, area, budget, event_date, details, source_listing_slug, status, consent_contact")
        .eq("id", id).maybeSingle();
      if (!lead) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
      if (!lead.consent_contact) return NextResponse.json({ ok: false, error: "no_consent" }, { status: 409 });
      const match = await matchBusinessesForLead(db, lead as LeadRow, { includeUnclaimed: true, uncapped: true });
      const { data: prior } = await db.from("lead_routes").select("business_id").eq("lead_id", id);
      const routed = new Set((prior || []).map((p) => String(p.business_id)));
      const pool = match.candidates.filter((c) => businessIds.includes(c.business_id));
      const lastByBiz = await lastRoutedByBusiness(db, pool.map((c) => c.business_id));
      const next = pickNextExclusive(pool, lastByBiz, routed, null);
      if (!next) return NextResponse.json({ ok: false, error: "no_matches" }, { status: 409 });
      const res = await routeLeadExclusive(db, lead as LeadRow, next);
      await logAudit(db, { actor: gate.userId, action: "lead_route_exclusive", target: id, meta: { business: next.business_id, result: res } });
      return res.startsWith("routed")
        ? NextResponse.json({ ok: true, routed: 1, delivery: res === "routed-full" ? "full" : "teaser", business: next.name })
        : NextResponse.json({ ok: false, error: res }, { status: res === "schema" ? 503 : 409 });
    }
    const res = await autoRouteLead(db, id);
    await logAudit(db, { actor: gate.userId, action: "lead_route_exclusive", target: id, meta: { result: res } });
    if (res === "routed-full" || res === "routed-teaser") {
      return NextResponse.json({ ok: true, routed: 1, delivery: res === "routed-full" ? "full" : "teaser" });
    }
    return NextResponse.json({ ok: false, error: res }, { status: res === "schema" ? 503 : 409 });
  }

  // Opportunistic cascade sweep (admin working the queue keeps holds moving).
  if (action === "cascade") {
    const { advanced, exhausted } = await advanceLeadCascade(db, 50);
    return NextResponse.json({ ok: true, advanced, exhausted });
  }

  // WhatsApp queue: admin sent the free lead manually via the wa.me deep-link
  // → record it so the route stops showing as needing delivery. `id` here is
  // the LEAD id + businessIds[0] identifies the route (matches the UI shape).
  if (action === "mark-delivered") {
    const businessId = businessIds[0] || "";
    if (!businessId) return NextResponse.json({ ok: false, error: "missing_business" }, { status: 422 });
    const { error } = await db.from("lead_routes")
      .update({ delivered_at: new Date().toISOString(), delivery_channel: "whatsapp" })
      .eq("lead_id", id).eq("business_id", businessId).is("delivered_at", null);
    if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });
    await logAudit(db, { actor: gate.userId, action: "lead_marked_delivered", target: id, meta: { business: businessId, channel: "whatsapp" } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "bad_action" }, { status: 400 });
}
