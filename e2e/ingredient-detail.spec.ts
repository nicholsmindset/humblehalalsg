import { test, expect } from "@playwright/test";

/* Ingredient detail pages: the SEO-critical invariants — a real page for an
   indexable slug, a single H1, a self canonical, FAQ/breadcrumb JSON-LD in the
   server HTML, alt-slug 301s, thin-slug 404s, and the checker link-through. */

const CANONICAL = "/tools/ingredient-checker/e104-quinoline-yellow";

test("E104 detail page renders with exactly one H1 and the verdict", async ({ page }) => {
  await page.goto(CANONICAL);
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toHaveCount(1);
  await expect(h1).toContainText(/Is E104 \(Quinoline Yellow\) Halal\?/);
  await expect(page.getByText(/Generally halal/i).first()).toBeVisible();
});

test("E104 page has a self-referencing canonical + indexable robots", async ({ page }) => {
  await page.goto(CANONICAL);
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute("href", new RegExp(`${CANONICAL}$`));
  // Indexable page must NOT be noindex.
  await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
});

test("E104 page emits BreadcrumbList + FAQPage JSON-LD in server HTML", async ({ request }) => {
  const res = await request.get(CANONICAL);
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain('"@type":"BreadcrumbList"');
  expect(html).toContain('"@type":"FAQPage"');
  // Core content is server-rendered (not JS-dependent).
  expect(html).toContain("Quinoline Yellow");
  expect(html).toContain("How to verify a product in Singapore");
});

test("invalid ingredient slug returns 404", async ({ request }) => {
  const res = await request.get("/tools/ingredient-checker/not-a-real-ingredient");
  expect(res.status()).toBe(404);
});

test("thin ingredient (E508) has no detail page → 404", async ({ request }) => {
  const res = await request.get("/tools/ingredient-checker/e508-potassium-chloride");
  expect(res.status()).toBe(404);
});

test("bare E-number alt slug 301s to the canonical page", async ({ request }) => {
  const res = await request.get("/tools/ingredient-checker/e104", { maxRedirects: 0 });
  expect([301, 308]).toContain(res.status());
  expect(res.headers()["location"]).toContain(CANONICAL);
});

test("checker lists an indexable ingredient link, and search still works", async ({ page }) => {
  await page.goto("/tools/ingredient-checker");
  // The crawlable detail link is present in the server HTML for indexable rows.
  await expect(page.getByRole("link", { name: /Read the full E104 guide/i })).toBeVisible();
  // Existing search still filters.
  await page.getByRole("searchbox").fill("gelatine");
  await expect(page.getByText(/E441/).first()).toBeVisible();
});

test("food-colourings category hub renders and links to detail pages", async ({ page }) => {
  await page.goto("/tools/ingredient-checker/categories/food-colourings");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Food colourings/i);
  await expect(page.getByRole("link", { name: /Quinoline Yellow/i }).first()).toBeVisible();
});
