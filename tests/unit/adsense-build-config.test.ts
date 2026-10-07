import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

function check(publisher: string, environment = "production") {
  return spawnSync(process.execPath, ["scripts/check-adsense-production.mjs"], {
    encoding: "utf8",
    env: { ...process.env, VERCEL_ENV: environment, NEXT_PUBLIC_ADSENSE_CLIENT: publisher },
  });
}

describe("production AdSense release guard", () => {
  it("rejects the empty publisher exported for a secret variable", () => {
    const result = check("");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("readable public configuration");
  });

  it("rejects a valid publisher belonging to another account", () => {
    expect(check("ca-pub-1234567890123456").status).toBe(1);
  });

  it("allows the authorized publisher", () => {
    expect(check("ca-pub-7886081043408699").status).toBe(0);
  });

  it("allows ad-free preview and test builds", () => {
    expect(check("", "preview").status).toBe(0);
  });
});
