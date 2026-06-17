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

test("hotels landing: hero, tabbed search widget, carousels", async ({ page }) => {
  await page.goto("/travel");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/stays/i);
  // Tabbed Search / Ask AI widget
  const tabs = page.getByRole("tablist", { name: /search mode/i });
  await expect(tabs.getByRole("tab", { name: "Search" })).toBeVisible();
  await expect(tabs.getByRole("tab", { name: /Ask AI/ })).toBeVisible();
  // Search segments
  await expect(page.getByText("Where", { exact: true })).toBeVisible();
  await expect(page.getByText("Guests", { exact: true })).toBeVisible();
  // Carousels
  await expect(page.getByRole("heading", { name: "Recommended stays" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Nearby stays" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Browse destinations" })).toBeVisible();
});

test("hotels landing: Ask-AI tab reveals a natural-language search", async ({ page }) => {
  await page.goto("/travel");
  await page.getByRole("tab", { name: /Ask AI/ }).click();
  // A free-text query box + submit appears
  await expect(page.getByRole("button", { name: "Find stays" })).toBeVisible();
});

test("hotel detail: back link, gallery and sticky tabs render", async ({ page }) => {
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
  const res = await request.post("/api/travel/highlights", { data: { hotelId: "lpa8d3c" } });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.ok).toBeTruthy();
  expect(Array.isArray(body.highlights)).toBeTruthy();
  expect(body.highlights.length).toBeGreaterThan(0);
});

test.describe("transfers", () => {
  test("landing: search form renders and returns simulated quotes", async ({ page }) => {
    await page.goto("/travel/transfers");
    // Scope to the main region — the chrome mirrors page content elsewhere in the
    // DOM (the flights landing does the same), so a bare testid is ambiguous.
    const main = page.locator("#main-content");
    await expect(main.getByRole("heading", { level: 1 })).toContainText(/transfer/i);
    await expect(main.getByTestId("transfer-search-form")).toBeVisible();
    await main.getByTestId("transfer-pickup").fill("Changi Airport (SIN)");
    await main.getByTestId("transfer-dropoff").fill("Marina Bay Sands");
    await main.getByTestId("transfer-datetime").fill("2026-09-01T10:00");
    await main.getByTestId("transfer-search-submit").click();
    await expect(main.getByTestId("transfer-quote").first()).toBeVisible();
    // Never asserts halal certification (golden rule).
    await expect(page.locator("body")).not.toContainText(/halal certified/i);
  });

  test("API: search returns simulated quotes without a key", async ({ request }) => {
    const res = await request.post("/api/travel/transfers/search", {
      data: { pickup: "SIN", dropoff: "Marina Bay Sands", pickupDateTime: "2026-09-01T10:00", passengers: 2 },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.quotes) && body.quotes.length > 0).toBe(true);
  });

  test("API: book is gated off by default (403)", async ({ request }) => {
    const res = await request.post("/api/travel/transfers/book", {
      data: { searchId: "x", resultId: "y", contact: { firstName: "A", lastName: "B", email: "a@b.co", phone: "+10000000000" }, passengers: 2, currency: "USD" },
    });
    expect(res.status()).toBe(403);
  });
});
