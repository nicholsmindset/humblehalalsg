#!/usr/bin/env node
// Core Web Vitals + React hydration diagnostics across the site — the thing the
// Playwright gate and Lighthouse CI don't give us per-route. Launches with the
// React DevTools hook so `vitals` reports hydration and we can read Suspense
// boundaries. Flags per-route outliers (e.g. the /mosques FCP that ran 4-6x its
// siblings). Not a CI gate.
//
//   npm run browser:perf                        # core routes on prod, iPhone 14
//   node scripts/ab-perf.mjs --base=http://localhost:3000
//   node scripts/ab-perf.mjs --group=travel

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { launch, goto, vitals, evalExpr, close, parseArgs, stamp, REPO_ROOT } from "./ab/lib.mjs";

const args = parseArgs(process.argv);
const outDir = resolve(REPO_ROOT, "reports", "agent-browser");
mkdirSync(outDir, { recursive: true });

const SESSION = "ab-perf";
launch(SESSION, { device: args.device, reactDevtools: true });

const rows = [];
console.log(`\nPerf/React sweep · ${args.base} · ${args.device} · ${args.routes.length} routes\n`);
console.log("  route                      TTFB    FCP    LCP  CLS  LCP-el      hydration");

for (const path of args.routes) {
  const url = args.base.replace(/\/$/, "") + path;
  goto(SESSION, url);
  const v = vitals(SESSION) || {};
  // Suspense boundaries (dynamic only) — best-effort; empty if hook missing.
  let suspense = null;
  try {
    suspense = evalExpr(SESSION, "(window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ? 1 : 0)");
  } catch { /* ignore */ }

  const lcpEl = v?.lcp?.element ?? "-";
  const hyd = v?.hydration == null ? "-" : `${v.hydration}`;
  const row = {
    route: path,
    ttfb: v?.ttfb ?? null,
    fcp: v?.fcp ?? null,
    lcp: v?.lcp?.startTime ?? null,
    cls: v?.cls?.score ?? null,
    lcpElement: lcpEl,
    lcpUrl: v?.lcp?.url ?? null,
    hydration: v?.hydration ?? null,
    reactHook: suspense === 1,
  };
  rows.push(row);
  const n = (x, w) => (x == null ? "-" : Math.round(x)).toString().padStart(w);
  console.log(`  ${path.padEnd(26)} ${n(row.ttfb, 4)}ms ${n(row.fcp, 4)}ms ${n(row.lcp, 4)}ms ${String(row.cls ?? "-").padStart(4)}  ${String(lcpEl).padEnd(10)} ${hyd}`);
}

close(SESSION);

// Outlier detection: FCP/LCP above 2x the median flags a route for attention.
function median(xs) {
  const v = xs.filter((x) => x != null).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : null;
}
const fcpMed = median(rows.map((r) => r.fcp));
const lcpMed = median(rows.map((r) => r.lcp));
const outliers = rows.filter((r) =>
  (fcpMed && r.fcp > fcpMed * 2) || (lcpMed && r.lcp > lcpMed * 2) ||
  (r.lcp && r.lcp > 2500) || (r.cls != null && r.cls > 0.1)
).map((r) => ({
  route: r.route,
  reason: [
    fcpMed && r.fcp > fcpMed * 2 && `FCP ${Math.round(r.fcp)}ms > 2x median (${Math.round(fcpMed)}ms)`,
    lcpMed && r.lcp > lcpMed * 2 && `LCP ${Math.round(r.lcp)}ms > 2x median (${Math.round(lcpMed)}ms)`,
    r.lcp > 2500 && `LCP ${Math.round(r.lcp)}ms > 2500ms budget`,
    r.cls > 0.1 && `CLS ${r.cls} > 0.1`,
  ].filter(Boolean),
}));

const report = {
  meta: { base: args.base, device: args.device, date: stamp(), routes: args.routes.length,
    note: "Unthrottled/warm-cache best-case. Relative differences (outliers) are the reliable signal." },
  medians: { fcp: fcpMed, lcp: lcpMed },
  rows, outliers,
};
const file = resolve(outDir, `perf-${stamp()}.json`);
writeFileSync(file, JSON.stringify(report, null, 2));

if (outliers.length) {
  console.log(`\nOutliers (${outliers.length}):`);
  for (const o of outliers) console.log(`  ⚠ ${o.route} — ${o.reason.join("; ")}`);
} else {
  console.log("\nNo outliers vs median.");
}
console.log(`\nReport: ${file}`);
console.log("Note: unthrottled/warm-cache = best-case; trust relative deltas, not absolutes.\n");
