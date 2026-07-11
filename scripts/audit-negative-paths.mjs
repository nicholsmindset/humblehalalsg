#!/usr/bin/env node
/* Re-runnable negative-path regression for the monetization audit.
 *
 * Probes PUBLIC / anon behaviour against a deployment and asserts the security +
 * gating properties the audit fixed — so a regression trips here instead of in
 * production. It cannot test admin-authenticated flows (no Clerk session); those
 * are in docs/audit-guided-admin-pass.md for a human to run.
 *
 * Usage:  node scripts/audit-negative-paths.mjs [baseUrl]
 *   baseUrl defaults to https://www.humblehalal.com
 *   exit 0 = all pass, 1 = one or more failed.
 */

const BASE = (process.argv[2] || "https://www.humblehalal.com").replace(/\/$/, "");
let pass = 0;
let fail = 0;
const results = [];

function ok(name, cond, detail = "") {
  results.push(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  cond ? pass++ : fail++;
}

async function status(path, init) {
  try {
    const r = await fetch(`${BASE}${path}`, { redirect: "manual", ...init });
    return { code: r.status, text: await r.text().catch(() => "") };
  } catch (e) {
    return { code: 0, text: String(e) };
  }
}

async function main() {
  console.log(`Negative-path audit against ${BASE}\n`);

  // 1. JSON-LD XSS escaping (audit halalVerdicts-03 / #204). A real business page
  //    must serialize JSON-LD with escaped angle brackets — no raw </script> or
  //    unescaped "<" inside the application/ld+json block.
  {
    const { code, text } = await status("/business/atrium-restaurant");
    const m = text.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    const ld = m ? m[1] : "";
    ok("business page reachable", code === 200, `status ${code}`);
    ok("JSON-LD present", !!ld);
    if (ld) {
      ok("JSON-LD has no raw '<' (escaped to \\u003c)", !ld.includes("<"), "found a literal < inside ld+json");
      ok("JSON-LD parses as valid JSON", (() => { try { JSON.parse(ld); return true; } catch { return false; } })());
    }
  }

  // 2. Protected routes reject anonymous callers (must be 4xx, never 2xx/5xx).
  for (const [name, path, init] of [
    ["admin tiktok queue (GET)", "/api/admin/tiktok?status=pending", undefined],
    ["admin verdicts (POST)", "/api/admin/verdicts", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }],
    ["admin settings (POST)", "/api/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tiktok_ugc_enabled: true }) }],
    ["admin settings (GET)", "/api/settings", undefined],
    ["owner leads (GET)", "/api/owner/leads", undefined],
    ["owner cert (GET)", "/api/owner/cert", undefined],
  ]) {
    const { code } = await status(path, init);
    ok(`${name} rejects anon`, code >= 400 && code < 500, `status ${code} (want 4xx)`);
  }

  // 3. Cron route fails closed without the bearer secret (audit R8 / fail-closed).
  {
    const { code } = await status("/api/cron/flight-retry");
    ok("cron flight-retry rejects no-secret", code === 401, `status ${code} (want 401)`);
  }

  // 4. Malformed public intake → 4xx, never 500 (negative-path L4).
  {
    const { code } = await status("/api/tiktok", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: "not-a-tiktok-link" }) });
    ok("tiktok intake rejects bad URL", code >= 400 && code < 500, `status ${code} (want 4xx)`);
  }

  // 5. Public flag-gated read has the safe shape (never leaks, never 500).
  {
    const { code, text } = await status("/api/tiktok/videos?business=atrium-restaurant");
    let shape = false;
    try { const j = JSON.parse(text); shape = j && typeof j.ok === "boolean" && Array.isArray(j.videos); } catch { /* noop */ }
    ok("tiktok/videos returns {ok, videos[]}", code === 200 && shape, `status ${code}`);
  }

  // 6. Money routes are dark: paid checkout must not 200 for an anon/garbage call.
  for (const [name, path] of [
    ["checkout/plan", "/api/checkout/plan"],
    ["checkout/leads", "/api/checkout/leads"],
  ]) {
    const { code } = await status(path, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    ok(`${name} not open to anon`, code >= 400 && code < 500, `status ${code} (want 4xx)`);
  }

  console.log(results.join("\n"));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main();
