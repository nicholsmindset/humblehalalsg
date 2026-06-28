import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/slug";

/* Unified admin moderation queue.
   GET  ?type=listings|reviews|reports|suggestions|claims&limit=  → pending rows
   POST { type, id, action }                                      → approve/reject/etc

   Every call is admin-gated (requireAdmin). Reads/writes use the service-role
   client AFTER the gate, so RLS can't accidentally hide queue rows from an admin.
   Without Supabase configured the gate returns 503 and the UI keeps its mock. */

type QueueType = "listings" | "reviews" | "reports" | "suggestions" | "claims" | "events";

const PENDING: Record<QueueType, { table: string; col: string; values: string[] }> = {
  listings:    { table: "staging_businesses", col: "review_status", values: ["new", "reviewing"] },
  reviews:     { table: "reviews",            col: "status",        values: ["pending"] },
  reports:     { table: "reports",            col: "status",        values: ["open", "reviewing"] },
  suggestions: { table: "suggestions",        col: "status",        values: ["pending", "reviewing"] },
  claims:      { table: "claims",             col: "status",        values: ["pending"] },
  events:      { table: "events",             col: "status",        values: ["pending"] },
};

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const url = new URL(req.url);
  const type = url.searchParams.get("type") as QueueType | null;
  if (!type || !(type in PENDING)) return NextResponse.json({ ok: false, error: "bad_type" }, { status: 422 });
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));

  const admin = getSupabaseAdmin()!;
  const q = PENDING[type];
  const { data, error } = await admin
    .from(q.table)
    .select("*")
    .in(q.col, q.values)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return NextResponse.json({ ok: false, error: "query_failed" }, { status: 502 });
  return NextResponse.json({ ok: true, type, items: data ?? [] });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const body = (await req.json().catch(() => ({}))) as { type?: QueueType; id?: string; action?: string };
  const { type, id, action } = body;
  if (!type || !(type in PENDING) || !id || !action) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 422 });
  }

  const admin = getSupabaseAdmin()!;

  try {
    switch (type) {
      case "listings":
        return await actListing(admin, id, action, gate.userId);
      case "reviews": {
        const status = action === "approve" ? "published" : action === "reject" ? "removed" : null;
        if (!status) return badAction();
        await admin.from("reviews").update({ status }).eq("id", id);
        await logAudit(admin, { actor: gate.userId, action: status === "published" ? "Approved review" : "Removed review", target: id });
        return NextResponse.json({ ok: true, status });
      }
      case "reports": {
        const status = action === "resolve" ? "resolved" : action === "dismiss" ? "dismissed" : null;
        if (!status) return badAction();
        await admin.from("reports").update({ status }).eq("id", id);
        await logAudit(admin, { actor: gate.userId, action: `Report ${status}`, target: id });
        return NextResponse.json({ ok: true, status });
      }
      case "suggestions": {
        const status = action === "approve" ? "published" : action === "reject" ? "rejected" : null;
        if (!status) return badAction();
        await admin.from("suggestions").update({ status }).eq("id", id);
        await logAudit(admin, { actor: gate.userId, action: `Suggestion ${status}`, target: id });
        return NextResponse.json({ ok: true, status });
      }
      case "events": {
        const status = action === "approve" ? "published" : action === "reject" ? "rejected" : null;
        if (!status) return badAction();
        await admin.from("events").update({ status }).eq("id", id);
        await logAudit(admin, { actor: gate.userId, action: status === "published" ? "Approved event" : "Rejected event", target: id });
        return NextResponse.json({ ok: true, status });
      }
      case "claims":
        return await actClaim(admin, id, action, gate.userId);
      default:
        return badAction();
    }
  } catch {
    return NextResponse.json({ ok: false, error: "action_failed" }, { status: 502 });
  }
}

function badAction() {
  return NextResponse.json({ ok: false, error: "bad_action" }, { status: 422 });
}

/* Approving a staged listing publishes a real business row, then marks the
   staging record done. Rejecting just flags the staging record. */
async function actListing(admin: ReturnType<typeof getSupabaseAdmin>, id: string, action: string, actor: string) {
  const db = admin!;
  if (action === "reject") {
    await db.from("staging_businesses").update({ review_status: "rejected" }).eq("id", id);
    await logAudit(db, { actor, action: "Rejected listing", target: id });
    return NextResponse.json({ ok: true, status: "rejected" });
  }
  if (action !== "approve") return badAction();

  const { data: s, error } = await db.from("staging_businesses").select("*").eq("id", id).maybeSingle();
  if (error || !s) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const raw = (s.raw && typeof s.raw === "object" ? s.raw : {}) as Record<string, unknown>;
  const slug = String(s.slug || slugify(String(s.name)));
  const insert = {
    name: String(s.name),
    slug,
    area: String(raw.area || "") || null,
    cat_id: String(s.category_suggested || raw.cat || raw.category || "") || null,
    status: "published",
    halal_tier: "declared", // community-declared until an admin verifies on HalalSG
    source: String(s.source || "owner"),
    nea_licence_no: s.nea_licence_no ?? null,
  };
  const { data: created, error: insErr } = await db.from("businesses").insert(insert).select("id").single();
  if (insErr) {
    const dup = insErr.code === "23505";
    return NextResponse.json({ ok: false, error: dup ? "slug_exists" : "publish_failed" }, { status: dup ? 409 : 502 });
  }
  await db.from("staging_businesses").update({ review_status: "published", duplicate_of: created.id }).eq("id", id);
  await logAudit(db, { actor, action: "Published listing", target: created.id, meta: { name: insert.name, staging_id: id } });
  return NextResponse.json({ ok: true, status: "published", businessId: created.id });
}

/* Approving a claim links the claimant to the business as owner. */
async function actClaim(admin: ReturnType<typeof getSupabaseAdmin>, id: string, action: string, actor: string) {
  const db = admin!;
  if (action === "reject") {
    await db.from("claims").update({ status: "rejected" }).eq("id", id);
    await logAudit(db, { actor, action: "Rejected claim", target: id });
    return NextResponse.json({ ok: true, status: "rejected" });
  }
  if (action !== "approve") return badAction();

  const { data: c } = await db.from("claims").select("business_id, user_id").eq("id", id).maybeSingle();
  await db.from("claims").update({ status: "approved" }).eq("id", id);
  if (c?.business_id && c.user_id) {
    await db.from("businesses").update({ owner_id: c.user_id, claimed_by: c.user_id }).eq("id", c.business_id);
    // Claimant now owns a business → grant the owner role (no-op for admins).
    await db.from("profiles").update({ role: "owner" }).eq("id", c.user_id).neq("role", "admin");
  }
  await logAudit(db, { actor, action: "Approved claim", target: id, meta: { business_id: c?.business_id } });
  return NextResponse.json({ ok: true, status: "approved" });
}
