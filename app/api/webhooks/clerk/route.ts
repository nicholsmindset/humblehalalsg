import { Webhook } from "svix";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/* Clerk user webhook → keep the Supabase `profiles` table in sync.
   - PUBLIC route (excluded from auth.protect in proxy.ts): authenticated by the
     Svix signature, not a Clerk session.
   - `user.created` provisions the profile row (role defaults to 'user') BEFORE
     the user hits any RLS-scoped query.
   - Role is sourced from profiles.role (set via admin tooling), never overwritten
     here — `user.updated` only refreshes email/name.
   Configure in Clerk dashboard → Webhooks (subscribe user.created/updated/deleted)
   and set CLERK_WEBHOOK_SIGNING_SECRET. */

export const runtime = "nodejs";

type ClerkUserEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ id: string; email_address: string }>;
    primary_email_address_id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    /** Client-set at signup (LoginScreen role picker) — accountType "owner"
     *  provisions the business-owner role from the first session. `refCode`
     *  carries a Halal Passport referral code (the Svix webhook has no cookie). */
    unsafe_metadata?: { accountType?: string; refCode?: string } | null;
  };
};

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) return new Response("not_configured", { status: 503 });

  const payload = await req.text();
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("missing_svix_headers", { status: 400 });
  }

  let evt: ClerkUserEvent;
  try {
    evt = new Webhook(secret).verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch {
    return new Response("invalid_signature", { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return new Response("db_not_configured", { status: 503 });

  const d = evt.data;
  if (evt.type === "user.created" || evt.type === "user.updated") {
    const primary =
      d.email_addresses?.find((e) => e.id === d.primary_email_address_id) ?? d.email_addresses?.[0];
    const email = primary?.email_address ?? null;
    const name = [d.first_name, d.last_name].filter(Boolean).join(" ") || null;
    if (evt.type === "user.created") {
      // New user → provision profile. Role comes from the signup account-type
      // choice (unsafeMetadata.accountType: "owner" | "user"); anything else
      // defaults to 'user'. ignoreDuplicates so a replayed/redelivered
      // user.created can never overwrite an existing row (it would reset a
      // promoted admin's role back to 'user').
      const role = d.unsafe_metadata?.accountType === "owner" ? "owner" : "user";
      await admin.from("profiles").upsert({ id: d.id, email, name, role }, { onConflict: "id", ignoreDuplicates: true });

      // Halal Passport referral: credit the referrer (points award happens later,
      // on the new user's first review/stamp — anti-fraud). Best-effort.
      const refCode = d.unsafe_metadata?.refCode;
      if (refCode) {
        try {
          const { getServerFlags } = await import("@/lib/flags");
          if (getServerFlags().passport) {
            const { data: referrerId } = await admin.rpc("credit_referral", { p_referred_id: d.id, p_code: String(refCode) });
            if (referrerId) {
              const { notifyReferralJoined } = await import("@/lib/passport-server");
              await notifyReferralJoined(admin, String(referrerId));
            }
          }
        } catch { /* referral credit is best-effort — never fail the webhook */ }
      }
    } else {
      // Existing user → refresh contact fields only; never touch role.
      await admin.from("profiles").update({ email, name }).eq("id", d.id);
    }
  } else if (evt.type === "user.deleted") {
    if (d.id) await admin.from("profiles").delete().eq("id", d.id);
  }

  return new Response("ok", { status: 200 });
}
