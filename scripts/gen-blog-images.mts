/* Humble Halal — AI blog hero generator (Phase 2 image pipeline).
   Replaces hotlinked/duplicated Unsplash blog heroes with on-brand, unique
   images: fal text-to-image → optional upscale → re-host to Supabase Storage →
   rewrite the entry's `image:` line + record a governance manifest. Mirrors the
   standalone scripts/enrich-images.mjs pattern (no server-only imports).

   Usage:
     npx tsx scripts/gen-blog-images.mts            # dry-run: list what it would do
     npx tsx scripts/gen-blog-images.mts --check     # just report Unsplash-hotlinked posts
     npx tsx scripts/gen-blog-images.mts --apply [--slug=<slug>] [--limit=N]
   Env (via .env.local / ~/.env / process.env):
     FAL_KEY (generation), NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (re-host).
   Graceful: with no keys it never generates — it only reports. Safe to re-run. */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { createClient } from "@supabase/supabase-js";
import { buildHeroPrompt } from "../lib/blog-image-prompt";
import { postSchedule } from "../lib/content-calendar";

const POSTS_DIR = fileURLToPath(new URL("../content/posts/", import.meta.url));
const MANIFEST = fileURLToPath(new URL("../content/blog-image-manifest.json", import.meta.url));
const BUCKET = "blog-photos";

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const CHECK = argv.includes("--check");
const SLUG = (argv.find((a) => a.startsWith("--slug=")) || "").split("=")[1] || "";
const LIMIT = Number((argv.find((a) => a.startsWith("--limit=")) || "").split("=")[1] || 0) || Infinity;

function loadEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}
const env: Record<string, string> = {
  ...loadEnvFile(fileURLToPath(new URL("../.env.local", import.meta.url))),
  ...loadEnvFile(`${homedir()}/.env`),
  ...(process.env as Record<string, string>),
};

const scheduleBySlug = new Map(postSchedule.map((p) => [p.slug, p]));

type Target = { slug: string; file: string; title: string; category: string; kw: string; current: string };

function collectTargets(): Target[] {
  const targets: Target[] = [];
  for (const f of readdirSync(POSTS_DIR).filter((n) => n.endsWith(".yaml"))) {
    const slug = f.replace(/\.yaml$/, "");
    if (SLUG && slug !== SLUG) continue;
    const file = POSTS_DIR + f;
    const text = readFileSync(file, "utf8");
    const img = /^image:\s*"?([^"\n]+)"?\s*$/m.exec(text)?.[1]?.trim() || "";
    const isUnsplash = /images\.unsplash\.com/.test(img);
    if (!isUnsplash) continue; // already governed (Supabase / /blog) — skip
    const sched = scheduleBySlug.get(slug);
    const title = /^title:\s*"?([^"\n]+)"?\s*$/m.exec(text)?.[1]?.trim() || sched?.title || slug;
    const category = /^category:\s*([^\n]+)$/m.exec(text)?.[1]?.trim() || sched?.category || "cuisines";
    const kw = sched?.primaryKeyword || title;
    targets.push({ slug, file, title, category, kw, current: img });
  }
  return targets.slice(0, LIMIT);
}

async function falGenerate(prompt: string): Promise<string | null> {
  const key = env.FAL_KEY;
  if (!key) return null;
  const model = env.FAL_IMAGE_MODEL || "fal-ai/flux/schnell";
  try {
    const res = await fetch(`https://fal.run/${model}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Key ${key}` },
      body: JSON.stringify({ prompt, image_size: "landscape_16_9", num_images: 1 }),
    });
    if (!res.ok) return null;
    const d = (await res.json()) as { images?: { url?: string }[]; image?: { url?: string } };
    return d.images?.[0]?.url || d.image?.url || null;
  } catch {
    return null;
  }
}

