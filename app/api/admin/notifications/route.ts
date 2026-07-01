import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Admin → user notification broadcast.

   Inserts one row into public.notifications (see 0033) per target profile —
   all users, or owners only — so the NotificationBell + Realtime deliver them
   live. Admin-gated; writes with the service role (the table has no user
   insert policy — only the service role writes). Batched into a single insert
   and capped so a broadcast can't fan out unbounded. */

const MAX_TARGETS = 5000;

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  let body: { title?: string; message?: string; audience?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const title = String(body.title || "").trim();
  const message = String(body.message || "").trim();
  const audience = body.audience === "owner" ? "owner" : "all";
  if (!title) return NextResponse.json({ ok: false, error: "missing_title" }, { status: 422 });
  if (title.length > 200) return NextResponse.json({ ok: false, error: "title_too_long" }, { status: 422 });
  if (message.length > 2000) return NextResponse.json({ ok: false, error: "message_too_long" }, { status: 422 });

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });

  // Resolve target profile ids (profiles.id is the Clerk sub → notifications.user_id).
  let query = db.from("profiles").select("id").limit(MAX_TARGETS);
  if (audience === "owner") query = query.eq("role", "owner");

  let ids: string[] = [];
  try {
    const { data, error } = await query;
    if (error) return NextResponse.json({ ok: false, error: "query_failed" }, { status: 502 });
    ids = (data || []).map((r) => String((r as { id: string }).id)).filter(Boolean);
  } catch {
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 502 });
  }

  if (ids.length === 0) return NextResponse.json({ ok: true, count: 0 });

  const rows = ids.map((user_id) => ({
    user_id,
    type: "admin_broadcast",
    title,
    body: message || null,
  }));

  try {
    const { error } = await db.from("notifications").insert(rows);
    if (error) return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 502 });
  } catch {
    return NextResponse.json({ ok: false, error: "insert_failed" }, { status: 502 });
  }

  // Best-effort audit trail.
  try {
    await db.from("audit_log").insert({
      actor: gate.userId,
      action: "Broadcast notification",
      target: audience,
      meta: { title, audience, count: rows.length },
    });
  } catch {
    /* audit is best-effort */
  }

  return NextResponse.json({ ok: true, count: rows.length });
}
