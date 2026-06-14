import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

/* Update the signed-in user's profile (display name). Home area is a client-side
   preference, handled in the UI. Graceful: simulated when Supabase isn't
   configured so the settings form still works in dev. */
export async function POST(req: Request) {
  if (!supabaseConfigured) return NextResponse.json({ ok: true, simulated: true });

  const supa = await getSupabaseServer();
  const admin = getSupabaseAdmin();
  if (!supa || !admin) return NextResponse.json({ ok: false, reason: "db_not_configured" });

  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  let body: { name?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }

  const name = String(body.name || "").trim().slice(0, 120);
  if (name) {
    const { error } = await admin.from("profiles").update({ name }).eq("id", user.id);
    if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, name });
}
