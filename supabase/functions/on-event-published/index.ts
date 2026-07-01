// Database Webhook target: events UPDATE → on status flip to 'published', notify
// every follower of the organiser (in-app notification row + email). Idempotent
// via an atomic claim on events.notified_at. Service-role; DB-triggered only.
import { admin } from "../_shared/supabase.ts";
import { authorized, type WebhookPayload } from "../_shared/verify.ts";
import { sendEmail } from "../_shared/email.ts";
import { emailLayout, esc, p } from "../_shared/email-layout.ts";

type EventRow = {
  id: string;
  business_id: string | null;
  slug: string | null;
  title: string | null;
  status: string;
  display: { title?: string } | null;
  notified_at: string | null;
};

const SITE = "https://www.humblehalal.com";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });
  if (!authorized(req)) return new Response("unauthorized", { status: 401 });

  let payload: WebhookPayload<EventRow>;
  try { payload = await req.json(); } catch { return new Response("bad_json", { status: 400 }); }

  const ev = payload.record;
  const prev = payload.old_record;
  // Only act on the draft/pending → published transition.
  if (!ev || ev.status !== "published" || (prev && prev.status === "published")) {
    return new Response("ignored", { status: 200 });
  }

  const db = admin();

  // Idempotency: claim notified_at atomically; only the first caller proceeds.
  const { data: claimed } = await db
    .from("events")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", ev.id)
    .is("notified_at", null)
    .select("id");
  if (!claimed || claimed.length === 0) return new Response("already_notified", { status: 200 });
  if (!ev.business_id) return new Response("no_business", { status: 200 });

  const { data: follows } = await db.from("organizer_follows").select("user_id").eq("business_id", ev.business_id);
  const followerIds = (follows ?? []).map((f) => f.user_id as string).filter(Boolean);
  if (followerIds.length === 0) return new Response("no_followers", { status: 200 });

  const title = ev.display?.title || ev.title || "New event";
  const link = ev.slug ? `/events/${ev.slug}` : "/events";

  // In-app notifications (one per follower; unique on (user_id,type,dedupe_key)).
  const rows = followerIds.map((uid) => ({
    user_id: uid,
    type: "event_published",
    title: `New event: ${title}`,
    body: "An organiser you follow just published an event.",
    link,
    dedupe_key: `event_published:${ev.id}`,
  }));
  const { error: insErr } = await db.from("notifications").insert(rows);
  if (insErr) console.error("notifications insert:", insErr.message);

  // Emails (best-effort; never fail the webhook so it isn't retried).
  try {
    const { data: profs } = await db.from("profiles").select("email").in("id", followerIds);
    const emails = (profs ?? []).map((row) => row.email as string).filter(Boolean);
    const html = emailLayout({
      preheader: `New event: ${esc(title)}`,
      heading: "A new event you might like",
      bodyHtml:
        p(`Assalamualaikum,`) +
        p(`An organiser you follow on Humble Halal just published <strong>${esc(title)}</strong>. Seats can fill quickly — take a look and RSVP if it's for you.`),
      cta: { label: "View the event", url: `${SITE}${link}` },
    });
    for (const to of emails) {
      await sendEmail({ to, subject: `New event: ${title}`, html, template: "event_published" });
    }
  } catch (e) {
    console.error("event-published email:", e);
  }

  return new Response(JSON.stringify({ ok: true, notified: followerIds.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
