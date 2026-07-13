import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* The logged-in user's tickets (with the scannable qr_ref) for the My Tickets
   view. Scoped to the caller's own orders (by user id or verified email).

   AUTH CONTRACT (intentional): this GET returns 200 { ok:true, tickets:[] } for
   guests — NOT 401 — so the dashboard tab renders and the UI falls back to
   locally-stored tickets. This is a deliberate read-endpoint choice, not a
   missing auth check; write endpoints (e.g. /api/tickets/checkin) DO 401. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: true, tickets: [] }); // guests: 200 empty by design (see header)

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: true, tickets: [] });

  const cu = await currentUser();
  const email = cu?.primaryEmailAddress?.emailAddress ?? cu?.emailAddresses?.[0]?.emailAddress ?? "";
  const orFilter = email ? `buyer_user_id.eq.${userId},buyer_email.eq.${email}` : `buyer_user_id.eq.${userId}`;
  const { data: orders } = await admin.from("orders").select("id, status").or(orFilter);
  const orderIds = (orders || []).map((o) => o.id as string);
  if (!orderIds.length) return NextResponse.json({ ok: true, tickets: [] });

  const { data: tix } = await admin
    .from("tickets")
    .select("id, qr_ref, tier, status, event_id, created_at")
    .in("order_id", orderIds)
    .order("created_at", { ascending: false })
    .limit(100);
  if (!tix || !tix.length) return NextResponse.json({ ok: true, tickets: [] });

  // Attach lightweight event display info.
  const eventIds = [...new Set(tix.map((t) => t.event_id).filter(Boolean))] as string[];
  const evMap = new Map<string, { title: string; slug: string; dateISO: string; img: string; cat: string }>();
  if (eventIds.length) {
    const { data: evs } = await admin.from("events").select("id, title, slug, date_iso, display").in("id", eventIds);
    for (const e of evs || []) {
      const d = (e.display && typeof e.display === "object" ? e.display : {}) as Record<string, unknown>;
      evMap.set(e.id as string, {
        title: String(e.title || ""), slug: String(e.slug || ""),
        dateISO: String(e.date_iso || ""), img: String(d.img || ""), cat: String(d.cat || "Event"),
      });
    }
  }

  const tickets = tix.map((t) => ({
    id: t.id, qrRef: t.qr_ref, tier: t.tier || "Ticket", status: t.status,
    event: t.event_id ? evMap.get(t.event_id) || null : null,
  }));
  return NextResponse.json({ ok: true, tickets });
}
