import { LoginScreen } from "@/components/screens/misc";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Log in or sign up", description: "Access your Humble Halal account.", path: "/login", index: false });

export default function Page() {
  return <LoginScreen />;
}
