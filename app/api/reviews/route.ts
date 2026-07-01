import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { emailForBusinessOwner } from "@/lib/emails/recipient";
import { reviewReceivedEmail } from "@/lib/emails/templates";
import { sendEmail } from "@/lib/email";

/* Review submission. Graceful-degradation: validates + accepts now (returns
   simulated), and is the single integration point to persist to Supabase
   `reviews` (status: pending → moderation) once the backend is wired. */

const TEXT_MAX = 1500;

/* Published reviews for a listing, read server-side so the browser never sees a
   Supabase 404 when the `v_reviews_public` view isn't deployed yet. Any error
   (incl. missing relation) degrades silently to an empty list → the detail page
   keeps its seeded examples. */
export async function GET(req: Request) {
  const slug = (new URL(req.url).searchParams.get("slug") || "").trim().slice(0, 120);
  if (!slug) return NextResponse.json({ ok: true, reviews: [] });
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: true, reviews: [] });
    const { data, error } = await sb
      .from("v_reviews_public")
      .select("id,rating,text,helpful,created_at")
      .eq("listing_slug", slug)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error || !data) return NextResponse.json({ ok: true, reviews: [] });
    return NextResponse.json({ ok: true, reviews: data });
  } catch {
    return NextResponse.json({ ok: true, reviews: [] });
  }
}

export async function POST(req: Request) {
  // Throttle to stop bots flooding the moderation queue (security audit M6).
  const rl = await rateLimit(req, "reviews", 8, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields. Pretend success, drop silently.
  if (body?.website) return NextResponse.json({ ok: true, simulated: true });

  // Accept either a slug (preferred — what the directory renders) or a raw uuid.
  const businessSlug = String(body?.businessSlug || "").trim();
  const businessId = String(body?.businessId || "").trim();
  const rating = Number(body?.rating);
  const text = String(body?.text || "").trim().slice(0, TEXT_MAX);

  if ((!businessSlug && !businessId) || !(rating >= 1 && rating <= 5) || text.length < 4) {
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
      // Resolve slug → business_id (the directory renders by slug, not uuid).
      let id = businessId;
      if (!id && businessSlug) {
        const { data } = await sb.from("businesses").select("id").eq("slug", businessSlug).maybeSingle();
        id = (data as { id?: string } | null)?.id || "";
      }
      // No matching business row yet (e.g. unseeded) → accept as simulated.
      if (!id) return NextResponse.json({ ok: true, simulated: true });
      const { error } = await sb
        .from("reviews")
        .insert({ business_id: id, rating, text, status: "pending" });
      if (!error) {
        // Notify the business owner of the new (pending) review (best-effort).
        try {
          const { email, name, businessName } = await emailForBusinessOwner(sb, id);
          if (email) {
            const t = reviewReceivedEmail({ name, businessName: businessName || "your listing", rating, text });
            await sendEmail({ to: email, subject: t.subject, html: t.html, template: "review-received", businessId: id });
          }
        } catch { /* email best-effort — never affect the API response */ }
        return NextResponse.json({ ok: true, simulated: false, pending: true });
      }
    }
  } catch {
    /* fall through to simulated */
  }

  return NextResponse.json({ ok: true, simulated: true });
}
