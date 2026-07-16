import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sendEmail } from "@/lib/email";
import { canUse, planKey } from "@/lib/plans";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const limited = await rateLimit(req, "owner-support", 8, 3600);
  if (!limited.ok) return tooMany(limited.retryAfter);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  const db = getSupabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });

  const body = await req.json().catch(() => ({})) as { businessId?: string; subject?: string; message?: string };
  const subject = String(body.subject || "").trim().slice(0, 120);
  const message = String(body.message || "").trim().slice(0, 4000);
  if (!body.businessId || subject.length < 3 || message.length < 5) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 422 });
  }
  const { data: business } = await db.from("businesses")
    .select("id,name,slug,plan")
    .eq("id", body.businessId)
    .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`)
    .maybeSingle();
  if (!business) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const plan = planKey(business);
  const priority = canUse(plan, "priority_support") ? "high" : "normal";
  const { data: ticket, error } = await db.from("support_requests").insert({
    business_id: business.id,
    owner_id: userId,
    plan,
    priority,
    subject,
    message,
  }).select("id").single();
  if (error || !ticket) return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });

  const safe = (value: string) => value.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;" }[c] || c));
  await sendEmail({
    to: process.env.CONTACT_INBOX || "hello@humblehalal.com",
    subject: `${priority === "high" ? "[Priority support]" : "[Owner support]"} ${subject}`,
    template: "owner-support",
    businessId: business.id,
    html: `<p><strong>${safe(business.name)}</strong> (${safe(plan)} plan)</p><p>${safe(message).replace(/\n/g, "<br>")}</p><p>Request: ${ticket.id}</p>`,
  });
  return NextResponse.json({ ok: true, id: ticket.id, priority });
}
