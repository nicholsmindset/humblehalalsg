import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizeCron } from "@/lib/cron";

/* C4 — AI review triage. Classifies pending reviews (spam / abusive / ok) and
   moves clear spam/abuse to 'flagged' so the admin queue surfaces them; genuine
   reviews stay 'pending' for human approval (we never auto-publish). Graceful:
   no Supabase or no AI key → no-op simulated. */
export const dynamic = "force-dynamic";

const Verdict = z.object({
  verdict: z.enum(["ok", "spam", "abusive"]),
  reason: z.string().max(200),
});

const SYSTEM =
  "You moderate reviews for a Singapore halal business directory. Classify each " +
  "review as: 'spam' (ads, links, gibberish, irrelevant), 'abusive' (hate, " +
  "harassment, profanity, threats), or 'ok' (a genuine opinion, even if negative). " +
  "Be conservative — only flag clear spam/abuse; legitimate criticism is 'ok'.";

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const { aiObject, aiConfigured, AI_MODEL_FAST } = await import("@/lib/ai");
    const sb = getSupabaseAdmin();
    if (!sb || !aiConfigured) return NextResponse.json({ ok: true, simulated: true });

    const { data: pending } = await sb
      .from("reviews")
      .select("id, text")
      .eq("status", "pending")
      .limit(50);

    let flagged = 0;
    for (const r of (pending || []) as { id: string; text: string }[]) {
      const verdict = await aiObject(Verdict, {
        model: AI_MODEL_FAST,
        system: SYSTEM,
        prompt: `Review:\n"""${(r.text || "").slice(0, 1500)}"""`,
      });
      if (verdict && verdict.verdict !== "ok") {
        await sb.from("reviews").update({ status: "flagged" }).eq("id", r.id);
        flagged++;
      }
    }
    await sb.from("cron_runs").insert({ job: "review-triage", ok: true, notes: `${flagged} flagged of ${pending?.length ?? 0}` });
    return NextResponse.json({ ok: true, simulated: false, flagged, scanned: pending?.length ?? 0 });
  } catch {
    return NextResponse.json({ ok: true, simulated: true });
  }
}
