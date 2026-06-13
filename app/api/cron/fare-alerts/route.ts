import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { liteapiConfigured, searchFlights } from "@/lib/liteapi";
import { normalizeItineraries } from "@/lib/flights";
import { sendEmail } from "@/lib/email";

/* Re-check active fare watches and email the traveller when the cheapest fare for
   their route+date drops below the last seen price (≥3% to avoid noise). Expired
   dates are deactivated. CRON_SECRET-guarded; graceful without keys. */
export const dynamic = "force-dynamic";
const DROP = 0.03;

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db || !liteapiConfigured()) return NextResponse.json({ ok: true, simulated: true });

  const todayIso = new Date().toISOString().slice(0, 10);
  const { data: rows } = await db
    .from("fare_watches")
    .select("id, email, origin, destination, depart_date, currency, last_price, notify_count")
    .eq("active", true)
    .gte("depart_date", todayIso)
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(40);

  let checked = 0;
  let notified = 0;
  for (const w of rows || []) {
    checked++;
    let price: number | null = null;
    try {
      const data = await searchFlights({ legs: [{ origin: w.origin, destination: w.destination, date: String(w.depart_date), direction: "OUTBOUND" }], adults: 1, currency: w.currency || "SGD" });
      const items = normalizeItineraries(data);
      const min = items.reduce((m, it) => (it.price != null && it.price < m ? it.price : m), Infinity);
      price = Number.isFinite(min) ? Math.round(min) : null;
    } catch { /* skip this cycle */ }

    const patch: Record<string, unknown> = { last_checked_at: new Date().toISOString() };
    const prev = w.last_price != null ? Number(w.last_price) : null;
    if (price != null && prev != null && price < prev * (1 - DROP)) {
      const cur = w.currency || "SGD";
      await sendEmail({
        to: w.email,
        subject: `Fare drop: ${w.origin} → ${w.destination} now ${cur} ${price}`,
        template: "fare-alert",
        html: `<p>Assalamualaikum,</p><p>The flight you're watching just dropped in price:</p>
<p><strong>${w.origin} → ${w.destination}</strong> on ${w.depart_date}<br/>
Now from <strong>${cur} ${price}</strong> (was ${cur} ${prev}).</p>
<p><a href="https://humblehalal.com/travel/flights">Search this route on Humble Halal →</a></p>
<p style="color:#888;font-size:12px">You're receiving this because you set a fare alert. Prices change quickly — confirm on the airline before booking.</p>`,
      });
      patch.notify_count = (Number(w.notify_count) || 0) + 1;
      patch.last_notified_at = new Date().toISOString();
      notified++;
    }
    if (price != null) patch.last_price = price;
    await db.from("fare_watches").update(patch).eq("id", w.id);
  }

  // deactivate past-date watches
  await db.from("fare_watches").update({ active: false }).lt("depart_date", todayIso).eq("active", true);

  try { await db.from("cron_runs").insert({ job: "fare-alerts", ok: true, notes: `checked ${checked}, notified ${notified}` }); } catch { /* best-effort */ }
  return NextResponse.json({ ok: true, checked, notified });
}
