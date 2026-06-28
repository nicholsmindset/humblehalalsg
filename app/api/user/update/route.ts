import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

/* Update the signed-in user's profile (display name). Home area is a client-side
   preference, handled in the UI. Graceful: simulated when Supabase isn't
   configured so the settings form still works in dev. */
export async function POST(req: Request) {
  if (!supabaseConfigured) return NextResponse.json({ ok: true, simulated: true });

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false, reason: "db_not_configured" });

  let body: { name?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }

  const name = String(body.name || "").trim().slice(0, 120);
  if (name) {
    const { error } = await admin.from("profiles").update({ name }).eq("id", userId);
    if (error) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, name });
}
