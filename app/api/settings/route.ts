import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { bustFlagCache } from "@/lib/feature-flags";
import { FLAG_COLUMN } from "@/lib/flags";

/* Admin-only monetization-flag writes (persisted to platform_settings).
   Until Supabase is wired, flags live client-side (localStorage) for demos;
   this route is the production source of truth. */
const ALLOWED = ["ramadan_mode_enabled", ...Object.values(FLAG_COLUMN)];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "db_not_configured" });

  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, boolean | null> = {};
  for (const k of ALLOWED) {
    if (k in body) {
      if (k === "ramadan_mode_enabled") {
        patch[k] = !!body[k];
      } else {
        patch[k] = body[k] === null ? null : !!body[k];
      }
    }
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: false, reason: "no_changes" }, { status: 400 });

  // Verify the write actually lands. A bare `.update().eq("id",1)` returns NO
  // error when it matches 0 rows (missing singleton row, or an RLS/service-role
  // misconfig silently blocking the write) — which used to report ok:true while
  // persisting nothing, so admin toggles looked "on" but no gated surface ever
  // rendered. `.select()` tells us the affected count; 0 rows → self-heal by
  // inserting the singleton, and surface any real failure as an honest error.
  const { data: updated, error } = await admin
    .from("platform_settings").update(patch).eq("id", 1).select("id");
  if (error) return NextResponse.json({ ok: false, reason: "db_error", detail: error.message }, { status: 500 });
  if (!updated || updated.length === 0) {
    const { error: insErr } = await admin.from("platform_settings").insert({ id: 1, ...patch });
    if (insErr) return NextResponse.json({ ok: false, reason: "not_persisted", detail: insErr.message }, { status: 500 });
  }
  bustFlagCache();
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
