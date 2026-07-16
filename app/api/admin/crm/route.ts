import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { crmSyncConfigured, dispatchCrmOutbox } from "@/lib/crm-sync";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function gate() {
  const result = await requireAdmin();
  if (!result.ok) return { response: NextResponse.json({ ok: false, error: result.error }, { status: result.status }) };
  return { userId: result.userId };
}

export async function GET() {
  const access = await gate();
  if (access.response) return access.response;
  const db = getSupabaseAdmin()!;

  const since30 = new Date(Date.now() - 30 * 864e5).toISOString();
  const [pending, failed, delivered, latest, listings, claims, events, reports, campaigns, hotelBookings, flightBookings, emails, recentEmails] = await Promise.all([
    db.from("crm_outbox").select("id", { count: "exact", head: true }).is("processed_at", null),
    db.from("crm_outbox").select("id", { count: "exact", head: true }).is("processed_at", null).not("last_error", "is", null),
    db.from("crm_outbox").select("id", { count: "exact", head: true }).not("processed_at", "is", null),
    db.from("crm_outbox").select("processed_at").not("processed_at", "is", null).order("processed_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("staging_businesses").select("id", { count: "exact", head: true }).in("review_status", ["new", "reviewing"]),
    db.from("claims").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("events").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("reports").select("id", { count: "exact", head: true }).in("status", ["open", "reviewing"]),
    db.from("ad_campaigns").select("id", { count: "exact", head: true }).or("review_status.eq.pending,status.in.(draft,scheduled)"),
    db.from("hotel_bookings").select("id", { count: "exact", head: true }).gte("created_at", since30),
    db.from("flight_bookings").select("id", { count: "exact", head: true }).gte("created_at", since30),
    db.from("email_log").select("id", { count: "exact", head: true }).gte("sent_at", since30),
    db.from("email_log").select("id, template, sent_at").order("sent_at", { ascending: false }).limit(8),
  ]);

  const missingTable = [pending.error, failed.error, delivered.error, latest.error].some(Boolean);
  return NextResponse.json({
    ok: true,
    configured: crmSyncConfigured(),
    migrationReady: !missingTable,
    outbox: {
      pending: pending.count ?? 0,
      failed: failed.count ?? 0,
      delivered: delivered.count ?? 0,
      lastDeliveredAt: latest.data?.processed_at ?? null,
    },
    operations: {
      queue: {
        total: (listings.count ?? 0) + (claims.count ?? 0) + (events.count ?? 0) + (reports.count ?? 0),
        listings: listings.count ?? 0, claims: claims.count ?? 0, events: events.count ?? 0, reports: reports.count ?? 0,
      },
      sponsorships: { attention: campaigns.count ?? 0 },
      travel: { hotelBookings30d: hotelBookings.count ?? 0, flightBookings30d: flightBookings.count ?? 0 },
      communications: {
        resendConfigured: !!process.env.RESEND_API_KEY,
        replyTo: process.env.EMAIL_REPLY_TO || "hello@humblehalal.com",
        sent30d: emails.count ?? 0,
        recent: (recentEmails.data || []).map((item) => ({ id: item.id, template: item.template || "transactional", sentAt: item.sent_at })),
      },
    },
  });
}

export async function POST(req: Request) {
  const access = await gate();
  if (access.response) return access.response;
  const body = await req.json().catch(() => ({})) as { action?: string };
  const db = getSupabaseAdmin()!;

  if (body.action === "bootstrap") {
    const { data, error } = await db.rpc("enqueue_crm_snapshot");
    if (error) return NextResponse.json({ ok: false, error: "snapshot_failed" }, { status: 502 });
    await logAudit(db, { actor: access.userId!, action: "crm.snapshot_enqueued", target: "crm", meta: data ?? {} });
    return NextResponse.json({ ok: true, snapshot: data });
  }

  if (body.action === "sync") {
    try {
      const result = await dispatchCrmOutbox(100);
      await logAudit(db, { actor: access.userId!, action: "crm.sync_requested", target: "crm", meta: result });
      return NextResponse.json({ ok: true, ...result });
    } catch {
      return NextResponse.json({ ok: false, error: "crm_sync_failed" }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
}
