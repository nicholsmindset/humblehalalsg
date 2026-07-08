#!/usr/bin/env node
// Console-error + broken-resource crawl across the site. Captures uncaught JS
// errors, console error/warning messages, and 4xx/5xx network responses (dead
// links, missing images, failing API calls) per route — coverage neither the
// Playwright gate nor Lighthouse currently reports site-wide. Not a CI gate.
//
//   npm run browser:crawl                       # core routes on prod
//   node scripts/ab-crawl.mjs --base=http://localhost:3000
//   node scripts/ab-crawl.mjs --group=events --device=mobile-390

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  launch, goto, consoleMessages, pageErrors, badRequests, clearConsole, clearErrors,
  close, parseArgs, stamp, REPO_ROOT,
} from "./ab/lib.mjs";

const args = parseArgs(process.argv);
const outDir = resolve(REPO_ROOT, "reports", "agent-browser");
mkdirSync(outDir, { recursive: true });

const SESSION = "ab-crawl";
launch(SESSION, { device: args.device });

const perRoute = [];
const seenReq = new Set(); // dedupe network requests across the session
let totalErrors = 0, totalBad = 0;
console.log(`\nCrawl · ${args.base} · ${args.device} · ${args.routes.length} routes\n`);

for (const path of args.routes) {
  const url = args.base.replace(/\/$/, "") + path;
  clearConsole(SESSION);
  clearErrors(SESSION);
  goto(SESSION, url);

  const errs = (pageErrors(SESSION) || []).map((e) => (typeof e === "string" ? e : e.message || JSON.stringify(e)));
  const cons = (consoleMessages(SESSION) || [])
    .filter((m) => (m.type || m.level) === "error" || (m.type || m.level) === "warning")
    .map((m) => ({ type: m.type || m.level, text: (m.text || "").slice(0, 200) }));
  const bad = (badRequests(SESSION) || [])
    .filter((r) => {
      const id = r.requestId || (r.url + r.status);
      if (seenReq.has(id)) return false;
      seenReq.add(id);
      return true;
    })
    .map((r) => ({ status: r.status, method: r.method, url: (r.url || "").slice(0, 160), type: r.resourceType }));

  totalErrors += errs.length;
  totalBad += bad.length;
  perRoute.push({ route: path, pageErrors: errs, consoleErrors: cons, badRequests: bad });

  const bits = [
    errs.length && `js-err:${errs.length}`,
    cons.length && `console:${cons.length}`,
    bad.length && `net-4/5xx:${bad.length}`,
  ].filter(Boolean).join(" ");
  console.log(`  ${bits ? "⚠" : "✓"} ${path.padEnd(26)} ${bits || "clean"}`);
}

close(SESSION);

const report = {
  meta: { base: args.base, device: args.device, date: stamp(), routes: args.routes.length },
  summary: { pageErrors: totalErrors, badRequests: totalBad },
  routes: perRoute.filter((r) => r.pageErrors.length || r.consoleErrors.length || r.badRequests.length),
};
const file = resolve(outDir, `crawl-${stamp()}.json`);
writeFileSync(file, JSON.stringify(report, null, 2));

console.log(`\nSummary: ${totalErrors} uncaught errors · ${totalBad} broken (4xx/5xx) requests`);
console.log(`Report: ${file}\n`);
process.exit(totalErrors > 0 ? 1 : 0);
