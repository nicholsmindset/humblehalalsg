import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRobots, checkSitemap } from "@/workflows/index-health-dry-run";

describe("index health workflow steps", () => {
  afterEach(() => vi.restoreAllMocks());

  it("accepts crawler-friendly robots and a reachable sitemap", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("User-Agent: *\nAllow: /", { status: 200 }))
      .mockResolvedValueOnce(new Response("<urlset />", { status: 200 }));

    await expect(checkRobots("https://example.com")).resolves.toMatchObject({
      check: "robots",
      ok: true,
      issue: null,
    });
    await expect(checkSitemap("https://example.com")).resolves.toMatchObject({
      check: "sitemap",
      ok: true,
      issue: null,
    });
  });

  it("reports a robots regression without changing production state", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("User-Agent: *\nDisallow: /", { status: 200 }),
    );

    await expect(checkRobots("https://example.com")).resolves.toEqual({
      check: "robots",
      ok: false,
      status: 200,
      issue: "robots.txt no longer allows public crawlers",
    });
  });

  it("reports a failing sitemap status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("missing", { status: 503 }));

    await expect(checkSitemap("https://example.com")).resolves.toEqual({
      check: "sitemap",
      ok: false,
      status: 503,
      issue: "sitemap.xml returned 503",
    });
  });
});
