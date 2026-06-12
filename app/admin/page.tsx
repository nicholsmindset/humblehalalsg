import { redirect } from "next/navigation";
import { AdminScreen } from "@/components/screens/admin";
import { requireAdmin } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/server";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Admin console", description: "Humble Halal administration.", path: "/admin", index: false });

export default async function Page() {
  // Proxy guarantees a session; this enforces the admin role server-side.
  // Demo mode (no Supabase) leaves the console reachable — its APIs no-op.
  if (supabaseConfigured) {
    const auth = await requireAdmin();
    if (!auth.ok) redirect(auth.reason === "unauthenticated" ? "/login?next=/admin" : "/");
  }
  return <AdminScreen />;
}
