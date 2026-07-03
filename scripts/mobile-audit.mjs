#!/usr/bin/env node
/* Mobile-first matrix audit sweep.
   Renders every key route × device viewport, runs the probes from
   e2e/probes.mjs (root-clipped overflow, tap targets, sub-12px text,
   input zoom, axe), and writes screenshots + findings JSON under
   reports/mobile-audit/<phase>/ (gitignored).

   Usage:
     node scripts/mobile-audit.mjs --phase=before
     node scripts/mobile-audit.mjs --phase=after --routes=/explore,/travel
     node scripts/mobile-audit.mjs --diff before after

   Not a CI gate — the lean gate is e2e/mobile.spec.ts. */

import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import {
  overflowProbe, tapTargetProbe, smallTextProbe, inputZoomProbe,
  SCROLLER_ALLOWLIST, PRIMARY_CTA_SELECTOR,
} from "../e2e/probes.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const positional = process.argv.slice(2).filter((a) => !a.startsWith("--"));

const BASE = args.base || process.env.AUDIT_BASE_URL || "http://localhost:3000";
const OUT_ROOT = path.resolve("reports/mobile-audit");

/* ---------------- devices ---------------- */
const DEVICES = {
  "floor-320":  { viewport: { width: 320, height: 693 }, deviceScaleFactor: 2 },
  "fold-344":   { viewport: { width: 344, height: 882 }, deviceScaleFactor: 2.625 },
  "s8-360":     { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 },
  "se-375":     { viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 },
  "iph-390":    { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 },
  "pixel7-412": { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625 },
  "iph-430":    { viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 },
  "ipad-768":   { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2 },
  // Landscape spot-checks — only routes tagged landscape:true
  "land-844":   { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, landscape: true },
  "land-932":   { viewport: { width: 932, height: 430 }, deviceScaleFactor: 3, landscape: true },
};
const AXE_DEVICES = new Set(["iph-390", "ipad-768"]);
const FULLPAGE_DEVICES = new Set(["iph-390", "floor-320"]);

/* ---------------- routes × states ----------------
   `action(page)` drives the page into the state (Node-side Playwright).
   Missing elements are tolerated: the state is recorded as "skipped". */
const futureCheckin = () => {
  const d = new Date(Date.now() + 60 * 86400e3);
  const e = new Date(Date.now() + 61 * 86400e3);
  const iso = (x) => x.toISOString().slice(0, 10);
  return `checkin=${iso(d)}&checkout=${iso(e)}&adults=2&rooms=1`;
};

