import { NextResponse } from "next/server";
import { authoriseEventManager } from "@/lib/event-auth";

/* Organiser tracking links for one event (owner/admin only). Each code powers
   a share link /e/[slug]?ref=CODE that 302s to the event page, counts the
   click and stamps the hh_attr cookie so confirmed orders credit the channel
   (orders.ref_code — migration 0042). */

const CODE_RE = /^[a-z0-9][a-z0-9-]{1,31}$/;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authoriseEventManager(id);
  if (!a.ok) return a.res;

  const { data } = await a.admin
    .from("event_ref_codes")
    .select("id, code, label, clicks, created_at")
    .eq("event_id", a.ev.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ ok: true, refCodes: data ?? [], slug: a.ev.slug });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authoriseEventManager(id);
  if (!a.ok) return a.res;
  if (!a.ev.business_id) return NextResponse.json({ ok: false, reason: "no_business" }, { status: 422 });

  const body = (await req.json().catch(() => ({}))) as { code?: string; label?: string };
  const code = String(body.code ?? "").trim().toLowerCase();
  if (!CODE_RE.test(code)) return NextResponse.json({ ok: false, reason: "bad_code" }, { status: 422 });
  const label = String(body.label ?? "").trim().slice(0, 80) || null;

  const { data, error } = await a.admin
    .from("event_ref_codes")
    .insert({ event_id: a.ev.id, business_id: a.ev.business_id, code, label })
    .select("id")
    .single();

  if (error) {
    const duplicate = error.code === "23505";
    return NextResponse.json({ ok: false, reason: duplicate ? "duplicate_code" : "db_error" }, { status: duplicate ? 409 : 500 });
  }
  return NextResponse.json({ ok: true, id: data.id, url: `/e/${a.ev.slug}?ref=${code}` });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authoriseEventManager(id);
  if (!a.ok) return a.res;

  const refId = new URL(req.url).searchParams.get("refId") || "";
  if (!refId) return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });

  // Deleting a link only stops future clicks — past orders keep the ref_code
  // text snapshot, so channel history in the Marketing tab survives.
  const { error } = await a.admin.from("event_ref_codes").delete().eq("id", refId).eq("event_id", a.ev.id);
  if (error) return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
