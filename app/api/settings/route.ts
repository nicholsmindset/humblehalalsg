import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Admin-only monetization-flag writes (persisted to platform_settings).
   Until Supabase is wired, flags live client-side (localStorage) for demos;
   this route is the production source of truth. */
const ALLOWED = ["paid_tickets_enabled", "paid_ads_enabled", "paid_plans_enabled", "ramadan_mode_enabled"];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "db_not_configured" });

  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, boolean> = {};
  for (const k of ALLOWED) if (k in body) patch[k] = !!body[k];
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: false, reason: "no_changes" }, { status: 400 });

  const { error } = await admin.from("platform_settings").update(patch).eq("id", 1);
  if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ paid_tickets_enabled: false, paid_ads_enabled: false, paid_plans_enabled: false });
  const { data } = await admin.from("platform_settings").select("*").eq("id", 1).maybeSingle();
  return NextResponse.json(
    data ?? { paid_tickets_enabled: false, paid_ads_enabled: false, paid_plans_enabled: false },
  );
}
