import { NextResponse } from "next/server";
import { getVoucher, liteapiConfigured } from "@/lib/liteapi";

/* Validate a promo / voucher code. Graceful: when vouchers aren't enabled on the
   LiteAPI account (or no key), returns enabled:false so the UI shows a friendly
   "not active yet" rather than an error. */
export async function GET(req: Request) {
  const code = (new URL(req.url).searchParams.get("code") || "").trim().toUpperCase().slice(0, 32);
  if (!code) return NextResponse.json({ ok: false, error: "Enter a code" }, { status: 422 });
  if (!liteapiConfigured()) return NextResponse.json({ ok: true, enabled: false });
  try {
    const v = await getVoucher(code);
    if (!v) return NextResponse.json({ ok: true, valid: false, enabled: false, message: "Promo codes aren't active yet." });
    if (!v.active) return NextResponse.json({ ok: true, valid: false, enabled: true, message: "This code is no longer active." });
    return NextResponse.json({ ok: true, valid: true, enabled: true, code: v.code, discountType: v.discountType, discountValue: v.discountValue, currency: v.currency });
  } catch {
    return NextResponse.json({ ok: true, valid: false, enabled: false, message: "Promo codes aren't active yet." });
  }
}
