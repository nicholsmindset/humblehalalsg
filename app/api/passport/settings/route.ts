import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags } from "@/lib/flags";

/* Passport privacy settings (PDPA: default private). GET returns is_public +
   share_token + display_name; POST toggles/updates them (service-role write;
   `regenerate: true` mints a new token to revoke a previously-shared link). */
export const dynamic = "force-dynamic";

async function ensureRow(db: NonNullable<ReturnType<typeof getSupabaseAdmin>>, userId: string) {
  const { data } = await db.from("passport_settings").select("is_public, share_token, display_name").eq("user_id", userId).maybeSingle();
  if (data) return data;
  await db.from("passport_settings").insert({ user_id: userId }).select("user_id").maybeSingle();
  const { data: created } = await db.from("passport_settings").select("is_public, share_token, display_name").eq("user_id", userId).maybeSingle();
  return created;
}

export async function GET() {
  if (!getServerFlags().passport) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });
  const row = await ensureRow(db, userId);
  return NextResponse.json({ ok: true, isPublic: !!row?.is_public, shareToken: row?.share_token || null, displayName: row?.display_name || null });
}

export async function POST(req: Request) {
  if (!getServerFlags().passport) return NextResponse.json({ ok: false, error: "not_enabled" }, { status: 404 });
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let body: { isPublic?: boolean; displayName?: string; regenerate?: boolean } = {};
  try { body = (await req.json()) as typeof body; } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  await ensureRow(db, userId);

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.isPublic === "boolean") patch.is_public = body.isPublic;
  if (typeof body.displayName === "string") patch.display_name = body.displayName.trim().slice(0, 40) || null;
  if (body.regenerate) {
    // New opaque token (18 hex chars) to revoke old shared links.
    patch.share_token = randomBytes(9).toString("hex");
  }

  const { error } = await db.from("passport_settings").update(patch).eq("user_id", userId);
  if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });
  const { data: row } = await db.from("passport_settings").select("is_public, share_token, display_name").eq("user_id", userId).maybeSingle();
  return NextResponse.json({ ok: true, isPublic: !!row?.is_public, shareToken: row?.share_token || null, displayName: row?.display_name || null });
}
