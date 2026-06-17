import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { analyticsWeekly, liteapiConfigured } from "@/lib/liteapi";

/* LiteAPI's OWN weekly sales/booking analytics (da.liteapi.travel) — the payout
   source of truth, complementing the ledger view in /api/admin/travel-revenue.
   Admin-gated; graceful without a key. Defaults to the last 12 weeks. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  if (!liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true, weeks: [] });

  const url = new URL(req.url);
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date();
  const toQ = url.searchParams.get("to");
  const fromQ = url.searchParams.get("from");
  const to = toQ && DATE_RE.test(toQ) ? toQ : day(today);
  const from = fromQ && DATE_RE.test(fromQ) ? fromQ : day(new Date(today.getTime() - 84 * 864e5));

  try {
    const weeks = await analyticsWeekly(from, to);
    return NextResponse.json({ ok: true, from, to, weeks });
  } catch {
    return NextResponse.json({ ok: false, error: "analytics_failed" }, { status: 502 });
  }
}
