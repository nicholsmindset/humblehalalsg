import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/* Regression lock for the image cleanup: the Unsplash photo IDs in
 * scripts/banned-images.mjs were banned as off-brand / haram-adjacent for a
 * halal-trust directory (glamour model, raw-meat butcher joint). They must
 * never reappear in source, seed scripts, or data files — only the shared
 * banned-images module (imported by the audit/cleanup scripts) may name them. */
import { BANNED_IMAGE_IDS } from "../../scripts/banned-images.mjs";

const ALLOWED_FILES = new Set(["scripts/banned-images.mjs", "tests/unit/no-banned-images.test.ts"]);

const ROOTS = ["app", "components", "lib", "scripts"];
const EXT = /\.(ts|tsx|js|jsx|mjs|cjs|json|md|css)$/;
const SKIP_DIRS = new Set(["node_modules", ".next", "reports"]);

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (EXT.test(name)) yield p;
  }
}

describe("banned stock images stay banned", () => {
  it("no banned Unsplash photo ID appears under app/, components/, lib/, scripts/", () => {
    const repo = join(__dirname, "..", "..");
    const hits: string[] = [];
    for (const root of ROOTS) {
      for (const file of walk(join(repo, root))) {
        const rel = file.slice(repo.length + 1);
        if (ALLOWED_FILES.has(rel)) continue;
        const text = readFileSync(file, "utf8");
        for (const id of BANNED_IMAGE_IDS) {
          if (text.includes(id)) hits.push(`${rel} → ${id}`);
        }
      }
    }
    expect(hits, `banned image IDs found:\n${hits.join("\n")}`).toEqual([]);
  });
});
