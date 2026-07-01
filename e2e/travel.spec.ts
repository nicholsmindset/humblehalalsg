import { test, expect } from "@playwright/test";

/* Smoke: the OTA-grade travel surfaces (hotels + flights) and the Ask-AI layer.
   Assertions target stable STRUCTURE (headings, tabs, controls) rather than
   sandbox-dependent data, so they hold in simulated / no-AI-key environments. */

// Pre-accept consent + onboarding so overlays don't intercept clicks.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("hh_consent_v1", "essential");
      localStorage.setItem("hh_state_v1", JSON.stringify({ prefs: { onboarded: true, homeArea: "", certifiedOnly: false } }));
    } catch {
      /* ignore */
    }
  });
});

test("unified travel landing: Stays|Flights switcher + Stays search + shared promo", async ({ page }) => {
  await page.goto("/travel");
  const main = page.locator("#main-content");
  await expect(main.getByRole("heading", { level: 1 })).toContainText(/stays/i);
  // Top-level vertical switcher (distinct from the Search/Ask-AI sub-tabs)
  const top = main.getByRole("tablist", { name: /travel type/i });
  await expect(top.getByRole("tab", { name: "Stays" })).toBeVisible();
  await expect(top.getByRole("tab", { name: "Flights" })).toBeVisible();
  // Default Stays vertical: Search / Ask AI sub-tabs + the stays search segments
  const sub = main.getByRole("tablist", { name: /search mode/i });
  await expect(sub.getByRole("tab", { name: "Search" })).toBeVisible();
  await expect(sub.getByRole("tab", { name: /Ask AI/ })).toBeVisible();
  await expect(main.getByText("Where", { exact: true })).toBeVisible();
  await expect(main.getByText("Guests", { exact: true })).toBeVisible();
  // Shared promo sections (static — no LiteAPI/AI keys needed)
  await expect(main.getByRole("heading", { name: "Plan by purpose" })).toBeVisible();
  await expect(main.getByRole("heading", { name: /Popular halal-friendly destinations/ })).toBeVisible();
  await expect(main.getByRole("heading", { name: /Why book your halal travel/ })).toBeVisible();
});

test("unified travel landing: switching to Flights reveals flight search in /travel", async ({ page }) => {
  await page.goto("/travel");
  const main = page.locator("#main-content");
  await main.getByRole("tablist", { name: /travel type/i }).getByRole("tab", { name: "Flights" }).click();
  // Flights search controls now render in place (no navigation)
  await expect(main.getByRole("tab", { name: "Round trip" })).toBeVisible();
  await expect(main.getByText("Non-stop only")).toBeVisible();
  await expect(main.getByRole("button", { name: /Jeddah \(JED\)/ })).toBeVisible();
  // Switch back to Stays restores the stays search
  await main.getByRole("tablist", { name: /travel type/i }).getByRole("tab", { name: "Stays" }).click();
  await expect(main.getByText("Where", { exact: true })).toBeVisible();
});

test("hotels landing: Ask-AI tab reveals a natural-language search", async ({ page }) => {
  await page.goto("/travel");
  await page.getByRole("tab", { name: /Ask AI/ }).click();
  // A free-text query box + submit appears
  await expect(page.getByRole("button", { name: "Find stays" })).toBeVisible();
});

