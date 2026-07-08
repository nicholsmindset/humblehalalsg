import { defineConfig } from "vitest/config";
import path from "path";

// Unit/integration tests (node env). Playwright e2e (*.spec.ts) stays separate.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
