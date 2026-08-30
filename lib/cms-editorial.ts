import "server-only";

import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../keystatic.config";

const reader = createReader(process.cwd(), keystaticConfig);

export type EditorialStage = "published" | "scheduled" | "draft";

export type EditorialPost = {
  slug: string;
  title: string;
  configuredStatus: string;
  stage: EditorialStage;
  datePublished: string;
  dateModified?: string;
  category: string;
  image: string;
  imageAlt: string;
  readMins: number;
};

export function todayInSingapore(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore" }).format(date);
}

/** Resolve the editorial state the way the public blog date-gate does.
 * A scheduled post becomes live when its Singapore publish date arrives, even
 * though its stored Keystatic value intentionally remains `scheduled`. */
export function editorialStage(status: string, datePublished: string, today: string): EditorialStage {
  if (status === "published") return "published";
  if (status === "scheduled") return datePublished <= today ? "published" : "scheduled";
  return "draft";
}

export async function cmsEditorialPosts(): Promise<{ today: string; posts: EditorialPost[] }> {
  const today = todayInSingapore();
  const entries = await reader.collections.posts.all();

  const posts = entries.map(({ slug, entry }) => ({
    slug,
    title: entry.title,
    configuredStatus: entry.status,
    stage: editorialStage(entry.status, entry.datePublished, today),
    datePublished: entry.datePublished,
    dateModified: entry.dateModified?.trim() || undefined,
    category: entry.category,
    image: entry.imageUpload?.trim() || entry.image?.trim() || `/blog/${slug}/opengraph-image`,
    imageAlt: entry.imageAlt,
    readMins: entry.readMins,
  } satisfies EditorialPost));

  return { today, posts };
}
