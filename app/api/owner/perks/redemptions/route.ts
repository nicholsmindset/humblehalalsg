import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags } from "@/lib/flags";

/* Owner-side perk vouchers. GET → redemptions for the caller's businesses
   (newest first). POST { id | code } → mark a voucher used (verified at the
   counter). Ownership enforced via the voucher's business. */
export const dynamic = "force-dynamic";

type Db = NonNullable<ReturnType<typeof getSupabaseAdmin>>;

async function ownedBusinessIds(db: Db, userId: string): Promise<string[]> {
  const { data } = await db.from("businesses").select("id").or(`owner_id.eq.${userId},claimed_by.eq.${userId}`);
  return (data || []).map((b) => b.id);
}

export async function GET() {
  if (!getServerFlags().passport) return NextResponse.json({ ok: true, enabled: false });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const ids = await ownedBusinessIds(db, userId);
  if (ids.length === 0) return NextResponse.json({ ok: true, enabled: true, redemptions: [] });
  const { data } = await db
    .from("perk_redemptions")
    .select("id, voucher_code, title, cost, status, created_at, used_at")
    .in("business_id", ids)
    .order("created_at", { ascending: false })
    .limit(100);
  return NextResponse.json({ ok: true, enabled: true, redemptions: data || [] });
}

export async function POST(req: Request) {
  if (!getServerFlags().passport) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let b: { id?: string; code?: string } = {};
  try { b = (await req.json()) as typeof b; } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }

  const ids = await ownedBusinessIds(db, userId);
  if (ids.length === 0) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  let q = db.from("perk_redemptions").select("id, business_id, status").in("business_id", ids);
  q = b.id ? q.eq("id", String(b.id)) : q.eq("voucher_code", String(b.code || "").trim().toUpperCase());
  const { data: voucher } = await q.maybeSingle();
  if (!voucher) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (voucher.status === "used") return NextResponse.json({ ok: false, error: "already_used" }, { status: 409 });

  const { error } = await db.from("perk_redemptions").update({ status: "used", used_at: new Date().toISOString() }).eq("id", voucher.id).eq("status", "active");
  if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
