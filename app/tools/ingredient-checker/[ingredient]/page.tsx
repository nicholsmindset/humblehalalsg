import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/components/seo/json-ld";
import { IngredientDetail } from "@/components/tools/ingredient-detail";
import {
  STATUS_META, ingredientSlug, indexableIngredients, getIngredientBySlug,
} from "@/lib/tools/ingredients";

// Only curated, quality-gated ingredient slugs are prerendered; every other
// path is a hard 404 (no ISR of junk, no soft-200). Alt slugs (bare E-number /
// aliases) are 301'd to the canonical slug upstream by lib/redirects.ts.
export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return indexableIngredients().map((a) => ({ ingredient: ingredientSlug(a) }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ ingredient: string }> },
): Promise<Metadata> {
  const { ingredient } = await params;
  const a = getIngredientBySlug(ingredient);
  if (!a) {
    return pageMeta({ title: "Ingredient not found", path: "/tools/ingredient-checker", index: false });
  }
  const label = a.code ? `${a.code} (${a.name})` : a.name;
  const desc =
    a.originSummary
    || `${label} is generally classified "${STATUS_META[a.status].verdict.toLowerCase()}" at ingredient level. Learn its source, uses, label names and how to verify products.`;
  return pageMeta({
    title: `Is ${label} Halal? Uses & Sources`,
    description: desc.length > 155 ? desc.slice(0, 152) + "…" : desc,
    path: `/tools/ingredient-checker/${ingredientSlug(a)}`,
    absoluteTitle: true,
  });
}

export default async function Page({ params }: { params: Promise<{ ingredient: string }> }) {
  const { ingredient } = await params;
  const a = getIngredientBySlug(ingredient);
  if (!a) notFound();

  const faqs = (a.faqs || []).filter((f) => f.q?.trim() && f.a?.trim());

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Tools", path: "/tools" },
            { name: "Ingredient Checker", path: "/tools/ingredient-checker" },
            { name: a.code || a.name, path: `/tools/ingredient-checker/${ingredientSlug(a)}` },
          ]),
          // FAQPage only when there are ≥2 visible, on-page FAQs (Google policy).
          ...(faqs.length >= 2 ? [faqJsonLd(faqs.map((f) => ({ q: f.q, a: f.a })))] : []),
        ]}
      />
      <IngredientDetail a={a} />
    </>
  );
}
