import { test, expect } from "@playwright/test";

/* Smoke: the critical user flows that must never break — search → business →
   real contact action, plus the key SEO surfaces render. */

test("home renders key sections", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Humble Halal/);
  await expect(page.getByText("Featured this week")).toBeVisible();
  await expect(page.getByText("New on Humble Halal")).toBeVisible();
});

test("business detail has real contact actions", async ({ page }) => {
  await page.goto("/business/warung-bumbu-rempah");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Warung Bumbu Rempah");
  await expect(page.getByRole("link", { name: /Call/i }).first()).toHaveAttribute("href", /^tel:/);
  await expect(page.getByRole("link", { name: /Directions/i }).first()).toHaveAttribute("href", /google\.com\/maps/);
});

test("explore lists results", async ({ page }) => {
  await page.goto("/explore");
  await expect(page.getByText(/\bplaces?\b/)).toBeVisible();
});

test("is-halal brand page renders an answer", async ({ page }) => {
  await page.goto("/is-halal/paris-baguette");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Paris Baguette/);
});

test("blog post renders", async ({ page }) => {
  await page.goto("/blog/what-is-halal-singapore");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/What Is Halal/i);
});
