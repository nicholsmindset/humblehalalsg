import { test, expect, type Page, type TestInfo } from "@playwright/test";
import {
  overflowProbe, tapTargetProbe, smallTextProbe, inputZoomProbe,
  SCROLLER_ALLOWLIST, PRIMARY_CTA_SELECTOR,
} from "./probes.mjs";

/* Mobile regression guard — runs on the mobile-320 / mobile-390 / tablet-768
   projects (see playwright.config.ts). Key-independent routes only, so it
   stays green in CI without Supabase/LiteAPI secrets.

   HARD-FAIL (breaks the build):
   - any element clipped by the page edge (html/body are overflow-x:clip, so
     over-wide content is silently CUT OFF — scrollWidth can never catch it)
   - a primary CTA under 44px on either axis
   - any interactive element under 24px (WCAG 2.5.8 floor)
   - text inputs under 16px (iOS zoom-on-focus)
   WARN (annotations on the test, no failure):
   - non-primary tap targets under 44px
   - text rendered under 12px */

const ALLOW = SCROLLER_ALLOWLIST.join(",");

// Pre-accept consent + onboarding + newsletter popup so overlays don't
// intercept the probes (same pattern as travel.spec.ts).
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      // Proper v1 consent object — a legacy string re-triggers the banner.
      localStorage.setItem("hh_consent_v1", JSON.stringify({ analytics: true, marketing: false, ts: Date.now(), v: 1 }));
      localStorage.setItem("hh_state_v1", JSON.stringify({ prefs: { onboarded: true, homeArea: "", certifiedOnly: false } }));
      localStorage.setItem("hh_nl_popup", "dismissed");
    } catch { /* ignore */ }
  });
});

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready.then(() => undefined)).catch(() => {});
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}" }).catch(() => {});
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))));
  await page.waitForTimeout(400);
}

async function runGuards(page: Page, testInfo: TestInfo) {
  const overflow = await page.evaluate(overflowProbe, ALLOW);
  const taps = await page.evaluate(tapTargetProbe, PRIMARY_CTA_SELECTOR);
  const zoomInputs = await page.evaluate(inputZoomProbe);
  const smallText = await page.evaluate(smallTextProbe);

  // Warn-only signals → annotations (visible in the report, don't gate).
  const warnTaps = taps.filter((t) => t.tier === "warn" && !t.primaryCta);
  if (warnTaps.length) {
    testInfo.annotations.push({ type: "warn-tap-targets", description: warnTaps.slice(0, 10).map((t) => `${t.w}x${t.h} ${t.selector} "${t.text}"`).join(" | ") });
  }
  if (smallText.length) {
    testInfo.annotations.push({ type: "warn-small-text", description: smallText.slice(0, 10).map((t) => `${t.px}px ×${t.count} ${t.classChain}`).join(" | ") });
  }

  // Hard gates.
  expect(overflow, `Content clipped by the page edge:\n${overflow.map((f) => `  ${f.selector} → ${f.overflowPx}px outside (viewport ${f.clientWidth}px) "${f.text}"`).join("\n")}`).toEqual([]);
  const ctaFails = taps.filter((t) => t.primaryCta && (t.w < 44 || t.h < 44));
  expect(ctaFails, `Primary CTA under 44px:\n${ctaFails.map((t) => `  ${t.w}x${t.h} ${t.selector} "${t.text}"`).join("\n")}`).toEqual([]);
  const tiny = taps.filter((t) => t.tier === "fail");
  expect(tiny, `Interactive element under 24px (WCAG 2.5.8):\n${tiny.map((t) => `  ${t.w}x${t.h} ${t.selector} "${t.text}"`).join("\n")}`).toEqual([]);
  expect(zoomInputs, `Inputs under 16px (iOS zooms on focus):\n${zoomInputs.map((i) => `  ${i.px}px ${i.selector} "${i.placeholder}"`).join("\n")}`).toEqual([]);
}

type RouteCheck = { name: string; path: string; ready?: string; action?: (page: Page) => Promise<void> };

const CHECKS: RouteCheck[] = [
  { name: "home", path: "/" },
  { name: "explore", path: "/explore" },
  {
    name: "explore filter sheet", path: "/explore",
    action: async (page) => {
      await page.getByRole("button", { name: /Filters/ }).first().click();
      await page.locator(".filter-panel").waitFor();
    },
  },
  { name: "travel stays", path: "/travel" },
  { name: "flights", path: "/travel/flights" },
  {
    name: "flights date picker", path: "/travel/flights",
    action: async (page) => {
      await page.locator("#main-content").getByRole("button", { name: /Dates|Departure/ }).first().click();
      await page.locator(".ota-popover").waitFor();
    },
  },
  { name: "events", path: "/events" },
  { name: "blog post", path: "/blog/what-is-halal-singapore" },
  { name: "tools hub", path: "/tools" },
  {
    name: "inheritance results table", path: "/tools/inheritance",
    action: async (page) => {
      await page.getByLabel("More Sons").click();
      await page.getByRole("checkbox", { name: /Mother alive/ }).check();
      await page.locator(".inh-table").waitFor();
    },
  },
  { name: "prayer times", path: "/tools/prayer-times" },
  { name: "login", path: "/login" },
  { name: "pricing", path: "/pricing" },
  { name: "is-halal brand", path: "/is-halal/paris-baguette" },
  { name: "hawker finder", path: "/hawker" },
  { name: "seo landing", path: "/halal-food-singapore" },
  { name: "passport (signed out)", path: "/passport" },
];

for (const check of CHECKS) {
  test(`mobile guard: ${check.name}`, async ({ page }, testInfo) => {
    await page.goto(check.path, { waitUntil: "domcontentloaded" });
    await page.locator("#main-content, main").first().waitFor();
    await settle(page);
    if (check.action) {
      await check.action(page);
      await settle(page);
    }
    await runGuards(page, testInfo);
  });
}

// Axe WCAG pass — once per route on the 390px project only (results are
// viewport-stable; running it 3× would just slow CI).
test("axe critical violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "axe runs on mobile-390 only");
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const critical: string[] = [];
  for (const path of ["/", "/explore", "/travel", "/travel/flights", "/tools", "/login"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await page.locator("#main-content, main").first().waitFor();
    await settle(page);
    const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    for (const v of res.violations) {
      if (v.impact === "critical") critical.push(`${path}: ${v.id} (${v.nodes.length} nodes) — ${v.help}`);
      else testInfo.annotations.push({ type: `axe-${v.impact}`, description: `${path}: ${v.id} (${v.nodes.length} nodes)` });
    }
  }
  expect(critical, `Critical axe violations:\n${critical.join("\n")}`).toEqual([]);
});
