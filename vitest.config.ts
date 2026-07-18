import { defineConfig } from "vitest/config";
import path from "path";

// Unit/integration tests (node env). Playwright e2e (*.spec.ts) stays separate.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Modules that begin with `import "server-only"` can't resolve that
      // package under vitest's node env (Next provides it via its bundler).
      // Alias it to an empty stub so server modules (promo, ratelimit,
      // turnstile, payout-reversal, …) are unit-testable.
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
