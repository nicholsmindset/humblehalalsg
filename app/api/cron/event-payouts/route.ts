import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { emailForBusinessOwner } from "@/lib/emails/recipient";
import { payoutSentEmail } from "@/lib/emails/templates";

/* Pay event organisers 24h after their event. At purchase we took a SEPARATE
   charge on the platform (funds held by Humble Halal); here we transfer the
   organiser's net (face value) to their Connect account and keep the booking
   fee. CRON_SECRET-guarded. Idempotent: payout_status gates re-processing and a
   per-order idempotencyKey means a retried transfer never double-pays. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const db = getSupabaseAdmin();
  const stripe = getStripe();
  if (!db || !stripe) return NextResponse.json({ ok: true, simulated: true });

  const today = new Date().toISOString().slice(0, 10);
  const { data: rows } = await db
    .from("orders")
    .select("id, net_cents, currency, connected_account_id, business_id, event_id, stripe_payment_intent")
    .eq("payout_status", "pending")
    .eq("status", "confirmed")
    .is("stripe_transfer_id", null) // belt-and-suspenders: never re-transfer a paid order
    .lte("payout_due", today)
    .limit(100);

  let paid = 0, skipped = 0, failed = 0;
  const failNotes: string[] = [];
  for (const o of rows || []) {
    if (!o.connected_account_id || !o.net_cents || o.net_cents <= 0) {
      await db.from("orders").update({ payout_status: "skipped" }).eq("id", o.id);
      skipped++;
      continue;
    }
    try {
      // Tie the transfer to the buyer's original charge (source_transaction):
      // it then succeeds regardless of the available platform balance — which
      // is shared with other products and swept to the bank on a schedule, so
      // a plain balance transfer 24h after the event can and will randomly
      // fail (docs.stripe.com/connect/separate-charges-and-transfers).
      let sourceCharge: string | undefined;
      if (o.stripe_payment_intent) {
        try {
          const intent = await stripe.paymentIntents.retrieve(o.stripe_payment_intent as string);
          sourceCharge = typeof intent.latest_charge === "string" ? intent.latest_charge : intent.latest_charge?.id;
        } catch { /* fall back to a balance transfer */ }
      }
      const transfer = await stripe.transfers.create(
        {
          amount: o.net_cents,
          currency: o.currency || "sgd",
          destination: o.connected_account_id,
          ...(sourceCharge ? { source_transaction: sourceCharge } : {}),
          // Group by event so a big event's money movement reconciles in one
          // dashboard filter.
          ...(o.event_id ? { transfer_group: `event_${o.event_id}` } : {}),
          metadata: { order_id: String(o.id), kind: "event_payout" },
        },
        { idempotencyKey: `event_payout_${o.id}` },
      );
      await db.from("orders").update({ payout_status: "paid", stripe_transfer_id: transfer.id }).eq("id", o.id);
      paid++;
      // Notify the organiser their payout is on the way — never fail the payout on email.
      try {
        const { email, name } = await emailForBusinessOwner(db, o.business_id as string | null);
        if (email) {
          let eventTitle: string | null = null;
          if (o.event_id) {
            const { data: ev } = await db.from("events").select("title, display").eq("id", o.event_id).maybeSingle();
            eventTitle = (ev?.display as { title?: string } | null)?.title || (ev?.title as string) || null;
          }
          const amount = `${(o.currency || "sgd").toUpperCase()} ${(o.net_cents / 100).toFixed(2)}`;
          const t = payoutSentEmail({ name, amount, eventTitle });
          await sendEmail({ to: email, subject: t.subject, html: t.html, template: "payout-sent", businessId: (o.business_id as string) || undefined });
        }
      } catch { /* email best-effort */ }
    } catch (e) {
      // Leave payout_status='pending' so the next run retries; the idempotencyKey
      // guarantees a transfer that actually succeeded is never repeated. Record
      // WHY it failed — a silent retry loop hid transfer errors forever.
      failed++;
      if (failNotes.length < 5) failNotes.push(`#${o.id}: ${(e instanceof Error ? e.message : String(e)).slice(0, 120)}`);
    }
  }

  try {
    const notes = `paid ${paid}, skipped ${skipped}, failed ${failed}${failNotes.length ? ` — ${failNotes.join(" | ")}` : ""}`;
    await db.from("cron_runs").insert({ job: "event-payouts", ok: failed === 0, notes });
  } catch { /* best-effort */ }
  return NextResponse.json({ ok: true, paid, skipped, failed, ...(failNotes.length ? { failures: failNotes } : {}) });
}
