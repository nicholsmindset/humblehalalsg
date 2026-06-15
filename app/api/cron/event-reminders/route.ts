import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

/* Day-before reminders. Runs daily; emails everyone with a confirmed order for an
   event happening TOMORROW (Asia/Singapore). CRON_SECRET-guarded; degrades to
   simulated when the backend isn't configured. Best-effort + de-duplicated by
   recipient per event. */
export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: true, simulated: true });

  // Tomorrow's date in Singapore (YYYY-MM-DD).
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" });
  const tomorrow = fmt.format(new Date(Date.now() + 24 * 3600 * 1000));

  const { data: evs } = await db
    .from("events")
    .select("id, slug, title, display")
    .eq("status", "published")
    .eq("date_iso", tomorrow);
  if (!evs || !evs.length) return NextResponse.json({ ok: true, events: 0, sent: 0 });

  let sent = 0;
  for (const ev of evs) {
    const d = (ev.display && typeof ev.display === "object" ? ev.display : {}) as Record<string, unknown>;
    const when = [d.dateLabel, d.timeLabel].filter(Boolean).join(" · ");
    const where = String(d.venue || "");
    const { data: orders } = await db
      .from("orders").select("buyer_email").eq("event_id", ev.id).eq("status", "confirmed").not("buyer_email", "is", null);
    const emails = [...new Set((orders || []).map((o) => o.buyer_email as string).filter(Boolean))];
    for (const to of emails.slice(0, 2000)) {
      const r = await sendEmail({
        to,
        subject: `Tomorrow: ${ev.title}`,
        template: "event-reminder",
        html: `<h2>See you tomorrow, in shaa Allah 🌙</h2><p><strong>${ev.title}</strong>${when ? `<br>${when}` : ""}${where ? `<br>${where}` : ""}</p><p>Your ticket/QR is under “My tickets”. Doors open 30 minutes before.</p>`,
      }).catch(() => ({ ok: false }));
      if (r.ok) sent++;
    }
  }
  return NextResponse.json({ ok: true, events: evs.length, sent });
}
