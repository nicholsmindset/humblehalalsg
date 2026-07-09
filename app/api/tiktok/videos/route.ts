import { NextResponse } from "next/server";
import { getServerFlags } from "@/lib/feature-flags";

/* Public: approved TikTok videos for one business (by slug). Feeds the
   consent-gated video section on the listing page. Returns [] when the feature
   is off, Supabase is absent, or there are no approved videos. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await getServerFlags()).tiktokUgc) return NextResponse.json({ ok: true, videos: [] });
  const slug = new URL(req.url).searchParams.get("business") || "";
  if (!slug) return NextResponse.json({ ok: true, videos: [] });

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: true, videos: [] });

    const { data: biz } = await sb.from("businesses").select("id").eq("slug", slug).maybeSingle();
    if (!biz) return NextResponse.json({ ok: true, videos: [] });

    const { data } = await sb.from("tiktok_submissions")
      .select("id, url, video_id, handle, generated, created_at")
      .eq("status", "approved").eq("matched_business_id", biz.id)
      .order("created_at", { ascending: false }).limit(12);

    const videos = (data || []).map((r) => ({
      id: String(r.id),
      url: String(r.url),
      videoId: r.video_id ? String(r.video_id) : "",
      handle: r.handle ? String(r.handle) : "",
      caption: (r.generated as { captionSummary?: string } | null)?.captionSummary || "",
    }));
    return NextResponse.json({ ok: true, videos });
  } catch {
    return NextResponse.json({ ok: true, videos: [] });
  }
}