const ROUTES = [
  { name: "home", path: "/", states: [
    { name: "default" },
    { name: "nav-drawer", action: async (page) => {
      await page.locator(".mobilebar-burger").click({ timeout: 5000 });
      await page.locator(".nav-drawer").waitFor({ timeout: 5000 });
    } },
    { name: "newsletter-popup", special: "newsletter" },
  ] },
  { name: "explore", path: "/explore", states: [
    { name: "default" },
    { name: "filter-open", action: async (page) => {
      await page.getByRole("button", { name: /Filters/ }).first().click({ timeout: 5000 });
      await page.locator(".filter-panel").waitFor({ timeout: 5000 });
    } },
  ] },
  { name: "map", path: "/map", settleMs: 2500, states: [{ name: "default" }] },
  { name: "business-detail", dynamic: "business", states: [{ name: "default" }] },
  { name: "travel", path: "/travel", landscape: true, states: [
    { name: "default" },
    { name: "date-open", action: async (page) => {
      await page.locator("#main-content").getByRole("button", { name: /Dates/ }).first().click({ timeout: 5000 });
      await page.locator(".ota-popover").waitFor({ timeout: 5000 });
    } },
    { name: "occ-open", action: async (page) => {
      await page.locator("#main-content").getByRole("button", { name: /Guests/ }).first().click({ timeout: 5000 });
      await page.locator(".ota-popover").waitFor({ timeout: 5000 });
    } },
    { name: "flights-tab", action: async (page) => {
      await page.getByRole("tablist", { name: /travel type/i }).getByRole("tab", { name: "Flights" }).click({ timeout: 5000 });
      await page.getByRole("tab", { name: "Round trip" }).waitFor({ timeout: 5000 });
    } },
  ] },
  { name: "travel-city-kl", path: "/travel/kuala-lumpur", settleMs: 2500, states: [{ name: "default" }] },
  { name: "travel-city-mecca", path: "/travel/mecca", settleMs: 2500, states: [{ name: "default" }] },
  { name: "hotel-detail", path: `/travel/hotel/lpa8d3c?${futureCheckin()}`, settleMs: 4000,
    skipIf: () => !(process.env.LITEAPI_SAND_KEY || process.env.LITEAPI_PROD_KEY || true), // server-side keys; page itself degrades
    states: [
      { name: "default" },
      { name: "rooms", action: async (page) => {
        const rooms = page.locator("#rooms");
        if (await rooms.count()) await rooms.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1200);
      } },
    ] },
  { name: "hotel-booking", dynamic: "hotel-offer", fallbackPath: "/travel/booking", landscape: true, states: [{ name: "default" }] },
  { name: "flights", path: "/travel/flights", landscape: true, states: [
    { name: "default" },
    { name: "date-open", action: async (page) => {
      await page.locator("#main-content").getByRole("button", { name: /Dates|Departure/ }).first().click({ timeout: 5000 });
      await page.locator(".ota-popover").waitFor({ timeout: 5000 });
    } },
    { name: "pax-open", action: async (page) => {
      await page.locator("#main-content").getByRole("button", { name: /traveller|passenger|adult/i }).first().click({ timeout: 5000 });
      await page.waitForTimeout(600);
    } },
  ] },
  { name: "flights-booking", path: "/travel/flights/booking", states: [{ name: "default" }] },
  { name: "events", path: "/events", states: [{ name: "default" }] },
  { name: "event-detail", dynamic: "event", states: [
    { name: "default" },
    { name: "to-checkout", action: async (page) => {
      await page.locator(".evt-stickybar button, .evt-stickybar a").first().click({ timeout: 5000 });
      await page.waitForTimeout(1500);
    } },
  ] },
  { name: "checkout", path: "/checkout", landscape: true, states: [{ name: "default" }] },
  { name: "host-event", path: "/host-event", states: [{ name: "default" }] },
  { name: "blog", path: "/blog", states: [{ name: "default" }] },
  { name: "blog-post", path: "/blog/what-is-halal-singapore", states: [{ name: "default" }] },
  { name: "tools", path: "/tools", states: [{ name: "default" }] },
  { name: "prayer-times", path: "/tools/prayer-times", states: [{ name: "default" }] },
  { name: "inheritance", path: "/tools/inheritance", states: [
    { name: "default" },
    { name: "with-result", action: async (page) => {
      await page.getByLabel("More Sons").click({ timeout: 5000 });
      await page.getByRole("checkbox", { name: /Mother alive/ }).check({ timeout: 5000 });
      await page.locator(".inh-table").waitFor({ timeout: 5000 });
    } },
  ] },
  { name: "quran-surah", path: "/tools/quran/2", settleMs: 2500, states: [{ name: "default" }] },
  { name: "login", path: "/login", states: [{ name: "default" }] },
  { name: "seo-halal", path: "/halal/halal-food-in-bedok", states: [{ name: "default" }] },
  { name: "is-halal-brand", path: "/is-halal/mcdonalds", states: [{ name: "default" }] },
  { name: "pricing", path: "/pricing", states: [{ name: "default" }] },
  { name: "contact", path: "/contact", states: [{ name: "default" }] },
  { name: "dashboard", path: "/dashboard", states: [{ name: "default" }] },
];

/* ---------------- helpers ---------------- */
const ALLOW_SELECTOR = SCROLLER_ALLOWLIST.join(",");

