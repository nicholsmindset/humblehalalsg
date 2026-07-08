#!/usr/bin/env node
// Fast mobile-readiness sweep on a live URL using agent-browser + the SHARED
// probes from e2e/probes.mjs (same thresholds as the Playwright CI gate, so the
// numbers line up). No local build needed — points at prod by default.
//
//   npm run browser:audit                       # core routes on prod, iPhone 14
//   node scripts/ab-audit.mjs --group=tools     # one surface group
//   node scripts/ab-audit.mjs --base=http://localhost:3000 --device=mobile-320
//   node scripts/ab-audit.mjs --routes=/,/mosques,/prayer-rooms
//
// Complements (does not replace) the deep local Playwright sweep in
// scripts/mobile-audit.mjs. Not a CI gate.

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  REPO_ROOT, launch, goto, evalProbe, screenshot, close, loadProbes, parseArgs, stamp,
} from "./ab/lib.mjs";

const args = parseArgs(process.argv);
const probes = await loadProbes();
const outDir = resolve(REPO_ROOT, "reports", "agent-browser");
mkdirSync(outDir, { recursive: true });

const SESSION = "ab-audit";
launch(SESSION, { device: args.device });

const findings = [];
const pages = [];
console.log(`\nMobile audit · ${args.base} · ${args.device} · ${args.routes.length} routes\n`);

for (const path of args.routes) {
  const url = args.base.replace(/\/$/, "") + path;
  let nav;
  try {
    nav = goto(SESSION, url);
  } catch (e) {
    findings.push({ route: path, type: "nav-error", severity: "high", detail: String(e).slice(0, 200) });
    console.log(`  ✗ ${path} — nav error`);
    continue;
  }

  const overflow = evalProbe(SESSION, probes.overflow, probes.ALLOW) || [];
  const taps = evalProbe(SESSION, probes.tap, probes.PRIMARY_CTA) || [];
  const smallText = evalProbe(SESSION, probes.smallText) || [];
  const zoom = evalProbe(SESSION, probes.inputZoom) || [];

  const ctaFails = taps.filter((t) => t.primaryCta && (t.w < 44 || t.h < 44));
  const tinyTaps = taps.filter((t) => t.tier === "fail");
  const warnTaps = taps.filter((t) => t.tier === "warn" && !t.primaryCta);

  const push = (type, severity, items) => { if (items.length) findings.push({ route: path, type, severity, count: items.length, items: items.slice(0, 10) }); };
  push("overflow", "critical", overflow);
  push("primary-cta-small", "critical", ctaFails);
  push("tap-target-tiny", "high", tinyTaps);        // <24px WCAG 2.5.8
  push("input-zoom", "high", zoom);                  // <16px iOS zoom
  push("tap-target-small", "medium", warnTaps);      // <44px
  push("small-text", "low", smallText);              // <12px

  pages.push({
    route: path, title: nav.title,
    overflow: overflow.length, ctaFails: ctaFails.length, tinyTaps: tinyTaps.length,
    warnTaps: warnTaps.length, inputZoom: zoom.length, smallText: smallText.length,
  });
  const flags = [
    overflow.length && `overflow:${overflow.length}`,
    ctaFails.length && `cta<44:${ctaFails.length}`,
    tinyTaps.length && `tap<24:${tinyTaps.length}`,
    zoom.length && `zoom:${zoom.length}`,
    warnTaps.length && `tap<44:${warnTaps.length}`,
    smallText.length && `text<12:${smallText.length}`,
  ].filter(Boolean).join(" ");
  console.log(`  ${overflow.length || ctaFails.length || tinyTaps.length || zoom.length ? "⚠" : "✓"} ${path.padEnd(26)} ${flags || "clean"}`);
}

// Screenshot the two worst routes by finding count for the report.
const worst = [...pages].sort((a, b) =>
  (b.overflow + b.ctaFails + b.tinyTaps + b.warnTaps) - (a.overflow + a.ctaFails + a.tinyTaps + a.warnTaps)
).slice(0, 2);
for (const p of worst) {
  goto(SESSION, args.base.replace(/\/$/, "") + p.route);
  const name = "audit-" + (p.route === "/" ? "home" : p.route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")) + "-" + args.device + ".png";
  screenshot(SESSION, resolve(outDir, name));
}

close(SESSION);

const summary = { critical: 0, high: 0, medium: 0, low: 0 };
for (const f of findings) summary[f.severity] = (summary[f.severity] || 0) + 1;

const report = {
  meta: { base: args.base, device: args.device, date: stamp(), routes: args.routes.length },
  summary, pages, findings,
};
const file = resolve(outDir, `audit-${stamp()}.json`);
writeFileSync(file, JSON.stringify(report, null, 2));

console.log(`\nSummary: ${summary.critical} critical · ${summary.high} high · ${summary.medium} medium · ${summary.low} low`);
console.log(`Report: ${file}\n`);
process.exit(summary.critical > 0 ? 1 : 0);
