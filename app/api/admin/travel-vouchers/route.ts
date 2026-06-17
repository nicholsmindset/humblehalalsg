import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createVoucher, liteapiConfigured, LiteApiError } from "@/lib/liteapi";

/* Create a discount voucher/promo for marketing campaigns (LiteAPI da.liteapi.travel).
   Admin-gated. Travellers redeem the code at hotel prebook (/api/travel/prebook) or
   flight services. Graceful without a key. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ ok: false, error: gate.error }, { status: gate.status });
  if (!liteapiConfigured()) return NextResponse.json({ ok: false, reason: "liteapi_not_configured" });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const code = String(body.code || "").trim().toUpperCase().slice(0, 32);
  const discountType = String(body.discountType || "").toLowerCase();
  const discountValue = Number(body.discountValue);
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return NextResponse.json({ ok: false, error: "Enter a valid code (A–Z, 0–9, 3–32 chars)." }, { status: 422 });
  if (!["percentage", "fixed"].includes(discountType)) return NextResponse.json({ ok: false, error: "Pick a discount type." }, { status: 422 });
  if (!Number.isFinite(discountValue) || discountValue <= 0 || (discountType === "percentage" && discountValue > 100)) {
    return NextResponse.json({ ok: false, error: "Enter a valid discount value." }, { status: 422 });
  }

  // snake_case payload per the da.liteapi.travel voucher API.
  const payload: Record<string, unknown> = {
    voucher_code: code,
    discount_type: discountType,
    discount_value: discountValue,
    currency: String(body.currency || "USD").toUpperCase().slice(0, 3),
    status: "active",
  };
  const vStart = String(body.validityStart || "");
  const vEnd = String(body.validityEnd || "");
  if (DATE_RE.test(vStart)) payload.validity_start = vStart;
  if (DATE_RE.test(vEnd)) payload.validity_end = vEnd;
  const usagesLimit = Number(body.usagesLimit);
  if (Number.isFinite(usagesLimit) && usagesLimit > 0) payload.usages_limit = Math.round(usagesLimit);
  const minSpend = Number(body.minimumSpend);
  if (Number.isFinite(minSpend) && minSpend > 0) payload.minimum_spend = minSpend;

  try {
    const v = await createVoucher(payload);
    if (!v) return NextResponse.json({ ok: false, error: "Voucher creation failed." }, { status: 502 });
    return NextResponse.json({ ok: true, code });
  } catch (err) {
    // A 404/401/403 here usually means the da.liteapi.travel host is wrong or the
    // voucher API isn't enabled on the account — surface the status to diagnose.
    const status = err instanceof LiteApiError ? err.status : 0;
    const hint = status === 404 ? " (endpoint not found — check the da.liteapi.travel host)" : status === 401 || status === 403 ? " (not authorised — is the voucher API enabled on your LiteAPI account?)" : "";
    return NextResponse.json({ ok: false, error: `Voucher creation failed${hint}`, status }, { status: 502 });
  }
}
