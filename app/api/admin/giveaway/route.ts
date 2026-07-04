import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

/* Admin giveaway control. GET → giveaways + entrant counts. POST:
   - create { title, description, entryCost, month }  → open a monthly giveaway
   - draw   { id }                                     → weighted-random winner,
     mark drawn, notify + email the winner. */
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });
  const { data } = await db.from("giveaways").select("*").order("period_month", { ascending: false }).limit(24);
  const ids = (data || []).map((g) => g.id);
  const counts: Record<string, { entrants: number; entries: number }> = {};
  if (ids.length) {
    const { data: ent } = await db.from("giveaway_entries").select("giveaway_id, entries").in("giveaway_id", ids);
    for (const e of ent || []) {
      const c = (counts[e.giveaway_id] ||= { entrants: 0, entries: 0 });
      c.entrants += 1; c.entries += e.entries as number;
    }
  }
  return NextResponse.json({ ok: true, giveaways: (data || []).map((g) => ({ ...g, ...(counts[g.id] || { entrants: 0, entries: 0 }) })) });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let b: { action?: string; id?: string; title?: string; description?: string; entryCost?: number; month?: string } = {};
  try { b = (await req.json()) as typeof b; } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }

  if (b.action === "create") {
    const title = String(b.title || "").trim();
    const month = String(b.month || "").trim();
    if (!title || !/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ ok: false, error: "bad_input" }, { status: 422 });
    const { error } = await db.from("giveaways").insert({ title, description: b.description || null, period_month: month, entry_cost: Math.max(1, Number(b.entryCost) || 50) });
    if (error) return NextResponse.json({ ok: false, error: /duplicate|unique/i.test(error.message) ? "month_exists" : "create_failed" }, { status: 409 });
    await logAudit(db, { actor: gate.userId, action: "Created giveaway", target: month });
    return NextResponse.json({ ok: true });
  }

  if (b.action === "draw") {
    const id = String(b.id || "");
    const { data: g } = await db.from("giveaways").select("id, title, status").eq("id", id).maybeSingle();
    if (!g) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    if (g.status !== "open") return NextResponse.json({ ok: false, error: "already_drawn" }, { status: 409 });

    const { data: entries } = await db.from("giveaway_entries").select("user_id, entries").eq("giveaway_id", id);
    const pool = (entries || []).filter((e) => (e.entries as number) > 0);
    const total = pool.reduce((n, e) => n + (e.entries as number), 0);
    if (total === 0) return NextResponse.json({ ok: false, error: "no_entries" }, { status: 409 });

    // Weighted random draw (crypto, entry-weighted).
    let pick = randomInt(0, total);
    let winner = pool[0].user_id as string;
    for (const e of pool) { pick -= e.entries as number; if (pick < 0) { winner = e.user_id as string; break; } }

    const { error } = await db.from("giveaways").update({ status: "drawn", winner_user_id: winner, drawn_at: new Date().toISOString() }).eq("id", id).eq("status", "open");
    if (error) return NextResponse.json({ ok: false, error: "draw_failed" }, { status: 502 });

    // Notify + email the winner (best-effort).
    try {
      await db.from("notifications").insert({ user_id: winner, type: "giveaway_won", title: `You won: ${g.title} 🎉`, body: "Congratulations! We'll be in touch about your prize.", link: "/passport", dedupe_key: `giveaway_won:${id}` });
      const { emailForUser } = await import("@/lib/emails/recipient");
      const { sendEmail } = await import("@/lib/email");
      const { giveawayWonEmail } = await import("@/lib/emails/templates");
      const { email, name } = await emailForUser(db, winner);
      if (email) { const t = giveawayWonEmail({ name, title: g.title }); await sendEmail({ to: email, subject: t.subject, html: t.html, template: "giveaway-won" }); }
    } catch { /* best-effort */ }

    await logAudit(db, { actor: gate.userId, action: "Drew giveaway winner", target: id, meta: { winner } });
    return NextResponse.json({ ok: true, winner });
  }

  return NextResponse.json({ ok: false, error: "bad_action" }, { status: 400 });
}
