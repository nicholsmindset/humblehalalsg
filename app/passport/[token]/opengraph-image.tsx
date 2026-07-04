import { ImageResponse } from "next/og";
import { getServerFlags } from "@/lib/flags";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { tierFor } from "@/lib/passport";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Halal Passport on Humble Halal";

type Row = { display_name: string; total_points: number; visit_count: number; review_count: number };

async function load(token: string): Promise<Row | null> {
  if (!getServerFlags().passport) return null;
  const db = getSupabaseAdmin();
  if (!db) return null;
  try {
    const { data } = await db.rpc("public_passport_by_token", { p_token: token });
    const row = Array.isArray(data) ? data[0] : data;
    return (row as Row) ?? null;
  } catch {
    return null;
  }
}

export default async function OgImage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await load(token);
  const name = row?.display_name ?? "A Humble Halal member";
  const tier = row ? tierFor(row.total_points).label : "Explorer";
  const line = row ? `${row.visit_count} places visited · ${row.review_count} reviews` : "Singapore's halal directory";
  const points = row?.total_points ?? 0;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0F5C4A", fontFamily: "Georgia, serif", color: "#FAF7EF" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 24, color: "#D6A84F", letterSpacing: 3 }}>HALAL PASSPORT · HUMBLE HALAL</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignSelf: "flex-start", background: "#D6A84F", color: "#3a2c08", fontSize: 28, fontWeight: 700, padding: "8px 22px", borderRadius: 999 }}>{tier}</div>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, maxWidth: 1000 }}>{name}</div>
          <div style={{ fontSize: 32, color: "#DDEAE4" }}>{line}</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, fontSize: 40, fontWeight: 700, color: "#D6A84F" }}>
          {points} <span style={{ fontSize: 26, color: "#DDEAE4" }}>points</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
