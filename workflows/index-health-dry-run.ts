export type HealthCheckResult = {
  check: "robots" | "sitemap";
  ok: boolean;
  status: number | null;
  issue: string | null;
};

export async function checkRobots(baseUrl: string): Promise<HealthCheckResult> {
  "use step";

  const response = await fetch(new URL("/robots.txt", baseUrl), {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response.text();
  const allowsPublicCrawlers = /^User-Agent:\s*\*/im.test(body) && /^Allow:\s*\//im.test(body);
  return {
    check: "robots",
    ok: response.ok && allowsPublicCrawlers,
    status: response.status,
    issue: !response.ok
      ? `robots.txt returned ${response.status}`
      : allowsPublicCrawlers
        ? null
        : "robots.txt no longer allows public crawlers",
  };
}

export async function checkSitemap(baseUrl: string): Promise<HealthCheckResult> {
  "use step";

  const response = await fetch(new URL("/sitemap.xml", baseUrl), {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  return {
    check: "sitemap",
    ok: response.ok,
    status: response.status,
    issue: response.ok ? null : `sitemap.xml returned ${response.status}`,
  };
}

export async function indexHealthDryRunWorkflow(baseUrl: string) {
  "use workflow";

  const checks = await Promise.all([checkRobots(baseUrl), checkSitemap(baseUrl)]);
  return {
    mode: "dry-run" as const,
    ok: checks.every((check) => check.ok),
    checks,
  };
}
