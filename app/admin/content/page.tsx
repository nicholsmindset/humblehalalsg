import { redirect } from "next/navigation";
import { isAdminOrUnconfigured } from "@/lib/admin-auth";
import { cmsEditorialPosts } from "@/lib/cms-editorial";
import { pageMeta } from "@/lib/seo";
import ContentDashboard from "./content-dashboard";

export const metadata = pageMeta({
  title: "Blog schedule",
  description: "Review Humble Halal blog publication status, dates and feature images.",
  path: "/admin/content",
  index: false,
});

export const dynamic = "force-dynamic";

export default async function ContentAdminPage() {
  if (!(await isAdminOrUnconfigured())) redirect("/login?next=/admin/content");

  const { posts, today } = await cmsEditorialPosts();
  const githubMode = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE_KIND === "github";
  const cmsBasePath = githubMode ? "/keystatic/branch/master" : "/keystatic";

  return <ContentDashboard posts={posts} today={today} cmsBasePath={cmsBasePath} />;
}
