import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSafeEventRef } from "@/lib/event-ref";

/* Shared owner/admin authorisation for organiser event APIs (promo codes,
   ref codes, marketing analytics — same rules as the stats/requests routes,
   which grew their own inline copies before this helper existed). Accepts an
   event id OR slug; allows platform admins and the event's business owner. */

export type EventAuthOk = {
  ok: true;
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>;
  userId: string;
  ev: {
    id: string;
    title: string;
    slug: string;
    status: string;
    capacity: number;
    is_free: boolean;
    date_iso: string | null;
    business_id: string | null;
    display: Record<string, unknown>;
  };
};
export type EventAuthErr = { ok: false; res: NextResponse };

export async function authoriseEventManager(ref: string): Promise<EventAuthOk | EventAuthErr> {
  const { userId } = await auth();
  if (!userId) return { ok: false, res: NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 }) };
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, res: NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 }) };

  const { data: ev } = isSafeEventRef(ref)
    ? await admin
        .from("events")
        .select("id, title, slug, status, capacity, is_free, date_iso, business_id, submitted_by, display")
        .or(`id.eq.${ref},slug.eq.${ref}`)
        .maybeSingle()
    : { data: null };
  if (!ev) return { ok: false, res: NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 }) };

  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  let allowed = profile?.role === "admin" || ev.submitted_by === userId;
  if (!allowed && ev.business_id) {
    const { data: biz } = await admin
      .from("businesses")
      .select("id")
      .eq("id", ev.business_id as string)
      .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`)
      .maybeSingle();
    allowed = !!biz;
  }
  if (!allowed) return { ok: false, res: NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 }) };

  return {
    ok: true,
    admin,
    userId,
    ev: {
      id: ev.id as string,
      title: (ev.title as string) || "Event",
      slug: (ev.slug as string) || (ev.id as string),
      status: (ev.status as string) || "",
      capacity: Number(ev.capacity) || 0,
      is_free: !!ev.is_free,
      date_iso: (ev.date_iso as string) ?? null,
      business_id: (ev.business_id as string) ?? null,
      display: (ev.display && typeof ev.display === "object" ? ev.display : {}) as Record<string, unknown>,
    },
  };
}
