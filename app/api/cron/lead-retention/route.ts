import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";

/* PDPA retention — anonymize old lead PII. We keep leads only as long as needed
   to arrange quotes (see /pdpa). Weekly:
     · closed/spam leads older than 180 days
     · ANY lead older than 365 days
   Nulls name/email/phone/details and stamps anonymized_at (routing/aggregate
   history stays intact for analytics; PII does not). Graceful without keys. */
export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { getSupabaseAdmin } = await import("@/lib/supabase/server");
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: true, simulated: true });

  const now = Date.now();
  const cutoff180 = new Date(now - 180 * DAY).toISOString();
  const cutoff365 = new Date(now - 365 * DAY).toISOString();
  const scrub = { name: "[removed]", email: null, phone: null, details: null, anonymized_at: new Date(now).toISOString() };

  let total = 0;
  try {
    // Closed/spam older than 180d.
    const r1 = await sb.from("leads").update(scrub)
      .in("status", ["closed", "spam"]).lt("created_at", cutoff180).is("anonymized_at", null)
      .select("id");
    total += r1.data?.length || 0;
    // Anything older than 365d.
    const r2 = await sb.from("leads").update(scrub)
      .lt("created_at", cutoff365).is("anonymized_at", null)
      .select("id");
    total += r2.data?.length || 0;
    try { await sb.from("cron_runs").insert({ job: "lead-retention", ok: true, notes: `anonymized ${total}` }); } catch { /* optional table */ }
  } catch {
    return NextResponse.json({ ok: true, simulated: true });
  }

  return NextResponse.json({ ok: true, anonymized: total });
}
