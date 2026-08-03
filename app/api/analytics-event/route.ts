import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const EVENT_TYPES = new Set([
  "ai_query", "ai_result_click", "checkout_start", "coupon_claim", "coupon_view",
  "event_view", "filter_use", "follow", "impression", "lead_action", "listing_view",
  "map_open", "newsletter_signup", "offer_view", "page_view", "review_submit",
  "search", "search_result_click", "tool_use",
]);

const LEAD_ACTIONS = new Set([
  "enquiry_form", "whatsapp", "call", "website", "directions", "shortlist",
  "share", "claim", "booking", "menu", "cert_view",
]);

type Payload = Record<string, unknown>;

function optionalText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text.slice(0, max) : null;
}

export async function POST(req: Request) {
  const rl = await rateLimit(req, "analytics-event", 240, 3600);
  if (!rl.ok) return tooMany(rl.retryAfter);

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const eventType = optionalText(body.p_event_type, 48);
  if (!eventType || !EVENT_TYPES.has(eventType)) {
    return NextResponse.json({ ok: false, error: "invalid_event" }, { status: 422 });
  }

  const leadAction = optionalText(body.p_lead_action_type, 32);
  if (leadAction && !LEAD_ACTIONS.has(leadAction)) {
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 422 });
  }

  const rawCount = body.p_results_count;
  const resultsCount = typeof rawCount === "number" && Number.isFinite(rawCount)
    ? Math.max(0, Math.min(10000, Math.trunc(rawCount)))
    : null;

  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true, simulated: true });

  const { error } = await db.rpc("track_event", {
    p_event_type: eventType,
    p_session_id: optionalText(body.p_session_id, 64),
    p_lead_action_type: leadAction,
    p_listing_slug: optionalText(body.p_listing_slug, 160),
    p_category: optionalText(body.p_category, 100),
    p_query: optionalText(body.p_query, 300),
    p_path: optionalText(body.p_path, 500),
    p_referrer: optionalText(body.p_referrer, 500),
    p_area: optionalText(body.p_area, 100),
    p_device: optionalText(body.p_device, 32),
    p_results_count: resultsCount,
    p_placement: optionalText(body.p_placement, 100),
  });

  if (error) return NextResponse.json({ ok: false, error: "write_failed" }, { status: 503 });
  return NextResponse.json({ ok: true, simulated: false });
}
