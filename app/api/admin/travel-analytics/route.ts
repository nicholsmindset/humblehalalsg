import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { analyticsWeekly, liteapiConfigured, LiteApiError } from "@/lib/liteapi";

/* LiteAPI's OWN weekly sales/booking analytics (da.liteapi.travel) — the payout
   source of truth, complementing the ledger view in /api/admin/travel-revenue.
   Admin-gated; graceful without a key. Defaults to the last 12 weeks. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  if (!liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true, weeks: [] });

  const url = new URL(req.url);
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date();
  const toQ = url.searchParams.get("to");
  const fromQ = url.searchParams.get("from");
  if ((toQ !== null && !isIsoDate(toQ)) || (fromQ !== null && !isIsoDate(fromQ))) {
    return NextResponse.json({ ok: false, error: "invalid_range" }, { status: 400 });
  }
  const to = toQ ?? day(today);
  const from = fromQ ?? day(new Date(today.getTime() - 84 * 864e5));
  if (from > to) {
    return NextResponse.json({ ok: false, error: "invalid_range" }, { status: 400 });
  }

  try {
    const weeks = await analyticsWeekly(from, to);
    return NextResponse.json({ ok: true, from, to, weeks });
  } catch (err) {
    // Surface the upstream status so the admin UI can tell a wrong host / disabled
    // analytics API (404/401/403 on da.liteapi.travel) from a transient blip.
    const status = err instanceof LiteApiError ? err.status : 0;
    return NextResponse.json({ ok: false, error: "analytics_failed", status }, { status: 502 });
  }
}
