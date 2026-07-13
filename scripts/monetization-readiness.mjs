#!/usr/bin/env node
/* Monetization go-live readiness — STATIC config check (no Stripe/DB network).
   Mirrors /api/admin/payments-readiness for CI/terminal use: inspects env vars,
   the Stripe key mode, lib/stripe-prices.json, and each paid flag, then prints a
   grouped pass/fail table. Exits non-zero if a stream whose flag is ON is missing
   required config ("you turned it on but it can't charge"). Run:
     node --env-file=.env.local scripts/monetization-readiness.mjs   (local)
     node scripts/monetization-readiness.mjs                          (CI/Vercel env) */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = process.env;
const has = (k) => !!(env[k] && String(env[k]).trim());
const truthy = (v) => v === "1" || v === "true" || v === "on";

const sk = env.STRIPE_SECRET_KEY || "";
const stripeMode = !sk
  ? "missing"
  : sk.startsWith("sk_live_") || sk.startsWith("rk_live_") ? "live"
  : sk.startsWith("sk_test_") || sk.startsWith("rk_test_") ? "test"
  : "wrong_key_type";

let pricesJsonMode = "unknown";
try { pricesJsonMode = JSON.parse(readFileSync(join(ROOT, "lib/stripe-prices.json"), "utf8")).mode || "unknown"; } catch { /* absent */ }

const PLAN_PRICES = ["STRIPE_PRICE_VERIFIED_M", "STRIPE_PRICE_VERIFIED_Y", "STRIPE_PRICE_FEATURED_M", "STRIPE_PRICE_FEATURED_Y", "STRIPE_PRICE_PREMIUM_M", "STRIPE_PRICE_PREMIUM_Y"];

// status: "pass" | "warn" | "fail"; blocker=true only fails the build when the stream is ON.
const groups = [];
const g = (name, on, rows) => groups.push({ name, on, rows });
const row = (status, label, detail, blocker = false) => ({ status, label, detail, blocker });

// ── Core (needed for any Stripe money path) ──────────────────────────────────
g("Core", true, [
  row(stripeMode === "live" ? "pass" : stripeMode === "test" ? "warn" : "fail", "STRIPE_SECRET_KEY", stripeMode, stripeMode === "missing" || stripeMode === "wrong_key_type"),
  row(has("STRIPE_WEBHOOK_SECRET") ? "pass" : "warn", "STRIPE_WEBHOOK_SECRET", has("STRIPE_WEBHOOK_SECRET") ? "set" : "missing → payments never fulfil"),
  row(has("SUPABASE_SERVICE_ROLE_KEY") ? "pass" : "fail", "SUPABASE_SERVICE_ROLE_KEY", has("SUPABASE_SERVICE_ROLE_KEY") ? "set" : "missing → ledgers + admin flag writes fail", true),
  row(pricesJsonMode === "live" ? "pass" : "warn", "lib/stripe-prices.json mode", pricesJsonMode + (pricesJsonMode !== "live" ? " → run `npm run sync:prices` after live swap" : "")),
]);

// ── Stage 1: Listing plans ───────────────────────────────────────────────────
const plansOn = truthy(env.PAID_PLANS_ENABLED);
g("Plans (PAID_PLANS_ENABLED=" + (plansOn ? "on" : "off") + ")", plansOn, [
  ...PLAN_PRICES.map((k) => row(has(k) ? "pass" : "fail", k, has(k) ? "set" : "MISSING", true)),
  row(has("STRIPE_PRICE_VERIFIED_FOUNDING_Y") ? "pass" : "warn", "STRIPE_PRICE_VERIFIED_FOUNDING_Y", has("STRIPE_PRICE_VERIFIED_FOUNDING_Y") ? "set" : "unset → founding rate 409s (optional)"),
]);

// ── Stage 2: Ads ─────────────────────────────────────────────────────────────
const adsOn = truthy(env.PAID_ADS_ENABLED);
g("Ads (PAID_ADS_ENABLED=" + (adsOn ? "on" : "off") + ")", adsOn, [
  row("pass", "Ad prices", "code-priced (lib/ad-products.ts) — no price IDs needed"),
]);

// ── Stage 3: Event tickets (Connect) ─────────────────────────────────────────
const ticketsOn = truthy(env.PAID_TICKETS_ENABLED);
g("Tickets (PAID_TICKETS_ENABLED=" + (ticketsOn ? "on" : "off") + ")", ticketsOn, [
  row("warn", "Stripe Connect", "activation + organiser onboarding — verify in the admin readiness panel (live probe)"),
  row(has("CRON_SECRET") ? "pass" : "fail", "CRON_SECRET", has("CRON_SECRET") ? "set" : "missing → payout cron unguarded/blocked", true),
  row(truthy(env.PAYNOW_ENABLED) ? "pass" : "warn", "PAYNOW_ENABLED", truthy(env.PAYNOW_ENABLED) ? "on (activate PayNow in Stripe)" : "off (optional)"),
]);

