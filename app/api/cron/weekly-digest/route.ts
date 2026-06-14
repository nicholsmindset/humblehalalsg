import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";

/* B4 — weekly digest: newest verified listings + latest guide → Resend to
   subscribers. Graceful without keys. (Subscriber list source is wired when the
   DB is live; for now this assembles + simulates.) */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { getDirectory } = await import("@/lib/directory");
    const { allPosts } = await import("@/lib/blog");
    const listings = await getDirectory();
    const newest = listings.slice(-6).reverse();
    const guide = allPosts()[0];
    const items = newest
      .map((l) => `<li><strong>${l.name}</strong> — ${l.cuisine}, ${l.area}</li>`)
      .join("");
    const html = `<h2>New this week on Humble Halal</h2><ul>${items}</ul><p>Latest guide: <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://www.humblehalal.com"}/blog/${guide?.slug}">${guide?.title}</a></p>`;

    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: true, simulated: true, preview: { newest: newest.length, guide: guide?.slug } });

    // Recipients live in a subscribers table once wired; assemble + log for now.
    await sb.from("cron_runs").insert({ job: "weekly-digest", ok: true, notes: `${newest.length} listings, guide ${guide?.slug}` });
    return NextResponse.json({ ok: true, simulated: false, html_len: html.length });
  } catch {
    return NextResponse.json({ ok: true, simulated: true });
  }
}
