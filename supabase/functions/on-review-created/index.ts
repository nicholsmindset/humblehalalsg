// Database Webhook target: reviews / event_reviews INSERT → AI-moderate immediately
// (clear spam/abuse → 'flagged'; genuine criticism stays 'pending' for human
// approval — we NEVER auto-publish). Mirrors the daily review-triage cron, which
// stays as a backstop. Idempotent via a triaged_at claim. Service-role; DB-triggered.
import { admin } from "../_shared/supabase.ts";
import { authorized, type WebhookPayload } from "../_shared/verify.ts";
import { aiJson } from "../_shared/ai.ts";

type ReviewRow = { id: string; text: string | null; status: string; triaged_at: string | null };

// Same policy as app/api/cron/review-triage/route.ts, with an explicit JSON shape.
const SYSTEM =
  "You moderate reviews for a Singapore halal business directory. Classify each " +
  "review as: 'spam' (ads, links, gibberish, irrelevant), 'abusive' (hate, " +
  "harassment, profanity, threats), or 'ok' (a genuine opinion, even if negative). " +
  "Be conservative — only flag clear spam/abuse; legitimate criticism is 'ok'. " +
  'Respond as JSON: {"verdict":"ok|spam|abusive","reason":"short reason"}.';

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });

  let payload: WebhookPayload<ReviewRow>;
  try { payload = await req.json(); } catch { return new Response("bad_json", { status: 400 }); }

  const table = payload.table === "event_reviews" ? "event_reviews" : "reviews";
  const row = payload.record;
  if (!row || row.status !== "pending" || row.triaged_at) return new Response("ignored", { status: 200 });

  const db = admin();
  // Idempotency: claim triaged_at; only the first caller runs AI.
  const { data: claimed } = await db
    .from(table)
    .update({ triaged_at: new Date().toISOString() })
    .eq("id", row.id)
    .is("triaged_at", null)
    .select("id");
  if (!claimed || claimed.length === 0) return new Response("already_triaged", { status: 200 });

  const text = (row.text ?? "").slice(0, 1500).trim();
  if (!text) return new Response("empty", { status: 200 });

  const verdict = await aiJson(SYSTEM, `Review:\n"""${text}"""`);
  const label = verdict && typeof verdict.verdict === "string" ? verdict.verdict : "ok";
  if (label === "spam" || label === "abusive") {
    await db.from(table).update({ status: "flagged" }).eq("id", row.id);
    return new Response(JSON.stringify({ ok: true, flagged: true, verdict: label }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ ok: true, flagged: false }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
});