test("hotel detail: back link, gallery and sticky tabs render", async ({ page }) => {
  // Integration test: hotel detail is served from LiteAPI. Skipped when no
  // LiteAPI key is wired into CI (the page has no data to render).
  test.skip(!(process.env.LITEAPI_SAND_KEY || process.env.LITEAPI_PROD_KEY), "requires a LiteAPI backend");
  await page.goto("/travel/hotel/lpa8d3c?checkin=2026-09-15&checkout=2026-09-16&adults=2&rooms=1");
  await expect(page.getByText("See all properties")).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Sticky in-page tabs (anchor nav)
  await expect(page.getByRole("link", { name: "Overview", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Rooms", exact: true })).toBeVisible();
});

test("flights landing: hero, trip-type, non-stop, trending", async ({ page }) => {
  await page.goto("/travel/flights");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/airlines/i);
  const modes = page.getByRole("tablist", { name: /search mode/i });
  await expect(modes.getByRole("tab", { name: "Search" })).toBeVisible();
  await expect(modes.getByRole("tab", { name: /Ask AI/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Round trip" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "One way" })).toBeVisible();
  await expect(page.getByText("Non-stop only")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trending destinations" })).toBeVisible();
  // Umrah / Hajj presets
  await expect(page.getByRole("button", { name: /Jeddah \(JED\)/ })).toBeVisible();
});

test("flights landing: Ask-AI tab reveals a natural-language search", async ({ page }) => {
  await page.goto("/travel/flights");
  await page.getByRole("tab", { name: /Ask AI/ }).click();
  await expect(page.getByRole("button", { name: "Find flights" })).toBeVisible();
});

test("flights deep link: ?to=JED pre-fills the destination (from a landing promo card)", async ({ page }) => {
  await page.goto("/travel/flights?to=JED");
  const main = page.locator("#main-content");
  // The "To" field is auto-filled from the deep link and the search runs on mount.
  // (exact label match — a substring "To" also hits the "Non-stop only" checkbox.)
  await expect(main.getByLabel("To", { exact: true }).first()).toHaveValue(/Jeddah \(JED\)/i);
});

test("travel landing: long-form halal-travel SEO guide renders", async ({ page }) => {
  await page.goto("/travel");
  const main = page.locator("#main-content");
  await expect(main.getByRole("heading", { name: /Halal travel from Singapore/ })).toBeVisible();
});

test("umrah hub: commercial tiles + Umrah guide, no certification claims", async ({ page }) => {
  await page.goto("/travel/umrah");
  const main = page.locator("#main-content");
  await expect(main.getByRole("heading", { level: 1 })).toContainText(/umrah/i);
  await expect(main.getByRole("link", { name: /Browse Mecca hotels/ })).toBeVisible();
  await expect(main.getByRole("link", { name: /Search Jeddah flights/ })).toBeVisible();
  await expect(main.getByText("What is Umrah?")).toBeVisible();
  await expect(main).not.toContainText(/halal[- ]certified/i);
});

test("new destination hub: Muslim-friendly hotels in Seoul + fly-there CTA", async ({ page }) => {
  await page.goto("/travel/seoul");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Muslim-Friendly Hotels in Seoul/i);
  await expect(page.locator("#main-content").getByRole("link", { name: /Search flights/ })).toBeVisible();
});

test("home: collapsible halal-food SEO block renders", async ({ page }) => {
  await page.goto("/");
  const main = page.locator("#main-content");
  await expect(main.getByRole("heading", { name: /Halal food in Singapore — the full picture/ })).toBeVisible();
});

test("API: ai-search returns a grounded, structured response", async ({ request }) => {
  const res = await request.post("/api/travel/ai-search", {
    data: { query: "hotel near a mosque in Mecca, alcohol free" },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBeTruthy();
  expect(typeof body.answer).toBe("string");
  expect(body.params).toBeTruthy();
  expect(Array.isArray(body.hotels)).toBeTruthy();
  // Never asserts certification — grounded copy points back to confirming.
  expect(body.answer.toLowerCase()).not.toContain("halal-certified");
});

test("API: highlights returns at least one grounded card", async ({ request }) => {
  // Integration test: /api/travel/highlights is grounded in LiteAPI data. Skipped
  // when no LiteAPI key is wired into CI.
  test.skip(!(process.env.LITEAPI_SAND_KEY || process.env.LITEAPI_PROD_KEY), "requires a LiteAPI backend");
  const res = await request.post("/api/travel/highlights", { data: { hotelId: "lpa8d3c" } });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBeTruthy();
  expect(Array.isArray(body.highlights)).toBeTruthy();
  expect(body.highlights.length).toBeGreaterThan(0);
});
