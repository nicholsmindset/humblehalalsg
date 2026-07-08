import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { rateLimit, tooMany } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/email";
import { emailForUser } from "@/lib/emails/recipient";
import { reviewReplyEmail } from "@/lib/emails/templates";

/* Owner replies to a review. Thin wrapper over the owner_reply_to_review RPC
   (0015/0031), which is SECURITY DEFINER and hard-scoped to reviews on listings
   the caller owns — so we call it with the Clerk-authenticated server client and
   let it be the authorization gate. On success we ALSO email the reviewer that
   they've got a reply (best-effort, via the service-role client to resolve the
   reviewer's email + the business name — never affects the response). */

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export async function POST(req: Request) {
  const rl = await rateLimit(req, "owner-review-reply", 30, 3600); if (!rl.ok) return tooMany(rl.retryAfter);

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ ok: false, error: "Sign in to reply." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const reviewId = String(body?.reviewId || "").trim();
  const reply = String(body?.reply || "").trim().slice(0, 2000);
  if (!isUuid(reviewId)) return NextResponse.json({ ok: false, error: "Unknown review." }, { status: 422 });
  if (reply.length < 2) return NextResponse.json({ ok: false, error: "Write a short reply." }, { status: 422 });

  const { getSupabaseServer, getSupabaseAdmin } = await import("@/lib/supabase/server");
  const sb = await getSupabaseServer();
  if (!sb) return NextResponse.json({ ok: true, simulated: true }); // mock mode

  // The RPC is the authorization gate: it raises 'not your review' if the caller
  // doesn't own the review's business, and updates the reply otherwise.
  const { error } = await sb.rpc("owner_reply_to_review", { p_review_id: reviewId, p_reply: reply });
  if (error) return NextResponse.json({ ok: false, error: "Couldn't post reply." }, { status: 403 });

  // Best-effort: notify the reviewer (email + in-app bell). Uses service-role
  // to read the reviewer's email + business name (out of the owner's RLS scope).
  try {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data: rv } = await admin.from("reviews").select("user_id, business_id").eq("id", reviewId).maybeSingle();
      const reviewerId = (rv?.user_id as string) || null;
      let businessName = "the business";
      let businessSlug: string | null = null;
      if (rv?.business_id) {
        const { data: biz } = await admin.from("businesses").select("name, slug").eq("id", rv.business_id).maybeSingle();
        if (biz?.name) businessName = String(biz.name);
        if (biz?.slug) businessSlug = String(biz.slug);
      }
      if (reviewerId) {
        const { notify } = await import("@/lib/notify");
        await notify({
          userId: reviewerId,
          type: "review_reply",
          title: `${businessName} replied to your review`,
          body: reply.slice(0, 140),
          link: businessSlug ? `/business/${businessSlug}?tab=reviews` : undefined,
          dedupeKey: `review_reply:${reviewId}`,
        });
      }
      const { email, name } = await emailForUser(admin, reviewerId);
      if (email) {
        const t = reviewReplyEmail({ name, businessName, reply });
        await sendEmail({ to: email, subject: t.subject, html: t.html, template: "review-reply", businessId: (rv?.business_id as string) || undefined });
      }
    }
  } catch { /* best-effort */ }

  return NextResponse.json({ ok: true });
}