async function falUpscale(url: string): Promise<string> {
  const key = env.FAL_KEY;
  if (!key || !env.FAL_UPSCALE_MODEL) return url;
  try {
    const res = await fetch(`https://fal.run/${env.FAL_UPSCALE_MODEL}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Key ${key}` },
      body: JSON.stringify({ image_url: url }),
    });
    if (!res.ok) return url;
    const d = (await res.json()) as { image?: { url?: string }; images?: { url?: string }[] };
    return d.image?.url || d.images?.[0]?.url || url;
  } catch {
    return url;
  }
}

function readManifest(): Record<string, unknown>[] {
  return existsSync(MANIFEST) ? (JSON.parse(readFileSync(MANIFEST, "utf8")) as Record<string, unknown>[]) : [];
}

async function main() {
  const targets = collectTargets();

  if (CHECK) {
    console.log(`Unsplash-hotlinked posts (${targets.length}):`);
    for (const t of targets) console.log(`  - ${t.slug}`);
    return;
  }

  const haveKeys = !!env.FAL_KEY && !!env.NEXT_PUBLIC_SUPABASE_URL && !!env.SUPABASE_SERVICE_ROLE_KEY;

  if (!APPLY || !haveKeys) {
    console.log(`[dry-run] ${targets.length} post(s) would get a generated hero:`);
    for (const t of targets) console.log(`  - ${t.slug}  (${t.category})`);
    if (targets[0]) console.log(`\nSample prompt for "${targets[0].slug}":\n  ${buildHeroPrompt({ title: targets[0].title, category: targets[0].category, primaryKeyword: targets[0].kw })}`);
    if (!haveKeys) console.log(`\nSet FAL_KEY + NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY and pass --apply to generate.`);
    else console.log(`\nRe-run with --apply to generate + re-host.`);
    return;
  }

  const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const buckets = await sb.storage.listBuckets();
  if (!buckets.data?.some((b) => b.name === BUCKET)) await sb.storage.createBucket(BUCKET, { public: true }).catch(() => {});

  const manifest = readManifest();
  let done = 0;
  for (const t of targets) {
    const prompt = buildHeroPrompt({ title: t.title, category: t.category, primaryKeyword: t.kw });
    const gen = await falGenerate(prompt);
    if (!gen) { console.log(`  ✗ ${t.slug}: generation failed`); continue; }
    const finalUrl = await falUpscale(gen);
    const resp = await fetch(finalUrl);
    if (!resp.ok) { console.log(`  ✗ ${t.slug}: download failed`); continue; }
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < 3000) { console.log(`  ✗ ${t.slug}: image too small`); continue; }
    const ext = (finalUrl.match(/\.(jpe?g|png|webp)/i)?.[0] || ".jpg").replace(".jpeg", ".jpg").toLowerCase();
    const path = `${t.slug}${ext}`;
    const contentType = `image/${ext.slice(1).replace("jpg", "jpeg")}`;
    const up = await sb.storage.from(BUCKET).upload(path, buf, { contentType, upsert: true });
    if (up.error) { console.log(`  ✗ ${t.slug}: upload failed`); continue; }
    const publicUrl = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    // Rewrite the entry's image: line (+ ensure an imageCredit line).
    let text = readFileSync(t.file, "utf8");
    text = text.replace(/^image:.*$/m, `image: "${publicUrl}"`);
    if (/^imageCredit:/m.test(text)) text = text.replace(/^imageCredit:.*$/m, `imageCredit: "Illustration: Humble Halal"`);
    else text = text.replace(/^(imageAlt:.*)$/m, `$1\nimageCredit: "Illustration: Humble Halal"`);
    writeFileSync(t.file, text);

    manifest.push({ slug: t.slug, prompt, model: env.FAL_IMAGE_MODEL || "fal-ai/flux/schnell", source: "ai-fal", url: publicUrl, rightsConfirmed: true });
    console.log(`  ✓ ${t.slug} → ${publicUrl}`);
    done++;
  }
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nGenerated ${done}/${targets.length}. Manifest: content/blog-image-manifest.json`);
}

main();
