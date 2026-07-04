import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags } from "@/lib/flags";
import { rateLimit } from "@/lib/ratelimit";
import { pageMeta } from "@/lib/seo";
import { VoucherView } from "@/components/passport/voucher-view";

/* Perk voucher page. The member shows a QR of /v/[code] at the counter; the
   business owner scans it with their phone camera, lands here signed in, and
   taps "Mark used" (the redemptions API re-checks ownership). A non-owner (the
   member) just sees the voucher to display. noindex utility page. */
export const metadata = pageMeta({ title: "Halal Passport voucher", path: "/v", index: false });
export const dynamic = "force-dynamic";

const CODE_RE = /^HH-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!getServerFlags().passport) notFound();
  const norm = decodeURIComponent(code).toUpperCase();
  if (!CODE_RE.test(norm)) notFound();

  // Parity rate-limit (codes are high-entropy + non-PII, so this is generous —
  // just caps enumeration/scraping). rateLimit only reads req.headers.get().
  const rl = await rateLimit({ headers: await headers() } as unknown as Request, "voucher", 100, 60);
  if (!rl.ok) notFound();

  const db = getSupabaseAdmin();
  if (!db) notFound();

  const { data: v } = await db
    .from("perk_redemptions")
    .select("voucher_code, title, cost, status, business_id, businesses(name)")
    .eq("voucher_code", norm)
    .maybeSingle();
  if (!v) notFound();

  // Is the viewer the business owner? (controls the Mark-used affordance)
  let canMark = false;
  const { userId } = await auth();
  if (userId) {
    const { data: owns } = await db
      .from("businesses").select("id").eq("id", v.business_id)
      .or(`owner_id.eq.${userId},claimed_by.eq.${userId}`).maybeSingle();
    canMark = !!owns;
  }
  const biz = (Array.isArray(v.businesses) ? v.businesses[0] : v.businesses) as { name?: string } | null;

  return (
    <VoucherView
      code={v.voucher_code}
      title={v.title}
      cost={v.cost}
      status={v.status}
      business={biz?.name || "A halal business"}
      canMark={canMark}
    />
  );
}
