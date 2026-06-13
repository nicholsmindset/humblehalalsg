import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Travel revenue summary from OUR ledger (hotel_bookings + hotel_commissions).
   This is the reconciliation view inside Humble Halal; LiteAPI's dashboard stays
   the source of truth for actual payouts. Admin-gated. */
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });

  const admin = getSupabaseAdmin()!;
  const { data: rows, error } = await admin
    .from("hotel_bookings")
    .select("hotel_name, city, country, checkin, checkout, currency, retail_total, commission_amount, status, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) return NextResponse.json({ ok: false, error: "query_failed" }, { status: 502 });

  const bookings = rows || [];
  const byCur: Record<string, { gross: number; commission: number }> = {};
  let confirmed = 0, cancelled = 0, refunded = 0;
  for (const b of bookings) {
    if (b.status === "confirmed") confirmed++;
    else if (b.status === "cancelled") cancelled++;
    else if (b.status === "refunded") refunded++;
    if (b.status !== "confirmed") continue;
    const cur = String(b.currency || "USD");
    byCur[cur] = byCur[cur] || { gross: 0, commission: 0 };
    byCur[cur].gross += Number(b.retail_total) || 0;
    byCur[cur].commission += Number(b.commission_amount) || 0;
  }

  return NextResponse.json({
    ok: true,
    totals: { count: bookings.length, confirmed, cancelled, refunded },
    byCurrency: Object.entries(byCur).map(([currency, v]) => ({ currency, gross: Math.round(v.gross), commission: Math.round(v.commission) })),
    recent: bookings.slice(0, 25).map((b) => ({ hotel: b.hotel_name, city: b.city, checkin: b.checkin, checkout: b.checkout, currency: b.currency, total: b.retail_total != null ? Math.round(Number(b.retail_total)) : null, commission: b.commission_amount != null ? Math.round(Number(b.commission_amount)) : null, status: b.status })),
  });
}
