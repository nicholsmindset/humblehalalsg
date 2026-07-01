import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Admin user-role management.

   Sets a profile's role (user | owner | admin). Admin-gated via requireAdmin;
   writes with the service role so it isn't blocked by profiles RLS. An admin
   may NOT demote their own account — that guard prevents locking every admin
   out of the console by accident. */

const ROLES = ["user", "owner", "admin"] as const;
type Role = (typeof ROLES)[number];

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  let body: { id?: string; role?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const id = String(body.id || "").trim();
  const role = String(body.role || "").trim() as Role;
  if (!id) return NextResponse.json({ ok: false, error: "missing_id" }, { status: 422 });
  if (!ROLES.includes(role)) return NextResponse.json({ ok: false, error: "invalid_role" }, { status: 422 });

  // Never let the acting admin demote themselves out of admin.
  if (id === gate.userId && role !== "admin") {
    return NextResponse.json({ ok: false, error: "cannot_demote_self" }, { status: 409 });
  }

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_unavailable" }, { status: 503 });

  try {
    const { error } = await db.from("profiles").update({ role }).eq("id", id);
    if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });
  } catch {
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });
  }

  // Best-effort audit trail (actor, action, target, meta — see 0004).
  try {
    await db.from("audit_log").insert({
      actor: gate.userId,
      action: `Set role → ${role}`,
      target: id,
      meta: { role },
    });
  } catch {
    /* audit is best-effort */
  }

  return NextResponse.json({ ok: true, id, role });
}
