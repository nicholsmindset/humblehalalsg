#!/usr/bin/env node
/* JSON-LD regression gate (A2). Fetches a sample of live pages and asserts the
   structured-data types each must carry. Fails (exit 1) on any missing block so
   a broken render can't ship. Run: node scripts/check-schema.mjs [baseUrl] */

const base = (process.argv[2] || process.env.SITE_URL || "https://humblehalal.com").replace(/\/$/, "");

// path → required @type values (any nesting / @graph entry counts)
const CHECKS = [
  ["/", ["Organization", "WebSite"]],
  ["/explore", ["ItemList"]],
  ["/is-halal/paris-baguette", ["FAQPage"]],
  ["/blog/what-is-halal-singapore", ["BlogPosting"]],
];

function typesIn(node, acc = new Set()) {
  if (Array.isArray(node)) node.forEach((n) => typesIn(n, acc));
  else if (node && typeof node === "object") {
    const t = node["@type"];
    if (typeof t === "string") acc.add(t);
    else if (Array.isArray(t)) t.forEach((x) => acc.add(x));
    for (const k of Object.keys(node)) typesIn(node[k], acc);
  }
  return acc;
}

async function pageTypes(url) {
  const res = await fetch(url, { headers: { "user-agent": "hh-schema-check" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const types = new Set();
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try { typesIn(JSON.parse(m[1].trim()), types); } catch { /* skip malformed */ }
  }
  return types;
}

let failed = 0;
for (const [path, required] of CHECKS) {
  const url = base + path;
  try {
    const found = await pageTypes(url);
    const missing = required.filter((t) => !found.has(t));
    if (missing.length) { failed++; console.error(`FAIL ${path} — missing ${missing.join(", ")} (found: ${[...found].join(", ") || "none"})`); }
    else console.log(`OK   ${path} — ${required.join(", ")}`);
  } catch (e) {
    failed++; console.error(`FAIL ${path} — ${e.message}`);
  }
}
if (failed) { console.error(`\n${failed} page(s) failed schema check`); process.exit(1); }
console.log("\nAll schema checks passed");
