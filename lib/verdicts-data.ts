import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getServerFlags } from "@/lib/feature-flags";
import type { Verdict, Confidence, PageType } from "@/lib/verdicts";

/* Server-only read helpers for APPROVED halal verdicts. All guarded: when the
   flag is off or Supabase is absent, they return null/[] so the file-based
   /is-halal pages keep working unchanged. */

export interface StoredVerdict {
  slug: string;
  page_type: PageType;
  name: string;
  h1: string | null;
  verdict: Verdict;
  confidence: Confidence;
  verdict_label: string | null;
  cert_status: string | null;
  one_line_answer: string | null;
  confidence_explainer: string | null;
  date_reviewed: string | null;
  why_verdict: string[];
  ingredient_table: { name: string; status: string; note?: string }[];
  look_for: { icon: string; text: string }[];
  alternatives: string[];
  official_sources: { body: string; claim: string; url: string }[];
  scholarly_views: { view: string; position: string }[];
  internal_links: { related_checks?: string[]; cross_sell?: string[] };
  faq_answer: string | null;
}

const SELECT =
  "slug,page_type,name,h1,verdict,confidence,verdict_label,cert_status,one_line_answer,confidence_explainer,date_reviewed,why_verdict,ingredient_table,look_for,alternatives,official_sources,scholarly_views,internal_links,faq_answer";

/** The approved verdict for a slug, or null. Off-flag / no-DB → null. */
export async function getApprovedVerdict(slug: string): Promise<StoredVerdict | null> {
  if (!(await getServerFlags()).halalVerdicts) return null;
  const db = getSupabaseAdmin();
  if (!db) return null;
  try {
    const { data } = await db.from("halal_verdicts").select(SELECT).eq("slug", slug).eq("status", "approved").maybeSingle();
    return (data as StoredVerdict | null) ?? null;
  } catch {
    return null;
  }
}

/** All approved verdict slugs (for generateStaticParams). Off-flag / no-DB → []. */
export async function approvedVerdictSlugs(): Promise<string[]> {
  if (!(await getServerFlags()).halalVerdicts) return [];
  const db = getSupabaseAdmin();
  if (!db) return [];
  try {
    const { data } = await db.from("halal_verdicts").select("slug").eq("status", "approved").limit(2000);
    return (data || []).map((r) => r.slug as string);
  } catch {
    return [];
  }
}

export interface VerdictSummary {
  slug: string;
  name: string;
  verdict: Verdict;
  verdict_label: string | null;
  one_line_answer: string | null;
  date_reviewed: string | null;
}

/** Light rows for approved verdicts — feeds the sitemap (slug + lastmod) and
 * llms.txt (name + verdict line) so approved pages are actually crawlable.
 * Same guards as above: off-flag / no-DB → []. */
export async function approvedVerdictSummaries(): Promise<VerdictSummary[]> {
  if (!(await getServerFlags()).halalVerdicts) return [];
  const db = getSupabaseAdmin();
  if (!db) return [];
  try {
    const { data } = await db
      .from("halal_verdicts")
      .select("slug,name,verdict,verdict_label,one_line_answer,date_reviewed")
      .eq("status", "approved")
      .limit(2000);
    return (data as VerdictSummary[] | null) ?? [];
  } catch {
    return [];
  }
}
