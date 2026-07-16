import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const FIELDS = "id, slug, title, status, taken, capacity, is_free, date_iso, display";

/** Owner-safe event feed. The service-role read happens only after Clerk auth,
 * and rows are limited to events submitted by the user or attached to a
 * business they own/claim. This keeps pending events visible despite public
 * RLS correctly hiding them. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const { data: businesses } = await db
    .from("businesses")
    .select("id")
    .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`)
    .limit(100);

  const [submitted, linked] = await Promise.all([
    db.from("events").select(FIELDS).eq("submitted_by", userId).order("date_iso", { ascending: false }).limit(100),
    businesses?.length
      ? db.from("events").select(FIELDS).in("business_id", businesses.map((business) => business.id)).order("date_iso", { ascending: false }).limit(100)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (submitted.error || linked.error) return NextResponse.json({ ok: false, error: "load_failed" }, { status: 502 });

  const merged = new Map<string, Record<string, unknown>>();
  for (const event of [...(submitted.data || []), ...(linked.data || [])]) merged.set(String(event.id), event);
  const events = [...merged.values()].sort((a, b) => String(b.date_iso || "").localeCompare(String(a.date_iso || "")));
  return NextResponse.json({ ok: true, events });
}
