import { test, expect } from "@playwright/test";

/* Smoke: the publication's guides and tools remain usable, while retired
   directory and checkout routes return a real gone response. */

test("home renders key sections", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Humble Halal/);
  await expect(page.getByRole("heading", { name: "Your guide to halal Singapore." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What would you like to explore?" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore tools" })).toBeVisible();
  await expect(page.getByText("Configure your application")).toHaveCount(0);
});

test("retired features return 410", async ({ request }) => {
  for (const path of ["/explore", "/hawker", "/events", "/pricing", "/business/atrium-restaurant", "/api/checkout/plan"]) {
    expect((await request.get(path)).status(), path).toBe(410);
  }
});

test("is-halal brand page renders an answer", async ({ page }) => {
  await page.goto("/is-halal/paris-baguette");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Paris Baguette/);
});

test("blog post renders", async ({ page }) => {
  await page.goto("/blog/what-is-halal-singapore");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/What Is Halal/i);
});
