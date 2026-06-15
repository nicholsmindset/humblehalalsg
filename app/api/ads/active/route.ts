import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Active sponsored creatives for a placement, for the public site to render.
   Returns only safe creative fields (no advertiser PII). Honest: only genuinely
   active, in-window campaigns up to the placement's inventory cap. */
export async function GET(req: Request) {
  const key = (new URL(req.url).searchParams.get("placement") || "").trim();
  const sb = getSupabaseAdmin();
  if (!sb || !key) return NextResponse.json({ ok: true, ads: [] });

  const { data: placement } = await sb.from("ad_placements").select("inventory_cap, active").eq("key", key).maybeSingle();
  if (!placement || placement.active === false) return NextResponse.json({ ok: true, ads: [] });

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const { data } = await sb
    .from("ad_campaigns")
    .select("id, title, body, image_url, target_url, starts_on, ends_on")
    .eq("placement_key", key)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const live = (data || [])
    .filter((c) => (!c.starts_on || c.starts_on <= today) && (!c.ends_on || c.ends_on >= today))
    .slice(0, Math.max(1, Number(placement.inventory_cap) || 1))
    .map((c) => ({ id: c.id, title: c.title, body: c.body, imageUrl: c.image_url, targetUrl: c.target_url }));

  return NextResponse.json({ ok: true, ads: live });
}
