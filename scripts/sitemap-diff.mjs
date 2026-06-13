#!/usr/bin/env node
/* Sitemap diff (A5). Fetches the live sitemap, compares against the cached copy
   from the previous run (restored as a CI artifact), and writes the added/removed
   URLs to sitemap-diff.md. New URLs = freshly indexable pages; removed = pages
   that dropped out (often a delisted/closed business worth a human glance).
   Run: node scripts/sitemap-diff.mjs [baseUrl] */
import { readFile, writeFile } from "node:fs/promises";

const base = (process.argv[2] || process.env.SITE_URL || "https://humblehalal.com").replace(/\/$/, "");
const CACHE = "sitemap-prev.txt";
const OUT = "sitemap-diff.md";

async function liveUrls() {
  const res = await fetch(`${base}/sitemap.xml`, { headers: { "user-agent": "hh-sitemap-diff" } });
  if (!res.ok) throw new Error(`sitemap HTTP ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).sort();
}

async function cached() {
  try { return (await readFile(CACHE, "utf8")).split("\n").filter(Boolean); }
  catch { return null; }
}

const now = await liveUrls();
const prev = await cached();
await writeFile(CACHE, now.join("\n") + "\n");

if (!prev) {
  await writeFile(OUT, `First run — cached ${now.length} URLs. No diff yet.\n`);
  console.log(`First run: cached ${now.length} URLs`);
  process.exit(0);
}

const prevSet = new Set(prev);
const nowSet = new Set(now);
const added = now.filter((u) => !prevSet.has(u));
const removed = prev.filter((u) => !nowSet.has(u));

let md = `# Sitemap diff — ${now.length} URLs (was ${prev.length})\n\n`;
md += added.length ? `## ➕ Added (${added.length})\n${added.map((u) => `- ${u}`).join("\n")}\n\n` : "## ➕ Added\n_none_\n\n";
md += removed.length ? `## ➖ Removed (${removed.length})\n${removed.map((u) => `- ${u}`).join("\n")}\n` : "## ➖ Removed\n_none_\n";
await writeFile(OUT, md);

console.log(`+${added.length} / -${removed.length}`);
if (added.length || removed.length) {
  // Signal "changed" to the workflow so it posts the diff.
  await writeFile(process.env.GITHUB_OUTPUT || "/dev/null", "changed=true\n", { flag: "a" }).catch(() => {});
}
