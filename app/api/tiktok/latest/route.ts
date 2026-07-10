import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/feature-flags";

/* Public: the latest approved community TikToks ACROSS all published
   businesses — feeds the homepage "Fresh from the community" row. Returns []
   when the feature is off, Supabase is absent, or nothing is approved yet
   (so the homepage section hides gracefully). Shape mirrors
   /api/tiktok/videos so the same VideoCard consumes it, plus a `business`
   label + slug so cards can link to the listing. */
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getServerFlags()).tiktokUgc) return NextResponse.json({ ok: true, videos: [] });

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: true, videos: [] });

    const { data } = await sb.from("tiktok_submissions")
      .select("id, url, video_id, handle, generated, created_at, matched_business_id")
      .eq("status", "approved")
      .not("matched_business_id", "is", null)
      .order("created_at", { ascending: false }).limit(12);

    const rows = data || [];
    // Resolve business slug/name for the (few) matched businesses, published only.
    const bizIds = Array.from(new Set(rows.map((r) => r.matched_business_id).filter(Boolean)));
    const bizById = new Map<string, { slug: string; name: string }>();
    if (bizIds.length) {
      const { data: bizs } = await sb.from("businesses")
        .select("id, slug, name, status")
        .in("id", bizIds as string[]);
      for (const b of bizs || []) {
        if (b.status === "published") bizById.set(String(b.id), { slug: String(b.slug), name: String(b.name) });
      }
    }

    const videos = rows
      .filter((r) => bizById.has(String(r.matched_business_id)))
      .slice(0, 8)
      .map((r) => {
        const biz = bizById.get(String(r.matched_business_id))!;
        return {
          id: String(r.id),
          url: String(r.url),
          videoId: r.video_id ? String(r.video_id) : "",
          handle: r.handle ? String(r.handle) : "",
          caption: (r.generated as { captionSummary?: string } | null)?.captionSummary || "",
          business: biz.name,
          slug: biz.slug,
        };
      });
    return NextResponse.json({ ok: true, videos });
  } catch {
    return NextResponse.json({ ok: true, videos: [] });
  }
}
