import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";

/* Verdict drafting cron — feeds the "is [brand] halal?" pipeline from the
   curated queue (lib/verdict-queue.ts). Each run AI-drafts a couple of
   verdicts for brands not yet covered and inserts them as status='pending'.
   It NEVER publishes: a human approves in the admin queue, and only
   status='approved' rows ever render on /is-halal/[slug]. Daily batch of 2
   ≈ 14 drafts/week — throttled so human review quality holds.

   Graceful without keys, and a no-op while HALAL_VERDICTS_ENABLED is off —
   the kill-switch keeps the whole feature inert, drafting included. */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH = 2;

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { getServerFlags } = await import("@/lib/feature-flags");
    if (!(await getServerFlags()).halalVerdicts) return NextResponse.json({ ok: true, skipped: "flag_off" });

    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const db = getSupabaseAdmin();
    if (!db) return NextResponse.json({ ok: true, simulated: true });

    const { aiConfigured } = await import("@/lib/ai");
    if (!aiConfigured) return NextResponse.json({ ok: true, skipped: "ai_not_configured" });

    // Everything already covered: file/CMS brands (incl. aliases) + every
    // existing verdict row regardless of status — a rejected draft must not be
    // endlessly redrafted; re-runs happen by deleting the row or via admin.
    const { allBrandsMerged } = await import("@/lib/cms-brands");
    const { queueCandidates } = await import("@/lib/verdict-queue");
    const exclude = new Set<string>();
    for (const b of await allBrandsMerged()) {
      exclude.add(b.slug);
      for (const a of b.aliases || []) exclude.add(a);
    }
    const { data: existing } = await db.from("halal_verdicts").select("slug").limit(5000);
    for (const r of existing || []) exclude.add(r.slug as string);

    const limitParam = Number(new URL(req.url).searchParams.get("limit"));
    const batch = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 5) : BATCH;
    const candidates = queueCandidates(exclude).slice(0, batch);
    if (!candidates.length) {
      await db.from("cron_runs").insert({ job: "verdict-drafts", ok: true, notes: "queue empty — nothing to draft" });
      return NextResponse.json({ ok: true, drafted: 0, queueEmpty: true });
    }

    const { generateVerdictRow } = await import("@/lib/verdict-draft");
    const drafted: string[] = [];
    const failed: string[] = [];
    for (const c of candidates) {
      try {
        const row = await generateVerdictRow({ pageType: "brand", name: c.name });
        if (!row) { failed.push(c.slug); continue; }
        const { error } = await db.from("halal_verdicts").insert(row);
        if (error) failed.push(c.slug);
        else drafted.push(c.slug);
      } catch {
        failed.push(c.slug);
      }
    }

    await db.from("cron_runs").insert({
      job: "verdict-drafts",
      ok: failed.length === 0,
      notes: `${drafted.length} drafted (${drafted.join(", ") || "none"})${failed.length ? ` · ${failed.length} failed (${failed.join(", ")})` : ""} — pending human review`,
    });
    return NextResponse.json({ ok: true, drafted: drafted.length, failed: failed.length, slugs: drafted });
  } catch {
    return NextResponse.json({ ok: true, simulated: true });
  }
}
