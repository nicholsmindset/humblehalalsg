import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { beehiivBroadcast } from "@/lib/beehiiv";
import { SITE } from "@/lib/seo";

/* Weekly digest: new guides this week + newest verified listings → a broadcast.
   Primary newsletter path is Beehiiv RSS-to-email pointed at /blog/feed.xml; this
   cron is the supplementary assembler + optional direct send (beehiivBroadcast).
   Graceful without keys: it assembles, attempts the send, and logs. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { getDirectory } = await import("@/lib/directory");
    const { allBlogPosts } = await import("@/lib/cms-blog");

    const listings = await getDirectory();
    const newest = listings.slice(-6).reverse();

    // New guides in the last 7 days (SGT) — the heart of the digest.
    const cutoff = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    const posts = await allBlogPosts();
    const freshPosts = posts.filter((p) => (p.dateModified || p.datePublished) >= cutoff).slice(0, 5);
    const latest = freshPosts.length ? freshPosts : posts.slice(0, 1);

    const postLis = latest
      .map((p) => `<li><a href="${SITE.url}/blog/${p.slug}">${p.title}</a> — ${p.dek}</li>`)
      .join("");
    const listingLis = newest
      .map((l) => `<li><strong>${l.name}</strong> — ${l.cuisine}, ${l.area}</li>`)
      .join("");
    const subject = latest[0] ? `New this week: ${latest[0].title}` : "New this week on Humble Halal";
    const html =
      `<h2>New guides this week</h2><ul>${postLis}</ul>` +
      (listingLis ? `<h3>New on the directory</h3><ul>${listingLis}</ul>` : "") +
      `<p><a href="${SITE.url}/blog">Read more halal guides →</a></p>`;

    const sent = await beehiivBroadcast({ subject, html, intent: "foodie" });

    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (sb) {
      await sb
        .from("cron_runs")
        .insert({ job: "weekly-digest", ok: true, notes: `${latest.length} posts, ${newest.length} listings, broadcast ${sent.simulated ? "simulated" : sent.ok ? "sent" : "failed"}` });
    }
    return NextResponse.json({ ok: true, posts: latest.length, listings: newest.length, broadcast: sent });
  } catch {
    return NextResponse.json({ ok: true, simulated: true });
  }
}
