import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { certExpiryEmail } from "@/lib/emails/templates";

/* B1 — weekly MUIS cert re-check (the #1 moat job). Any business whose
   muis_expiry has passed while still tier muis/admin is flagged back to
   'pending' and logged. Graceful without keys. Never lets an expired cert show
   as certified.

   Also drives the Halal Certificate Vault lifecycle: approved halal_certs past
   their expires_on flip to 'expired', and owners of certs expiring within 30
   days (or just expired) get an email nudge. The halal score itself stays
   single-sourced — the business-level pass above (and lib/halal-score's
   expiringSoon/expired handling) owns the confidence downgrade; this pass only
   maintains the cert rows + alerts. */
export const dynamic = "force-dynamic";

const SOON_DAYS = 30;

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase/server");
    const { sendEmail } = await import("@/lib/email");
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: true, simulated: true });

    const today = new Date().toISOString().slice(0, 10);

    // ── 1) Business-level: expired MUIS/admin verification → back to pending ──
    const { data: expired } = await sb
      .from("businesses")
      .select("id, name, muis_expiry, halal_tier")
      .in("halal_tier", ["muis", "admin"])
      .lt("muis_expiry", today);

    let flagged = 0;
    for (const b of expired || []) {
      await sb.from("businesses").update({ halal_tier: "pending", halal_score: 34 }).eq("id", b.id);
      await sb.from("verification_log").insert({
        business_id: b.id,
        event: "cert_expired",
        detail: `MUIS expiry ${b.muis_expiry} passed → set to pending`,
      });
      flagged++;
    }

    // ── 2) Cert-vault lifecycle: flip approved certs past expiry → 'expired' ──
    const soon = new Date(Date.now() + SOON_DAYS * 864e5).toISOString().slice(0, 10);
    let certsExpired = 0;
    let emailed = 0;

    // Approved certs whose expiry is at/under the 30-day window (covers both
    // already-expired and expiring-soon in one read).
    const { data: certs } = await sb
      .from("halal_certs")
      .select("id, business_id, cert_no, expires_on, status")
      .eq("status", "approved")
      .not("expires_on", "is", null)
      .lte("expires_on", soon);

    for (const c of certs || []) {
      const isExpired = String(c.expires_on) < today;
      if (isExpired) {
        await sb.from("halal_certs").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", c.id);
        certsExpired++;
      }

      // Resolve the owner email via business → profile (claimed_by | owner_id),
      // matching the owner-alerts cron pattern.
      const { data: biz } = await sb
        .from("businesses")
        .select("name, owner_id, claimed_by")
        .eq("id", c.business_id)
        .maybeSingle();
      const ownerId = (biz?.claimed_by as string | null) || (biz?.owner_id as string | null);
      if (!ownerId) continue;
      const { data: prof } = await sb.from("profiles").select("email").eq("id", ownerId).maybeSingle();
      const to = (prof as { email?: string } | null)?.email;
      if (!to) continue;

      const bizName = (biz?.name as string) || "your business";
      const { subject, html } = certExpiryEmail({
        businessName: bizName,
        certNo: c.cert_no ? String(c.cert_no) : undefined,
        expiresOn: String(c.expires_on),
      });
      const r = await sendEmail({ to, subject, html, template: "cert-expiry", businessId: c.business_id });
      if (!r.simulated) emailed++;
    }

    await sb.from("cron_runs").insert({
      job: "recheck-certs",
      ok: true,
      notes: `${flagged} flagged · ${certsExpired} certs expired · ${emailed} owners emailed`,
    });
    return NextResponse.json({ ok: true, simulated: false, flagged, certsExpired, emailed });
  } catch {
    return NextResponse.json({ ok: true, simulated: true });
  }
}
