import { defineConfig, devices } from "@playwright/test";

/* Smoke E2E. In CI it builds + starts the app and tests localhost; locally you
   can point at a deployed URL with E2E_BASE_URL. */
const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL, trace: "on-first-retry" },
  projects: [
    // Desktop smoke suite (everything except the mobile guard).
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec\.ts/ },
    // Mobile regression guard (e2e/mobile.spec.ts only). All chromium —
    // device presets default to webkit, but CI installs chromium only.
    {
      name: "mobile-320",
      testMatch: /mobile\.spec\.ts/,
      use: { browserName: "chromium", viewport: { width: 320, height: 693 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    },
    {
      name: "mobile-390",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["iPhone 12"], browserName: "chromium" },
    },
    {
      name: "tablet-768",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["iPad Mini"], browserName: "chromium" },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run start",
        url: "http://localhost:3000",
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        // Exercise flag-gated surfaces in e2e without changing prod defaults.
        env: { ...process.env, HAWKER_FINDER_ENABLED: "1" },
      },
});
