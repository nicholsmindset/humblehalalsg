import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";

/* B6 — daily indexation health: confirm robots still welcomes the AI crawlers
   (Bing indexation powers ChatGPT citations) and the sitemap is reachable.
   Deep GSC/Bing coverage checks live in the Claude monthly SEO scan (C5). */
export const dynamic = "force-dynamic";

const AI_BOTS = ["GPTBot", "PerplexityBot", "ClaudeBot"];

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.humblehalal.com";
  const issues: string[] = [];
  try {
    const robots = await fetch(`${base}/robots.txt`, { cache: "no-store" }).then((r) => r.text()).catch(() => "");
    for (const bot of AI_BOTS) if (!robots.includes(bot)) issues.push(`robots.txt no longer allows ${bot}`);
    const sm = await fetch(`${base}/sitemap.xml`, { cache: "no-store" });
    if (!sm.ok) issues.push(`sitemap.xml returned ${sm.status}`);
  } catch {
    issues.push("health checks could not run");
  }
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (sb) await sb.from("cron_runs").insert({ job: "index-health", ok: issues.length === 0, notes: issues.join("; ") || "all good" });
  } catch {
    /* graceful */
  }
  return NextResponse.json({ ok: issues.length === 0, issues });
}
