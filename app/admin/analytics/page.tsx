// Admin-only first-party analytics dashboard.
// Server component gates access via our existing profiles.role='admin' helper
// (isAdminOrUnconfigured) — same pattern as app/admin/page.tsx. In mock mode
// (no Supabase keys) the gate is open so the empty dashboard still renders.

import { redirect } from "next/navigation";
import { isAdminOrUnconfigured } from "@/lib/admin-auth";
import { pageMeta } from "@/lib/seo";
import Dashboard from "./Dashboard";

export const metadata = pageMeta({
  title: "Lead analytics",
  description: "Humble Halal first-party lead analytics.",
  path: "/admin/analytics",
  index: false,
});

export default async function AnalyticsPage() {
  if (!(await isAdminOrUnconfigured())) redirect("/login?next=/admin/analytics");
  return <Dashboard />;
}
