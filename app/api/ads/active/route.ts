import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Active creative(s) + serving config for a placement, for the public site to render.
   Returns only safe creative fields (no advertiser PII) plus the placement's serving
   config (size, fill mode, reserved height, AdSense slot) so <AdSlot> can decide:
   direct sponsor → AdSense fill → nothing. Honest: only genuinely active, approved,
   in-window campaigns up to the placement's inventory cap. */

type PlacementConfig = {
  key: string;
  active: boolean;
  fillMode: "off" | "direct_only" | "adsense_only" | "direct_then_adsense";
  sizeFormat: string;
  adsenseSlot: string | null;
  minHeight: number;
  minHeightMobile: number;
  lazy: boolean;
};

// Fallback config when the backend isn't configured OR the placement predates 0040
// (columns default there anyway). Keeps mock/dev rendering identical.
function placementFrom(row: Record<string, unknown> | null | undefined, key: string): PlacementConfig | null {
  if (!row) return null;
  return {
    key,
    active: row.active !== false,
    fillMode: (["off", "direct_only", "adsense_only", "direct_then_adsense"].includes(String(row.fill_mode))
      ? String(row.fill_mode)
      : "direct_then_adsense") as PlacementConfig["fillMode"],
    sizeFormat: String(row.size_format || "in_feed"),
    adsenseSlot: row.adsense_slot ? String(row.adsense_slot) : null,
    minHeight: Number(row.min_height_px) || 0,
    minHeightMobile: Number(row.min_height_px_mobile) || 0,
    lazy: row.lazy !== false,
  };
}

export async function GET(req: Request) {
  const key = (new URL(req.url).searchParams.get("placement") || "").trim();
  const sb = getSupabaseAdmin();
  if (!sb || !key) return NextResponse.json({ ok: true, ads: [], placement: null });

  // select("*") (not named columns) so this route keeps working if it deploys
  // before migration 0040 — placementFrom() defaults any missing config columns,
  // so existing direct campaigns keep serving through the transition.
  const { data: placementRow } = await sb
    .from("ad_placements")
    .select("*")
    .eq("key", key)
    .maybeSingle();

  const placement = placementFrom(placementRow, key);
  // Unknown or fully-off placement → nothing to serve, no reserved space.
  if (!placement || placement.active === false || placement.fillMode === "off") {
    return NextResponse.json({ ok: true, ads: [], placement: placement && { ...placement, fillMode: "off" } });
  }

  // AdSense-only slots never query direct campaigns.
  let live: Array<{ id: string; title: string; body: unknown; imageUrl: unknown; targetUrl: unknown }> = [];
  if (placement.fillMode !== "adsense_only") {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    // select("*") so review_status is read defensively: pre-migration the column is
    // absent (undefined) and the campaign is grandfathered as approved; post-migration
    // only review_status='approved' serves (the brand-safety review gate).
    const { data } = await sb
      .from("ad_campaigns")
      .select("*")
      .eq("placement_key", key)
      .eq("status", "active")
      .order("created_at", { ascending: true });

    const cap = Math.max(1, Number(placementRow?.inventory_cap) || 1);
    live = (data || [])
      .filter((c) => c.review_status === undefined || c.review_status === "approved")
      .filter((c) => (!c.starts_on || c.starts_on <= today) && (!c.ends_on || c.ends_on >= today))
      .slice(0, cap)
      .map((c) => ({ id: c.id, title: c.title, body: c.body, imageUrl: c.image_url, targetUrl: c.target_url }));
  }

  return NextResponse.json({ ok: true, ads: live, placement });
}
