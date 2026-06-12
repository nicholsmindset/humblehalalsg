import { AdminScreen } from "@/components/screens/admin";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Admin console", description: "Humble Halal administration.", path: "/admin", index: false });

export default function Page() {
  return <AdminScreen />;
}
