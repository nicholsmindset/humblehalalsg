import { test, expect } from "@playwright/test";

/* Smoke: the critical user flows that must never break — search → business →
   real contact action, plus the key SEO surfaces render. */

test("home renders key sections", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Humble Halal/);
  // Unique h2 section headings (avoid footer text collisions under strict mode).
  await expect(page.getByRole("heading", { name: "Discover halal places" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Why Humble Halal" })).toBeVisible();
});

test("business detail has real contact actions", async ({ page }) => {
  // Integration test: needs a seeded Supabase directory (a real business with a
  // phone + coordinates). Skipped when the backend isn't wired into CI.
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL, "requires a seeded Supabase directory");
  await page.goto("/business/warung-bumbu-rempah");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Warung Bumbu Rempah");
  await expect(page.getByRole("link", { name: /Call/i }).first()).toHaveAttribute("href", /^tel:/);
  await expect(page.getByRole("link", { name: /Directions/i }).first()).toHaveAttribute("href", /google\.com\/maps/);
});

test("explore lists results", async ({ page }) => {
  await page.goto("/explore");
  // The results count, e.g. "73 places" — digit-prefixed so it doesn't collide
  // with footer links like "Saved places" / "Suggest a place".
  await expect(page.getByText(/\d+\s+places?\b/).first()).toBeVisible();
});

test("is-halal brand page renders an answer", async ({ page }) => {
  await page.goto("/is-halal/paris-baguette");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Paris Baguette/);
});

test("blog post renders", async ({ page }) => {
  await page.goto("/blog/what-is-halal-singapore");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/What Is Halal/i);
});
