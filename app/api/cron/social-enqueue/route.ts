/* Enqueue today's newly-live blog posts into the social outbox (pending_approval).
   A human approves rows; social-dispatch sends them. Cron-authorized; graceful. */
import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { enqueueSocialPost } from "@/lib/social-outbox";
import { scheduledDueOn } from "@/lib/content-calendar";
import { SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";

function todaySG(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(new Date());
}

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { getBlogPost } = await import("@/lib/cms-blog");
    const due = scheduledDueOn(todaySG());
    let queued = 0;
    for (const s of due) {
      const p = await getBlogPost(s.slug);
      if (!p || p.noindex) continue;
      const caption = `${p.title} — ${p.dek}`.slice(0, 260);
      const r = await enqueueSocialPost({
        kind: "blog_post",
        refSlug: p.slug,
        url: `${SITE.url}/blog/${p.slug}`,
        caption,
        imageUrl: `${SITE.url}/blog/${p.slug}/opengraph-image`,
      });
      if (r.queued) queued++;
    }
    return NextResponse.json({ ok: true, due: due.length, queued });
  } catch {
    return NextResponse.json({ ok: true, simulated: true });
  }
}
