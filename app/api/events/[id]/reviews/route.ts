import { NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseServer } from "@/lib/supabase/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { isSafeEventRef } from "@/lib/event-ref";

/* Event ratings. GET → published reviews + honest aggregate (avg/count) read
   server-side (no anon DB exposure). POST → submit a rating (1–5) for moderation.
   The [id] param accepts an event id OR slug. */
const TEXT_MAX = 1000;

async function resolveEventId(id: string): Promise<string | null> {
  const admin = getSupabaseAdmin();
  if (!admin || !isSafeEventRef(id)) return null;
  const { data } = await admin.from("events").select("id").or(`id.eq.${id},slug.eq.${id}`).maybeSingle();
  return (data?.id as string) || null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: true, avg: null, count: 0, reviews: [] });
  const eventId = await resolveEventId(id);
  if (!eventId) return NextResponse.json({ ok: true, avg: null, count: 0, reviews: [] });

  const [{ data: agg }, { data: list }] = await Promise.all([
    admin.from("v_event_rating").select("avg_rating, review_count").eq("event_id", eventId).maybeSingle(),
    admin.from("v_event_reviews_public").select("id, rating, text, author_name, created_at").eq("event_id", eventId).order("created_at", { ascending: false }).limit(50),
  ]);
  // Honest: avg is null (hidden) unless there is ≥1 published review.
  const count = Number(agg?.review_count) || 0;
  return NextResponse.json({
    ok: true,
    avg: count > 0 ? Number(agg?.avg_rating) : null,
    count,
    reviews: (list || []).map((r) => ({ id: r.id, rating: r.rating, text: r.text, author: r.author_name || "Attendee", createdAt: r.created_at })),
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const rl = await rateLimit(req, "event-reviews", 8, 3600); if (!rl.ok) return tooMany(rl.retryAfter);
  const { id } = await params;
  let b: { rating?: number; text?: string; name?: string; website?: string };
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  if (b.website) return NextResponse.json({ ok: true, simulated: true }); // honeypot

  const rating = Number(b.rating);
  const text = String(b.text || "").trim().slice(0, TEXT_MAX);
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ ok: false, error: "Add a rating (1–5)." }, { status: 422 });

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: true, simulated: true });
  const eventId = await resolveEventId(id);
  if (!eventId) return NextResponse.json({ ok: true, simulated: true });

  // Capture the author id when signed in (optional).
  let authorId: string | null = null;
  const server = await getSupabaseServer();
  if (server) { const { data: { user } } = await server.auth.getUser(); authorId = user?.id ?? null; }

  const { error } = await admin.from("event_reviews").insert({
    event_id: eventId,
    author_id: authorId,
    author_name: String(b.name || "").trim().slice(0, 60) || null,
    rating,
    text,
    status: "pending",
  });
  if (error) return NextResponse.json({ ok: true, simulated: true });
  return NextResponse.json({ ok: true, simulated: false, pending: true });
}