// ── Stage 4a: Travel ─────────────────────────────────────────────────────────
const travelOn = truthy(env.PAID_HOTELS_ENABLED) || truthy(env.PAID_FLIGHTS_ENABLED);
g("Travel (hotels/flights)", travelOn, [
  row(env.LITEAPI_ENV === "prod" ? "pass" : "warn", "LITEAPI_ENV", env.LITEAPI_ENV || "unset (sandbox)"),
  row(has("LITEAPI_PROD_KEY") ? "pass" : (travelOn ? "fail" : "warn"), "LITEAPI_PROD_KEY", has("LITEAPI_PROD_KEY") ? "set" : "missing", true),
  row(has("LITEAPI_WEBHOOK_SECRET") ? "pass" : (travelOn ? "fail" : "warn"), "LITEAPI_WEBHOOK_SECRET", has("LITEAPI_WEBHOOK_SECRET") ? "set" : "missing → fails closed in prod", true),
]);

// ── Stage 4b: Leads ──────────────────────────────────────────────────────────
const leadsOn = truthy(env.PAID_LEADS_ENABLED);
g("Leads (PAID_LEADS_ENABLED=" + (leadsOn ? "on" : "off") + ")", leadsOn, [
  row(has("STRIPE_PRICE_LEADS_M") ? "pass" : "fail", "STRIPE_PRICE_LEADS_M", has("STRIPE_PRICE_LEADS_M") ? "set" : "MISSING → lead checkout 409s", true),
  row(has("STRIPE_PRICE_LEADS_FOUNDING_M") ? "pass" : "warn", "STRIPE_PRICE_LEADS_FOUNDING_M", has("STRIPE_PRICE_LEADS_FOUNDING_M") ? "set" : "unset (optional founding rate)"),
  row(truthy(env.LEAD_ROUTING_ENABLED) ? "pass" : "warn", "LEAD_ROUTING_ENABLED", truthy(env.LEAD_ROUTING_ENABLED) ? "on" : "off → marketplace dormant"),
]);

// ── Supporting services (feature quality, not money blockers) ────────────────
g("Supporting", true, [
  row(has("AI_GATEWAY_API_KEY") ? "pass" : "warn", "AI_GATEWAY_API_KEY", has("AI_GATEWAY_API_KEY") ? "set" : "off → verdicts/enrichment/AI concierge degrade"),
  row(has("BEEHIIV_API_KEY") && has("BEEHIIV_PUBLICATION_ID") ? "pass" : "warn", "BEEHIIV_*", has("BEEHIIV_API_KEY") ? "set" : "off → newsletter no-op"),
  row(has("RESEND_API_KEY") && has("CONTACT_INBOX") ? "pass" : "warn", "RESEND_API_KEY / CONTACT_INBOX", has("RESEND_API_KEY") ? "set" : "off → ticket/alert emails no-op"),
  row(has("UPSTASH_REDIS_REST_URL") && has("UPSTASH_REDIS_REST_TOKEN") ? "pass" : "warn", "UPSTASH_*", has("UPSTASH_REDIS_REST_URL") ? "set" : "off → rate-limit fails open"),
  row(has("ONEMAP_TOKEN") ? "pass" : "warn", "ONEMAP_TOKEN", has("ONEMAP_TOKEN") ? "set" : "off → geocode degraded"),
]);

// ── Render ───────────────────────────────────────────────────────────────────
const icon = { pass: "✓", warn: "!", fail: "✗" };
let blockers = 0;
console.log(`\n=== Monetization readiness — Stripe key: ${stripeMode.toUpperCase()}, prices.json: ${pricesJsonMode} ===\n`);
for (const grp of groups) {
  console.log(`${grp.name}${grp.on ? "" : "  (stream off — informational)"}`);
  for (const r of grp.rows) {
    const isBlocker = r.blocker && grp.on && r.status === "fail";
    if (isBlocker) blockers++;
    console.log(`  [${icon[r.status]}] ${r.label.padEnd(34)} ${r.detail}${isBlocker ? "  ← BLOCKER" : ""}`);
  }
  console.log("");
}
if (stripeMode === "test") console.log("NOTE: Stripe is in TEST mode — no real charges. Swap to live keys + re-run `npm run sync:prices` before go-live.\n");
console.log(blockers === 0
  ? "RESULT: no blockers for the currently-enabled streams.\n"
  : `RESULT: ${blockers} blocker(s) on ENABLED streams — those checkouts will fail in production.\n`);
process.exit(blockers === 0 ? 0 : 1);
