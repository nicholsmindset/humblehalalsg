#!/usr/bin/env node
/* Sync live Stripe prices into lib/stripe-prices.json so analytics can attach
 * real order values to begin_checkout (client) and audits can catch drift
 * between Stripe and lib/plans.ts display prices.
 *
 * Usage:  npm run sync:prices          (reads .env.local for keys/price ids)
 * Source: Stripe CLI (`stripe prices list`) when installed & authed,
 *         else REST with STRIPE_SECRET_KEY. Test vs live follows the key/CLI.
 *
 * Output (committed — amounts are public on /pricing anyway):
 *   lib/stripe-prices.json  { generated_at, mode, byLabel: {FEATURED_M: {amount, currency, …}}, prices: [...] }
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const OUT = path.join(ROOT, "lib", "stripe-prices.json");

// ── env: load .env.local (same convention as other scripts) ──────────────────
function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*(#.*)?$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

// The env-var labels the app uses → whatever price ids are configured.
const PRICE_ENV_LABELS = [
  "STRIPE_PRICE_FEATURED_M",
  "STRIPE_PRICE_FEATURED_Y",
  "STRIPE_PRICE_PREMIUM_M",
  "STRIPE_PRICE_PREMIUM_Y",
  "STRIPE_PRICE_VERIFIED_M",
  "STRIPE_PRICE_VERIFIED_Y",
  "STRIPE_PRICE_VERIFIED_FOUNDING_Y",
  "STRIPE_PRICE_LEADS_M",
  "STRIPE_PRICE_LEADS_FOUNDING_M",
];

// ── fetch prices: CLI first, REST fallback ────────────────────────────────────
function listViaCli() {
  try {
    const raw = execFileSync("stripe", ["prices", "list", "--limit", "100", "--expand", "data.product"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return JSON.parse(raw).data;
  } catch (e) {
    console.warn("· Stripe CLI unavailable/unauthed (" + (e.message || e).toString().split("\n")[0] + ") — trying REST");
    return null;
  }
}

async function listViaRest(key) {
  const prices = [];
  let url = "https://api.stripe.com/v1/prices?limit=100&expand[]=data.product";
  while (url) {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    if (!r.ok) throw new Error(`Stripe REST ${r.status}: ${await r.text()}`);
    const j = await r.json();
    prices.push(...j.data);
    url = j.has_more ? `https://api.stripe.com/v1/prices?limit=100&expand[]=data.product&starting_after=${j.data.at(-1).id}` : null;
  }
  return prices;
}

const simplify = (p) => ({
  id: p.id,
  active: p.active,
  currency: p.currency,
  unit_amount: p.unit_amount, // cents
  amount: p.unit_amount != null ? p.unit_amount / 100 : null,
  nickname: p.nickname || null,
  interval: p.recurring?.interval || "one_time",
  product: typeof p.product === "object" ? p.product?.name : p.product,
  livemode: p.livemode,
});

const main = async () => {
  let data = listViaCli();
  if (!data) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.error("✗ No Stripe CLI auth and no STRIPE_SECRET_KEY in .env.local — nothing synced.");
      process.exit(1);
    }
    data = await listViaRest(key);
  }

  const prices = data.map(simplify);
  const byId = Object.fromEntries(prices.map((p) => [p.id, p]));

  const byLabel = {};
  for (const label of PRICE_ENV_LABELS) {
    const id = process.env[label];
    if (!id) continue;
    const p = byId[id];
    byLabel[label.replace(/^STRIPE_PRICE_/, "")] = p
      ? { price_id: id, amount: p.amount, currency: p.currency, interval: p.interval, product: p.product }
      : { price_id: id, amount: null, currency: null, missing: true };
  }

  const out = {
    generated_at: new Date().toISOString(),
    mode: prices.some((p) => p.livemode) ? "live" : "test",
    byLabel,
    prices: prices.filter((p) => p.active),
  };
  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log(`✓ ${prices.length} prices (${out.mode} mode) → lib/stripe-prices.json`);
  console.log(`✓ resolved ${Object.keys(byLabel).length}/${PRICE_ENV_LABELS.length} env price labels`);

  // Drift check vs lib/plans.ts display prices (best-effort, non-fatal).
  try {
    const plansSrc = readFileSync(path.join(ROOT, "lib", "plans.ts"), "utf8");
    for (const [label, info] of Object.entries(byLabel)) {
      if (info.amount == null) continue;
      const m = label.match(/^(VERIFIED|FEATURED|PREMIUM)_(M|Y)$/);
      if (!m) continue;
      const planBlock = plansSrc.split(new RegExp(`key: \\"${m[1].toLowerCase()}\\"`))[1]?.slice(0, 400) || "";
      const field = m[2] === "M" ? "monthly" : "yearly";
      const disp = planBlock.match(new RegExp(`${field}:\\s*(\\d+)`));
      if (disp && Number(disp[1]) !== info.amount) {
        console.warn(`⚠ DRIFT ${label}: Stripe=${info.amount} vs lib/plans.ts ${field}=${disp[1]}`);
      }
    }
  } catch {
    /* drift check is advisory only */
  }
};

main().catch((e) => {
  console.error("✗ sync failed:", e.message || e);
  process.exit(1);
});
