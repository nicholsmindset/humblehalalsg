import { NextResponse, after } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { emailForBusinessOwner } from "@/lib/emails/recipient";
import { notify } from "@/lib/notify";

/* Admin sponsored-ad manager. GET → rate card + campaigns with real performance
   (impressions/clicks). POST → create a campaign (sales team books a sponsor).
   PATCH → update a campaign (status/dates/creative). Admin-only. */

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  const [{ data: placements }, { data: perf }, { data: reviews }] = await Promise.all([
    sb.from("ad_placements").select("*").order("sort"),
    sb.from("v_campaign_performance").select("*"),
    sb.from("ad_campaigns").select("*"),
  ]);
  // The performance view predates the review gate; merge review_status + creative
  // image in from ad_campaigns so the admin can approve/reject and preview.
  const meta = new Map((reviews || []).map((r) => [r.id, r]));
  const rows = (perf || []).map((p) => ({
    ...p,
    review_status: meta.get(p.campaign_id)?.review_status ?? "approved",
    image_url: meta.get(p.campaign_id)?.image_url ?? null,
    created_via: meta.get(p.campaign_id)?.created_via ?? "admin",
    starts_on: meta.get(p.campaign_id)?.starts_on ?? null,
    ends_on: meta.get(p.campaign_id)?.ends_on ?? null,
    ctr: p.impressions > 0 ? Math.round((p.clicks / p.impressions) * 1000) / 10 : 0,
  }));
  // Revenue booked = sum of agreed rates across non-draft campaigns.
  const revenueCents = rows
    .filter((r) => r.status !== "draft")
    .reduce((s, r) => s + (Number(r.rate_cents) || 0), 0);
  return NextResponse.json({ ok: true, placements: placements || [], campaigns: rows, revenueCents });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  const title = String(b.title || "").trim();
  const placement_key = String(b.placementKey || "").trim();
  if (!title || !placement_key) return NextResponse.json({ ok: false, error: "title + placement required" }, { status: 422 });

  const { data, error } = await sb.from("ad_campaigns").insert({
    title,
    placement_key,
    business_id: b.businessId ? String(b.businessId) : null,
    advertiser_name: b.advertiserName ? String(b.advertiserName).slice(0, 120) : null,
    body: b.body ? String(b.body).slice(0, 280) : null,
    image_url: b.imageUrl ? String(b.imageUrl).slice(0, 500) : null,
    target_url: b.targetUrl ? String(b.targetUrl).slice(0, 500) : null,
    status: ["draft", "scheduled", "active", "paused", "ended"].includes(String(b.status)) ? String(b.status) : "draft",
    starts_on: b.startsOn ? String(b.startsOn) : null,
    ends_on: b.endsOn ? String(b.endsOn) : null,
    rate_cents: Math.max(0, Math.round(Number(b.rateCents) || 0)),
    budget_cents: b.budgetCents != null ? Math.max(0, Math.round(Number(b.budgetCents))) : null,
    notes: b.notes ? String(b.notes).slice(0, 500) : null,
    // Review gate: a new creative is 'pending' until an admin approves it — even
    // if created with status 'active', it won't serve until review_status='approved'.
    review_status: "pending",
    created_by: gate.userId,
  }).select("id").single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "service_not_configured" }, { status: 503 });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 }); }
  const id = String(b.id || "");
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 422 });

  const patch: Record<string, unknown> = {};
  if (typeof b.title === "string" && b.title.trim()) patch.title = b.title.trim();
  if (["draft", "scheduled", "active", "paused", "ended"].includes(String(b.status))) patch.status = b.status;
  if (["pending", "approved", "rejected"].includes(String(b.reviewStatus))) patch.review_status = b.reviewStatus;
  if (typeof b.body === "string") patch.body = b.body.slice(0, 280);
  if (typeof b.imageUrl === "string") patch.image_url = b.imageUrl.slice(0, 500);
  if (typeof b.targetUrl === "string") patch.target_url = b.targetUrl.slice(0, 500);
  if (b.startsOn !== undefined) patch.starts_on = b.startsOn ? String(b.startsOn) : null;
  if (b.endsOn !== undefined) patch.ends_on = b.endsOn ? String(b.endsOn) : null;
  if (b.rateCents !== undefined) patch.rate_cents = Math.max(0, Math.round(Number(b.rateCents) || 0));
  if (b.notes !== undefined) patch.notes = b.notes ? String(b.notes).slice(0, 500) : null;
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false, error: "nothing_to_update" }, { status: 422 });

  // Rejecting a PAID self-serve campaign must refund the owner (audit
  // streams-P1-5 — the builder promises "we'll contact you to fix it or refund
  // you") and stop the schedule. Idempotent refund per campaign; the
  // charge.refunded webhook then flips the ad_orders ledger row too.
  let refunded = false;
  if (patch.review_status === "rejected") {
    const { data: c } = await sb.from("ad_campaigns")
      .select("id, created_via, stripe_payment_intent, status, business_id, title")
      .eq("id", id).maybeSingle();
    if (c?.created_via === "self_serve" && c.stripe_payment_intent && ["scheduled", "active"].includes(String(c.status))) {
      const stripe = getStripe();
      if (!stripe) return NextResponse.json({ ok: false, error: "stripe_not_configured_for_refund" }, { status: 503 });
      try {
        await stripe.refunds.create(
          { payment_intent: c.stripe_payment_intent as string },
          { idempotencyKey: `refund_campaign_${c.id}` },
        );
        refunded = true;
        patch.status = "ended"; // a rejected creative must not stay scheduled
        // Tell the owner (best-effort, post-response) — a silent reject +
        // refund reads as a bug.
        after(async () => {
          try {
            const { email, name } = await emailForBusinessOwner(sb, (c.business_id as string) || null);
            if (email) {
              await sendEmail({
                to: email,
                subject: "Your ad campaign couldn't run — you've been refunded",
                template: "ad-rejected-refund",
                html: `<p>Assalamualaikum${name ? ` ${String(name).split(/\s+/)[0]}` : ""},</p><p>Unfortunately your campaign "${String(c.title || "").replace(/[<>&"]/g, "")}" didn't pass our creative review, so we've refunded the full amount to your card (it typically lands within 5–10 business days).</p><p>You're welcome to rework the creative and book again — reply to this email if you'd like pointers on what to change.</p>`,
                businessId: (c.business_id as string) || undefined,
              });
            }
          } catch { /* email best-effort */ }
        });
      } catch (e) {
        console.error(`[admin/campaigns] reject-refund failed (campaign=${id}):`, e instanceof Error ? e.message : e);
        return NextResponse.json({ ok: false, error: "refund_failed" }, { status: 502 });
      }
    }
  }

  const { error } = await sb.from("ad_campaigns").update(patch).eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // In-app bell for the advertiser on an approve/reject decision (owners get a
  // reject-refund email, but nothing told them a campaign was APPROVED). dedupe
  // on the decision so re-saving the same status doesn't re-notify.
  if (patch.review_status === "approved" || patch.review_status === "rejected") {
    try {
      const { data: camp } = await sb.from("ad_campaigns").select("business_id, title").eq("id", id).maybeSingle();
      const bizId = (camp?.business_id as string) || "";
      if (bizId) {
        const { data: biz } = await sb.from("businesses").select("owner_id, claimed_by").eq("id", bizId).maybeSingle();
        const userId = (biz?.owner_id as string) || (biz?.claimed_by as string) || "";
        if (userId) {
          const approved = patch.review_status === "approved";
          const cTitle = (camp?.title as string) || "Your campaign";
          await notify({
            userId,
            type: approved ? "ad_approved" : "ad_rejected",
            title: approved ? "Your ad campaign is approved 🎉" : "Your ad campaign needs changes",
            body: approved
              ? `"${cTitle}" passed review and will run on schedule.`
              : `"${cTitle}" didn't pass creative review.${refunded ? " We've refunded your payment." : ""}`,
            link: "/owner?tab=ads",
            dedupeKey: `ad_decision:${id}:${patch.review_status}`,
          });
        }
      }
    } catch { /* notify best-effort */ }
  }

  return NextResponse.json({ ok: true, ...(refunded ? { refunded: true } : {}) });
}
