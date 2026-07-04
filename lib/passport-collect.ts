import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/* Anti-forgery for collect-stamp QR codes. The stamp URL carries a token that
   only the business's printed poster has — an HMAC of the business id under a
   server secret — so a user can't script /c/<slug> for every business to farm
   "visits" they never made. The secret stays server-side (poster page generates
   the token; /c validates it). Stable secret ⇒ printed posters keep working. */

function secret(): string {
  return process.env.PASSPORT_COLLECT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

/** Short deterministic token for a business's collect QR. */
export function collectToken(businessId: string): string {
  return createHmac("sha256", secret()).update(`collect:${businessId}`).digest("hex").slice(0, 12);
}

/** Constant-time check of a presented token against the expected one. */
export function verifyCollectToken(businessId: string, token: string | null | undefined): boolean {
  if (!secret() || !token) return false;
  const expected = collectToken(businessId);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
