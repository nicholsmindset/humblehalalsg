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
    coverage: {
      // `npm run test:coverage` — a MEASUREMENT tool, not a CI gate (yet). Scoped
      // to lib/** (the unit-testable domain layer); app routes/components are
      // covered by Playwright e2e, and pure data/content modules carry no logic
      // to unit-test, so blanket thresholds here would be noise. Raise the floor
      // deliberately as coverage grows rather than gating on a number today.
      provider: "v8",
      reporter: ["text", "text-summary", "html"],
      include: ["lib/**/*.ts"],
      exclude: [
        "lib/**/*.d.ts",
        "lib/types.ts",
        "lib/**/*-data.ts", // static datasets (verdicts-data, travel-data, …)
        "lib/supabase/**", // thin client factories — no logic
      ],
    },
  },
});