function seedScript() {
  return () => {
    try {
      localStorage.setItem("hh_consent_v1", "essential");
      localStorage.setItem("hh_state_v1", JSON.stringify({ prefs: { onboarded: true, homeArea: "", certifiedOnly: false } }));
      localStorage.setItem("hh_nl_popup", "dismissed");
    } catch { /* ignore */ }
  };
}

async function settle(page, extraMs = 0) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined)).catch(() => {});
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}" }).catch(() => {});
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))).catch(() => {});
  if (extraMs) await page.waitForTimeout(extraMs);
}

function sevForOverflow(f) {
  return f.overflowPx > 40 || /btn|cta|stickybar/.test(f.selector) ? "critical" : "high";
}
function sevForTap(f) {
  if (f.tier === "fail") return f.primaryCta ? "critical" : "high";
  if (f.tier === "warn") return f.primaryCta ? "high" : "medium";
  return "low";
}

async function probeState({ page, route, state, device, phase, outDir, findings, consoleErrors }) {
  const shotBase = `${route.name}__${state}__${device}`;
  await page.screenshot({ path: path.join(outDir, `${shotBase}.png`) }).catch(() => {});
  if (FULLPAGE_DEVICES.has(device)) {
    await page.screenshot({ path: path.join(outDir, `${shotBase}__full.png`), fullPage: true }).catch(() => {});
  }
  const shot = `${phase}/${shotBase}.png`;

  const over = await page.evaluate(overflowProbe, ALLOW_SELECTOR).catch(() => []);
  for (const f of over) {
    findings.push({ type: "overflow", severity: sevForOverflow(f), route: route.name, state, device, selector: f.selector, detail: f, screenshot: shot });
  }
  const taps = await page.evaluate(tapTargetProbe, PRIMARY_CTA_SELECTOR).catch(() => []);
  for (const f of taps.filter((t) => t.tier !== "note")) {
    findings.push({ type: "tap", severity: sevForTap(f), route: route.name, state, device, selector: f.selector, detail: f, screenshot: shot });
  }
  // text + input-zoom probes are viewport-independent per state — run on one device
  if (device === "iph-390") {
    for (const f of await page.evaluate(smallTextProbe).catch(() => [])) {
      findings.push({ type: "text", severity: "medium", route: route.name, state, device, selector: f.classChain, detail: f, screenshot: shot });
    }
    for (const f of await page.evaluate(inputZoomProbe).catch(() => [])) {
      findings.push({ type: "input-zoom", severity: "high", route: route.name, state, device, selector: f.selector, detail: f, screenshot: shot });
    }
  }
  if (AXE_DEVICES.has(device) && state === "default") {
    try {
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      for (const v of axe.violations) {
        findings.push({
          type: "axe",
          severity: v.impact === "critical" ? "high" : v.impact === "serious" ? "medium" : "low",
          route: route.name, state, device,
          selector: v.nodes[0]?.target?.join(" ") || v.id,
          detail: { id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length },
          screenshot: shot,
        });
      }
    } catch (e) {
      findings.push({ type: "error", severity: "low", route: route.name, state, device, selector: "axe", detail: { message: String(e).slice(0, 200) }, screenshot: shot });
    }
  }
  for (const msg of consoleErrors.splice(0)) {
    findings.push({ type: "console", severity: "medium", route: route.name, state, device, selector: "console", detail: { message: msg.slice(0, 300) }, screenshot: shot });
  }
}

