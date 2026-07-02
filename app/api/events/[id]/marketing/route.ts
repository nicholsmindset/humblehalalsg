import { NextResponse } from "next/server";
import { authoriseEventManager } from "@/lib/event-auth";

/* Organiser marketing analytics for one event (owner/admin only): sales by
   channel (tracking-link ref / UTM source), the view → checkout → purchase
   funnel, and repeat-attendee share. Channel + funnel depth need the 0042
   attribution capture; views/orders/repeat rate work on day-one data. */

type ChannelRow = { channel: string; kind: "ref" | "utm" | "direct"; orders: number; tickets: number; grossCents: number };

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authoriseEventManager(id);
  if (!a.ok) return a.res;
  const { admin, ev } = a;

  const { data: orders } = await admin
    .from("orders")
    .select("qty, amount_cents, status, ref_code, utm, session_id, buyer_email, created_at")
    .eq("event_id", ev.id)
    .limit(10000);
  const confirmed = (orders ?? []).filter((o) => o.status === "confirmed");

  // ── Sales by channel ────────────────────────────────────────────────────────
  const channels = new Map<string, ChannelRow>();
  for (const o of confirmed) {
    const utm = (o.utm && typeof o.utm === "object" ? o.utm : {}) as Record<string, unknown>;
    const key = o.ref_code
      ? `ref:${o.ref_code}`
      : typeof utm.source === "string" && utm.source
        ? `utm:${utm.source}`
        : "direct";
    const row =
      channels.get(key) ??
      ({
        channel: o.ref_code || (typeof utm.source === "string" && utm.source) || "Direct / unattributed",
        kind: o.ref_code ? "ref" : typeof utm.source === "string" && utm.source ? "utm" : "direct",
        orders: 0,
        tickets: 0,
        grossCents: 0,
      } as ChannelRow);
    row.orders += 1;
    row.tickets += Number(o.qty) || 0;
    row.grossCents += Number(o.amount_cents) || 0;
    channels.set(key, row);
  }

  // ── Funnel: event-page views → checkout starts → confirmed orders ───────────
  const path = `/events/${ev.slug}`;
  const [viewsQ, startsQ] = await Promise.all([
    admin.from("analytics_events").select("id", { count: "exact", head: true }).eq("event_type", "page_view").eq("path", path),
    admin
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "checkout_start")
      .in("listing_slug", [ev.slug, ev.id]),
  ]);
  const views = viewsQ.count ?? 0;
  const checkoutStarts = startsQ.count ?? 0;
  const orderCount = confirmed.length;

  // ── Repeat attendees: buyers seen on the organiser's OTHER events ───────────
  let repeat = { returning: 0, total: 0, pct: 0 };
  const emails = [...new Set(confirmed.map((o) => (o.buyer_email || "").toLowerCase()).filter(Boolean))].slice(0, 500);
  if (emails.length && ev.business_id) {
    const { data: prior } = await admin
      .from("orders")
      .select("buyer_email")
      .eq("business_id", ev.business_id)
      .eq("status", "confirmed")
      .neq("event_id", ev.id)
      .in("buyer_email", emails)
      .limit(10000);
    const returningSet = new Set((prior ?? []).map((o) => (o.buyer_email || "").toLowerCase()));
    repeat = {
      returning: returningSet.size,
      total: emails.length,
      pct: emails.length ? Math.round((returningSet.size / emails.length) * 100) : 0,
    };
  }

  return NextResponse.json({
    ok: true,
    event: { id: ev.id, title: ev.title, slug: ev.slug },
    channels: [...channels.values()].sort((x, y) => y.grossCents - x.grossCents || y.tickets - x.tickets),
    funnel: {
      views,
      checkoutStarts,
      orders: orderCount,
      viewToCheckoutPct: views ? Math.round((checkoutStarts / views) * 100) : null,
      viewToOrderPct: views ? Math.round((orderCount / views) * 100) : null,
    },
    repeatAttendees: repeat,
  });
}
