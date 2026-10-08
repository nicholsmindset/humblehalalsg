import { expect, test } from "@playwright/test";

test("readers can search all guides and recover from no results", async ({ page }) => {
  await page.goto("/blog");
  const search = page.getByRole("searchbox", { name: "What would you like to explore?" });
  await search.fill("Vietnamese");
  await expect(page.locator(".guide-results .blog-card")).toHaveCount(1);
  await expect(page.locator(".guide-results")).toContainText("Halal Vietnamese Food");
  await search.fill("zzzz-no-guide");
  await expect(page.getByRole("heading", { name: "No guides found" })).toBeVisible();
  await page.getByRole("button", { name: "Show all guides" }).click();
  await expect(search).toHaveValue("");
  await expect(page.getByRole("heading", { name: "Latest guides", exact: true })).toBeVisible();
});

test("article contents links reach a labelled section below the header", async ({ page }) => {
  await page.goto("/blog/halal-vietnamese-food-singapore");
  await page.locator(".article-contents summary").click();
  const contents = page.getByRole("navigation", { name: "In this guide" });
  await contents.getByRole("link", { name: "How to read a Vietnamese menu with confidence" }).click();
  await expect(page).toHaveURL(/#section-7$/);
  const heading = page.locator("#section-7");
  await expect(heading).toBeInViewport();
  expect((await heading.boundingBox())!.y).toBeGreaterThanOrEqual(64);
});
