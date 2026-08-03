import { test, expect } from "@playwright/test";

/* Launch guard: the costly hotel/flight vertical stays unavailable until the
   operator deliberately restores it. These requests must stop at Proxy before
   any provider, payment, weather, or AI integration can run. */

for (const path of [
  "/travel",
  "/travel/flights",
  "/travel/hotel/lpa8d3c",
  "/travel/umrah",
  "/api/travel/search",
  "/api/travel/ai-search",
]) {
  test(`travel surface is gone: ${path}`, async ({ request }) => {
    const response = path.startsWith("/api/")
      ? await request.post(path, { data: {} })
      : await request.get(path);
    expect(response.status()).toBe(410);
  });
}

test("homepage no longer promotes hotels or flights", async ({ page }) => {
  await page.goto("/");
  const main = page.locator("#main-content");
  await expect(main.getByRole("heading", { name: /Halal food in Singapore — the full picture/ })).toBeVisible();
  await expect(main.getByRole("button", { name: /Find a hotel|Search flights/ })).toHaveCount(0);
});
