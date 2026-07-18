import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { IngredientHubView } from "@/components/tools/ingredient-hub";
import { getHub, hubMembers, hubQualifies, INGREDIENT_HUBS } from "@/lib/tools/ingredient-hubs";

// Prerender every configured hub; hubs below the member threshold still render
// for users but are marked noindex and excluded from the sitemap.
export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return INGREDIENT_HUBS.map((h) => ({ category: h.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> },
): Promise<Metadata> {
  const { category } = await params;
  const hub = getHub(category);
  if (!hub) return pageMeta({ title: "Category not found", path: "/tools/ingredient-checker/categories", index: false });
  return pageMeta({
    title: hub.metaTitle,
    description: hub.metaDescription,
    path: `/tools/ingredient-checker/categories/${hub.slug}`,
    absoluteTitle: true,
    index: hubQualifies(hub), // thin hubs → noindex,follow
  });
}

export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const hub = getHub(category);
  if (!hub) notFound();
  const members = hubMembers(hub);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Tools", path: "/tools" },
            { name: "Ingredient Checker", path: "/tools/ingredient-checker" },
            { name: "Categories", path: "/tools/ingredient-checker/categories" },
            { name: hub.title, path: `/tools/ingredient-checker/categories/${hub.slug}` },
          ]),
        ]}
      />
      <IngredientHubView hub={hub} members={members} />
    </>
  );
}
