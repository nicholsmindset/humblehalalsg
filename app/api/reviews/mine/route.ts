import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin, supabaseConfigured } from "@/lib/supabase/server";

/* The signed-in user's own reviews, newest first, with the business name + slug
   resolved for each.

   AUTH CONTRACT (intentional): returns 200 { ok:true, reviews:[] } for guests —
   NOT 401 — so the dashboard "My reviews" tab still renders (and stays graceful
   when Supabase isn't configured in dev). Deliberate read-endpoint choice, not a
   missing auth check; write endpoints 401 signed-out callers. */

type ReviewRow = {
  id: string;
  business_id: string | null;
  rating: number;
  text: string | null;
  status: string;
  created_at: string;
};

type BusinessRow = { id: string; name: string; slug: string };

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: true, reviews: [] }); // guests: 200 empty by design (see header)

  if (!supabaseConfigured) return NextResponse.json({ ok: true, reviews: [], simulated: true });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ ok: true, reviews: [] });

  const { data: rows, error } = await admin
    .from("reviews")
    .select("id,business_id,rating,text,status,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ ok: false, error: "load_failed" }, { status: 502 });

  const reviews = (rows ?? []) as ReviewRow[];
  const bizIds = [...new Set(reviews.map((r) => r.business_id).filter(Boolean) as string[])];

  const bizById = new Map<string, BusinessRow>();
  if (bizIds.length) {
    const { data: biz } = await admin.from("businesses").select("id,name,slug").in("id", bizIds);
    for (const b of (biz ?? []) as BusinessRow[]) bizById.set(b.id, b);
  }

  return NextResponse.json({
    ok: true,
    reviews: reviews.map((r) => {
      const b = r.business_id ? bizById.get(r.business_id) : undefined;
      return {
        id: r.id,
        businessName: b?.name ?? "Unknown business",
        businessSlug: b?.slug ?? null,
        rating: r.rating,
        text: r.text ?? "",
        status: r.status,
        created_at: r.created_at,
      };
    }),
  });
}