async function runDevice({ browser, device, cfg, routes, phase, outDir, resolved }) {
  const findings = [];
  const context = await browser.newContext({
    ...cfg, isMobile: true, hasTouch: true,
    reducedMotion: "reduce", serviceWorkers: "block",
    baseURL: BASE,
  });
  await context.addInitScript(seedScript());
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

  for (const route of routes) {
    if (cfg.landscape && !route.landscape) continue;
    if (route.skipIf && route.skipIf()) continue;
    let routePath = route.path;
    if (route.dynamic) {
      routePath = resolved[route.dynamic] || route.fallbackPath;
      if (!routePath) { findings.push({ type: "blocked", severity: "low", route: route.name, state: "default", device, selector: "-", detail: { reason: `no ${route.dynamic} resolved` }, screenshot: null }); continue; }
    }
    for (const state of route.states) {
      if (state.special === "newsletter") {
        // needs its own context without the hh_nl_popup seed
        try {
          const ctx2 = await browser.newContext({ ...cfg, isMobile: true, hasTouch: true, reducedMotion: "reduce", baseURL: BASE });
          await ctx2.addInitScript(() => {
            try {
              localStorage.setItem("hh_consent_v1", "essential");
              localStorage.setItem("hh_state_v1", JSON.stringify({ prefs: { onboarded: true, homeArea: "", certifiedOnly: false } }));
            } catch { /* ignore */ }
          });
          const p2 = await ctx2.newPage();
          await p2.goto(routePath, { waitUntil: "domcontentloaded", timeout: 30000 });
          await settle(p2, route.settleMs || 1500);
          // scroll listener attaches after hydration — nudge repeatedly until the veil shows
          for (let i = 0; i < 6; i++) {
            await p2.evaluate((frac) => window.scrollTo(0, document.documentElement.scrollHeight * frac), 0.3 + (i % 2) * 0.3);
            if (await p2.locator(".modal-veil").isVisible().catch(() => false)) break;
            await p2.waitForTimeout(1000);
          }
          await p2.locator(".modal-veil").waitFor({ timeout: 4000 });
          await probeState({ page: p2, route, state: state.name, device, phase, outDir, findings, consoleErrors: [] });
          await ctx2.close();
        } catch {
          findings.push({ type: "blocked", severity: "low", route: route.name, state: state.name, device, selector: "-", detail: { reason: "newsletter popup did not appear" }, screenshot: null });
        }
        continue;
      }
      try {
        await page.goto(routePath, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.locator("#main-content, main, body").first().waitFor({ timeout: 15000 });
        await settle(page, route.settleMs || 800);
        if (state.action) await state.action(page);
        await settle(page, 200);
        await probeState({ page, route, state: state.name, device, phase, outDir, findings, consoleErrors });
      } catch (e) {
        findings.push({ type: "blocked", severity: "low", route: route.name, state: state.name, device, selector: "-", detail: { reason: String(e).slice(0, 200) }, screenshot: null });
      }
    }
  }
  await context.close();
  console.log(`  ✓ ${device} done (${findings.length} raw findings)`);
  return findings;
}

/* Resolve dynamic targets once (business slug, event slug, hotel offer). */
async function resolveDynamic(browser) {
  const resolved = {};
  const context = await browser.newContext({ ...DEVICES["iph-390"], isMobile: true, hasTouch: true, baseURL: BASE });
  await context.addInitScript(seedScript());
  const page = await context.newPage();
  try {
    await page.goto("/explore", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2500);
    const biz = await page.locator('a[href^="/business/"]').first().getAttribute("href", { timeout: 5000 }).catch(() => null);
    if (biz) resolved.business = biz;
  } catch { /* ignore */ }
  try {
    await page.goto("/events", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2500);
    const hrefs = await page.locator('a[href^="/events/"]').evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    const ev = hrefs.find((h) => h && !h.startsWith("/events/c/") && !h.startsWith("/events/in/") && h !== "/events");
    if (ev) resolved.event = ev;
  } catch { /* ignore */ }
  // Best-effort hotel offer funnel (60s budget): hotel detail → first Reserve link
  try {
    await page.goto(`/travel/hotel/lpa8d3c?${futureCheckin()}`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(6000);
    const reserve = await page.getByRole("link", { name: "Reserve" }).first().getAttribute("href", { timeout: 8000 }).catch(() => null);
    if (reserve) resolved["hotel-offer"] = reserve;
  } catch { /* ignore */ }
  await context.close();
  console.log("Resolved dynamic routes:", JSON.stringify(resolved));
  return resolved;
}

/* ---------------- diff mode ---------------- */
function diffMode(a, b) {
  const load = (phase) => JSON.parse(fs.readFileSync(path.join(OUT_ROOT, phase, "findings.json"), "utf8"));
  const key = (f) => [f.type, f.route, f.state, f.device, f.selector].join("|");
  const A = load(a), B = load(b);
  const aKeys = new Map(A.findings.map((f) => [key(f), f]));
  const bKeys = new Map(B.findings.map((f) => [key(f), f]));
  const fixed = [...aKeys.keys()].filter((k) => !bKeys.has(k));
  const persisting = [...aKeys.keys()].filter((k) => bKeys.has(k));
  const fresh = [...bKeys.keys()].filter((k) => !aKeys.has(k));
  const bySev = (keys, m) => keys.reduce((acc, k) => { const s = m.get(k).severity; acc[s] = (acc[s] || 0) + 1; return acc; }, {});
  const report = {
    fixed: { count: fixed.length, bySeverity: bySev(fixed, aKeys) },
    persisting: { count: persisting.length, bySeverity: bySev(persisting, aKeys), keys: persisting },
    new: { count: fresh.length, bySeverity: bySev(fresh, bKeys), keys: fresh },
  };
  fs.writeFileSync(path.join(OUT_ROOT, `diff-${a}-${b}.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ fixed: report.fixed, persisting: { count: report.persisting.count, bySeverity: report.persisting.bySeverity }, new: { count: report.new.count, bySeverity: report.new.bySeverity } }, null, 2));
  console.log(`Full diff → reports/mobile-audit/diff-${a}-${b}.json`);
}

/* ---------------- main ---------------- */
async function main() {
  if (args.diff) { diffMode(positional[0] || "before", positional[1] || "after"); return; }
  const phase = args.phase || "before";
  const outDir = path.join(OUT_ROOT, phase);
  fs.mkdirSync(outDir, { recursive: true });

  const routeFilter = args.routes ? String(args.routes).split(",") : null;
  const deviceFilter = args.devices ? String(args.devices).split(",") : null;
  const routes = routeFilter ? ROUTES.filter((r) => routeFilter.includes(r.path) || routeFilter.includes(r.name)) : ROUTES;
  const deviceEntries = Object.entries(DEVICES).filter(([n]) => !deviceFilter || deviceFilter.includes(n));

  console.log(`Mobile audit — phase=${phase} base=${BASE} routes=${routes.length} devices=${deviceEntries.length}`);
  const browser = await chromium.launch();
  const resolved = await resolveDynamic(browser);

  const findings = [];
  const POOL = 3;
  const queue = [...deviceEntries];
  const workers = Array.from({ length: POOL }, async () => {
    while (queue.length) {
      const [device, cfg] = queue.shift();
      const f = await runDevice({ browser, device, cfg, routes, phase, outDir, resolved });
      findings.push(...f);
    }
  });
  await Promise.all(workers);
  await browser.close();

  let commit = "unknown";
  try { commit = execSync("git rev-parse --short HEAD").toString().trim(); } catch { /* ignore */ }
  const summary = { bySeverity: {}, byType: {}, byRoute: {} };
  for (const f of findings) {
    summary.bySeverity[f.severity] = (summary.bySeverity[f.severity] || 0) + 1;
    summary.byType[f.type] = (summary.byType[f.type] || 0) + 1;
    summary.byRoute[f.route] = (summary.byRoute[f.route] || 0) + 1;
  }
  const doc = {
    meta: { phase, commit, baseURL: BASE, date: new Date().toISOString(), resolved },
    findings: findings.map((f) => ({ id: `${f.type}--${f.route}--${f.state}--${f.device}--${f.selector}`.slice(0, 160), rootCause: null, ...f })),
    summary,
  };
  fs.writeFileSync(path.join(outDir, "findings.json"), JSON.stringify(doc, null, 2));
  console.log(`\n${findings.length} findings → ${path.join("reports/mobile-audit", phase, "findings.json")}`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
