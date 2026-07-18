/* Ping IndexNow for blog posts that went live today (SGT) — called by the daily
   blog-publish workflow after it dispatches the deploy. Also accepts an explicit
   ?url= list. Cron-authorized; fails soft without INDEXNOW_KEY. */
import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { submitIndexNow } from "@/lib/indexnow";
import { scheduledDueOn } from "@/lib/content-calendar";
import { SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";

function todaySG(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(new Date());
}

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const explicit = searchParams.getAll("url");
  const dueToday = scheduledDueOn(todaySG()).map((p) => `${SITE.url}/blog/${p.slug}`);
  const urls = explicit.length ? explicit : dueToday;
  // Always refresh the blog index + feed so listings/aggregators re-crawl too.
  urls.push(`${SITE.url}/blog`, `${SITE.url}/blog/feed.xml`);
  const result = await submitIndexNow(urls);
  return NextResponse.json(result);
}
