#!/usr/bin/env node
/* Probe that migration 0068 (businesses column privileges) is in effect.
 *
 *   BEFORE 0068:  anon select of stripe_customer_id/phone/owner_id → 200 (the gap)
 *   AFTER  0068:  → 42501 permission denied (fixed); safe columns still 200.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=… NEXT_PUBLIC_SUPABASE_ANON_KEY=… node scripts/probe-column-privileges.mjs
 * Exits non-zero if the revoked columns are still readable by anon (regression).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(2);
}

const REST = `${url.replace(/\/$/, "")}/rest/v1/businesses`;
const headers = { apikey: anon, Authorization: `Bearer ${anon}` };

async function get(select) {
  const res = await fetch(`${REST}?select=${encodeURIComponent(select)}&limit=1`, { headers });
  const body = await res.text();
  let code = null;
  try { code = JSON.parse(body).code ?? null; } catch { /* not json */ }
  return { status: res.status, code };
}

const REVOKED = "stripe_customer_id,phone,contact_email,owner_id,claimed_by";
const SAFE = "id,slug,name,area";

const revoked = await get(REVOKED);
const star = await get("*");
const safe = await get(SAFE);

console.log(`revoked cols (${REVOKED}) → ${revoked.status} ${revoked.code ?? ""}`);
console.log(`select=*                  → ${star.status} ${star.code ?? ""}`);
console.log(`safe cols (${SAFE})       → ${safe.status} ${safe.code ?? ""}`);

const denied = (r) => r.status === 403 || r.code === "42501";
const ok = denied(revoked) && denied(star) && safe.status === 200;
console.log(ok
  ? "\n✅ 0068 in effect: sensitive columns denied to anon, safe columns readable."
  : "\n❌ Regression: anon can still read sensitive columns (or safe read broke). Re-apply 0068.");
process.exit(ok ? 0 : 1);
