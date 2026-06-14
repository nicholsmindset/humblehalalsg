import { defineConfig } from "vitest/config";

// Unit/integration tests (node env). Playwright e2e (*.spec.ts) stays separate.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
