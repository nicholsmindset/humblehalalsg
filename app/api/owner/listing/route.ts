import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { revalidatePublic } from "@/lib/revalidate";

/* Owner self-service listing editor. GET returns the editable fields for a
   business the caller owns; PATCH updates a whitelist of fields. Ownership is
   enforced server-side (owner_id OR claimed_by === Clerk userId) before any
   read/write — the service-role client is only used after that check. */
export const dynamic = "force-dynamic";

// Fields a claimed owner may edit. Excludes name/halal_tier/status/featured/plan
// (identity + trust + billing stay admin-controlled).
const EDITABLE = ["phone", "website", "address", "postal", "description", "price_level", "opening_hours", "socials"] as const;

type Db = NonNullable<ReturnType<typeof getSupabaseAdmin>>;
async function ownership(db: Db, id: string, userId: string) {
  const { data } = await db.from("businesses").select("id, slug, owner_id, claimed_by").eq("id", id).maybeSingle();
  if (!data) return { row: null as null, owns: false };
  return { row: data, owns: data.owner_id === userId || data.claimed_by === userId };
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const id = new URL(req.url).searchParams.get("id") || "";
  const { row, owns } = await ownership(db, id, userId);
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (!owns) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { data, error } = await db
    .from("businesses")
    .select("id, slug, name, area, phone, website, address, postal, description, price_level, opening_hours, socials")
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, business: data });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id || "");
  const { row, owns } = await ownership(db, id, userId);
  if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  if (!owns) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const patch: Record<string, unknown> = {};
  for (const k of EDITABLE) if (k in body) patch[k] = body[k] === "" ? null : body[k];
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false, error: "no_fields" }, { status: 400 });

  const { error } = await db.from("businesses").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  revalidatePublic([`/business/${row.slug}`]);
  return NextResponse.json({ ok: true });
}
