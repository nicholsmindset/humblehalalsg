import { NextResponse } from "next/server";

/* Review submission. Graceful-degradation: validates + accepts now (returns
   simulated), and is the single integration point to persist to Supabase
   `reviews` (status: pending → moderation) once the backend is wired. */

const TEXT_MAX = 1500;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields. Pretend success, drop silently.
  if (body?.website) return NextResponse.json({ ok: true, simulated: true });

  const businessId = String(body?.businessId || "").trim();
  const rating = Number(body?.rating);
  const text = String(body?.text || "").trim().slice(0, TEXT_MAX);

  if (!businessId || !(rating >= 1 && rating <= 5) || text.length < 4) {
    return NextResponse.json(
      { ok: false, error: "Add a rating (1–5) and a short review." },
      { status: 422 },
    );
  }

  // Persist when Supabase is configured; otherwise accept in "simulated" mode.
  // Service role inserts the (pending) review for moderation, bypassing RLS.
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (sb) {
      const { error } = await sb
        .from("reviews")
        .insert({ business_id: businessId, rating, text, status: "pending" });
      if (!error) return NextResponse.json({ ok: true, simulated: false, pending: true });
    }
  } catch {
    /* fall through to simulated */
  }

  return NextResponse.json({ ok: true, simulated: true });
}
