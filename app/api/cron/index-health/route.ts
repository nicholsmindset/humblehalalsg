import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";

/* B6 — daily indexation health: confirm the shared public-crawler rule and
   sitemap are reachable.
   Deep GSC/Bing coverage checks live in the Claude monthly SEO scan (C5). */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.humblehalal.com";
  const issues: string[] = [];
  try {
    const robots = await fetch(`${base}/robots.txt`, { cache: "no-store" }).then((r) => r.text()).catch(() => "");
    if (!/^User-Agent:\s*\*/im.test(robots) || !/^Allow:\s*\//im.test(robots)) {
      issues.push("robots.txt no longer allows public crawlers");
    }
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
