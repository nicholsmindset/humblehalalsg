import "server-only";
import type { getSupabaseAdmin } from "@/lib/supabase/server";

type Db = NonNullable<ReturnType<typeof getSupabaseAdmin>>;
type Photo = { url: string; caption?: string };

/** Synchronise the legacy ordered businesses.photos projection into governed
 * media records. Best-effort so a rolling deploy remains safe before 0074. */
export async function syncMediaProjection(db: Db, opts: { businessId: string; photos: Photo[]; actor?: string | null; source: "owner_upload"|"admin_upload"|"legacy"; rightsConfirmed: boolean }) {
  try {
    const { data } = await db.from("photos").select("id,url,status").eq("business_id", opts.businessId);
    const rows = (data || []) as { id: string; url: string; status: string }[];
    const byUrl = new Map(rows.map((r) => [r.url, r]));
    const active = new Set(opts.photos.map((p) => p.url));
    for (let i = 0; i < opts.photos.length; i++) {
      const p = opts.photos[i]; const existing = byUrl.get(p.url);
      const patch = { caption: p.caption || null, alt_text: p.caption || null, role: i === 0 ? "cover" : "gallery", sort_order: i, status: "approved", rejection_reason: null };
      if (existing) await db.from("photos").update(patch).eq("id", existing.id);
      else await db.from("photos").insert({ business_id: opts.businessId, url: p.url, ...patch, uploaded_by: opts.actor || null, source: opts.source, rights_confirmed: opts.rightsConfirmed, reviewed_by: opts.source === "admin_upload" ? opts.actor || null : null, reviewed_at: new Date().toISOString() });
    }
    for (const row of rows) if (!active.has(row.url) && row.status !== "rejected") await db.from("photos").update({ status: "rejected", rejection_reason: "Removed from listing", reviewed_by: opts.actor || null, reviewed_at: new Date().toISOString() }).eq("id", row.id);
  } catch { /* migration may not have landed yet */ }
}
