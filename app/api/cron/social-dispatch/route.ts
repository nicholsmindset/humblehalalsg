/* Dispatch human-approved rows from the social outbox to the provider webhook.
   Cron-authorized; no-ops without SOCIAL_WEBHOOK_URL. Never sends unapproved rows. */
import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { dispatchSocialOutbox } from "@/lib/social-outbox";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!authorizeCron(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const result = await dispatchSocialOutbox(10);
  return NextResponse.json({ ok: true, ...result });
}
